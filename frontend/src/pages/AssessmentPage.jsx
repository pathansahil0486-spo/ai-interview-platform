// frontend/pages/AssessmentPage.jsx
// Full anti-cheat: fullscreen enforcement, screenshot blocking, tab-switch detection,
// no text selection/copy/paste, violation logging. Genuine per-question AI feedback.
import { useUser } from "@clerk/clerk-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import {
  Clock, ChevronLeft, ChevronRight, CheckCircle, AlertCircle,
  Send, Loader, Trophy, BarChart3, TrendingUp, BookOpen,
  Target, ArrowLeft, ShieldAlert, Shield, Maximize,
  AlertTriangle, XCircle, Lock
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const MAX_VIOLATIONS = 3;

const lockPage = () => {
  ["userSelect","webkitUserSelect","mozUserSelect","msUserSelect"].forEach(p => {
    document.body.style[p] = "none";
    document.documentElement.style[p] = "none";
  });
};
const unlockPage = () => {
  ["userSelect","webkitUserSelect","mozUserSelect","msUserSelect"].forEach(p => {
    document.body.style[p] = "";
    document.documentElement.style[p] = "";
  });
};

export default function AssessmentPage() {
  const { user }    = useUser();
  const { id }      = useParams();
  const navigate    = useNavigate();

  const [assessment,  setAssessment]  = useState(null);
  const [phase,       setPhase]       = useState("loading");
  const [answers,     setAnswers]     = useState({});
  const [currentQ,    setCurrentQ]    = useState(0);
  const [timeLeft,    setTimeLeft]    = useState(0);
  const [violations,  setViolations]  = useState(0);
  const [tabWarning,  setTabWarning]  = useState(false);
  const [ssFlash,     setSsFlash]     = useState(false);
  const [fsWarning,   setFsWarning]   = useState(false);
  const [isFullscreen,setIsFullscreen]= useState(false);
  const [expandedQ,   setExpandedQ]   = useState(null);
  const [startedAt,   setStartedAt]   = useState(null);
  const [violationLog,setViolationLog]= useState([]);

  const violationsRef  = useRef(0);
  const phaseRef       = useRef("loading");
  const assessmentRef  = useRef(null);
  const answersRef     = useRef({});
  const startedAtRef   = useRef(null);
  const timerRef       = useRef(null);
  const submittingRef  = useRef(false);
  const vlRef          = useRef([]);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { assessmentRef.current = assessment; }, [assessment]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { startedAtRef.current = startedAt; }, [startedAt]);
  useEffect(() => { vlRef.current = violationLog; }, [violationLog]);

  useEffect(() => {
    if (user && id) loadAssessment();
    return () => { clearInterval(timerRef.current); unlockPage(); };
  }, [user, id]);

  const loadAssessment = async () => {
    try {
      const res  = await fetch(`${API_URL}/assessments/${id}?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setAssessment(data.data);
        setTimeLeft(data.data.timeLimitMinutes * 60);
        setPhase(data.data.status === "completed" ? "results" : "intro");
      } else { toast.error("Assessment not found"); navigate("/syllabus"); }
    } catch { toast.error("Failed to load"); navigate("/syllabus"); }
  };

  // ── Fullscreen ──────────────────────────────────────────────────────────────
  const enterFullscreen = async () => {
    try {
      const el = document.documentElement;
      if      (el.requestFullscreen)            await el.requestFullscreen();
      else if (el.webkitRequestFullscreen)      await el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen)         await el.mozRequestFullScreen();
      setIsFullscreen(true);
    } catch {}
  };
  const exitFullscreen = async () => {
    try {
      if      (document.exitFullscreen)            await document.exitFullscreen();
      else if (document.webkitExitFullscreen)      await document.webkitExitFullscreen();
    } catch {}
  };
  useEffect(() => {
    const h = () => {
      const full = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
      setIsFullscreen(full);
      if (!full && phaseRef.current === "taking") {
        addViolation("Fullscreen exited");
        setFsWarning(true);
        setTimeout(() => setFsWarning(false), 5000);
      }
    };
    ["fullscreenchange","webkitfullscreenchange","mozfullscreenchange"].forEach(e => document.addEventListener(e, h));
    return () => ["fullscreenchange","webkitfullscreenchange","mozfullscreenchange"].forEach(e => document.removeEventListener(e, h));
  }, []);

  // ── Tab / window focus ──────────────────────────────────────────────────────
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && phaseRef.current === "taking") {
        addViolation("Tab switched / window hidden");
        setTabWarning(true);
        setTimeout(() => setTabWarning(false), 4000);
      }
    };
    const onBlur = () => { if (phaseRef.current === "taking") addViolation("Window lost focus"); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    return () => { document.removeEventListener("visibilitychange", onVis); window.removeEventListener("blur", onBlur); };
  }, []);

  // ── Keyboard: screenshot / devtools ────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (phaseRef.current !== "taking") return;
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const isShot =
        e.key === "PrintScreen" ||
        (isMac && e.metaKey && e.shiftKey && ["3","4","5"].includes(e.key)) ||
        (!isMac && e.key === "PrintScreen") ||
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["i","I","j","J"].includes(e.key)) ||
        (e.ctrlKey && ["u","U"].includes(e.key));
      if (isShot) {
        e.preventDefault();
        addViolation(`Screenshot/DevTools attempt (${e.key})`);
        setSsFlash(true);
        setTimeout(() => setSsFlash(false), 800);
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        if (["c","v","x","p","s"].includes(e.key.toLowerCase())) {
          if (e.target.tagName === "TEXTAREA" && ["v"].includes(e.key.toLowerCase())) return;
          e.preventDefault();
          if (["c","x"].includes(e.key.toLowerCase())) addViolation("Copy/cut attempt");
        }
      }
    };
    const onKeyUp = (e) => {
      if (e.key === "PrintScreen" && phaseRef.current === "taking") {
        setSsFlash(true);
        setTimeout(() => setSsFlash(false), 800);
        navigator.clipboard?.writeText?.("").catch(() => {});
      }
    };
    const onCtx = (e) => {
      if (phaseRef.current === "taking") { e.preventDefault(); addViolation("Right-click attempt"); }
    };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("keyup", onKeyUp, true);
    document.addEventListener("contextmenu", onCtx, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keyup", onKeyUp, true);
      document.removeEventListener("contextmenu", onCtx, true);
    };
  }, []);

  // Block text selection on non-textarea elements
  useEffect(() => {
    const h = (e) => { if (phaseRef.current === "taking" && e.target.tagName !== "TEXTAREA") e.preventDefault(); };
    document.addEventListener("selectstart", h, true);
    const onCopy = (e) => {
      if (phaseRef.current === "taking") { e.clipboardData?.setData("text/plain",""); e.preventDefault(); addViolation("Copy event blocked"); }
    };
    document.addEventListener("copy", onCopy, true);
    document.addEventListener("cut", (e) => { if (phaseRef.current === "taking") e.preventDefault(); }, true);
    return () => { document.removeEventListener("selectstart", h, true); document.removeEventListener("copy", onCopy, true); };
  }, []);

  // ── Violation tracker ───────────────────────────────────────────────────────
  const addViolation = useCallback((type) => {
    const next = violationsRef.current + 1;
    violationsRef.current = next;
    const entry = { type, time: new Date().toISOString() };
    setViolations(next);
    setViolationLog(prev => [...prev, entry]);
    toast.error(`⚠️ Violation ${next}/${MAX_VIOLATIONS}: ${type}`, { duration: 3000, id: `v${next}` });
    if (next >= MAX_VIOLATIONS) {
      toast.error("🚨 Max violations — auto-submitting!", { duration: 5000 });
      setTimeout(() => submitAssessment(true), 1500);
    }
  }, []);

  // ── Timer ───────────────────────────────────────────────────────────────────
  const startTimer = useCallback((secs) => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); submitAssessment(false); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ── Start ───────────────────────────────────────────────────────────────────
  const startAssessment = async () => {
    try {
      const res  = await fetch(`${API_URL}/assessments/${id}/start?userId=${user.id}`, { method: "PUT" });
      const data = await res.json();
      if (!data.success) { toast.error("Failed to start"); return; }
      setAssessment(data.data);
      setCurrentQ(0);
      setStartedAt(new Date());
      await enterFullscreen();
      lockPage();
      setPhase("taking");
      phaseRef.current = "taking";
      startTimer(data.data.timeLimitMinutes * 60);
      toast.success("Assessment started — good luck!", { duration: 2000 });
    } catch { toast.error("Failed to start assessment"); }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const submitAssessment = useCallback(async (auto = false) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    clearInterval(timerRef.current);
    setPhase("submitting");
    phaseRef.current = "submitting";
    unlockPage();
    await exitFullscreen();
    try {
      const spent = startedAtRef.current ? Math.floor((new Date() - new Date(startedAtRef.current)) / 1000) : 0;
      const payload = {
        answers: Object.entries(answersRef.current).map(([qId, ans]) => ({ questionId: qId, answer: ans })),
        timeSpentSeconds: spent,
        violations: violationsRef.current,
        violationLog: vlRef.current,
        autoSubmitted: auto
      };
      const res  = await fetch(`${API_URL}/assessments/${id}/submit?userId=${user.id}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setAssessment(data.data);
        setViolationLog(vlRef.current);
        setPhase("results");
        phaseRef.current = "results";
        toast.success("Submitted! AI feedback generated.");
      } else {
        toast.error("Submission failed — " + (data.message || "try again"));
        setPhase("taking"); phaseRef.current = "taking"; submittingRef.current = false;
      }
    } catch {
      toast.error("Network error — please retry");
      setPhase("taking"); phaseRef.current = "taking"; submittingRef.current = false;
    }
  }, [id]);

  const setAnswer = (qId, val) => setAnswers(prev => ({ ...prev, [qId]: val }));
  const fmt = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  const answered = Object.keys(answers).filter(k => answers[k] !== "" && answers[k] !== undefined).length;
  const total    = assessment?.questions?.length || 0;
  const progress = total > 0 ? (answered / total) * 100 : 0;
  const scoreLabel = (p) => {
    if (p >= 90) return { t: "Excellent 🏆", c: "text-emerald-400" };
    if (p >= 75) return { t: "Good 👍",       c: "text-blue-400" };
    if (p >= 60) return { t: "Average",       c: "text-yellow-400" };
    return              { t: "Needs Work",    c: "text-red-400" };
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (phase === "loading") return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Loader className="w-8 h-8 animate-spin text-blue-400"/>
    </div>
  );

  // ── Intro ───────────────────────────────────────────────────────────────────
  if (phase === "intro" && assessment) return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar/>
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-1.5 mb-4">
            <Shield className="w-4 h-4 text-blue-400"/>
            <span className="text-sm text-blue-300 font-medium">Proctored Assessment</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{assessment.title}</h1>
          <p className="text-gray-400">{assessment.domain} · {assessment.topic}{assessment.subtopic ? " · " + assessment.subtopic : ""}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: <BookOpen className="w-5 h-5 text-blue-400"/>, label: "Questions", val: assessment.questions?.length },
            { icon: <Clock className="w-5 h-5 text-yellow-400"/>,  label: "Time",      val: `${assessment.timeLimitMinutes}m` },
            { icon: <Target className="w-5 h-5 text-emerald-400"/>,label: "Max Score", val: assessment.maxScore },
          ].map(({ icon, label, val }) => (
            <div key={label} className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 text-center">
              <div className="flex justify-center mb-1">{icon}</div>
              <div className="text-xl font-bold">{val}</div>
              <div className="text-xs text-gray-400">{label}</div>
            </div>
          ))}
        </div>

        <div className="bg-red-950/30 border border-red-700/40 rounded-xl p-6 mb-6">
          <h2 className="font-bold text-red-300 flex items-center gap-2 mb-4"><ShieldAlert className="w-5 h-5"/> Proctoring Rules</h2>
          <ul className="space-y-2 text-sm text-gray-300">
            {[
              "Assessment runs in fullscreen — exiting triggers a violation",
              "Tab switching and window blur are detected and logged",
              "Screenshots (PrintScreen, Snipping Tool, Cmd+Shift+3/4/5) are blocked",
              "Right-click, copy, and text selection are disabled on questions",
              "DevTools (F12, Ctrl+Shift+I) are blocked",
              `${MAX_VIOLATIONS} violations trigger automatic submission`,
            ].map(r => <li key={r} className="flex gap-2 items-start"><XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0"/>{r}</li>)}
          </ul>
        </div>

        <div className="bg-blue-950/20 border border-blue-700/30 rounded-xl p-5 mb-8">
          <h2 className="font-bold text-blue-300 flex items-center gap-2 mb-3"><CheckCircle className="w-5 h-5"/> Tips</h2>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>✓ Personalized questions are based on your profile and weak areas</li>
            <li>✓ You can navigate freely between questions before submitting</li>
            <li>✓ Attempt every question — unanswered = 0 pts</li>
            <li>✓ Genuine AI feedback on every question after submission</li>
          </ul>
        </div>

        <div className="flex gap-4">
          <button onClick={() => navigate(-1)} className="flex-1 py-3 border border-gray-700 rounded-xl hover:bg-gray-800 transition">
            ← Back
          </button>
          <button onClick={startAssessment}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold flex items-center justify-center gap-2 transition">
            <Maximize className="w-5 h-5"/> Start in Fullscreen
          </button>
        </div>
      </div>
    </div>
  );

  // ── Taking ──────────────────────────────────────────────────────────────────
  if (phase === "taking" && assessment) {
    const q = assessment.questions[currentQ];
    const qId = q._id.toString();
    const cur = answers[qId] ?? "";
    const timerDanger = timeLeft < 120;

    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col select-none">
        {/* Screenshot flash */}
        {ssFlash && (
          <div className="fixed inset-0 bg-white/90 z-[9999] flex items-center justify-center pointer-events-none">
            <div className="bg-red-600 text-white text-2xl font-bold px-8 py-6 rounded-2xl shadow-2xl">
              🚫 Screenshot Blocked &amp; Logged
            </div>
          </div>
        )}

        {/* Fullscreen warning */}
        {fsWarning && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3">
            <ShieldAlert className="w-5 h-5"/>
            <span className="font-semibold">Violation: Fullscreen exited!</span>
            <button onClick={enterFullscreen} className="bg-white text-red-600 px-3 py-1 rounded-lg text-sm font-bold">
              Re-enter Fullscreen
            </button>
          </div>
        )}

        {/* Tab warning */}
        {tabWarning && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-orange-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-2">
            <AlertTriangle className="w-5 h-5"/>
            <span className="font-semibold">Warning: Tab switch detected and logged!</span>
          </div>
        )}

        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-blue-600/20 border border-blue-500/40 rounded-lg px-2.5 py-1">
              <Shield className="w-3.5 h-3.5 text-blue-400"/>
              <span className="text-xs text-blue-300 font-medium">Proctored</span>
            </div>
            <span className="text-sm text-gray-300 hidden sm:block truncate max-w-xs">{assessment.title}</span>
          </div>

          <span className="text-sm text-gray-400">
            <span className="text-white font-semibold">{answered}</span>/{total} answered
          </span>

          <div className="flex items-center gap-2">
            {violations > 0 && (
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
                violations >= MAX_VIOLATIONS ? "bg-red-700 text-white" : "bg-orange-600/30 text-orange-300 border border-orange-600/40"
              }`}>
                <AlertTriangle className="w-3 h-3"/> {violations}/{MAX_VIOLATIONS}
              </div>
            )}
            <div className={`font-mono font-bold text-sm px-3 py-1.5 rounded-lg flex items-center gap-1 ${
              timerDanger ? "bg-red-700/50 text-red-300 border border-red-600/40" : "bg-gray-800 text-white"
            }`}>
              <Clock className={`w-4 h-4 ${timerDanger ? "animate-pulse" : ""}`}/> {fmt(timeLeft)}
            </div>
            {!isFullscreen && (
              <button onClick={enterFullscreen}
                className="bg-yellow-600 hover:bg-yellow-500 text-white text-xs px-2 py-1.5 rounded-lg flex items-center gap-1">
                <Maximize className="w-3.5 h-3.5"/> FS
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-800">
          <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }}/>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar navigator */}
          <div className="hidden lg:block w-48 bg-gray-900 border-r border-gray-800 p-3 overflow-y-auto shrink-0">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">Questions</p>
            <div className="grid grid-cols-4 gap-1.5">
              {assessment.questions.map((_, i) => {
                const id_ = assessment.questions[i]._id.toString();
                const isAns = answers[id_] !== undefined && answers[id_] !== "";
                return (
                  <button key={i} onClick={() => setCurrentQ(i)}
                    className={`w-9 h-9 rounded-lg text-xs font-bold transition ${
                      i === currentQ ? "bg-blue-600 text-white ring-2 ring-blue-400" :
                      isAns         ? "bg-emerald-700/60 text-emerald-300" :
                                      "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}>{i + 1}</button>
                );
              })}
            </div>
          </div>

          {/* Question area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                  Question {currentQ + 1} of {total}
                </span>
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                    q.type === "mcq"      ? "border-blue-500/40 text-blue-300 bg-blue-900/20" :
                    q.type === "scenario" ? "border-purple-500/40 text-purple-300 bg-purple-900/20" :
                    "border-yellow-500/40 text-yellow-300 bg-yellow-900/20"
                  }`}>{q.type === "mcq" ? "MCQ" : q.type === "scenario" ? "Scenario" : "Short Answer"}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                    q.difficulty === "easy" ? "border-emerald-500/40 text-emerald-300 bg-emerald-900/20" :
                    q.difficulty === "hard" ? "border-red-500/40 text-red-300 bg-red-900/20" :
                    "border-yellow-500/40 text-yellow-300 bg-yellow-900/20"
                  }`}>{q.difficulty}</span>
                </div>
              </div>

              {/* Question text — locked */}
              <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5 mb-6 select-none pointer-events-auto"
                onCopy={e => e.preventDefault()} onCut={e => e.preventDefault()}>
                <p className="text-white text-lg leading-relaxed font-medium">{q.question}</p>
                <p className="text-xs text-gray-500 mt-2">{q.points || 10} pts</p>
              </div>

              {/* MCQ options */}
              {q.type === "mcq" ? (
                <div className="space-y-3">
                  {q.options?.map((opt, i) => (
                    <button key={i} onClick={() => setAnswer(qId, String(i))}
                      className={`w-full text-left px-5 py-4 rounded-xl border transition font-medium ${
                        cur === String(i)
                          ? "border-blue-500 bg-blue-600/20 text-white shadow-lg shadow-blue-900/20"
                          : "border-gray-700 bg-gray-800/40 text-gray-300 hover:border-gray-500 hover:bg-gray-700/60"
                      }`}>
                      <span className={`inline-flex w-7 h-7 rounded-lg mr-3 items-center justify-center text-sm font-bold ${
                        cur === String(i) ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-400"
                      }`}>{String.fromCharCode(65 + i)}</span>
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Your Answer:</label>
                  <textarea value={cur} onChange={e => setAnswer(qId, e.target.value)}
                    placeholder="Type your detailed answer here. Include key concepts and terminology..."
                    rows={8}
                    className="w-full bg-gray-800/60 border border-gray-700 rounded-xl p-4 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none transition"
                    style={{ userSelect: "text", WebkitUserSelect: "text" }}
                  />
                  <p className="text-xs text-gray-500 mt-1">{cur.length} chars</p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-4 border-t border-gray-800">
                <button onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}
                  className="flex items-center gap-2 px-5 py-2.5 border border-gray-700 rounded-xl hover:bg-gray-800 disabled:opacity-30 transition">
                  <ChevronLeft className="w-4 h-4"/> Previous
                </button>

                {currentQ < total - 1 ? (
                  <button onClick={() => setCurrentQ(currentQ + 1)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl transition">
                    Next <ChevronRight className="w-4 h-4"/>
                  </button>
                ) : (
                  <button onClick={() => {
                    if (answered < total && !confirm(`${total - answered} unanswered. Submit anyway?`)) return;
                    submitAssessment(false);
                  }} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold transition">
                    <Send className="w-4 h-4"/> Submit
                  </button>
                )}
              </div>
              {currentQ < total - 1 && answered === total && (
                <div className="mt-4 text-center">
                  <button onClick={() => submitAssessment(false)} className="text-sm text-emerald-400 underline hover:text-emerald-300">
                    All answered — submit now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Submitting ──────────────────────────────────────────────────────────────
  if (phase === "submitting") return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-5">
      <Loader className="w-10 h-10 animate-spin text-blue-400"/>
      <div className="text-center">
        <p className="text-xl font-semibold">Submitting &amp; Generating AI Feedback</p>
        <p className="text-gray-400 text-sm mt-1">AI is analysing every answer — hang tight…</p>
      </div>
    </div>
  );

  // ── Results ─────────────────────────────────────────────────────────────────
  if (phase === "results" && assessment) {
    const pct     = assessment.percentage || 0;
    const sl      = scoreLabel(pct);
    const fb      = assessment.aiFeedback || {};
    const correct = assessment.questions?.filter(q => q.isCorrect).length || 0;
    const vLog    = assessment.violationLog || violationLog;

    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar/>
        <div className="max-w-4xl mx-auto px-4 py-10">

          {/* Score hero */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 mb-8 text-center">
            <Trophy className="w-14 h-14 text-yellow-400 mx-auto mb-3"/>
            <p className={`text-5xl font-extrabold mb-1 ${sl.c}`}>{pct}%</p>
            <p className={`text-xl font-semibold mb-1 ${sl.c}`}>{sl.t}</p>
            <p className="text-gray-400 text-sm mb-6">{assessment.title}</p>
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              {[
                { l: "Correct",    v: `${correct}/${total}`,                                c: "text-emerald-400" },
                { l: "Score",      v: `${assessment.score}/${assessment.maxScore}`,         c: "text-blue-400"   },
                { l: "Violations", v: vLog.length, c: vLog.length > 0 ? "text-red-400" : "text-gray-400" },
              ].map(({ l, v, c }) => (
                <div key={l} className="bg-gray-800/60 rounded-xl p-3">
                  <div className={`text-xl font-bold ${c}`}>{v}</div>
                  <div className="text-xs text-gray-500">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Overall feedback */}
          {fb.overallAnalysis && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-8">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-400"/> AI Performance Analysis
              </h2>
              <p className="text-gray-300 leading-relaxed mb-5">{fb.overallAnalysis}</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {fb.strongAreas?.length > 0 && (
                  <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-xl p-4">
                    <p className="font-semibold text-emerald-300 text-sm mb-2 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4"/> Strong Areas
                    </p>
                    <ul className="space-y-1">{fb.strongAreas.map((a,i) => <li key={i} className="text-sm text-gray-300">• {a}</li>)}</ul>
                  </div>
                )}
                {fb.weakAreas?.length > 0 && (
                  <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4">
                    <p className="font-semibold text-red-300 text-sm mb-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4"/> Needs Improvement
                    </p>
                    <ul className="space-y-1">{fb.weakAreas.map((a,i) => <li key={i} className="text-sm text-gray-300">• {a}</li>)}</ul>
                  </div>
                )}
                {fb.recommendations?.length > 0 && (
                  <div className="bg-blue-900/20 border border-blue-700/40 rounded-xl p-4">
                    <p className="font-semibold text-blue-300 text-sm mb-2 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4"/> Recommendations
                    </p>
                    <ul className="space-y-1">{fb.recommendations.map((r,i) => <li key={i} className="text-sm text-gray-300">• {r}</li>)}</ul>
                  </div>
                )}
                {fb.nextTopicsToStudy?.length > 0 && (
                  <div className="bg-purple-900/20 border border-purple-700/40 rounded-xl p-4">
                    <p className="font-semibold text-purple-300 text-sm mb-2 flex items-center gap-1">
                      <BookOpen className="w-4 h-4"/> Study Next
                    </p>
                    <ul className="space-y-1">{fb.nextTopicsToStudy.map((t,i) => <li key={i} className="text-sm text-gray-300">• {t}</li>)}</ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Per-question review */}
          <div className="mb-8">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-purple-400"/> Question-by-Question Review
            </h2>
            <div className="space-y-3">
              {assessment.questions?.map((q, i) => {
                const isOpen = expandedQ === i;
                const isRight = q.isCorrect;
                return (
                  <div key={i} className={`border rounded-xl overflow-hidden ${
                    isRight ? "border-emerald-700/40 bg-emerald-900/10" : "border-red-700/40 bg-red-900/10"
                  }`}>
                    <button className="w-full text-left px-5 py-4 flex items-start gap-3"
                      onClick={() => setExpandedQ(isOpen ? null : i)}>
                      {isRight
                        ? <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0"/>
                        : <XCircle    className="w-5 h-5 text-red-400 mt-0.5 shrink-0"/>}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-100">{q.question}</p>
                        <div className="flex gap-3 mt-1">
                          <span className={`text-xs font-bold ${isRight ? "text-emerald-400" : "text-red-400"}`}>
                            {isRight ? `+${q.pointsEarned} pts` : "0 pts"}
                          </span>
                          <span className="text-xs text-gray-500">{q.type} · {q.difficulty}</span>
                        </div>
                      </div>
                      <span className="text-gray-500 text-xs shrink-0">{isOpen ? "▲" : "▼"}</span>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-4 border-t border-gray-800 space-y-4">
                        {/* MCQ breakdown */}
                        {q.type === "mcq" && q.options && (
                          <div className="space-y-2">
                            {q.options.map((opt, oi) => {
                              const isUser = String(q.userAnswer) === String(oi);
                              const isCorr = q.correctOption === oi;
                              return (
                                <div key={oi} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm ${
                                  isCorr && isUser ? "bg-emerald-800/40 border border-emerald-600/50" :
                                  isCorr           ? "bg-emerald-900/20 border border-emerald-700/30" :
                                  isUser           ? "bg-red-800/40 border border-red-600/50" :
                                  "bg-gray-800/40 border border-gray-700/30"
                                }`}>
                                  <span className={`font-bold text-xs w-5 h-5 rounded flex items-center justify-center ${
                                    isCorr ? "bg-emerald-500 text-white" : isUser ? "bg-red-500 text-white" : "bg-gray-700 text-gray-400"
                                  }`}>{String.fromCharCode(65+oi)}</span>
                                  <span className={isCorr ? "text-emerald-200" : isUser ? "text-red-300" : "text-gray-400"}>{opt}</span>
                                  {isUser && !isCorr && <span className="ml-auto text-xs text-red-400">Your answer</span>}
                                  {isCorr && <span className="ml-auto text-xs text-emerald-400">✓ Correct</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Short answer */}
                        {q.type !== "mcq" && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Your Answer</p>
                            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-sm text-gray-300">
                              {q.userAnswer || <span className="text-gray-600 italic">No answer given</span>}
                            </div>
                          </div>
                        )}

                        {q.correctAnswer && (
                          <div>
                            <p className="text-xs text-emerald-400 mb-1 font-semibold uppercase tracking-wider">Ideal Answer</p>
                            <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-3 text-sm text-emerald-100">
                              {q.correctAnswer}
                            </div>
                          </div>
                        )}

                        {q.explanation && (
                          <div>
                            <p className="text-xs text-blue-400 mb-1 font-semibold uppercase tracking-wider">Explanation</p>
                            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 text-sm text-blue-100">
                              {q.explanation}
                            </div>
                          </div>
                        )}

                        {q.aiFeedback && (
                          <div>
                            <p className="text-xs text-purple-400 mb-1 font-semibold uppercase tracking-wider flex items-center gap-1">
                              🤖 AI Feedback
                            </p>
                            <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-3 text-sm text-purple-100 leading-relaxed">
                              {q.aiFeedback}
                            </div>
                          </div>
                        )}

                        {q.keywords?.length > 0 && (
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-xs text-gray-500">Key concepts:</span>
                            {q.keywords.map(k => (
                              <span key={k} className={`text-xs px-2 py-0.5 rounded-full border ${
                                q.userAnswer?.toLowerCase?.()?.includes(k.toLowerCase())
                                  ? "bg-emerald-800/40 text-emerald-300 border-emerald-700/40"
                                  : "bg-gray-800 text-gray-500 border-gray-700"
                              }`}>{k}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Violation log */}
          {vLog?.length > 0 && (
            <div className="bg-red-950/20 border border-red-800/40 rounded-xl p-5 mb-8">
              <h3 className="font-semibold text-red-300 text-sm mb-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4"/> Proctoring Log ({vLog.length} events)
              </h3>
              <ul className="space-y-1">
                {vLog.map((v, i) => (
                  <li key={i} className="text-xs text-gray-400 flex gap-3">
                    <span className="text-red-400">#{i+1}</span>
                    <span className="text-gray-500">{new Date(v.time).toLocaleTimeString()}</span>
                    <span>{v.type}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button onClick={() => navigate("/syllabus")}
              className="flex-1 py-3 border border-gray-700 rounded-xl hover:bg-gray-800 transition flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4"/> Syllabus
            </button>
            <button onClick={() => navigate("/preparation")}
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl transition flex items-center justify-center gap-2">
              <BookOpen className="w-4 h-4"/> Study Resources
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}