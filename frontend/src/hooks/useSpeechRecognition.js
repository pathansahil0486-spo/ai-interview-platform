import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useSpeechRecognition
 * ─────────────────────────────────────────────────────────────
 * Features:
 *   - Continuous listening with auto-restart
 *   - Smart silence detection → fires onSilence(transcript) after pause
 *   - Background noise / filler filtering (very short words, hmm, uh, etc.)
 *   - Cheat detection: if captured text seems off-topic/external, fires onCheatDetected
 *   - Accumulates transcript across sessions; reset between questions
 *   - onSpeechStart fires when user first starts speaking
 *   - Does NOT fire onSilence while AI is speaking (guarded externally via stopListening)
 * ─────────────────────────────────────────────────────────────
 */

// Words/phrases that are background noise or meaningless filler — ignored
const NOISE_PATTERNS = [
  /^(um+|uh+|hmm+|hm+|ah+|er+|eh+|oh+|mm+)$/i,
  /^(yeah|yep|nope|ok|okay|right|sure|fine|good|nice|wow|oh|hi|hey|bye)$/i,
];

// Phrases that strongly suggest user is reading from an external source
// (looking up answer, reading to themselves, etc.)
const CHEAT_INDICATORS = [
  /according to (google|wikipedia|stack overflow|chatgpt|the internet|a website|the article)/i,
  /let me (google|search|look up|check online|ask)/i,
  /\b(copy|paste|copied|pasted)\b/i,
  /i('m| am) (reading|copying|looking at)\b/i,
  /found (it|the answer|this) online/i,
  /the (website|article|page|result|answer) says/i,
];

function isNoise(word) {
  if (!word || word.length <= 1) return true;
  return NOISE_PATTERNS.some(p => p.test(word.trim()));
}

function cleanTranscript(text) {
  if (!text) return '';
  // Remove single-character tokens and pure noise words
  return text
    .split(/\s+/)
    .filter(w => w.length > 1 && !isNoise(w))
    .join(' ')
    .trim();
}

function detectCheat(text) {
  if (!text) return false;
  return CHEAT_INDICATORS.some(p => p.test(text));
}

export const useSpeechRecognition = ({
  silenceMs = 2500,          // ms of silence before auto-submit
  onSilence = null,          // callback(finalTranscript) — auto-submit
  onSpeechStart = null,      // callback() when user starts speaking
  onCheatDetected = null,    // callback(transcript) — suspicious input detected
  minWordsToSubmit = 3,      // don't auto-submit very short utterances
} = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript]   = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking]   = useState(false);

  const recognitionRef   = useRef(null);
  const accumulatedRef   = useRef('');     // raw full transcript
  const silenceTimer     = useRef(null);
  const listeningFlag    = useRef(false);
  const speakingRef      = useRef(false);
  const lastResultTime   = useRef(0);
  const cheatFiredRef    = useRef(false);  // fire cheat warning once per answer

  // ── Silence timer ─────────────────────────────────────────────────────────
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimer.current) { clearTimeout(silenceTimer.current); silenceTimer.current = null; }
  }, []);

  const scheduleSilence = useCallback(() => {
    clearSilenceTimer();
    silenceTimer.current = setTimeout(() => {
      const raw = accumulatedRef.current.trim();
      const cleaned = cleanTranscript(raw);
      const words = cleaned.split(/\s+/).filter(Boolean);

      if (words.length >= minWordsToSubmit && onSilence) {
        // Check for cheat before submitting
        if (detectCheat(raw) && !cheatFiredRef.current) {
          cheatFiredRef.current = true;
          onCheatDetected?.(raw);
        }
        onSilence(cleaned);
      }
    }, silenceMs);
  }, [silenceMs, minWordsToSubmit, onSilence, onCheatDetected, clearSilenceTimer]);

  // ── Build recognition instance (once on mount) ────────────────────────────
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    setIsSupported(true);

    const recognition = new SpeechRecognition();
    recognition.continuous      = true;
    recognition.interimResults  = true;
    recognition.lang            = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      lastResultTime.current = Date.now();
      let interim  = '';
      let newFinal = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const part = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinal += part + ' ';
        } else {
          interim += part;
        }
      }

      // Filter: if the only thing captured is noise, ignore it completely
      const interimCleaned = cleanTranscript(interim);
      const finalCleaned   = cleanTranscript(newFinal);

      // Fire onSpeechStart only once when user actually starts saying real words
      if ((interimCleaned || finalCleaned) && !speakingRef.current) {
        speakingRef.current = true;
        setIsSpeaking(true);
        onSpeechStart?.();
        clearSilenceTimer();  // don't submit while they're talking
      }

      // Accumulate raw final (we clean on submit, not here, so display is natural)
      if (newFinal) {
        accumulatedRef.current += newFinal;
      }

      // Display: raw accumulated + raw interim (looks natural to user)
      const displayed = (accumulatedRef.current + interim).trim();
      setTranscript(displayed);

      // Reset silence timer after any real speech
      if (interimCleaned || finalCleaned) {
        scheduleSilence();
      }

      // Mark speaking done when final comes in without more interim
      if (newFinal && !interim) {
        speakingRef.current = false;
        setIsSpeaking(false);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        // Normal silence — schedule submit if we have enough content
        speakingRef.current = false;
        setIsSpeaking(false);
        scheduleSilence();
      } else if (event.error === 'audio-capture') {
        // Mic disconnected — stop
        listeningFlag.current = false;
        setIsListening(false);
        setIsSpeaking(false);
      } else if (event.error !== 'aborted') {
        // Other errors — auto-restart
        if (listeningFlag.current) {
          setTimeout(() => restartRecognition(), 600);
        }
      }
    };

    recognition.onend = () => {
      speakingRef.current = false;
      setIsSpeaking(false);
      if (listeningFlag.current) {
        // Auto-restart to keep listening continuously
        setTimeout(() => restartRecognition(), 180);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      listeningFlag.current = false;
      try { recognition.abort(); } catch (_) {}
      clearSilenceTimer();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Internal restart ──────────────────────────────────────────────────────
  const restartRecognition = useCallback(() => {
    if (!recognitionRef.current || !listeningFlag.current) return;
    try {
      recognitionRef.current.start();
    } catch (err) {
      if (!err.message?.includes('already started')) {
        console.warn('Restart error:', err.message);
      }
    }
  }, []);

  // ── Public API ────────────────────────────────────────────────────────────

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) return;
    listeningFlag.current = true;
    cheatFiredRef.current = false;
    clearSilenceTimer();
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      if (!err.message?.includes('already started')) {
        console.warn('startListening error:', err.message);
      }
    }
  }, [isSupported, clearSilenceTimer]);

  const stopListening = useCallback(() => {
    listeningFlag.current = false;
    clearSilenceTimer();
    try { recognitionRef.current?.stop(); } catch (_) {}
    setIsListening(false);
    setIsSpeaking(false);
    speakingRef.current = false;
  }, [clearSilenceTimer]);

  // Call between questions — clears accumulation and cheat flag
  const resetTranscript = useCallback(() => {
    accumulatedRef.current = '';
    speakingRef.current    = false;
    cheatFiredRef.current  = false;
    setTranscript('');
    setIsSpeaking(false);
    clearSilenceTimer();
  }, [clearSilenceTimer]);

  const getTranscript = useCallback(() => cleanTranscript(accumulatedRef.current), []);

  return {
    isListening,
    transcript,
    isSpeaking,
    startListening,
    stopListening,
    resetTranscript,
    getTranscript,
    isSupported,
  };
};