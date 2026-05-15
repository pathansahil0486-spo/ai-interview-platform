import { useUser } from "@clerk/clerk-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import toast from "react-hot-toast";
import CountdownTimer from "../components/RealTimeInterview/CountdownTimer";
import VideoPanel from "../components/RealTimeInterview/VideoPanel";
import ChatPanel, { speakText, stopSpeaking } from "../components/RealTimeInterview/ChatPanel";
import InterviewControls from "../components/RealTimeInterview/InterviewControls";
import { useWebRTC } from "../hooks/useWebRTC";
import { useGestureDetection } from "../hooks/useGestureDetection";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useInterviewAnalysis } from "../hooks/useInterviewAnalysis";
import { socketService } from "../services/socketService";
import { Loader, AlertCircle, ShieldAlert, Eye, Zap, MessageSquare, TrendingUp } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ══════════════════════════════════════════════════════════════════════════════
// BULLETPROOF TTS ENGINE
// ══════════════════════════════════════════════════════════════════════════════

let _voices = [];
let _voicesLoaded = false;
let _keepAliveTimer = null;

function loadVoices() {
  return new Promise((resolve) => {
    const v = window.speechSynthesis.getVoices();
    if (v.length > 0) { _voices = v; _voicesLoaded = true; resolve(_voices); return; }
    const handler = () => {
      _voices = window.speechSynthesis.getVoices();
      _voicesLoaded = true;
      resolve(_voices);
    };
    window.speechSynthesis.addEventListener("voiceschanged", handler, { once: true });
    setTimeout(() => {
      _voices = window.speechSynthesis.getVoices();
      _voicesLoaded = true;
      resolve(_voices);
    }, 2500);
  });
}

function getBestVoice() {
  const priority = [
    v => v.name === "Google US English",
    v => v.name === "Samantha" && v.localService,
    v => v.name === "Karen",
    v => v.name === "Daniel",
    v => v.name.includes("Aria")  && v.lang.startsWith("en"),
    v => v.name.includes("Jenny") && v.lang.startsWith("en"),
    v => v.lang === "en-US" && v.localService,
    v => v.lang === "en-US",
    v => v.lang.startsWith("en"),
  ];
  for (const test of priority) {
    const m = _voices.find(test);
    if (m) return m;
  }
  return null;
}

function startKeepAlive() {
  stopKeepAlive();
  _keepAliveTimer = setInterval(() => {
    if (!window.speechSynthesis) return;
    if (window.speechSynthesis.speaking) return;
    const dummy = new SpeechSynthesisUtterance(" ");
    dummy.volume = 0;
    dummy.rate = 10;
    try { window.speechSynthesis.speak(dummy); } catch {}
  }, 12000);
}

function stopKeepAlive() {
  if (_keepAliveTimer) { clearInterval(_keepAliveTimer); _keepAliveTimer = null; }
}

function splitIntoChunks(text) {
  const sentences = text
    .replace(/([.!?])\s+/g, "$1|||")
    .split("|||")
    .map(s => s.trim())
    .filter(Boolean);

  const chunks = [];
  for (const sentence of sentences) {
    if (sentence.length <= 200) {
      chunks.push(sentence);
    } else {
      const parts = sentence.split(/,\s+/);
      let current = "";
      for (const part of parts) {
        if ((current + part).length > 180) {
          if (current) chunks.push(current.trim());
          current = part;
        } else {
          current = current ? current + ", " + part : part;
        }
      }
      if (current) chunks.push(current.trim());
    }
  }
  return chunks.filter(Boolean);
}

function waitForVisible() {
  return new Promise((resolve) => {
    if (!document.hidden) { resolve(); return; }
    const handler = () => { if (!document.hidden) { document.removeEventListener("visibilitychange", handler); resolve(); } };
    document.addEventListener("visibilitychange", handler);
  });
}

function speakOneChunk(text, opts = {}, cancelRef) {
  return new Promise((resolve) => {
    if (cancelRef.cancelled) { resolve("cancelled"); return; }

    const attempt = (isRetry = false) => {
      if (cancelRef.cancelled) { resolve("cancelled"); return; }

      const utter = new SpeechSynthesisUtterance(text.trim());
      utter.rate   = opts.rate   ?? 0.82;
      utter.pitch  = opts.pitch  ?? 1.04;
      utter.volume = opts.volume ?? 1.0;
      utter.lang   = "en-US";

      const voice = getBestVoice();
      if (voice) utter.voice = voice;

      const maxMs = Math.max(6000, text.length * 90 + 2000);
      const fallback = setTimeout(() => {
        try { window.speechSynthesis.cancel(); } catch {}
        resolve("timeout");
      }, maxMs);

      utter.onend = () => {
        clearTimeout(fallback);
        resolve("done");
      };

      utter.onerror = (e) => {
        clearTimeout(fallback);
        if (e.error === "interrupted" && !isRetry && !cancelRef.cancelled) {
          setTimeout(() => {
            if (cancelRef.cancelled) { resolve("cancelled"); return; }
            try { window.speechSynthesis.cancel(); } catch {}
            setTimeout(() => attempt(true), 80);
          }, 200);
        } else {
          resolve(e.error === "interrupted" ? "interrupted" : "error");
        }
      };

      window.speechSynthesis.speak(utter);
    };

    attempt(false);
  });
}

function createSpeakSession() {
  const cancelRef = { cancelled: false };

  const cancel = () => {
    cancelRef.cancelled = true;
    stopKeepAlive();
    try { window.speechSynthesis.cancel(); } catch {}
  };

  const speak = async (text, opts = {}, callbacks = {}) => {
    const { onStart, onEnd, onError, muteMic, unmuteMic } = callbacks;

    if (!text?.trim()) { onEnd?.(); return; }
    if (!_voicesLoaded) await loadVoices();
    if (cancelRef.cancelled) { onError?.(); return; }

    try { window.speechSynthesis.cancel(); } catch {}
    await new Promise(r => setTimeout(r, 150));
    if (cancelRef.cancelled) { onError?.(); return; }

    await waitForVisible();
    if (cancelRef.cancelled) { onError?.(); return; }

    muteMic?.();

    onStart?.();
    startKeepAlive();

    const chunks = splitIntoChunks(text);

    try {
      for (const chunk of chunks) {
        if (cancelRef.cancelled) break;
        if (!chunk) continue;

        if (window.speechSynthesis.paused) {
          try { window.speechSynthesis.resume(); } catch {}
        }

        const result = await speakOneChunk(chunk, opts, cancelRef);

        if (result === "cancelled" || cancelRef.cancelled) break;

        if (!cancelRef.cancelled) {
          await new Promise(r => setTimeout(r, 120));
        }
      }
    } finally {
      stopKeepAlive();
      unmuteMic?.();
    }

    if (cancelRef.cancelled) {
      onError?.();
    } else {
      onEnd?.();
    }
  };

  return { speak, cancel, get cancelled() { return cancelRef.cancelled; } };
}

function stopAllSpeech() {
  stopKeepAlive();
  try { window.speechSynthesis.cancel(); } catch {}
}

// ══════════════════════════════════════════════════════════════════════════════
// PER-ANSWER FEEDBACK OVERLAY
// ══════════════════════════════════════════════════════════════════════════════

function AnswerFeedbackOverlay({ feedback, onDismiss }) {
  if (!feedback) return null;
  const { score, strengths = [], improvements = [], detailedFeedback, timeSpent } = feedback;
  const scoreColor = score >= 75 ? "#4ade80" : score >= 50 ? "#facc15" : "#f87171";
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, fontFamily: "'Sora','Segoe UI',sans-serif",
    }}>
      <div style={{
        background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20, padding: "28px 32px", maxWidth: 520, width: "100%",
        boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 54, fontWeight: 900, color: scoreColor, lineHeight: 1, marginBottom: 4 }}>{score}</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>/ 100 &nbsp;·&nbsp; {timeSpent ? `${timeSpent}s` : ""}</div>
        </div>
        {detailedFeedback && (
          <p style={{ color: "#e2e8f0", fontSize: 13, lineHeight: 1.65, marginBottom: 16, textAlign: "center" }}>{detailedFeedback}</p>
        )}
        {strengths.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: "#4ade80", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 5 }}>✓ STRENGTHS</div>
            {strengths.map((s, i) => <div key={i} style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginBottom: 3, paddingLeft: 8 }}>• {s}</div>)}
          </div>
        )}
        {improvements.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: "#f87171", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 5 }}>↑ AREAS TO IMPROVE</div>
            {improvements.map((m, i) => <div key={i} style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginBottom: 3, paddingLeft: 8 }}>• {m}</div>)}
          </div>
        )}
        <button onClick={onDismiss} style={{
          width: "100%", padding: 12, borderRadius: 12,
          background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
          border: "none", color: "#fff", fontWeight: 700, fontSize: 14,
          cursor: "pointer", fontFamily: "'Sora','Segoe UI',sans-serif",
        }}>
          Next Question →
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ANTI-CHEAT BANNER
// ══════════════════════════════════════════════════════════════════════════════

function AntiCheatBanner({ warning, onDismiss }) {
  if (!warning) return null;
  return (
    <div style={{
      position: "fixed", top: 52, left: "50%", transform: "translateX(-50%)",
      zIndex: 100, background: "#1a0a0a", border: "1px solid rgba(239,68,68,0.6)",
      borderRadius: 12, padding: "10px 18px", display: "flex", alignItems: "center",
      gap: 10, boxShadow: "0 8px 32px rgba(239,68,68,0.2)",
      fontFamily: "'Sora','Segoe UI',sans-serif", maxWidth: 420,
    }}>
      <ShieldAlert style={{ width: 15, height: 15, color: "#f87171", flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: "#fca5a5", flex: 1 }}>{warning.message}</span>
      <button onClick={onDismiss} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 14 }}>✕</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// AI THINKING BAR
// ══════════════════════════════════════════════════════════════════════════════

function AIThinkingBar({ isThinking, message }) {
  if (!isThinking) return null;
  return (
    <div style={{
      position: "fixed", bottom: 72, left: "50%", transform: "translateX(-50%)",
      zIndex: 90, background: "rgba(99,102,241,0.12)",
      border: "1px solid rgba(99,102,241,0.3)", borderRadius: 9999,
      padding: "7px 16px", display: "flex", alignItems: "center", gap: 8,
      fontFamily: "'Sora','Segoe UI',sans-serif",
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: "50%", background: "#818cf8",
        animation: "acPulse 1s ease infinite",
      }} />
      <span style={{ fontSize: 12, color: "#a5b4fc" }}>{message || "AI is thinking…"}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// INTERVIEW END SCREEN
// ══════════════════════════════════════════════════════════════════════════════

function InterviewEndScreen({ userName, onSpeechDone }) {
  const firstName = userName?.trim().split(/\s+/)[0] || "there";
  const hasSpokeRef = useRef(false);

  useEffect(() => {
    if (hasSpokeRef.current) return;
    hasSpokeRef.current = true;

    loadVoices().then(() => {
      const session = createSpeakSession();
      const msg = `Fantastic effort, ${firstName}! You've completed your interview. No matter the outcome, the fact that you showed up and gave it your best is something to be proud of. Take a moment to breathe and relax — you did great. Results will be ready shortly.`;
      session.speak(
        msg,
        { rate: 0.84, pitch: 1.05 },
        {
          onEnd:   () => onSpeechDone?.(),
          onError: () => onSpeechDone?.(),
        }
      );
    });
  }, []); // eslint-disable-line

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "linear-gradient(135deg,#0a0a1a,#0d1b2a)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Sora','Segoe UI',sans-serif", textAlign: "center", padding: 24,
    }}>
      <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
      <div style={{ fontSize: "clamp(26px,5vw,38px)", fontWeight: 800, color: "#fff", marginBottom: 12 }}>
        Interview Complete!
      </div>
      <div style={{ fontSize: "clamp(15px,3vw,20px)", fontWeight: 700, marginBottom: 18,
        background: "linear-gradient(135deg,#4ade80,#38bdf8)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>
        You did amazing, {firstName}! 🌟
      </div>
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, lineHeight: 1.7, maxWidth: 460, marginBottom: 28 }}>
        No matter the outcome, showing up and giving your best effort is something to be truly proud of.
        Take a deep breath — you've earned it.
      </p>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        color: "rgba(255,255,255,0.4)", fontSize: 13,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", animation: "acPulse 1s ease infinite" }} />
        Preparing your results…
      </div>
      <style>{`@keyframes acPulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function RealTimeInterviewPage() {
  const { user }   = useUser();
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [interview, setInterview]               = useState(null);
  const [loading, setLoading]                   = useState(true);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [showCountdown, setShowCountdown]       = useState(false);
  const [showEndScreen, setShowEndScreen]       = useState(false);
  const [interviewStatus, setInterviewStatus]   = useState("pending");
  const [aiMessages, setAiMessages]             = useState([]);
  const [currentQuestion, setCurrentQuestion]   = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [warningCount, setWarningCount]         = useState(0);
  const [isAISpeaking, setIsAISpeaking]         = useState(false);
  const [answerFeedback, setAnswerFeedback]     = useState(null);
  const [antiCheatWarning, setAntiCheatWarning] = useState(null);
  const [isAIThinking, setIsAIThinking]         = useState(false);
  const [aiThinkingMsg, setAIThinkingMsg]       = useState("");
  const [questionProgress, setQuestionProgress] = useState({ current: 0, total: 0 });

  const startTimeRef         = useRef(null);
  const screenshotOverlayRef = useRef(null);
  const warnDismissTimer     = useRef(null);
  const questionStartTime    = useRef(null);
  const videoElementRef      = useRef(null);
  const isSendingRef         = useRef(false);
  const currentSpeakSession  = useRef(null);
  const repeatTimerRef       = useRef(null);
  const hasRepeatedRef       = useRef(false);
  const currentQuestionText  = useRef("");
  const completionNavigateRef = useRef(null);

  // Sync refs
  const isAISpeakingRef    = useRef(false);
  const isAIThinkingRef    = useRef(false);
  const interviewStatusRef = useRef("pending");
  const isMountedRef       = useRef(true);

  const localStreamRef = useRef(null);

  const muteMicTrack = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false; });
  }, []);

  const unmuteMicTrack = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = true; });
  }, []);

  useEffect(() => () => { isMountedRef.current = false; }, []);
  useEffect(() => { isAISpeakingRef.current   = isAISpeaking;    }, [isAISpeaking]);
  useEffect(() => { isAIThinkingRef.current   = isAIThinking;    }, [isAIThinking]);
  useEffect(() => { interviewStatusRef.current = interviewStatus; }, [interviewStatus]);

  const {
    localStream, isVideoEnabled, isAudioEnabled,
    toggleVideo, toggleAudio, startMedia, stopMedia, mediaError, forceStopCamera,
  } = useWebRTC();

  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

  const { gestures, postureScore, startGestureDetection, stopGestureDetection } = useGestureDetection();

  const cancelCurrentSpeech = useCallback(() => {
    if (currentSpeakSession.current) {
      currentSpeakSession.current.cancel();
      currentSpeakSession.current = null;
    }
    stopAllSpeech();
    if (repeatTimerRef.current) {
      clearTimeout(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
    setIsAISpeaking(false);
    isAISpeakingRef.current = false;
    unmuteMicTrack();
  }, [unmuteMicTrack]);

  const handleCheatDetected = useCallback((transcript) => {
    const msg = { message: "⚠ Suspicious input detected — looks like you may be reading from an external source. This has been flagged." };
    setAntiCheatWarning(msg);
    setWarningCount(c => c + 1);
    socketService.emit("anti_cheat_event", { type: "suspicious_speech", interviewId: id, transcript });
    if (warnDismissTimer.current) clearTimeout(warnDismissTimer.current);
    warnDismissTimer.current = setTimeout(() => setAntiCheatWarning(null), 6000);
  }, [id]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSendMessage = useCallback((message) => {
    const text = (message || "").trim();
    if (!text || isAIThinkingRef.current || isSendingRef.current) return;
    if (interviewStatusRef.current !== "active") return;

    cancelCurrentSpeech();

    if (repeatTimerRef.current) { clearTimeout(repeatTimerRef.current); repeatTimerRef.current = null; }
    hasRepeatedRef.current = false;

    isSendingRef.current = true;
    const timeSpent = questionStartTime.current
      ? Math.floor((Date.now() - questionStartTime.current) / 1000)
      : 0;

    setAiMessages(prev => [...prev, { text, sender: "user", timestamp: new Date() }]);
    resetTranscript();
    setIsAIThinking(true);
    isAIThinkingRef.current = true;
    setAIThinkingMsg("Analysing your answer…");

    socketService.emit("user_response", {
      interviewId: id,
      message: text,
      transcript: text,
      gestures,
      postureScore,
      timeSpent,
    });

    const safety = setTimeout(() => {
      if (!isMountedRef.current) return;
      isSendingRef.current    = false;
      isAIThinkingRef.current = false;
      setIsAIThinking(false);
    }, 30000);
    return () => clearTimeout(safety);
  }, [id, gestures, postureScore, cancelCurrentSpeech]); // eslint-disable-line

  const {
    isListening, transcript, isSpeaking: userIsSpeaking,
    startListening, stopListening, resetTranscript, getTranscript,
    isSupported: isSpeechSupported,
  } = useSpeechRecognition({
    silenceMs: 2800,
    minWordsToSubmit: 4,
    onSilence: useCallback((finalTranscript) => {
      if (interviewStatusRef.current !== "active") return;
      if (isAISpeakingRef.current)  return;
      if (isAIThinkingRef.current)  return;
      if (isSendingRef.current)     return;
      if (!finalTranscript?.trim()) return;
      handleSendMessage(finalTranscript.trim());
    }, [handleSendMessage]),
    onSpeechStart: useCallback(() => {
      if (isAISpeakingRef.current) {
        cancelCurrentSpeech();
      }
    }, [cancelCurrentSpeech]),
    onCheatDetected: handleCheatDetected,
  });

  const { analysis, startAnalysis, stopAnalysis, updateAnalysis } = useInterviewAnalysis();

  const speakQuestion = useCallback((text, { onDone } = {}) => {
    if (!text?.trim()) { onDone?.(); return; }

    cancelCurrentSpeech();
    stopListening();

    const session = createSpeakSession();
    currentSpeakSession.current = session;

    session.speak(
      text,
      { rate: 0.85, pitch: 1.04 },
      {
        muteMic:   muteMicTrack,
        unmuteMic: unmuteMicTrack,
        onStart: () => {
          if (!isMountedRef.current) return;
          setIsAISpeaking(true);
          isAISpeakingRef.current = true;
        },
        onEnd: () => {
          if (!isMountedRef.current) return;
          setIsAISpeaking(false);
          isAISpeakingRef.current = false;
          currentSpeakSession.current = null;
          onDone?.();

          if (interviewStatusRef.current === "active" && isSpeechSupported) {
            setTimeout(() => {
              if (isMountedRef.current && interviewStatusRef.current === "active") {
                startListening();
              }
            }, 700);
          }
        },
        onError: () => {
          if (!isMountedRef.current) return;
          setIsAISpeaking(false);
          isAISpeakingRef.current = false;
          currentSpeakSession.current = null;
          onDone?.();
          if (interviewStatusRef.current === "active" && isSpeechSupported) {
            setTimeout(() => {
              if (isMountedRef.current) startListening();
            }, 700);
          }
        },
      }
    );
  }, [cancelCurrentSpeech, isSpeechSupported, muteMicTrack, unmuteMicTrack, startListening, stopListening]);

  const scheduleRepeat = useCallback((questionText) => {
    if (repeatTimerRef.current) clearTimeout(repeatTimerRef.current);
    hasRepeatedRef.current = false;

    repeatTimerRef.current = setTimeout(() => {
      if (
        isMountedRef.current &&
        interviewStatusRef.current === "active" &&
        !isSendingRef.current &&
        !isAIThinkingRef.current &&
        !hasRepeatedRef.current
      ) {
        hasRepeatedRef.current = true;
        const repeatText = `Just to clarify — ${questionText}`;
        speakQuestion(repeatText, { onDone: () => {} });
      }
    }, 14000);
  }, [speakQuestion]);

  useEffect(() => {
    const fn = (e) => {
      if (interviewStarted && interviewStatus === "active") {
        e.preventDefault(); e.returnValue = "Interview in progress. Leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", fn);
    return () => window.removeEventListener("beforeunload", fn);
  }, [interviewStarted, interviewStatus]);

  useEffect(() => {
    loadVoices();
    if (user && id) fetchInterview();
    return () => {
      isMountedRef.current = false;
      stopAllServices();
      socketService.disconnect();
      stopAllSpeech();
    };
  }, [user, id]); // eslint-disable-line

  useEffect(() => {
    if (interviewStarted && localStream) {
      if (isSpeechSupported) startListening();
      startAnalysis();
      startTimeRef.current = new Date();
    }
  }, [interviewStarted, localStream]); // eslint-disable-line

  useEffect(() => {
    if (interviewStarted && localStream && videoElementRef.current) {
      startGestureDetection(videoElementRef.current);
    }
  }, [interviewStarted, localStream]); // eslint-disable-line

  useEffect(() => {
    if (interviewStatus !== "active") return;
    const t = setInterval(() => {
      updateAnalysis({
        gestures, postureScore,
        speechMetrics: {
          speakingRate: transcript.split(" ").length / 2,
          clarity: 75,
          confidence: Math.max(50, Math.min(95, gestures?.confidence || 70)),
        },
        feedback: (() => {
          const f = [];
          if ((postureScore || 80) < 65) f.push("Sit upright for better presence.");
          if ((gestures?.eyeContact || 80) < 60) f.push("Maintain eye contact with the camera.");
          if (gestures?.handGestures === "Low") f.push("Use natural hand gestures to appear more engaged.");
          return f.join(" ") || "Great posture and presence!";
        })(),
      });
    }, 4000);
    return () => clearInterval(t);
  }, [interviewStatus, gestures, postureScore, transcript, isListening]); // eslint-disable-line

  useEffect(() => {
    if (!interviewStarted) return;
    const fn = () => {
      if (document.hidden) {
        setWarningCount(c => c + 1);
        socketService.emit("anti_cheat_event", { type: "tab_switch", interviewId: id });
        showWarning("⚠ Tab switch detected. This is being recorded.");
      }
    };
    document.addEventListener("visibilitychange", fn);
    return () => document.removeEventListener("visibilitychange", fn);
  }, [interviewStarted, id]); // eslint-disable-line

  useEffect(() => {
    if (!interviewStarted) return;
    const showOverlay = () => {
      if (screenshotOverlayRef.current) return;
      const div = document.createElement("div");
      div.style.cssText = "position:fixed;inset:0;z-index:999999;background:#000;pointer-events:none;";
      document.body.appendChild(div);
      screenshotOverlayRef.current = div;
      setTimeout(() => {
        div.style.transition = "opacity 0.2s ease"; div.style.opacity = "0";
        setTimeout(() => { div.remove(); screenshotOverlayRef.current = null; }, 220);
      }, 600);
    };
    const onKeyDown = (e) => {
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        e.preventDefault(); showOverlay();
        socketService.emit("anti_cheat_event", { type: "screenshot", interviewId: id });
        setWarningCount(c => c + 1);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault(); showOverlay();
        socketService.emit("anti_cheat_event", { type: "screenshot", interviewId: id });
        setWarningCount(c => c + 1);
      }
    };
    const onCtxMenu = (e) => e.preventDefault();
    const onCopy = (e) => {
      e.preventDefault();
      socketService.emit("anti_cheat_event", { type: "copy_paste", interviewId: id });
      showWarning("⚠ Copying is not allowed during the interview.");
      setWarningCount(c => c + 1);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("contextmenu", onCtxMenu);
    window.addEventListener("copy", onCopy);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("contextmenu", onCtxMenu);
      window.removeEventListener("copy", onCopy);
      screenshotOverlayRef.current?.remove(); screenshotOverlayRef.current = null;
    };
  }, [interviewStarted, id]); // eslint-disable-line

  const showWarning = useCallback((message, durationMs = 5000) => {
    setAntiCheatWarning({ message });
    if (warnDismissTimer.current) clearTimeout(warnDismissTimer.current);
    warnDismissTimer.current = setTimeout(() => setAntiCheatWarning(null), durationMs);
  }, []);

  const fetchInterview = async () => {
    try {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/interviews/${id}?userId=${user.id}`);
        if (res.ok) {
          const d = await res.json();
          if (d.success) {
            setInterview(d.data);
            setQuestionProgress({ current: 0, total: d.data.questions?.length || 0 });
          }
        }
      } catch {
        setInterview({ _id: id, title: "Interview Session", jobPosition: "Software Engineer", interviewType: "mixed" });
      }
      initSocket();
    } catch {
      toast.error("Failed to setup session");
    } finally {
      setLoading(false);
    }
  };

  const initSocket = () => {
    socketService.connect(user.id, id);
    socketService.on("connect", () => setConnectionStatus("connected"));

    socketService.on("ai_ready", (data) => {
      setConnectionStatus("ready");
      toast.success(`✅ ${data.message || "AI Interviewer ready!"}`);
      if (data.interview?.totalQuestions)
        setQuestionProgress(p => ({ ...p, total: data.interview.totalQuestions }));
    });

    socketService.on("interview_started", (data) => {
      setInterviewStarted(true);
      setInterviewStatus("active");
      interviewStatusRef.current = "active";
      setCurrentQuestion(data.question);
      setQuestionProgress({ current: 1, total: data.totalQuestions });
      questionStartTime.current = Date.now();
      hasRepeatedRef.current = false;
      currentQuestionText.current = data.question.text;

      const firstMsg = {
        text: data.question.text,
        sender: "ai",
        timestamp: new Date(),
        questionNumber: 1,
        totalQuestions: data.totalQuestions,
        difficulty: data.question.difficulty,
      };
      setAiMessages([firstMsg]);
      setIsAIThinking(false);
      isAIThinkingRef.current = false;

      setTimeout(() => {
        speakQuestion(data.question.text, {
          onDone: () => {
            scheduleRepeat(data.question.text);
          },
        });
      }, 600);
    });

    socketService.on("ai_thinking", (data) => {
      setIsAIThinking(true);
      isAIThinkingRef.current = true;
      setAIThinkingMsg(data.message || "Analysing your answer…");
    });

    socketService.on("answer_feedback", (fb) => {
      setIsAIThinking(false);
      isAIThinkingRef.current = false;
      isSendingRef.current = false;
      if (repeatTimerRef.current) { clearTimeout(repeatTimerRef.current); repeatTimerRef.current = null; }
      setAnswerFeedback(fb);
      resetTranscript();
    });

    socketService.on("ai_message", (msg) => {
      setIsAIThinking(false);
      isAIThinkingRef.current = false;
      isSendingRef.current = false;
      if (repeatTimerRef.current) { clearTimeout(repeatTimerRef.current); repeatTimerRef.current = null; }
      hasRepeatedRef.current = false;

      const m = { ...msg, sender: "ai", timestamp: new Date() };
      setAiMessages(prev => [...prev, m]);
      setCurrentQuestion(m);
      setQuestionProgress(p => ({ ...p, current: msg.questionNumber || p.current + 1 }));
      questionStartTime.current = Date.now();
      currentQuestionText.current = m.text;
      resetTranscript();

      setTimeout(() => {
        speakQuestion(m.text, {
          onDone: () => {
            scheduleRepeat(m.text);
          },
        });
      }, 500);
    });

    socketService.on("anti_cheat_warning", (data) => {
      setAntiCheatWarning(data);
      if (warnDismissTimer.current) clearTimeout(warnDismissTimer.current);
      warnDismissTimer.current = setTimeout(() => setAntiCheatWarning(null), 5000);
    });

    socketService.on("interview_completed", handleCompletion);

    socketService.on("error", (e) => {
      setConnectionStatus("error");
      setIsAIThinking(false);
      isAIThinkingRef.current = false;
      isSendingRef.current = false;
      toast.error(e.message || "Connection error");
    });
  };

  const stopAllServices = () => {
    stopMedia();
    stopGestureDetection();
    stopListening();
    stopAnalysis();
    cancelCurrentSpeech();
    stopAllSpeech();
    if (warnDismissTimer.current) clearTimeout(warnDismissTimer.current);
    if (repeatTimerRef.current)   clearTimeout(repeatTimerRef.current);
  };

  const handleStartInterview = async () => {
    try {
      await startMedia();
      setShowCountdown(true);
    } catch {
      toast.error("Please allow camera and microphone access.");
    }
  };

  const handleCountdownComplete = useCallback(() => {
    socketService.emit("start_interview", { interviewId: id, userId: user.id });
    setShowCountdown(false);
  }, [id, user?.id]);

  const handleCompletion = async (results) => {
    stopAllServices();
    setInterviewStatus("completed");
    interviewStatusRef.current = "completed";
    setIsAIThinking(false);
    isAIThinkingRef.current = false;
    isSendingRef.current = false;

    completionNavigateRef.current = () => navigate(`/interview/${id}/results`);
    setShowEndScreen(true);

    const duration = startTimeRef.current
      ? Math.floor((new Date() - startTimeRef.current) / 1000)
      : 0;

    try {
      const res = await fetch(`${API_URL}/interviews/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results, analysis, userId: user.id, duration }),
      });
      if (res.ok) {
        const d = await res.json();
      }
    } catch {}
  };

  const handleEndInterview = () => {
    if (!window.confirm("End interview early? Progress will be saved.")) return;
    stopAllServices();
    socketService.emit("end_interview", { interviewId: id, userId: user.id });
    setInterviewStatus("completed");
    interviewStatusRef.current = "completed";
    completionNavigateRef.current = () => navigate("/interviews");
    setShowEndScreen(true);
    toast("Interview ended.", { icon: "📋", duration: 2500 });
  };

  const handleSpeak = useCallback((text) => {
    speakQuestion(text);
  }, [speakQuestion]);

  const handleStopSpeaking = useCallback(() => {
    cancelCurrentSpeech();
    if (interviewStatusRef.current === "active" && isSpeechSupported) {
      setTimeout(() => { if (isMountedRef.current) startListening(); }, 300);
    }
  }, [cancelCurrentSpeech, isSpeechSupported, startListening]);

  // ── Loading screen (no Navbar) ──
  if (loading) return (
    <div style={{
      minHeight: "100dvh", background: "#07090f",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: "linear-gradient(135deg,#2563eb,#4338ca)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 12px", animation: "acPulse 1.5s ease infinite",
        }}>
          <Loader style={{ width: 28, height: 28, color: "#fff", animation: "spin 1s linear infinite" }} />
        </div>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, fontFamily: "'Sora','Segoe UI',sans-serif" }}>
          Setting up interview session…
        </p>
      </div>
      <style>{`
        @keyframes acPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin    { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );

  if (showCountdown) return (
    <CountdownTimer
      onComplete={handleCountdownComplete}
      userName={user?.fullName || user?.firstName || ""}
      interviewType={interview?.interviewType || "mixed"}
      interviewTitle={interview?.title || ""}
    />
  );

  if (showEndScreen) return (
    <InterviewEndScreen
      userName={user?.fullName || user?.firstName || ""}
      onSpeechDone={() => {
        setTimeout(() => {
          if (completionNavigateRef.current) completionNavigateRef.current();
          else navigate("/interviews");
        }, 800);
      }}
    />
  );

  const isConnected = connectionStatus === "connected" || connectionStatus === "ready";
  const isActive    = interviewStatus === "active";

  const chatProps = {
    messages: aiMessages,
    currentQuestion,
    onSendMessage: handleSendMessage,
    transcript,
    isSpeaking: userIsSpeaking,
    isListening,
    interviewStarted,
    interviewStatus,
    isAISpeaking,
    onSpeakMessage: handleSpeak,
    onStopSpeaking: handleStopSpeaking,
    isSpeechSupported,
    onStartListening: startListening,
    onStopListening: stopListening,
    isAIThinking,
    questionProgress,
  };

  const videoProps = {
    localStream, isVideoEnabled, isAudioEnabled,
    interviewStarted, isAISpeaking,
    onVideoRef: (el) => { videoElementRef.current = el; },
  };

  const ctrlProps = {
    interviewStarted, interviewStatus, isVideoEnabled,
    onToggleVideo: toggleVideo,
    onStartInterview: handleStartInterview,
    onEndInterview: handleEndInterview,
    onForceStopCamera: forceStopCamera,
    connectionStatus, warningCount,
  };

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden", background: "#07090f" }}>
      <AntiCheatBanner warning={antiCheatWarning} onDismiss={() => setAntiCheatWarning(null)} />
      <AIThinkingBar isThinking={isAIThinking && !answerFeedback} message={aiThinkingMsg} />

      {answerFeedback && (
        <AnswerFeedbackOverlay
          feedback={answerFeedback}
          onDismiss={() => {
            setAnswerFeedback(null);
            isSendingRef.current = false;
            resetTranscript();
            if (isSpeechSupported && interviewStatusRef.current === "active") {
              setTimeout(() => { if (isMountedRef.current) startListening(); }, 400);
            }
          }}
        />
      )}

      {/* ── Slim interview status bar — no Navbar anywhere ── */}
      <div style={{
        flexShrink: 0, background: "rgba(9,11,17,0.97)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)", zIndex: 40,
        fontFamily: "'Sora','Segoe UI',sans-serif",
      }}>
        <div style={{ padding: "0 12px", height: 40, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 6 }}>
            {isActive && (
              <div style={{ width: 19, height: 19, borderRadius: 5, flexShrink: 0, background: "rgba(99,102,241,0.13)", border: "1px solid rgba(99,102,241,0.26)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldAlert style={{ width: 10, height: 10, color: "#818cf8" }} />
              </div>
            )}
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 11.5, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {interview?.title || "Interview Session"}
            </p>
            {isActive && questionProgress.total > 0 && (
              <span style={{ marginLeft: 4, fontSize: 10, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.06)", padding: "1px 7px", borderRadius: 9999, flexShrink: 0 }}>
                Q{questionProgress.current}/{questionProgress.total}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <SPill
              active={isConnected} color="emerald"
              label={connectionStatus === "ready" ? "AI Ready" : connectionStatus === "connected" ? "Live" : connectionStatus === "connecting" ? "Connecting" : "Error"}
            />
            {isActive && (
              <SPill
                active={isListening} color="blue"
                label={isListening ? (userIsSpeaking ? "Speaking" : "Listening") : "Mic off"}
                pulse={userIsSpeaking}
              />
            )}
            {isAISpeaking && <SPill active color="purple" label="AI Speaking" pulse />}
            {isAIThinking  && <SPill active color="indigo" label="Thinking"   pulse />}
            {warningCount > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 3, padding: "1px 6px", borderRadius: 9999, fontSize: 9.5, fontWeight: 700, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.28)", color: "#f87171" }}>
                ⚠ {warningCount}
              </span>
            )}
          </div>
        </div>

        {isActive && questionProgress.total > 0 && (
          <div style={{ height: 2, background: "rgba(255,255,255,0.06)" }}>
            <div style={{
              height: "100%",
              width: `${Math.max(0, ((questionProgress.current - 1) / questionProgress.total) * 100)}%`,
              background: "linear-gradient(90deg,#6366f1,#8b5cf6)",
              transition: "width 0.5s ease",
            }} />
          </div>
        )}

        {socketService?.isMock && (
          <div style={{ background: "rgba(245,158,11,0.07)", borderTop: "1px solid rgba(245,158,11,0.15)", color: "#fbbf24", fontSize: 10, textAlign: "center", padding: "2px 12px" }}>
            🔄 Demo Mode — Connect backend for full AI features
          </div>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Desktop */}
        <div className="hidden lg:flex" style={{ height: "100%", overflow: "hidden" }}>
          <div style={{ width: "38%", minWidth: 380, maxWidth: 560, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: "1px solid rgba(255,255,255,0.05)", overflow: "hidden", height: "100%" }}>
            <div style={{ flexShrink: 0, height: 200, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <VideoPanel {...videoProps} />
            </div>
            {isActive && (
              <div style={{ flexShrink: 0, height: 148, borderBottom: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
                <GesturePanel gestures={gestures} postureScore={postureScore} analysis={analysis} variant="mobile" />
              </div>
            )}
            <div style={{ flex: 1, minHeight: 0, padding: 12, overflow: "auto" }}>
              <InterviewControls {...ctrlProps} />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <ChatPanel {...chatProps} />
          </div>
        </div>

        {/* Mobile */}
        <div className="flex lg:hidden" style={{ height: "100%", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flexShrink: 0, height: 160, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <VideoPanel {...videoProps} size="sm" />
          </div>
          {isActive && (
            <div style={{ flexShrink: 0, height: 148, borderBottom: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
              <GesturePanel gestures={gestures} postureScore={postureScore} analysis={analysis} variant="mobile" />
            </div>
          )}
          <div style={{ flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <InterviewControls compact {...ctrlProps} />
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
            <ChatPanel {...chatProps} />
          </div>
        </div>
      </div>

      {mediaError && (
        <div style={{ position: "fixed", bottom: 14, right: 14, zIndex: 50, background: "#0d1117", border: "1px solid rgba(239,68,68,0.48)", color: "#fff", padding: "9px 13px", borderRadius: 12, boxShadow: "0 8px 28px rgba(0,0,0,0.5)", maxWidth: 300, display: "flex", alignItems: "center", gap: 7, fontFamily: "'Sora','Segoe UI',sans-serif" }}>
          <AlertCircle style={{ width: 13, height: 13, color: "#f87171", flexShrink: 0 }} />
          <span style={{ fontSize: 12 }}>{mediaError}</span>
        </div>
      )}
      {!isSpeechSupported && isActive && (
        <div style={{ position: "fixed", bottom: 14, left: 14, zIndex: 50, background: "#0d1117", border: "1px solid rgba(245,158,11,0.42)", color: "#fbbf24", padding: "9px 13px", borderRadius: 12, boxShadow: "0 8px 28px rgba(0,0,0,0.5)", maxWidth: 260, display: "flex", alignItems: "center", gap: 6, fontFamily: "'Sora','Segoe UI',sans-serif" }}>
          <AlertCircle style={{ width: 12, height: 12, flexShrink: 0 }} />
          <span style={{ fontSize: 11 }}>Speech recognition unavailable — use text input.</span>
        </div>
      )}

      <style>{`
        @keyframes acPulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4}  }
      `}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GESTURE PANEL
// ══════════════════════════════════════════════════════════════════════════════

function GesturePanel({ gestures, postureScore, analysis, variant }) {
  const eye  = gestures?.eyeContact   ?? 75;
  const conf = gestures?.confidence   ?? 65;
  const post = postureScore           ?? 80;
  const gest = gestures?.handGestures ?? "Moderate";

  const metrics = [
    { icon: TrendingUp,    label: "Posture",     value: post, isPercent: true,  color: post >= 80 ? "#4ade80" : post >= 60 ? "#facc15" : "#f87171" },
    { icon: Eye,           label: "Eye Contact", value: eye,  isPercent: true,  color: eye  >= 70 ? "#38bdf8" : "#facc15" },
    { icon: MessageSquare, label: "Confidence",  value: conf, isPercent: true,  color: conf >= 70 ? "#4ade80" : "#facc15" },
    { icon: Zap,           label: "Gesture",     value: gest, isPercent: false, color: "#c4b5fd" },
  ];

  const baseCard  = { display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "0 12px" };
  const container = { height: "100%", padding: variant === "desktop" ? "10px 14px" : "8px 10px", background: "#090d16", display: "flex", flexDirection: "column", gap: variant === "desktop" ? 8 : 6, boxSizing: "border-box", fontFamily: "'Sora','Segoe UI',sans-serif" };

  if (variant === "desktop") {
    return (
      <div style={container}>
        <div style={{ display: "flex", gap: 10, flex: 1, minHeight: 0 }}>
          {metrics.slice(0, 2).map(m => <MetricCard key={m.label} metric={m} style={{ ...baseCard, flex: 1, height: "100%" }} />)}
        </div>
        <div style={{ display: "flex", gap: 10, flex: 1, minHeight: 0 }}>
          {metrics.slice(2, 4).map(m => <MetricCard key={m.label} metric={m} style={{ ...baseCard, flex: 1, height: "100%" }} />)}
        </div>
        {analysis?.feedback && (
          <div style={{ flexShrink: 0, fontSize: 11, color: "#a5b4fc", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            💡 {analysis.feedback}
          </div>
        )}
      </div>
    );
  }
  return (
    <div style={container}>
      {metrics.map(m => <MetricCard key={m.label} metric={m} style={{ ...baseCard, flex: 1, minHeight: 0 }} />)}
      {analysis?.feedback && (
        <div style={{ flexShrink: 0, fontSize: 10, color: "#a5b4fc", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          💡 {analysis.feedback}
        </div>
      )}
    </div>
  );
}

function MetricCard({ metric, style }) {
  const Icon = metric.icon;
  return (
    <div style={style}>
      <Icon style={{ width: 15, height: 15, color: metric.color, flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 600, whiteSpace: "nowrap" }}>{metric.label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: metric.color, marginLeft: "auto", whiteSpace: "nowrap" }}>
        {metric.isPercent ? `${metric.value}%` : metric.value}
      </span>
      {metric.isPercent && (
        <div style={{ width: 44, height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden", flexShrink: 0 }}>
          <div style={{ height: "100%", width: `${Math.min(metric.value, 100)}%`, background: metric.color, borderRadius: 4, transition: "width 0.4s ease" }} />
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STATUS PILL
// ══════════════════════════════════════════════════════════════════════════════

function SPill({ active, color, label, pulse }) {
  const colors = {
    emerald: { bg: "rgba(16,185,129,0.09)",  border: "rgba(16,185,129,0.26)",  text: "#34d399" },
    blue:    { bg: "rgba(59,130,246,0.09)",  border: "rgba(59,130,246,0.26)",  text: "#60a5fa" },
    purple:  { bg: "rgba(139,92,246,0.09)", border: "rgba(139,92,246,0.26)", text: "#c4b5fd" },
    indigo:  { bg: "rgba(99,102,241,0.09)", border: "rgba(99,102,241,0.26)", text: "#818cf8" },
  };
  const c = colors[color] || colors.emerald;
  const pillStyle = active
    ? { background: c.bg, border: `1px solid ${c.border}`, color: c.text }
    : { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.26)" };
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "1px 7px", borderRadius: 9999, fontSize: 9.5, fontWeight: 700, fontFamily: "'Sora','Segoe UI',sans-serif", ...pillStyle }}>
      <span style={{
        width: 4, height: 4, borderRadius: "50%", flexShrink: 0,
        background: active ? c.text : "rgba(255,255,255,0.14)",
        animation: active ? (pulse ? "ping 1s cubic-bezier(0,0,0.2,1) infinite" : "pulse 2s ease infinite") : "none",
      }} />
      {label}
    </span>
  );
}