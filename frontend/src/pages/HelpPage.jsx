import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import {
  HelpCircle, Search, Send, Bot, User, Sparkles,
  ChevronRight, BookOpen, MessageSquare, Zap,
  Shield, GraduationCap, Briefcase, BarChart3,
  RefreshCw, Copy, CheckCheck, Target
} from "lucide-react";
import Navbar from "../components/Navbar";

const HELP_STYLES = `
  .help-page * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
  .help-page { min-height: 100vh; background: #faf9fd; }

  .help-card {
    background: #fff; border: 1.5px solid #ece9f8;
    border-radius: 20px; box-shadow: 0 2px 16px rgba(91,62,245,.05);
  }

  .faq-item {
    background: #fff; border: 1.5px solid #ece9f8;
    border-radius: 14px; padding: 16px 18px; cursor: pointer;
    transition: border-color .18s, box-shadow .18s, background .18s;
  }
  .faq-item:hover { border-color: #c4b8f7; box-shadow: 0 4px 16px rgba(91,62,245,.08); }
  .faq-item.active { border-color: #5b3ef5; background: #f0eeff; }

  .cat-btn {
    display: flex; align-items: center; gap: 9px;
    padding: 12px 16px; border-radius: 13px; cursor: pointer;
    border: 1.5px solid #ece9f8; background: #faf9fd;
    font-size: 13px; font-weight: 600; color: #4b4869;
    transition: all .18s; font-family: 'Inter', sans-serif; text-align: left;
  }
  .cat-btn:hover { border-color: #c4b8f7; background: #f0eeff; color: #5b3ef5; }
  .cat-btn.active { border-color: #5b3ef5; background: #f0eeff; color: #5b3ef5; }

  .chat-input {
    flex: 1; min-width: 0; padding: 12px 16px; border-radius: 12px;
    border: 1.5px solid #ece9f8; background: #faf9fd;
    font-size: 14px; font-family: 'Inter', sans-serif; color: #0f0e17;
    outline: none; transition: border-color .18s, box-shadow .18s;
  }
  .chat-input:focus { border-color: #5b3ef5; box-shadow: 0 0 0 3px rgba(91,62,245,.10); background: #fff; }
  .chat-input::placeholder { color: #9d96c8; }

  .chat-send {
    width: 44px; height: 44px; min-width: 44px; border-radius: 12px; border: none; cursor: pointer;
    background: linear-gradient(135deg,#5b3ef5,#9b6ff7);
    color: #fff; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 14px rgba(91,62,245,.35);
    transition: transform .18s, box-shadow .18s; flex-shrink: 0;
  }
  .chat-send:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(91,62,245,.45); }
  .chat-send:disabled { opacity: .5; cursor: not-allowed; }

  .chat-input-row {
    padding: 12px 14px; border-top: 1.5px solid #ece9f8;
    display: flex; gap: 8px; align-items: center; width: 100%;
    box-sizing: border-box;
  }

  .msg-user {
    display: flex; justify-content: flex-end; margin-bottom: 14px;
  }
  .msg-user .bubble {
    max-width: 75%; padding: 11px 15px; border-radius: 16px 16px 4px 16px;
    background: linear-gradient(135deg,#5b3ef5,#9b6ff7);
    color: #fff; font-size: 13.5px; line-height: 1.6; font-weight: 400;
    box-shadow: 0 4px 12px rgba(91,62,245,.25);
  }
  .msg-ai {
    display: flex; align-items: flex-start; gap: 10px; margin-bottom: 14px;
  }
  .msg-ai .bubble {
    max-width: 85%; padding: 13px 16px; border-radius: 4px 16px 16px 16px;
    background: #fff; border: 1.5px solid #ece9f8;
    color: #2d2b3d; font-size: 13.5px; line-height: 1.7;
    box-shadow: 0 2px 10px rgba(91,62,245,.06);
    white-space: pre-wrap;
  }
  .msg-ai .avatar {
    width: 30px; height: 30px; border-radius: 9px; flex-shrink: 0;
    background: linear-gradient(135deg,#5b3ef5,#a855f7);
    display: flex; align-items: center; justify-content: center; margin-top: 2px;
  }

  .search-bar {
    width: 100%; padding: 14px 18px 14px 48px; border-radius: 14px;
    border: 1.5px solid #ece9f8; background: #fff;
    font-size: 15px; font-family: 'Inter', sans-serif; color: #0f0e17;
    outline: none; transition: border-color .18s, box-shadow .18s;
  }
  .search-bar:focus { border-color: #5b3ef5; box-shadow: 0 0 0 4px rgba(91,62,245,.10); }
  .search-bar::placeholder { color: #9d96c8; }

  .gradient-text {
    background: linear-gradient(90deg,#5b3ef5,#a855f7,#ec4899);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }

  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  .fade-up { animation: fadeUp .5s ease both; }

  @keyframes spin { to { transform: rotate(360deg); } }

  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  .typing-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #9d96c8; animation: pulse 1.2s ease infinite; }
  .typing-dot:nth-child(2) { animation-delay: .2s; }
  .typing-dot:nth-child(3) { animation-delay: .4s; }

  @media(max-width:767px){
    .help-hero-title { font-size: 28px !important; }
    .help-main-grid { grid-template-columns: 1fr !important; }
    .help-faq-grid { grid-template-columns: 1fr !important; }
    .chat-input-row { padding: 10px 10px; gap: 6px; }
    .chat-input { font-size: 13px; padding: 11px 12px; }
  }
`;

const CATEGORIES = [
  { icon: GraduationCap, label: "For Students",     bg: "#f0eeff", color: "#5b3ef5", key: "student"   },
  { icon: Briefcase,     label: "For Job Seekers",   bg: "#fdf0ff", color: "#a855f7", key: "jobseeker" },
  { icon: BarChart3,     label: "Scores & Progress", bg: "#fff7e6", color: "#f5a623", key: "scores"    },
  { icon: Shield,        label: "Account & Privacy", bg: "#e6fff8", color: "#00d4aa", key: "account"   },
  { icon: Zap,           label: "Interviews & Prep", bg: "#fff1f3", color: "#ff4f6d", key: "prep"      },
  { icon: BookOpen,      label: "Platform Guide",    bg: "#f0fff4", color: "#22c55e", key: "platform"  },
];

const FAQS = {
  student: [
    { q: "How do I set my class and stream?",               a: "Go to your Profile page and select your class (10th, 11th, 12th, UG, PG, PhD) and stream. The dashboard will personalise your prep topics, focus areas, and recommended mock interviews accordingly." },
    { q: "Which entrance exams does the platform support?", a: "We support JEE (Main & Advanced), NEET, KVPY, CLAT, CAT, XAT, BITSAT, CUET, and more. Each syllabus is mapped to your class and stream automatically." },
    { q: "Can I use this for board exam prep too?",         a: "Absolutely! Beyond entrance exams, our mock interviews also cover board-style conceptual questions, helping you revise core topics in an engaging way." },
  ],
  jobseeker: [
    { q: "How do I pick my domain and experience level?",   a: "Complete your profile and choose from 10+ domains (Software, Data Science, PM, Design, Finance, etc.) and experience levels (Fresher to Lead). Your dashboard will show role-specific prep tips and interview templates." },
    { q: "Are technical DSA rounds supported?",             a: "Yes. We have dedicated DSA rounds with questions across arrays, trees, graphs, DP and more. You can select difficulty and get AI-evaluated feedback on your approach and solution clarity." },
    { q: "Can I practise behavioural / HR rounds?",         a: "Yes. Select 'Behavioral Round' or 'HR Discussion' when creating an interview. The AI asks STAR-method questions and evaluates your responses on structure, clarity, and relevance." },
  ],
  scores: [
    { q: "How is my interview score calculated?",           a: "Scores are based on answer relevance, structure, depth, and communication clarity. Each question is evaluated independently by our AI, and the session score is the weighted average." },
    { q: "Where can I see my progress over time?",          a: "Your Dashboard shows average score, completed sessions, practice hours, and performance level. The Interviews page lists all sessions with individual scores." },
    { q: "Why is my score lower than expected?",            a: "Common reasons: answers too brief, missing key concepts, or weak structure. Check the Results page for per-question feedback — it explains exactly what could be improved." },
  ],
  account: [
    { q: "How do I update my profile?",                     a: "Click your avatar in the top-right and select 'My Profile', or navigate to /profile. You can update your user type, domain, class, stream, and experience level anytime." },
    { q: "Is my interview data private?",                   a: "Yes. Your sessions, responses, and scores are private to your account. We never share your data with third parties. See our Privacy Policy for full details." },
    { q: "How do I delete my account?",                     a: "Go to Profile → Manage Account. From there you can request account deletion. All your data will be permanently removed within 7 days." },
  ],
  prep: [
    { q: "How do I start a mock interview?",                a: "Click 'New Interview' from your Dashboard or the Interviews page. Choose a title, type, number of questions, and difficulty. The AI will begin the session immediately." },
    { q: "Can I resume an incomplete interview?",           a: "Yes! In-progress interviews appear on your Dashboard and Interviews page. Click 'Continue' to pick up where you left off." },
    { q: "How many questions can I set per session?",       a: "You can choose between 5 and 20 questions per session. We recommend 8–10 for a focused 20–30 minute practice session." },
  ],
  platform: [
    { q: "What is the Preparation (Prep Hub) page?",        a: "The Prep Hub offers curated resources, topic guides, and reading lists tailored to your profile. It's updated regularly with new material aligned to current exam patterns." },
    { q: "What is the Syllabus page?",                      a: "The Syllabus page shows a structured breakdown of topics you should cover based on your class/stream or job domain. Use it as your master checklist." },
    { q: "Is the platform free to use?",                    a: "Yes — core features including mock interviews, scoring, and prep resources are free. Premium features may be introduced in future; free users will always have a solid set of tools." },
  ],
};

const QUICK_PROMPTS = [
  "How do I start my first mock interview?",
  "How is my interview score calculated?",
  "Which domains are supported for job seekers?",
  "Can I practise JEE preparation interviews?",
  "How do I reset my profile settings?",
];

export default function HelpPage() {
  const [activeCategory, setActiveCategory] = useState("student");
  const [activeFaq, setActiveFaq]           = useState(null);
  const [searchQuery, setSearchQuery]        = useState("");
  const [messages, setMessages]             = useState([
    { role: "ai", text: "Hi! I'm the SMART InterviewAi assistant 👋\nAsk me anything about the platform — getting started, your scores, prep tips, or account settings." }
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState(null);
  const chatBottomRef = useRef(null);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text: userText }]);
    setLoading(true);

    try {
      // Build conversation history for Anthropic API
      const conversationHistory = messages
        .filter(m => m.role !== "ai" || messages.indexOf(m) !== 0) // skip first greeting for history
        .map(m => ({
          role: m.role === "ai" ? "assistant" : "user",
          content: m.text,
        }));

      const res = await fetch("/api/help-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...conversationHistory,
            { role: "user", content: userText },
          ],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `API error ${res.status}`);
      }

      const data = await res.json();
      const reply =
        data.content?.[0]?.text ||
        "I'm sorry, I couldn't generate a response. Please try again or contact support@smartinterviewai.com.";

      setMessages(m => [...m, { role: "ai", text: reply }]);
    } catch (err) {
      console.error("AI error:", err);
      setMessages(m => [...m, {
        role: "ai",
        text: `Sorry, something went wrong: ${err.message}\n\nPlease try again or email support@smartinterviewai.com.`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const copyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  const filteredFaqs = searchQuery.trim()
    ? Object.values(FAQS).flat().filter(f =>
        f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : FAQS[activeCategory] || [];

  return (
    <>
      <style>{HELP_STYLES}</style>
      <div className="help-page">
        <Navbar />
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 20px 80px" }}>

          {/* ── Hero ── */}
          <section className="fade-up" style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#f0eeff", border: "1.5px solid #c4b8f7", borderRadius: 99, padding: "6px 16px", marginBottom: 18 }}>
              <HelpCircle style={{ width: 13, height: 13, color: "#5b3ef5" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#5b3ef5" }}>Help Center</span>
            </div>
            <h1 className="help-hero-title" style={{ fontSize: 40, fontWeight: 900, color: "#0f0e17", margin: "0 0 14px", lineHeight: 1.1, letterSpacing: "-1px" }}>
              How can we <span className="gradient-text">help you?</span>
            </h1>
            <p style={{ fontSize: 15, color: "#6b6880", maxWidth: 460, margin: "0 auto 28px", lineHeight: 1.7 }}>
              Search FAQs or ask our AI assistant anything about SMART InterviewAi.
            </p>

            {/* Search */}
            <div style={{ position: "relative", maxWidth: 520, margin: "0 auto" }}>
              <Search style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", width: 18, height: 18, color: "#9d96c8" }} />
              <input
                className="search-bar"
                placeholder="Search FAQs e.g. 'how to start an interview'…"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setActiveCategory(null); }}
              />
            </div>
          </section>

          {/* ── Main grid ── */}
          <div className="help-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 24 }}>

            {/* Left: FAQ */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Categories */}
              {!searchQuery && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {CATEGORIES.map(({ icon: Icon, label, bg, color, key }) => (
                    <button key={key} className={`cat-btn${activeCategory === key ? " active" : ""}`} onClick={() => setActiveCategory(key)}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon style={{ width: 14, height: 14, color }} />
                      </div>
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* FAQ list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {searchQuery && filteredFaqs.length === 0 && (
                  <div style={{ textAlign: "center", padding: "32px 0", color: "#9d96c8" }}>
                    <Target style={{ width: 32, height: 32, margin: "0 auto 10px" }} />
                    <p style={{ fontSize: 14, fontWeight: 600 }}>No FAQs found for "{searchQuery}"</p>
                    <p style={{ fontSize: 13, marginTop: 4 }}>Try asking the AI assistant instead!</p>
                  </div>
                )}
                {filteredFaqs.map(({ q, a }, i) => (
                  <div key={i} className={`faq-item${activeFaq === i ? " active" : ""}`} onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: activeFaq === i ? "#5b3ef5" : "#0f0e17", margin: 0, flex: 1 }}>{q}</p>
                      <ChevronRight style={{ width: 15, height: 15, color: "#9d96c8", flexShrink: 0, transform: activeFaq === i ? "rotate(90deg)" : "none", transition: "transform .2s" }} />
                    </div>
                    {activeFaq === i && (
                      <p style={{ fontSize: 13, color: "#4b4869", margin: "10px 0 0", lineHeight: 1.7, borderTop: "1.5px solid #ece9f8", paddingTop: 10 }}>{a}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer links */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                <Link to="/contact" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 11, background: "#f0eeff", border: "1.5px solid #c4b8f7", color: "#5b3ef5", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                  <MessageSquare style={{ width: 12, height: 12 }} /> Contact Support
                </Link>
                <Link to="/feedback" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 11, background: "#faf9fd", border: "1.5px solid #ece9f8", color: "#6b6880", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                  Send Feedback
                </Link>
              </div>
            </div>

            {/* Right: AI Chat */}
            <div className="help-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden", height: 580 }}>

              {/* Chat header */}
              <div style={{
                padding: "16px 20px", borderBottom: "1.5px solid #ece9f8",
                background: "linear-gradient(135deg,#0f0e17,#1a1433)",
                display: "flex", alignItems: "center", gap: 12, borderRadius: "18px 18px 0 0",
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: "linear-gradient(135deg,#5b3ef5,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bot style={{ width: 18, height: 18, color: "#fff" }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>AI Assistant</p>
                  <p style={{ fontSize: 11, color: "#9d96c8", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d4aa", display: "inline-block" }} />
                    Powered by Claude · Anthropic
                  </p>
                </div>
                <button
                  onClick={() => setMessages([{ role: "ai", text: "Hi! I'm the SMART InterviewAi assistant 👋\nAsk me anything about the platform!" }])}
                  style={{ marginLeft: "auto", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 9, padding: "6px 10px", color: "#d6cfff", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, fontFamily: "Inter, sans-serif" }}
                  title="Clear chat"
                >
                  <RefreshCw style={{ width: 12, height: 12 }} /> Clear
                </button>
              </div>

              {/* Quick prompts */}
              <div style={{ padding: "10px 14px", borderBottom: "1.5px solid #ece9f8", display: "flex", gap: 6, flexWrap: "wrap", background: "#faf9fd" }}>
                {QUICK_PROMPTS.slice(0, 3).map((p, i) => (
                  <button key={i} onClick={() => sendMessage(p)}
                    style={{ fontSize: 11, fontWeight: 600, color: "#5b3ef5", background: "#f0eeff", border: "1.5px solid #c4b8f7", borderRadius: 99, padding: "4px 11px", cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "background .15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#e4deff"}
                    onMouseLeave={e => e.currentTarget.style.background = "#f0eeff"}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px" }}>
                {messages.map((msg, i) => (
                  <div key={i}>
                    {msg.role === "user" ? (
                      <div className="msg-user">
                        <div className="bubble">{msg.text}</div>
                      </div>
                    ) : (
                      <div className="msg-ai">
                        <div className="avatar"><Bot style={{ width: 15, height: 15, color: "#fff" }} /></div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
                          <div className="bubble">{msg.text}</div>
                          <button onClick={() => copyText(msg.text, i)}
                            style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: "#9d96c8", fontSize: 11, fontWeight: 600, fontFamily: "Inter, sans-serif", padding: "2px 0", width: "fit-content" }}
                          >
                            {copied === i
                              ? <><CheckCheck style={{ width: 11, height: 11, color: "#00d4aa" }} /><span style={{ color: "#00d4aa" }}>Copied!</span></>
                              : <><Copy style={{ width: 11, height: 11 }} /> Copy</>}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="msg-ai">
                    <div className="avatar"><Bot style={{ width: 15, height: 15, color: "#fff" }} /></div>
                    <div className="bubble" style={{ display: "flex", gap: 5, alignItems: "center", padding: "14px 16px" }}>
                      <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Input row */}
              <div className="chat-input-row">
                <input
                  className="chat-input"
                  placeholder="Ask me anything…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                />
                <button className="chat-send" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
                  {loading
                    ? <span style={{ width: 16, height: 16, border: "2.5px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    : <Send style={{ width: 16, height: 16 }} />}
                </button>
              </div>
            </div>
          </div>

        </main>
      </div>
    </>
  );
}