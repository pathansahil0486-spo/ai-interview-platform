import { TrendingUp, TrendingDown, Activity, Eye, Zap, MessageSquare } from "lucide-react";

function MetricCard({ label, value, unit, color, icon, sub, barValue }) {
  const getColor = (c) => ({
    green:  { text: "#4ade80", bar: "linear-gradient(90deg,#16a34a,#4ade80)",  glow: "rgba(74,222,128,0.18)"  },
    yellow: { text: "#facc15", bar: "linear-gradient(90deg,#ca8a04,#facc15)",  glow: "rgba(250,204,21,0.18)"  },
    red:    { text: "#f87171", bar: "linear-gradient(90deg,#dc2626,#f87171)",  glow: "rgba(248,113,113,0.18)" },
    blue:   { text: "#38bdf8", bar: "linear-gradient(90deg,#0284c7,#38bdf8)",  glow: "rgba(56,189,248,0.18)"  },
    purple: { text: "#c4b5fd", bar: "linear-gradient(90deg,#7c3aed,#c4b5fd)",  glow: "rgba(196,181,253,0.18)" },
  }[c] || { text: "#94a3b8", bar: "linear-gradient(90deg,#475569,#94a3b8)", glow: "rgba(148,163,184,0.1)" });

  const theme = getColor(color);

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      padding: "12px 14px",
      position: "relative",
      overflow: "hidden",
      width: "100%",
      boxSizing: "border-box",
    }}>
      {/* Corner glow */}
      <div style={{
        position: "absolute", top: 0, right: 0, width: 70, height: 70,
        background: `radial-gradient(circle at top right,${theme.glow},transparent)`,
        pointerEvents: "none",
      }} />

      {/* Top row: label + icon */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{
          fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600,
          textTransform: "uppercase", letterSpacing: "0.07em",
        }}>{label}</span>
        <div style={{ color: theme.text, opacity: 0.7 }}>{icon}</div>
      </div>

      {/* Value row */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 6 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: theme.text, lineHeight: 1 }}>
          {value}{unit && <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.7, marginLeft: 3 }}>{unit}</span>}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", marginBottom: 2, fontWeight: 500 }}>{sub}</div>
        )}
      </div>

      {/* Progress bar */}
      {barValue !== undefined && (
        <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${Math.min(barValue, 100)}%`,
            background: theme.bar, borderRadius: 3,
            transition: "width 0.6s ease",
          }} />
        </div>
      )}
    </div>
  );
}

export default function GestureAnalysis({ gestures, postureScore, analysis }) {
  const postureColor = postureScore >= 80 ? "green" : postureScore >= 60 ? "yellow" : "red";
  const eyeVal       = gestures?.eyeContact ?? 75;
  const eyeColor     = eyeVal >= 70 ? "blue" : "yellow";
  const confVal      = analysis?.confidence ?? 65;
  const confColor    = confVal >= 70 ? "green" : "yellow";
  const handGesture  = gestures?.handGestures || "Moderate";

  return (
    <div style={{
      background: "#111827",
      borderRadius: 14,
      padding: "10px 11px",
      fontFamily: "'Sora','Segoe UI',sans-serif",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      width: "100%",
      boxSizing: "border-box",
      overflow: "hidden",
    }}>
      <style>{`@keyframes ga-pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Activity style={{ width: 14, height: 14, color: "#38bdf8", flexShrink: 0 }} />
        <span style={{ color: "#fff", fontWeight: 600, fontSize: 12.5 }}>Real-time Analysis</span>
        <div style={{
          marginLeft: "auto", display: "flex", alignItems: "center", gap: 4,
          background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)",
          borderRadius: 20, padding: "3px 9px",
        }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", animation: "ga-pulse 2s infinite" }} />
          <span style={{ fontSize: 9, color: "#4ade80", fontWeight: 700, letterSpacing: "0.05em" }}>LIVE</span>
        </div>
      </div>

      {/* Cards stacked vertically — one per row, full width */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <MetricCard
          label="Posture" value={postureScore} unit="%" color={postureColor}
          icon={postureScore >= 70 ? <TrendingUp style={{ width: 14, height: 14 }} /> : <TrendingDown style={{ width: 14, height: 14 }} />}
          sub={postureScore >= 80 ? "Excellent" : postureScore >= 60 ? "Good" : "Sit upright"}
          barValue={postureScore}
        />
        <MetricCard
          label="Eye Contact" value={eyeVal} unit="%" color={eyeColor}
          icon={<Eye style={{ width: 14, height: 14 }} />}
          sub={eyeVal >= 70 ? "Strong contact" : "Look at camera"}
          barValue={eyeVal}
        />
        <MetricCard
          label="Gestures"
          value={typeof handGesture === "number" ? handGesture : "—"}
          color="purple"
          icon={<Zap style={{ width: 14, height: 14 }} />}
          sub={typeof handGesture === "string" ? handGesture : "Hand movement"}
        />
        <MetricCard
          label="Confidence" value={confVal} unit="%" color={confColor}
          icon={<MessageSquare style={{ width: 14, height: 14 }} />}
          sub="Speech analysis"
          barValue={confVal}
        />
      </div>

      {/* Live tip */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 7,
        padding: "9px 12px",
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#38bdf8", marginTop: 4, flexShrink: 0, animation: "ga-pulse 2s infinite" }} />
        <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.48)", margin: 0, lineHeight: 1.6 }}>
          <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Live Tip: </span>
          {analysis?.feedback || "Maintain good posture and keep eye contact with the camera."}
        </p>
      </div>
    </div>
  );
}