using ParkingManagement.DTOs.Building;
using ParkingManagement.Repositories;

namespace ParkingManagement.Services.BuildingServices;

public interface IDashboardService
{
    Task<DashboardReportResponse> GetReportAsync(DashboardFilterRequest filter);
    Task<byte[]> ExportCsvAsync(DashboardFilterRequest filter);
}

public class DashboardService : IDashboardService
{
    private readonly IDashboardRepository _repo;
    private const string BuildingId = "B001";

    public DashboardService(IDashboardRepository repo)
    {
        _repo = repo;
    }

    public async Task<DashboardReportResponse> GetReportAsync(DashboardFilterRequest filter)
    {
        var (from, to) = GetDateRange(filter);

        // Vehicle count
        int checkIns = await _repo.CountCheckInsAsync(from, to);
        int checkOuts = await _repo.CountCheckOutsAsync(from, to);
        int currentParked = await _repo.CountCurrentlyParkedAsync();

        // Revenue
        decimal totalRevenue = await _repo.GetTotalRevenueAsync(from, to);
        var revenueByMethod = await _repo.GetRevenueByPaymentMethodAsync(from, to);

        // Occupancy: Công thức = (OCCUPIED + RESERVED) / (TOTAL_SLOTS - MAINTENANCE_SLOTS)
        int totalSlots = await _repo.GetTotalSlotsAsync(BuildingId);
        int occupiedSlots = await _repo.GetOccupiedSlotsAsync(BuildingId);
        int maintenanceSlots = await _repo.GetMaintenanceSlotsAsync(BuildingId);

        int usableSlots = Math.Max(totalSlots - maintenanceSlots, 1);
        int validOccupied = Math.Min(occupiedSlots, usableSlots);
        double rate = usableSlots > 0
            ? Math.Round((double)validOccupied / usableSlots * 100, 1)
            : 0;

        // Peak hours
        var peakHoursRaw = await _repo.GetPeakHoursAsync(from, to);
        var hourDict = peakHoursRaw.ToDictionary(x => x.Hour, x => x.Count);
        var peakHours = Enumerable.Range(0, 24)
            .Select(h => new PeakHourDto
            {
                Hour = h,
                CheckIns = hourDict.ContainsKey(h) ? hourDict[h] : 0
            })
            .ToList();

        // AC3: Breakdown by vehicle type
        var vehicleTypes = await _repo.GetAllVehicleTypesAsync();
        var breakdown = new List<VehicleTypeBreakdownDto>();
        foreach (var vt in vehicleTypes)
        {
            var policy = await _repo.GetLatestPricingPolicyAsync(vt.VehicleTypeId);
            var walkInIns = await _repo.CountWalkInCheckInsByTypeAsync(vt.VehicleTypeId, from, to);
            var bookingIns = await _repo.CountBookingCheckInsByTypeAsync(vt.VehicleTypeId, from, to);
            var walkInRev = await _repo.GetWalkInRevenueByTypeAsync(vt.VehicleTypeId, from, to);
            var bookingRev = await _repo.GetBookingRevenueByTypeAsync(vt.VehicleTypeId, from, to);

            breakdown.Add(new VehicleTypeBreakdownDto
            {
                VehicleTypeId = vt.VehicleTypeId,
                VehicleTypeName = vt.VehicleTypeName,
                CheckIns = walkInIns + bookingIns,
                Revenue = walkInRev + bookingRev,
                BasePrice = policy?.BasePrice ?? 0,
                BaseHours = policy?.BaseHours ?? 0,
                SubsequentRate = policy?.SubsequentRate ?? 0,
                SubsequentHours = policy?.SubsequentHours ?? 0,
                DailyMaxPrice = policy?.DailyMaxPrice ?? 0,
                HandlingFee = policy?.HandlingFee ?? 0,
                WalkInCheckIns = walkInIns,
                WalkInRevenue = walkInRev,
                BookingCheckIns = bookingIns,
                BookingRevenue = bookingRev
            });
        }

        return new DashboardReportResponse
        {
            Period = filter.Period,
            From = from.ToString("yyyy-MM-dd"),
            To = to.ToString("yyyy-MM-dd"),
            VehicleCount = new VehicleCountDto
            {
                TotalCheckIns = checkIns,
                TotalCheckOuts = checkOuts,
                CurrentlyParked = currentParked
            },
            Revenue = new RevenueDto
            {
                Total = totalRevenue,
                ByPaymentMethod = revenueByMethod
            },
            Occupancy = new OccupancyReportDto
            {
                TotalSlots = totalSlots,
                OccupiedSlots = occupiedSlots,
                MaintenanceSlots = maintenanceSlots,
                OccupancyRatePercent = rate
            },
            PeakHours = peakHours,
            BreakdownByVehicleType = breakdown
        };
    }

    // AC4: Export CSV/Excel với màu sắc và định dạng báo cáo chuyên nghiệp
    public async Task<byte[]> ExportCsvAsync(DashboardFilterRequest filter)
    {
        var report = await GetReportAsync(filter);
        var (from, to) = GetDateRange(filter);

        string periodTextVi = filter.Period.ToLower() switch
        {
            "day" => $"Hôm nay / Theo ngày ({from:dd/MM/yyyy})",
            "week" => $"7 ngày qua (Từ {from:dd/MM/yyyy} đến {to:dd/MM/yyyy})",
            "month" => $"30 ngày qua (Từ {from:dd/MM/yyyy} đến {to:dd/MM/yyyy})",
            "custom" => $"Tùy chọn (Từ {from:dd/MM/yyyy} đến {to:dd/MM/yyyy})",
            _ => $"{filter.Period} ({from:dd/MM/yyyy} - {to:dd/MM/yyyy})"
        };

        var sb = new System.Text.StringBuilder();

        // UTF-8 BOM cho Excel hiển thị tiếng Việt không bị lỗi font
        sb.Append("\uFEFF");

        sb.AppendLine("<!DOCTYPE html>");
        sb.AppendLine("<html><head><meta charset=\"utf-8\">");
        sb.AppendLine("<style>");
        sb.AppendLine("body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; background-color: #ffffff; color: #1e293b; padding: 25px; margin: 0; }");
        sb.AppendLine(".report-container { max-width: 920px; margin: 0 auto; }");
        sb.AppendLine(".report-header { background-color: #ffffff; padding: 22px 25px; border: 2px solid #cbd5e1; border-top: 6px solid #1e3a8a; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }");
        sb.AppendLine(".report-title { font-size: 24px; font-weight: 800; color: #1e3a8a; text-align: center; margin: 0 0 14px 0; text-transform: uppercase; letter-spacing: 0.8px; }");
        sb.AppendLine(".report-meta-box { display: table; width: 100%; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 12px; }");
        sb.AppendLine(".report-meta-item { display: table-cell; font-size: 12px; color: #475569; text-align: center; line-height: 1.5; }");
        sb.AppendLine(".section-title { font-size: 14px; font-weight: 800; color: #0f172a; background-color: #f1f5f9; margin: 30px 0 12px 0; padding: 10px 16px; border: 1.5px solid #cbd5e1; border-left: 6px solid #1e3a8a; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; }");
        sb.AppendLine("table { width: 100%; border-collapse: collapse; margin-bottom: 20px; background-color: #ffffff; border: 1.5px solid #cbd5e1; }");
        sb.AppendLine("th { background-color: #1e293b; color: #ffffff; font-weight: 700; text-align: left; padding: 10px 14px; font-size: 12px; border: 1px solid #0f172a; }");
        sb.AppendLine("td { padding: 9px 14px; font-size: 12px; border: 1px solid #cbd5e1; color: #334155; }");
        sb.AppendLine("tr:nth-child(even) { background-color: #f8fafc; }");
        sb.AppendLine(".badge-peak { background-color: #fef3c7; color: #78350f; font-weight: 700; padding: 3px 10px; border-radius: 4px; font-size: 11px; display: inline-block; border: 1px solid #fde68a; }");
        sb.AppendLine(".badge-normal { background-color: #f1f5f9; color: #334155; font-weight: 600; padding: 3px 10px; border-radius: 4px; font-size: 11px; display: inline-block; border: 1px solid #e2e8f0; }");
        sb.AppendLine(".text-right { text-align: right; }");
        sb.AppendLine(".text-center { text-align: center; }");
        sb.AppendLine("</style></head><body><div class=\"report-container\">");

        // Header Báo Cáo (Tiêu đề căn giữa, to in đậm)
        sb.AppendLine("<div class=\"report-header\">");
        sb.AppendLine("<div class=\"report-title\">BÁO CÁO THỐNG KÊ DOANH THU & HOẠT ĐỘNG BÃI XE</div>");
        sb.AppendLine("<div class=\"report-meta-box\">");
        sb.AppendLine($"<div class=\"report-meta-item\"><strong>Chế độ xem:</strong><br/>{periodTextVi}</div>");
        sb.AppendLine($"<div class=\"report-meta-item\"><strong>Khoảng thời gian:</strong><br/>{from:dd/MM/yyyy HH:mm} - {to:dd/MM/yyyy HH:mm}</div>");
        sb.AppendLine($"<div class=\"report-meta-item\"><strong>Ngày xuất báo cáo:</strong><br/>{DateTime.Now:dd/MM/yyyy HH:mm:ss}</div>");
        sb.AppendLine("</div>");
        sb.AppendLine("</div>");

        // Thẻ KPI Summary tinh tế, viền đậm rõ ràng
        sb.AppendLine("<table style=\"width:100%; border:none; margin-bottom:25px; border-collapse:separate; border-spacing:12px;\"><tr>");

        // Card 1: Check ins
        sb.AppendLine("<td style=\"background-color:#ffffff; color:#1e293b; padding:16px; border-radius:6px; width:33%; vertical-align:top; border:1.5px solid #cbd5e1; border-top:4px solid #2563eb;\">");
        sb.AppendLine("<div style=\"font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;\">LƯỢT XE RA / VÀO</div>");
        sb.AppendLine($"<div style=\"font-size:22px; font-weight:800; color:#0f172a; margin:6px 0;\">{report.VehicleCount.TotalCheckIns:N0} lượt vào</div>");
        sb.AppendLine($"<div style=\"font-size:12px; color:#475569;\">Đã ra: {report.VehicleCount.TotalCheckOuts:N0} | Đang đỗ: <strong>{report.VehicleCount.CurrentlyParked:N0}</strong> xe</div>");
        sb.AppendLine("</td>");

        // Card 2: Revenue
        sb.AppendLine("<td style=\"background-color:#ffffff; color:#1e293b; padding:16px; border-radius:6px; width:33%; vertical-align:top; border:1.5px solid #cbd5e1; border-top:4px solid #059669;\">");
        sb.AppendLine("<div style=\"font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;\">TỔNG DOANH THU</div>");
        sb.AppendLine($"<div style=\"font-size:22px; font-weight:800; color:#059669; margin:6px 0;\">{report.Revenue.Total:N0} VNĐ</div>");
        string payMethodsText = string.Join(" | ", report.Revenue.ByPaymentMethod.Select(p => $"{p.Key}: {p.Value:N0}đ"));
        sb.AppendLine($"<div style=\"font-size:12px; color:#475569;\">{payMethodsText}</div>");
        sb.AppendLine("</td>");

        // Card 3: Occupancy
        sb.AppendLine("<td style=\"background-color:#ffffff; color:#1e293b; padding:16px; border-radius:6px; width:33%; vertical-align:top; border:1.5px solid #cbd5e1; border-top:4px solid #4f46e5;\">");
        sb.AppendLine("<div style=\"font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;\">TỶ LỆ LẤP ĐẦY BÃI</div>");
        sb.AppendLine($"<div style=\"font-size:22px; font-weight:800; color:#0f172a; margin:6px 0;\">{report.Occupancy.OccupancyRatePercent}%</div>");
        sb.AppendLine($"<div style=\"font-size:12px; color:#475569;\">Đang đỗ: {report.Occupancy.OccupiedSlots} / {report.Occupancy.TotalSlots} chỗ</div>");
        sb.AppendLine("</td>");

        sb.AppendLine("</tr></table>");

        // Phần 1: Chi tiết theo loại phương tiện (Tiêu đề thụt lề trái, viền đậm phân biệt)
        sb.AppendLine("<div class=\"section-title\">1. Chi tiết theo loại phương tiện &amp; Giá vé</div>");
        sb.AppendLine("<table>");
        sb.AppendLine("<thead><tr>");
        sb.AppendLine("<th style=\"width:40px; text-align:center;\">STT</th>");
        sb.AppendLine("<th>Loại phương tiện</th>");
        sb.AppendLine("<th style=\"text-align:right;\">Giá mở cửa</th>");
        sb.AppendLine("<th style=\"text-align:right;\">Block tiếp</th>");
        sb.AppendLine("<th style=\"text-align:right;\">Trần ngày</th>");
        sb.AppendLine("<th style=\"text-align:right;\">Xe vãng lai</th>");
        sb.AppendLine("<th style=\"text-align:right;\">Xe đặt chỗ</th>");
        sb.AppendLine("<th style=\"text-align:right;\">Tổng lượt</th>");
        sb.AppendLine("<th style=\"text-align:right;\">Tổng doanh thu</th>");
        sb.AppendLine("<th style=\"text-align:right;\">Tỷ lệ</th>");
        sb.AppendLine("</tr></thead><tbody>");

        int stt = 1;
        foreach (var b in report.BreakdownByVehicleType)
        {
            double pct = report.Revenue.Total > 0 ? (double)(b.Revenue / report.Revenue.Total * 100) : 0;
            string baseRateStr = b.BasePrice > 0 ? $"{b.BasePrice:N0}đ / {b.BaseHours}h" : "-";
            string subRateStr = b.SubsequentRate > 0 ? $"{b.SubsequentRate:N0}đ / {b.SubsequentHours}h" : "-";
            string maxRateStr = b.DailyMaxPrice > 0 ? $"{b.DailyMaxPrice:N0}đ" : "-";

            sb.AppendLine("<tr>");
            sb.AppendLine($"<td class=\"text-center\">{stt++}</td>");
            sb.AppendLine($"<td><strong>{b.VehicleTypeName}</strong></td>");
            sb.AppendLine($"<td class=\"text-right\">{baseRateStr}</td>");
            sb.AppendLine($"<td class=\"text-right\">{subRateStr}</td>");
            sb.AppendLine($"<td class=\"text-right\">{maxRateStr}</td>");
            sb.AppendLine($"<td class=\"text-right\">{b.WalkInCheckIns:N0}</td>");
            sb.AppendLine($"<td class=\"text-right\">{b.BookingCheckIns:N0}</td>");
            sb.AppendLine($"<td class=\"text-right\"><strong>{b.CheckIns:N0}</strong></td>");
            sb.AppendLine($"<td class=\"text-right\"><strong>{b.Revenue:N0} VNĐ</strong></td>");
            sb.AppendLine($"<td class=\"text-right\">{pct:F1}%</td>");
            sb.AppendLine("</tr>");
        }
        sb.AppendLine("</tbody></table>");

        // Phần 2: Thống kê 24 khung giờ (Tiêu đề thụt lề trái, viền đậm phân biệt)
        sb.AppendLine("<div class=\"section-title\">2. Thống kê lượt xe theo khung giờ (00:00 - 23:00)</div>");
        sb.AppendLine("<table>");
        sb.AppendLine("<thead><tr>");
        sb.AppendLine("<th style=\"width:150px; text-align:center;\">Khung giờ</th>");
        sb.AppendLine("<th style=\"text-align:right;\">Số lượt xe vào</th>");
        sb.AppendLine("<th style=\"width:140px; text-align:center;\">Đánh giá mật độ</th>");
        sb.AppendLine("</tr></thead><tbody>");

        int maxCheckIns = report.PeakHours.Any() ? report.PeakHours.Max(x => x.CheckIns) : 0;

        foreach (var p in report.PeakHours.OrderBy(x => x.Hour))
        {
            bool isPeak = maxCheckIns > 0 && p.CheckIns >= maxCheckIns * 0.7 && p.CheckIns > 0;
            string statusBadge = isPeak 
                ? "<span class=\"badge-peak\">Cao điểm</span>" 
                : (p.CheckIns > 0 ? "<span class=\"badge-normal\">Bình thường</span>" : "<span style=\"color:#94a3b8;\">---</span>");

            string rowBg = isPeak ? "style=\"background-color:#fffbeb;\"" : "";

            sb.AppendLine($"<tr {rowBg}>");
            sb.AppendLine($"<td class=\"text-center\"><strong>{p.Hour:D2}:00 - {p.Hour:D2}:59</strong></td>");
            sb.AppendLine($"<td class=\"text-right\"><strong>{p.CheckIns:N0}</strong> lượt</td>");
            sb.AppendLine($"<td class=\"text-center\">{statusBadge}</td>");
            sb.AppendLine("</tr>");
        }
        sb.AppendLine("</tbody></table>");

        sb.AppendLine("</div></body></html>");

        return System.Text.Encoding.UTF8.GetBytes(sb.ToString());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static (DateTime from, DateTime to) GetDateRange(DashboardFilterRequest filter)
    {
        var today = DateTime.Today;

        return filter.Period.ToLower() switch
        {
            "day" => string.IsNullOrEmpty(filter.StartDate) 
                ? (today, today.AddDays(1).AddSeconds(-1)) 
                : ParseSingleDay(filter.StartDate),
            "week" => (today.AddDays(-6), today.AddDays(1).AddSeconds(-1)),
            "month" => (today.AddDays(-29), today.AddDays(1).AddSeconds(-1)),
            "custom" => ParseCustomRange(filter),
            _ => (today, today.AddDays(1).AddSeconds(-1))
        };
    }

    private static (DateTime from, DateTime to) ParseSingleDay(string dateStr)
    {
        if (!DateTime.TryParse(dateStr, out var date))
            throw new ArgumentException("Invalid date format (YYYY-MM-DD)");
        return (date.Date, date.Date.AddDays(1).AddSeconds(-1));
    }

    private static (DateTime from, DateTime to) ParseCustomRange(DashboardFilterRequest filter)
    {
        if (!DateTime.TryParse(filter.StartDate, out var from))
            throw new ArgumentException("Invalid start_date format (YYYY-MM-DD)");
        if (!DateTime.TryParse(filter.EndDate, out var to))
            throw new ArgumentException("Invalid end_date format (YYYY-MM-DD)");
        if (from > to)
            throw new ArgumentException("start_date must be before end_date");

        return (from, to.AddDays(1).AddSeconds(-1));
    }
}
