using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Models;

namespace ParkingManagement.Repositories;

public interface ISlotManagementRepository
{
    Task<FloorZone?> GetZoneWithTypeAsync(int zoneId);
    Task<ParkingSlot?> GetSlotByIdAsync(string slotId);
    Task<bool> SlotIdExistsAsync(string slotId);
    Task<bool> SlotNameExistsAsync(string slotName);
    Task<int> CountSlotsInZoneAsync(int zoneId);
    Task<int> GetMaxSlotNumberAsync(int floorNumber);
    Task<ParkingSession?> GetActiveSessionBySlotAsync(string slotId);
    Task AddSlotsAsync(List<ParkingSlot> slots);
    Task UpdateSlotAsync(ParkingSlot slot);
    Task UpdateSessionAsync(ParkingSession session);
    Task DeleteSlotAsync(ParkingSlot slot);
}

public class SlotManagementRepository : ISlotManagementRepository
{
    private readonly AppDbContext _db;

    public SlotManagementRepository(AppDbContext db)
    {
        _db = db;
    }

    public Task<FloorZone?> GetZoneWithTypeAsync(int zoneId) =>
        _db.FloorZones
           .Include(z => z.VehicleType)
           .Include(z => z.ParkingSlots)
           .FirstOrDefaultAsync(z => z.ZoneId == zoneId && z.Status != "DELETED");

    public Task<ParkingSlot?> GetSlotByIdAsync(string slotId) =>
        _db.ParkingSlots
           .Include(s => s.Zone)
           .FirstOrDefaultAsync(s => s.SlotId == slotId && s.Status != "DELETED" && s.Zone.Status != "DELETED");

    public Task<bool> SlotIdExistsAsync(string slotId) =>
        _db.ParkingSlots.AnyAsync(s => s.SlotId == slotId && s.Status != "DELETED");

    public Task<bool> SlotNameExistsAsync(string slotName) =>
        _db.ParkingSlots.AnyAsync(s => s.SlotName == slotName && s.Status != "DELETED");

    public Task<int> CountSlotsInZoneAsync(int zoneId) =>
        _db.ParkingSlots.CountAsync(s => s.ZoneId == zoneId && s.Status != "DELETED");

    public async Task<int> GetMaxSlotNumberAsync(int floorNumber)
    {
        string idPrefix = $"slt_{floorNumber}";
    
        var slotIds = await _db.ParkingSlots
            .Where(s => s.SlotId.StartsWith(idPrefix) && s.Status != "DELETED")
            .Select(s => s.SlotId)
            .ToListAsync();
    
        if (!slotIds.Any()) return 0;
    
        int maxNumber = 0;
        foreach (var id in slotIds)
        {
            string numberPart = id.Substring(idPrefix.Length);
    
            if (int.TryParse(numberPart, out int parsedNum))
            {
                if (parsedNum > maxNumber) maxNumber = parsedNum;
            }
        }
    
        return maxNumber;
    }

    public Task<ParkingSession?> GetActiveSessionBySlotAsync(string slotId) =>
        _db.ParkingSessions
           .FirstOrDefaultAsync(s => s.SlotId == slotId && s.Status == "ACTIVE");

    private async Task SyncBuildingStatsAsync(string buildingId)
    {
        var building = await _db.ParkingBuildings.FirstOrDefaultAsync(b => b.BuildingId == buildingId);
        if (building == null) return;

        int activeFloors = await _db.FloorZones
            .Where(z => z.BuildingId == buildingId && z.Status != "DELETED")
            .Select(z => z.FloorNumber)
            .Distinct()
            .CountAsync();

        int totalSlots = await _db.FloorZones
            .Where(z => z.BuildingId == buildingId && z.Status != "DELETED")
            .SumAsync(z => z.Capacity);

        if (building.TotalFloors != activeFloors || building.TotalSlots != totalSlots)
        {
            building.TotalFloors = activeFloors;
            building.TotalSlots = totalSlots;
            _db.ParkingBuildings.Update(building);
            await _db.SaveChangesAsync();
        }
    }

    public async Task AddSlotsAsync(List<ParkingSlot> slots)
    {
        _db.ParkingSlots.AddRange(slots);
        await _db.SaveChangesAsync();

        var firstZoneId = slots.FirstOrDefault()?.ZoneId;
        if (firstZoneId.HasValue)
        {
            var zone = await _db.FloorZones.FirstOrDefaultAsync(z => z.ZoneId == firstZoneId.Value && z.Status != "DELETED");
            if (zone != null && !string.IsNullOrEmpty(zone.BuildingId))
            {
                await SyncBuildingStatsAsync(zone.BuildingId);
            }
        }
    }

    public async Task UpdateSlotAsync(ParkingSlot slot)
    {
        _db.ParkingSlots.Update(slot);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateSessionAsync(ParkingSession session)
    {
        _db.ParkingSessions.Update(session);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteSlotAsync(ParkingSlot slot)
    {
        slot.Status = "DELETED";
        _db.ParkingSlots.Update(slot);
        await _db.SaveChangesAsync();

        var zone = await _db.FloorZones.FirstOrDefaultAsync(z => z.ZoneId == slot.ZoneId && z.Status != "DELETED");
        if (zone != null && !string.IsNullOrEmpty(zone.BuildingId))
        {
            await SyncBuildingStatsAsync(zone.BuildingId);
        }
    }
}
