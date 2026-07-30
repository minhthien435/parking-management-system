using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Models;

namespace ParkingManagement.Repositories;

public interface IDashboardRepository
{
    Task<int> CountCheckInsAsync(DateTime from, DateTime to);
    Task<int> CountCheckOutsAsync(DateTime from, DateTime to);
    Task<int> CountCurrentlyParkedAsync();
    Task<decimal> GetTotalRevenueAsync(DateTime from, DateTime to);
    Task<Dictionary<string, decimal>> GetRevenueByPaymentMethodAsync(DateTime from, DateTime to);
    Task<int> GetTotalSlotsAsync(string buildingId);
    Task<int> GetOccupiedSlotsAsync(string buildingId);
    Task<int> GetMaintenanceSlotsAsync(string buildingId);
    Task<List<(int Hour, int Count)>> GetPeakHoursAsync(DateTime from, DateTime to);
    Task<List<VehicleType>> GetAllVehicleTypesAsync();
    Task<int> CountCheckInsByTypeAsync(int vehicleTypeId, DateTime from, DateTime to);
    Task<decimal> GetRevenueByTypeAsync(int vehicleTypeId, DateTime from, DateTime to);
    Task<PricingPolicy?> GetLatestPricingPolicyAsync(int vehicleTypeId);
    Task<int> CountWalkInCheckInsByTypeAsync(int vehicleTypeId, DateTime from, DateTime to);
    Task<int> CountBookingCheckInsByTypeAsync(int vehicleTypeId, DateTime from, DateTime to);
    Task<decimal> GetWalkInRevenueByTypeAsync(int vehicleTypeId, DateTime from, DateTime to);
    Task<decimal> GetBookingRevenueByTypeAsync(int vehicleTypeId, DateTime from, DateTime to);
}

public class DashboardRepository : IDashboardRepository
{
    private readonly AppDbContext _db;

    public DashboardRepository(AppDbContext db)
    {
        _db = db;
    }

    public Task<int> CountCheckInsAsync(DateTime from, DateTime to) =>
        _db.ParkingSessions
           .CountAsync(s => s.CheckInTime >= from && s.CheckInTime <= to);

    public Task<int> CountCheckOutsAsync(DateTime from, DateTime to) =>
        _db.ParkingSessions
           .CountAsync(s => s.CheckOutTime >= from && s.CheckOutTime <= to
                         && s.Status == "COMPLETED");

    public Task<int> CountCurrentlyParkedAsync() =>
        _db.ParkingSessions.CountAsync(s => s.Status == "ACTIVE");

    public async Task<decimal> GetTotalRevenueAsync(DateTime from, DateTime to)
    {
        var result = await _db.Payments
            .Where(p => p.PaymentTime >= from && p.PaymentTime <= to
                     && p.Status == "SUCCESS")
            .SumAsync(p => (decimal?)p.AmountPaid);
        return result ?? 0;
    }

    public async Task<Dictionary<string, decimal>> GetRevenueByPaymentMethodAsync(DateTime from, DateTime to)
    {
        var result = await _db.Payments
            .Where(p => p.PaymentTime >= from && p.PaymentTime <= to
                     && p.Status == "SUCCESS")
            .GroupBy(p => p.PaymentMethod)
            .Select(g => new { Method = g.Key, Total = g.Sum(p => p.AmountPaid) })
            .ToListAsync();

        return result.ToDictionary(x => x.Method, x => x.Total);
    }

    public async Task<int> GetTotalSlotsAsync(string buildingId)
    {
        int count = await _db.ParkingSlots
            .Include(s => s.Zone)
            .Where(s => s.Zone.BuildingId == buildingId && s.Zone.Status == "ACTIVE")
            .CountAsync();

        if (count > 0) return count;

        return await _db.FloorZones
            .Where(z => z.BuildingId == buildingId && z.Status == "ACTIVE")
            .SumAsync(z => z.Capacity);
    }

    public async Task<int> GetOccupiedSlotsAsync(string buildingId)
    {
        // Đếm trực tiếp các slot có trạng thái OCCUPIED (Đang gửi) hoặc RESERVED (Đã đặt chỗ trước)
        int slotCount = await _db.ParkingSlots
            .Include(s => s.Zone)
            .Where(s => s.Zone.BuildingId == buildingId &&
                        s.Zone.Status == "ACTIVE" &&
                        (s.Status == "OCCUPIED" || s.Status == "RESERVED" || s.Status == "BUSY"))
            .CountAsync();

        if (slotCount > 0) return slotCount;

        // Fallback: Nếu không dùng bảng ParkingSlots, đếm các lượt gửi ACTIVE + Booking CONFIRMED
        int activeSessions = await _db.ParkingSessions
            .Include(s => s.Zone)
            .Where(s => s.Zone.BuildingId == buildingId && s.Status == "ACTIVE")
            .CountAsync();

        int activeBookings = await _db.Bookings
            .Include(b => b.Zone)
            .Where(b => b.Zone.BuildingId == buildingId && (b.Status == "CONFIRMED" || b.Status == "PENDING"))
            .CountAsync();

        return activeSessions + activeBookings;
    }

    public Task<int> GetMaintenanceSlotsAsync(string buildingId) =>
        _db.ParkingSlots
           .Include(s => s.Zone)
           .CountAsync(s => s.Zone.BuildingId == buildingId && (s.Status == "MAINTENANCE" || s.Zone.Status == "MAINTENANCE"));

    public async Task<List<(int Hour, int Count)>> GetPeakHoursAsync(DateTime from, DateTime to)
    {
        var result = await _db.ParkingSessions
            .Where(s => s.CheckInTime >= from && s.CheckInTime <= to && s.CheckInTime != null)
            .GroupBy(s => s.CheckInTime!.Value.Hour)
            .Select(g => new { Hour = g.Key, Count = g.Count() })
            .OrderBy(x => x.Hour)
            .ToListAsync();

        return result.Select(x => (x.Hour, x.Count)).ToList();
    }

    public Task<List<VehicleType>> GetAllVehicleTypesAsync() =>
        _db.VehicleTypes.ToListAsync();

    public Task<int> CountCheckInsByTypeAsync(int vehicleTypeId, DateTime from, DateTime to) =>
        _db.ParkingSessions
           .CountAsync(s => s.VehicleTypeId == vehicleTypeId
                         && s.CheckInTime >= from && s.CheckInTime <= to);

    public async Task<decimal> GetRevenueByTypeAsync(int vehicleTypeId, DateTime from, DateTime to)
    {
        var result = await _db.Payments
            .Include(p => p.Session)
            .Include(p => p.Booking)
            .Where(p => p.PaymentTime >= from && p.PaymentTime <= to
                     && p.Status == "SUCCESS"
                     && (
                         (p.Session != null && p.Session.VehicleTypeId == vehicleTypeId) ||
                         (p.Session == null && p.Booking != null && p.Booking.VehicleTypeId == vehicleTypeId)
                     ))
            .SumAsync(p => (decimal?)p.AmountPaid);
        return result ?? 0;
    }

    public Task<PricingPolicy?> GetLatestPricingPolicyAsync(int vehicleTypeId) =>
        _db.PricingPolicies
           .Where(p => p.VehicleTypeId == vehicleTypeId)
           .OrderByDescending(p => p.EffectiveDate)
           .ThenByDescending(p => p.PolicyId)
           .FirstOrDefaultAsync();

    public Task<int> CountWalkInCheckInsByTypeAsync(int vehicleTypeId, DateTime from, DateTime to) =>
        _db.ParkingSessions
           .CountAsync(s => s.VehicleTypeId == vehicleTypeId
                         && s.CheckInTime >= from && s.CheckInTime <= to
                         && s.BookingId == null);

    public Task<int> CountBookingCheckInsByTypeAsync(int vehicleTypeId, DateTime from, DateTime to) =>
        _db.ParkingSessions
           .CountAsync(s => s.VehicleTypeId == vehicleTypeId
                         && s.CheckInTime >= from && s.CheckInTime <= to
                         && s.BookingId != null);

    public async Task<decimal> GetWalkInRevenueByTypeAsync(int vehicleTypeId, DateTime from, DateTime to)
    {
        var result = await _db.Payments
            .Include(p => p.Session)
            .Where(p => p.PaymentTime >= from && p.PaymentTime <= to
                     && p.Status == "SUCCESS"
                     && p.Session != null
                     && p.Session.VehicleTypeId == vehicleTypeId
                     && p.Session.BookingId == null)
            .SumAsync(p => (decimal?)p.AmountPaid);
        return result ?? 0;
    }

    public async Task<decimal> GetBookingRevenueByTypeAsync(int vehicleTypeId, DateTime from, DateTime to)
    {
        var result = await _db.Payments
            .Include(p => p.Session)
            .Include(p => p.Booking)
            .Where(p => p.PaymentTime >= from && p.PaymentTime <= to
                     && p.Status == "SUCCESS"
                     && (
                         (p.Session != null && p.Session.VehicleTypeId == vehicleTypeId && p.Session.BookingId != null) ||
                         (p.Session == null && p.Booking != null && p.Booking.VehicleTypeId == vehicleTypeId)
                     ))
            .SumAsync(p => (decimal?)p.AmountPaid);
        return result ?? 0;
    }
}
