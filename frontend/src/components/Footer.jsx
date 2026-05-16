import { Link, useLocation } from "react-router";
import { useAuth, useClerk } from "@clerk/clerk-react";
import {
  LayoutDashboardIcon,
  UserCheckIcon,
  BookOpenIcon,
  BookMarked,
  Mail,
  Twitter,
  Linkedin,
  Github,
  Youtube,
  Sparkles,
  Shield,
  FileText,
  HelpCircle,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

const FOOTER_STYLES = `
  .smart-footer * { font-family: 'Inter', sans-serif; box-sizing: border-box; }

  .f-link {
    display: flex; align-items: center; gap: 6px;
    font-size: 13.5px; font-weight: 500; color: #4b4869;
    text-decoration: none; transition: color .15s;
    background: none; border: none; cursor: pointer; padding: 0; width: 100%;
  }
  .f-link:hover { color: #5b3ef5; }
  .f-link.active { color: #5b3ef5; }
  .f-link .chevron { opacity: 0; transition: opacity .15s, transform .15s; transform: translateX(-4px); }
  .f-link:hover .chevron { opacity: 1; transform: translateX(0); }

  .f-social {
    width: 32px; height: 32px; border-radius: 10px;
    background: #f0eeff; color: #5b3ef5;
    display: flex; align-items: center; justify-content: center;
    transition: background .18s, color .18s, transform .18s, box-shadow .18s;
    text-decoration: none;
  }
  .f-social:hover {
    background: linear-gradient(135deg,#5b3ef5,#a855f7);
    color: #fff; transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(91,62,245,.3);
  }

  .f-nav-pill {
    display: flex; align-items: center; gap: 7px;
    padding: 9px 14px; border-radius: 10px;
    font-size: 12.5px; font-weight: 600; text-decoration: none;
    transition: background .15s, color .15s;
    background: none; border: none; cursor: pointer; width: 100%;
  }
  .f-nav-pill.active { background: #5b3ef5; color: #fff; box-shadow: 0 4px 14px rgba(91,62,245,.3); }
  .f-nav-pill:not(.active) { background: #f0eeff; color: #5b3ef5; }
  .f-nav-pill:not(.active):hover { background: #e4deff; }

  .f-bottom-link {
    font-size: 12px; font-weight: 600; text-decoration: none; color: #6b6880;
    transition: color .15s; background: none; border: none; cursor: pointer; padding: 0;
  }
  .f-bottom-link:hover { color: #5b3ef5; }
  .f-bottom-link.active { color: #5b3ef5; }
`;

/* ── Protected paths — sign-in required ── */
const PROTECTED = ["/dashboard", "/interviews", "/syllabus", "/preparation", "/profile"];

function Footer() {
  const location = useLocation();
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  const isActive = (path) => location.pathname === path;

  /* Smart link: public → React Router Link, protected + logged-out → openSignIn modal */
  function NavLink({ to, className, style, children }) {
    const needsAuth = PROTECTED.includes(to);
    if (needsAuth && !isSignedIn) {
      return (
        <button
          onClick={() => openSignIn()}
          className={className}
          style={style}
        >
          {children}
        </button>
      );
    }
    return (
      <Link to={to} className={className} style={style}>
        {children}
      </Link>
    );
  }

  const navLinks = [
    { path: "/dashboard",   icon: LayoutDashboardIcon, label: "Dashboard"   },
    { path: "/interviews",  icon: UserCheckIcon,        label: "Interviews"  },
    { path: "/syllabus",    icon: BookMarked,           label: "Syllabus"    },
    { path: "/preparation", icon: BookOpenIcon,         label: "Preparation" },
  ];

  const resourceLinks = [
    { path: "/preparation", label: "Prep Hub"        },
    { path: "/syllabus",    label: "Syllabus"        },
    { path: "/interviews",  label: "Mock Interviews" },
    { path: "/dashboard",   label: "Dashboard"       },
  ];

  const companyLinks = [
    { path: "/profile",  label: "My Profile" },
    { path: "/about",    label: "About Us"   },
    { path: "/contact",  label: "Contact"    },
  ];

  const legalLinks = [
    { path: "/privacy",  label: "Privacy Policy", icon: Shield        },
    { path: "/terms",    label: "Terms of Use",   icon: FileText      },
    { path: "/help",     label: "Help Center",    icon: HelpCircle    },
    { path: "/feedback", label: "Feedback",       icon: MessageSquare },
  ];

  const socialLinks = [
    { href: "https://twitter.com",  Icon: Twitter,  label: "Twitter"  },
    { href: "https://linkedin.com", Icon: Linkedin, label: "LinkedIn" },
    { href: "https://github.com",   Icon: Github,   label: "GitHub"   },
    { href: "https://youtube.com",  Icon: Youtube,  label: "YouTube"  },
  ];

  const year = new Date().getFullYear();

  return (
    <>
      <style>{FOOTER_STYLES}</style>
      <footer className="smart-footer" style={{
        background: "#fff",
        borderTop: "1.5px solid #ece9f8",
        boxShadow: "0 -2px 20px rgba(91,62,245,.05)",
      }}>

        {/* ══ DESKTOP (md+) ══ */}
        <div className="hidden md:block" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>

          {/* Top grid */}
          <div style={{ padding: "48px 0 40px", display: "grid", gridTemplateColumns: "2fr .5fr 1fr 1fr 1.2fr", gap: 32 }}>

            {/* Brand col */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", width: "fit-content" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 13,
                  border: "1.5px solid #ece9f8",
                  boxShadow: "0 2px 10px rgba(91,62,245,.12)",
                  overflow: "hidden", flexShrink: 0,
                }}>
                  <img src="/logop.png" alt="SMART InterviewAi Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
                  <span style={{
                    fontWeight: 800, fontSize: 16, letterSpacing: "-0.3px",
                    background: "linear-gradient(90deg,#5b3ef5,#a855f7,#ec4899)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>
                    SMART InterviewAi
                  </span>
                  <span style={{ fontSize: 11, color: "#9d96c8", fontWeight: 500, marginTop: 3 }}>
                    Practice &amp; Improve
                  </span>
                </div>
              </Link>

              <p style={{ fontSize: 13, color: "#6b6880", lineHeight: 1.7, maxWidth: 260, margin: 0 }}>
                AI-powered interview practice tailored to your domain, stream, and goals.
                Crack any interview — from JEE to FAANG to UPSC.
              </p>

              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                {socialLinks.map(({ href, Icon, label }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="f-social">
                    <Icon style={{ width: 15, height: 15 }} />
                  </a>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Mail style={{ width: 13, height: 13, color: "#5b3ef5", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#6b6880", fontWeight: 500 }}>support@smartinterviewai.com</span>
              </div>
            </div>

            {/* Spacer */}
            <div />

            {/* Quick Links */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink, #0f0e17)", margin: 0 }}>Quick Links</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {resourceLinks.map(({ path, label }) => (
                  <li key={path}>
                    <NavLink to={path} className={`f-link${isActive(path) ? " active" : ""}`}>
                      <ChevronRight className="chevron" style={{ width: 12, height: 12, color: "#5b3ef5" }} />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#0f0e17", margin: 0 }}>Company</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {companyLinks.map(({ path, label }) => (
                  <li key={path}>
                    <NavLink to={path} className={`f-link${isActive(path) ? " active" : ""}`}>
                      <ChevronRight className="chevron" style={{ width: 12, height: 12, color: "#5b3ef5" }} />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal & Support */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#0f0e17", margin: 0 }}>Legal &amp; Support</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {legalLinks.map(({ path, label, icon: Icon }) => (
                  <li key={path}>
                    <NavLink to={path} className={`f-link${isActive(path) ? " active" : ""}`}>
                      <Icon style={{ width: 13, height: 13, color: "#9d96c8", flexShrink: 0 }} />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>

              {/* AI badge */}
              <div style={{
                marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6,
                background: "#f0eeff", border: "1.5px solid #c4b8f7",
                borderRadius: 10, padding: "7px 12px", width: "fit-content",
              }}>
                <Sparkles style={{ width: 13, height: 13, color: "#5b3ef5" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#5b3ef5" }}>Powered by AI</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1.5, background: "linear-gradient(90deg,transparent,#ece9f8 30%,#c4b8f7 50%,#ece9f8 70%,transparent)" }} />

          {/* Bottom bar */}
          <div style={{ padding: "18px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 12, color: "#9d96c8", fontWeight: 500, margin: 0 }}>
              © {year} SMART InterviewAi. All rights reserved.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {navLinks.map(({ path, label }) => (
                <NavLink key={path} to={path} className={`f-bottom-link${isActive(path) ? " active" : ""}`}>
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        {/* ══ MOBILE (<md) ══ */}
        <div className="md:hidden">

          {/* Brand row */}
          <div style={{ padding: "18px 16px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1.5px solid #ece9f8" }}>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
              <img src="/logop.png" alt="SMART InterviewAi Logo" style={{ width: 32, height: 32, borderRadius: 9, objectFit: "contain", boxShadow: "0 2px 8px rgba(91,62,245,.18)" }} />
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
                <span style={{
                  fontWeight: 800, fontSize: 13, letterSpacing: "-0.2px",
                  background: "linear-gradient(90deg,#5b3ef5,#a855f7,#ec4899)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  SMART InterviewAi
                </span>
                <span style={{ fontSize: 10, color: "#9d96c8", fontWeight: 500, marginTop: 2 }}>Practice &amp; Improve</span>
              </div>
            </Link>
            <div style={{ display: "flex", gap: 6 }}>
              {socialLinks.map(({ href, Icon, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="f-social" style={{ width: 28, height: 28, borderRadius: 8 }}>
                  <Icon style={{ width: 13, height: 13 }} />
                </a>
              ))}
            </div>
          </div>

          {/* Nav pills 2×2 */}
          <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {navLinks.map(({ path, icon: NavIcon, label }) => (
              <NavLink key={path} to={path} className={`f-nav-pill${isActive(path) ? " active" : ""}`}>
                <NavIcon style={{ width: 14, height: 14, flexShrink: 0 }} />
                {label}
              </NavLink>
            ))}
          </div>

          {/* 3 link columns */}
          <div style={{ padding: "16px 16px 12px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, borderTop: "1.5px solid #ece9f8" }}>

            {/* Quick Links */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#0f0e17", margin: 0 }}>Quick Links</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {resourceLinks.map(({ path, label }) => (
                  <li key={path}>
                    <NavLink to={path} className={`f-link${isActive(path) ? " active" : ""}`} style={{ fontSize: 12 }}>
                      <ChevronRight className="chevron" style={{ width: 10, height: 10, color: "#5b3ef5" }} />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#0f0e17", margin: 0 }}>Company</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {companyLinks.map(({ path, label }) => (
                  <li key={path}>
                    <NavLink to={path} className={`f-link${isActive(path) ? " active" : ""}`} style={{ fontSize: 12 }}>
                      <ChevronRight className="chevron" style={{ width: 10, height: 10, color: "#5b3ef5" }} />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal & Support */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#0f0e17", margin: 0 }}>Legal</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {legalLinks.map(({ path, label, icon: Icon }) => (
                  <li key={path}>
                    <NavLink to={path} className={`f-link${isActive(path) ? " active" : ""}`} style={{ fontSize: 12 }}>
                      <Icon style={{ width: 11, height: 11, color: "#9d96c8", flexShrink: 0 }} />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </footer>
    </>
  );
}

export default Footer;