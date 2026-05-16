// Navbar.jsx — post-login navbar
import { Link, useLocation } from "react-router";
import {
  LayoutDashboardIcon, UserCheckIcon, BookOpenIcon, BookMarked,
  Home, Info, Phone, HelpCircle, MessageSquare, Menu, X,
} from "lucide-react";
import { UserButton } from "@clerk/clerk-react";
import { useState } from "react";

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap";
if (!document.head.querySelector('link[href*="Inter"]')) document.head.appendChild(fontLink);

const NAV_STYLES = `
  .sn-pub {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 10px; border-radius: 9px;
    font-size: 13px; font-weight: 500; color: #6b6893;
    text-decoration: none; white-space: nowrap;
    transition: background .15s, color .15s;
    font-family: 'Inter', sans-serif;
  }
  .sn-pub:hover { background: #f5f2ff; color: #5b3ef5; }
  .sn-pub.active { background: #ede8ff; color: #5b3ef5; font-weight: 600; }

  .sn-app {
    display: flex; align-items: center; gap: 7px;
    padding: 7px 12px; border-radius: 10px;
    font-size: 13px; font-weight: 600; color: #4b4869;
    text-decoration: none; white-space: nowrap;
    transition: background .18s, color .18s, box-shadow .18s;
    font-family: 'Inter', sans-serif;
  }
  .sn-app:hover { background: #f0eeff; color: #5b3ef5; }
  .sn-app.active {
    background: #5b3ef5; color: #fff;
    box-shadow: 0 4px 14px rgba(91,62,245,.35);
  }
  .sn-app.active svg { color: #fff !important; }

  .sn-mob-pub {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px; border-radius: 10px;
    font-size: 13.5px; font-weight: 500; color: #5b5882;
    text-decoration: none;
    transition: background .15s, color .15s;
    font-family: 'Inter', sans-serif;
  }
  .sn-mob-pub:hover { background: #f5f2ff; color: #5b3ef5; }
  .sn-mob-pub.active { background: #ede8ff; color: #5b3ef5; font-weight: 600; }

  .sn-mob-app {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 14px; border-radius: 12px;
    font-size: 14px; font-weight: 600; color: #4b4869;
    text-decoration: none;
    transition: background .15s, color .15s;
    font-family: 'Inter', sans-serif;
  }
  .sn-mob-app:hover { background: #f0eeff; color: #5b3ef5; }
  .sn-mob-app.active {
    background: linear-gradient(135deg,#5b3ef5,#7c3aed);
    color: #fff; box-shadow: 0 4px 16px rgba(91,62,245,.28);
  }
  .sn-mob-app.active svg { color: #fff !important; }

  .sn-ham {
    padding: 8px; border-radius: 10px; border: none; cursor: pointer;
    background: #f0eeff; color: #5b3ef5;
    transition: background .15s, transform .15s;
    display: flex; align-items: center; justify-content: center;
    width: 38px; height: 38px; flex-shrink: 0;
  }
  .sn-ham:hover { background: #e4d9ff; transform: scale(1.05); }

  .sn-lbl {
    font-size: 10px; font-weight: 800; letter-spacing: 0.1em;
    text-transform: uppercase; color: #9d96c8; padding: 4px 4px 6px; margin: 0;
    font-family: 'Inter', sans-serif;
  }

  @keyframes sn-slide {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .sn-drop { animation: sn-slide .2s ease both; }

  .sn-desktop { display: flex !important; }
  .sn-mobile  { display: none  !important; }
  @media (max-width: 960px) {
    .sn-desktop { display: none  !important; }
    .sn-mobile  { display: flex  !important; }
  }
`;

// ✅ Home points to /home (signed-in landing page)
const publicLinks = [
  { path: "/home",     icon: Home,          label: "Home"     },
  { path: "/about",    icon: Info,          label: "About"    },
  { path: "/contact",  icon: Phone,         label: "Contact"  },
  { path: "/help",     icon: HelpCircle,    label: "Help"     },
  { path: "/feedback", icon: MessageSquare, label: "Feedback" },
];

const appLinks = [
  { path: "/dashboard",   icon: LayoutDashboardIcon, label: "Dashboard"   },
  { path: "/interviews",  icon: UserCheckIcon,        label: "Interviews"  },
  { path: "/syllabus",    icon: BookMarked,           label: "Syllabus"    },
  { path: "/preparation", icon: BookOpenIcon,         label: "Preparation" },
];

const AvatarMenu = () => (
  <UserButton>
    <UserButton.MenuItems>
      <UserButton.Link label="My Profile" labelIcon={<span style={{ fontSize: 14 }}>👤</span>} href="/profile" />
      <UserButton.Action label="manageAccount" />
      <UserButton.Action label="signOut" />
    </UserButton.MenuItems>
  </UserButton>
);

function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const isActive = (path) =>
    path === "/home"
      ? location.pathname === "/home" || location.pathname === "/"
      : location.pathname.startsWith(path);

  return (
    <>
      <style>{NAV_STYLES}</style>
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(18px)",
        borderBottom: "1.5px solid #ece9f8",
        boxShadow: "0 2px 20px rgba(91,62,245,.07)",
      }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 20px" }}>

          {/* ══ DESKTOP ══ */}
          <div className="sn-desktop" style={{ alignItems: "center", justifyContent: "space-between", height: 60, gap: 8 }}>
            <Link to="/home" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, border: "1.5px solid #ece9f8", boxShadow: "0 2px 10px rgba(91,62,245,.12)", overflow: "hidden", flexShrink: 0 }}>
                <img src="/logo-new.png" alt="SMART InterviewAi" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
                <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.3px", background: "linear-gradient(90deg,#5b3ef5,#a855f7,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  SMART InterviewAi
                </span>
                <span style={{ fontSize: 10, color: "#9d96c8", fontWeight: 500, marginTop: 2 }}>Practice &amp; Improve</span>
              </div>
            </Link>

            <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, justifyContent: "center" }}>
              {publicLinks.map(({ path, icon: Icon, label }) => (
                <Link key={path} to={path} className={`sn-pub${isActive(path) ? " active" : ""}`}>
                  <Icon style={{ width: 12, height: 12 }} />{label}
                </Link>
              ))}
              <div style={{ width: 1, height: 18, background: "#ddd9f0", margin: "0 8px", flexShrink: 0 }} />
              {appLinks.map(({ path, icon: Icon, label }) => (
                <Link key={path} to={path} className={`sn-app${isActive(path) ? " active" : ""}`}>
                  <Icon style={{ width: 14, height: 14 }} />{label}
                </Link>
              ))}
            </div>

            <div style={{ flexShrink: 0 }}><AvatarMenu /></div>
          </div>

          {/* ══ MOBILE HEADER ══ */}
          <div className="sn-mobile" style={{ alignItems: "center", justifyContent: "space-between", height: 56 }}>
            <button className="sn-ham" onClick={() => setOpen(v => !v)} aria-label="Toggle menu">
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link to="/home" onClick={close} style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <img src="/logo-new.png" alt="SMART InterviewAi" style={{ width: 28, height: 28, borderRadius: 8, objectFit: "cover" }} />
              <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: "-0.2px", background: "linear-gradient(90deg,#5b3ef5,#a855f7,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                SMART InterviewAi
              </span>
            </Link>
            <div style={{ flexShrink: 0 }}><AvatarMenu /></div>
          </div>
        </div>

        {/* ══ MOBILE DROPDOWN ══ */}
        {open && (
          <div className="sn-drop" style={{
            borderTop: "1.5px solid #ece9f8",
            background: "rgba(255,255,255,0.98)",
            backdropFilter: "blur(18px)",
            padding: "12px 16px 20px",
            maxHeight: "calc(100vh - 56px)", overflowY: "auto",
          }}>
            <p className="sn-lbl">Pages</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 14 }}>
              {publicLinks.map(({ path, icon: Icon, label }) => {
                const active = isActive(path);
                return (
                  <Link key={path} to={path} onClick={close} className={`sn-mob-pub${active ? " active" : ""}`}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: active ? "#ede8ff" : "#f5f2ff" }}>
                      <Icon style={{ width: 15, height: 15, color: active ? "#5b3ef5" : "#8b85b8" }} />
                    </div>
                    {label}
                  </Link>
                );
              })}
            </div>
            <div style={{ height: 1, background: "#ece9f8", margin: "0 0 12px" }} />
            <p className="sn-lbl">App</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {appLinks.map(({ path, icon: Icon, label }) => {
                const active = isActive(path);
                return (
                  <Link key={path} to={path} onClick={close} className={`sn-mob-app${active ? " active" : ""}`}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: active ? "rgba(255,255,255,0.2)" : "#f0eeff" }}>
                      <Icon style={{ width: 17, height: 17, color: active ? "#fff" : "#5b3ef5" }} />
                    </div>
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

export default Navbar;