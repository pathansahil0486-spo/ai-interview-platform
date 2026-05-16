// frontend/pages/SyllabusPage.jsx
// Training-first syllabus. Topics → Subtopics → Assessments.
// Interview session is a small secondary link, NOT the primary CTA.

import { useUser } from "@clerk/clerk-react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  BookOpen, CheckCircle, Target, Play, Zap, Star,
  Flame, Brain, RefreshCw, Sparkles, ChevronDown, ChevronRight,
  AlertCircle, Loader2, Clock, ExternalLink,
  Lightbulb, Lock, Award, ArrowRight, Info,
  FileText, BookMarked, GraduationCap,
  ListChecks, Layers, Mic
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const MASTERY = {
  not_started: { label: "Not Started",  color: "text-gray-400",    bg: "bg-gray-100",    dot: "#d1d5db" },
  beginner:    { label: "Beginner",     color: "text-red-500",     bg: "bg-red-50",      dot: "#f87171" },
  learning:    { label: "Learning",     color: "text-amber-600",   bg: "bg-amber-50",    dot: "#f59e0b" },
  practiced:   { label: "Practiced",    color: "text-blue-600",    bg: "bg-blue-50",     dot: "#3b82f6" },
  mastered:    { label: "Mastered",     color: "text-emerald-600", bg: "bg-emerald-50",  dot: "#10b981" },
};

const DIFFICULTY = {
  foundational: { label: "Foundational", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  intermediate:  { label: "Intermediate", color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200"   },
  advanced:      { label: "Advanced",     color: "text-purple-700",  bg: "bg-purple-50",  border: "border-purple-200" },
};

const FREQ = {
  very_high: { label: "Very High",  color: "text-red-600",    bg: "bg-red-50",    icon: "🔥" },
  high:      { label: "High",       color: "text-orange-600", bg: "bg-orange-50", icon: "📈" },
  medium:    { label: "Medium",     color: "text-yellow-600", bg: "bg-yellow-50", icon: "📊" },
  low:       { label: "Low",        color: "text-gray-500",   bg: "bg-gray-50",   icon: "📉" },
};

const RESOURCE_ICONS = { video: "▶", docs: "📄", article: "📝", course: "🎓" };

function Skeleton({ className = "" }) {
  return <div className={`rounded-lg bg-gray-200 animate-pulse ${className}`} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// SubtopicRow — full training card for one subtopic
// Primary: Take Assessment button. Secondary: tiny "Interview Mode" link.
// ─────────────────────────────────────────────────────────────────────────────
function SubtopicRow({ sub, topic, color, syllabusProgress, onAssess, onPractice, startingId, index }) {
  const name     = typeof sub === "string" ? sub : sub.name;
  const desc     = sub.description  || "";
  const diff     = DIFFICULTY[sub.difficulty] || DIFFICULTY.intermediate;
  const concepts = sub.keyConcepts  || [];
  const hours    = sub.estimatedHours;
  const why      = sub.whyItMatters;
  const [expanded, setExpanded] = useState(false);

  const entry      = syllabusProgress.find(p => p.topic === topic && p.subtopic === name);
  const subMastery = MASTERY[entry?.masteryLevel || "not_started"];
  const key        = `${topic}::${name}`;
  const isStarting = startingId === key;
  const isMastered = entry?.masteryLevel === "mastered";

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${
      isMastered ? "border-emerald-200 bg-emerald-50/30" : "border-gray-100 bg-white"
    }`}>
      {/* ── Subtopic header — always visible ── */}
      <div
        className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50/60 transition-colors select-none"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Step number or checkmark */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
          style={{ background: isMastered ? "#d1fae5" : `${color}18`, color: isMastered ? "#059669" : color }}
        >
          {isMastered ? "✓" : index + 1}
        </div>

        {/* Name + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 text-sm">{name}</p>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${diff.bg} ${diff.color} ${diff.border}`}>
              {diff.label}
            </span>
            {hours && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-400 font-medium">
                <Clock className="w-2.5 h-2.5" />{hours}h
              </span>
            )}
          </div>
          {desc && <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-1">{desc}</p>}
        </div>

        {/* Mastery + expand icon */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: subMastery.dot }} />
            <span className={`text-[11px] font-medium ${subMastery.color}`}>
              {subMastery.label}
              {entry?.questionsAttempted > 0 && ` · ${entry.questionsAttempted}Q`}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* ── Expanded: full training content ── */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">

          {/* Full description */}
          {desc && <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>}

          {/* Why it matters */}
          {why && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-blue-700 mb-0.5">Why This Matters</p>
                <p className="text-xs text-blue-800 leading-snug">{why}</p>
              </div>
            </div>
          )}

          {/* Key Concepts */}
          {concepts.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <ListChecks className="w-3.5 h-3.5 text-gray-500" />
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Key Concepts to Master</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {concepts.map(c => (
                  <span key={c} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 text-gray-700">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Progress stats if started */}
          {entry && entry.questionsAttempted > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-medium text-gray-600">Your Progress</span>
                <span className={`font-bold ${subMastery.color}`}>{subMastery.label}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><p className="text-sm font-bold text-gray-900">{entry.questionsAttempted}</p><p className="text-[10px] text-gray-500">Questions</p></div>
                <div><p className="text-sm font-bold text-gray-900">{Math.round(entry.averageScore || 0)}%</p><p className="text-[10px] text-gray-500">Avg Score</p></div>
                <div><p className="text-sm font-bold text-gray-900">{entry.questionsCorrect || 0}</p><p className="text-[10px] text-gray-500">Correct</p></div>
              </div>
            </div>
          )}

          {/* PRIMARY CTA: Assessment */}
          <button
            onClick={() => onAssess(topic, name)}
            disabled={isStarting}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 shadow-sm"
            style={{ background: `linear-gradient(135deg, ${color}dd, ${color})`, color: "#fff" }}
          >
            <div className="flex items-center gap-2">
              {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              <span>{isStarting ? "Creating assessment…" : `Take Assessment: ${name}`}</span>
            </div>
            <span className="text-xs opacity-75 flex items-center gap-1">
              10 Qs <ChevronRight className="w-3 h-3" />
            </span>
          </button>

          {/* SECONDARY: Interview mode — tiny text link */}
          <button
            onClick={() => onPractice(topic, name)}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors py-0.5"
          >
            <Mic className="w-3 h-3" />
            or practice this in Interview Mode
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TopicCard — full training section for one topic
// ─────────────────────────────────────────────────────────────────────────────
function TopicCard({ item, syllabusProgress, onAssess, onPractice, startingId }) {
  const [open, setOpen] = useState(false);

  const {
    topic, subtopics = [], color, icon, description,
    estimatedHours, interviewFrequency, prerequisites = [],
    resources = [], studyTip
  } = item;

  const entries    = syllabusProgress.filter(p => p.topic === topic);
  const attempted  = entries.reduce((s, e) => s + (e.questionsAttempted || 0), 0);
  const avgScore   = entries.length ? Math.round(entries.reduce((s, e) => s + (e.averageScore || 0), 0) / entries.length) : 0;
  const masteries  = entries.map(e => e.masteryLevel || "not_started");
  const mastery    = ["mastered","practiced","learning","beginner","not_started"].find(m => masteries.includes(m)) || "not_started";
  const masteryObj = MASTERY[mastery];

  const masteredSubCount = entries.filter(e => e.masteryLevel === "mastered").length;
  const pct   = subtopics.length > 0 ? Math.round((masteredSubCount / subtopics.length) * 100) : 0;
  const freq  = FREQ[interviewFrequency] || FREQ.medium;

  const foundCount = subtopics.filter(s => s.difficulty === "foundational").length;
  const intCount   = subtopics.filter(s => s.difficulty === "intermediate").length;
  const advCount   = subtopics.filter(s => s.difficulty === "advanced").length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">

      {/* ── Collapsed header ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left p-5 flex items-start gap-4 hover:bg-gray-50/50 transition-colors"
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl mt-0.5"
          style={{ background: `${color}15`, border: `1.5px solid ${color}30` }}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-gray-900 text-base">{topic}</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${masteryObj.bg} ${masteryObj.color}`}>
              {masteryObj.label}
            </span>
          </div>
          {description && <p className="text-xs text-gray-500 leading-snug mb-2 line-clamp-2">{description}</p>}
          <div className="flex items-center gap-2 flex-wrap">
            {estimatedHours && (
              <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                <Clock className="w-3 h-3" />{estimatedHours}h
              </span>
            )}
            <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${freq.bg} ${freq.color}`}>
              {freq.icon} {freq.label}
            </span>
            <span className="text-[11px] text-gray-400">
              {subtopics.length} subtopics
              {attempted > 0 && ` · ${attempted} Qs done`}
              {avgScore > 0 && ` · ${avgScore}% avg`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:flex flex-col items-end gap-0.5 min-w-[64px]">
            <span className="text-sm font-bold text-gray-700">{pct}%</span>
            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-[10px] text-gray-400">{masteredSubCount}/{subtopics.length}</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* ── Expanded content ── */}
      {open && (
        <div className="border-t border-gray-100">

          {/* Overview: difficulty + prereqs + tip */}
          <div className="px-5 pt-4 pb-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Layers className="w-3 h-3" /> Difficulty Breakdown
              </p>
              <div className="space-y-1.5">
                {foundCount > 0 && <div className="flex justify-between"><span className="text-xs text-emerald-700 font-medium">🟢 Foundational</span><span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-1.5 rounded-full">{foundCount}</span></div>}
                {intCount   > 0 && <div className="flex justify-between"><span className="text-xs text-blue-700 font-medium">🔵 Intermediate</span><span className="text-xs font-bold bg-blue-50 text-blue-700 px-1.5 rounded-full">{intCount}</span></div>}
                {advCount   > 0 && <div className="flex justify-between"><span className="text-xs text-purple-700 font-medium">🟣 Advanced</span><span className="text-xs font-bold bg-purple-50 text-purple-700 px-1.5 rounded-full">{advCount}</span></div>}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Prerequisites
              </p>
              {prerequisites.length === 0
                ? <p className="text-xs text-emerald-600 font-medium">✓ None — start here</p>
                : <div className="flex flex-wrap gap-1">{prerequisites.map(p => <span key={p} className="text-[10px] px-2 py-0.5 rounded-lg bg-white border border-gray-200 text-gray-600 flex items-center gap-1"><Lock className="w-2.5 h-2.5"/>{p}</span>)}</div>}
            </div>

            {studyTip && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" /> Expert Tip
                </p>
                <p className="text-xs text-amber-800 leading-snug">{studyTip}</p>
              </div>
            )}
          </div>

          {/* Resources */}
          {resources.length > 0 && (
            <div className="px-5 pb-3">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <BookMarked className="w-3 h-3" /> Free Study Resources
              </p>
              <div className="flex flex-wrap gap-2">
                {resources.map(r => (
                  <a key={r.url || r.title} href={r.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-700 transition-colors">
                    <span>{RESOURCE_ICONS[r.type] || "🔗"}</span>{r.title}<ExternalLink className="w-3 h-3 text-gray-400" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Subtopics — the main training content */}
          <div className="px-5 pb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" /> Subtopics & Assessments
              </p>
              <span className="text-[10px] text-gray-400">{subtopics.length} subtopics · expand each to study & test</span>
            </div>

            <div className="space-y-2">
              {subtopics.map((sub, i) => (
                <SubtopicRow
                  key={typeof sub === "string" ? sub : sub.name}
                  sub={sub} topic={topic} color={color}
                  syllabusProgress={syllabusProgress}
                  onAssess={onAssess} onPractice={onPractice}
                  startingId={startingId} index={i}
                />
              ))}
            </div>

            {/* Interview session — small secondary at bottom */}
            <div className="mt-4 pt-3 border-t border-dashed border-gray-200 flex items-center justify-center">
              <button
                onClick={() => onPractice(topic, null)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50"
              >
                <Mic className="w-3 h-3" />
                Full {topic} Interview Session (practice mode)
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function SyllabusPage() {
  const { user }   = useUser();
  const navigate   = useNavigate();

  const [profile,          setProfile]         = useState(null);
  const [syllabusData,     setSyllabusData]     = useState(null);
  const [syllabusProgress, setSyllabusProgress] = useState([]);
  const [loadingProfile,   setLoadingProfile]   = useState(true);
  const [loadingTopics,    setLoadingTopics]    = useState(false);
  const [topicsError,      setTopicsError]      = useState(null);
  const [startingId,       setStartingId]       = useState(null);
  const [activeTab,        setActiveTab]        = useState("all");

  useEffect(() => { if (user) fetchProfile(); }, [user]);

  const fetchProfile = async () => {
    setLoadingProfile(true);
    try {
      const res  = await fetch(`${API_URL}/users/profile/${user.id}`);
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setSyllabusProgress(data.data.syllabusProgress || []);

        // Force regeneration if profile was updated more recently than the cached syllabus.
        // This catches the case where ProfilePage saved a new domain/stream but the
        // syllabus backend still has the old cached fingerprint.
        // Force regen if profile was updated after the syllabus was last generated
        const profileUpdated  = data.data.updatedAt ? new Date(data.data.updatedAt) : null;
        const cacheGenerated  = data.data.syllabusCache?.generatedAt
          ? new Date(data.data.syllabusCache.generatedAt) : null;

        // If no cache exists at all, or profile is newer than cache → force regen
        const forceRegen = !cacheGenerated
          || (profileUpdated && profileUpdated > cacheGenerated);

        if (forceRegen) {
          console.log('[Syllabus] Profile newer than syllabus cache — forcing regen');
        }
        fetchTopics(data.data, forceRegen);
      }
    } catch (e) { console.error(e); }
    finally { setLoadingProfile(false); }
  };

  const fetchTopics = useCallback(async (profileData, force = false) => {
    if (!profileData) return;
    setLoadingTopics(true);
    setTopicsError(null);
    try {
      // Cache-bust with timestamp so stale cached response is never served
      const ts  = Date.now();
      const res = await fetch(`${API_URL}/syllabus/topics?userId=${user.id}&_t=${ts}${force ? "&force=true" : ""}`);
      const data = await res.json();
      if (data.success) {
        const topics = data.data?.topics || [];
        // If topics came back but subtopics are missing, background regen is still running — poll
        const hasRealData = topics.length > 0 && topics.every(t => (t.subtopics?.length || 0) > 0);
        if (!hasRealData && !force) {
          console.log("[Syllabus] Background regen in progress — polling in 3s…");
          setTimeout(() => fetchTopics(profileData, true), 3000);
          return;
        }
        setSyllabusData(data.data);
      } else {
        setTopicsError(data.message || "Could not load topics");
      }
    } catch { setTopicsError("Network error — please try again"); }
    finally { setLoadingTopics(false); }
  }, [user]);

  const startAssessment = async (topic, subtopic) => {
    const key = `${topic}::${subtopic}`;
    setStartingId(key);
    try {
      const res  = await fetch(`${API_URL}/assessments/create`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          domain: syllabusData?.meta?.domain || "general",
          topic, subtopic,
          difficulty: ["senior","expert"].includes(profile?.experienceLevel) ? "hard"
            : profile?.experienceLevel === "entry" ? "easy" : "medium",
          numQuestions: 10,
        }),
      });
      const data = await res.json();
      if (data.success) navigate(`/assessment/${data.data._id}`);
    } catch (e) { console.error(e); }
    finally { setStartingId(null); }
  };

  const startPractice = (topic, subtopic) => {
    const p = new URLSearchParams({ topic });
    if (subtopic) p.set("subtopic", subtopic);
    if (syllabusData?.meta?.domain) p.set("domain", syllabusData.meta.domain);
    navigate(`/interviews?${p.toString()}`);
  };

  const totalAttempted  = syllabusProgress.reduce((s, p) => s + (p.questionsAttempted || 0), 0);
  const masteredCount   = syllabusProgress.filter(p => p.masteryLevel === "mastered").length;
  const totalSubtopics  = syllabusData?.topics?.reduce((s, t) => s + (t.subtopics?.length || 0), 0) || 0;
  const totalEstHours   = syllabusData?.meta?.totalEstimatedHours || 0;
  const completedSubPct = totalSubtopics > 0 ? Math.round((masteredCount / totalSubtopics) * 100) : 0;

  const filteredTopics = (syllabusData?.topics || []).filter(t => {
    if (activeTab === "high")         return t.interviewFrequency === "very_high" || t.interviewFrequency === "high";
    if (activeTab === "foundational") return t.subtopics?.some(s => s.difficulty === "foundational");
    if (activeTab === "inprogress")   return syllabusProgress.some(p => p.topic === t.topic && p.masteryLevel !== "mastered" && p.questionsAttempted > 0);
    return true;
  });

  if (loadingProfile) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your syllabus…</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">Your Study Syllabus</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {syllabusData?.meta?.label || profile?.domain || profile?.stream || "Personalised for you"}
                {profile?.experienceLevel && ` · ${profile.experienceLevel} level`}
              </p>
            </div>
          </div>
          <button onClick={() => fetchTopics(profile, true)} disabled={loadingTopics}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 flex-shrink-0">
            <RefreshCw className={`w-4 h-4 ${loadingTopics ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{loadingTopics ? "Generating…" : "Regenerate"}</span>
          </button>
        </div>

        {/* AI Study Plan banner */}
        {syllabusData?.meta?.aiSummary && (
          <div className="flex items-start gap-3 mb-5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl px-4 py-3">
            <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-0.5">AI Study Plan</p>
              <p className="text-sm text-purple-900 leading-snug">{syllabusData.meta.aiSummary}</p>
            </div>
          </div>
        )}

        {/* Target audience pill */}
        {syllabusData?.meta?.targetAudience && (
          <div className="flex items-center gap-2 mb-5 text-xs text-gray-500 bg-white border border-gray-100 rounded-full px-3 py-1.5 w-fit shadow-sm">
            <Award className="w-3.5 h-3.5 text-gray-400" />{syllabusData.meta.targetAudience}
          </div>
        )}

        {/* Progress dashboard */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Overall Progress</h2>
              <p className="text-xs text-gray-500 mt-0.5">{masteredCount} of {totalSubtopics} subtopics mastered · {totalAttempted} questions answered</p>
            </div>
            {profile?.learningPath?.streak > 0 && (
              <div className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-sm font-semibold w-fit">
                <Flame className="w-4 h-4" />{profile.learningPath.streak} day streak
              </div>
            )}
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-gray-500">Curriculum Completion</span>
              <span className="font-bold text-gray-700">{completedSubPct}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700" style={{ width: `${completedSubPct}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { label: "Topics",     value: syllabusData?.topics?.length || 0, icon: "📚" },
              { label: "Subtopics",  value: totalSubtopics,                    icon: "🎯" },
              { label: "Mastered",   value: masteredCount,                     icon: "🏆" },
              { label: "Questions",  value: totalAttempted,                    icon: "✅" },
              { label: "Est. Hours", value: `${totalEstHours}h`,              icon: "⏱️" },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-lg mb-0.5">{s.icon}</div>
                <div className="text-lg font-bold text-gray-900">{s.value}</div>
                <div className="text-[10px] text-gray-500 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended next */}
        {profile?.learningPath?.recommendedNext?.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 mb-5 text-white">
            <div className="flex items-center gap-2 mb-2"><Zap className="w-5 h-5" /><h2 className="font-bold text-base">Continue Where You Left Off</h2></div>
            <p className="text-indigo-100 text-xs mb-3">Recommended based on your progress:</p>
            <div className="flex flex-wrap gap-2">
              {profile.learningPath.recommendedNext.slice(0, 5).map(t => (
                <button key={t} onClick={() => startAssessment(t, t)}
                  className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5">
                  <FileText className="w-3 h-3" />{t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Topics & Assessments */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Topics & Assessments</h2>
              {syllabusData?.meta && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {syllabusData.meta.totalTopics} topics · {syllabusData.meta.totalSubtopics} subtopics · {totalEstHours}h curriculum
                </p>
              )}
            </div>
            {syllabusData?.topics?.length > 0 && (
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
                {[
                  { id: "all",          label: "All" },
                  { id: "foundational", label: "🟢 Beginner" },
                  { id: "high",         label: "🔥 Priority" },
                  { id: "inprogress",   label: "▶ In Progress" },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === tab.id ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}>{tab.label}</button>
                ))}
              </div>
            )}
          </div>

          {/* How-to hint */}
          {syllabusData?.topics?.length > 0 && totalAttempted === 0 && (
            <div className="flex items-start gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-500" />
              <span><strong>How to study:</strong> Expand a topic → expand a subtopic to see its description, key concepts &amp; resources → click <strong>Take Assessment</strong> to test yourself with 10 questions.</span>
            </div>
          )}

          {/* Loading */}
          {loadingTopics && !syllabusData && (
            <div className="space-y-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="flex-1 space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-64" /><Skeleton className="h-3 w-32" /></div>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-center gap-2 text-sm text-purple-600 font-medium py-4">
                <Sparkles className="w-4 h-4 animate-pulse" />Gemini is building your personalised syllabus…
              </div>
            </div>
          )}

          {/* Error */}
          {topicsError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <p className="text-red-700 font-semibold mb-1">Could not load syllabus</p>
              <p className="text-red-500 text-sm mb-4">{topicsError}</p>
              <button onClick={() => fetchTopics(profile, false)} className="bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-red-700 transition-colors">Try Again</button>
            </div>
          )}

          {/* Topic cards */}
          {filteredTopics.map(item => (
            <TopicCard key={item.topic} item={item} syllabusProgress={syllabusProgress}
              onAssess={startAssessment} onPractice={startPractice} startingId={startingId} />
          ))}

          {/* No filter results */}
          {!loadingTopics && !topicsError && syllabusData && filteredTopics.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
              <p className="text-gray-500 text-sm mb-2">No topics match this filter.</p>
              <button onClick={() => setActiveTab("all")} className="text-indigo-600 text-xs font-medium hover:underline">Show all topics</button>
            </div>
          )}

          {/* Empty state */}
          {!loadingTopics && !topicsError && !syllabusData?.topics?.length && (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
              <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-700 mb-1">No syllabus yet</h3>
              <p className="text-gray-500 text-sm mb-5">Complete your profile so Gemini can build your personalised curriculum.</p>
              <button onClick={() => navigate("/profile")}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
                Complete Profile
              </button>
            </div>
          )}
        </div>

        {/* Behavioural section */}
        {syllabusData?.meta?.domain !== "general" && syllabusData?.topics?.length > 0 && (
          <div className="mt-5 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">Behavioural & HR Assessments</h3>
                <p className="text-xs text-gray-500">STAR method, leadership, conflict resolution</p>
              </div>
              <span className="hidden sm:flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-red-50 text-red-600">🔥 Very High</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: "STAR Method",           desc: "Structure answers with Situation, Task, Action, Result", concepts: ["Story structure", "Quantified results", "Action focus", "STAR format"] },
                { name: "Leadership & Teamwork",  desc: "Demonstrate ownership, influence, cross-team impact",   concepts: ["Ownership mindset", "Mentorship", "Cross-functional", "Decision-making"] },
                { name: "Conflict Resolution",    desc: "Handle disagreements, difficult colleagues, manage up", concepts: ["Active listening", "De-escalation", "Stakeholder alignment", "Compromise"] },
              ].map(({ name: bName, desc: bDesc, concepts: bConcepts }) => (
                <div key={bName} className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                  <p className="font-bold text-amber-900 text-sm mb-1">{bName}</p>
                  <p className="text-xs text-amber-700 leading-snug mb-3">{bDesc}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {bConcepts.map(c => <span key={c} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">{c}</span>)}
                  </div>
                  <button
                    onClick={() => startAssessment("Behavioral Skills", bName)}
                    disabled={startingId === `Behavioral Skills::${bName}`}
                    className="w-full flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
                  >
                    {startingId === `Behavioral Skills::${bName}`
                      ? <><Loader2 className="w-3 h-3 animate-spin" />Starting…</>
                      : <><FileText className="w-3 h-3" />Take Assessment</>}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {syllabusData && <p className="text-center text-xs text-gray-400 mt-6">Syllabus auto-regenerates when your profile changes · Cached for 7 days</p>}
      </main>
    </div>
  );
}