import { Link } from "react-router";
import {
  Shield,
  ChevronRight,
  Lock,
  Eye,
  Database,
  Share2,
  UserCheck,
  Trash2,
  Bell,
  Mail,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .pp-root * { font-family: 'Inter', sans-serif; box-sizing: border-box; }

  .pp-hero-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: #f0eeff; border: 1.5px solid #c4b8f7;
    border-radius: 99px; padding: 6px 14px;
    font-size: 12px; font-weight: 700; color: #5b3ef5;
    letter-spacing: 0.04em;
  }

  .pp-section-card {
    background: #fff;
    border: 1.5px solid #ece9f8;
    border-radius: 18px;
    padding: 28px 32px;
    transition: box-shadow .2s;
  }
  .pp-section-card:hover {
    box-shadow: 0 6px 32px rgba(91,62,245,.08);
  }

  .pp-section-icon {
    width: 42px; height: 42px; border-radius: 12px;
    background: #f0eeff;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .pp-list-item {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 14px; color: #4b4869; line-height: 1.7;
  }
  .pp-list-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: linear-gradient(135deg, #5b3ef5, #a855f7);
    flex-shrink: 0; margin-top: 8px;
  }

  .pp-divider {
    height: 1.5px;
    background: linear-gradient(90deg,transparent,#ece9f8 30%,#c4b8f7 50%,#ece9f8 70%,transparent);
    margin: 8px 0;
  }

  .pp-back-btn {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 13px; font-weight: 600; color: #5b3ef5;
    text-decoration: none;
    background: #f0eeff; border: 1.5px solid #c4b8f7;
    border-radius: 10px; padding: 8px 14px;
    transition: background .15s, box-shadow .15s;
  }
  .pp-back-btn:hover {
    background: #e4deff;
    box-shadow: 0 4px 14px rgba(91,62,245,.2);
  }

  .pp-toc-link {
    display: flex; align-items: center; gap: 6px;
    font-size: 13px; font-weight: 500; color: #4b4869;
    text-decoration: none;
    padding: 7px 10px; border-radius: 9px;
    transition: background .13s, color .13s;
  }
  .pp-toc-link:hover { background: #f0eeff; color: #5b3ef5; }
`;

const sections = [
  {
    id: "collect",
    icon: Database,
    title: "Information We Collect",
    content: [
      "Account information such as name, email address, and password when you register.",
      "Profile data including academic stream, target exams, and interview preferences.",
      "Usage data — how you interact with practice sessions, quizzes, and AI features.",
      "Device and browser information for security and experience optimization.",
      "Communications you send us via feedback forms or support emails.",
    ],
  },
  {
    id: "use",
    icon: Eye,
    title: "How We Use Your Information",
    content: [
      "To personalise your interview preparation experience and recommend relevant content.",
      "To power AI-driven mock interviews and generate performance analytics.",
      "To send important updates, progress reports, and product notifications.",
      "To improve our algorithms, detect bugs, and enhance platform reliability.",
      "To comply with legal obligations and enforce our Terms of Use.",
    ],
  },
  {
    id: "store",
    icon: Lock,
    title: "Data Storage & Security",
    content: [
      "All data is encrypted in transit using TLS 1.3 and at rest using AES-256.",
      "Your data is stored on secure, access-controlled cloud infrastructure.",
      "We perform regular security audits and penetration testing.",
      "Passwords are hashed using bcrypt and never stored in plain text.",
      "Access to your personal data is restricted to authorised personnel only.",
    ],
  },
  {
    id: "share",
    icon: Share2,
    title: "Information Sharing",
    content: [
      "We do not sell your personal data to third parties — ever.",
      "We may share anonymised, aggregated statistics with partners for research.",
      "Trusted service providers (e.g., email, analytics) may access data to operate the platform.",
      "We may disclose data if required by law or to protect rights and safety.",
      "Any third-party integrations you connect will be governed by their own privacy policies.",
    ],
  },
  {
    id: "rights",
    icon: UserCheck,
    title: "Your Rights",
    content: [
      "Access a copy of all personal data we hold about you at any time.",
      "Request correction of inaccurate or incomplete information.",
      "Withdraw consent for marketing communications without affecting your account.",
      "Request data portability in a machine-readable format.",
      "Lodge a complaint with your local data protection authority.",
    ],
  },
  {
    id: "delete",
    icon: Trash2,
    title: "Data Deletion & Retention",
    content: [
      "You can delete your account at any time from your profile settings.",
      "Upon deletion, your personal data is purged within 30 days.",
      "Anonymised usage data may be retained for analytics after deletion.",
      "Backup copies are fully removed within 90 days of account deletion.",
      "Some data may be retained longer if required by applicable law.",
    ],
  },
  {
    id: "cookies",
    icon: Bell,
    title: "Cookies & Tracking",
    content: [
      "We use essential cookies to keep you logged in and maintain session security.",
      "Analytics cookies help us understand how users navigate the platform.",
      "You can manage cookie preferences via your browser settings at any time.",
      "We do not use third-party advertising or tracking cookies.",
      "Disabling essential cookies may affect the functionality of the platform.",
    ],
  },
];

function PrivacyPolicy() {
  const year = new Date().getFullYear();

  return (
    <>
      <style>{PAGE_STYLES}</style>
      <div className="pp-root" style={{ background: "#faf9ff", minHeight: "100vh" }}>

        {/* ── Header ── */}
        <div style={{
          background: "#fff",
          borderBottom: "1.5px solid #ece9f8",
          boxShadow: "0 2px 12px rgba(91,62,245,.05)",
        }}>
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <div style={{
                width: 38, height: 38, borderRadius: 11,
                border: "1.5px solid #ece9f8",
                boxShadow: "0 2px 10px rgba(91,62,245,.12)",
                overflow: "hidden", flexShrink: 0,
              }}>
                <img src="/logop.png" alt="SMART InterviewAi" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ lineHeight: 1 }}>
                <span style={{
                  fontWeight: 800, fontSize: 15, letterSpacing: "-0.3px",
                  background: "linear-gradient(90deg,#5b3ef5,#a855f7,#ec4899)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "block",
                }}>SMART InterviewAi</span>
                <span style={{ fontSize: 10, color: "#9d96c8", fontWeight: 500, marginTop: 2, display: "block" }}>Practice &amp; Improve</span>
              </div>
            </Link>
            <Link to="/" className="pp-back-btn">
              <ArrowLeft style={{ width: 13, height: 13 }} />
              Back to Home
            </Link>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 60px" }}>

          {/* ── Hero ── */}
          <div style={{ padding: "52px 0 36px", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <span className="pp-hero-badge">
                <Shield style={{ width: 12, height: 12 }} />
                Privacy Policy
              </span>
            </div>
            <h1 style={{
              margin: "0 0 12px",
              fontSize: "clamp(28px, 5vw, 42px)",
              fontWeight: 800,
              letterSpacing: "-0.8px",
              background: "linear-gradient(135deg,#0f0e17 0%,#5b3ef5 60%,#a855f7 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              lineHeight: 1.2,
            }}>
              Your Privacy Matters to Us
            </h1>
            <p style={{ fontSize: 15, color: "#6b6880", maxWidth: 520, margin: "0 auto 20px", lineHeight: 1.7 }}>
              We're committed to being transparent about how we collect, use, and protect your data.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "#9d96c8", fontWeight: 500 }}>Last updated: June 1, {year}</span>
              <span style={{ color: "#c4b8f7" }}>·</span>
              <span style={{ fontSize: 12, color: "#9d96c8", fontWeight: 500 }}>Effective: June 1, {year}</span>
            </div>
          </div>

          {/* ── TOC ── */}
          <div className="pp-section-card" style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#0f0e17", margin: "0 0 14px" }}>
              Table of Contents
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 4 }}>
              {sections.map(({ id, icon: Icon, title }) => (
                <a key={id} href={`#${id}`} className="pp-toc-link">
                  <Icon style={{ width: 13, height: 13, color: "#5b3ef5", flexShrink: 0 }} />
                  {title}
                </a>
              ))}
            </div>
          </div>

          {/* ── Intro ── */}
          <div className="pp-section-card" style={{ marginBottom: 20, background: "linear-gradient(135deg,#f0eeff 0%,#faf5ff 100%)" }}>
            <p style={{ fontSize: 14, color: "#4b4869", lineHeight: 1.8, margin: 0 }}>
              Welcome to <strong style={{ color: "#5b3ef5" }}>SMART InterviewAi</strong>. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered interview preparation platform. By accessing our service, you agree to the practices described in this policy. If you do not agree, please discontinue use of our platform.
            </p>
          </div>

          {/* ── Sections ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {sections.map(({ id, icon: Icon, title, content }) => (
              <div key={id} id={id} className="pp-section-card">
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                  <div className="pp-section-icon">
                    <Icon style={{ width: 18, height: 18, color: "#5b3ef5" }} />
                  </div>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f0e17", letterSpacing: "-0.2px" }}>{title}</h2>
                </div>
                <div className="pp-divider" />
                <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {content.map((item, i) => (
                    <li key={i} className="pp-list-item">
                      <span className="pp-list-dot" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* ── Contact ── */}
          <div className="pp-section-card" style={{ marginTop: 20, background: "linear-gradient(135deg,#f0eeff,#fdf4ff)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div className="pp-section-icon">
                <Mail style={{ width: 18, height: 18, color: "#5b3ef5" }} />
              </div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f0e17" }}>Contact Us</h2>
            </div>
            <div className="pp-divider" />
            <p style={{ fontSize: 14, color: "#4b4869", lineHeight: 1.8, margin: "14px 0 0" }}>
              If you have any questions about this Privacy Policy or wish to exercise your rights, please reach out to us at{" "}
              <a href="mailto:support@smartinterviewai.com" style={{ color: "#5b3ef5", fontWeight: 600, textDecoration: "none" }}>
                support@smartinterviewai.com
              </a>
              . We aim to respond to all requests within 5 business days.
            </p>
          </div>

          {/* ── Footer note ── */}
          <div style={{ marginTop: 32, textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f0eeff", border: "1.5px solid #c4b8f7", borderRadius: 10, padding: "7px 14px", marginBottom: 14 }}>
              <Sparkles style={{ width: 13, height: 13, color: "#5b3ef5" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#5b3ef5" }}>Powered by AI</span>
            </div>
            <p style={{ fontSize: 12, color: "#9d96c8", fontWeight: 500, margin: 0 }}>
              © {year} SMART InterviewAi. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default PrivacyPolicy;