import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, Video, Zap, Shield, MicOff, VideoOff, CheckCircle, AlertCircle, Loader } from "lucide-react";

// ══════════════════════════════════════════════════════════════════════════════
// TTS ENGINE — Crystal clear, no breaks, no cutting off
// ══════════════════════════════════════════════════════════════════════════════

let _voices = [];
let _voicesLoaded = false;

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
    setTimeout(() => { _voices = window.speechSynthesis.getVoices(); _voicesLoaded = true; resolve(_voices); }, 2000);
  });
}

function getBestVoice(voices) {
  const priority = [
    v => v.name === "Google US English",
    v => v.name === "Samantha" && v.localService,
    v => v.name === "Karen",
    v => v.name === "Daniel",
    v => v.name.includes("Aria") && v.lang.startsWith("en"),
    v => v.name.includes("Jenny") && v.lang.startsWith("en"),
    v => v.name.includes("Zira") && v.lang.startsWith("en"),
    v => v.lang === "en-US" && v.localService,
    v => v.lang === "en-US",
    v => v.lang.startsWith("en"),
  ];
  for (const test of priority) {
    const m = voices.find(test);
    if (m) return m;
  }
  return null;
}

function speakChunk(text, opts = {}) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { setTimeout(resolve, 500); return; }
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();

    const utter = new SpeechSynthesisUtterance(text.trim());
    utter.rate   = opts.rate   ?? 0.82;
    utter.pitch  = opts.pitch  ?? 1.0;
    utter.volume = opts.volume ?? 1.0;
    utter.lang   = "en-US";

    const voice = getBestVoice(_voices);
    if (voice) utter.voice = voice;

    const maxMs = Math.max(5000, text.length * 100 + 2000);
    const fallback = setTimeout(() => {
      try { window.speechSynthesis.cancel(); } catch {}
      resolve();
    }, maxMs);

    utter.onend   = () => { clearTimeout(fallback); setTimeout(resolve, 150); };
    utter.onerror = (e) => {
      clearTimeout(fallback);
      if (e.error !== "interrupted") setTimeout(resolve, 150);
      else resolve();
    };

    window.speechSynthesis.speak(utter);
  });
}

function splitIntoChunks(text) {
  return text
    .replace(/([.!?])\s+/g, "$1|||")
    .split("|||")
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

async function speakFull(text, opts = {}) {
  if (!text?.trim()) return;
  if (!_voicesLoaded) await loadVoices();

  try { window.speechSynthesis.cancel(); } catch {}
  await new Promise(r => setTimeout(r, 180));

  const chunks = splitIntoChunks(text);
  for (const chunk of chunks) {
    if (!chunk) continue;
    await speakChunk(chunk, opts);
    await new Promise(r => setTimeout(r, 120));
  }
}

function speak(text, opts = {}) {
  speakFull(text, opts).catch(() => {});
}

function stopAllSpeech() {
  try { window.speechSynthesis.cancel(); } catch {}
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Good evening";
}

function getFirstName(fullName) {
  if (!fullName?.trim()) return "there";
  return fullName.trim().split(/\s+/)[0] || "there";
}

function formatInterviewType(type) {
  if (!type) return "a mixed interview";
  const map = {
    technical:  "a Technical interview",
    behavioral: "a Behavioral interview",
    mixed:      "a Mixed interview covering both Technical and Behavioral questions",
  };
  return map[type.toLowerCase()] || `a ${type} interview`;
}

// ══════════════════════════════════════════════════════════════════════════════
// GREETING PHASE
// ══════════════════════════════════════════════════════════════════════════════

function GreetingPhase({ userName, interviewType, interviewTitle, onDone }) {
  const [visibleLines, setVisibleLines] = useState([]);
  const [activeLine, setActiveLine]     = useState(-1);
  const ran = useRef(false);

  const greeting  = getGreeting();
  const firstName = getFirstName(userName);
  const typeStr   = formatInterviewType(interviewType);

  const lines = [
    { text: `${greeting}, ${firstName}!`, big: true },
    { text: `Welcome to your interview session.` },
    { text: `You are about to begin ${typeStr}.` },
    interviewTitle ? { text: `Today's session: "${interviewTitle}".` } : null,
    { text: `Take a deep breath. You've prepared well. You've got this!` },
  ].filter(Boolean);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      await loadVoices();
      await new Promise(r => setTimeout(r, 400));

      for (let i = 0; i < lines.length; i++) {
        setActiveLine(i);
        setVisibleLines(prev => [...prev, i]);
        await speakFull(lines[i].text, { rate: 0.82, pitch: 1.0 });
        await new Promise(r => setTimeout(r, 220));
      }

      setActiveLine(-1);
      await new Promise(r => setTimeout(r, 600));
      stopAllSpeech();
      onDone();
    })();
  }, []); // eslint-disable-line

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 24, textAlign: "center",
      width: "100%", maxWidth: 560, padding: "0 20px",
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: "linear-gradient(135deg,rgba(99,102,241,0.25),rgba(6,182,212,0.25))",
        border: "2px solid rgba(99,102,241,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 38, boxShadow: "0 0 50px rgba(99,102,241,0.3)",
        animation: "greetPulse 2.2s ease-in-out infinite",
      }}>🤖</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 200, width: "100%" }}>
        {lines.map((line, i) => (
          <div key={i} style={{
            opacity:    visibleLines.includes(i) ? 1 : 0,
            transform:  visibleLines.includes(i) ? "translateY(0)" : "translateY(14px)",
            transition: "opacity 0.45s ease, transform 0.45s ease",
            fontSize:   line.big ? "clamp(24px,5vw,34px)" : "clamp(14px,3vw,18px)",
            fontWeight: line.big ? 800 : 400,
            color:      line.big ? "transparent" : "rgba(255,255,255,0.88)",
            background: line.big ? "linear-gradient(135deg,#818cf8,#38bdf8)" : "transparent",
            WebkitBackgroundClip: line.big ? "text" : "unset",
            WebkitTextFillColor:  line.big ? "transparent" : "unset",
            lineHeight: 1.45,
          }}>
            {line.text}
            {activeLine === i && !line.big && (
              <span style={{
                display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                background: "#818cf8", marginLeft: 8, verticalAlign: "middle",
                animation: "speakDot 0.65s ease-in-out infinite",
              }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{
          width: 7, height: 7, borderRadius: "50%", background: "#4ade80",
          display: "inline-block", animation: "speakDot 0.65s ease-in-out infinite",
        }} />
        AI Interviewer is speaking…
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MIC CHECK PHASE — real 5 second recording with waveform + level bar
// ══════════════════════════════════════════════════════════════════════════════

function MicCheckPhase({ onDone }) {
  const [step, setStep]             = useState("intro");
  const [micStatus, setMicStatus]   = useState("idle");
  const [audioLevel, setAudioLevel] = useState(0);
  const [volumeOk, setVolumeOk]     = useState(false);
  const [resultMsg, setResultMsg]   = useState("");
  const [countdown, setCountdown]   = useState(5);
  const [bars, setBars]             = useState(Array(20).fill(4));
  const streamRef    = useRef(null);
  const animFrameRef = useRef(null);
  const ran          = useRef(false);

  const stopStream = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const runCheck = useCallback(async () => {
    setStep("intro");
    setAudioLevel(0);
    setCountdown(5);
    setBars(Array(20).fill(4));

    await speakFull(
      "Before we begin, let's quickly make sure your microphone is working. Please say something after the beep.",
      { rate: 0.82, pitch: 1.0 }
    );
    setStep("listening");

    // Beep
    try {
      const ctx  = new AudioContext();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
      await new Promise(r => setTimeout(r, 600));
    } catch {}

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      setMicStatus("granted");
    } catch {
      setMicStatus("denied");
      setStep("result");
      setResultMsg("Microphone access was denied. Please allow microphone access.");
      stopAllSpeech();
      await speakFull("I could not access your microphone. Please allow microphone access and refresh the page.", { rate: 0.82 });
      return;
    }

    const audioCtx  = new AudioContext();
    const source    = audioCtx.createMediaStreamSource(stream);
    const analyser  = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const dataArr = new Uint8Array(analyser.frequencyBinCount);
    let maxLevel  = 0;
    const start   = Date.now();
    const totalMs = 5000;

    const tick = () => {
      analyser.getByteFrequencyData(dataArr);
      const avg = dataArr.reduce((a, b) => a + b, 0) / dataArr.length;
      const pct = Math.min(100, Math.round((avg / 80) * 100));
      setAudioLevel(pct);

      // Animate bars based on frequency data
      const newBars = Array(20).fill(0).map((_, i) => {
        const idx = Math.floor((i / 20) * dataArr.length);
        return Math.max(4, Math.round((dataArr[idx] / 255) * 60));
      });
      setBars(newBars);

      if (pct > maxLevel) maxLevel = pct;

      const elapsed = Date.now() - start;
      const remaining = Math.ceil((totalMs - elapsed) / 1000);
      setCountdown(Math.max(0, remaining));

      if (elapsed < totalMs) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        stopStream();
        audioCtx.close().catch(() => {});
        setBars(Array(20).fill(4));
        setStep("analyzing");

        setTimeout(async () => {
          if (maxLevel >= 8) {
            setVolumeOk(true);
            setResultMsg("Your microphone is working perfectly. Let's move to camera check.");
            stopAllSpeech();
            await speakFull("Perfect! Your microphone is loud and clear. Let's check your camera next.", { rate: 0.82, pitch: 1.0 });
          } else {
            setVolumeOk(false);
            setResultMsg("Your microphone seems quiet. Check your mic settings or continue anyway.");
            stopAllSpeech();
            await speakFull("Your microphone seems a bit quiet. Please check your microphone settings. You can also continue anyway.", { rate: 0.82 });
          }
          setStep("result");
        }, 300);
      }
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, [stopStream]);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    runCheck();
    return stopStream;
  }, [runCheck, stopStream]);

  const handleRetry = useCallback(() => {
    ran.current = false;
    setStep("intro");
    setAudioLevel(0);
    setResultMsg("");
    setMicStatus("idle");
    setVolumeOk(false);
    setCountdown(5);
    setBars(Array(20).fill(4));
    runCheck();
  }, [runCheck]);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 26, textAlign: "center", width: "100%", maxWidth: 480, padding: "0 20px",
    }}>
      {/* Icon */}
      <div style={{
        width: 84, height: 84, borderRadius: "50%",
        background: step === "result" && volumeOk
          ? "linear-gradient(135deg,rgba(74,222,128,0.22),rgba(16,185,129,0.22))"
          : step === "result" && !volumeOk
            ? "linear-gradient(135deg,rgba(239,68,68,0.22),rgba(220,38,38,0.22))"
            : "linear-gradient(135deg,rgba(99,102,241,0.22),rgba(6,182,212,0.22))",
        border: `2px solid ${
          step === "result" && volumeOk ? "rgba(74,222,128,0.5)"
          : step === "result" && !volumeOk ? "rgba(239,68,68,0.5)"
          : "rgba(99,102,241,0.5)"
        }`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: step === "listening" ? "0 0 40px rgba(99,102,241,0.4)" : "none",
        animation: step === "listening" ? "greetPulse 1.1s ease-in-out infinite" : "none",
        transition: "all 0.4s ease",
      }}>
        {step === "result" && volumeOk
          ? <CheckCircle style={{ width: 38, height: 38, color: "#4ade80" }} />
          : step === "result" && !volumeOk
            ? <AlertCircle style={{ width: 38, height: 38, color: "#f87171" }} />
            : step === "analyzing"
              ? <Loader style={{ width: 34, height: 34, color: "#818cf8", animation: "spin 1s linear infinite" }} />
              : <Mic style={{ width: 38, height: 38, color: step === "listening" ? "#4ade80" : "#818cf8" }} />
        }
      </div>

      {/* Labels */}
      <div>
        <div style={{ fontSize: "clamp(20px,4vw,28px)", fontWeight: 800, color: "#fff", marginBottom: 8 }}>
          {step === "intro"     && "Microphone Check"}
          {step === "listening" && "🎙️ Speak Now…"}
          {step === "analyzing" && "Analyzing Audio…"}
          {step === "result" && volumeOk && "Microphone ✅"}
          {step === "result" && !volumeOk && micStatus !== "denied" && "Microphone ⚠️"}
          {step === "result" && micStatus === "denied" && "Mic Blocked ❌"}
        </div>
        <div style={{ fontSize: "clamp(13px,2.5vw,16px)", color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
          {step === "intro"     && "We'll quickly verify your microphone is ready."}
          {step === "listening" && `Say anything — we're listening for ${countdown}s`}
          {step === "analyzing" && "Checking your audio levels…"}
          {step === "result"    && resultMsg}
        </div>
      </div>

      {/* Live audio visualizer — shown while listening */}
      {step === "listening" && (
        <div style={{ width: "100%", maxWidth: 340 }}>
          {/* Level bar */}
          <div style={{ height: 10, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
            <div style={{
              height: "100%", borderRadius: 99,
              width: `${audioLevel}%`,
              background: audioLevel > 15
                ? "linear-gradient(90deg,#4ade80,#22c55e)"
                : "linear-gradient(90deg,#f87171,#ef4444)",
              transition: "width 0.07s ease",
            }} />
          </div>
          <div style={{ marginBottom: 12, fontSize: 12, color: audioLevel > 15 ? "#4ade80" : "rgba(255,255,255,0.38)" }}>
            {audioLevel > 15 ? "✓ Good signal detected" : "Speak louder…"}
          </div>

          {/* Waveform bars — real time */}
          <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 60, justifyContent: "center" }}>
            {bars.map((h, i) => (
              <div key={i} style={{
                width: 5, borderRadius: 3,
                background: audioLevel > 15
                  ? "linear-gradient(180deg,#4ade80,#22c55e)"
                  : "linear-gradient(180deg,#818cf8,#38bdf8)",
                height: `${h}px`,
                transition: "height 0.05s ease",
                opacity: 0.7 + (i % 3) * 0.1,
              }} />
            ))}
          </div>

          {/* Countdown ring */}
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              border: "2px solid rgba(99,102,241,0.5)",
              background: "rgba(99,102,241,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 800, color: "#818cf8",
            }}>
              {countdown}
            </div>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>seconds remaining</span>
          </div>
        </div>
      )}

      {/* Buttons */}
      {step === "result" && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {!volumeOk && micStatus !== "denied" && (
            <button onClick={handleRetry} style={{
              padding: "10px 22px", borderRadius: 11, border: "1.5px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              Try Again
            </button>
          )}
          <button onClick={() => { stopAllSpeech(); onDone(); }} style={{
            padding: "10px 28px", borderRadius: 11, border: "none",
            background: volumeOk
              ? "linear-gradient(135deg,#4ade80,#22c55e)"
              : "linear-gradient(135deg,#6366f1,#818cf8)",
            color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
            boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
          }}>
            {volumeOk ? "Next →" : "Continue Anyway →"}
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CAMERA CHECK PHASE — real camera feed, face guide oval, 5s countdown
// ══════════════════════════════════════════════════════════════════════════════

function CameraCheckPhase({ onDone }) {
  const [step, setStep]           = useState("intro");
  const [camStatus, setCamStatus] = useState("idle");
  const [faceOk, setFaceOk]       = useState(false);
  const [resultMsg, setResultMsg] = useState("");
  const [countdown, setCountdown] = useState(5);
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const timersRef = useRef([]);
  const ran       = useRef(false);

  const stopCam = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      await speakFull(
        "Now let's check your camera. Please make sure your face is clearly visible and well lit.",
        { rate: 0.82, pitch: 1.0 }
      );
      setStep("preview");

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" }, audio: false });
        streamRef.current = stream;
        setCamStatus("granted");
        // Small delay to ensure video element is mounted
        await new Promise(r => setTimeout(r, 200));
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch {
        setCamStatus("denied");
        setStep("result");
        setResultMsg("Camera access denied. You can continue without camera — the interview will still work.");
        stopAllSpeech();
        await speakFull("Camera access was denied. That is okay — you can continue without video.", { rate: 0.82 });
        return;
      }

      // Count down 5 seconds while showing live feed
      let cd = 5;
      setCountdown(cd);

      const tick = () => {
        cd--;
        setCountdown(cd);
        if (cd > 0) {
          timersRef.current.push(setTimeout(tick, 1000));
        } else {
          stopCam();
          setFaceOk(true);
          setStep("result");
          setResultMsg("Camera is working! You look great. Ready to begin.");
          stopAllSpeech();
          speakFull("Your camera is working perfectly. You look great. Let us get ready to start your interview!", { rate: 0.82, pitch: 1.0 });
        }
      };
      timersRef.current.push(setTimeout(tick, 1000));
    })();

    return stopCam;
  }, [stopCam]);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 22, textAlign: "center", width: "100%", maxWidth: 480, padding: "0 20px",
    }}>

      {/* Live camera preview — shown during preview step */}
      {step === "preview" && camStatus === "granted" ? (
        <div style={{
          width: "min(320px,88vw)", height: "min(240px,62vw)",
          borderRadius: 20, overflow: "hidden",
          border: "2px solid rgba(99,102,241,0.6)",
          boxShadow: "0 0 48px rgba(99,102,241,0.35)",
          position: "relative", background: "#000", flexShrink: 0,
        }}>
          {/* Actual video feed */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: "100%", height: "100%",
              objectFit: "cover",
              transform: "scaleX(-1)", // mirror for natural feel
            }}
          />

          {/* Face guide oval overlay */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            width: "44%", height: "64%",
            transform: "translate(-50%, -55%)",
            border: "2px dashed rgba(129,140,248,0.7)",
            borderRadius: "50% 50% 46% 46%",
            pointerEvents: "none",
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.18)",
          }} />

          {/* Countdown badge */}
          <div style={{
            position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 13, fontWeight: 700,
            padding: "5px 16px", borderRadius: 99, backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.18)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%", background: "#f87171",
              display: "inline-block", animation: "speakDot 0.8s ease-in-out infinite",
            }} />
            Checking in {countdown}s
          </div>

          {/* Top label */}
          <div style={{
            position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
            background: "rgba(99,102,241,0.85)", color: "#fff", fontSize: 11, fontWeight: 700,
            padding: "3px 12px", borderRadius: 99,
          }}>
            📸 LIVE PREVIEW
          </div>
        </div>
      ) : step !== "preview" ? (
        /* Icon shown on result / denied */
        <div style={{
          width: 84, height: 84, borderRadius: "50%",
          background: step === "result" && faceOk
            ? "linear-gradient(135deg,rgba(74,222,128,0.22),rgba(16,185,129,0.22))"
            : "linear-gradient(135deg,rgba(6,182,212,0.22),rgba(99,102,241,0.22))",
          border: `2px solid ${step === "result" && faceOk ? "rgba(74,222,128,0.5)" : step === "result" && !faceOk ? "rgba(239,68,68,0.5)" : "rgba(6,182,212,0.5)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.4s ease",
        }}>
          {step === "result" && faceOk
            ? <CheckCircle style={{ width: 38, height: 38, color: "#4ade80" }} />
            : step === "result" && !faceOk
              ? <VideoOff style={{ width: 38, height: 38, color: "#f87171" }} />
              : <Video style={{ width: 38, height: 38, color: "#38bdf8" }} />
          }
        </div>
      ) : (
        /* Loading camera */
        <div style={{
          width: "min(320px,88vw)", height: "min(240px,62vw)",
          borderRadius: 20, background: "rgba(9,11,17,0.9)",
          border: "2px solid rgba(99,102,241,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <div style={{ textAlign: "center" }}>
            <Loader style={{ width: 32, height: 32, color: "#818cf8", animation: "spin 1s linear infinite", marginBottom: 8 }} />
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Opening camera…</div>
          </div>
        </div>
      )}

      {/* Text labels */}
      <div>
        <div style={{ fontSize: "clamp(20px,4vw,28px)", fontWeight: 800, color: "#fff", marginBottom: 8 }}>
          {step === "intro"   && "Camera Check"}
          {step === "preview" && "📸 Centre Your Face"}
          {step === "result" && faceOk && "Camera ✅"}
          {step === "result" && !faceOk && camStatus !== "denied" && "Camera ⚠️"}
          {step === "result" && camStatus === "denied" && "Camera Blocked ❌"}
        </div>
        <div style={{ fontSize: "clamp(13px,2.5vw,16px)", color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
          {step === "intro"   && "Checking your video feed…"}
          {step === "preview" && "Keep your face inside the oval guide. Good lighting helps."}
          {step === "result"  && resultMsg}
        </div>
      </div>

      {/* Start button — only on result */}
      {step === "result" && (
        <button onClick={() => { stopAllSpeech(); onDone(); }} style={{
          padding: "12px 36px", borderRadius: 12, border: "none",
          background: "linear-gradient(135deg,#2563eb,#7c3aed,#db2777)",
          color: "#fff", fontSize: 15, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
          boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
          animation: "greetPulse 2s ease-in-out infinite",
        }}>
          🚀 Start Interview
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP INDICATOR
// ══════════════════════════════════════════════════════════════════════════════

function StepIndicator({ current }) {
  const steps = [
    { label: "Mic",    icon: <Mic   style={{ width: 12, height: 12 }} /> },
    { label: "Camera", icon: <Video style={{ width: 12, height: 12 }} /> },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 36, zIndex: 10 }}>
      {steps.map((s, i) => {
        const idx    = i + 1;
        const done   = current > idx;
        const active = current === idx;
        return (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 13px", borderRadius: 99,
              background: done ? "rgba(74,222,128,0.15)" : active ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${done ? "rgba(74,222,128,0.4)" : active ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.1)"}`,
              color: done ? "#4ade80" : active ? "#818cf8" : "rgba(255,255,255,0.3)",
              fontSize: 11, fontWeight: 600, transition: "all 0.3s ease",
            }}>
              {done ? <CheckCircle style={{ width: 12, height: 12 }} /> : s.icon}
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 22, height: 1, background: "rgba(255,255,255,0.1)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COUNTDOWN TIMER
// ══════════════════════════════════════════════════════════════════════════════

export default function CountdownTimer({ onComplete, userName, interviewType, interviewTitle }) {
  const [phase, setPhase]   = useState("greeting");
  const [countdown, setCd]  = useState(3);
  const [pulse, setPulse]   = useState(false);
  const [showGo, setShowGo] = useState(false);

  const tips = [
    { icon: <Video  style={{ width: 18, height: 18 }} />, color: "#38bdf8", title: "Camera On",    sub: "Good lighting helps" },
    { icon: <Mic    style={{ width: 18, height: 18 }} />, color: "#4ade80", title: "Mic Active",   sub: "Speak clearly" },
    { icon: <Zap    style={{ width: 18, height: 18 }} />, color: "#facc15", title: "Be Confident", sub: "You've got this!" },
    { icon: <Shield style={{ width: 18, height: 18 }} />, color: "#f87171", title: "Stay Focused",  sub: "No tab switching" },
  ];

  useEffect(() => {
    if (phase !== "counting") return;

    let cd = 3;
    setCd(3);

    const runCountdown = async () => {
      await loadVoices();

      while (cd > 0) {
        setPulse(true);
        await speakFull(String(cd), { rate: 0.80, pitch: 1.1 });
        setPulse(false);
        await new Promise(r => setTimeout(r, 200));
        cd--;
        setCd(cd);
        if (cd > 0) await new Promise(r => setTimeout(r, 250));
      }

      setShowGo(true);
      onComplete();
      stopAllSpeech();
      setTimeout(() => {
        speak("Let's go! Your interview is starting now. Good luck!", { rate: 0.88, pitch: 1.0 });
      }, 300);
    };

    runCountdown();
  }, [phase]); // eslint-disable-line

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 40%, #0a0a1a 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Sora', 'Segoe UI', sans-serif",
      position: "relative", overflow: "hidden",
      padding: "20px 16px", boxSizing: "border-box",
    }}>
      {/* Ambient glows */}
      <div style={{
        position: "absolute", width: "min(600px,140vw)", height: "min(600px,140vw)",
        background: "radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)",
        borderRadius: "50%", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)", animation: "orbPulse 3s ease-in-out infinite",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", width: "min(900px,200vw)", height: "min(900px,200vw)",
        background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)",
        borderRadius: "50%", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)", animation: "orbPulse 4s ease-in-out infinite reverse",
        pointerEvents: "none",
      }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap');
        @keyframes orbPulse    { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.1)} }
        @keyframes greetPulse  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes countBounce { 0%{transform:scale(0.45) translateY(36px);opacity:0} 60%{transform:scale(1.12) translateY(-7px);opacity:1} 100%{transform:scale(1) translateY(0)} }
        @keyframes goSlam      { 0%{transform:scale(0.3);opacity:0;filter:blur(18px)} 65%{transform:scale(1.18);opacity:1;filter:blur(0)} 100%{transform:scale(1)} }
        @keyframes ringPulse   { 0%{transform:translate(-50%,-50%) scale(1);opacity:0.75} 100%{transform:translate(-50%,-50%) scale(1.65);opacity:0} }
        @keyframes tipSlide    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes speakDot    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.28;transform:scale(0.55)} }
        @keyframes spin        { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes phaseIn     { from{opacity:0;transform:scale(0.96) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes goGlow      { 0%,100%{text-shadow:0 0 40px rgba(74,222,128,0.5)} 50%{text-shadow:0 0 80px rgba(56,189,248,0.8)} }
        .phase-wrap { animation: phaseIn 0.42s ease forwards; }
        .tip-card   { animation: tipSlide 0.45s ease forwards; opacity: 0; }

        @media (max-width: 640px) {
          .cd-ring  { width: 130px !important; height: 130px !important; }
          .cd-num   { font-size: 70px !important; }
          .cd-label { font-size: 13px !important; letter-spacing: 0.14em !important; margin-bottom: 20px !important; }
          .cd-sub   { font-size: 12px !important; margin-top: 14px !important; }
          .cd-tips  { grid-template-columns: repeat(2,1fr) !important; gap: 9px !important; margin-top: 32px !important; }
          .cd-tip-pad { padding: 13px 10px !important; gap: 6px !important; }
          .go-text  { font-size: 50px !important; }
        }
        @media (min-width: 641px) and (max-width: 1023px) {
          .cd-ring { width: 155px !important; height: 155px !important; }
          .cd-num  { font-size: 90px !important; }
          .cd-tips { grid-template-columns: repeat(2,1fr) !important; gap: 13px !important; margin-top: 46px !important; }
        }
      `}</style>

      {/* ── GREETING PHASE ── */}
      {phase === "greeting" && (
        <div className="phase-wrap" style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", zIndex: 10 }}>
          <GreetingPhase
            userName={userName}
            interviewType={interviewType}
            interviewTitle={interviewTitle}
            onDone={() => { stopAllSpeech(); setPhase("mic_check"); }}
          />
        </div>
      )}

      {/* ── MIC CHECK ── */}
      {phase === "mic_check" && (
        <div className="phase-wrap" style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", zIndex: 10 }}>
          <StepIndicator current={1} />
          <MicCheckPhase onDone={() => { stopAllSpeech(); setPhase("camera_check"); }} />
        </div>
      )}

      {/* ── CAMERA CHECK ── */}
      {phase === "camera_check" && (
        <div className="phase-wrap" style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", zIndex: 10 }}>
          <StepIndicator current={2} />
          <CameraCheckPhase onDone={() => { stopAllSpeech(); setPhase("counting"); }} />
        </div>
      )}

      {/* ── COUNTDOWN 3-2-1 ── */}
      {phase === "counting" && !showGo && (
        <div className="phase-wrap" style={{ textAlign: "center", position: "relative", zIndex: 10, width: "100%" }}>
          <div className="cd-label" style={{
            color: "rgba(255,255,255,0.5)", letterSpacing: "0.28em",
            textTransform: "uppercase", marginBottom: 34, fontWeight: 600, fontSize: 22,
          }}>
            Interview Starting In
          </div>

          <div style={{ position: "relative", display: "inline-block" }}>
            {pulse && [1, 2].map(i => (
              <div key={i} style={{
                position: "absolute", top: "50%", left: "50%",
                width: "100%", height: "100%", borderRadius: "50%",
                border: `2px solid rgba(99,102,241,${0.55 / i})`,
                animation: `ringPulse ${0.75 + i * 0.2}s ease-out forwards`,
                pointerEvents: "none",
              }} />
            ))}
            <div className="cd-ring" style={{
              width: 182, height: 182, borderRadius: "50%",
              background: "linear-gradient(135deg,rgba(99,102,241,0.18),rgba(6,182,212,0.18))",
              border: "2px solid rgba(99,102,241,0.42)",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative",
              boxShadow: "0 0 70px rgba(99,102,241,0.32), inset 0 0 60px rgba(99,102,241,0.1)",
            }}>
              <div
                key={countdown}
                style={{
                  fontSize: 112, fontWeight: 800, lineHeight: 1,
                  background: "linear-gradient(135deg,#818cf8,#38bdf8)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  animation: "countBounce 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards",
                }}
                className="cd-num"
              >
                {countdown}
              </div>
            </div>
          </div>

          <div className="cd-sub" style={{ marginTop: 26, color: "rgba(255,255,255,0.38)", fontWeight: 400, fontSize: 17 }}>
            {countdown === 3 ? "Check your camera and microphone"
              : countdown === 2 ? "Take a deep breath…"
              : "Almost there…"}
          </div>

          <div className="cd-tips" style={{
            display: "grid", gridTemplateColumns: "repeat(4,1fr)",
            gap: 16, maxWidth: 720, margin: "64px auto 0", width: "100%",
          }}>
            {tips.map((tip, i) => (
              <div key={tip.title} className="tip-card cd-tip-pad" style={{
                animationDelay: `${i * 0.09}s`,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16, backdropFilter: "blur(10px)",
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 10, textAlign: "center", padding: "20px 16px", boxSizing: "border-box",
              }}>
                <div style={{ color: tip.color }}>{tip.icon}</div>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{tip.title}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{tip.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LET'S GO ── */}
      {showGo && (
        <div className="phase-wrap" style={{ textAlign: "center", position: "relative", zIndex: 10, width: "100%" }}>
          <div className="go-text" style={{
            fontSize: "clamp(52px,10vw,96px)", fontWeight: 800,
            background: "linear-gradient(135deg,#4ade80,#38bdf8)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            animation: "goSlam 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards, goGlow 2s ease-in-out infinite 0.6s",
          }}>
            Let's Go! 🚀
          </div>
        </div>
      )}
    </div>
  );
}