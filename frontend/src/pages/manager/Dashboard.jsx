import React, { useState, useEffect, useRef } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  ParkingCircle,
  DollarSign,
  Calendar,
  Download,
  CreditCard,
  Wallet,
  Car,
  Bike,
  Sparkles,
  Clock,
  AlertCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  LogIn,
  LogOut,
} from "lucide-react";
import api from "../../utils/api";
import { useLanguage } from "../../hooks/useLanguage";
import { toast } from "sonner";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Format VND currency */
const formatCurrency = (val) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    val || 0
  );

/**
 * Normalize raw peak_hours array (sparse, only hours with activity) into a
 * full 24-point dataset so the line chart never has unexplained gaps.
 */
function normalize24h(peakHours = []) {
  const map = {};
  peakHours.forEach((p) => {
    map[p.hour] = p;
  });
  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    check_ins: map[h]?.check_ins ?? 0,
    revenue: map[h]?.revenue ?? 0,
  }));
}

// ─── SVG Area Line Chart ─────────────────────────────────────────────────────

function LineAreaChart({
  title,
  subtitle,
  dataPoints,
  getValue,
  valueFormatter,
  strokeColor,
  gradientId,
  gradientStart,
  icon,
  warning,
  language,
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const W = 600;
  const H = 170;
  const PX = 48;
  const PY = 18;
  const cW = W - PX * 2;
  const cH = H - PY * 2;

  const maxVal = Math.max(...dataPoints.map(getValue), 1);

  const points = dataPoints.map((p, idx) => ({
    ...p,
    x: PX + (idx / (dataPoints.length - 1)) * cW,
    y: PY + cH - (getValue(p) / maxVal) * cH,
    rawValue: getValue(p),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${H - PY} L ${points[0].x} ${H - PY} Z`
    : "";

  const peakPoint = points.reduce(
    (best, p) => (p.rawValue > best.rawValue ? p : best),
    points[0] || { rawValue: 0 }
  );

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const xSvg = xRatio * W;
    const closest = points.reduce((prev, curr) =>
      Math.abs(curr.x - xSvg) < Math.abs(prev.x - xSvg) ? curr : prev
    );
    setHoveredPoint(closest);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-3 h-auto">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-[11px] font-black text-slate-700 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            {icon}
            {title}
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>



      <div
        className="relative w-full select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPoint(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradientStart} stopOpacity="0.3" />
              <stop offset="100%" stopColor={gradientStart} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((t) => (
            <line
              key={t}
              x1={PX}
              y1={PY + t * cH}
              x2={W - PX}
              y2={PY + t * cH}
              stroke={t === 1 ? "#cbd5e1" : "#f1f5f9"}
              className={t === 1 ? "dark:stroke-slate-700" : "dark:stroke-slate-800/40"}
              strokeDasharray={t === 1 ? undefined : "3 3"}
              strokeWidth={t === 1 ? 1 : 0.8}
            />
          ))}

          {/* Area fill */}
          {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}

          {/* Stroke */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Peak indicator */}
          {peakPoint && peakPoint.rawValue > 0 && (
            <>
              <line
                x1={peakPoint.x}
                y1={PY}
                x2={peakPoint.x}
                y2={H - PY}
                stroke={strokeColor}
                strokeDasharray="3 3"
                strokeWidth="1.2"
                opacity="0.5"
              />
              <circle cx={peakPoint.x} cy={peakPoint.y} r="5" fill={strokeColor} stroke="#fff" strokeWidth="2" />
            </>
          )}

          {/* Hover crosshair */}
          {hoveredPoint && hoveredPoint.rawValue > 0 && (
            <>
              <line
                x1={hoveredPoint.x}
                y1={PY}
                x2={hoveredPoint.x}
                y2={H - PY}
                stroke={strokeColor}
                strokeDasharray="3 3"
                strokeWidth="1.5"
                opacity="0.7"
              />
              <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="5" fill={strokeColor} stroke="#fff" strokeWidth="2" />
            </>
          )}

          {/* X-axis hour labels — every 4 hours */}
          {points
            .filter((_, i) => i % 4 === 0 || i === points.length - 1)
            .map((p) => (
              <text
                key={p.hour}
                x={p.x}
                y={H - 3}
                textAnchor="middle"
                fontSize="9"
                fill={
                  peakPoint && p.hour === peakPoint.hour
                    ? strokeColor
                    : "#94a3b8"
                }
                fontWeight={peakPoint && p.hour === peakPoint.hour ? "700" : "500"}
              >
                {String(p.hour).padStart(2, "0")}h
              </text>
            ))}

          {/* Y-axis labels */}
          <text x={PX - 6} y={PY + 4} textAnchor="end" fontSize="9" fill="#94a3b8">
            {valueFormatter(maxVal)}
          </text>
          <text x={PX - 6} y={H - PY + 2} textAnchor="end" fontSize="9" fill="#94a3b8">
            0
          </text>
        </svg>

        {/* Tooltip */}
        {hoveredPoint && (
          <div
            style={{
              left: `${(hoveredPoint.x / W) * 100}%`,
              top: `${(hoveredPoint.y / H) * 100}%`,
            }}
            className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-full -mt-3 bg-slate-900/95 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-800 shadow-lg flex flex-col items-center gap-0.5"
          >
            <span className="text-slate-400 text-[8px] font-extrabold uppercase tracking-wide">
              {String(hoveredPoint.hour).padStart(2, "0")}:00
            </span>
            <span>{valueFormatter(hoveredPoint.rawValue)}</span>
          </div>
        )}
      </div>

      {/* Summary stats row */}
      {peakPoint && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-4 gap-2">
          {[
            {
              label: language === "en" ? "Busiest hour" : "Giờ cao điểm",
              value: `${String(peakPoint.hour).padStart(2, "0")}:00`,
            },
            {
              label: language === "en" ? "Peak value" : "Cao nhất",
              value: valueFormatter(peakPoint.rawValue),
            },
            {
              label: language === "en" ? "Active hours" : "Có hoạt động",
              value: dataPoints.filter((p) => getValue(p) > 0).length,
            },
            {
              label: language === "en" ? "Hourly average" : "Trung bình / giờ",
              value: valueFormatter(
                Math.round(
                  dataPoints.reduce((s, p) => s + getValue(p), 0) /
                  Math.max(dataPoints.filter((p) => getValue(p) > 0).length, 1)
                )
              ),
            },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-[13px] font-black text-slate-800 dark:text-white leading-tight">
                {item.value}
              </div>
              <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────

function DonutChart({ slices }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const total = slices.reduce((s, sl) => s + sl.value, 0) || 1;

  let offset = 0;
  const segments = slices.map((sl) => {
    const pct = sl.value / total;
    const dash = pct * circ;
    const seg = { ...sl, dash, gap: circ - dash, offset };
    offset += dash;
    return seg;
  });

  const largest = segments.reduce((a, b) => (a.value > b.value ? a : b), segments[0]);

  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28 mx-auto">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" className="dark:stroke-slate-800" strokeWidth="15" />
      {segments.map((seg) => (
        <circle
          key={seg.label}
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth="15"
          strokeDasharray={`${seg.dash} ${seg.gap}`}
          strokeDashoffset={-seg.offset}
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
        />
      ))}
      {largest && (
        <>
          <text x="50" y="47" textAnchor="middle" fontSize="12" fontWeight="700" fill="currentColor" className="fill-slate-800 dark:fill-white">
            {Math.round((largest.value / total) * 100)}%
          </text>
          <text x="50" y="58" textAnchor="middle" fontSize="8" fill="#94a3b8">
            {largest.label}
          </text>
        </>
      )}
    </svg>
  );
}

// ─── Occupancy Donut Chart (3 Slices: Occupied, Available, Maintenance) ──────

function OccupancyDonutChart({ occupied, available, maintenance, totalSlots }) {
  const { language } = useLanguage();
  const r = 38;
  const circ = 2 * Math.PI * r;
  const total = totalSlots || 1;

  const slices = [
    { label: "Occupied", value: occupied, color: "#3b82f6" }, // Blue
    { label: "Available", value: available, color: "#10b981" }, // Emerald
    { label: "Maintenance", value: maintenance, color: "#f59e0b" }, // Amber
  ];

  let offset = 0;
  const segments = slices.map((sl) => {
    const pct = sl.value / total;
    const dash = pct * circ;
    const seg = { ...sl, dash, gap: circ - dash, offset };
    offset += dash;
    return seg;
  });

  const activeSlots = Math.max(totalSlots - maintenance, 1);
  const ratePct = Math.min(Math.round((occupied / activeSlots) * 100), 100);

  return (
    <div className="relative w-44 h-44 sm:w-48 sm:h-48 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" className="dark:stroke-slate-800" strokeWidth="10" />
        {segments.map((seg) => (
          <circle
            key={seg.label}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="10"
            strokeDasharray={`${seg.dash} ${seg.gap}`}
            strokeDashoffset={-seg.offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "all 0.5s ease" }}
          />
        ))}
        <text x="50" y="46" textAnchor="middle" fontSize="16" fontWeight="900" className="fill-slate-800 dark:fill-white">
          {ratePct}%
        </text>
        <text x="50" y="58" textAnchor="middle" fontSize="7" fontWeight="700" fill="#94a3b8">
          {language === "en" ? "OCCUPIED" : "LẤP ĐẦY"}
        </text>
      </svg>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function ManagerDashboard() {
  const { language } = useLanguage();

  const periods = [
    { key: "day", labelEn: "By day", labelVi: "Theo ngày" },
    { key: "week", labelEn: "Last 7 days", labelVi: "7 ngày qua" },
    { key: "month", labelEn: "Last 30 days", labelVi: "30 ngày qua" },
    { key: "custom", labelEn: "Custom range", labelVi: "Tùy chọn" },
  ];

  const [period, setPeriod] = useState("day");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [data, setData] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = { period };
      if (period === "day") {
        params.start_date = startDate;
      } else if (period === "custom") {
        if (!startDate || !endDate) {
          toast.error(
            language === "en"
              ? "Please select both start and end dates."
              : "Vui lòng chọn ngày bắt đầu và kết thúc."
          );
          return;
        }
        params.start_date = startDate;
        params.end_date = endDate;
      }
      const response = await api.get("/admin/dashboard", { params });
      if (response.data?.success) {
        setData(response.data.data);
      } else {
        toast.error(
          language === "en"
            ? "Failed to fetch dashboard data."
            : "Không thể tải dữ liệu dashboard."
        );
      }
    } catch (err) {
      console.error("[ManagerDashboard] API error:", err);
      toast.error(
        language === "en"
          ? "Could not connect to backend."
          : "Không kết nối được backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  // ── Export ─────────────────────────────────────────────────────────────────

  const handleExportCsv = async () => {
    try {
      setExportLoading(true);
      const params = { period };
      if (period === "day") {
        params.start_date = startDate;
      } else if (period === "custom") {
        params.start_date = startDate;
        params.end_date = endDate;
      }
      const response = await api.get("/admin/dashboard/export", {
        params,
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/vnd.ms-excel;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `BaoCao_Dashboard_${period}_${dateStr}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[Export]", err);
      toast.error(
        language === "en"
          ? "Export failed. Please try again."
          : "Xuất báo cáo thất bại. Vui lòng thử lại."
      );
    } finally {
      setExportLoading(false);
    }
  };

  // ── Derived values ─────────────────────────────────────────────────────────

  const normalizedHours = normalize24h(data?.peak_hours);

  const avgRevenuePerCheckIn =
    data?.vehicle_count?.total_check_ins > 0
      ? Number(data.revenue.total) / data.vehicle_count.total_check_ins
      : 0;

  const peakHour = normalizedHours.reduce(
    (best, p) => (p.check_ins > best.check_ins ? p : best),
    normalizedHours[0] || { hour: 0, check_ins: 0 }
  );

  const paymentMethods = data?.revenue?.by_payment_method
    ? Object.entries(data.revenue.by_payment_method)
    : [];

  const occupancyColor =
    data?.occupancy?.occupancy_rate_percent >= 90
      ? "text-rose-500"
      : data?.occupancy?.occupancy_rate_percent >= 60
        ? "text-amber-500"
        : "text-emerald-500";

  const occupancyTag =
    data?.occupancy?.occupancy_rate_percent >= 90
      ? { label: language === "en" ? "Critical" : "Gần đầy", cls: "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/40" }
      : data?.occupancy?.occupancy_rate_percent >= 60
        ? { label: language === "en" ? "Moderate" : "Trung bình", cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/40" }
        : { label: language === "en" ? "Normal" : "Bình thường", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40" };

  const donutSlices = [
    { label: "VNPAY", value: data?.revenue?.by_payment_method?.VNPAY ?? 0, color: "#2563eb" },
    { label: "PAYOS", value: data?.revenue?.by_payment_method?.PAYOS ?? 0, color: "#ef4444" },
    { label: "CASH", value: data?.revenue?.by_payment_method?.CASH ?? 0, color: "#f59e0b" },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 animate-slide-in font-sans pb-10">




      {/* ── FILTER BAR ── */}
      <div className="bg-white dark:bg-slate-900 p-3 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-full md:w-auto">
          {periods.map((item) => (
            <button
              key={item.key}
              onClick={() => setPeriod(item.key)}
              className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition ${period === item.key
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-xs font-black"
                : "text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
                }`}
            >
              {language === "en" ? item.labelEn : item.labelVi}
            </button>
          ))}
        </div>

        {(period === "day" || period === "custom") && (
          <form
            onSubmit={(e) => { e.preventDefault(); fetchDashboardData(); }}
            className="flex flex-wrap items-end gap-3 w-full md:w-auto"
          >
            {period === "day" ? (
              <div className="space-y-1">
                <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest">
                  {language === "en" ? "Select date" : "Chọn ngày"}
                </span>
                <div className="relative">
                  <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            ) : (
              [
                { label: language === "en" ? "Start date" : "Ngày bắt đầu", value: startDate, set: setStartDate },
                { label: language === "en" ? "End date" : "Ngày kết thúc", value: endDate, set: setEndDate },
              ].map(({ label, value, set }) => (
                <div key={label} className="space-y-1">
                  <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest">
                    {label}
                  </span>
                  <div className="relative">
                    <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      className="pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              ))
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-955/20 text-blue-600 dark:text-blue-400 text-xs font-bold px-4 py-2 h-[34px] rounded-xl border border-blue-100 dark:border-blue-900/60 transition"
            >
              {language === "en" ? "Apply" : "Áp dụng"}
            </button>
          </form>
        )}
      </div>

      {/* ── LOADING STATE ── */}
      {loading && !data && (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <p className="text-xs text-slate-400">
            {language === "en" ? "Loading analytics..." : "Đang tải dữ liệu..."}
          </p>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      {data && (
        <>
          {/* ── KPI CARDS: 4 hero metrics ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Lượt xe vào */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center gap-1.5">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">
                {language === "en" ? "Check-ins Today" : "Lượt xe vào"}
              </span>
              <span className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 my-0.5">
                {data.vehicle_count.total_check_ins}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {language === "en" ? "Total entries today" : "Tổng lượt vào hôm nay"}
              </span>
            </div>

            {/* 2. Lượt xe ra */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center gap-1.5">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">
                {language === "en" ? "Check-outs Today" : "Lượt xe ra"}
              </span>
              <span className="text-3xl sm:text-4xl font-black text-rose-600 dark:text-rose-400 my-0.5">
                {data.vehicle_count.total_check_outs}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {language === "en" ? "Total exits today" : "Tổng lượt ra hôm nay"}
              </span>
            </div>

            {/* 3. Revenue */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center gap-1.5">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">
                {language === "en" ? "Total revenue" : "Tổng doanh thu"}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 my-0.5 tabular-nums">
                {formatCurrency(data.revenue.total)}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {language === "en" ? "Total revenue accumulated" : "Doanh thu tích lũy"}
              </span>
            </div>

            {/* 4. Peak hour */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center gap-1.5">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">
                {language === "en" ? "Peak hour" : "Giờ cao điểm"}
              </span>
              <span className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400 my-0.5">
                {String(peakHour.hour).padStart(2, "0")}:00
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {peakHour.check_ins}{" "}
                {language === "en" ? "entries · peak slot" : "lượt vào · đỉnh cao nhất"}
              </span>
            </div>
          </div>

          {/* ── MAIN 2-COLUMN GRID (Left: 3 cards, Right: 2 cards) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">

            {/* ── LEFT COLUMN (lg:col-span-3 - 3 CARDS) ── */}
            <div className="lg:col-span-3 space-y-5">
              {/* Card 1 Left (TOP): Occupancy & Slot Status Card (Matching User Mockup) */}
              {(() => {
                const maintenance = data.occupancy.maintenance_slots || 0;
                const totalSlots = data.occupancy.total_slots || 1;
                const usableSlots = Math.max(totalSlots - maintenance, 1);
                const occupied = Math.min(data.occupancy.occupied_slots, usableSlots);
                const available = Math.max(totalSlots - maintenance - occupied, 0);



                return (
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    {/* Header at Top Left (Identical to other cards) */}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-[12px] font-black text-slate-700 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                          <ParkingCircle size={14} className="text-blue-500" />
                          {language === "en" ? "Occupancy Rate" : "Mật độ lấp đầy"}
                        </h3>

                      </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-1">
                      {/* Left: Large Donut Chart */}
                      <div className="shrink-0 flex items-center justify-center">
                        <OccupancyDonutChart
                          occupied={occupied}
                          available={available}
                          maintenance={maintenance}
                          totalSlots={totalSlots}
                        />
                      </div>

                      {/* Right: Detailed Info & Matching Color Stats */}
                      <div className="flex-1 w-full space-y-3.5">
                        {/* Info Rows */}
                        <div className="space-y-2 text-xs">
                          {/* Row 1: Status */}
                          <div className="flex items-center gap-4">
                            <span className="text-slate-500 dark:text-slate-400 font-bold min-w-[110px]">
                              {language === "en" ? "Status:" : "Trạng thái:"}
                            </span>
                            <span className={`text-[11px] font-extrabold px-3 py-0.5 rounded-full border ${occupancyTag.cls}`}>
                              {occupancyTag.label}
                            </span>
                          </div>

                          {/* Row 2: Capacity */}
                          <div className="flex items-center gap-4">
                            <span className="text-slate-500 dark:text-slate-400 font-bold min-w-[110px]">
                              {language === "en" ? "Available:" : "Khả dụng:"}
                            </span>
                            <span className="text-base font-black text-blue-600 dark:text-blue-400 ">
                              {occupied} / {usableSlots}
                            </span>
                          </div>
                        </div>

                        {/* Horizontal Divider */}
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5" />

                        {/* 3 Stats Columns with MATCHING slice colors:
                            - Đang gửi (Blue #3b82f6 -> text-blue-600)
                            - Trống (Emerald #10b981 -> text-emerald-600)
                            - Bảo trì (Amber #f59e0b -> text-amber-600)
                        */}
                        <div className="grid grid-cols-3 gap-4 text-center sm:text-left">
                          {/* 1. Đang gửi (Blue) */}
                          <div>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold block">
                              {language === "en" ? "Occupied" : "Đang gửi"}
                            </span>
                            <span className="text-lg font-black text-blue-600 dark:text-blue-400 tabular-nums mt-0.5 block">
                              {occupied}
                            </span>
                          </div>

                          {/* 2. Trống (Emerald) */}
                          <div>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold block">
                              {language === "en" ? "Available" : "Trống"}
                            </span>
                            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5 block">
                              {available}
                            </span>
                          </div>

                          {/* 3. Bảo trì (Amber - Matching Donut Chart Amber Slice) */}
                          <div>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold block">
                              {language === "en" ? "Maintenance" : "Bảo trì"}
                            </span>
                            <span className="text-lg font-black text-amber-600 dark:text-amber-400 tabular-nums mt-0.5 block">
                              {maintenance}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Card 2 Left: Vehicle entries by hour */}
              <LineAreaChart
                title={language === "en" ? "Vehicle entries by hour" : "Lượt xe vào theo giờ"}
                subtitle={
                  language === "en"
                    ? "Distribution of vehicle entries across 24 hours of the day."
                    : "Phân bố số lượng xe vào trong 24 giờ của ngày."
                }
                dataPoints={normalizedHours}
                getValue={(p) => p.check_ins}
                valueFormatter={(v) => (language === "en" ? `${v} entries` : `${v} lượt`)}
                strokeColor="#2563eb"
                gradientId="checkinsGrad"
                gradientStart="#2563eb"
                icon={<Clock size={14} className="text-blue-500" />}
                language={language}
              />

              {/* Card 3 Left: Hourly revenue */}
              <LineAreaChart
                title={language === "en" ? "Hourly revenue" : "Doanh thu theo giờ"}
                subtitle={
                  language === "en"
                    ? "Revenue generated each hour from parking fees."
                    : "Doanh thu phát sinh mỗi giờ từ phí đỗ xe."
                }
                dataPoints={normalizedHours}
                getValue={(p) => Math.round(p.check_ins * avgRevenuePerCheckIn)}
                valueFormatter={formatCurrency}
                strokeColor="#10b981"
                gradientId="revenueGrad"
                gradientStart="#10b981"
                icon={<TrendingUp size={14} className="text-emerald-500" />}
                warning={!normalizedHours.some((p) => p.revenue > 0)}
                language={language}
              />
            </div>

            {/* ── RIGHT COLUMN (lg:col-span-2 - 2 CARDS) ── */}
            <div className="lg:col-span-2 space-y-5">
              {/* Card 1 Right: Vehicle type breakdown */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-[12px] font-black text-slate-700 dark:text-white uppercase tracking-wider">
                      {language === "en" ? "Vehicle type breakdown" : "Tổng hợp theo loại xe"}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {language === "en"
                        ? "Side-by-side comparison of Walk-in vs Booking by category."
                        : "So sánh cột kép lượt xe vãng lai và xe đặt chỗ theo loại xe."}
                    </p>
                  </div>
                </div>

                {/* Chart container with Y-axis grid and vertical paired bars */}
                {(() => {
                  return (
                    <div className="flex-1 flex flex-col justify-end pt-4 pb-2 min-h-[220px]">
                      <div className="flex items-stretch gap-2">
                        {/* Y-axis Labels Column (% scale from 0% to 100%) */}
                        <div className="flex flex-col justify-between text-[9px] font-bold text-slate-400 dark:text-slate-500 py-0.5 text-right w-8 shrink-0 select-none">
                          <span>100%</span>
                          <span>75%</span>
                          <span>50%</span>
                          <span>25%</span>
                          <span>0%</span>
                        </div>

                        {/* Chart plot area */}
                        <div className="relative h-44 flex-1 border-b border-l border-slate-200 dark:border-slate-700 flex items-end justify-around px-2 pb-0.5">
                          {/* Grid lines */}
                          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-30">
                            <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-full" />
                            <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-full" />
                            <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-full" />
                            <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-full" />
                            <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-full" />
                          </div>

                          {data.breakdown_by_vehicle_type.map((vt) => {
                            const walkInIns = vt.walk_in_check_ins ?? Math.round((vt.check_ins || 0) * 0.4);
                            const bookingIns = vt.booking_check_ins ?? ((vt.check_ins || 0) - walkInIns);
                            const vtTotalIns = walkInIns + bookingIns;

                            const walkInPct = vtTotalIns > 0 ? Math.round((walkInIns / vtTotalIns) * 100) : 0;
                            const bookingPct = vtTotalIns > 0 ? (100 - walkInPct) : 0;

                            const h1Pct = Math.min(Math.max(walkInPct, 8), 100);
                            const h2Pct = Math.min(Math.max(bookingPct, 8), 100);

                            return (
                              <div key={vt.vehicle_type_id} className="flex flex-col items-center gap-2 z-10 group px-1">
                                <div className="flex items-end gap-1.5 h-36">
                                  <div
                                    style={{ height: `${h1Pct}%` }}
                                    className="w-8 sm:w-10 bg-blue-500 hover:bg-blue-600 rounded-t-md transition-all duration-300 flex flex-col justify-center items-center text-[10px] font-black text-white shadow-xs relative cursor-pointer"
                                    title={`Xe vãng lai: ${walkInIns} lượt (${walkInPct}%)`}
                                  >
                                    <span className="leading-tight drop-shadow-xs">{walkInPct}%</span>
                                  </div>

                                  <div
                                    style={{ height: `${h2Pct}%` }}
                                    className="w-8 sm:w-10 bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all duration-300 flex flex-col justify-center items-center text-[10px] font-black text-white shadow-xs relative cursor-pointer"
                                    title={`Xe đặt chỗ: ${bookingIns} lượt (${bookingPct}%)`}
                                  >
                                    <span className="leading-tight drop-shadow-xs">{bookingPct}%</span>
                                  </div>
                                </div>

                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[75px] text-center">
                                  {vt.vehicle_type_name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Bottom Legend */}
                <div className="pt-2 mt-1 flex justify-center gap-6 text-[10px] font-bold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-blue-500 inline-block shadow-2xs" />
                    {language === "en" ? "Walk-in" : "Xe vãng lai"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block shadow-2xs" />
                    {language === "en" ? "Booking" : "Xe đặt chỗ"}
                  </span>
                </div>

                {/* Doanh thu tổng & chi tiết từng loại xe */}
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  {data.breakdown_by_vehicle_type.map((vt) => {
                    const walkInIns = vt.walk_in_check_ins ?? Math.round((vt.check_ins || 0) * 0.4);
                    const bookingIns = vt.booking_check_ins ?? ((vt.check_ins || 0) - walkInIns);
                    const vtTotalIns = walkInIns + bookingIns;

                    const walkInPct = vtTotalIns > 0 ? Math.round((walkInIns / vtTotalIns) * 100) : 0;

                    const totalRev = Number(vt.revenue ?? 0);
                    const walkInRev = Number(vt.walk_in_revenue ?? Math.round(totalRev * (walkInPct / 100)));
                    const bookingRev = Number(vt.booking_revenue ?? (totalRev - walkInRev));

                    const isCar =
                      vt.vehicle_type_name.toLowerCase().includes("car") ||
                      vt.vehicle_type_name.toLowerCase().includes("ô tô");

                    return (
                      <div
                        key={vt.vehicle_type_id}
                        className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2"
                      >
                        <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                          <div className="flex items-center gap-2 font-black text-xs text-slate-800 dark:text-white">
                            <div className="p-1 bg-white dark:bg-slate-700 rounded-md shadow-xs">
                              {isCar ? <Car size={14} className="text-blue-500" /> : <Bike size={14} className="text-indigo-500" />}
                            </div>
                            <span>{vt.vehicle_type_name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                              {language === "en" ? "Total Revenue" : "Doanh thu tổng"}
                            </span>
                            <span className="text-xs font-black text-slate-800 dark:text-white tabular-nums">
                              {formatCurrency(totalRev)}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-blue-100 dark:border-blue-900/30 flex justify-between items-center">
                            <span className="flex items-center gap-1 font-bold text-slate-500 dark:text-slate-400">
                              <span className="w-2 h-2 rounded-xs bg-blue-500 inline-block" />
                              {language === "en" ? "Walk-in Rev:" : "Vãng lai:"}
                            </span>
                            <span className="font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
                              {formatCurrency(walkInRev)}
                            </span>
                          </div>

                          <div className="bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/30 flex justify-between items-center">
                            <span className="flex items-center gap-1 font-bold text-slate-500 dark:text-slate-400">
                              <span className="w-2 h-2 rounded-xs bg-emerald-500 inline-block" />
                              {language === "en" ? "Booking Rev:" : "Đặt chỗ:"}
                            </span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              {formatCurrency(bookingRev)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card 2 Right: Payment channels */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-[12px] font-black text-slate-700 dark:text-white uppercase tracking-wider">
                      {language === "en" ? "Payment channels" : "Kênh thanh toán"}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {language === "en"
                        ? "Revenue split by payment method."
                        : "Phân bổ doanh thu theo hình thức thanh toán."}
                    </p>
                  </div>
                </div>

                <div className="my-3">
                  <DonutChart slices={donutSlices} />
                </div>

                <div className="space-y-4 flex-1">
                  {paymentMethods.map(([method, amount]) => {
                    const pct = data.revenue.total > 0
                      ? Math.round((Number(amount) / Number(data.revenue.total)) * 100)
                      : 0;
                    const methodUpper = method.toUpperCase();
                    const isVnpay = methodUpper === "VNPAY";
                    const isPayos = methodUpper === "PAYOS";

                    let iconColor = "text-amber-500";
                    let barColor = "bg-amber-500";
                    if (isVnpay) {
                      iconColor = "text-blue-500";
                      barColor = "bg-blue-500";
                    } else if (isPayos) {
                      iconColor = "text-red-500";
                      barColor = "bg-red-500";
                    }

                    return (
                      <div key={method} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <span className="flex items-center gap-1.5 font-bold">
                            {isVnpay ? (
                              <CreditCard size={12} className={iconColor} />
                            ) : isPayos ? (
                              <Sparkles size={12} className={iconColor} />
                            ) : (
                              <Wallet size={12} className={iconColor} />
                            )}
                            {method}
                          </span>
                          <span className="tabular-nums">
                            {formatCurrency(amount)} <span className="text-slate-400 font-medium">({pct}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── EMPTY STATE ── */}
      {!loading && !data && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-10 rounded-2xl text-center space-y-3">
          <AlertCircle size={28} className="text-slate-400 mx-auto" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
            {language === "en" ? "No data available." : "Chưa có dữ liệu."}
          </p>
        </div>
      )}

      {/* ── BOTTOM ACTIONS ── */}
      <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800 mt-6">
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-2 text-xs font-bold"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>{language === "en" ? "Refresh" : "Làm mới"}</span>
        </button>

        <button
          onClick={handleExportCsv}
          disabled={exportLoading || !data}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white text-[11px] font-black px-4 py-2 rounded-xl shadow-xs transition flex items-center gap-2"
        >
          {exportLoading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          {language === "en" ? "Export CSV" : "Xuất CSV"}
        </button>
      </div>
    </div>
  );
}