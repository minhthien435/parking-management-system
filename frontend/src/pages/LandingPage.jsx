import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Car,
  Bike,
  CalendarCheck,
  Scan,
  Lock,
  Bell,
  BarChart2,
  History,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Globe,
} from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../hooks/useLanguage";


// ─── Static content ───────────────────────────────────────────────────────────
const getFeatures = (lang) => [
  {
    icon: CalendarCheck,
    title: lang === "en" ? "Advance Booking" : "Đặt chỗ trước",
    desc: lang === "en"
      ? "Reserve a spot 1 to 8 hours ahead. Your slot is held for up to 30 minutes past your arrival time — no stress about losing it."
      : "Giữ chỗ đỗ trước từ 1 đến 8 tiếng. Vị trí được giữ thêm tới 30 phút sau giờ hẹn — không lo hết chỗ.",
  },
  {
    icon: Scan,
    title: lang === "en" ? "Automatic Check-in" : "Xe vào tự động",
    desc: lang === "en"
      ? "Cameras read your license plate at the gate. No app needed, no access card — just drive in."
      : "Camera AI tự động nhận diện biển số xe tại cổng. Không cần thẻ từ hay thao tác phức tạp — chỉ việc lái xe vào.",
  },
  {
    icon: Lock,
    title: lang === "en" ? "Remote Vehicle Lock" : "Khóa xe từ xa",
    desc: lang === "en"
      ? 'Activate "Lock Vehicle" in the app after parking. A barrier blocks the exit lane until you unlock it.'
      : "Bật tính năng 'Khóa xe' trên ứng dụng sau khi đỗ. Cổng barrier sẽ tự động chặn xe ra cho tới khi bạn mở khóa.",
  },
  {
    icon: Bell,
    title: lang === "en" ? "Smart Reminders" : "Nhắc nhở thông minh",
    desc: lang === "en"
      ? "Get notified before your booking starts and warned when time is running low — extend your stay or leave on time."
      : "Nhận thông báo nhắc trước giờ hẹn và cảnh báo khi sắp hết thời gian gửi xe — gia hạn hoặc rời bãi đúng giờ.",
  },
  {
    icon: BarChart2,
    title: lang === "en" ? "Live Capacity" : "Sức chứa thời gian thực",
    desc: lang === "en"
      ? "See exactly how many spots are available before you drive over. Data updates in real time."
      : "Theo dõi chính xác số ô đỗ còn trống theo thời gian thực trước khi di chuyển đến bãi.",
  },
  {
    icon: History,
    title: lang === "en" ? "Booking History" : "Lịch sử & Hóa đơn",
    desc: lang === "en"
      ? "View your full history, invoices, and status for every booking — anytime, anywhere in the app."
      : "Xem lại toàn bộ lịch sử đặt chỗ, chi tiết thanh toán và hóa đơn mọi lúc mọi nơi trên ứng dụng.",
  },
];

const getSteps = (lang) => [
  {
    n: "1",
    title: lang === "en" ? "Choose Vehicle Type" : "Chọn loại xe",
    desc: lang === "en"
      ? "Select car or motorbike to see available capacity and matching slots."
      : "Chọn Ô tô hoặc Xe máy để xem sức chứa và danh sách ô đỗ phù hợp.",
  },
  {
    n: "2",
    title: lang === "en" ? "Enter Details" : "Nhập thông tin",
    desc: lang === "en"
      ? "Enter your plate number, pick arrival and departure times. The system calculates your fee instantly."
      : "Nhập biển số xe, chọn giờ vào và giờ ra. Hệ thống tính phí tự động ngay lập tức.",
  },
  {
    n: "3",
    title: lang === "en" ? "Pay Deposit" : "Thanh toán đặt cọc",
    desc: lang === "en"
      ? "Pay the deposit via PayOS. Your spot is reserved the moment payment is confirmed."
      : "Thanh toán tiền cọc an toàn qua cổng PayOS. Chỗ đỗ được giữ ngay sau khi xác nhận.",
  },
  {
    n: "4",
    title: lang === "en" ? "Drive In" : "Lái xe vào bãi",
    desc: lang === "en"
      ? "Cameras read your plate and the barrier opens automatically. Park in your assigned zone."
      : "Camera tự động quét biển số và mở cổng barrier. Đỗ xe đúng phân khu đã chỉ định.",
  },
];

const getTrustItems = (lang) =>
  lang === "en"
    ? [
        "Automatic check-in via license plate recognition camera",
        "Secure payment through PayOS",
        "24/7 continuous support",
      ]
    : [
        "Nhận diện biển số tự động qua Camera AI chuyên dụng",
        "Thanh toán an toàn, bảo mật tuyệt đối qua cổng PayOS",
        "Hỗ trợ vận hành & kỹ thuật 24/7 liên tục",
      ];

// ─── CapacityPill ─────────────────────────────────────────────────────────────
function CapacityPill({ icon: Icon, label, available, total, accentColor, language = "en" }) {
  const pct = total > 0 ? Math.round(((total - available) / total) * 100) : 0;
  const isFull = available === 0;

  return (
    <div
      style={{
        background: "#ffffff",
        border: `1.5px solid ${isFull ? "#dc2626" : "rgb(226, 232, 240)"}`,
        borderRadius: 16,
        padding: "18px 18px 14px",
        flex: 1,
        boxShadow: isFull
          ? "0 4px 18px rgba(220,38,38,0.1)"
          : "0 4px 18px rgba(15,23,42,0.08)",
      }}
    >
      {/* Label row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          fontWeight: 600,
          color: isFull ? "#dc2626" : "#475569",
          marginBottom: 10,
        }}
      >
        <Icon size={13} color={isFull ? "#dc2626" : "#1d4ed8"} />
        {label}
        {isFull && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10,
              background: "#fee2e2",
              color: "#dc2626",
              padding: "1px 7px",
              borderRadius: 99,
              fontWeight: 700,
            }}
          >
            {language === "en" ? "Full" : "Đầy"}
          </span>
        )}
      </div>

      {/* ── Hero number: available / total ── */}
      <div style={{ textAlign: "center", padding: "10px 0 12px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
          <span
            style={{
              fontSize: 46,
              fontWeight: 900,
              lineHeight: 1,
              color: isFull ? "#dc2626" : "#1d4ed8",
              letterSpacing: "-0.03em",
              textShadow: isFull
                ? "0 2px 16px rgba(220,38,38,0.2)"
                : "0 2px 16px rgba(29,78,216,0.2)",
            }}
          >
            {available != null ? available : "—"}
          </span>
          {total != null && (
            <span style={{ fontSize: 18, fontWeight: 700, color: "#94a3b8", letterSpacing: "-0.02em" }}>
              /{total}
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: isFull ? "#ef4444" : "#1d4ed8",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginTop: 4,
            opacity: 0.7,
          }}
        >
          {language === "en" ? "available slots" : "ô đỗ khả dụng"}
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 6,
          borderRadius: 99,
          background: isFull ? "#fee2e2" : "#dbeafe",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 99,
            width: `${pct}%`,
            background: isFull ? "#ef4444" : "#1d4ed8",
            transition: "width 0.6s ease",
          }}
        />
      </div>
      <div style={{ fontSize: 11, color: isFull ? "#ef4444" : "#93c5fd", marginTop: 5, textAlign: "right" }}>
        {pct}% {language === "en" ? "occupied" : "lấp đầy"}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const isLoggedIn = !!user;
  const [capacity, setCapacity] = useState(null);
  const [capacityLoading, setCapacityLoading] = useState(true);

  const [activeSection, setActiveSection] = useState("parking");
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef({});

  const FEATURES = getFeatures(language);
  const STEPS = getSteps(language);
  const TRUST_ITEMS = getTrustItems(language);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Scrollspy logic
  useEffect(() => {
    const sections = ["parking", "features", "how-it-works"];

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observerOptions = {
      root: null,
      rootMargin: "-40% 0px -50% 0px",
      threshold: 0.05,
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, []);

  // Update sliding indicator line
  useEffect(() => {
    const updateIndicator = () => {
      const activeTab = tabRefs.current[activeSection];
      if (activeTab) {
        setIndicatorStyle({
          left: activeTab.offsetLeft,
          width: activeTab.offsetWidth,
        });
      }
    };

    const timer = setTimeout(updateIndicator, 50);

    window.addEventListener("resize", updateIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeSection]);

  useEffect(() => {
    const fetchCapacity = async () => {
      try {
        const res = await api.get("/parking/buildings/info");
        if (res.data?.success) setCapacity(res.data.data);
      } catch {
        // silently fail — capacity pills show "—"
      } finally {
        setCapacityLoading(false);
      }
    };
    fetchCapacity();
  }, []);

  const vehicleTypes = capacity?.vehicle_type_availability ?? [];
  const motoData = vehicleTypes.find((v) => v.vehicle_type_id === 1);
  const carData = vehicleTypes.find((v) => v.vehicle_type_id === 2);

  const motoAvail = motoData?.available_slots ?? null;
  const motoTotal = motoData?.total_slots ?? null;
  const carAvail = carData?.available_slots ?? null;
  const carTotal = carData?.total_slots ?? null;

  const totalSlots = capacity?.total_slots ?? null;

  const isOpen = capacity?.status === "ACTIVE";
  const statusLabel = capacity == null
    ? (language === "en" ? "Live" : "Trực tiếp")
    : isOpen
      ? (language === "en" ? "Open" : "Mở cửa")
      : (language === "en" ? "Closed" : "Đóng cửa");
  const statusColor = capacity == null
    ? { text: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" }
    : isOpen
      ? { text: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" }
      : { text: "#dc2626", bg: "#fef2f2", border: "#fecaca" };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: language === "en" ? "Parking" : "Bãi xe", id: "parking" },
    { label: language === "en" ? "Features" : "Tính năng", id: "features" },
    { label: language === "en" ? "How It Works" : "Quy trình", id: "how-it-works" },
  ];

  return (
    <div style={{ fontFamily: "inherit", background: "#fff", minHeight: "100vh" }}>
      {/* ── Navbar ── */}
      <nav
        style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #e2e8f0",
          padding: "0 40px", height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/eParkingLogo.png" alt="eParking logo" style={{ width: 38, height: 38, borderRadius: 10, objectFit: "contain" }} />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}>e<span style={{ color: "#1d4ed8" }}>Parking</span></span>
            <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500, letterSpacing: "0.04em" }}>Management System</span>
          </div>
        </div>

        {/* Desktop nav links */}
        <div className="lp-nav-links" style={{ gap: 32, position: "relative", height: "100%", alignItems: "center" }}>
          {navItems.map(({ label, id }) => (
            <a
              key={id}
              ref={(el) => (tabRefs.current[id] = el)}
              href={`#${id}`}
              className={`nav-link ${activeSection === id ? "active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(id);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                height: "100%",
                padding: "0 4px",
              }}
            >
              {label}
            </a>
          ))}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              height: 3,
              background: "#1d4ed8",
              borderRadius: "99px 99px 0 0",
              transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
              ...indicatorStyle
            }}
          />
        </div>

        {/* Desktop action buttons & Language Toggle */}
        <div className="lp-nav-actions">
          <button
            onClick={toggleLanguage}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "7px 12px",
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              color: "#334155",
              cursor: "pointer",
            }}
            title={language === "en" ? "Chuyển sang Tiếng Việt" : "Switch to English"}
          >
            <Globe size={14} className="text-blue-600" />
            <span>{language === "en" ? "EN" : "VI"}</span>
          </button>
          <button
            onClick={() => navigate(isLoggedIn ? "/user" : "/login")}
            className="btn-nav-login"
          >
            {isLoggedIn ? (language === "en" ? "Dashboard" : "Tổng quan") : (language === "en" ? "Log In" : "Đăng nhập")}
          </button>
          <button
            onClick={() => navigate(isLoggedIn ? "/user/book" : "/login")}
            className="btn-nav-book"
          >
            {language === "en" ? "Book a Spot" : "Đặt chỗ gửi xe"}
          </button>
        </div>

        {/* Hamburger (mobile/tablet) */}
        <button
          className="lp-hamburger"
          aria-label="Open menu"
          onClick={() => setMobileMenuOpen((v) => !v)}
        >
          {mobileMenuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/>
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu drawer */}
      <div className={`lp-mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
        {navItems.map(({ label, id }) => (
          <a
            key={id}
            href={`#${id}`}
            className={`lp-mobile-nav-link ${activeSection === id ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              scrollToSection(id);
              setMobileMenuOpen(false);
            }}
          >
            {label}
          </a>
        ))}
        <div className="lp-mobile-actions">
          <button
            onClick={toggleLanguage}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "8px 16px",
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              color: "#1e293b",
              width: "100%",
            }}
          >
            <Globe size={14} />
            <span>{language === "en" ? "Ngôn ngữ: English (EN)" : "Ngôn ngữ: Tiếng Việt (VI)"}</span>
          </button>
          <button
            onClick={() => { navigate(isLoggedIn ? "/user" : "/login"); setMobileMenuOpen(false); }}
            className="btn-nav-login"
          >
            {isLoggedIn ? (language === "en" ? "Dashboard" : "Tổng quan") : (language === "en" ? "Log In" : "Đăng nhập")}
          </button>
          <button
            onClick={() => { navigate(isLoggedIn ? "/user/book" : "/login"); setMobileMenuOpen(false); }}
            className="btn-nav-book"
          >
            {language === "en" ? "Book a Spot" : "Đặt chỗ gửi xe"}
          </button>
        </div>
      </div>

      {/* ── Hero ── */}
      <section id="parking" style={{ position: "relative", overflow: "hidden", minHeight: 580, display: "flex", alignItems: "center" }}>
        <div
          style={{
            position: "absolute", inset: 0,
            backgroundImage: "url(https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg?auto=compress&cs=tinysrgb&w=1400)",
            backgroundSize: "cover", backgroundPosition: "center 60%",
            filter: "brightness(0.35)",
          }}
        />
        <div
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(120deg, rgba(29,78,216,0.6) 0%, rgba(15,23,42,0.25) 100%)",
          }}
        />

        <div className="hero-content">
          <div className="hero-left">
            <div
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 99, padding: "5px 14px", fontSize: 12,
                color: "#bfdbfe", fontWeight: 500, marginBottom: 22,
              }}
            >
              <div
                style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: isOpen ? "#4ade80" : "#f87171",
                }}
              />
              {isOpen
                ? (language === "en" ? "Live — updating in real time" : "Trực tiếp — Cập nhật thời gian thực")
                : (language === "en" ? "Currently closed" : "Hiện đang đóng cửa")}
            </div>

            <h1 className="hero-h1">
              {language === "en" ? (
                <>
                  Smart parking,{" "}
                  <span style={{ color: "#60a5fa" }}>no more</span>
                  <br />running late
                </>
              ) : (
                <>
                  Đỗ xe thông minh,{" "}
                  <span style={{ color: "#60a5fa" }}>không còn lo</span>
                  <br />trễ giờ hẹn
                </>
              )}
            </h1>

            <p className="hero-p">
              {language === "en"
                ? "Check live capacity, book up to 1 hour ahead, and check in automatically with license plate recognition — no access card required."
                : "Xem sức chứa thực tế, đặt chỗ trước dễ dàng và tự động vào bãi qua camera AI nhận diện biển số — không cần thẻ từ hay thao tác thủ công."}
            </p>

            <div style={{ display: "flex", gap: 12, marginBottom: 36, flexWrap: "wrap" }}>
              <button
                onClick={() => navigate(isLoggedIn ? "/user/book" : "/login")}
                className="btn-hero-book"
              >
                <CalendarCheck size={17} /> {language === "en" ? "Book a Spot" : "Đặt chỗ gửi xe"}
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="btn-hero-how"
              >
                {language === "en" ? "See How It Works" : "Xem quy trình"}
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {TRUST_ITEMS.map((itemText) => (
                <div key={itemText} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.68)" }}>
                  <CheckCircle2 size={14} color="#4ade80" /> {itemText}
                </div>
              ))}
            </div>
          </div>

          {/* Right — capacity card */}
          <div>
            <div
              style={{
                background: "rgba(255,255,255,0.97)", borderRadius: 20, padding: 24,
                border: "1px solid rgba(255,255,255,0.6)",
                boxShadow: "0 8px 48px rgba(0,0,0,0.2)",
              }}
            >
              <div
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #f1f5f9",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                  <div
                    style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: isOpen ? "#22c55e" : "#ef4444",
                      boxShadow: isOpen ? "0 0 0 3px #dcfce7" : "0 0 0 3px #fee2e2",
                    }}
                  />
                  {language === "en" ? "Parking Capacity" : "Sức chứa bãi xe"}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: statusColor.text,
                    background: statusColor.bg,
                    padding: "3px 10px",
                    borderRadius: 99,
                    fontWeight: 600,
                    border: `1px solid ${statusColor.border}`,
                  }}
                >
                  {statusLabel}
                </span>
              </div>

              {capacityLoading ? (
                <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                  {[1, 2].map((i) => (
                    <div key={i} style={{ flex: 1, height: 100, borderRadius: 14, background: "#f1f5f9", animation: "ldpulse 1.5s infinite" }} />
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                  <CapacityPill
                    icon={Bike}
                    label={language === "en" ? "Motorbikes" : "Xe máy"}
                    available={motoAvail}
                    total={motoTotal}
                    accentColor="#0ea5e9"
                    language={language}
                  />
                  <CapacityPill
                    icon={Car}
                    label={language === "en" ? "Cars" : "Ô tô"}
                    available={carAvail}
                    total={carTotal}
                    accentColor="#1d4ed8"
                    language={language}
                  />
                </div>
              )}

              <div
                style={{
                  display: "grid", gridTemplateColumns: "repeat(2, 1fr)",
                  background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden",
                }}
              >
                {[
                  [totalSlots != null ? String(totalSlots) : "—", language === "en" ? "Parking Spots" : "Tổng số ô đỗ"],
                  ["24/7", language === "en" ? "Open" : "Trạng thái mở"],
                ].map(([val, lbl], i) => (
                  <div key={lbl} style={{ padding: "14px 0", textAlign: "center", borderRight: i < 1 ? "1px solid #e2e8f0" : "none" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#1d4ed8" }}>{val}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="features-section">
        <p style={{ fontSize: 12, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 10 }}>
          {language === "en" ? "Features" : "Tính năng nổi bật"}
        </p>
        <h2 className="section-heading">
          {language === "en" ? "Everything you need to park with ease" : "Mọi tiện ích bạn cần cho trải nghiệm đỗ xe hoàn hảo"}
        </h2>
        <div className="features-grid">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ background: "#f8fafc", borderRadius: 14, padding: "22px 20px", border: "1px solid #e2e8f0" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Icon size={20} color="#1d4ed8" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Steps ── */}
      <section id="how-it-works" className="how-section">
        <div className="how-inner">
          <p style={{ fontSize: 12, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 10 }}>
            {language === "en" ? "How It Works" : "Quy trình thực hiện"}
          </p>
          <h2 className="section-heading">
            {language === "en" ? "Book a spot in 4 simple steps" : "Đặt chỗ gửi xe chỉ với 4 bước đơn giản"}
          </h2>
          <div className="steps-grid">
            {STEPS.map(({ n, title, desc }, i) => (
              <div key={n} style={{ position: "relative" }}>
                {i < STEPS.length - 1 && (
                  <div className="step-connector" />
                )}
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#1d4ed8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, marginBottom: 14, border: "3px solid #dbeafe" }}>
                    {n}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{title}</div>
                  <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2 className="cta-heading">
            {language === "en" ? "Ready to book today?" : "Bạn đã sẵn sàng đặt chỗ hôm nay?"}
          </h2>
          <p className="cta-sub">
            {language === "en"
              ? "Dozens of spots are open right now — reserve ahead so you don't miss out. Takes 2 minutes, no app required."
              : "Hàng trăm vị trí đỗ xe đang sẵn sàng — Đặt trước ngay để đảm bảo chỗ gửi xe cho bạn chỉ trong 2 phút!"}
          </p>
          <div className="cta-actions">
            <button
              onClick={() => navigate(isLoggedIn ? "/user" : "/login")}
              className="btn-cta-login"
            >
              {isLoggedIn ? (language === "en" ? "Dashboard" : "Tổng quan") : (language === "en" ? "Log In" : "Đăng nhập")}
            </button>
            <button
              onClick={() => navigate(isLoggedIn ? "/user/book" : "/login")}
              className="btn-cta-book"
            >
              {language === "en" ? "Book a Spot →" : "Đặt chỗ gửi xe →"}
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#0f172a", color: "#cbd5e1" }}>
        <div className="footer-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <img src="/eParkingLogo.png" alt="eParking logo" style={{ width: 36, height: 36, borderRadius: 9, objectFit: "contain" }} />
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>e<span style={{ color: "#60a5fa" }}>Parking</span></div>
                <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.04em" }}>Management System</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.75, maxWidth: 260, marginBottom: 24 }}>
              {language === "en"
                ? "Smart parking management and booking system. Automatic check-in via license plate recognition camera."
                : "Hệ thống quản lý và đặt chỗ đỗ xe thông minh. Nhận diện biển số xe tự động qua camera AI."}
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: language === "en" ? "24/7 Support" : "Hỗ trợ 24/7", icon: Clock },
                { label: language === "en" ? "SSL Secured" : "Bảo mật SSL", icon: Lock },
              ].map(({ label, icon: Icon }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#475569", background: "#1e293b", padding: "5px 10px", borderRadius: 6 }}>
                  <Icon size={12} color="#475569" style={{ flexShrink: 0 }} /> {label}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 18 }}>
              {language === "en" ? "Services" : "Dịch vụ"}
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(language === "en"
                ? ["Advance Booking", "Car Parking", "Motorbike Parking", "PayOS Payment", "Remote Vehicle Lock"]
                : ["Đặt chỗ trước", "Gửi xe ô tô", "Gửi xe máy", "Thanh toán PayOS", "Khóa xe từ xa"]
              ).map((l) => (
                <a key={l} href="#" style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>{l}</a>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 18 }}>
              {language === "en" ? "Support" : "Hỗ trợ"}
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(language === "en"
                ? ["User Guide", "FAQ", "Parking Rules", "Cancellation Policy", "Contact Support"]
                : ["Hướng dẫn sử dụng", "Câu hỏi thường gặp", "Quy định bãi xe", "Chính sách hủy chỗ", "Liên hệ hỗ trợ"]
              ).map((l) => (
                <a key={l} href="#" style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>{l}</a>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 18 }}>
              {language === "en" ? "Contact" : "Liên hệ"}
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { icon: MapPin, text: language === "en" ? "Ho Chi Minh City, Vietnam" : "TP. Hồ Chí Minh, Việt Nam" },
                { icon: Phone, text: "1900 xxxx" },
                { icon: Mail, text: "support@eparking.vn" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b" }}>
                  <Icon size={14} color="#64748b" style={{ flexShrink: 0 }} />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #1e293b" }} />

        <div className="footer-bottom">
          <p style={{ fontSize: 12, color: "#334155" }}>
            {language === "en"
              ? "© 2026 eParking Management System. All rights reserved."
              : "© 2026 eParking Management System. Tất cả các quyền được bảo lưu."}
          </p>
          <div className="footer-bottom-links">
            {(language === "en"
              ? ["Privacy Policy", "Terms of Use", "Cancellation Policy"]
              : ["Chính sách bảo mật", "Điều khoản sử dụng", "Chính sách hủy chỗ"]
            ).map((l) => (
              <a key={l} href="#" style={{ fontSize: 12, color: "#334155", textDecoration: "none" }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes ldpulse { 0%,100%{opacity:1} 50%{opacity:.45} }

        /* ── Nav Links ── */
        .nav-link {
          font-size: 14px;
          color: #475569;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }
        .nav-link:hover, .nav-link.active { color: #1d4ed8; }
        html { scroll-behavior: smooth; }

        /* ── Buttons ── */
        .btn-nav-login {
          background: transparent;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-nav-login:hover { background: #f8fafc; border-color: #cbd5e1; transform: translateY(-1px); }
        .btn-nav-login:active { transform: translateY(1px); }

        .btn-nav-book {
          background: #1d4ed8;
          color: #fff;
          border: none;
          padding: 8px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(29,78,216,0.2);
        }
        .btn-nav-book:hover { background: #1e40af; box-shadow: 0 4px 12px rgba(29,78,216,0.35); transform: translateY(-1px); }
        .btn-nav-book:active { transform: translateY(1px); box-shadow: 0 1px 4px rgba(29,78,216,0.2); }

        .btn-hero-book {
          background: #1d4ed8; color: #fff; border: none;
          padding: 13px 28px; border-radius: 10px;
          font-size: 15px; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px rgba(29,78,216,0.4);
        }
        .btn-hero-book:hover { background: #1e40af; box-shadow: 0 6px 24px rgba(29,78,216,0.6); transform: translateY(-2px); }
        .btn-hero-book:active { transform: translateY(1px); box-shadow: 0 2px 10px rgba(29,78,216,0.4); }

        .btn-hero-how {
          background: rgba(255,255,255,0.1); color: #fff;
          border: 1px solid rgba(255,255,255,0.25);
          padding: 13px 24px; border-radius: 10px;
          font-size: 15px; font-weight: 500; cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-hero-how:hover { background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.4); transform: translateY(-2px); }
        .btn-hero-how:active { transform: translateY(1px); }

        .btn-cta-login {
          background: transparent; color: #fff;
          border: 1px solid rgba(255,255,255,0.35);
          padding: 13px 28px; border-radius: 10px;
          font-size: 15px; font-weight: 500; cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-cta-login:hover { background: rgba(255,255,255,0.1); border-color: #fff; transform: translateY(-2px); }
        .btn-cta-login:active { transform: translateY(1px); }

        .btn-cta-book {
          background: #fff; color: #1d4ed8; border: none;
          padding: 13px 32px; border-radius: 10px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }
        .btn-cta-book:hover { background: #f8fafc; box-shadow: 0 6px 20px rgba(0,0,0,0.25); transform: translateY(-2px); }
        .btn-cta-book:active { transform: translateY(1px); box-shadow: 0 2px 10px rgba(0,0,0,0.15); }

        /* ── Layout Classes (default: desktop 1100–1440px) ── */
        .lp-nav-links {
          display: flex;
          gap: 32px;
          position: relative;
          height: 100%;
          align-items: center;
        }
        .lp-nav-actions { display: flex; gap: 8px; align-items: center; }

        .lp-hamburger {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          color: #0f172a;
          align-items: center;
          justify-content: center;
        }

        .lp-mobile-menu {
          display: none;
          position: fixed;
          top: 64px; left: 0; right: 0;
          background: rgba(255,255,255,0.98);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #e2e8f0;
          z-index: 49;
          flex-direction: column;
          padding: 12px 0 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.08);
          animation: mobileMenuIn 0.22s cubic-bezier(0.4,0,0.2,1);
        }
        .lp-mobile-menu.open { display: flex; }
        @keyframes mobileMenuIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .lp-mobile-nav-link {
          padding: 14px 24px;
          font-size: 15px; font-weight: 500;
          color: #475569; text-decoration: none;
          border-bottom: 1px solid #f1f5f9;
          transition: color 0.2s, background 0.2s;
        }
        .lp-mobile-nav-link:hover { color: #1d4ed8; background: #f8fafc; }
        .lp-mobile-nav-link.active { color: #1d4ed8; font-weight: 600; }
        .lp-mobile-actions {
          display: flex; gap: 10px;
          padding: 16px 24px 4px;
        }
        .lp-mobile-actions .btn-nav-login,
        .lp-mobile-actions .btn-nav-book { flex: 1; text-align: center; }

        /* Hero */
        .hero-content {
          position: relative; z-index: 2;
          max-width: 1100px; margin: 0 auto;
          padding: 80px 40px 72px; width: 100%;
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 56px; align-items: center;
        }
        .hero-left { display: flex; flex-direction: column; }
        .hero-h1 {
          font-size: 44px; font-weight: 800; color: #fff;
          line-height: 1.1; letter-spacing: -0.03em; margin-bottom: 18px;
        }
        .hero-p {
          font-size: 15px; color: rgba(255,255,255,0.72);
          line-height: 1.75; margin-bottom: 32px; max-width: 400px;
        }

        /* Features */
        .features-section {
          background: #fff; padding: 72px 40px;
          max-width: 1100px; margin: 0 auto;
        }
        .features-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
        .section-heading {
          font-size: 30px; font-weight: 800; color: #0f172a;
          margin-bottom: 40px; letter-spacing: -0.02em;
        }

        /* How it works */
        .how-section {
          background: #f0f7ff;
          border-top: 1px solid #dbeafe; border-bottom: 1px solid #dbeafe;
          padding: 72px 40px;
        }
        .how-inner { max-width: 1100px; margin: 0 auto; }
        .steps-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 24px; position: relative; }
        .step-connector {
          position: absolute; top: 20px;
          left: calc(50% + 22px); right: -50%;
          height: 1px; background: #bfdbfe; z-index: 0;
        }

        /* CTA */
        .cta-section { background: #1d4ed8; padding: 72px 40px; }
        .cta-inner { max-width: 700px; margin: 0 auto; text-align: center; }
        .cta-heading { font-size: 34px; font-weight: 800; color: #fff; letter-spacing: -0.02em; margin-bottom: 14px; }
        .cta-sub { font-size: 15px; color: #bfdbfe; margin-bottom: 36px; line-height: 1.75; }
        .cta-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

        /* Footer */
        .footer-grid {
          max-width: 1100px; margin: 0 auto;
          padding: 56px 40px 40px;
          display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px;
        }
        .footer-bottom {
          max-width: 1100px; margin: 0 auto;
          padding: 20px 40px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .footer-bottom-links { display: flex; gap: 24px; }

        /* ════════════════════════════════════════════
           RESPONSIVE BREAKPOINTS
           ════════════════════════════════════════════ */

        /* ── 27-inch / 2560px+ ── */
        @media (min-width: 2560px) {
          .hero-content { max-width: 2000px; padding: 140px 100px 120px; gap: 120px; }
          .hero-h1 { font-size: 72px; }
          .hero-p { font-size: 18px; max-width: 560px; }
          .features-section { max-width: 2000px; padding: 120px 100px; }
          .features-grid { gap: 36px; }
          .section-heading { font-size: 44px; }
          .how-section { padding: 120px 100px; }
          .how-inner { max-width: 2000px; }
          .steps-grid { gap: 40px; }
          .cta-section { padding: 120px 100px; }
          .cta-heading { font-size: 48px; }
          .footer-grid { max-width: 2000px; padding: 80px 100px 64px; }
          .footer-bottom { max-width: 2000px; padding: 32px 100px; }
        }

        /* ── 24-inch / 1920px ── */
        @media (min-width: 1920px) and (max-width: 2559px) {
          .hero-content { max-width: 1600px; padding: 120px 80px 100px; gap: 96px; }
          .hero-h1 { font-size: 60px; }
          .hero-p { font-size: 17px; max-width: 500px; }
          .features-section { max-width: 1600px; padding: 100px 80px; }
          .features-grid { gap: 28px; }
          .section-heading { font-size: 38px; }
          .how-section { padding: 100px 80px; }
          .how-inner { max-width: 1600px; }
          .steps-grid { gap: 32px; }
          .cta-section { padding: 100px 80px; }
          .cta-heading { font-size: 42px; }
          .footer-grid { max-width: 1600px; padding: 72px 80px 56px; }
          .footer-bottom { max-width: 1600px; padding: 28px 80px; }
        }

        /* ── Large desktop / 1440px ── */
        @media (min-width: 1440px) and (max-width: 1919px) {
          .hero-content { max-width: 1280px; padding: 100px 60px 90px; gap: 72px; }
          .hero-h1 { font-size: 52px; }
          .features-section { max-width: 1280px; padding: 88px 60px; }
          .section-heading { font-size: 34px; }
          .how-section { padding: 88px 60px; }
          .how-inner { max-width: 1280px; }
          .cta-section { padding: 88px 60px; }
          .footer-grid { max-width: 1280px; padding: 64px 60px 48px; gap: 60px; }
          .footer-bottom { max-width: 1280px; padding: 24px 60px; }
        }

        /* ── Laptop / 1024px–1279px ── */
        @media (max-width: 1279px) and (min-width: 1024px) {
          .hero-content { max-width: 960px; padding: 72px 32px 64px; gap: 40px; }
          .hero-h1 { font-size: 40px; }
          .features-section { max-width: 960px; padding: 64px 32px; }
          .how-section { padding: 64px 32px; }
          .how-inner { max-width: 960px; }
          .cta-section { padding: 64px 32px; }
          .footer-grid { max-width: 960px; padding: 48px 32px 36px; gap: 36px; }
          .footer-bottom { max-width: 960px; padding: 18px 32px; }
        }

        /* ── Tablet / 768px–1023px ── */
        @media (max-width: 1023px) and (min-width: 768px) {
          nav { padding: 0 24px !important; }
          .lp-nav-links { display: none !important; }
          .lp-hamburger { display: flex !important; }

          .hero-content { grid-template-columns: 1fr; padding: 64px 24px 56px; gap: 36px; }
          .hero-left { align-items: center; text-align: center; }
          .hero-h1 { font-size: 38px; text-align: center; }
          .hero-p { max-width: 100%; text-align: center; }

          .features-section { padding: 56px 24px; max-width: 100%; }
          .features-grid { grid-template-columns: repeat(2,1fr); gap: 16px; }

          .how-section { padding: 56px 24px; }
          .how-inner { max-width: 100%; }
          .steps-grid { grid-template-columns: repeat(2,1fr); gap: 28px; }
          .step-connector { display: none; }

          .cta-section { padding: 56px 24px; }

          .footer-grid { grid-template-columns: 1fr 1fr; gap: 36px; padding: 48px 24px 36px; }
          .footer-bottom { padding: 18px 24px; flex-direction: column; gap: 12px; text-align: center; }
          .footer-bottom-links { justify-content: center; }
        }

        /* ── Mobile Large / 480px–767px ── */
        @media (max-width: 767px) and (min-width: 480px) {
          nav { padding: 0 16px !important; }
          .lp-nav-links { display: none !important; }
          .lp-nav-actions { display: none !important; }
          .lp-hamburger { display: flex !important; }

          .hero-content { grid-template-columns: 1fr; padding: 52px 16px 48px; gap: 28px; }
          .hero-left { align-items: center; text-align: center; }
          .hero-h1 { font-size: 32px; text-align: center; }
          .hero-p { max-width: 100%; text-align: center; font-size: 14px; }

          .features-section { padding: 48px 16px; max-width: 100%; }
          .features-grid { grid-template-columns: 1fr; gap: 14px; }
          .section-heading { font-size: 24px; }

          .how-section { padding: 48px 16px; }
          .how-inner { max-width: 100%; }
          .steps-grid { grid-template-columns: 1fr 1fr; gap: 20px; }
          .step-connector { display: none; }

          .cta-section { padding: 48px 16px; }
          .cta-heading { font-size: 26px; }
          .cta-sub { font-size: 14px; }

          .footer-grid { grid-template-columns: 1fr 1fr; padding: 40px 16px 28px; gap: 28px; }
          .footer-bottom { padding: 16px; flex-direction: column; gap: 10px; text-align: center; }
          .footer-bottom-links { justify-content: center; gap: 16px; }
        }

        /* ── Mobile Small / <480px ── */
        @media (max-width: 479px) {
          nav { padding: 0 14px !important; height: 56px !important; }
          .lp-nav-links { display: none !important; }
          .lp-nav-actions { display: none !important; }
          .lp-hamburger { display: flex !important; }
          .lp-mobile-menu { top: 56px; }

          .hero-content { grid-template-columns: 1fr; padding: 44px 14px 40px; gap: 24px; }
          .hero-left { align-items: center; text-align: center; }
          .hero-h1 { font-size: 28px; line-height: 1.2; text-align: center; }
          .hero-p { font-size: 13px; max-width: 100%; text-align: center; }

          .btn-hero-book, .btn-hero-how {
            padding: 11px 20px !important; font-size: 14px !important;
            width: 100%; justify-content: center;
          }

          .features-section { padding: 40px 14px; max-width: 100%; }
          .features-grid { grid-template-columns: 1fr; gap: 12px; }
          .section-heading { font-size: 22px; }

          .how-section { padding: 40px 14px; }
          .how-inner { max-width: 100%; }
          .steps-grid { grid-template-columns: 1fr; gap: 20px; }
          .step-connector { display: none; }

          .cta-section { padding: 44px 14px; }
          .cta-heading { font-size: 24px; }
          .cta-sub { font-size: 13px; }
          .cta-actions { flex-direction: column; align-items: stretch; }
          .btn-cta-login, .btn-cta-book { width: 100%; text-align: center; }

          .footer-grid { grid-template-columns: 1fr; padding: 36px 14px 24px; gap: 28px; }
          .footer-bottom { padding: 14px; flex-direction: column; gap: 10px; text-align: center; }
          .footer-bottom-links { flex-direction: column; align-items: center; gap: 8px; }
        }
      `}</style>
    </div>
  );
}