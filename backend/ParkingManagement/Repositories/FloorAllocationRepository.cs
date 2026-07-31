using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;
using ParkingManagement.Models;

namespace ParkingManagement.Repositories;

public interface IFloorAllocationRepository
{
    Task<List<FloorZone>> GetAllByBuildingAsync(string buildingId);
    Task<FloorZone?> GetByIdAsync(int zoneId);
    Task<VehicleType?> GetVehicleTypeAsync(int vehicleTypeId);
    Task<int> CountActiveVehiclesAsync(int zoneId);
    Task<bool> HasActiveBookingsAsync(int zoneId);
    Task UpdateAsync(FloorZone zone);
    Task<FloorZone> CreateAsync(FloorZone zone);
    Task<bool> FloorNumberExistsAsync(string buildingId, int floorNumber, string zoneName);
    Task<FloorZone?> GetConflictingZoneAsync(string buildingId, string zoneName, int? excludeZoneId = null);
    Task DeleteZoneAsync(FloorZone zoneId);
    Task SyncZoneSlotsAsync(int zoneId, int targetCapacity);
}

public class FloorAllocationRepository : IFloorAllocationRepository
{
    private readonly AppDbContext _db;

    public FloorAllocationRepository(AppDbContext db)
    {
        _db = db;
    }

    public Task<List<FloorZone>> GetAllByBuildingAsync(string buildingId) =>
        _db.FloorZones
           .Include(z => z.VehicleType)
           .Where(z => z.BuildingId == buildingId && z.Status != "DELETED")
           .OrderBy(z => z.FloorNumber)
           .ThenBy(z => z.ZoneName)
           .ToListAsync();

    public Task<FloorZone?> GetByIdAsync(int zoneId) =>
        _db.FloorZones
           .Include(z => z.VehicleType)
           .FirstOrDefaultAsync(z => z.ZoneId == zoneId && z.Status != "DELETED");

    public Task<VehicleType?> GetVehicleTypeAsync(int vehicleTypeId) =>
        _db.VehicleTypes.FirstOrDefaultAsync(v => v.VehicleTypeId == vehicleTypeId);

    public Task<int> CountActiveVehiclesAsync(int zoneId) =>
        _db.ParkingSessions
           .CountAsync(s => (s.ZoneId == zoneId || (s.Slot != null && s.Slot.ZoneId == zoneId)) &&
                            s.Status == "ACTIVE");

    public Task<bool> HasActiveBookingsAsync(int zoneId) =>
        _db.Bookings
           .AnyAsync(b => b.ZoneId == zoneId &&
                            (b.Status == "CONFIRMED" || b.Status == "PENDING"));

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

    public async Task UpdateAsync(FloorZone zone)
    {
        _db.FloorZones.Update(zone);
        await _db.SaveChangesAsync();
        if (!string.IsNullOrEmpty(zone.BuildingId))
        {
            await SyncBuildingStatsAsync(zone.BuildingId);
        }
    }

    public async Task<FloorZone> CreateAsync(FloorZone zone)
    {
        _db.FloorZones.Add(zone);
        await _db.SaveChangesAsync();
        if (!string.IsNullOrEmpty(zone.BuildingId))
        {
            await SyncBuildingStatsAsync(zone.BuildingId);
        }
        return zone;
    }

    public static string ExtractBaseZoneName(string? zoneName)
    {
        if (string.IsNullOrWhiteSpace(zoneName)) return string.Empty;
        var name = zoneName.Trim();
        int dashIndex = name.IndexOf(" - ", StringComparison.Ordinal);
        if (dashIndex > 0)
        {
            name = name.Substring(0, dashIndex).Trim();
        }
        string core = name.Replace("Zone", "", StringComparison.OrdinalIgnoreCase).Trim();
        return string.IsNullOrEmpty(core) ? name.ToUpper() : $"ZONE {core.ToUpper()}";
    }

    public async Task<FloorZone?> GetConflictingZoneAsync(string buildingId, string zoneName, int? excludeZoneId = null)
    {
        string targetBase = ExtractBaseZoneName(zoneName);
        if (string.IsNullOrEmpty(targetBase)) return null;

        var buildingZones = await _db.FloorZones
            .Include(z => z.VehicleType)
            .Where(z => z.BuildingId == buildingId && z.Status != "DELETED")
            .ToListAsync();

        return buildingZones.FirstOrDefault(z =>
            (!excludeZoneId.HasValue || z.ZoneId != excludeZoneId.Value) &&
            ExtractBaseZoneName(z.ZoneName) == targetBase);
    }

    public async Task<bool> FloorNumberExistsAsync(string buildingId, int floorNumber, string zoneName)
    {
        var conflict = await GetConflictingZoneAsync(buildingId, zoneName);
        return conflict != null;
    }

    public async Task DeleteZoneAsync(FloorZone zoneId)
    {
        string? buildingId = zoneId.BuildingId;

        // Ensure database ENUM columns allow 'DELETED'
        try
        {
            await _db.Database.ExecuteSqlRawAsync("ALTER TABLE floor_zones MODIFY COLUMN STATUS enum('ACTIVE','MAINTENANCE','DELETED') DEFAULT 'ACTIVE';");
            await _db.Database.ExecuteSqlRawAsync("ALTER TABLE parking_slot MODIFY COLUMN STATUS enum('AVAILABLE','OCCUPIED','RESERVED','MAINTENANCE','DELETED') DEFAULT 'AVAILABLE';");
        }
        catch
        {
            // Ignore if already altered
        }

        // Soft delete the zone so historic parking sessions and bookings retain their Zone reference & name
        zoneId.Status = "DELETED";
        zoneId.AvailableCapacity = 0;
        _db.FloorZones.Update(zoneId);

        // Soft delete slots instead of purging them from DB to prevent foreign key errors with historic parking sessions
        var slots = await _db.ParkingSlots.Where(s => s.ZoneId == zoneId.ZoneId).ToListAsync();
        foreach (var slot in slots)
        {
            slot.Status = "DELETED";
        }
        _db.ParkingSlots.UpdateRange(slots);

        await _db.SaveChangesAsync();

        if (!string.IsNullOrEmpty(buildingId))
        {
            await SyncBuildingStatsAsync(buildingId);
        }
    }

    public async Task SyncZoneSlotsAsync(int zoneId, int targetCapacity)
    {
        var zone = await _db.FloorZones
            .Include(z => z.ParkingSlots)
            .Include(z => z.VehicleType)
            .FirstOrDefaultAsync(z => z.ZoneId == zoneId);
    
        if (zone == null) return;
    
        int currentSlotsCount = zone.ParkingSlots.Count;
        if (targetCapacity == currentSlotsCount) return;
    
        if (targetCapacity > currentSlotsCount)
        {
            var newSlots = new List<ParkingSlot>();
            int countToCreate = targetCapacity - currentSlotsCount;
    
            string idPrefix = $"slt_{zone.FloorNumber}";
            int maxSlotNumber = 0;
    
            var allFloorSlotIds = await _db.ParkingSlots
                .Where(s => s.SlotId.StartsWith(idPrefix))
                .Select(s => s.SlotId)
                .ToListAsync();

            foreach (var baseId in allFloorSlotIds)
            {
                if (string.IsNullOrEmpty(baseId)) continue;
    
                string parsedBaseId = baseId;
    
                // Nếu id có hậu tố "_x" do lần tạo trước bị trùng (vd: slt_101_1),
                // chỉ cắt bỏ phần hậu tố ĐÓ, không cắt từ dấu "_" đầu tiên của prefix.
                int underscoreAfterPrefix = parsedBaseId.IndexOf('_', idPrefix.Length);
                if (underscoreAfterPrefix > 0)
                {
                    parsedBaseId = parsedBaseId.Substring(0, underscoreAfterPrefix);
                }
    
                if (parsedBaseId.StartsWith(idPrefix))
                {
                    string numberPart = parsedBaseId.Substring(idPrefix.Length);
                    if (int.TryParse(numberPart, out int num))
                    {
                        if (num > maxSlotNumber) maxSlotNumber = num;
                    }
                }
            }
    
            string zoneLetter = "Z";
            if (!string.IsNullOrEmpty(zone.ZoneName))
            {
                string cleanZoneName = zone.ZoneName.Replace("Zone", "", StringComparison.OrdinalIgnoreCase).Trim();
                if (!string.IsNullOrEmpty(cleanZoneName))
                {
                    zoneLetter = cleanZoneName.Substring(0, 1).ToUpper();
                }
                else
                {
                    zoneLetter = zone.ZoneName.Substring(0, 1).ToUpper();
                }
            }
    
            for (int i = 1; i <= countToCreate; i++)
            {
                int slotNumber = maxSlotNumber + i;
                string slotId = $"slt_{zone.FloorNumber}{slotNumber:D2}";
                string slotName = $"{zoneLetter}{zone.FloorNumber}{slotNumber:D2}";
    
                int suffix = 0;
                string candidateId = slotId;
                string candidateName = slotName;
                while (await _db.ParkingSlots.AnyAsync(s => s.SlotId == candidateId || s.SlotName == candidateName))
                {
                    suffix++;
                    candidateId = $"{slotId}_{suffix}";
                    candidateName = $"{slotName}_{suffix}";
                }
                slotId = candidateId;
                slotName = candidateName;
    
                var slot = new ParkingSlot
                {
                    SlotId = slotId,
                    SlotName = slotName,
                    Status = "AVAILABLE",
                    IsHandicap = false,
                    IsElectricCharging = false,
                    ZoneId = zoneId,
                    LastUpdated = DateTime.UtcNow
                };
                newSlots.Add(slot);
            }
            _db.ParkingSlots.AddRange(newSlots);
        }
        else
        {
            int countToDelete = currentSlotsCount - targetCapacity;
            var availableSlots = zone.ParkingSlots
                .Where(s => s.Status == "AVAILABLE")
                .OrderByDescending(s => s.SlotId)
                .Take(countToDelete)
                .ToList();
    
            if (availableSlots.Count < countToDelete)
            {
                throw new InvalidOperationException($"Cannot reduce capacity: not enough AVAILABLE slots to delete. Need to delete {countToDelete} slot(s), but only found {availableSlots.Count} AVAILABLE slot(s).");
            }
    
            _db.ParkingSlots.RemoveRange(availableSlots);
        }
    
        await _db.SaveChangesAsync();
    }
}
