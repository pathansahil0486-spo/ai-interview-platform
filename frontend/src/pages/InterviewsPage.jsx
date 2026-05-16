import { useUser } from "@clerk/clerk-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import CreateInterviewModal from "../components/CreateInterviewModal";
import {
  Plus, Search, Calendar, Clock, CheckCircle, Play, MoreVertical,
  Target, BarChart3, Users, Loader, Trash2, Video, GraduationCap,
  Briefcase, TrendingUp, Award, Upload
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── CHANGE: mobile-responsive card styles matching DashboardPage ──────────────
const CARD_STYLES = `
  .icard {
    padding: 16px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: background .15s;
  }
  .icard:hover { background: #f7f5ff; }
  .icard:hover .icard-title { color: #5b3ef5; }

  @media (max-width: 480px) {
    .icard {
      flex-wrap: wrap;
      gap: 10px !important;
      padding: 14px 14px !important;
    }
    .icard-content { min-width: 0; flex: 1 1 0; }
    .icard-title { white-space: normal !important; word-break: break-word; font-size: 13px !important; }
    .icard-meta { flex-wrap: wrap; gap: 6px !important; }
    .icard-badges { flex-wrap: wrap; gap: 4px !important; }
    .icard-actions { width: 100% !important; justify-content: space-between !important; margin-top: 4px; }
    .icard-start-btn { flex: 1; justify-content: center !important; }
  }
`;
// ─────────────────────────────────────────────────────────────────────────────

// ── PDF.js browser-side extractor — no backend library needed ─────────────────
async function extractPDFText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
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
          fullText += content.items.map((item) => item.str).join(" ") + "\n";
        }
        if (!fullText.trim() || fullText.trim().length < 50) {
          reject(new Error("Could not extract text. Use a text-based PDF (not a scanned image)."));
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

const STUDENT_INTERVIEW_SUGGESTIONS = {
  "10th": ["Board Exam Mock", "Scholarship Interview", "School Leadership"],
  "11th": ["Subject Knowledge Quiz", "Competitive Exam Mock", "Stream Selection Discussion"],
  "12th": ["JEE/NEET Mock Discussion", "College Admission PI", "Scholarship Interview"],
  "Undergraduate": ["Campus Placement Round", "Internship Interview", "GATE/CAT Mock", "HR Behavioral Round"],
  "Postgraduate": ["Research Interview", "Academic Discussion", "Industry Role Interview"],
  "PhD": ["Research Defense Mock", "Academic Job Talk", "Industry Research Interview"],
};

const JOBSEEKER_INTERVIEW_SUGGESTIONS = {
  "Software Development": ["DSA Coding Round", "System Design Interview", "Behavioral HR Round", "Tech Deep-Dive"],
  "Data Science / AI / ML": ["ML Concepts Interview", "Case Study Round", "SQL Analytics Interview", "Product Sense"],
  "Product Management": ["Product Case Study", "Estimation Round", "Behavioral Interview", "Technical PM Round"],
  "Design (UI/UX)": ["Portfolio Review", "Design Challenge", "Whiteboard Session", "Research Interview"],
  "Finance / Accounting": ["Technical Finance Round", "Valuation Case Study", "Behavioral Round"],
  "Consulting": ["Consulting Case Interview", "Market Sizing", "Fit Interview", "Group Discussion"],
  "Marketing / Growth": ["Marketing Strategy", "Analytics Round", "Campaign Planning"],
  "Human Resources": ["HR Case Study", "Behavioral Round", "Policy Discussion"],
  "Sales / Business Development": ["Sales Pitch Simulation", "Negotiation Role Play", "Behavioral Round"],
  "Operations": ["Operations Case Study", "Process Design Round", "Analytics Round"],
  "Other": ["General Interview", "Behavioral Round", "Domain Knowledge Test"],
};

function InterviewsPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);
  const [filteredInterviews, setFilteredInterviews] = useState([]);
  const [profile, setProfile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [activeView, setActiveView] = useState("list");
  const [uploadingResume, setUploadingResume] = useState(false);
  const resumeInputRef = useRef(null);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  useEffect(() => {
    filterInterviews();
  }, [interviews, searchTerm, statusFilter, typeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [interviewsRes, profileRes] = await Promise.all([
        fetch(`${API_URL}/interviews?userId=${user.id}`),
        fetch(`${API_URL}/users/profile/${user.id}`),
      ]);
      const interviewsData = await interviewsRes.json();
      const profileData = await profileRes.json();
      if (interviewsData.success) setInterviews(interviewsData.data);
      if (profileData.success) setProfile(profileData.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load interviews");
    } finally {
      setLoading(false);
    }
  };

  const filterInterviews = () => {
    let f = interviews;
    if (searchTerm) f = f.filter(i =>
      i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.jobPosition.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (statusFilter !== "all") f = f.filter(i => i.status === statusFilter);
    if (typeFilter !== "all") f = f.filter(i => i.interviewType === typeFilter);
    setFilteredInterviews(f);
  };

  const getStatusConfig = (status) => ({
    draft:       { color: "bg-gray-100 text-gray-600",       icon: Clock,       label: "Draft"       },
    in_progress: { color: "bg-blue-100 text-blue-700",       icon: Play,        label: "In Progress" },
    completed:   { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle, label: "Completed"   },
    abandoned:   { color: "bg-red-100 text-red-700",         icon: Clock,       label: "Abandoned"   },
  }[status] || { color: "bg-gray-100 text-gray-600", icon: Clock, label: status });

  const getTypeColor = (type) => ({
    technical:  "bg-purple-100 text-purple-700",
    behavioral: "bg-orange-100 text-orange-700",
    mixed:      "bg-blue-100 text-blue-700",
  }[type] || "bg-gray-100 text-gray-700");

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeletingId(deleteTarget.id);
      const res = await fetch(`${API_URL}/interviews/${deleteTarget.id}?userId=${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Interview deleted");
        setInterviews(prev => prev.filter(i => i._id !== deleteTarget.id));
      } else throw new Error(data.message);
    } catch (e) {
      toast.error(e.message || "Failed to delete");
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files allowed");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("File too large. Max 8MB.");
      return;
    }

    try {
      setUploadingResume(true);
      toast.loading("Reading your resume...", { id: "resume" });

      const resumeText = await extractPDFText(file);

      toast.loading("Generating personalised questions...", { id: "resume" });

      const res = await fetch(`${API_URL}/interviews/resume-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId:          user.id,
          userEmail:       user.primaryEmailAddress?.emailAddress || "",
          userName:        `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          resumeText,
          jobPosition:     profile?.jobTitle || profile?.domain || "Software Engineer",
          experienceLevel: profile?.experienceLevel || "intermediate",
          interviewType:   "mixed",
          totalQuestions:  8,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Resume interview ready!", { id: "resume", duration: 3000 });
        navigate(`/interview/${data.data._id}`);
      } else {
        throw new Error(data.message || "Failed to create interview");
      }
    } catch (err) {
      toast.error(err.message || "Failed to process resume", { id: "resume" });
    } finally {
      setUploadingResume(false);
      e.target.value = "";
    }
  };

  const isStudent   = profile?.userType === "student";
  const isJobseeker = profile?.userType === "jobseeker";

  const suggestions = isStudent
    ? (STUDENT_INTERVIEW_SUGGESTIONS[profile?.studentClass] || [])
    : isJobseeker
    ? (JOBSEEKER_INTERVIEW_SUGGESTIONS[profile?.domain] || JOBSEEKER_INTERVIEW_SUGGESTIONS["Other"])
    : [];

  const completedCount  = interviews.filter(i => i.status === "completed").length;
  const inProgressCount = interviews.filter(i => i.status === "in_progress").length;
  const avgScore = interviews.filter(i => i.overallScore > 0).length
    ? Math.round(
        interviews.filter(i => i.overallScore > 0).reduce((a, i) => a + i.overallScore, 0) /
        interviews.filter(i => i.overallScore > 0).length
      )
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fc]">
        
        <div className="flex items-center justify-center h-[calc(100vh-70px)]">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto animate-pulse">
              <Loader className="w-7 h-7 text-white animate-spin" />
            </div>
            <p className="text-gray-500 font-medium">Loading interviews…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{CARD_STYLES}</style>
      <div className="min-h-screen bg-[#f7f8fc]">
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {isStudent ? (
                  <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold">
                    <GraduationCap className="w-3.5 h-3.5" /> Student
                  </span>
                ) : isJobseeker ? (
                  <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-semibold">
                    <Briefcase className="w-3.5 h-3.5" /> {profile?.domain || "Professional"}
                  </span>
                ) : null}
              </div>
              <h1 className="text-2xl font-black text-gray-900">My Interviews</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {isStudent
                  ? `${profile?.studentClass}${profile?.stream ? ` · ${profile.stream}` : ""} prep sessions`
                  : "All your interview practice sessions"}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleResumeUpload}
              />
              <button
                onClick={() => resumeInputRef.current?.click()}
                disabled={uploadingResume}
                className="self-start sm:self-auto flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:shadow-md hover:border-purple-300 hover:text-purple-700 transition-all disabled:opacity-60"
              >
                {uploadingResume ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploadingResume ? "Reading..." : "Upload Resume"}
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="self-start sm:self-auto flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:scale-105 transition-all"
              >
                <Plus className="w-4 h-4" /> New Interview
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Users,       label: "Total",       value: interviews.length, color: "blue"    },
              { icon: CheckCircle, label: "Completed",   value: completedCount,    color: "emerald" },
              { icon: Play,        label: "In Progress", value: inProgressCount,   color: "purple"  },
              { icon: BarChart3,   label: "Avg Score",   value: `${avgScore}%`,    color: "amber"   },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  stat.color === "blue"    ? "bg-blue-50 text-blue-600"       :
                  stat.color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                  stat.color === "purple"  ? "bg-purple-50 text-purple-600"   :
                  "bg-amber-50 text-amber-600"
                }`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-black text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Suggested Interview Types */}
          {suggestions.length > 0 && interviews.length === 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-2xl p-6">
              <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                {isStudent ? `Recommended for ${profile?.studentClass}` : `Popular for ${profile?.domain}`}
              </h3>
              <p className="text-gray-500 text-xs mb-4">Quick-start with a pre-configured interview type</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                  >
                    <Play className="w-3.5 h-3.5" /> {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search interviews…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="abandoned">Abandoned</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="technical">Technical</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Interview List */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {filteredInterviews.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-gray-400" />
                </div>
                <p className="font-semibold text-gray-900 mb-1">
                  {interviews.length === 0 ? "No interviews yet" : "No results found"}
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  {interviews.length === 0
                    ? isStudent
                      ? `Start your first ${profile?.studentClass} practice session!`
                      : `Create your first ${profile?.domain || ""} interview practice!`
                    : "Try adjusting your filters"}
                </p>
                {interviews.length === 0 && (
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <button
                      onClick={() => resumeInputRef.current?.click()}
                      disabled={uploadingResume}
                      className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:shadow-md hover:border-purple-300 hover:text-purple-700 transition-all disabled:opacity-60"
                    >
                      <Upload className="w-4 h-4" /> Upload Resume
                    </button>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg transition-all"
                    >
                      <Plus className="w-4 h-4" /> Create Interview
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredInterviews.map((interview) => (
                  <InterviewCard
                    key={interview._id}
                    interview={interview}
                    getStatusConfig={getStatusConfig}
                    getTypeColor={getTypeColor}
                    onStart={() => navigate(
                      interview.status === "completed"
                        ? `/interview/${interview._id}/results`
                        : `/interview/${interview._id}`
                    )}
                    onDelete={() => setDeleteTarget({ id: interview._id, title: interview.title })}
                    deleting={deletingId === interview._id}
                  />
                ))}
              </div>
            )}
          </div>

        </main>

        {deleteTarget && (
          <DeleteConfirmModal
            title={deleteTarget.title}
            deleting={!!deletingId}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}

        {showCreateModal && (
          <CreateInterviewModal
            user={user}
            onClose={() => setShowCreateModal(false)}
            onSuccess={(interview) => {
              setShowCreateModal(false);
              navigate(`/interview/${interview._id}`);
            }}
          />
        )}
      </div>
    </>
  );
}

function DeleteConfirmModal({ title, deleting, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !deleting) onCancel(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center border border-gray-100">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
          <Trash2 className="w-7 h-7 text-red-700" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Delete interview?</h2>
        <p className="text-sm font-semibold text-gray-700 mb-1 truncate px-2">{title}</p>
        <p className="text-xs text-gray-400 mb-7">This action cannot be undone.</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-700 text-white text-sm font-semibold hover:bg-red-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {deleting ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── InterviewCard — updated to match DashboardPage mobile row style ───────────
function InterviewCard({ interview, getStatusConfig, getTypeColor, onStart, onDelete, deleting }) {
  const [showMenu, setShowMenu] = useState(false);
  const status = getStatusConfig(interview.status);
  const StatusIcon = status.icon;

  const dotColor = {
    draft:       "#a899f7",
    in_progress: "#f5a623",
    completed:   "#00d4aa",
    abandoned:   "#ff4f6d",
  }[interview.status] || "#a899f7";

  return (
    <div className="icard">
      {/* left accent bar — same as dashboard */}
      <div style={{ width: 4, height: 36, borderRadius: 99, background: dotColor, flexShrink: 0 }} />

      <div className="icard-content" style={{ flex: 1, minWidth: 0 }}>
        {/* title + badges */}
        <div className="icard-badges" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
          <h3
            className="icard-title"
            style={{
              fontWeight: 600, color: "#0f0e17", fontSize: 14, margin: 0,
              overflow: "hidden", textOverflow: "ellipsis",
              whiteSpace: "nowrap", flex: "1 1 100px", minWidth: 0,
              transition: "color .15s",
            }}
          >
            {interview.title}
          </h3>
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${status.color}`}>
            <StatusIcon className="w-3 h-3" />{status.label}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getTypeColor(interview.interviewType)}`}>
            {interview.interviewType}
          </span>
        </div>

        {/* meta row */}
        <div className="icard-meta" style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6b6880" }}>
            <Calendar className="w-3 h-3" />
            {new Date(interview.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          {interview.completionPercentage > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6b6880" }}>
              <TrendingUp className="w-3 h-3" />
              {interview.completionPercentage}% done
            </span>
          )}
          {interview.overallScore > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: "#007a5e", display: "flex", alignItems: "center", gap: 4 }}>
              <Award className="w-3 h-3" /> {interview.overallScore}%
            </span>
          )}
          <span style={{ fontSize: 12, color: "#6b6880" }}>{interview.questions?.length || 0} questions</span>
        </div>
      </div>

      {/* actions */}
      <div className="icard-actions" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <button
          className="icard-start-btn"
          onClick={onStart}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 16px", borderRadius: 12, border: "none", cursor: "pointer",
            background: interview.status === "completed" ? "#f0eeff" : "linear-gradient(135deg,#5b3ef5,#9b6ff7)",
            color: interview.status === "completed" ? "#5b3ef5" : "#fff",
            fontSize: 13, fontWeight: 700,
            boxShadow: interview.status === "completed" ? "none" : "0 4px 14px rgba(91,62,245,.35)",
            transition: "all .2s", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
        >
          {interview.status === "completed"
            ? <><BarChart3 className="w-3.5 h-3.5" /> Results</>
            : <><Video className="w-3.5 h-3.5" /> Start</>}
        </button>

        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              padding: 8, background: "none", border: "none", cursor: "pointer",
              color: "#6b6880", borderRadius: 10, transition: "background .15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#f0f0f0"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showMenu && (
            <div style={{
              position: "absolute", right: 0, marginTop: 4, width: 176,
              background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,.12)",
              border: "1px solid #f0f0f0", padding: "4px 0", zIndex: 10,
            }}>
              <button
                onClick={() => { onDelete(); setShowMenu(false); }}
                disabled={deleting}
                style={{
                  width: "100%", textAlign: "left", padding: "8px 16px",
                  color: "#c0002a", background: "none", border: "none", cursor: "pointer",
                  fontSize: 12, display: "flex", alignItems: "center", gap: 8,
                  transition: "background .15s", fontFamily: "Inter, sans-serif",
                  opacity: deleting ? 0.5 : 1,
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#fff1f3"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                {deleting
                  ? <Loader className="w-3.5 h-3.5 animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />
                }
                {deleting ? "Deleting…" : "Delete Interview"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default InterviewsPage;