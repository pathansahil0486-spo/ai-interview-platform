import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useUser } from "@clerk/clerk-react";
import {
  MessageSquare, Star, ThumbsUp, ThumbsDown,
  Send, CheckCircle, Sparkles, Zap, Bug, Lightbulb, Heart,
  TrendingUp, Users, Award, Clock, ArrowRight, Shield, Loader2
} from "lucide-react";
import emailjs from "@emailjs/browser";
import toast from "react-hot-toast";
import HomeNav from "../components/HomeNav";
import Footer from "../components/Footer";

const EMAILJS_SERVICE_ID           = import.meta.env.VITE_EMAILJS_SERVICE_ID            || "YOUR_SERVICE_ID";
const EMAILJS_FEEDBACK_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_FEEDBACK_TEMPLATE_ID  || "YOUR_FEEDBACK_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY           = import.meta.env.VITE_EMAILJS_PUBLIC_KEY            || "YOUR_PUBLIC_KEY";
const API_URL                      = import.meta.env.VITE_API_URL                        || "http://localhost:5000/api";

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

  .fp * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
  .fp { min-height: 100vh; background: #f7f6fb; }

  /* ── Typography ── */
  .fp-display { font-family: 'Sora', sans-serif; }

  /* ── Layout ── */
  .fp-wrap { max-width: 1060px; margin: 0 auto; padding: 52px 24px 96px; }
  .fp-grid { display: grid; grid-template-columns: 1fr 380px; gap: 28px; align-items: start; }

  /* ── Cards ── */
  .fp-card {
    background: #fff;
    border: 1px solid #e8e5f4;
    border-radius: 22px;
    box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 6px 24px rgba(91,62,245,.04);
  }

  /* ── Stats bar ── */
  .fp-stats {
    display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 28px;
  }
  .fp-stat {
    background:#fff; border:1px solid #e8e5f4; border-radius:16px;
    padding:18px 16px; display:flex; flex-direction:column; gap:6px;
    box-shadow:0 1px 3px rgba(0,0,0,.04);
  }
  .fp-stat-icon { width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center; margin-bottom:2px;}
  .fp-stat-val { font-family:'Sora',sans-serif; font-size:22px; font-weight:800; color:#0f0e17; line-height:1; }
  .fp-stat-label { font-size:12px; color:#7c7996; font-weight:500; }
  .fp-stat-delta { font-size:11px; font-weight:600; display:flex;align-items:center;gap:3px; }

  /* ── Form internals ── */
  .fp-section-title {
    font-family:'Sora',sans-serif; font-size:13px; font-weight:700;
    color:#2d2b3d; letter-spacing:.3px; margin-bottom:12px;
    display:flex;align-items:center;gap:7px;
  }
  .fp-section-title span { width:4px;height:16px;background:#5b3ef5;border-radius:2px;display:inline-block; }

  .fp-textarea {
    width:100%; padding:14px 16px; border-radius:14px;
    border:1.5px solid #e8e5f4; background:#faf9fd;
    font-size:14px; font-family:'DM Sans',sans-serif; color:#0f0e17; line-height:1.6;
    outline:none; transition:border-color .18s,box-shadow .18s; resize:vertical; min-height:130px;
  }
  .fp-textarea:focus { border-color:#5b3ef5; box-shadow:0 0 0 3px rgba(91,62,245,.09); background:#fff; }
  .fp-textarea::placeholder { color:#b0accc; }

  /* ── Mood chips ── */
  .mood-row { display:flex; gap:10px; flex-wrap:wrap; }
  .mood-chip {
    flex:1; min-width:calc(33.333% - 7px); display:flex; flex-direction:column; align-items:center; gap:5px;
    padding:12px 8px; border-radius:14px; cursor:pointer;
    border:1.5px solid #e8e5f4; background:#faf9fd;
    transition:all .16s; font-family:'DM Sans',sans-serif; user-select:none;
  }
  .mood-chip:hover { border-color:#5b3ef5; background:#f3f0ff; transform:translateY(-2px); }
  .mood-chip.active { border-color:#5b3ef5; background:#f0eeff; box-shadow:0 4px 14px rgba(91,62,245,.15); }
  .mood-emoji { font-size:22px; line-height:1; }
  .mood-text { font-size:10px; font-weight:600; color:#7c7996; }
  .mood-chip.active .mood-text { color:#5b3ef5; }

  /* ── Type pills ── */
  .type-row { display:flex; flex-wrap:wrap; gap:8px; }
  .type-pill {
    display:flex;align-items:center;gap:7px;
    padding:8px 14px; border-radius:99px;
    border:1.5px solid #e8e5f4; background:#faf9fd;
    font-size:12px; font-weight:600; color:#5a566e; cursor:pointer;
    transition:all .16s; user-select:none;
  }
  .type-pill:hover { border-color:#5b3ef5; color:#5b3ef5; background:#f3f0ff; }
  .type-pill.active { border-color:#5b3ef5; color:#5b3ef5; background:#f0eeff; box-shadow:0 2px 10px rgba(91,62,245,.12); }
  .type-pill svg { width:13px;height:13px; }

  /* ── Stars ── */
  .star-row { display:flex;gap:4px;align-items:center; }
  .star-btn { background:none;border:none;cursor:pointer;padding:2px;line-height:0;transition:transform .12s; }
  .star-btn:hover { transform:scale(1.15); }

  /* ── Submit ── */
  .fp-submit {
    width:100%; padding:14px; border-radius:14px; border:none; cursor:pointer;
    background:linear-gradient(135deg,#4f35e0,#7c56f5);
    color:#fff; font-size:15px; font-weight:700; letter-spacing:.2px;
    font-family:'Sora',sans-serif;
    display:flex;align-items:center;justify-content:center;gap:9px;
    box-shadow:0 8px 24px rgba(91,62,245,.35);
    transition:transform .2s,box-shadow .2s;
  }
  .fp-submit:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 14px 32px rgba(91,62,245,.45); }
  .fp-submit:disabled { opacity:.6;cursor:not-allowed; }

  /* ── Rating bar ── */
  .rating-bar-track { height:5px;background:#ede9ff;border-radius:99px;flex:1;overflow:hidden; }
  .rating-bar-fill { height:100%;background:linear-gradient(90deg,#5b3ef5,#a78bfa);border-radius:99px;transition:width .4s cubic-bezier(.4,0,.2,1); }

  /* ── Community feed ── */
  .feed-item { padding:14px 0; border-bottom:1px solid #f0eef8; }
  .feed-item:last-child { border-bottom:none; padding-bottom:0; }
  .feed-avatar { width:30px;height:30px;border-radius:50%;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
  .feed-badge { font-size:10px;font-weight:700;border-radius:99px;padding:2px 8px;text-transform:capitalize; }

  /* ── Dark promo card ── */
  .fp-promo {
    background:linear-gradient(145deg,#13112a,#1e1740);
    border-radius:22px; padding:26px 22px; position:relative; overflow:hidden;
    border:1px solid rgba(91,62,245,.3);
  }
  .fp-promo::before {
    content:''; position:absolute; inset:0;
    background:radial-gradient(ellipse at 80% 0%,rgba(91,62,245,.25) 0%,transparent 60%),
               radial-gradient(ellipse at 20% 100%,rgba(168,85,247,.15) 0%,transparent 50%);
  }

  /* ── Gradient text ── */
  .grad { background:linear-gradient(90deg,#5b3ef5,#a855f7,#e879f9); -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }

  /* ── Divider ── */
  .fp-divider { height:1px;background:linear-gradient(90deg,transparent,#e8e5f4,transparent);margin:20px 0; }

  /* ── Character count ── */
  .char-count { font-size:11px;color:#b0accc;font-weight:500;text-align:right;margin-top:5px; }
  .char-count.warn { color:#f59e0b; }
  .char-count.ok   { color:#16a34a; }

  /* ── Success state ── */
  .fp-success { text-align:center;padding:44px 16px; }
  .fp-success-ring { width:72px;height:72px;border-radius:22px;background:linear-gradient(135deg,#f0eeff,#e4deff);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;box-shadow:0 8px 24px rgba(91,62,245,.18); }

  /* ── Loading skeleton ── */
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .skeleton {
    background: linear-gradient(90deg,#f0eef8 25%,#e8e5f4 37%,#f0eef8 63%);
    background-size: 400px 100%;
    animation: shimmer 1.4s ease infinite;
    border-radius: 8px;
  }

  /* ── Animations ── */
  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.8)} }
  .fade-up { animation:fadeUp .5s ease both; }
  .fade-up-1 { animation:fadeUp .5s .08s ease both; }
  .fade-up-2 { animation:fadeUp .5s .16s ease both; }
  .fade-up-3 { animation:fadeUp .5s .24s ease both; }
  .spinner { width:16px;height:16px;border:2.5px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin 1s linear infinite; }
  .live-dot { width:7px;height:7px;background:#16a34a;border-radius:50%;animation:pulse-dot 1.8s ease infinite;display:inline-block; }

  /* ── Responsive ── */
  @media(max-width:860px){
    .fp-grid { grid-template-columns:1fr; }
    .fp-stats { grid-template-columns:repeat(2,1fr); }
    .fp-hero h1 { font-size:30px !important; }
  }
  @media(max-width:600px){
    .fp-wrap { padding:32px 16px 72px; }
    .fp-stats { grid-template-columns:1fr 1fr; }
    .fp-hero h1 { font-size:26px !important; }
    .fp-card { border-radius:16px; }
    .fp-promo { border-radius:16px; }
    .mood-chip { min-width:calc(33% - 7px); }
  }
  @media(max-width:420px){
    .fp-stats { grid-template-columns:1fr; }
    .fp-wrap { padding:24px 12px 60px; }
    .mood-chip { min-width:calc(50% - 5px); }
    .fp-hero h1 { font-size:22px !important; }
  }
`;

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const MOOD_MAP = {
  love:    { emoji: "😍", label: "Love it"    },
  good:    { emoji: "😊", label: "Happy"      },
  neutral: { emoji: "😐", label: "Neutral"    },
  meh:     { emoji: "😕", label: "Meh"        },
  bad:     { emoji: "😤", label: "Frustrated" },
};

const TYPE_COLOR_MAP = {
  feature:     { color: "#d97706", bg: "#fffbeb" },
  bug:         { color: "#dc2626", bg: "#fff1f2" },
  compliment:  { color: "#16a34a", bg: "#f0fdf4" },
  improvement: { color: "#5b3ef5", bg: "#f0eeff" },
  general:     { color: "#7c7996", bg: "#f5f4fb" },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins} min ago`;
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join("") || "?";
}

// deterministic colour from string
const AVATAR_COLORS = [
  { color: "#5b3ef5", bg: "#f0eeff" },
  { color: "#e879f9", bg: "#fdf4ff" },
  { color: "#0ea5e9", bg: "#f0f9ff" },
  { color: "#f59e0b", bg: "#fffbeb" },
  { color: "#16a34a", bg: "#f0fdf4" },
  { color: "#dc2626", bg: "#fff1f2" },
];
function avatarColor(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

/* ─── Data ────────────────────────────────────────────────────────────────── */
const MOODS = [
  { emoji: "😍", label: "Love it",    value: "love"    },
  { emoji: "😊", label: "Happy",      value: "good"    },
  { emoji: "😐", label: "Neutral",    value: "neutral" },
  { emoji: "😕", label: "Meh",        value: "meh"     },
  { emoji: "😤", label: "Frustrated", value: "bad"     },
];

const TYPES = [
  { icon: Lightbulb, label: "Feature Request", value: "feature"     },
  { icon: Bug,       label: "Bug Report",       value: "bug"         },
  { icon: ThumbsUp,  label: "Compliment",       value: "compliment"  },
  { icon: Zap,       label: "Improvement",      value: "improvement" },
  { icon: Heart,     label: "General",          value: "general"     },
];

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function FeedbackPage() {
  const { user } = useUser();

  // form state
  const [mood,    setMood]    = useState("");
  const [type,    setType]    = useState("");
  const [stars,   setStars]   = useState(0);
  const [hover,   setHover]   = useState(0);
  const [msg,     setMsg]     = useState("");
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);

  // real data
  const [stats,      setStats]      = useState(null);
  const [community,  setCommunity]  = useState([]);
  const [loadingStats, setLoadingStats]     = useState(true);
  const [loadingFeed,  setLoadingFeed]      = useState(true);

  const charLimit = 1200;
  const charColor = msg.length > charLimit ? "warn" : msg.length >= 20 ? "ok" : "";

  // Fetch stats + community on mount
  useEffect(() => {
    fetch(`${API_URL}/feedback/stats`)
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data); })
      .catch(() => {})
      .finally(() => setLoadingStats(false));

    fetch(`${API_URL}/feedback/community?limit=6`)
      .then(r => r.json())
      .then(d => { if (d.success) setCommunity(d.data); })
      .catch(() => {})
      .finally(() => setLoadingFeed(false));
  }, []);

  // Refetch community after a successful submission so own entry appears
  const refetchCommunity = () => {
    fetch(`${API_URL}/feedback/community?limit=6`)
      .then(r => r.json())
      .then(d => { if (d.success) setCommunity(d.data); })
      .catch(() => {});

    fetch(`${API_URL}/feedback/stats`)
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data); })
      .catch(() => {});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!msg.trim() || msg.length < 10) {
      toast.error("Please write at least 10 characters.");
      return;
    }
    setSending(true);

    const templateParams = {
      user_name:   user?.fullName || user?.firstName || "Anonymous",
      user_email:  user?.primaryEmailAddress?.emailAddress || "—",
      user_id:     user?.id || "anonymous",
      mood:        mood  || "not selected",
      type:        type  || "not selected",
      stars:       stars > 0 ? `${stars} / 5` : "not rated",
      message:     msg,
      submitted_at: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    };

    try {
      // 1. Send email via EmailJS
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_FEEDBACK_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      // 2. Persist to MongoDB
      await fetch(`${API_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId:    user?.id || "anonymous",
          userName:  templateParams.user_name,
          userEmail: templateParams.user_email,
          mood:      mood  || "not selected",
          type:      type  || "not selected",
          stars:     stars || 0,
          message:   msg,
        }),
      });

      setSending(false);
      setSent(true);
      toast.success("Feedback received! Thank you 🙌");
      refetchCommunity();
    } catch (err) {
      console.error(err);
      toast.error("Submission failed. Please try again.");
      setSending(false);
    }
  };

  const reset = () => {
    setSent(false);
    setMood("");
    setType("");
    setStars(0);
    setMsg("");
  };

  // ── Stat cards derived from real data ──────────────────────────────────────
  const statCards = [
    {
      icon: MessageSquare,
      label: "Total Feedbacks",
      value: loadingStats ? null : stats ? stats.total.toLocaleString() : "—",
      delta: "all time",
      color: "#5b3ef5", bg: "#f0eeff",
    },
    {
      icon: Star,
      label: "Avg Rating",
      value: loadingStats ? null : stats ? stats.avgRating.toString() : "—",
      delta: `from ${loadingStats ? "…" : stats ? stats.ratedCount.toLocaleString() : 0} ratings`,
      color: "#f59e0b", bg: "#fffbeb",
    },
    {
      icon: Users,
      label: "Rated Entries",
      value: loadingStats ? null : stats ? stats.ratedCount.toLocaleString() : "—",
      delta: "with star rating",
      color: "#0ea5e9", bg: "#f0f9ff",
    },
    {
      icon: Clock,
      label: "Response Time",
      value: "< 48h",
      delta: "avg reply time",
      color: "#16a34a", bg: "#f0fdf4",
    },
  ];

  return (
    <>
      <style>{STYLES}</style>
      <div className="fp">
        <HomeNav />
        <main className="fp-wrap">

          {/* ── Hero ── */}
          <section className="fp-hero fade-up" style={{ textAlign:"center", marginBottom:40 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:"#f0eeff", border:"1.5px solid #d8d0f8", borderRadius:99, padding:"5px 14px", marginBottom:16 }}>
              <span className="live-dot" />
              <span style={{ fontSize:12, fontWeight:700, color:"#5b3ef5", fontFamily:"'Sora',sans-serif" }}>Live Feedback Board</span>
            </div>
            <h1 className="fp-display" style={{ fontSize:40, fontWeight:800, color:"#0f0e17", lineHeight:1.1, letterSpacing:"-1.2px", marginBottom:12 }}>
              Help us <span className="grad">build smarter</span>
            </h1>
            <p style={{ fontSize:15, color:"#7c7996", maxWidth:460, margin:"0 auto", lineHeight:1.75 }}>
              Every piece of feedback ships into the product. Tell us what delights you, frustrates you, or what you wish existed.
            </p>
          </section>

          {/* ── Stats row ── */}
          <div className="fp-stats fade-up-1">
            {statCards.map(({ icon: Icon, label, value, delta, color, bg }) => (
              <div className="fp-stat" key={label}>
                <div className="fp-stat-icon" style={{ background: bg }}>
                  <Icon style={{ width:15, height:15, color }} />
                </div>
                {value === null
                  ? <div className="skeleton" style={{ height:22, width:60 }} />
                  : <div className="fp-stat-val">{value}</div>
                }
                <div className="fp-stat-label">{label}</div>
                <div className="fp-stat-delta" style={{ color: "#7c7996" }}>{delta}</div>
              </div>
            ))}
          </div>

          {/* ── Main grid ── */}
          <div className="fp-grid fade-up-2">

            {/* ── Form card ── */}
            <div className="fp-card" style={{ padding:"32px 30px" }}>
              {sent ? (
                <div className="fp-success">
                  <div className="fp-success-ring">
                    <CheckCircle style={{ width:32, height:32, color:"#5b3ef5" }} />
                  </div>
                  <h2 className="fp-display" style={{ fontSize:22, fontWeight:800, color:"#0f0e17", marginBottom:10 }}>
                    Thank you so much! 🙌
                  </h2>
                  <p style={{ fontSize:14, color:"#7c7996", lineHeight:1.7, maxWidth:360, margin:"0 auto 10px" }}>
                    We've received your feedback and will review it within 48 hours. If you left an email, expect a personal reply.
                  </p>
                  <div style={{ display:"flex", alignItems:"center", gap:6, justifyContent:"center", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:"9px 16px", width:"fit-content", margin:"18px auto 26px" }}>
                    <Shield style={{ width:13, height:13, color:"#16a34a" }} />
                    <span style={{ fontSize:12, fontWeight:600, color:"#15803d" }}>Your feedback is private and secure</span>
                  </div>
                  <button onClick={reset} style={{ background:"#f0eeff", border:"1.5px solid #d8d0f8", borderRadius:12, padding:"10px 26px", color:"#5b3ef5", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"'Sora',sans-serif", transition:"background .15s" }}>
                    Submit another →
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:26 }}>

                  {/* Mood */}
                  <div>
                    <div className="fp-section-title"><span />How are you feeling about SMART InterviewAI?</div>
                    <div className="mood-row">
                      {MOODS.map(({ emoji, label, value }) => (
                        <div key={value} className={`mood-chip${mood===value?" active":""}`} onClick={() => setMood(value)}>
                          <span className="mood-emoji">{emoji}</span>
                          <span className="mood-text">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <div className="fp-section-title"><span />Overall rating</div>
                    <div className="star-row">
                      {[1,2,3,4,5].map(s => (
                        <button key={s} type="button" className="star-btn"
                          onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
                          onClick={() => setStars(s)}>
                          <Star style={{ width:30, height:30, transition:"color .1s,fill .1s",
                            color: s<=(hover||stars) ? "#f59e0b" : "#e8e5f4",
                            fill:  s<=(hover||stars) ? "#f59e0b" : "none" }} />
                        </button>
                      ))}
                      {stars > 0 && (
                        <span style={{ fontSize:13, fontWeight:700, color:"#f59e0b", marginLeft:8, fontFamily:"'Sora',sans-serif" }}>
                          {["","Poor","Fair","Good","Great","Excellent!"][stars]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Type */}
                  <div>
                    <div className="fp-section-title"><span />Feedback category</div>
                    <div className="type-row">
                      {TYPES.map(({ icon: Icon, label, value }) => (
                        <div key={value} className={`type-pill${type===value?" active":""}`} onClick={() => setType(value)}>
                          <Icon />{label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <div className="fp-section-title"><span />Your feedback <span style={{ color:"#ef4444", fontFamily:"'DM Sans'" }}></span></div>
                    <textarea
                      className="fp-textarea"
                      value={msg}
                      onChange={e => setMsg(e.target.value.slice(0, charLimit))}
                      placeholder="Tell us what you think — what works, what doesn't, what you wish existed…"
                      rows={5}
                    />
                    <div className={`char-count ${charColor}`}>{msg.length} / {charLimit}</div>
                  </div>

                  <button type="submit" className="fp-submit" disabled={sending}>
                    {sending
                      ? <><span className="spinner" /> Submitting…</>
                      : <><Send style={{ width:15, height:15 }} /> Submit Feedback</>}
                  </button>

                  <p style={{ fontSize:11, color:"#b0accc", textAlign:"center", lineHeight:1.6 }}>
                    By submitting, you agree that your feedback may be used to improve the product. We never share personal details publicly.
                  </p>
                </form>
              )}
            </div>

            {/* ── Sidebar ── */}
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

              {/* Promo */}
              <div className="fp-promo fade-up-3">
                <div style={{ position:"relative", zIndex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                    <div style={{ width:34, height:34, borderRadius:10, background:"rgba(91,62,245,.25)", border:"1px solid rgba(91,62,245,.4)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Sparkles style={{ width:16, height:16, color:"#a78bfa" }} />
                    </div>
                    <span style={{ fontSize:13, fontWeight:700, color:"#a78bfa", fontFamily:"'Sora',sans-serif" }}>Why feedback matters</span>
                  </div>
                  <p style={{ fontSize:22, fontWeight:800, color:"#fff", fontFamily:"'Sora',sans-serif", lineHeight:1.25, marginBottom:10 }}>
                    Every feature you see was <span style={{ color:"#a78bfa" }}>suggested by users</span> like you
                  </p>
                  <p style={{ fontSize:13, color:"rgba(255,255,255,.5)", lineHeight:1.7, marginBottom:20 }}>
                    From the AI scoring rubric to the real-time interview engine — your ideas ship fast.
                  </p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
                    {[
                      [loadingStats ? "…" : stats ? stats.total.toLocaleString() : "0", "Feedbacks received"],
                      [loadingStats ? "…" : stats ? `${stats.avgRating}★`            : "—",  "Avg platform rating"],
                      ["< 48h",                                                                "Avg response time"],
                      ["100%",                                                                 "Read by our team"],
                    ].map(([v,l]) => (
                      <div key={l} style={{ background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.08)", borderRadius:12, padding:"12px 14px" }}>
                        <div style={{ fontSize:18, fontWeight:800, color:"#fff", fontFamily:"'Sora',sans-serif", marginBottom:3 }}>{v}</div>
                        <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", fontWeight:500 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(22,163,74,.15)", border:"1px solid rgba(22,163,74,.3)", borderRadius:10, padding:"8px 12px" }}>
                    <Award style={{ width:13, height:13, color:"#4ade80", flexShrink:0 }} />
                    <span style={{ fontSize:11, color:"#4ade80", fontWeight:600 }}>Top contributors get early access to new features</span>
                  </div>
                </div>
              </div>

              {/* Rating distribution — real data */}
              <div className="fp-card" style={{ padding:"22px 20px" }}>
                <div className="fp-section-title" style={{ marginBottom:14 }}><span />Rating distribution</div>
                {loadingStats ? (
                  <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                    {[5,4,3,2,1].map(s => (
                      <div key={s} style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:12, fontWeight:600, color:"#7c7996", width:20, textAlign:"right" }}>{s}</span>
                        <Star style={{ width:12, height:12, color:"#e8e5f4", fill:"#e8e5f4", flexShrink:0 }} />
                        <div className="rating-bar-track"><div className="skeleton" style={{ height:"100%", borderRadius:99 }} /></div>
                        <span style={{ fontSize:11, color:"#b0accc", width:36, textAlign:"right" }}>…</span>
                      </div>
                    ))}
                  </div>
                ) : stats && stats.ratedCount > 0 ? (
                  <>
                    <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                      {stats.distribution.map(({ stars: s, pct, count }) => (
                        <div key={s} style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <span style={{ fontSize:12, fontWeight:600, color:"#7c7996", width:20, textAlign:"right" }}>{s}</span>
                          <Star style={{ width:12, height:12, color:"#f59e0b", fill:"#f59e0b", flexShrink:0 }} />
                          <div className="rating-bar-track">
                            <div className="rating-bar-fill" style={{ width:`${pct}%` }} />
                          </div>
                          <span style={{ fontSize:11, fontWeight:600, color:"#b0accc", width:36, textAlign:"right" }}>{count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="fp-divider" />
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:6 }}>
                      <div style={{ display:"flex", gap:2 }}>
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} style={{ width:14, height:14,
                            color: s <= Math.round(stats.avgRating) ? "#f59e0b" : "#e8e5f4",
                            fill:  s <= Math.round(stats.avgRating) ? "#f59e0b" : "none" }} />
                        ))}
                      </div>
                      <span style={{ fontSize:12, color:"#7c7996" }}>
                        {stats.avgRating} avg from {stats.ratedCount.toLocaleString()} ratings
                      </span>
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize:13, color:"#b0accc", textAlign:"center", padding:"12px 0" }}>No ratings yet — be the first!</p>
                )}
              </div>

              {/* Community feed — real data */}
              <div className="fp-card" style={{ padding:"22px 20px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                  <div className="fp-section-title" style={{ marginBottom:0 }}><span />Community feedback</div>
                  <div style={{ display:"flex", alignItems:"center", gap:5, background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:99, padding:"3px 9px" }}>
                    <span className="live-dot" style={{ width:6, height:6 }} />
                    <span style={{ fontSize:10, fontWeight:700, color:"#16a34a" }}>Live</span>
                  </div>
                </div>
                <p style={{ fontSize:12, color:"#b0accc", marginBottom:14 }}>Real feedback from verified users</p>

                {loadingFeed ? (
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    {[1,2,3].map(i => (
                      <div key={i} style={{ display:"flex", gap:10 }}>
                        <div className="skeleton" style={{ width:30, height:30, borderRadius:"50%", flexShrink:0 }} />
                        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
                          <div className="skeleton" style={{ height:12, width:"60%" }} />
                          <div className="skeleton" style={{ height:10, width:"90%" }} />
                          <div className="skeleton" style={{ height:10, width:"75%" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : community.length === 0 ? (
                  <p style={{ fontSize:13, color:"#b0accc", textAlign:"center", padding:"12px 0" }}>
                    No feedback yet — yours could be first! 🌟
                  </p>
                ) : (
                  community.map((item, i) => {
                    const { color, bg } = avatarColor(item.userName);
                    const typeColors    = TYPE_COLOR_MAP[item.type] || TYPE_COLOR_MAP.general;
                    const moodEmoji     = MOOD_MAP[item.mood]?.emoji || "💬";
                    const initials      = getInitials(item.userName);
                    return (
                      <div className="feed-item" key={i}>
                        <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                          <div className="feed-avatar" style={{ background: bg, color }}>{initials}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", marginBottom:4 }}>
                              <span style={{ fontSize:13, fontWeight:700, color:"#0f0e17", fontFamily:"'Sora',sans-serif", whiteSpace:"nowrap" }}>
                                {item.userName}
                              </span>
                              {item.type && item.type !== "not selected" && (
                                <span className="feed-badge" style={{ background: typeColors.bg, color: typeColors.color }}>
                                  {item.type}
                                </span>
                              )}
                              <span style={{ fontSize:10, color:"#b0accc", marginLeft:"auto", whiteSpace:"nowrap" }}>
                                {timeAgo(item.submittedAt)}
                              </span>
                            </div>
                            {item.stars > 0 && (
                              <div style={{ display:"flex", gap:2, marginBottom:5 }}>
                                {[1,2,3,4,5].map(sv => (
                                  <Star key={sv} style={{ width:11, height:11,
                                    color: sv<=item.stars ? "#f59e0b" : "#e8e5f4",
                                    fill:  sv<=item.stars ? "#f59e0b" : "none" }} />
                                ))}
                              </div>
                            )}
                            <p style={{ fontSize:13, color:"#4b4869", lineHeight:1.6 }}>
                              {moodEmoji} {item.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Help link */}
              <div className="fp-card" style={{ padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:"#0f0e17", fontFamily:"'Sora',sans-serif", marginBottom:3 }}>Have a support issue?</p>
                  <p style={{ fontSize:12, color:"#7c7996" }}>Get quick answers in our Help Center.</p>
                </div>
                <Link to="/help" style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 14px", borderRadius:12, fontSize:12, fontWeight:700, background:"#f0eeff", color:"#5b3ef5", textDecoration:"none", border:"1.5px solid #d8d0f8", whiteSpace:"nowrap", fontFamily:"'Sora',sans-serif" }}>
                  Help <ArrowRight style={{ width:12, height:12 }} />
                </Link>
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
}