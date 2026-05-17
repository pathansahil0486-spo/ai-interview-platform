import { useState, useEffect, useRef } from "react";
import { useAuth, useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router";
import {
  Sparkles, Target, Zap, Shield, Users, TrendingUp, CheckCircle,
  ArrowRight, Brain, MessageSquare, BarChart, GraduationCap,
  Briefcase, Star, Play, ChevronRight, Award, Code, Globe,
  BookOpen, UserCheck, LayoutDashboard, BookMarked, Twitter,
  Linkedin, Github, Youtube, Mail, FileText, HelpCircle, Lock,
  X, Volume2
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const BG_VIDEO_URL = "https://res.cloudinary.com/dqnkmytmk/video/upload/q_auto/f_auto/v1779001848/6985525-uhd_3840_2160_25fps_h0d0hh.mp4";
const CTA_VIDEO_URL = "https://res.cloudinary.com/dqnkmytmk/video/upload/q_auto/f_auto/v1779002770/6325286-uhd_2160_3840_24fps_agx6f1.mp4";

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap";
if (!document.head.querySelector('link[href*="Inter"]')) document.head.appendChild(fontLink);

const GLOBAL_STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
  html { scroll-behavior: smooth; }
  body { background: #fff; color: #0f0e17; overflow-x: hidden; }

  .hp-btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    background: linear-gradient(135deg, #5b3ef5 0%, #a855f7 100%);
    color: #fff; font-weight: 700; font-size: 15px;
    padding: 14px 28px; border-radius: 14px; border: none; cursor: pointer;
    box-shadow: 0 8px 24px rgba(91,62,245,.35);
    transition: transform .18s, box-shadow .18s;
    text-decoration: none;
  }
  .hp-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 14px 32px rgba(91,62,245,.45); }

  .hp-btn-outline {
    display: inline-flex; align-items: center; gap: 8px;
    background: transparent; color: #4b4869; font-weight: 700; font-size: 15px;
    padding: 14px 28px; border-radius: 14px; border: 2px solid #e8e4f8; cursor: pointer;
    transition: background .18s, border-color .18s, color .18s;
    text-decoration: none;
  }
  .hp-btn-outline:hover { background: #f5f2ff; border-color: #c4b8f7; color: #5b3ef5; }

  .hp-feature-card {
    background: #fff; border: 1.5px solid #ece9f8;
    border-radius: 20px; padding: 28px 24px;
    transition: transform .2s, box-shadow .2s, border-color .2s;
  }
  .hp-feature-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(91,62,245,.1); border-color: #c4b8f7; }

  .hp-step-card {
    background: #f8f6ff; border: 1.5px solid #ece9f8;
    border-radius: 20px; padding: 32px 24px; text-align: center;
    transition: transform .2s, box-shadow .2s;
  }
  .hp-step-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(91,62,245,.1); }

  .hp-testimonial {
    background: #fff; border: 1.5px solid #ece9f8;
    border-radius: 20px; padding: 28px 24px;
    transition: transform .2s, box-shadow .2s;
  }
  .hp-testimonial:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(91,62,245,.1); }

  .hp-nav-link {
    font-size: 14px; font-weight: 600; color: #4b4869;
    text-decoration: none; transition: color .15s;
  }
  .hp-nav-link:hover { color: #5b3ef5; }

  .hp-footer-link {
    font-size: 13.5px; font-weight: 500; color: #6b6880;
    text-decoration: none; display: flex; align-items: center; gap: 6px;
    transition: color .15s; background: none; border: none; cursor: pointer; padding: 0;
  }
  .hp-footer-link:hover { color: #5b3ef5; }

  .hp-social {
    width: 34px; height: 34px; border-radius: 10px;
    background: #f0eeff; color: #5b3ef5;
    display: flex; align-items: center; justify-content: center;
    transition: background .18s, transform .18s, box-shadow .18s;
    text-decoration: none;
  }
  .hp-social:hover { background: linear-gradient(135deg,#5b3ef5,#a855f7); color: #fff; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(91,62,245,.3); }

  .hp-tag {
    display: inline-flex; align-items: center; gap: 6px;
    background: linear-gradient(135deg, #f0eeff, #f5f2ff);
    border: 1.5px solid #c4b8f7; border-radius: 100px;
    padding: 6px 16px; font-size: 13px; font-weight: 600; color: #5b3ef5;
  }

  .hp-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 700; padding: 5px 12px;
    border-radius: 100px; letter-spacing: 0.05em; text-transform: uppercase;
  }

  .hp-icon-wrap {
    width: 52px; height: 52px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }

  @keyframes float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  .float1 { animation: float1 5s ease-in-out infinite; }
  .float2 { animation: float2 6s ease-in-out infinite 1s; }

  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .hp-skeleton {
    background: linear-gradient(90deg,#f0eef8 25%,#e8e5f4 37%,#f0eef8 63%);
    background-size: 400px 100%;
    animation: shimmer 1.4s ease infinite;
    border-radius: 8px;
    display: inline-block;
  }

  @media (max-width: 767px) {
    .hp-desktop-only { display: none !important; }
    .hp-mobile-only { display: flex !important; }
  }
  @media (min-width: 768px) {
    .hp-mobile-only { display: none !important; }
    .hp-desktop-only { display: flex !important; }
  }

  .gradient-text {
    background: linear-gradient(90deg, #5b3ef5, #a855f7, #ec4899);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Mobile nav menu */
  .hp-mobile-menu {
    position: fixed; top: 64px; left: 0; right: 0; z-index: 49;
    background: rgba(255,255,255,0.98); backdrop-filter: blur(18px);
    border-bottom: 1.5px solid #ece9f8;
    box-shadow: 0 8px 32px rgba(91,62,245,.1);
    padding: 16px 20px 20px;
    flex-direction: column; gap: 8px;
  }
  .hp-mobile-menu-link {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 16px; border-radius: 12px;
    font-size: 14px; font-weight: 600; color: #4b4869;
    text-decoration: none; transition: background .15s, color .15s;
  }
  .hp-mobile-menu-link:hover { background: #f0eeff; color: #5b3ef5; }
  .hp-hamburger {
    width: 38px; height: 38px; border-radius: 10px;
    background: #f0eeff; border: 1.5px solid #c4b8f7;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
    cursor: pointer; transition: background .15s; flex-shrink: 0;
  }
  .hp-hamburger:hover { background: #e8e2ff; }
  .hp-hamburger span {
    display: block; width: 16px; height: 2px;
    background: #5b3ef5; border-radius: 2px;
    transition: transform .22s, opacity .22s;
  }
  .hp-hamburger.open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
  .hp-hamburger.open span:nth-child(2) { opacity: 0; }
  .hp-hamburger.open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

  /* Watch Demo button pulse */
  @keyframes pulse-ring {
    0%   { transform: scale(1); opacity: 0.6; }
    100% { transform: scale(1.6); opacity: 0; }
  }
  .hp-play-pulse::before {
    content: "";
    position: absolute; inset: 0; border-radius: 50%;
    background: rgba(91,62,245,0.4);
    animation: pulse-ring 1.8s ease-out infinite;
  }

  /* YouTube Modal */
  .hp-yt-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(5,3,20,0.92);
    backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: fadeInOverlay .22s ease;
  }
  @keyframes fadeInOverlay { from { opacity: 0 } to { opacity: 1 } }
  .hp-yt-box {
    position: relative;
    width: 100%; max-width: 920px;
    border-radius: 20px; overflow: hidden;
    box-shadow: 0 40px 120px rgba(0,0,0,.8), 0 0 0 1.5px rgba(255,255,255,.08);
    animation: scaleInModal .26s cubic-bezier(0.34,1.56,0.64,1);
    background: #000;
    aspect-ratio: 16/9;
  }
  @keyframes scaleInModal {
    from { transform: scale(0.88); opacity: 0; }
    to   { transform: scale(1);    opacity: 1; }
  }
  .hp-yt-box iframe { width: 100%; height: 100%; border: none; display: block; }
  .hp-yt-close {
    position: absolute; top: -46px; right: 0;
    width: 36px; height: 36px; border-radius: 50%;
    background: rgba(255,255,255,0.12); border: 1.5px solid rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #fff;
    transition: background .18s, transform .18s;
  }
  .hp-yt-close:hover { background: rgba(255,255,255,0.25); transform: scale(1.1); }
`;

/* ── Protected paths ── */
const PROTECTED = ["/dashboard", "/interviews", "/syllabus", "/preparation", "/profile"];

/* ─── Helpers ─── */
function getInitials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "?";
}

const AVATAR_COLORS = [
  "linear-gradient(135deg,#5b3ef5,#7c3aed)",
  "linear-gradient(135deg,#a855f7,#ec4899)",
  "linear-gradient(135deg,#06b6d4,#0891b2)",
  "linear-gradient(135deg,#f97316,#ea580c)",
  "linear-gradient(135deg,#10b981,#059669)",
  "linear-gradient(135deg,#ec4899,#db2777)",
];
function avatarGradient(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

/* ─── Custom hook ─── */
function useHomeData() {
  const [stats, setStats] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/feedback/stats`).then(r => r.json()).catch(() => null),
      fetch(`${API_URL}/feedback/community?limit=20`).then(r => r.json()).catch(() => null),
    ]).then(([statsRes, communityRes]) => {
      if (statsRes?.success) setStats(statsRes.data);
      if (communityRes?.success) {
        const good = communityRes.data
          .filter(f => f.stars >= 4 && f.message && f.message.length >= 40)
          .slice(0, 3);
        setTestimonials(good);
      }
    }).finally(() => setLoading(false));
  }, []);

  return { stats, testimonials, loading };
}

/* ─── SmartCTA ─── */
function SmartCTA({ children, className, style, onMouseEnter, onMouseLeave, onClick }) {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();

  const handleClick = () => {
    onClick?.();
    if (isSignedIn) {
      navigate("/dashboard");
    } else {
      openSignIn();
    }
  };

  return (
    <button
      className={className}
      style={style}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </button>
  );
}

/* ─── IconBox ─── */
function IconBox({ color, children, size = 52 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 14, background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {children}
    </div>
  );
}

/* ─── Blob ─── */
function Blob({ top, left, right, size = 400, color = "rgba(91,62,245,0.07)", blur = 80 }) {
  return (
    <div style={{ position: "absolute", top, left, right, width: size, height: size, background: color, borderRadius: "50%", filter: `blur(${blur}px)`, pointerEvents: "none" }} />
  );
}

/* ─── YOUTUBE MODAL ─── */
function YouTubeModal({ onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="hp-yt-overlay" onClick={onClose}>
      <div style={{ position: "relative", width: "100%", maxWidth: 920 }} onClick={e => e.stopPropagation()}>
        <button className="hp-yt-close" onClick={onClose}>
          <X style={{ width: 16, height: 16 }} />
        </button>
        <div className="hp-yt-box">
          <iframe
            src="https://www.youtube.com/embed/mtIUQhb2h3A?autoplay=1&rel=0&modestbranding=1"
            title="SMART InterviewAi Demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

/* ─── NAV ─── */
function HomeNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  const mobileNavLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#who-its-for", label: "Who It's For" },
    { href: "#testimonials", label: "Reviews" },
  ];

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(255,255,255,0.88)", backdropFilter: "blur(18px)",
        borderBottom: "1.5px solid #ece9f8",
        boxShadow: "0 2px 20px rgba(91,62,245,.07)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, border: "1.5px solid #ece9f8", overflow: "hidden", boxShadow: "0 2px 10px rgba(91,62,245,.12)", flexShrink: 0 }}>
              <img src="/logo-new.png" alt="SMART InterviewAi Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
              <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.3px", background: "linear-gradient(90deg,#5b3ef5,#a855f7,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                SMART InterviewAi
              </span>
              <span style={{ fontSize: 11, color: "#9d96c8", fontWeight: 500, marginTop: 2 }}>Practice &amp; Improve</span>
            </div>
          </a>

          {/* Desktop links */}
          <div className="hp-desktop-only" style={{ alignItems: "center", gap: 28 }}>
            <a href="#features" className="hp-nav-link">Features</a>
            <a href="#how-it-works" className="hp-nav-link">How It Works</a>
            <a href="#who-its-for" className="hp-nav-link">Who It's For</a>
            <a href="#testimonials" className="hp-nav-link">Reviews</a>
            <SmartCTA className="hp-btn-primary" style={{ padding: "10px 22px", fontSize: 14, borderRadius: 11 }}>
              <Zap style={{ width: 15, height: 15 }} /> Get Started Free
            </SmartCTA>
          </div>

          {/* Mobile: hamburger */}
          <div className="hp-mobile-only" style={{ alignItems: "center", gap: 10 }}>
            <button
              className={`hp-hamburger${menuOpen ? " open" : ""}`}
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Toggle navigation menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="hp-mobile-menu hp-mobile-only">
          {mobileNavLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="hp-mobile-menu-link"
              onClick={() => setMenuOpen(false)}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "linear-gradient(135deg,#5b3ef5,#a855f7)", flexShrink: 0 }} />
              {label}
            </a>
          ))}
          <div style={{ marginTop: 4, paddingTop: 12, borderTop: "1.5px solid #ece9f8" }}>
            <SmartCTA
              className="hp-btn-primary"
              style={{ width: "100%", justifyContent: "center", borderRadius: 12, fontSize: 14 }}
              onClick={() => setMenuOpen(false)}
            >
              <Zap style={{ width: 15, height: 15 }} /> Get Started Free
            </SmartCTA>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── HERO ─── */
function HeroSection({ stats, loading }) {
  const [showModal, setShowModal] = useState(false);
  const statItems = [
    { value: "500+", label: "Happy Users" },
    {
      value: loading ? null : stats ? stats.total.toLocaleString() : "0",
      label: "Feedbacks Received",
    },
    {
      value: loading ? null : stats && stats.ratedCount > 0 ? `${stats.avgRating} / 5` : "—",
      label: "Avg User Rating",
    },
    {
      value: loading ? null : stats ? stats.ratedCount.toLocaleString() : "0",
      label: "Ratings Given",
    },
    { value: "50+", label: "Domains Covered" },
  ];

  return (
    <>
      {showModal && <YouTubeModal onClose={() => setShowModal(false)} />}
      <section style={{ position: "relative", overflow: "hidden", paddingTop: 120, paddingBottom: 96, background: "#0a0818" }}>
      {/* Full background video */}
      <video
        src={BG_VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", opacity: 1, pointerEvents: "none", zIndex: 0,
        }}
      />

      {/* Dark gradient overlay so text stays readable */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
        background: "linear-gradient(135deg, rgba(10,8,30,0.72) 0%, rgba(30,12,60,0.65) 50%, rgba(10,8,30,0.75) 100%)",
      }} />

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px", textAlign: "center", position: "relative", zIndex: 2 }}>
        <div className="hp-tag" style={{ marginBottom: 28, background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.25)", color: "#e0d8ff" }}>
          <Sparkles style={{ width: 14, height: 14 }} />
          AI-Powered Mock Interviews · Personalized for Every Goal
        </div>

        <h1 style={{ fontSize: "clamp(36px, 7vw, 68px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-1.5px", color: "#ffffff", marginBottom: 20 }}>
          Land Your Dream Role
          <br />
          <span className="gradient-text">With AI Practice</span>
        </h1>

        <p style={{ fontSize: "clamp(15px, 2vw, 19px)", color: "rgba(220,210,255,0.85)", lineHeight: 1.75, maxWidth: 640, margin: "0 auto 40px", fontWeight: 400 }}>
          Whether you're a student aiming for campus placements or a professional targeting FAANG —
          get personalized AI interviews, instant feedback, and domain-specific preparation.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", alignItems: "center", marginBottom: 64 }}>
          <SmartCTA className="hp-btn-primary">
            <Zap style={{ width: 17, height: 17 }} />
            Start Practicing Free
            <ArrowRight style={{ width: 15, height: 15 }} />
          </SmartCTA>

          {/* Watch Demo button — opens YouTube modal */}
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 12,
              background: "rgba(255,255,255,0.1)", color: "#ffffff", fontWeight: 700, fontSize: 15,
              padding: "14px 24px", borderRadius: 14, border: "2px solid rgba(255,255,255,0.3)", cursor: "pointer",
              transition: "background .18s, border-color .18s, color .18s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)"; e.currentTarget.style.color = "#ffffff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "#ffffff"; }}
          >
            {/* Pulsing play circle */}
            <span style={{ position: "relative", width: 34, height: 34, flexShrink: 0 }}>
              <span className="hp-play-pulse" style={{ position: "absolute", inset: 0, borderRadius: "50%" }} />
              <span style={{
                position: "relative", zIndex: 1,
                width: 34, height: 34, borderRadius: "50%",
                background: "linear-gradient(135deg,#5b3ef5,#a855f7)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 14px rgba(91,62,245,.4)",
              }}>
                <Play style={{ width: 13, height: 13, color: "#fff", marginLeft: 2 }} />
              </span>
            </span>
            Watch Demo
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "20px 40px" }}>
          {statItems.map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              {s.value === null ? (
                <div className="hp-skeleton" style={{ height: 36, width: 80, marginBottom: 6, borderRadius: 8 }} />
              ) : (
                <p style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.5px" }}>
                  {s.value}
                </p>
              )}
              <p style={{ fontSize: 13, color: "rgba(200,190,255,0.75)", fontWeight: 500, marginTop: 2 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
    </>
  );
}

/* ─── WHO IT'S FOR ─── */
function WhoItsFor() {
  return (
    <section id="who-its-for" style={{ padding: "88px 20px", background: "#f8f6ff" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, letterSpacing: "-0.8px", color: "#0f0e17", marginBottom: 10 }}>Built for <span className="gradient-text">Everyone</span></h2>
          <p style={{ fontSize: 16, color: "#6b6880", maxWidth: 480, margin: "0 auto" }}>Personalised experience no matter who you are or where you're headed</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {/* Student */}
          <div style={{ background: "#fff", borderRadius: 22, padding: "36px 28px", border: "1.5px solid #ece9f8", boxShadow: "0 4px 24px rgba(91,62,245,.06)" }}>
            <IconBox color="linear-gradient(135deg,#5b3ef5,#7c3aed)" size={58}>
              <GraduationCap style={{ width: 26, height: 26, color: "#fff" }} />
            </IconBox>
            <div className="hp-badge" style={{ background: "#eef2ff", color: "#4338ca", marginTop: 18, marginBottom: 8 }}>For Students</div>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: "#0f0e17", marginBottom: 10 }}>Class 10th → PhD</h3>
            <p style={{ fontSize: 14, color: "#6b6880", lineHeight: 1.75, marginBottom: 20 }}>
              Personalised prep based on your class, stream & target — board exam interviews to IIT/NEET/UPSC mocks to campus placements.
            </p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {["Subject-specific interview prep", "JEE / NEET / UPSC mock discussions", "Campus placement readiness", "Scholarship & admission interview practice"].map((item, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "#4b4869", fontWeight: 500 }}>
                  <CheckCircle style={{ width: 15, height: 15, color: "#5b3ef5", flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>
            <SmartCTA style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#5b3ef5", fontWeight: 700, fontSize: 14, padding: 0 }}>
              Start as Student <ChevronRight style={{ width: 15, height: 15 }} />
            </SmartCTA>
          </div>

          {/* Professional */}
          <div style={{ background: "#fff", borderRadius: 22, padding: "36px 28px", border: "1.5px solid #ece9f8", boxShadow: "0 4px 24px rgba(91,62,245,.06)" }}>
            <IconBox color="linear-gradient(135deg,#a855f7,#ec4899)" size={58}>
              <Briefcase style={{ width: 26, height: 26, color: "#fff" }} />
            </IconBox>
            <div className="hp-badge" style={{ background: "#fdf4ff", color: "#9333ea", marginTop: 18, marginBottom: 8 }}>For Professionals</div>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: "#0f0e17", marginBottom: 10 }}>Fresher → Senior Leader</h3>
            <p style={{ fontSize: 14, color: "#6b6880", lineHeight: 1.75, marginBottom: 20 }}>
              Domain-specific prep tailored to your field — DSA coding rounds, PM case studies, consulting frameworks, finance modelling and more.
            </p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {["Domain-specific question banks", "Behavioral STAR method coaching", "System design & case study prep", "Salary negotiation & offer guidance"].map((item, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "#4b4869", fontWeight: 500 }}>
                  <CheckCircle style={{ width: 15, height: 15, color: "#a855f7", flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>
            <SmartCTA style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#a855f7", fontWeight: 700, fontSize: 14, padding: 0 }}>
              Start as Professional <ChevronRight style={{ width: 15, height: 15 }} />
            </SmartCTA>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FEATURES ─── */
function Features() {
  const features = [
    { icon: Brain, title: "AI-Tailored Questions", desc: "Questions generated for your exact role, experience level, domain, and academic background — never generic.", color: "linear-gradient(135deg,#5b3ef5,#7c3aed)" },
    { icon: MessageSquare, title: "Instant AI Feedback", desc: "Detailed scoring and improvement tips delivered right after each answer. Know exactly where to improve.", color: "linear-gradient(135deg,#a855f7,#ec4899)" },
    { icon: BarChart, title: "Progress Analytics", desc: "Score trends, weak-area spotting, and session history — all on a clean dashboard. Track growth over time.", color: "linear-gradient(135deg,#06b6d4,#0891b2)" },
    { icon: Target, title: "Personalised Syllabus", desc: "Resources and practice sets filtered by your class, stream, or job domain. No irrelevant material.", color: "linear-gradient(135deg,#f97316,#ea580c)" },
    { icon: Code, title: "All Interview Types", desc: "Technical, behavioral, case study, system design, HR rounds — SMART covers every format you'll face.", color: "linear-gradient(135deg,#ec4899,#db2777)" },
    { icon: Shield, title: "Secure & Private", desc: "Your sessions and personal data are encrypted and never shared. Practice with complete confidence.", color: "linear-gradient(135deg,#10b981,#059669)" },
  ];

  return (
    <section id="features" style={{ padding: "88px 20px", background: "#fff" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, letterSpacing: "-0.8px", color: "#0f0e17", marginBottom: 10 }}>Why <span className="gradient-text">SMART InterviewAi?</span></h2>
          <p style={{ fontSize: 16, color: "#6b6880", maxWidth: 500, margin: "0 auto" }}>Everything you need to walk into any interview with real confidence</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 20 }}>
          {features.map(({ icon: Icon, title, desc, color }, i) => (
            <div key={i} className="hp-feature-card">
              <IconBox color={color} size={48}>
                <Icon style={{ width: 22, height: 22, color: "#fff" }} />
              </IconBox>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f0e17", marginTop: 16, marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 13.5, color: "#6b6880", lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── HOW IT WORKS ─── */
function HowItWorks() {
  const steps = [
    { num: "01", icon: GraduationCap, title: "Set Up Your Profile", desc: "Tell us if you're a student or professional. Pick your class, stream, or job domain and your experience level.", color: "linear-gradient(135deg,#5b3ef5,#7c3aed)" },
    { num: "02", icon: Play, title: "Start Your Session", desc: "Create a new interview — choose the type (technical, behavioral, mixed) and let the AI generate questions instantly.", color: "linear-gradient(135deg,#a855f7,#ec4899)" },
    { num: "03", icon: TrendingUp, title: "Review & Improve", desc: "Get detailed AI analysis, scores, strengths, and areas to improve. Track your progress across every session.", color: "linear-gradient(135deg,#06b6d4,#0891b2)" },
  ];

  return (
    <section id="how-it-works" style={{ padding: "88px 20px", background: "#f8f6ff" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, letterSpacing: "-0.8px", color: "#0f0e17", marginBottom: 10 }}>Ready in <span className="gradient-text">3 Steps</span></h2>
          <p style={{ fontSize: 16, color: "#6b6880" }}>From sign-up to your first interview in under 2 minutes</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {steps.map(({ num, icon: Icon, title, desc, color }, i) => (
            <div key={i} className="hp-step-card">
              <div style={{ position: "relative", display: "inline-block", marginBottom: 24 }}>
                <div style={{ width: 72, height: 72, borderRadius: 18, background: color, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", boxShadow: "0 8px 24px rgba(91,62,245,.25)" }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>{num}</span>
                </div>
                <div style={{ position: "absolute", bottom: -8, right: -8, width: 34, height: 34, borderRadius: 10, background: "#fff", border: "1.5px solid #ece9f8", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(91,62,245,.12)" }}>
                  <Icon style={{ width: 16, height: 16, color: "#5b3ef5" }} />
                </div>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f0e17", marginBottom: 10 }}>{title}</h3>
              <p style={{ fontSize: 13.5, color: "#6b6880", lineHeight: 1.75 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── DOMAINS ─── */
function Domains() {
  const domains = [
    "Software Engineering", "Product Management", "Data Science & ML",
    "System Design", "UPSC & Government", "JEE / NEET", "MBA & Consulting",
    "Finance & Banking", "Marketing", "HR & Operations",
    "Campus Placement", "Core Engineering",
  ];

  return (
    <section style={{ padding: "72px 20px", background: "#fff" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 900, letterSpacing: "-0.6px", color: "#0f0e17", marginBottom: 10 }}>50+ Domains &amp; <span className="gradient-text">Growing</span></h2>
        <p style={{ fontSize: 15, color: "#6b6880", marginBottom: 36 }}>From IIT to FAANG to civil services — we've got every path covered</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {domains.map((d, i) => (
            <span key={i} style={{
              background: i % 3 === 0 ? "#f0eeff" : i % 3 === 1 ? "#fdf4ff" : "#f0fdf4",
              color: i % 3 === 0 ? "#5b3ef5" : i % 3 === 1 ? "#9333ea" : "#059669",
              border: `1.5px solid ${i % 3 === 0 ? "#c4b8f7" : i % 3 === 1 ? "#e9d5ff" : "#bbf7d0"}`,
              borderRadius: 100, padding: "7px 16px", fontSize: 13, fontWeight: 600,
            }}>{d}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── TESTIMONIALS ─── */
function Testimonials({ testimonials, loading }) {
  if (loading) {
    return (
      <section id="testimonials" style={{ padding: "88px 20px", background: "#f8f6ff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <h2 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, letterSpacing: "-0.8px", color: "#0f0e17", marginBottom: 10 }}>
              Real <span className="gradient-text">User Reviews</span>
            </h2>
            <p style={{ fontSize: 16, color: "#6b6880" }}>What people are saying about SMART InterviewAi</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 20 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="hp-testimonial">
                <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                  {[...Array(5)].map((_, j) => <div key={j} className="hp-skeleton" style={{ width: 15, height: 15, borderRadius: 4 }} />)}
                </div>
                <div className="hp-skeleton" style={{ height: 14, width: "100%", marginBottom: 8 }} />
                <div className="hp-skeleton" style={{ height: 14, width: "90%", marginBottom: 8 }} />
                <div className="hp-skeleton" style={{ height: 14, width: "75%", marginBottom: 20 }} />
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="hp-skeleton" style={{ width: 42, height: 42, borderRadius: "50%" }} />
                  <div>
                    <div className="hp-skeleton" style={{ height: 13, width: 100, marginBottom: 6 }} />
                    <div className="hp-skeleton" style={{ height: 11, width: 80 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!testimonials || testimonials.length === 0) return null;

  const TYPE_LABEL_MAP = {
    feature: "Feature Request", bug: "Bug Report", compliment: "Compliment",
    improvement: "Improvement", general: "General",
  };

  return (
    <section id="testimonials" style={{ padding: "88px 20px", background: "#f8f6ff" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, letterSpacing: "-0.8px", color: "#0f0e17", marginBottom: 10 }}>
            Real <span className="gradient-text">User Reviews</span>
          </h2>
          <p style={{ fontSize: 16, color: "#6b6880" }}>What verified users are saying about SMART InterviewAi</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 20 }}>
          {testimonials.map((item, i) => {
            const initials = getInitials(item.userName);
            const gradient = avatarGradient(item.userName);
            const typeLabel = TYPE_LABEL_MAP[item.type] || null;
            return (
              <div key={i} className="hp-testimonial">
                <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} style={{ width: 15, height: 15, fill: j < item.stars ? "#f59e0b" : "none", color: j < item.stars ? "#f59e0b" : "#e8e5f4" }} />
                  ))}
                </div>
                <p style={{ fontSize: 14, color: "#4b4869", lineHeight: 1.8, marginBottom: 20, fontStyle: "italic" }}>
                  "{item.message.length > 200 ? item.message.slice(0, 200) + "…" : item.message}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: gradient, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#0f0e17" }}>{item.userName}</p>
                    {typeLabel && typeLabel !== "not selected" && (
                      <span style={{ fontSize: 11, fontWeight: 700, background: "#f0eeff", color: "#5b3ef5", padding: "3px 10px", borderRadius: 100 }}>
                        {typeLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function CTASection() {
  return (
    <section style={{ padding: "88px 20px", position: "relative", overflow: "hidden", background: "#0a0818" }}>
      {/* Background video */}
      <video
        src={CTA_VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", opacity: 1, pointerEvents: "none", zIndex: 0,
        }}
      />
      {/* Dark overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
        background: "linear-gradient(135deg, rgba(20,8,60,0.78) 0%, rgba(60,20,100,0.72) 50%, rgba(20,8,60,0.80) 100%)",
      }} />
      <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 2 }}>
        <Award style={{ width: 44, height: 44, color: "rgba(255,255,255,0.5)", margin: "0 auto 20px" }} />
        <h2 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, color: "#fff", letterSpacing: "-1px", lineHeight: 1.1, marginBottom: 18 }}>
          Ready to Ace Your Next Interview?
        </h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.82)", lineHeight: 1.75, maxWidth: 540, margin: "0 auto 36px" }}>
          Join thousands of students and professionals who are already practicing smarter.
          Free to start — no credit card required.
        </p>
        <SmartCTA
          style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "#fff", color: "#5b3ef5", fontWeight: 800, fontSize: 16,
            padding: "16px 36px", borderRadius: 16, border: "none", cursor: "pointer",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)", transition: "transform .18s, box-shadow .18s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 14px 40px rgba(0,0,0,0.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)"; }}
        >
          <Zap style={{ width: 18, height: 18 }} /> Start Free Practice Now
        </SmartCTA>
      </div>
    </section>
  );
}

/* ─── FOOTER ─── */
function HomeFooter() {
  const year = new Date().getFullYear();
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  function FooterLink({ path, className, style, children }) {
    const needsAuth = PROTECTED.includes(path);
    if (needsAuth && !isSignedIn) {
      return (
        <button onClick={() => openSignIn()} className={className} style={style}>
          {children}
        </button>
      );
    }
    return <a href={path} className={className} style={style}>{children}</a>;
  }

  const navLinks = [
    { path: "/dashboard",   icon: LayoutDashboard, label: "Dashboard"   },
    { path: "/interviews",  icon: UserCheck,        label: "Interviews"  },
    { path: "/syllabus",    icon: BookMarked,       label: "Syllabus"    },
    { path: "/preparation", icon: BookOpen,         label: "Preparation" },
  ];

  const resourceLinks = [
    { path: "/preparation", label: "Prep Hub"        },
    { path: "/syllabus",    label: "Syllabus"        },
    { path: "/interviews",  label: "Mock Interviews" },
    { path: "/dashboard",   label: "Dashboard"       },
  ];

  const companyLinks = [
    { path: "/about",    label: "About Us"   },
    { path: "/contact",  label: "Contact"    },
    { path: "/profile",  label: "My Profile" },
  ];

  const legalLinks = [
    { path: "/privacy",   label: "Privacy Policy", icon: Shield        },
    { path: "/terms",     label: "Terms of Use",   icon: FileText      },
    { path: "/help",      label: "Help Center",    icon: HelpCircle    },
    { path: "/feedback",  label: "Feedback",       icon: MessageSquare },
  ];

  const socialLinks = [
    { href: "https://twitter.com",  Icon: Twitter,  label: "Twitter"  },
    { href: "https://linkedin.com", Icon: Linkedin, label: "LinkedIn" },
    { href: "https://github.com",   Icon: Github,   label: "GitHub"   },
    { href: "https://youtube.com",  Icon: Youtube,  label: "YouTube"  },
  ];

  return (
    <footer style={{ background: "#fff", borderTop: "1.5px solid #ece9f8", boxShadow: "0 -2px 20px rgba(91,62,245,.04)" }}>

      {/* ══ DESKTOP ══ */}
      <div className="hp-desktop-only" style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "block" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.2fr", gap: 40, padding: "52px 0 44px" }}>

          {/* Brand */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", width: "fit-content" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, border: "1.5px solid #ece9f8", overflow: "hidden", boxShadow: "0 2px 10px rgba(91,62,245,.12)" }}>
                <img src="/logo-new.png" alt="SMART InterviewAi Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
                <span style={{ fontWeight: 800, fontSize: 15, background: "linear-gradient(90deg,#5b3ef5,#a855f7,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  SMART InterviewAi
                </span>
                <span style={{ fontSize: 11, color: "#9d96c8", fontWeight: 500, marginTop: 3 }}>Practice &amp; Improve</span>
              </div>
            </a>
            <p style={{ fontSize: 13, color: "#6b6880", lineHeight: 1.8, maxWidth: 260 }}>
              AI-powered interview practice tailored to your domain, stream, and goals. Crack any interview — from JEE to FAANG to UPSC.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {socialLinks.map(({ href, Icon, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="hp-social">
                  <Icon style={{ width: 15, height: 15 }} />
                </a>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Mail style={{ width: 13, height: 13, color: "#5b3ef5" }} />
              <span style={{ fontSize: 12, color: "#6b6880", fontWeight: 500 }}>support@smartinterviewai.com</span>
            </div>
          </div>

          {/* Quick Links */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#0f0e17" }}>Quick Links</p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              {resourceLinks.map(({ path, label }) => (
                <li key={path}>
                  <FooterLink path={path} className="hp-footer-link">{label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#0f0e17" }}>Company</p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              {companyLinks.map(({ path, label }) => (
                <li key={path}>
                  <FooterLink path={path} className="hp-footer-link">{label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Support */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#0f0e17" }}>Legal &amp; Support</p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              {legalLinks.map(({ path, label, icon: Icon }) => (
                <li key={path}>
                  <FooterLink path={path} className="hp-footer-link">
                    <Icon style={{ width: 13, height: 13, color: "#9d96c8" }} /> {label}
                  </FooterLink>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, background: "#f0eeff", border: "1.5px solid #c4b8f7", borderRadius: 10, padding: "7px 12px", width: "fit-content" }}>
              <Sparkles style={{ width: 13, height: 13, color: "#5b3ef5" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#5b3ef5" }}>Powered by AI</span>
            </div>
          </div>
        </div>

        <div style={{ height: 1.5, background: "linear-gradient(90deg, transparent, #ece9f8 30%, #c4b8f7 50%, #ece9f8 70%, transparent)" }} />

        <div style={{ padding: "18px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 12, color: "#9d96c8", fontWeight: 500 }}>© {year} SMART InterviewAi. All rights reserved.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9d96c8", fontWeight: 500 }}>
            <Globe style={{ width: 13, height: 13 }} /> Made with ❤️ in India
          </div>
        </div>
      </div>

      {/* ══ MOBILE ══ */}
      <div className="hp-mobile-only" style={{ flexDirection: "column" }}>
        <div style={{ padding: "18px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1.5px solid #ece9f8" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
            <img src="/logo-new.png" alt="SMART InterviewAi Logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
              <span style={{ fontWeight: 800, fontSize: 13, background: "linear-gradient(90deg,#5b3ef5,#a855f7,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                SMART InterviewAi
              </span>
              <span style={{ fontSize: 10, color: "#9d96c8", fontWeight: 500, marginTop: 2 }}>Practice &amp; Improve</span>
            </div>
          </a>
          <div style={{ display: "flex", gap: 6 }}>
            {socialLinks.map(({ href, Icon, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="hp-social" style={{ width: 30, height: 30, borderRadius: 9 }}>
                <Icon style={{ width: 13, height: 13 }} />
              </a>
            ))}
          </div>
        </div>

        {/* Nav pills */}
        <div style={{ padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {navLinks.map(({ path, icon: NavIcon, label }) => (
            <FooterLink key={path} path={path} style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 14px", borderRadius: 10,
              fontSize: 12.5, fontWeight: 600, textDecoration: "none",
              background: "#f0eeff", color: "#5b3ef5",
            }}>
              <NavIcon style={{ width: 14, height: 14, flexShrink: 0 }} />
              {label}
            </FooterLink>
          ))}
        </div>

        {/* Legal links */}
        <div style={{ padding: "10px 16px", borderTop: "1.5px solid #ece9f8", display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
          {legalLinks.map(({ path, label }) => (
            <FooterLink key={path} path={path} style={{ fontSize: 11, fontWeight: 600, color: "#6b6880", textDecoration: "none" }}>
              {label}
            </FooterLink>
          ))}
        </div>

        <div style={{ padding: "10px 16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 11, color: "#9d96c8", fontWeight: 500 }}>© {year} SMART InterviewAi</p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#f0eeff", border: "1.5px solid #c4b8f7", borderRadius: 8, padding: "5px 10px" }}>
            <Sparkles style={{ width: 11, height: 11, color: "#5b3ef5" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#5b3ef5" }}>Powered by AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── PAGE ─── */
function HomePage() {
  const { isSignedIn } = useAuth();
  const { stats, testimonials, loading } = useHomeData();

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ minHeight: "100vh", background: "#fff" }}>
        {!isSignedIn && <HomeNav />}
        <div style={{ paddingTop: isSignedIn ? 0 : 64 }}>
          <HeroSection stats={stats} loading={loading} />
          <WhoItsFor />
          <Features />
          <HowItWorks />
          <Domains />
          <Testimonials testimonials={testimonials} loading={loading} />
          <CTASection />
          {!isSignedIn && <HomeFooter />}
        </div>
      </div>
    </>
  );
}

export default HomePage;