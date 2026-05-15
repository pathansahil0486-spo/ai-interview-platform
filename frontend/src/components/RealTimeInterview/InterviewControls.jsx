import { Video, VideoOff, Play, Square, Wifi, WifiOff, Camera, Shield, CheckCircle } from "lucide-react";

export default function InterviewControls({
  interviewStarted, interviewStatus,
  isVideoEnabled, onToggleVideo,
  onStartInterview, onEndInterview,
  onForceStopCamera,
  connectionStatus, warningCount = 0,
  compact = false,
}) {
  const isConnected = connectionStatus === "connected" || connectionStatus === "ready";
  const isActive    = interviewStatus === "active";
  const isDone      = interviewStatus === "completed";
  const isPending   = interviewStatus === "pending";

  /* ── COMPACT horizontal bar (mobile) ─────────────────────────── */
  if (compact) {
    return (
      <div style={{
        background: "#0a0e18", borderRadius: 8, padding: "3px 7px",
        display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4,
        fontFamily: "'Sora','Segoe UI',sans-serif",
        border: "1px solid rgba(255,255,255,0.05)",
      }}>
        <CPill color={isConnected ? "green" : "amber"} dot
          label={connectionStatus === "ready" ? "AI Ready" : connectionStatus === "connected" ? "Connected" : connectionStatus === "connecting" ? "Connecting…" : "Error"}
        />
        {warningCount > 0 && <CPill color="red" label={`⚠ ${warningCount}`} />}
        {interviewStarted && <CBtn onClick={onToggleVideo} active={isVideoEnabled} icon={isVideoEnabled ? VideoOff : Video} label={isVideoEnabled ? "Cam Off" : "Cam On"} />}
        {interviewStarted && !isVideoEnabled && onForceStopCamera && <CBtn onClick={onForceStopCamera} variant="orange" icon={Camera} label="Release" />}
        <div style={{ flex: 1 }} />
        {!interviewStarted && isPending && (
          <CAction onClick={onStartInterview} disabled={connectionStatus === "connecting"} color="green" icon={Play}
            label={connectionStatus === "connecting" ? "Connecting…" : "Start"}
          />
        )}
        {isActive && <CAction onClick={onEndInterview} color="red" icon={Square} label="End" />}
        {isDone && <CPill color="green" label="✓ Done" />}
      </div>
    );
  }

  /* ── FULL vertical panel (desktop) ── ultra compact, no scroll ─ */
  return (
    <div style={{
      background: "#0a0e18",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Sora','Segoe UI',sans-serif",
      border: "1px solid rgba(255,255,255,0.05)",
      borderRadius: 10,
      overflow: "hidden",
      boxSizing: "border-box",
    }}>
      <style>{`
        .icbtn{cursor:pointer;border:none;border-radius:6px;font-size:9.5px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:3px;transition:all 0.14s;font-family:inherit;}
        .icbtn:hover:not(:disabled){filter:brightness(1.12);}
        .icbtn:disabled{opacity:0.35;cursor:not-allowed;}
        .icbtn:active:not(:disabled){transform:scale(0.97);}
      `}</style>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "5px 7px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0,
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: 5, flexShrink: 0,
          background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Shield style={{ width: 9, height: 9, color: "#818cf8" }} />
        </div>
        <div>
          <p style={{ color: "#fff", fontWeight: 700, fontSize: 10, margin: 0, lineHeight: 1.2 }}>Controls</p>
          <p style={{ color: "rgba(255,255,255,0.22)", fontSize: 7.5, margin: 0 }}>
            {isActive ? "In progress" : isPending ? "Ready" : "Ended"}
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: "5px 6px", display: "flex", flexDirection: "column", gap: 3, minHeight: 0 }}>

        {/* Connection */}
        <MiniRow
          label="Connection"
          isOk={isConnected}
          text={isConnected ? (connectionStatus === "ready" ? "AI Ready" : "Connected") : connectionStatus === "connecting" ? "Connecting…" : "Error"}
          icon={isConnected ? Wifi : WifiOff}
        />

        {/* Violations */}
        {warningCount > 0 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "2px 6px",
            background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 5,
          }}>
            <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.28)" }}>Violations</span>
            <span style={{ fontSize: 8.5, fontWeight: 700, color: "#f87171" }}>⚠️ {warningCount}</span>
          </div>
        )}

        {/* Device dots */}
        <div style={{
          display: "flex", gap: 4, padding: "3px 6px",
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 5,
        }}>
          <DDot active={interviewStarted && isVideoEnabled} label="Camera" />
          <DDot active={isConnected} label="Network" />
        </div>

        {/* Camera toggle */}
        {interviewStarted && (
          <button className="icbtn" onClick={onToggleVideo} style={{
            padding: "5px 4px", width: "100%",
            background: isVideoEnabled ? "rgba(239,68,68,0.08)" : "rgba(74,222,128,0.07)",
            border: `1px solid ${isVideoEnabled ? "rgba(239,68,68,0.2)" : "rgba(74,222,128,0.15)"}`,
            color: isVideoEnabled ? "#f87171" : "#4ade80",
          }}>
            {isVideoEnabled
              ? <><VideoOff style={{ width: 8, height: 8 }} />Cam Off</>
              : <><Video style={{ width: 8, height: 8 }} />Cam On</>}
          </button>
        )}

        {interviewStarted && !isVideoEnabled && onForceStopCamera && (
          <button className="icbtn" onClick={onForceStopCamera} style={{
            padding: "4px", width: "100%",
            background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", color: "#fb923c",
          }}>
            <Camera style={{ width: 8, height: 8 }} /> Release Cam
          </button>
        )}

        <div style={{ flex: 1 }} />

        {/* Primary action */}
        {!interviewStarted && isPending && (
          <button className="icbtn" onClick={onStartInterview} disabled={connectionStatus === "connecting"} style={{
            padding: "8px 8px", width: "100%", fontSize: 10.5,
            background: "linear-gradient(135deg,#16a34a,#15803d)", color: "#fff",
            boxShadow: "0 2px 10px rgba(22,163,74,0.2)",
          }}>
            <Play style={{ width: 10, height: 10 }} />
            {connectionStatus === "connecting" ? "Connecting…" : "Start Interview"}
          </button>
        )}
        {isActive && (
          <button className="icbtn" onClick={onEndInterview} style={{
            padding: "8px 8px", width: "100%", fontSize: 10.5,
            background: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#fff",
            boxShadow: "0 2px 10px rgba(220,38,38,0.16)",
          }}>
            <Square style={{ width: 10, height: 10 }} /> End Interview
          </button>
        )}
        {isDone && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            padding: "6px", borderRadius: 6, fontSize: 9.5, fontWeight: 700,
            background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.15)", color: "#34d399",
          }}>
            <CheckCircle style={{ width: 9, height: 9 }} /> Completed
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "3px 7px 4px", borderTop: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
        <p style={{ fontSize: 7.5, color: "rgba(255,255,255,0.13)", lineHeight: 1.4, margin: 0, textAlign: "center" }}>
          {!interviewStarted ? "Allow camera & mic before starting." : "Tab switching is monitored."}
        </p>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function MiniRow({ label, isOk, text, icon: Icon }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "3px 6px",
      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 5,
    }}>
      <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.25)" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 3, color: isOk ? "#4ade80" : "#facc15" }}>
        <Icon style={{ width: 8, height: 8 }} />
        <span style={{ fontSize: 8.5, fontWeight: 700 }}>{text}</span>
      </div>
    </div>
  );
}

function DDot({ active, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, flex: 1 }}>
      <span style={{
        width: 4, height: 4, borderRadius: "50%", flexShrink: 0,
        background: active ? "#34d399" : "#1f2937",
        boxShadow: active ? "0 0 4px rgba(52,211,153,0.5)" : "none",
        transition: "all 0.3s",
      }} />
      <span style={{ fontSize: 8, color: "rgba(255,255,255,0.18)", fontWeight: 600 }}>{label}</span>
    </div>
  );
}

/* ── Compact-mode helpers ── */
const pstyle = (color) => {
  const m = {
    green:  { bg: "rgba(74,222,128,0.09)",  b: "rgba(74,222,128,0.24)",  t: "#4ade80"  },
    amber:  { bg: "rgba(251,191,36,0.09)",  b: "rgba(251,191,36,0.24)",  t: "#fbbf24"  },
    red:    { bg: "rgba(239,68,68,0.09)",   b: "rgba(239,68,68,0.24)",   t: "#f87171"  },
    orange: { bg: "rgba(249,115,22,0.09)",  b: "rgba(249,115,22,0.24)",  t: "#fb923c"  },
  };
  const c = m[color] || m.amber;
  return {
    display: "inline-flex", alignItems: "center", gap: 3,
    padding: "2px 5px", borderRadius: 9999,
    background: c.bg, border: `1px solid ${c.b}`, color: c.t,
    fontSize: 8.5, fontWeight: 700, fontFamily: "inherit", cursor: "default",
  };
};

function CPill({ color, label, dot }) {
  return (
    <div style={pstyle(color)}>
      {dot && <span style={{ width: 3, height: 3, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />}
      {label}
    </div>
  );
}

function CBtn({ onClick, icon: Icon, label, active, variant }) {
  const m = {
    active:   { bg: "rgba(239,68,68,0.1)",   b: "rgba(239,68,68,0.26)",   t: "#f87171" },
    inactive: { bg: "rgba(74,222,128,0.07)",  b: "rgba(74,222,128,0.22)",  t: "#4ade80" },
    orange:   { bg: "rgba(249,115,22,0.09)",  b: "rgba(249,115,22,0.26)",  t: "#fb923c" },
  };
  const c = variant === "orange" ? m.orange : active ? m.active : m.inactive;
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "2px 6px", borderRadius: 9999,
      background: c.bg, border: `1px solid ${c.b}`, color: c.t,
      fontSize: 8.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.13s",
    }}>
      <Icon style={{ width: 8, height: 8 }} />{label}
    </button>
  );
}

function CAction({ onClick, icon: Icon, label, color, disabled }) {
  const isG = color === "green";
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "3px 8px", borderRadius: 6, border: "none",
      background: isG ? "linear-gradient(135deg,#16a34a,#15803d)" : "linear-gradient(135deg,#dc2626,#b91c1c)",
      color: "#fff", fontSize: 9.5, fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1,
      fontFamily: "inherit", transition: "all 0.14s", flexShrink: 0,
    }}>
      <Icon style={{ width: 8, height: 8 }} />{label}
    </button>
  );
}