import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Sparkles, Target, Users, Zap, Shield, Trophy,
  GraduationCap, Briefcase, Brain, ChevronRight,
  Star, Rocket, Heart, Code, Globe, Award
} from "lucide-react";
import Navbar from "../components/Navbar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ABOUT_STYLES = `
  .about-page * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
  .about-page { min-height: 100vh; background: #faf9fd; }

  .about-card {
    background: #fff;
    border: 1.5px solid #ece9f8;
    border-radius: 20px;
    box-shadow: 0 2px 16px rgba(91,62,245,.05);
    transition: transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .22s ease;
  }
  .about-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(91,62,245,.10);
  }

  .stat-card {
    background: #fff;
    border: 1.5px solid #ece9f8;
    border-radius: 18px;
    padding: 28px 24px;
    text-align: center;
    box-shadow: 0 2px 12px rgba(91,62,245,.04);
  }

  .team-card {
    background: #fff;
    border: 1.5px solid #ece9f8;
    border-radius: 20px;
    padding: 28px 24px;
    text-align: center;
    transition: transform .2s, box-shadow .2s;
  }
  .team-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(91,62,245,.12); }

  .value-icon {
    width: 48px; height: 48px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 14px;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp .5s ease both; }
  .fade-up-1 { animation-delay: .05s; }
  .fade-up-2 { animation-delay: .12s; }
  .fade-up-3 { animation-delay: .19s; }

  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .skeleton {
    background: linear-gradient(90deg,#f0eef8 25%,#e8e5f4 37%,#f0eef8 63%);
    background-size: 400px 100%;
    animation: shimmer 1.4s ease infinite;
    border-radius: 8px;
    display: inline-block;
  }

  .gradient-text {
    background: linear-gradient(90deg, #5b3ef5, #a855f7, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .about-btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 28px; border-radius: 12px; border: none; cursor: pointer;
    background: linear-gradient(135deg, #5b3ef5, #9b6ff7);
    color: #fff; font-size: 14px; font-weight: 700;
    font-family: 'Inter', sans-serif; text-decoration: none;
    box-shadow: 0 6px 22px rgba(91,62,245,.35);
    transition: transform .2s, box-shadow .2s;
  }
  .about-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(91,62,245,.45); }

  .about-btn-secondary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 28px; border-radius: 12px; cursor: pointer;
    background: #f0eeff; border: 1.5px solid #c4b8f7;
    color: #5b3ef5; font-size: 14px; font-weight: 700;
    font-family: 'Inter', sans-serif; text-decoration: none;
    transition: background .2s, transform .2s;
  }
  .about-btn-secondary:hover { background: #e4deff; transform: translateY(-2px); }

  @media (max-width: 767px) {
    .about-hero-title { font-size: 32px !important; }
    .about-grid-3 { grid-template-columns: 1fr !important; }
    .about-grid-4 { grid-template-columns: 1fr 1fr !important; }
    .about-grid-2 { grid-template-columns: 1fr !important; }
    .about-hero-btns { flex-direction: column; align-items: stretch !important; }
    .about-hero-btns a, .about-hero-btns button { text-align: center; justify-content: center; }
  }
`;

const VALUES = [
  { icon: Target,   bg: "#f0eeff", color: "#5b3ef5", title: "Goal-Oriented",   desc: "Every feature is designed to move you closer to cracking your target interview." },
  { icon: Brain,    bg: "#fdf0ff", color: "#a855f7", title: "AI-Powered",       desc: "We use cutting-edge AI to simulate real interviewers and give personalised feedback." },
  { icon: Shield,   bg: "#e6fff8", color: "#00d4aa", title: "Privacy First",    desc: "Your data is yours. We never share or sell your practice sessions." },
  { icon: Zap,      bg: "#fff7e6", color: "#f5a623", title: "Fast Feedback",    desc: "Get instant, actionable insights after every session — no waiting, no guessing." },
  { icon: Users,    bg: "#fff1f3", color: "#ff4f6d", title: "For Everyone",     desc: "From Class 10 students to senior engineers — built for every learner." },
  { icon: Heart,    bg: "#f0fff4", color: "#22c55e", title: "Community Driven", desc: "Built with love for students and job seekers across India and beyond." },
];

const TEAM = [
  { name: "Sahil Pathan",   role: "Founder & Creater",  emoji: "👨‍💻", bg: "#f0eeff", color: "#5b3ef5", bio: "Btech Student At STBCET. Passionate about democratising interview prep." },
  { name: "Kore Rohan",     role: "Project Reports Manager",      emoji: "🧠", bg: "#fdf0ff", color: "#a855f7", bio: "Btech Student At STBCET.. Designed the adaptive feedback engine." },
  { name: "Makrand Kulkarni",    role: "Project Manager",    emoji: "🎯", bg: "#fff7e6", color: "#f5a623", bio: "Btech Student At STBCET.. Obsessed with clean, purposeful product design." },
  { name: "Aditya Suryawanshi", role: "Projects Organiser", emoji: "📚", bg: "#e6fff8", color: "#00d4aa", bio: "Btech Student At STBCET. crafting structured learning experiences." },
];

// Static fallback icons/config for the 4 stat cards — values come from API
const STAT_CONFIG = [
  { key: "sessions",  label: "Practice Sessions",  icon: Trophy,        bg: "#f0eeff", color: "#5b3ef5" },
  { key: "learners",  label: "Active Learners",     icon: Users,         bg: "#fdf0ff", color: "#a855f7" },
  { key: "satisfaction", label: "Satisfaction Rate", icon: Star,         bg: "#fff7e6", color: "#f5a623" },
  { key: "templates", label: "Interview Templates", icon: GraduationCap, bg: "#e6fff8", color: "#00d4aa" },
];

export default function AboutPage() {
  const [stats, setStats]           = useState(null);
  const [loadingStats, setLoading]  = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/about/stats`)
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <style>{ABOUT_STYLES}</style>
      <div className="about-page">
        <Navbar />
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 20px 80px" }}>

          {/* ── Hero ── */}
          <section className="fade-up" style={{ textAlign: "center", marginBottom: 72 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "#f0eeff", border: "1.5px solid #c4b8f7",
              borderRadius: 99, padding: "6px 16px", marginBottom: 24,
            }}>
              <Sparkles style={{ width: 13, height: 13, color: "#5b3ef5" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#5b3ef5" }}>About SMART InterviewAi</span>
            </div>

            <h1 className="about-hero-title" style={{ fontSize: 48, fontWeight: 900, color: "#0f0e17", margin: "0 0 20px", lineHeight: 1.1, letterSpacing: "-1px" }}>
              Built to help you<br />
              <span className="gradient-text">land your dream role</span>
            </h1>

            <p style={{ fontSize: 17, color: "#6b6880", maxWidth: 560, margin: "0 auto 36px", lineHeight: 1.7, fontWeight: 400 }}>
              SMART InterviewAi is an AI-powered practice platform tailored to students and job seekers across India.
              We turn nervousness into confidence, one mock interview at a time.
            </p>

            <div className="about-hero-btns" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/dashboard" className="about-btn-primary">
                <Rocket style={{ width: 16, height: 16 }} /> Start Practicing
              </Link>
              <Link to="/interviews" className="about-btn-secondary">
                <Target style={{ width: 16, height: 16 }} /> See Interviews
              </Link>
            </div>
          </section>

          {/* ── Stats ── */}
          <section className="fade-up fade-up-1" style={{ marginBottom: 72 }}>
            <div className="about-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
              {STAT_CONFIG.map(({ key, label, icon: Icon, bg, color }) => {
                const value = stats?.[key];
                return (
                  <div key={label} className="stat-card">
                    <div style={{ width: 44, height: 44, borderRadius: 13, background: bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                      <Icon style={{ width: 20, height: 20, color }} />
                    </div>
                    {loadingStats
                      ? <div className="skeleton" style={{ height: 36, width: 80, margin: "0 auto 6px" }} />
                      : <p style={{ fontSize: 32, fontWeight: 900, color: "#0f0e17", margin: "0 0 4px", letterSpacing: "-1px" }}>
                          {value ?? "—"}
                        </p>
                    }
                    <p style={{ fontSize: 13, color: "#6b6880", fontWeight: 500, margin: 0 }}>{label}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Mission ── */}
          <section className="fade-up fade-up-2" style={{ marginBottom: 72 }}>
            <div style={{
              background: "linear-gradient(135deg,#0f0e17 0%,#1a1433 50%,#0d0c1a 100%)",
              borderRadius: 24, padding: "48px 48px",
              position: "relative", overflow: "hidden",
              boxShadow: "0 20px 60px rgba(91,62,245,.22)",
            }}>
              <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(91,62,245,.3) 0%,transparent 70%)", top: -80, right: -60, pointerEvents: "none" }} />
              <div style={{ position: "relative", maxWidth: 620 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 99, padding: "5px 14px", marginBottom: 20 }}>
                  <Globe style={{ width: 12, height: 12, color: "#a899f7" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#a899f7" }}>Our Mission</span>
                </div>
                <h2 style={{ fontSize: 30, fontWeight: 800, color: "#fff", margin: "0 0 16px", lineHeight: 1.2, letterSpacing: "-0.5px" }}>
                  Democratising interview prep for every Indian student
                </h2>
                <p style={{ fontSize: 15, color: "#9d96c8", lineHeight: 1.8, margin: "0 0 28px" }}>
                  Most interview prep resources are expensive, generic, or both. We built SMART InterviewAi to give
                  every student — whether preparing for JEE, NEET, CAT, or campus placements — access to personalised,
                  intelligent practice that adapts to their exact syllabus and goals.
                </p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <Link to="/dashboard" className="about-btn-primary" style={{ fontSize: 13 }}>
                    Join Free <ChevronRight style={{ width: 14, height: 14 }} />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ── Values ── */}
          <section className="fade-up fade-up-3" style={{ marginBottom: 72 }}>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <h2 style={{ fontSize: 30, fontWeight: 800, color: "#0f0e17", margin: "0 0 10px", letterSpacing: "-0.5px" }}>What we stand for</h2>
              <p style={{ fontSize: 15, color: "#6b6880", margin: 0 }}>The principles that guide every decision we make.</p>
            </div>
            <div className="about-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              {VALUES.map(({ icon: Icon, bg, color, title, desc }) => (
                <div key={title} className="about-card" style={{ padding: "26px 24px" }}>
                  <div className="value-icon" style={{ background: bg }}>
                    <Icon style={{ width: 22, height: 22, color }} />
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f0e17", margin: "0 0 8px" }}>{title}</h3>
                  <p style={{ fontSize: 13, color: "#6b6880", lineHeight: 1.7, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Team ── */}
          <section style={{ marginBottom: 72 }}>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <h2 style={{ fontSize: 30, fontWeight: 800, color: "#0f0e17", margin: "0 0 10px", letterSpacing: "-0.5px" }}>The team behind it</h2>
              <p style={{ fontSize: 15, color: "#6b6880", margin: 0 }}>Passionate builders, educators, and engineers.</p>
            </div>
            <div className="about-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
              {TEAM.map(({ name, role, emoji, bg, color, bio }) => (
                <div key={name} className="team-card">
                  <div style={{ width: 60, height: 60, borderRadius: 18, background: bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 26 }}>
                    {emoji}
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f0e17", margin: "0 0 4px" }}>{name}</h3>
                  <p style={{ fontSize: 12, fontWeight: 600, color, margin: "0 0 10px" }}>{role}</p>
                  <p style={{ fontSize: 12, color: "#6b6880", lineHeight: 1.6, margin: 0 }}>{bio}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── CTA Banner ── */}
          <section style={{ textAlign: "center" }}>
            <div style={{ background: "#f0eeff", border: "1.5px solid #c4b8f7", borderRadius: 24, padding: "48px 32px" }}>
              <Award style={{ width: 36, height: 36, color: "#5b3ef5", margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f0e17", margin: "0 0 10px", letterSpacing: "-0.3px" }}>
                Ready to start your journey?
              </h2>
              <p style={{ fontSize: 15, color: "#6b6880", margin: "0 0 28px" }}>
                Join thousands of learners already crushing their interviews.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <Link to="/dashboard" className="about-btn-primary">
                  <Rocket style={{ width: 15, height: 15 }} /> Get Started Free
                </Link>
                <Link to="/contact" className="about-btn-secondary">
                  Talk to Us
                </Link>
              </div>
            </div>
          </section>

        </main>
      </div>
    </>
  );
}