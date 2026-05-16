import { Link, useLocation } from "react-router";
import { 
  LayoutDashboardIcon, 
  UserCheckIcon, 
  BookOpenIcon,
  BookMarked,
  Menu,
  X
} from "lucide-react";
import { UserButton } from "@clerk/clerk-react";
import { useState } from "react";

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap";
if (!document.head.querySelector('link[href*="Inter"]')) document.head.appendChild(fontLink);

const NAV_STYLES = `
  .smart-nav * { font-family: 'Inter', sans-serif; box-sizing: border-box; }

  .nav-link {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 14px; border-radius: 10px;
    font-size: 13.5px; font-weight: 500;
    color: #4b4869; text-decoration: none;
    transition: background .18s, color .18s, box-shadow .18s;
    white-space: nowrap;
  }
  .nav-link:hover {
    background: #f0eeff; color: #5b3ef5;
  }
  .nav-link.active {
    background: #5b3ef5; color: #fff;
    box-shadow: 0 4px 14px rgba(91,62,245,.35);
  }
  .nav-link.active svg { color: #fff; }

  .mobile-link {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; border-radius: 10px;
    font-size: 13px; font-weight: 500;
    color: #4b4869; text-decoration: none;
    transition: background .15s, color .15s;
  }
  .mobile-link:hover { background: #f0eeff; color: #5b3ef5; }
  .mobile-link.active { background: #5b3ef5; color: #fff; box-shadow: 0 4px 14px rgba(91,62,245,.3); }

  .ham-btn {
    padding: 8px; border-radius: 10px; border: none; cursor: pointer;
    background: transparent; color: #4b4869;
    transition: background .15s, color .15s;
    display: flex; align-items: center; justify-content: center;
  }
  .ham-btn:hover { background: #f0eeff; color: #5b3ef5; }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .mobile-dropdown { animation: slideDown .18s ease both; }
`;

function Navbar() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: "/dashboard",   icon: LayoutDashboardIcon, label: "Dashboard"   },
    { path: "/interviews",  icon: UserCheckIcon,        label: "Interviews"  },
    { path: "/syllabus",    icon: BookMarked,           label: "Syllabus"    },
    { path: "/preparation", icon: BookOpenIcon,         label: "Preparation" },
  ];

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu  = () => setIsMobileMenuOpen(false);

  return (
    <>
      <style>{NAV_STYLES}</style>
      <nav className="smart-nav" style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1.5px solid #ece9f8",
        boxShadow: "0 2px 20px rgba(91,62,245,.07)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>

          {/* ── DESKTOP ── */}
          <div style={{ display: "none", alignItems: "center", justifyContent: "space-between", height: 64 }}
            className="desktop-nav"
          >
            {/* inline media query workaround — use a wrapper div with CSS */}
          </div>

          {/* We use a single flex row and hide via inline style + class */}
          <DesktopNav navLinks={navLinks} isActive={isActive} />
          <MobileHeader
            isMobileMenuOpen={isMobileMenuOpen}
            toggleMobileMenu={toggleMobileMenu}
            closeMobileMenu={closeMobileMenu}
          />

          {/* ── MOBILE DROPDOWN ── */}
          {isMobileMenuOpen && (
            <div className="mobile-dropdown" style={{
              borderTop: "1.5px solid #ece9f8",
              padding: "8px 0 12px",
              background: "rgba(255,255,255,.97)",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={closeMobileMenu}
                      className={`mobile-link${isActive(link.path) ? " active" : ""}`}
                    >
                      <Icon style={{ width: 15, height: 15 }} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </nav>
    </>
  );
}

function DesktopNav({ navLinks, isActive }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", height: 64,
    }} className="hidden-mobile">
      <style>{`.hidden-mobile { display: flex !important; } @media(max-width:767px){.hidden-mobile{display:none !important;}}`}</style>

      {/* Logo */}
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          border: "1.5px solid #ece9f8",
          boxShadow: "0 2px 10px rgba(91,62,245,.12)",
          overflow: "hidden", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
        <img src="/logo-new.png" alt="SMART InterviewAi Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span style={{
            fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 16,
            letterSpacing: "-0.3px",
            background: "linear-gradient(90deg,#5b3ef5,#a855f7,#ec4899)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            SMART InterviewAi
          </span>
          <span style={{ fontSize: 11, color: "#9d96c8", fontWeight: 500, marginTop: 2 }}>
            Practice &amp; Improve
          </span>
        </div>
      </Link>

      {/* Nav links + avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.path} to={link.path} className={`nav-link${isActive(link.path) ? " active" : ""}`}>
              <Icon style={{ width: 15, height: 15 }} />
              {link.label}
            </Link>
          );
        })}
        <div style={{ marginLeft: 12 }}>
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Link label="My Profile" labelIcon={<span style={{ fontSize: 14 }}>👤</span>} href="/profile" />
              <UserButton.Action label="manageAccount" />
              <UserButton.Action label="signOut" />
            </UserButton.MenuItems>
          </UserButton>
        </div>
      </div>
    </div>
  );
}

function MobileHeader({ isMobileMenuOpen, toggleMobileMenu, closeMobileMenu }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }} className="hidden-desktop">
      <style>{`.hidden-desktop{display:flex !important;} @media(min-width:768px){.hidden-desktop{display:none !important;}}`}</style>

      <button className="ham-btn" onClick={toggleMobileMenu} aria-label="Toggle menu">
        {isMobileMenuOpen
          ? <X style={{ width: 22, height: 22 }} />
          : <Menu style={{ width: 22, height: 22 }} />}
      </button>

      <Link to="/" onClick={closeMobileMenu} style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", marginLeft: 8, marginRight: "auto" }}>
       <img src="/logo-new.png" alt="SMART InterviewAi Logo" style={{ width: 30, height: 30, borderRadius: 8, objectFit: "cover" }} />
        <span style={{
          fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 14, letterSpacing: "-0.2px",
          background: "linear-gradient(90deg,#5b3ef5,#a855f7,#ec4899)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          SMART InterviewAi
        </span>
      </Link>

      <UserButton>
        <UserButton.MenuItems>
          <UserButton.Link label="My Profile" labelIcon={<span style={{ fontSize: 14 }}>👤</span>} href="/profile" />
          <UserButton.Action label="manageAccount" />
          <UserButton.Action label="signOut" />
        </UserButton.MenuItems>
      </UserButton>
    </div>
  );
}

export default Navbar;