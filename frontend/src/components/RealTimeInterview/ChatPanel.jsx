import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Bot, User, Mic, MicOff, Volume2, VolumeX,
  ChevronRight, Sparkles, Square, RotateCcw,
} from "lucide-react";

/* ── TTS helpers ─────────────────────────────────────────────────────────── */
function getBestVoice() {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const priority = [
    v => v.name === "Google US English",
    v => v.name === "Google UK English Female",
    v => v.name === "Google UK English Male",
    v => v.name === "Samantha" && v.localService,
    v => v.name === "Karen",
    v => v.name === "Daniel",
    v => v.name === "Moira",
    v => v.name.includes("Aria")  && v.lang.startsWith("en"),
    v => v.name.includes("Jenny") && v.lang.startsWith("en"),
    v => v.name.includes("Zira")  && v.lang.startsWith("en"),
    v => v.lang === "en-US",
    v => v.lang.startsWith("en"),
  ];
  for (const test of priority) {
    const m = voices.find(test);
    if (m) return m;
  }
  return voices[0];
}

export function speakText(text, { onStart, onEnd, onError } = {}) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  setTimeout(() => {
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.91; utt.pitch = 1.0; utt.volume = 1.0;
    const voice = getBestVoice();
    if (voice) utt.voice = voice;
    utt.onstart = () => onStart?.();
    utt.onend   = () => onEnd?.();
    utt.onerror = (e) => { if (e.error !== "interrupted") onError?.(); };
    window.speechSynthesis.speak(utt);
  }, 80);
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel();
}

/* ── Repeat trigger phrases ──────────────────────────────────────────────── */
const REPEAT_TRIGGERS = [
  "repeat", "say that again", "come again", "didn't hear", "can't hear",
  "pardon", "what did you say", "once more", "please repeat", "again please",
  "didn't understand", "can you repeat", "could you repeat", "say again",
  "not clear", "couldn't hear", "i didn't hear", "i can't hear",
];

const isRepeatRequest = (text) => {
  const lower = (text || "").toLowerCase().trim();
  return REPEAT_TRIGGERS.some(t => lower.includes(t));
};

/* ── ChatPanel ───────────────────────────────────────────────────────────── */
export default function ChatPanel({
  messages, currentQuestion, onSendMessage,
  transcript, isListening,
  interviewStarted, interviewStatus,
  isAISpeaking, onSpeakMessage, onStopSpeaking,
  isSpeechSupported, onStartListening, onStopListening,
  isAIThinking,
  questionProgress,
  isSpeaking: userIsSpeaking,   // true = user actively talking right now
}) {
  const [inputText, setInputText] = useState("");
  const [voiceMode, setVoiceMode] = useState(false);
  const endRef     = useRef(null);
  const inputRef   = useRef(null);
  const msgAreaRef = useRef(null);

  // ── Track which message was last spoken to avoid double-speak ────────────
  const lastSpokenIdRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, transcript]);
  useEffect(() => { if (isSpeechSupported) setVoiceMode(true); }, [isSpeechSupported]);

  // ── Block copy from messages area ─────────────────────────────────────────
  useEffect(() => {
    const el = msgAreaRef.current;
    if (!el) return;
    const blockCopy = (e) => e.preventDefault();
    el.addEventListener("copy", blockCopy);
    return () => el.removeEventListener("copy", blockCopy);
  }, []);

  // ── Pause mic while AI speaks, resume after ───────────────────────────────
  useEffect(() => {
    if (isAISpeaking) {
      if (isListening) onStopListening?.();
    } else {
      if (voiceMode && isSpeechSupported && interviewStatus === "active") {
        const t = setTimeout(() => onStartListening?.(), 700);
        return () => clearTimeout(t);
      }
    }
  }, [isAISpeaking]); // eslint-disable-line

  // ── AUTO-SPEAK new AI messages — deduplicated (fixes double-speaking) ─────
  useEffect(() => {
    if (!messages.length) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender !== "ai") return;

    // Stable ID from question number + first 50 chars of text
    const msgId = `${lastMsg.questionNumber || "x"}_${(lastMsg.text || "").slice(0, 50)}`;
    if (lastSpokenIdRef.current === msgId) return;  // same message — skip
    lastSpokenIdRef.current = msgId;

    const t = setTimeout(() => onSpeakMessage?.(lastMsg.text), 120);
    return () => clearTimeout(t);
  }, [messages]); // eslint-disable-line

  // ── Repeat last AI question ───────────────────────────────────────────────
  const handleRepeat = useCallback(() => {
    const lastAI = [...messages].reverse().find(m => m.sender === "ai");
    if (!lastAI?.text) return;
    stopSpeaking();
    lastSpokenIdRef.current = null;   // allow re-speak
    setTimeout(() => onSpeakMessage?.(lastAI.text), 150);
  }, [messages, onSpeakMessage]);

  // ── Send helpers ──────────────────────────────────────────────────────────
  const sendText = (e) => {
    e?.preventDefault();
    const msg = inputText.trim();
    if (!msg) return;
    if (isRepeatRequest(msg)) { handleRepeat(); setInputText(""); return; }
    onSendMessage(msg);
    setInputText("");
    inputRef.current?.focus();
  };

  const sendTranscript = () => {
    const t = transcript?.trim();
    if (!t) return;
    if (isRepeatRequest(t)) { handleRepeat(); return; }
    onSendMessage(t);
  };

  const toggleMic = () => {
    if (isListening) onStopListening?.();
    else onStartListening?.();
  };

  const fmt = (ts) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const showCurrentQ = currentQuestion && !messages.some(m => m.text === currentQuestion.text);
  const isActive = interviewStatus === "active";
  const isDone   = interviewStatus === "completed";

  // Mic status label
  const micLabel = isAISpeaking
    ? "AI speaking…"
    : isListening
      ? (userIsSpeaking ? "Speaking — keep going…" : "Listening — pause to send")
      : "Mic off";

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#080c14", fontFamily: "'Sora','Segoe UI',sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        @keyframes cpin   { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cpbr   { 0%,100%{opacity:0.45} 50%{opacity:1} }
        @keyframes cpdot  { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-3px)} }
        @keyframes cpbar  { 0%,100%{transform:scaleY(0.25)} 50%{transform:scaleY(1)} }
        @keyframes cpring { 0%{box-shadow:0 0 0 0 rgba(167,139,250,0.45)} 70%{box-shadow:0 0 0 5px rgba(167,139,250,0)} 100%{box-shadow:0 0 0 0 rgba(167,139,250,0)} }
        @keyframes cprip  { 0%{transform:scale(1);opacity:0.5} 100%{transform:scale(2.0);opacity:0} }
        @keyframes cppls  { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.32)} 50%{box-shadow:0 0 0 6px rgba(239,68,68,0)} }

        .cp-msg { animation:cpin 0.2s ease forwards; }
        .cpscroll::-webkit-scrollbar       { width:3px; }
        .cpscroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.07); border-radius:99px; }

        .cpinput {
          flex:1; min-width:0;
          background:rgba(255,255,255,0.04);
          border:1.5px solid rgba(255,255,255,0.08);
          border-radius:10px; padding:7px 11px;
          font-size:12px; color:#f1f5f9; font-family:inherit;
          outline:none; transition:border-color 0.2s,box-shadow 0.2s;
        }
        .cpinput::placeholder { color:rgba(255,255,255,0.17); }
        .cpinput:focus { border-color:rgba(99,102,241,0.48); box-shadow:0 0 0 2px rgba(99,102,241,0.09); }

        .cpibtn {
          width:33px; height:33px; border-radius:9px; border:none; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          transition:all 0.15s; flex-shrink:0;
        }
        .cpibtn:hover:not(:disabled) { transform:scale(1.08); }
        .cpibtn:disabled { opacity:0.28; cursor:not-allowed; }
        .cpsend { background:linear-gradient(135deg,#6366f1,#4f46e5); }
        .cpsend:hover:not(:disabled) { box-shadow:0 3px 10px rgba(99,102,241,0.38); }

        .cptab {
          display:flex; align-items:center; gap:3px;
          padding:3px 8px; border-radius:6px; border:1.5px solid;
          font-size:9.5px; font-weight:700; cursor:pointer;
          font-family:inherit; transition:all 0.15s; white-space:nowrap;
        }

        .cp-repeat-btn {
          display:flex; align-items:center; gap:3px;
          padding:2px 7px; border-radius:6px;
          border:1px solid rgba(99,102,241,0.28);
          background:rgba(99,102,241,0.07);
          color:rgba(165,180,252,0.7); font-size:9px; font-weight:700;
          cursor:pointer; font-family:inherit; transition:all 0.15s;
          flex-shrink:0;
        }
        .cp-repeat-btn:hover { background:rgba(99,102,241,0.14); color:#a5b4fc; }

        @media (max-width: 768px) {
          .cp-input-zone { padding: 4px 7px 5px !important; }
          .cpinput { padding: 5px 9px !important; font-size: 11px !important; }
          .cpibtn  { width: 28px !important; height: 28px !important; }
          .cptab   { padding: 2px 6px !important; font-size: 9px !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 11px 6px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
        <div style={{
          width: 25, height: 25, borderRadius: 7, flexShrink: 0,
          background: "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(6,182,212,0.1))",
          border: "1px solid rgba(99,102,241,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          ...(isAISpeaking ? { animation: "cpring 1.2s ease-out infinite" } : {}),
        }}>
          <Bot style={{ width: 11, height: 11, color: "#818cf8" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 11.5, lineHeight: 1.2 }}>Interview Chat</div>
          <div style={{ color: "rgba(255,255,255,0.26)", fontSize: 9 }}>
            {isActive
              ? (questionProgress?.total > 0
                  ? `Q${questionProgress.current}/${questionProgress.total} · Live session`
                  : "Live session")
              : isDone ? "Ended" : "Waiting…"}
          </div>
        </div>

        {/* Repeat button — visible whenever interview is active */}
        {isActive && (
          <button className="cp-repeat-btn" onClick={handleRepeat} title="Repeat last question">
            <RotateCcw style={{ width: 8, height: 8 }} /> Repeat
          </button>
        )}

        {isAISpeaking && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ width: 2, height: 10, borderRadius: 2, background: "#a78bfa", transformOrigin: "bottom", animation: `cpbar 0.8s ease ${i * 0.11}s infinite` }} />
              ))}
            </div>
            <button onClick={onStopSpeaking} style={{ display: "flex", alignItems: "center", gap: 2, padding: "2px 6px", borderRadius: 12, border: "1px solid rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.08)", color: "#c4b5fd", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              <VolumeX style={{ width: 8, height: 8 }} /> Stop
            </button>
          </div>
        )}
      </div>

      {/* ── Messages ── */}
      <div
        ref={msgAreaRef}
        className="cpscroll cp-msg-area"
        style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "7px 9px 5px", display: "flex", flexDirection: "column", gap: 6, userSelect: "none", WebkitUserSelect: "none" }}
      >
        {/* Empty state */}
        {!interviewStarted && interviewStatus === "pending" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "14px 12px" }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, marginBottom: 8, background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bot style={{ width: 17, height: 17, color: "rgba(99,102,241,0.4)" }} />
            </div>
            <p style={{ fontSize: 11, lineHeight: 1.6, color: "rgba(255,255,255,0.2)", maxWidth: 180, marginBottom: 8 }}>
              Conversation appears here when session starts.
            </p>
            {["Tell me about yourself", "Greatest strength?", "A challenge you overcame"].map((q, i) => (
              <div key={i} style={{ width: "100%", padding: "3px 7px", borderRadius: 5, marginBottom: 3, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", fontSize: 9.5, color: "rgba(255,255,255,0.17)", textAlign: "left", display: "flex", alignItems: "center", gap: 4 }}>
                <Sparkles style={{ width: 7, height: 7, opacity: 0.28, flexShrink: 0 }} />{q}
              </div>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <Bubble
            key={i}
            msg={msg}
            fmt={fmt}
            onSpeak={(text) => {
              stopSpeaking();
              lastSpokenIdRef.current = null;   // allow replay
              setTimeout(() => onSpeakMessage?.(text), 100);
            }}
          />
        ))}

        {/* Current question pin (shown before it appears in messages) */}
        {showCurrentQ && (
          <div className="cp-msg" style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ maxWidth: "90%", background: "linear-gradient(135deg,rgba(99,102,241,0.14),rgba(6,182,212,0.05))", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "12px 12px 12px 3px", padding: "8px 10px", boxShadow: "0 0 14px rgba(99,102,241,0.07)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                <Bot style={{ width: 9, height: 9, color: "#818cf8" }} />
                <span style={{ fontSize: 8, color: "#818cf8", fontWeight: 700, letterSpacing: "0.05em" }}>AI INTERVIEWER</span>
                <button
                  onClick={() => { stopSpeaking(); lastSpokenIdRef.current = null; setTimeout(() => onSpeakMessage?.(currentQuestion.text), 100); }}
                  style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "rgba(129,140,248,0.36)", padding: 1, borderRadius: 3 }}
                  title="Replay"
                >
                  <Volume2 style={{ width: 9, height: 9 }} />
                </button>
              </div>
              <p style={{ fontSize: 11.5, color: "#f1f5f9", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{currentQuestion.text}</p>
            </div>
          </div>
        )}

        {/* Live transcript with speaking/pause indicator */}
        {isListening && transcript && (
          <div style={{ background: "rgba(234,179,8,0.05)", border: "1px solid rgba(234,179,8,0.19)", borderRadius: 8, padding: "6px 9px", animation: "cpbr 2s ease infinite" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
              <div style={{
                width: 4, height: 4, borderRadius: "50%", background: "#facc15",
                animation: userIsSpeaking ? "cpbr 0.5s ease infinite" : "cpbr 1.8s ease infinite",
              }} />
              <span style={{ fontSize: 8, color: "#fbbf24", fontWeight: 700, letterSpacing: "0.06em" }}>
                {userIsSpeaking ? "SPEAKING" : "PAUSED — sending soon…"}
              </span>
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.68)", lineHeight: 1.5, margin: 0 }}>{transcript}</p>
            {transcript.length > 8 && (
              <button onClick={sendTranscript} style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 5, border: "1px solid rgba(234,179,8,0.3)", background: "rgba(234,179,8,0.07)", color: "#fbbf24", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                <ChevronRight style={{ width: 8, height: 8 }} /> Send now
              </button>
            )}
          </div>
        )}

        {/* AI thinking dots — shown when waiting for AI response */}
        {isActive && isAIThinking && !isAISpeaking && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px 12px 12px 3px", padding: "7px 11px", display: "flex", alignItems: "center", gap: 3 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "#818cf8", animation: `cpdot 1s ease ${i * 0.18}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* ── Input Zone ── */}
      {interviewStarted && isActive && (
        <div className="cp-input-zone" style={{ padding: "6px 9px 8px", borderTop: "1px solid rgba(255,255,255,0.05)", flexShrink: 0, background: "rgba(0,0,0,0.18)" }}>

          {isSpeechSupported && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 5 }}>
              <button className="cptab"
                onClick={() => { setVoiceMode(false); if (isListening) onStopListening?.(); }}
                style={{ background: !voiceMode ? "rgba(99,102,241,0.12)" : "transparent", borderColor: !voiceMode ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.07)", color: !voiceMode ? "#a5b4fc" : "rgba(255,255,255,0.25)" }}
              >
                <Send style={{ width: 7, height: 7 }} /> Type
              </button>
              <button className="cptab"
                onClick={() => setVoiceMode(true)}
                style={{ background: voiceMode ? "rgba(239,68,68,0.09)" : "transparent", borderColor: voiceMode ? "rgba(239,68,68,0.36)" : "rgba(255,255,255,0.07)", color: voiceMode ? "#fca5a5" : "rgba(255,255,255,0.25)" }}
              >
                <Mic style={{ width: 7, height: 7 }} /> Voice
              </button>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 3, fontSize: 9, fontWeight: 600, color: isAISpeaking ? "rgba(167,139,250,0.55)" : isListening ? "#86efac" : "rgba(255,255,255,0.18)" }}>
                <div style={{
                  width: 4, height: 4, borderRadius: "50%",
                  background: isAISpeaking ? "#a78bfa" : isListening ? "#4ade80" : "#1f2937",
                  boxShadow: isListening && !isAISpeaking ? "0 0 5px rgba(74,222,128,0.55)" : "none",
                  animation: isListening && !isAISpeaking ? "cpbr 1.5s ease infinite" : "none",
                  transition: "all 0.3s",
                }} />
                {micLabel}
              </div>
            </div>
          )}

          {voiceMode && isSpeechSupported ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  {isListening && !isAISpeaking && [0, 1].map(i => (
                    <div key={i} style={{ position: "absolute", inset: -(5 + i * 7), borderRadius: "50%", border: `1.5px solid rgba(239,68,68,${0.25 / (i + 1)})`, animation: `cprip ${1.1 + i * 0.35}s ease-out infinite`, animationDelay: `${i * 0.3}s` }} />
                  ))}
                  <button onClick={toggleMic} disabled={isAISpeaking} style={{
                    width: 40, height: 40, borderRadius: "50%",
                    cursor: isAISpeaking ? "not-allowed" : "pointer",
                    background: isAISpeaking
                      ? "rgba(99,102,241,0.07)"
                      : isListening
                        ? "linear-gradient(135deg,#dc2626,#991b1b)"
                        : "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(79,70,229,0.16))",
                    border: isListening && !isAISpeaking ? "1.5px solid rgba(239,68,68,0.48)" : "1.5px solid rgba(99,102,241,0.28)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    animation: isListening && !isAISpeaking ? "cppls 2s ease infinite" : "none",
                    position: "relative", zIndex: 1,
                    opacity: isAISpeaking ? 0.42 : 1, transition: "all 0.2s",
                  }}>
                    {isListening && !isAISpeaking
                      ? <Square style={{ width: 16, height: 16, color: "#fff" }} />
                      : <Mic    style={{ width: 16, height: 16, color: "#a5b4fc" }} />}
                  </button>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {transcript?.trim() ? (
                    <div style={{ padding: "4px 8px", background: "rgba(234,179,8,0.05)", border: "1px solid rgba(234,179,8,0.16)", borderRadius: 7, fontSize: 10.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.45, maxHeight: 44, overflow: "auto" }}>
                      {transcript}
                    </div>
                  ) : (
                    <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.2)", fontWeight: 500 }}>
                      {isAISpeaking ? "Mic paused — AI speaking…" : isListening ? "Listening… pause when done" : "Tap mic to speak"}
                    </span>
                  )}
                </div>
                {transcript?.trim().length > 4 && (
                  <button className="cpibtn cpsend" onClick={sendTranscript}>
                    <Send style={{ width: 12, height: 12, color: "#fff" }} />
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                <input
                  type="text" value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendText()}
                  placeholder="Or type here…"
                  className="cpinput"
                  style={{ fontSize: 11, padding: "6px 10px" }}
                />
                <button className="cpibtn cpsend" disabled={!inputText.trim()} onClick={sendText}>
                  <Send style={{ width: 11, height: 11, color: "#fff" }} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              <input
                ref={inputRef} type="text" value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendText()}
                placeholder="Type your answer…"
                className="cpinput"
              />
              {isSpeechSupported && (
                <button
                  className="cpibtn" onClick={toggleMic} disabled={isAISpeaking}
                  style={{
                    background: isListening ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${isListening ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
                    animation: isListening ? "cppls 2s ease infinite" : "none",
                    opacity: isAISpeaking ? 0.4 : 1,
                  }}
                >
                  {isListening
                    ? <MicOff style={{ width: 12, height: 12, color: "#f87171" }} />
                    : <Mic    style={{ width: 12, height: 12, color: "rgba(255,255,255,0.3)" }} />}
                </button>
              )}
              <button className="cpibtn cpsend" disabled={!inputText.trim()} onClick={sendText}>
                <Send style={{ width: 12, height: 12, color: "#fff" }} />
              </button>
            </div>
          )}
        </div>
      )}

      {isDone && (
        <div style={{ padding: "7px 11px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(52,211,153,0.05)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, flexShrink: 0 }}>
          <Sparkles style={{ width: 9, height: 9, color: "#34d399" }} />
          <span style={{ fontSize: 10.5, color: "#34d399", fontWeight: 600 }}>Session complete — redirecting…</span>
        </div>
      )}
    </div>
  );
}

function Bubble({ msg, fmt, onSpeak }) {
  const isAI = msg.sender === "ai";
  return (
    <div className="cp-msg" style={{ display: "flex", justifyContent: isAI ? "flex-start" : "flex-end" }}>
      <div style={{
        maxWidth: "88%",
        background: isAI ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#3730a3,#1d4ed8)",
        border: isAI ? "1px solid rgba(255,255,255,0.07)" : "none",
        borderRadius: isAI ? "12px 12px 12px 3px" : "12px 12px 3px 12px",
        padding: "7px 10px",
        boxShadow: isAI ? "none" : "0 2px 9px rgba(37,99,235,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
          {isAI
            ? <Bot  style={{ width: 8, height: 8, color: "#818cf8", flexShrink: 0 }} />
            : <User style={{ width: 8, height: 8, color: "#93c5fd", flexShrink: 0 }} />}
          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.28)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {isAI ? "AI" : "You"}
          </span>
          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.16)", marginLeft: 1 }}>{fmt(msg.timestamp)}</span>
          {isAI && onSpeak && (
            <button
              onClick={() => onSpeak(msg.text)}
              style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "rgba(129,140,248,0.36)", padding: 1, borderRadius: 3 }}
              title="Replay this question"
            >
              <Volume2 style={{ width: 8, height: 8 }} />
            </button>
          )}
        </div>
        <p style={{ fontSize: 11.5, color: "#f1f5f9", lineHeight: 1.58, margin: 0 }}>{msg.text}</p>
      </div>
    </div>
  );
}