using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;

namespace ParkingManagement.DTOs.Building;

// ─── Query filter ─────────────────────────────────────────────────────────────

public class DashboardFilterRequest
{
    // day / week / month / custom
    [FromQuery(Name = "period")]
    [JsonPropertyName("period")]
    public string Period { get; set; } = "day";

    // dùng khi period = custom
    [FromQuery(Name = "start_date")]
    [JsonPropertyName("start_date")]
    public string? StartDate { get; set; }

    [FromQuery(Name = "end_date")]
    [JsonPropertyName("end_date")]
    public string? EndDate { get; set; }
}

// ─── Main dashboard response ──────────────────────────────────────────────────

public class DashboardReportResponse
{
    [JsonPropertyName("period")]
    public string Period { get; set; } = null!;

    [JsonPropertyName("from")]
    public string From { get; set; } = null!;

    [JsonPropertyName("to")]
    public string To { get; set; } = null!;

    [JsonPropertyName("vehicle_count")]
    public VehicleCountDto VehicleCount { get; set; } = null!;

    [JsonPropertyName("revenue")]
    public RevenueDto Revenue { get; set; } = null!;

    [JsonPropertyName("occupancy")]
    public OccupancyReportDto Occupancy { get; set; } = null!;

    [JsonPropertyName("peak_hours")]
    public List<PeakHourDto> PeakHours { get; set; } = new();

    [JsonPropertyName("breakdown_by_vehicle_type")]
    public List<VehicleTypeBreakdownDto> BreakdownByVehicleType { get; set; } = new();
}

// ─── AC1: Vehicle count ───────────────────────────────────────────────────────

public class VehicleCountDto
{
    [JsonPropertyName("total_check_ins")]
    public int TotalCheckIns { get; set; }

    [JsonPropertyName("total_check_outs")]
    public int TotalCheckOuts { get; set; }

    [JsonPropertyName("currently_parked")]
    public int CurrentlyParked { get; set; }
}

// ─── AC1: Revenue ─────────────────────────────────────────────────────────────

public class RevenueDto
{
    [JsonPropertyName("total")]
    public decimal Total { get; set; }

    [JsonPropertyName("by_payment_method")]
    public Dictionary<string, decimal> ByPaymentMethod { get; set; } = new();
}

// ─── AC1: Occupancy rate ──────────────────────────────────────────────────────

public class OccupancyReportDto
{
    [JsonPropertyName("total_slots")]
    public int TotalSlots { get; set; }

    [JsonPropertyName("occupied_slots")]
    public int OccupiedSlots { get; set; }

    [JsonPropertyName("maintenance_slots")]
    public int MaintenanceSlots { get; set; }

    [JsonPropertyName("occupancy_rate_percent")]
    public double OccupancyRatePercent { get; set; }
}

// ─── Peak hours ───────────────────────────────────────────────────────────────

public class PeakHourDto
{
    [JsonPropertyName("hour")]
    public int Hour { get; set; }

    [JsonPropertyName("check_ins")]
    public int CheckIns { get; set; }
}

// ─── AC3: Breakdown by vehicle type ──────────────────────────────────────────

public class VehicleTypeBreakdownDto
{
    [JsonPropertyName("vehicle_type_id")]
    public int VehicleTypeId { get; set; }

    [JsonPropertyName("vehicle_type_name")]
    public string VehicleTypeName { get; set; } = null!;

    [JsonPropertyName("check_ins")]
    public int CheckIns { get; set; }

    [JsonPropertyName("revenue")]
    public decimal Revenue { get; set; }

    [JsonPropertyName("base_price")]
    public decimal BasePrice { get; set; }

    [JsonPropertyName("base_hours")]
    public int BaseHours { get; set; }

    [JsonPropertyName("subsequent_rate")]
    public decimal SubsequentRate { get; set; }

    [JsonPropertyName("subsequent_hours")]
    public int SubsequentHours { get; set; }

    [JsonPropertyName("daily_max_price")]
    public decimal DailyMaxPrice { get; set; }

    [JsonPropertyName("handling_fee")]
    public decimal HandlingFee { get; set; }

    [JsonPropertyName("walk_in_check_ins")]
    public int WalkInCheckIns { get; set; }

    [JsonPropertyName("walk_in_revenue")]
    public decimal WalkInRevenue { get; set; }

    [JsonPropertyName("booking_check_ins")]
    public int BookingCheckIns { get; set; }

    [JsonPropertyName("booking_revenue")]
    public decimal BookingRevenue { get; set; }
}
