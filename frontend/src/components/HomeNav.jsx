// HomeNav.jsx
import { useState } from "react";
import { useLocation } from "react-router";
import { SignInButton } from "@clerk/clerk-react";
import { Zap } from "lucide-react";

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap";
if (!document.head.querySelector('link[href*="Inter"]')) document.head.appendChild(fontLink);

const NAV_STYLES = `
  .hn-nav-link {
    font-size: 14px; font-weight: 600; color: #4b4869;
    text-decoration: none; transition: color .15s, background .15s;
    padding: 6px 10px; border-radius: 8px;
  }
  .hn-nav-link:hover { color: #5b3ef5; background: #f5f2ff; }

  .hn-btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    background: linear-gradient(135deg, #5b3ef5 0%, #a855f7 100%);
    color: #fff; font-weight: 700; font-size: 14px;
    padding: 10px 22px; border-radius: 11px; border: none; cursor: pointer;
    box-shadow: 0 8px 24px rgba(91,62,245,.35);
    transition: transform .18s, box-shadow .18s;
    text-decoration: none; font-family: 'Inter', sans-serif;
  }
  .hn-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 14px 32px rgba(91,62,245,.45); }

  .hn-mobile-link {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 16px; border-radius: 12px;
    font-size: 14px; font-weight: 600; color: #4b4869;
    text-decoration: none; transition: background .15s, color .15s;
    width: 100%; text-align: left; font-family: 'Inter', sans-serif;
  }
  .hn-mobile-link:hover { background: #f0eeff; color: #5b3ef5; }

  .hn-hamburger {
    width: 38px; height: 38px; border-radius: 10px;
    background: #f0eeff; border: 1.5px solid #c4b8f7;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
    cursor: pointer; transition: background .15s; flex-shrink: 0;
  }
  .hn-hamburger:hover { background: #e8e2ff; }
  .hn-hamburger span {
    display: block; width: 16px; height: 2px;
    background: #5b3ef5; border-radius: 2px;
    transition: transform .22s, opacity .22s;
  }
  .hn-hamburger.open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
  .hn-hamburger.open span:nth-child(2) { opacity: 0; }
  .hn-hamburger.open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

  @media (max-width: 767px) {
    .hn-desktop  { display: none !important; }
    .hn-mobile   { display: flex !important; }
    .hn-dropdown { display: flex !important; }
  }
  @media (min-width: 768px) {
    .hn-mobile   { display: none !important; }
    .hn-desktop  { display: flex !important; }
    .hn-dropdown { display: none !important; }
  }
`;

const anchorLinks = [
  { href: "#features",     label: "Features"     },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#who-its-for",  label: "Who It's For" },
  { href: "#testimonials", label: "Reviews"      },
];

const publicLinks = [
 { href: "/",         label: "Home"     },   
  { href: "/about",    label: "About"    },
  { href: "/contact",  label: "Contact"  },
  { href: "/help",     label: "Help"     },
  { href: "/feedback", label: "Feedback" },
];

function HomeNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <>
      <style>{NAV_STYLES}</style>

      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(255,255,255,0.88)", backdropFilter: "blur(18px)",
        borderBottom: "1.5px solid #ece9f8",
        boxShadow: "0 2px 20px rgba(91,62,245,.07)",
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Logo */}
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, border: "1.5px solid #ece9f8", overflow: "hidden", boxShadow: "0 2px 10px rgba(91,62,245,.12)", flexShrink: 0 }}>
              <img src="/logop.png" alt="SMART InterviewAi" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
              <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.3px", background: "linear-gradient(90deg,#5b3ef5,#a855f7,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                SMART InterviewAi
              </span>
              <span style={{ fontSize: 11, color: "#9d96c8", fontWeight: 500, marginTop: 2 }}>Practice &amp; Improve</span>
            </div>
          </a>

          {/* ── Desktop ── */}
          <div className="hn-desktop" style={{ alignItems: "center", gap: 2 }}>

            {/* Anchor links — sirf homepage pe */}
            {isHomePage && anchorLinks.map(({ href, label }) => (
              <a key={href} href={href} className="hn-nav-link">{label}</a>
            ))}

            {/* Divider — sirf homepage pe */}
            {isHomePage && (
              <div style={{ width: 1, height: 18, background: "#e8e4f8", margin: "0 8px", flexShrink: 0 }} />
            )}

            {/* Public links — hamesha */}
            {publicLinks.map(({ href, label }) => (
              <a key={href} href={href} className="hn-nav-link">{label}</a>
            ))}

            <div style={{ marginLeft: 10, flexShrink: 0 }}>
              <SignInButton mode="modal">
                <button className="hn-btn-primary">
                  <Zap style={{ width: 15, height: 15 }} /> Get Started Free
                </button>
              </SignInButton>
            </div>
          </div>

          {/* ── Mobile: Sign In + hamburger ── */}
          <div className="hn-mobile" style={{ alignItems: "center", gap: 10 }}>
            <button
              className={`hn-hamburger${menuOpen ? " open" : ""}`}
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Toggle navigation menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile dropdown ── */}
      {menuOpen && (
        <div className="hn-dropdown" style={{
          position: "fixed", top: 64, left: 0, right: 0, zIndex: 49,
          background: "rgba(255,255,255,0.98)", backdropFilter: "blur(18px)",
          borderBottom: "1.5px solid #ece9f8",
          boxShadow: "0 8px 32px rgba(91,62,245,.1)",
          padding: "16px 20px 20px",
          flexDirection: "column", gap: 4,
          maxHeight: "calc(100vh - 64px)", overflowY: "auto",
          fontFamily: "'Inter', sans-serif",
        }}>

          {/* Anchor links — sirf homepage pe */}
          {isHomePage && (
            <>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9d96c8", padding: "0 4px 4px" }}>Explore</p>
              {anchorLinks.map(({ href, label }) => (
                <a key={href} href={href} className="hn-mobile-link" onClick={() => setMenuOpen(false)}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "linear-gradient(135deg,#5b3ef5,#a855f7)", flexShrink: 0 }} />
                  {label}
                </a>
              ))}
            </>
          )}

          {/* Public links — hamesha */}
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9d96c8", padding: `${isHomePage ? "12px" : "0"} 4px 4px` }}>Company</p>
          {publicLinks.map(({ href, label }) => (
            <a key={href} href={href} className="hn-mobile-link" onClick={() => setMenuOpen(false)}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "linear-gradient(135deg,#06b6d4,#0891b2)", flexShrink: 0 }} />
              {label}
            </a>
          ))}

          <div style={{ marginTop: 8, paddingTop: 12, borderTop: "1.5px solid #ece9f8" }}>
            <SignInButton mode="modal">
              <button
                className="hn-btn-primary"
                style={{ width: "100%", justifyContent: "center", borderRadius: 12, fontSize: 14 }}
                onClick={() => setMenuOpen(false)}
              >
                <Zap style={{ width: 15, height: 15 }} /> Get Started Free
              </button>
            </SignInButton>
          </div>
        </div>
      )}
    </>
  );
}

export default HomeNav;