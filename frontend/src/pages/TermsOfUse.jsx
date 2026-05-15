import { Link } from "react-router";
import {
  FileText,
  ChevronRight,
  UserCheck,
  AlertTriangle,
  Ban,
  CreditCard,
  RefreshCw,
  Scale,
  MessageSquare,
  Mail,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .tu-root * { font-family: 'Inter', sans-serif; box-sizing: border-box; }

  .tu-hero-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: #f0eeff; border: 1.5px solid #c4b8f7;
    border-radius: 99px; padding: 6px 14px;
    font-size: 12px; font-weight: 700; color: #5b3ef5;
    letter-spacing: 0.04em;
  }

  .tu-section-card {
    background: #fff;
    border: 1.5px solid #ece9f8;
    border-radius: 18px;
    padding: 28px 32px;
    transition: box-shadow .2s;
  }
  .tu-section-card:hover {
    box-shadow: 0 6px 32px rgba(91,62,245,.08);
  }

  .tu-section-icon {
    width: 42px; height: 42px; border-radius: 12px;
    background: #f0eeff;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .tu-list-item {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 14px; color: #4b4869; line-height: 1.7;
  }
  .tu-list-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: linear-gradient(135deg, #5b3ef5, #a855f7);
    flex-shrink: 0; margin-top: 8px;
  }
  .tu-warn-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: linear-gradient(135deg, #f59e0b, #ef4444);
    flex-shrink: 0; margin-top: 8px;
  }

  .tu-divider {
    height: 1.5px;
    background: linear-gradient(90deg,transparent,#ece9f8 30%,#c4b8f7 50%,#ece9f8 70%,transparent);
    margin: 8px 0;
  }

  .tu-back-btn {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 13px; font-weight: 600; color: #5b3ef5;
    text-decoration: none;
    background: #f0eeff; border: 1.5px solid #c4b8f7;
    border-radius: 10px; padding: 8px 14px;
    transition: background .15s, box-shadow .15s;
  }
  .tu-back-btn:hover {
    background: #e4deff;
    box-shadow: 0 4px 14px rgba(91,62,245,.2);
  }

  .tu-toc-link {
    display: flex; align-items: center; gap: 6px;
    font-size: 13px; font-weight: 500; color: #4b4869;
    text-decoration: none;
    padding: 7px 10px; border-radius: 9px;
    transition: background .13s, color .13s;
  }
  .tu-toc-link:hover { background: #f0eeff; color: #5b3ef5; }

  .tu-highlight-card {
    border-left: 3px solid #5b3ef5;
    background: linear-gradient(135deg, #f0eeff, #faf5ff);
    border-radius: 0 14px 14px 0;
    padding: 16px 20px;
  }
  .tu-warn-card {
    border-left: 3px solid #f59e0b;
    background: linear-gradient(135deg, #fffbeb, #fef3c7);
    border-radius: 0 14px 14px 0;
    padding: 16px 20px;
  }
`;

const sections = [
  {
    id: "eligibility",
    icon: UserCheck,
    title: "Eligibility & Account",
    warn: false,
    content: [
      "You must be at least 13 years old to create an account on SMART InterviewAi.",
      "You are responsible for maintaining the confidentiality of your account credentials.",
      "You agree to provide accurate, current, and complete information during registration.",
      "One person may not maintain more than one free account without prior written consent.",
      "You must notify us immediately of any unauthorised access to your account.",
    ],
  },
  {
    id: "use",
    icon: ShieldCheck,
    title: "Acceptable Use",
    warn: false,
    content: [
      "Use the platform solely for lawful, personal interview preparation purposes.",
      "Do not attempt to reverse-engineer, scrape, or copy any part of the platform or its AI models.",
      "Do not upload content that is illegal, harmful, defamatory, or infringes third-party rights.",
      "Respect the intellectual property rights of SMART InterviewAi and all content creators.",
      "Do not share your account credentials or allow others to use your session.",
    ],
  },
  {
    id: "prohibited",
    icon: Ban,
    title: "Prohibited Activities",
    warn: true,
    content: [
      "Attempting to gain unauthorised access to any part of our systems or other user accounts.",
      "Using automated bots, scripts, or tools to abuse platform resources or bypass rate limits.",
      "Posting spam, phishing links, or malicious content through any platform feature.",
      "Impersonating SMART InterviewAi staff, moderators, or any other user.",
      "Engaging in any activity that disrupts or interferes with the platform's normal operation.",
    ],
  },
  {
    id: "ip",
    icon: FileText,
    title: "Intellectual Property",
    warn: false,
    content: [
      "All platform content — including AI models, questions, and UI — is owned by SMART InterviewAi.",
      "You are granted a limited, non-exclusive, non-transferable licence to use the platform.",
      "You retain ownership of content you create, but grant us a licence to use it to improve AI performance.",
      "You must not reproduce, distribute, or create derivative works without prior written permission.",
      "Trademarks and logos of SMART InterviewAi may not be used without explicit consent.",
    ],
  },
  {
    id: "billing",
    icon: CreditCard,
    title: "Payments & Subscriptions",
    warn: false,
    content: [
      "Premium plans are billed monthly or annually depending on the plan selected at checkout.",
      "All fees are non-refundable unless explicitly stated in our Refund Policy.",
      "We reserve the right to modify pricing with 30 days' prior notice to existing subscribers.",
      "Failed payments may result in temporary suspension of premium features.",
      "You may cancel your subscription at any time; access continues until the end of the billing period.",
    ],
  },
  {
    id: "termination",
    icon: AlertTriangle,
    title: "Termination",
    warn: true,
    content: [
      "We may suspend or terminate your account if you breach any provision of these Terms.",
      "You may delete your account at any time from your profile settings page.",
      "Upon termination, your right to use the platform ceases immediately.",
      "We reserve the right to remove any content associated with a terminated account.",
      "Provisions relating to IP, liability, and governing law survive termination.",
    ],
  },
  {
    id: "liability",
    icon: Scale,
    title: "Limitation of Liability",
    warn: false,
    content: [
      "SMART InterviewAi is provided on an 'as-is' and 'as-available' basis without warranties.",
      "We are not liable for indirect, incidental, or consequential damages arising from your use.",
      "Our total liability to you will not exceed the amount paid by you in the preceding 3 months.",
      "We do not guarantee that AI-generated feedback will result in actual interview success.",
      "We are not responsible for third-party services or links accessed through our platform.",
    ],
  },
  {
    id: "changes",
    icon: RefreshCw,
    title: "Changes to Terms",
    warn: false,
    content: [
      "We reserve the right to update these Terms at any time with reasonable notice.",
      "Material changes will be communicated via email or a prominent in-app notification.",
      "Continued use of the platform after changes constitutes your acceptance of the new Terms.",
      "We encourage you to review this page periodically to stay informed of any updates.",
      "The date at the top of this page reflects when the Terms were last revised.",
    ],
  },
];

function TermsOfUse() {
  const year = new Date().getFullYear();

  return (
    <>
      <style>{PAGE_STYLES}</style>
      <div className="tu-root" style={{ background: "#faf9ff", minHeight: "100vh" }}>

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
            <Link to="/" className="tu-back-btn">
              <ArrowLeft style={{ width: 13, height: 13 }} />
              Back to Home
            </Link>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 60px" }}>

          {/* ── Hero ── */}
          <div style={{ padding: "52px 0 36px", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <span className="tu-hero-badge">
                <FileText style={{ width: 12, height: 12 }} />
                Terms of Use
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
              Rules That Keep Us Honest
            </h1>
            <p style={{ fontSize: 15, color: "#6b6880", maxWidth: 520, margin: "0 auto 20px", lineHeight: 1.7 }}>
              Please read these terms carefully before using SMART InterviewAi. They govern your access and use of our platform.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "#9d96c8", fontWeight: 500 }}>Last updated: June 1, {year}</span>
              <span style={{ color: "#c4b8f7" }}>·</span>
              <span style={{ fontSize: 12, color: "#9d96c8", fontWeight: 500 }}>Effective: June 1, {year}</span>
            </div>
          </div>

          {/* ── TOC ── */}
          <div className="tu-section-card" style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#0f0e17", margin: "0 0 14px" }}>
              Table of Contents
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 4 }}>
              {sections.map(({ id, icon: Icon, title }) => (
                <a key={id} href={`#${id}`} className="tu-toc-link">
                  <Icon style={{ width: 13, height: 13, color: "#5b3ef5", flexShrink: 0 }} />
                  {title}
                </a>
              ))}
            </div>
          </div>

          {/* ── Intro ── */}
          <div className="tu-section-card" style={{ marginBottom: 20, background: "linear-gradient(135deg,#f0eeff 0%,#faf5ff 100%)" }}>
            <p style={{ fontSize: 14, color: "#4b4869", lineHeight: 1.8, margin: 0 }}>
              These Terms of Use ("Terms") constitute a legally binding agreement between you and{" "}
              <strong style={{ color: "#5b3ef5" }}>SMART InterviewAi</strong> governing your use of our website, mobile app, and all related services. By creating an account or using our platform in any way, you acknowledge that you have read, understood, and agree to be bound by these Terms.
            </p>
          </div>

          {/* ── Sections ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {sections.map(({ id, icon: Icon, title, content, warn }) => (
              <div key={id} id={id} className="tu-section-card">
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                  <div className="tu-section-icon" style={{ background: warn ? "#fff8ed" : "#f0eeff" }}>
                    <Icon style={{ width: 18, height: 18, color: warn ? "#f59e0b" : "#5b3ef5" }} />
                  </div>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f0e17", letterSpacing: "-0.2px" }}>{title}</h2>
                  {warn && (
                    <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "#f59e0b", background: "#fff8ed", border: "1.5px solid #fde68a", borderRadius: 99, padding: "3px 10px" }}>
                      Important
                    </span>
                  )}
                </div>
                <div className="tu-divider" />
                <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {content.map((item, i) => (
                    <li key={i} className="tu-list-item">
                      <span className={warn ? "tu-warn-dot" : "tu-list-dot"} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* ── Governing Law ── */}
          <div className="tu-section-card" style={{ marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div className="tu-section-icon">
                <Scale style={{ width: 18, height: 18, color: "#5b3ef5" }} />
              </div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f0e17" }}>Governing Law</h2>
            </div>
            <div className="tu-divider" />
            <p style={{ fontSize: 14, color: "#4b4869", lineHeight: 1.8, margin: "14px 0 0" }}>
              These Terms are governed by the laws of India. Any disputes arising from or relating to these Terms shall be subject to the exclusive jurisdiction of courts located in India. If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.
            </p>
          </div>

          {/* ── Contact ── */}
          <div className="tu-section-card" style={{ marginTop: 16, background: "linear-gradient(135deg,#f0eeff,#fdf4ff)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div className="tu-section-icon">
                <Mail style={{ width: 18, height: 18, color: "#5b3ef5" }} />
              </div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f0e17" }}>Questions About These Terms?</h2>
            </div>
            <div className="tu-divider" />
            <p style={{ fontSize: 14, color: "#4b4869", lineHeight: 1.8, margin: "14px 0 0" }}>
              If you have any questions or concerns about these Terms of Use, please contact us at{" "}
              <a href="mailto:support@smartinterviewai.com" style={{ color: "#5b3ef5", fontWeight: 600, textDecoration: "none" }}>
                support@smartinterviewai.com
              </a>
              . We aim to respond to all legal inquiries within 5 business days.
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

export default TermsOfUse;