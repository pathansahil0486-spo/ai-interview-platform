import { useEffect, useRef, useCallback } from "react";

/**
 * useInterviewSecurity
 * ─────────────────────────────────────────────────────────────
 * Adds 3 security layers to your interview session:
 *   1. Screenshot block  — detects PrintScreen / Snipping Tool
 *   2. Tab switch warn   — detects visibility change / window blur
 *   3. (Used in ChatPanel via CSS) text copy block — no logic here
 *
 * Usage in your Interview page:
 *   const { warningCount } = useInterviewSecurity({ isActive, onViolation });
 *
 * Props:
 *   isActive      — boolean, only enforce when interview is running
 *   onViolation   — callback(type, count) fired on each violation
 *                   type = "screenshot" | "tab_switch"
 * ─────────────────────────────────────────────────────────────
 */
export default function useInterviewSecurity({ isActive = false, onViolation } = {}) {
  const violationCount = useRef(0);
  const overlayRef     = useRef(null);

  /* ── helpers ── */
  const recordViolation = useCallback((type) => {
    if (!isActive) return;
    violationCount.current += 1;
    onViolation?.(type, violationCount.current);
  }, [isActive, onViolation]);

  /* ── overlay (black flash on screenshot attempt) ── */
  const showOverlay = useCallback(() => {
    if (!isActive) return;
    if (overlayRef.current) return;                     // already visible
    const div = document.createElement("div");
    div.style.cssText = [
      "position:fixed", "inset:0", "z-index:999999",
      "background:#000", "pointer-events:none",
      "transition:opacity 0.15s ease",
    ].join(";");
    document.body.appendChild(div);
    overlayRef.current = div;
    // remove after 600 ms (long enough to black out a screenshot)
    setTimeout(() => {
      div.style.opacity = "0";
      setTimeout(() => {
        div.remove();
        overlayRef.current = null;
      }, 180);
    }, 600);
  }, [isActive]);

  /* ── 1. Screenshot detection ── */
  useEffect(() => {
    if (!isActive) return;

    // PrintScreen key
    const onKeyDown = (e) => {
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        showOverlay();
        recordViolation("screenshot");
        // clear clipboard immediately (works in most Chromium browsers)
        try { navigator.clipboard.writeText("").catch(() => {}); } catch (_) {}
      }
      // Windows Snipping Tool shortcut: Win + Shift + S (we can't block Win key,
      // but we can detect Shift+S while meta is held in some environments)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "s") {
        showOverlay();
        recordViolation("screenshot");
      }
    };

    // Some browsers fire a clipboard write event on screenshot — intercept copy
    const onCopy = (e) => {
      // Only block copy outside of input / textarea
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      e.preventDefault();
      recordViolation("screenshot");
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("copy",   onCopy);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("copy",   onCopy);
    };
  }, [isActive, showOverlay, recordViolation]);

  /* ── 2. Tab switch / window blur detection ── */
  useEffect(() => {
    if (!isActive) return;

    const onVisibility = () => {
      if (document.hidden) recordViolation("tab_switch");
    };
    const onBlur = () => {
      // window blur fires when user switches app / tab
      recordViolation("tab_switch");
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    };
  }, [isActive, recordViolation]);

  /* ── cleanup overlay on unmount ── */
  useEffect(() => () => { overlayRef.current?.remove(); }, []);

  return { violationCount: violationCount.current };
}