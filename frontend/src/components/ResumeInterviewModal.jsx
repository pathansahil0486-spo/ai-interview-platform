// frontend/src/components/ResumeInterviewModal.jsx
// Resume upload + Job Description → AI Interview
// PDF parsed in BROWSER using PDF.js — no backend PDF library needed

import { useState, useRef, useCallback } from "react";
import { X, Upload, FileText, Briefcase, ChevronRight, Loader2, CheckCircle, AlertCircle, Sparkles } from "lucide-react";

const EXPERIENCE_LEVELS = [
  { value: "entry",        label: "Entry Level",    sub: "0–2 years" },
  { value: "intermediate", label: "Mid Level",      sub: "2–5 years" },
  { value: "senior",       label: "Senior",         sub: "5–10 years" },
  { value: "expert",       label: "Expert / Lead",  sub: "10+ years" },
];

const INTERVIEW_TYPES = [
  { value: "mixed",      label: "Mixed",      icon: "⚡" },
  { value: "technical",  label: "Technical",  icon: "💻" },
  { value: "behavioral", label: "Behavioral", icon: "🧠" },
];

// ── Extract text from PDF using PDF.js (CDN) ─────────────────────────────────
async function extractTextFromPDF(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // Load PDF.js from CDN dynamically — no install needed
        if (!window.pdfjsLib) {
          await new Promise((res, rej) => {
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
            script.onload = res;
            script.onerror = () => rej(new Error("Failed to load PDF.js"));
            document.head.appendChild(script);
          });
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        }

        const typedArray = new Uint8Array(e.target.result);
        const pdf = await window.pdfjsLib.getDocument({ data: typedArray }).promise;

        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map((item) => item.str).join(" ");
          fullText += pageText + "\n";
        }

        if (!fullText.trim() || fullText.trim().length < 50) {
          reject(new Error("Could not extract text. Please use a text-based PDF (not a scanned image)."));
          return;
        }

        resolve(fullText.trim());
      } catch (err) {
        reject(new Error("PDF reading failed: " + err.message));
      }
    };
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsArrayBuffer(file);
  });
}

export default function ResumeInterviewModal({ isOpen, onClose, onInterviewCreated, user, profile, API_URL }) {
  const [step, setStep] = useState(1); // 1 = upload, 2 = details, 3 = loading
  const [pdfFile, setPdfFile]           = useState(null);
  const [resumeText, setResumeText]     = useState("");
  const [extracting, setExtracting]     = useState(false);
  const [extractError, setExtractError] = useState("");
  const [dragOver, setDragOver]         = useState(false);

  // Form state
  const [jobPosition,      setJobPosition]      = useState(profile?.jobTitle || profile?.domain || "");
  const [jobDescription,   setJobDescription]   = useState("");
  const [experienceLevel,  setExperienceLevel]  = useState(profile?.experienceLevel || "intermediate");
  const [interviewType,    setInterviewType]    = useState("mixed");
  const [totalQuestions,   setTotalQuestions]   = useState("8");
  const [submitting,       setSubmitting]       = useState(false);
  const [submitError,      setSubmitError]      = useState("");

  const fileInputRef = useRef(null);

  // ── Reset on close ──────────────────────────────────────────────────────────
  const handleClose = () => {
    setStep(1);
    setPdfFile(null);
    setResumeText("");
    setExtractError("");
    setSubmitError("");
    setSubmitting(false);
    setJobDescription("");
    onClose();
  };

  // ── Handle file selection ───────────────────────────────────────────────────
  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setExtractError("Only PDF files are supported.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setExtractError("File too large. Max 8MB.");
      return;
    }

    setPdfFile(file);
    setExtractError("");
    setExtracting(true);

    try {
      const text = await extractTextFromPDF(file);
      setResumeText(text);
      setStep(2);
    } catch (err) {
      setExtractError(err.message);
      setPdfFile(null);
    } finally {
      setExtracting(false);
    }
  }, []);

  const onFileChange = (e) => handleFile(e.target.files?.[0]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  // ── Submit to backend ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!jobPosition.trim()) {
      setSubmitError("Please enter the job position.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch(`${API_URL}/interviews/resume-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId:        user.id,
          userEmail:     user.primaryEmailAddress?.emailAddress || "",
          userName:      `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          resumeText,                   // ← plain text from browser PDF.js
          jobPosition:   jobPosition.trim(),
          jobDescription: jobDescription.trim(),
          experienceLevel,
          interviewType,
          totalQuestions: parseInt(totalQuestions),
        }),
      });

      const data = await res.json();

      if (data.success) {
        onInterviewCreated(data.data._id);
        handleClose();
      } else {
        throw new Error(data.message || "Failed to create interview");
      }
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg leading-tight">Resume Interview</h2>
                <p className="text-violet-200 text-xs">AI-powered questions from your resume</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${step >= s ? "bg-white text-violet-600" : "bg-white/20 text-white/60"}`}>
                  {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                <span className={`text-xs ${step >= s ? "text-white" : "text-white/50"}`}>
                  {s === 1 ? "Upload Resume" : "Interview Details"}
                </span>
                {s < 2 && <ChevronRight className="w-3 h-3 text-white/40" />}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">

          {/* ── STEP 1: Upload ───────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => !extracting && fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                  ${dragOver
                    ? "border-violet-400 bg-violet-50"
                    : "border-gray-200 hover:border-violet-300 hover:bg-violet-50/50"
                  }
                  ${extracting ? "pointer-events-none opacity-60" : ""}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={onFileChange}
                />

                {extracting ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                    <p className="text-sm font-medium text-gray-700">Reading your resume...</p>
                    <p className="text-xs text-gray-400">Extracting text with PDF.js</p>
                  </div>
                ) : pdfFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                    <p className="text-sm font-semibold text-gray-800">{pdfFile.name}</p>
                    <p className="text-xs text-gray-400">{(pdfFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center">
                      <Upload className="w-7 h-7 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Drop your resume here</p>
                      <p className="text-xs text-gray-400 mt-1">or click to browse • PDF only • Max 8MB</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Error */}
              {extractError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700">{extractError}</p>
                </div>
              )}

              <p className="text-xs text-gray-400 text-center">
                📌 Use a text-based PDF (not a scanned image). Your resume stays private — only the text is sent to AI.
              </p>
            </div>
          )}

          {/* ── STEP 2: Details form ─────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">

              {/* Resume parsed notice */}
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                <p className="text-sm text-green-700">
                  Resume read successfully —{" "}
                  <span className="font-semibold">{resumeText.length.toLocaleString()} characters</span> extracted
                </p>
              </div>

              {/* Job Position */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Job Position <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={jobPosition}
                    onChange={(e) => setJobPosition(e.target.value)}
                    placeholder="e.g. Senior Frontend Developer"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Job Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Job Description{" "}
                  <span className="text-gray-400 font-normal text-xs">(optional but recommended)</span>
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here — AI will tailor every question to exactly what the company is looking for..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-none"
                />
                {jobDescription.length > 0 && (
                  <p className="text-xs text-violet-600 mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Great! AI will match your resume skills to this JD
                  </p>
                )}
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Experience Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <button
                      key={lvl.value}
                      onClick={() => setExperienceLevel(lvl.value)}
                      className={`px-3 py-2.5 rounded-xl border text-left transition-all
                        ${experienceLevel === lvl.value
                          ? "border-violet-500 bg-violet-50 text-violet-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                        }`}
                    >
                      <p className="text-sm font-semibold leading-tight">{lvl.label}</p>
                      <p className="text-xs text-gray-400">{lvl.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Interview Type + Questions count */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                  <div className="flex flex-col gap-1.5">
                    {INTERVIEW_TYPES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setInterviewType(t.value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all
                          ${interviewType === t.value
                            ? "border-violet-500 bg-violet-50 text-violet-700 font-semibold"
                            : "border-gray-200 hover:border-gray-300 text-gray-600"
                          }`}
                      >
                        <span>{t.icon}</span> {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Questions</label>
                  <div className="flex flex-col gap-1.5">
                    {["5", "8", "10", "12"].map((n) => (
                      <button
                        key={n}
                        onClick={() => setTotalQuestions(n)}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all
                          ${totalQuestions === n
                            ? "border-violet-500 bg-violet-50 text-violet-700"
                            : "border-gray-200 hover:border-gray-300 text-gray-600"
                          }`}
                      >
                        {n} questions
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit error */}
              {submitError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 2 && (
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={() => { setStep(1); setPdfFile(null); setResumeText(""); setExtractError(""); }}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              ← Change Resume
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !jobPosition.trim()}
              className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:scale-[1.02] active:scale-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Start Interview
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}