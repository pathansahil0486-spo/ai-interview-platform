import { useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import CreateInterviewModal from "../components/CreateInterviewModal";
import {
  Plus, Briefcase, Clock, CheckCircle, TrendingUp, Calendar,
  Target, Award, Loader, Play, BarChart3, Users, Zap, Rocket,
  Star, Video, GraduationCap, BookOpen, Code, Brain, Trophy,
  ChevronRight, Flame, Layers, FileText, MessageSquare
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* ─── Google Fonts injection ─────────────────────────────────── */
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap";
document.head.appendChild(fontLink);

const STYLES = `
  :root {
    --ink: #0f0e17;
    --ink2: #2d2b3d;
    --muted: #6b6880;
    --border: #e8e6f0;
    --surface: #faf9fd;
    --card: #ffffff;
    --accent: #5b3ef5;
    --accent2: #e04aff;
    --accent3: #00d4aa;
    --warn: #f5a623;
    --danger: #ff4f6d;
  }
  .dash-root * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
  .dash-root h1,h2,h3,.syne { font-family: 'Inter', sans-serif; }

  /* ── shimmer badge ── */
  @keyframes shimmer {
    0%{background-position:200% center}
    100%{background-position:-200% center}
  }
  .badge-shimmer {
    background: linear-gradient(90deg, #5b3ef5 0%, #e04aff 40%, #5b3ef5 80%);
    background-size: 200% auto;
    animation: shimmer 3s linear infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── card hover lift ── */
  .card-lift {
    transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s ease;
  }
  .card-lift:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(91,62,245,.10);
  }

  /* ── pill tabs ── */
  .tab-pill {
    transition: background 0.18s, color 0.18s;
    border-radius: 99px;
    cursor: pointer;
    border: none;
    background: transparent;
  }
  .tab-pill.active {
    background: #5b3ef5;
    color: #fff;
  }
  .tab-pill:not(.active):hover { background: #f0eeff; color: #5b3ef5; }

  /* ── row hover ── */
  .irow:hover { background: #f7f5ff; }
  .irow:hover .irow-title { color: #5b3ef5; }

  /* ── score bar ── */
  @keyframes barGrow { from {width:0} to {width:var(--w)} }
  .score-bar-fill { animation: barGrow .8s cubic-bezier(.22,1,.36,1) forwards; }

  /* ── fade up ── */
  @keyframes fadeUp {
    from { opacity:0; transform: translateY(14px); }
    to   { opacity:1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp .5s ease both; }
  .fade-up-1 { animation-delay:.05s }
  .fade-up-2 { animation-delay:.12s }
  .fade-up-3 { animation-delay:.19s }
  .fade-up-4 { animation-delay:.26s }

  /* ── noise overlay ── */
  .noise::after {
    content:'';
    position:absolute;inset:0;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events:none;border-radius:inherit;
  }

  /* ── interview row mobile fix ── */
  @media (max-width: 600px) {
    .irow { flex-wrap: wrap; gap: 10px !important; padding: 14px 16px !important; }
    .irow-content { min-width: 0; flex: 1 1 0; }
    .irow-title { white-space: normal !important; word-break: break-word; }
    .irow-meta { flex-wrap: wrap; gap: 8px !important; }
    .irow-badge { flex-shrink: 0; }
    .irow-action { width: 100%; justify-content: center !important; margin-top: 2px; }
  }
`;

// ── Student-specific syllabus map ─────────────────────────────────────────────
const STUDENT_SYLLABUS = {
  "10th": {
    focusAreas: ["Mathematics", "Science", "English Grammar", "General Knowledge"],
    prepTopics: ["Board Exam Pattern", "NTSE Preparation", "Olympiad Basics"],
    quickTips: ["Focus on NCERT concepts", "Practice previous year papers", "Work on time management"],
    recommendedInterviews: ["Subject Knowledge Check", "Scholarship Interview Prep", "School Leadership Interview"],
  },
  "11th": {
    "Science (PCM)": {
      focusAreas: ["Physics", "Chemistry", "Mathematics", "JEE Basics"],
      prepTopics: ["JEE Foundation", "KVPY Prep", "Class 11 Board Mastery"],
      quickTips: ["Start JEE prep early", "Clear fundamentals thoroughly", "Join a study group"],
      recommendedInterviews: ["Science Concept Quiz", "Problem Solving Interview", "JEE Mock Discussion"],
    },
    "Science (PCB)": {
      focusAreas: ["Biology", "Chemistry", "Physics", "NEET Basics"],
      prepTopics: ["NEET Foundation", "AIIMS Preparation", "Biology Deep Dive"],
      quickTips: ["Memorize diagrams", "Understand processes, not just facts", "Regular revision"],
      recommendedInterviews: ["Biology Concept Test", "NEET Pattern Mock", "Medical Aptitude Check"],
    },
    "Commerce": {
      focusAreas: ["Accountancy", "Economics", "Business Studies", "Mathematics"],
      prepTopics: ["CA Foundation", "CS Basics", "Commerce Career Paths"],
      quickTips: ["Practice balance sheets", "Understand market concepts", "Read business news"],
      recommendedInterviews: ["Finance Aptitude", "Commerce Knowledge Test", "CA Interview Prep"],
    },
    "Arts / Humanities": {
      focusAreas: ["History", "Political Science", "Geography", "Sociology"],
      prepTopics: ["UPSC Foundation", "Journalism Prep", "Law Entrance"],
      quickTips: ["Read newspapers daily", "Write essays regularly", "Build general awareness"],
      recommendedInterviews: ["Current Affairs Discussion", "Essay-based Interview", "UPSC Mock"],
    },
  },
  "12th": {
    "Science (PCM)": {
      focusAreas: ["JEE Advanced Topics", "Board Exam Mastery", "Engineering Entrance"],
      prepTopics: ["JEE Advanced", "BITSAT", "State Engineering Entrances"],
      quickTips: ["Balance boards and entrances", "Mock tests weekly", "Analyze mistakes"],
      recommendedInterviews: ["JEE Mock Discussion", "Engineering Aptitude", "IIT Interview Simulation"],
    },
    "Science (PCB)": {
      focusAreas: ["NEET Full Syllabus", "Board Mastery", "Medical Entrances"],
      prepTopics: ["NEET UG Prep", "AIIMS MBBS", "State Medical Entrances"],
      quickTips: ["Revise NCERT daily", "Solve 100+ MCQs daily", "Time-bound practice"],
      recommendedInterviews: ["NEET Mock Discussion", "Medical Ethics Interview", "Biology Deep Dive"],
    },
    "Commerce": {
      focusAreas: ["Advanced Accountancy", "Economics", "CA Foundation"],
      prepTopics: ["CA CPT/Foundation", "BBA Entrances", "Stock Market Basics"],
      quickTips: ["Master accounting standards", "Practice case studies", "Learn Excel basics"],
      recommendedInterviews: ["Accounts Interview Prep", "Finance Knowledge Test", "BBA Admission Mock"],
    },
    "Arts / Humanities": {
      focusAreas: ["UPSC CSE Prelims Foundation", "Journalism", "Law Entrances"],
      prepTopics: ["CLAT Preparation", "NDA Prep", "Mass Communication"],
      quickTips: ["Current affairs are key", "Read multiple newspapers", "Practice writing daily"],
      recommendedInterviews: ["Current Affairs Interview", "CLAT Mock", "Journalism Aptitude"],
    },
  },
  "Undergraduate": {
    "Engineering / Technology": {
      focusAreas: ["DSA", "System Design", "Core CS Subjects", "DBMS"],
      prepTopics: ["Campus Placements", "GATE Prep", "Internship Interviews", "Coding Contests"],
      quickTips: ["Practice LeetCode daily", "Build side projects", "Learn system design basics"],
      recommendedInterviews: ["Technical DSA Round", "System Design Discussion", "HR Behavioral Round"],
    },
    "Medical / Health Sciences": {
      focusAreas: ["Clinical Knowledge", "PG Entrance", "Research Skills"],
      prepTopics: ["NEET PG Foundation", "USMLE Step 1", "Medical Research"],
      quickTips: ["Stay updated with clinical guidelines", "Practice case presentations", "Join study groups"],
      recommendedInterviews: ["Clinical Case Discussion", "Medical Knowledge Test", "Research Interview"],
    },
    "Commerce / Business": {
      focusAreas: ["Finance", "Marketing", "HR", "Operations"],
      prepTopics: ["MBA Entrance (CAT/XAT)", "CA Inter", "Placement Prep"],
      quickTips: ["Read business case studies", "Network with alumni", "Learn advanced Excel/SQL"],
      recommendedInterviews: ["Finance Interview", "Marketing Case Study", "MBA PI Preparation"],
    },
    "Arts / Humanities": {
      focusAreas: ["Research & Writing", "Critical Thinking", "Communication"],
      prepTopics: ["UPSC CSE", "Journalism & Media", "Academic Research"],
      quickTips: ["Write research papers", "Build communication skills", "Current affairs mastery"],
      recommendedInterviews: ["UPSC Interview Mock", "Research Presentation", "Communication Skills"],
    },
    "Law": {
      focusAreas: ["Constitutional Law", "Contract Law", "Moot Court Skills"],
      prepTopics: ["Bar Exam Prep", "Judiciary Exams", "Corporate Law Career"],
      quickTips: ["Practice moot courts", "Read landmark judgments", "Develop argumentation skills"],
      recommendedInterviews: ["Legal Knowledge Test", "Moot Court Simulation", "Law Firm Interview"],
    },
    "Design": {
      focusAreas: ["UI/UX Principles", "Portfolio Building", "Design Thinking"],
      prepTopics: ["Graphic Design", "Product Design", "Motion Design"],
      quickTips: ["Build a strong portfolio", "Learn Figma/Adobe Suite", "Study design patterns"],
      recommendedInterviews: ["Portfolio Review", "Design Challenge", "UI/UX Case Study"],
    },
    "Other": {
      focusAreas: ["Communication", "Aptitude", "Domain Knowledge"],
      prepTopics: ["General Placement Prep", "Aptitude Training", "Soft Skills"],
      quickTips: ["Practice aptitude daily", "Work on communication", "Build domain expertise"],
      recommendedInterviews: ["General Aptitude Test", "Communication Skills", "Domain Interview"],
    },
  },
  "Postgraduate": {
    focusAreas: ["Research Depth", "Domain Expertise", "Leadership", "Publications"],
    prepTopics: ["PhD Admissions", "Research Presentations", "Academic Conferences"],
    quickTips: ["Work on research papers", "Network with professors", "Attend workshops"],
    recommendedInterviews: ["Research Interview", "Academic Discussion", "PhD Viva Mock"],
  },
  "PhD": {
    focusAreas: ["Original Research", "Academic Writing", "Grant Proposals"],
    prepTopics: ["Post-Doctoral Applications", "Industry Research Roles", "Academic Positions"],
    quickTips: ["Publish in reputed journals", "Present at conferences", "Build academic network"],
    recommendedInterviews: ["Research Defense Mock", "Academic Job Talk", "Industry Research Interview"],
  },
};

const JOBSEEKER_SYLLABUS = {
  "Software Development": {
    focusAreas: ["DSA & Algorithms", "System Design", "OOP Principles", "Clean Code", "APIs"],
    prepTopics: ["LeetCode Patterns", "System Design Interviews", "Language Proficiency", "Code Review"],
    quickTips: ["Practice 3 LeetCode problems daily", "Learn distributed systems basics", "Build open-source projects"],
    recommendedInterviews: ["DSA Round", "System Design Interview", "Code Review Session", "Behavioral HR Round"],
  },
  "Data Science / AI / ML": {
    focusAreas: ["Statistics & Probability", "ML Algorithms", "Python/R", "Data Wrangling", "Model Evaluation"],
    prepTopics: ["ML System Design", "Case Studies", "SQL for Data Science", "Deep Learning"],
    quickTips: ["Build Kaggle projects", "Understand business impact of ML", "Practice A/B testing concepts"],
    recommendedInterviews: ["ML Concepts Round", "Case Study Interview", "SQL Data Interview", "Product Sense"],
  },
  "Product Management": {
    focusAreas: ["Product Strategy", "Metrics & Analytics", "User Research", "Roadmapping", "Stakeholder Mgmt"],
    prepTopics: ["PM Case Studies", "Estimation Questions", "Behavioral Questions", "Technical Basics"],
    quickTips: ["Use CIRCLES method for product questions", "Practice metric trade-offs", "Read product teardowns"],
    recommendedInterviews: ["Product Case Study", "Estimation Round", "Behavioral Interview", "Technical PM Round"],
  },
  "Design (UI/UX)": {
    focusAreas: ["Design Thinking", "Wireframing", "Prototyping", "User Research", "Visual Design"],
    prepTopics: ["Portfolio Presentation", "Design Challenges", "Heuristic Evaluation", "Design Systems"],
    quickTips: ["Present your process, not just output", "Prepare 3 in-depth case studies", "Learn Figma deeply"],
    recommendedInterviews: ["Portfolio Review", "Design Challenge", "Whiteboard Design", "Research Interview"],
  },
  "Marketing / Growth": {
    focusAreas: ["Digital Marketing", "Growth Hacking", "Analytics", "Content Strategy", "SEO/SEM"],
    prepTopics: ["Marketing Case Studies", "Campaign Strategy", "ROI Analysis", "Brand Building"],
    quickTips: ["Quantify all your marketing results", "Know your CAC/LTV metrics", "Study viral growth loops"],
    recommendedInterviews: ["Marketing Strategy Round", "Analytics Interview", "Campaign Planning", "Brand Discussion"],
  },
  "Finance / Accounting": {
    focusAreas: ["Financial Modeling", "Valuation", "Accounting Standards", "Risk Analysis", "Excel"],
    prepTopics: ["DCF Modeling", "LBO Basics", "CFA Prep", "Case Studies"],
    quickTips: ["Build 3-statement financial models", "Learn VLOOKUP and Pivot Tables", "Read Wall Street prep guides"],
    recommendedInterviews: ["Technical Finance Round", "Valuation Case Study", "Accounting Quiz", "Behavioral Interview"],
  },
  "Human Resources": {
    focusAreas: ["Talent Acquisition", "Employee Relations", "L&D", "Compensation & Benefits", "HR Analytics"],
    prepTopics: ["HR Case Studies", "Employment Law", "OKR Frameworks", "Culture Building"],
    quickTips: ["Quantify your HR impact", "Know labor law basics", "Practice empathy-based scenarios"],
    recommendedInterviews: ["Behavioral HR Round", "HR Case Study", "Policy Knowledge Test", "Leadership Discussion"],
  },
  "Sales / Business Development": {
    focusAreas: ["Sales Process", "Negotiation", "CRM Tools", "Account Management", "Cold Outreach"],
    prepTopics: ["MEDDIC Framework", "Demo Techniques", "Pipeline Management", "Enterprise Sales"],
    quickTips: ["Show quantified wins (quota %)", "Prepare a 30-60-90 day plan", "Know the product inside-out"],
    recommendedInterviews: ["Sales Pitch Simulation", "Negotiation Role Play", "Territory Planning", "Behavioral Round"],
  },
  "Consulting": {
    focusAreas: ["Case Interviews", "Problem Structuring", "Data Analysis", "Client Communication", "Slide Decks"],
    prepTopics: ["McKinsey/BCG Case Prep", "Market Sizing", "Profitability Cases", "Behavioral STAR"],
    quickTips: ["Practice 50+ cases", "Master hypothesis-driven thinking", "Work on executive presence"],
    recommendedInterviews: ["Consulting Case Interview", "Market Sizing Exercise", "Fit Interview", "Group Discussion"],
  },
  "Operations": {
    focusAreas: ["Process Improvement", "Supply Chain", "Six Sigma", "Project Management", "Lean"],
    prepTopics: ["Lean Six Sigma", "PMP Certification", "Operational Excellence", "Vendor Management"],
    quickTips: ["Quantify efficiency improvements", "Learn process mapping tools", "Study supply chain fundamentals"],
    recommendedInterviews: ["Operations Case Study", "Process Design Round", "Behavioral Interview", "Analytics Round"],
  },
  "Other": {
    focusAreas: ["Communication", "Problem Solving", "Domain Knowledge", "Adaptability"],
    prepTopics: ["General Interview Prep", "Behavioral Questions", "Case Studies", "Domain Expertise"],
    quickTips: ["Use the STAR method", "Research the company thoroughly", "Prepare thoughtful questions"],
    recommendedInterviews: ["General Interview", "Behavioral Round", "Domain Knowledge Test", "HR Discussion"],
  },
};

function getStudentSyllabus(studentClass, stream) {
  const classData = STUDENT_SYLLABUS[studentClass];
  if (!classData) return null;
  if (classData.focusAreas) return classData;
  if (stream && classData[stream]) return classData[stream];
  return Object.values(classData)[0];
}
function getJobseekerSyllabus(domain) {
  return JOBSEEKER_SYLLABUS[domain] || JOBSEEKER_SYLLABUS["Other"];
}

const EXPERIENCE_LABEL = {
  fresher: "Fresher (0-1yr)",
  junior: "Junior (1-3yr)",
  mid: "Mid-level (3-6yr)",
  senior: "Senior (6-10yr)",
  lead: "Lead / Principal (10+yr)",
};

// ── Main Dashboard ─────────────────────────────────────────────────────────────
function DashboardPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState("recent");

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [interviewsRes, statsRes, profileRes] = await Promise.all([
        fetch(`${API_URL}/interviews?userId=${user.id}&limit=6`),
        fetch(`${API_URL}/interviews/stats/${user.id}`),
        fetch(`${API_URL}/users/profile/${user.id}`),
      ]);
      const interviewsData = await interviewsRes.json();
      const statsData = await statsRes.json();
      const profileData = await profileRes.json();
      if (interviewsData.success) setInterviews(interviewsData.data);
      if (statsData.success) setStats(statsData.data);
      if (profileData.success) setProfile(profileData.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => ({
    draft:       { bg: "#f3f2ff", text: "#5b3ef5", dot: "#a899f7" },
    in_progress: { bg: "#fff7e6", text: "#c47c00", dot: "#f5a623" },
    completed:   { bg: "#e6fff8", text: "#007a5e", dot: "#00d4aa" },
    abandoned:   { bg: "#fff1f3", text: "#c0002a", dot: "#ff4f6d" },
  }[status] || { bg: "#f3f2ff", text: "#5b3ef5", dot: "#a899f7" });

  const getStatusIcon = (status) => {
    const icons = { draft: Clock, in_progress: Play, completed: CheckCircle, abandoned: Clock };
    const Icon = icons[status] || Clock;
    return <Icon style={{ width: 11, height: 11 }} />;
  };

  const filteredInterviews = interviews.filter(i => {
    if (activeTab === "in-progress") return i.status === "in_progress";
    if (activeTab === "completed") return i.status === "completed";
    return true;
  });

  const isStudent = profile?.userType === "student";
  const isJobseeker = profile?.userType === "jobseeker";
  const syllabus = isStudent
    ? getStudentSyllabus(profile?.studentClass, profile?.stream)
    : isJobseeker
    ? getJobseekerSyllabus(profile?.domain)
    : null;

  const avgScore = Math.round(stats?.avgScore || 0);
  const performanceLevel =
    avgScore >= 90 ? { label: "Expert",       emoji: "🏆", accent: "#00d4aa" }
    : avgScore >= 75 ? { label: "Advanced",    emoji: "⚡", accent: "#5b3ef5" }
    : avgScore >= 60 ? { label: "Intermediate",emoji: "🔥", accent: "#f5a623" }
    :                  { label: "Beginner",    emoji: "🌱", accent: "#e04aff" };

  if (loading) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="dash-root" style={{ minHeight: "100vh", background: "var(--surface)" }}>
          <Navbar />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "calc(100vh - 70px)" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 56, height: 56, borderRadius: 18,
                background: "linear-gradient(135deg,#5b3ef5,#e04aff)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 14px", boxShadow: "0 8px 32px rgba(91,62,245,.3)"
              }}>
                <Loader style={{ width: 26, height: 26, color: "#fff", animation: "spin 1s linear infinite" }} />
              </div>
              <p style={{ color: "var(--muted)", fontWeight: 500, fontSize: 15 }}>Loading your workspace…</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="dash-root" style={{ minHeight: "100vh", background: "var(--surface)" }}>
        <Navbar />
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px 64px", display: "flex", flexDirection: "column", gap: 28 }}>

          {/* ── Welcome Banner ── */}
          <WelcomeBanner
            user={user}
            profile={profile}
            stats={stats}
            avgScore={avgScore}
            performanceLevel={performanceLevel}
            onNewInterview={() => setShowCreateModal(true)}
            navigate={navigate}
            EXPERIENCE_LABEL={EXPERIENCE_LABEL}
          />

          {/* ── Metric Cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
            {[
              { icon: BarChart3, label: "Avg Score",     value: `${avgScore}%`, sub: "Your performance",  accent: "#5b3ef5", bg: "#f0eeff" },
              { icon: CheckCircle,label: "Completed",    value: stats?.completed || 0, sub: "Interviews done", accent: "#00d4aa", bg: "#e6fff8" },
              { icon: Clock,      label: "Practice Time",value: `${Math.round((stats?.totalDuration||0)/60)}h`, sub: "Total hours", accent: "#f5a623", bg: "#fff7e6" },
              { icon: Trophy,     label: "Level",        value: performanceLevel.label, sub: `${performanceLevel.emoji} Current rank`, accent: "#e04aff", bg: "#fdf0ff" },
            ].map((m, i) => (
              <MetricCard key={i} {...m} delay={i * 0.07} />
            ))}
          </div>

          {/* ── Personalized Section ── */}
          {syllabus && (
            <PersonalizedSection
              profile={profile}
              syllabus={syllabus}
              isStudent={isStudent}
              onNewInterview={() => setShowCreateModal(true)}
              navigate={navigate}
            />
          )}

          {/* ── Interview Sessions ── */}
          <div style={{ background: "var(--card)", borderRadius: 20, border: "1.5px solid var(--border)", overflow: "hidden", boxShadow: "0 2px 16px rgba(15,14,23,.04)" }}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <h2 className="syne" style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Interview Sessions</h2>
              <div style={{ display: "flex", gap: 4, background: "#f3f2ff", padding: 4, borderRadius: 99 }}>
                {["recent", "in-progress", "completed"].map((tab) => (
                  <button
                    key={tab}
                    className={`tab-pill ${activeTab === tab ? "active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                    style={{ padding: "7px 18px", fontSize: 13, fontWeight: 500, color: activeTab === tab ? "#fff" : "var(--muted)", fontFamily: "Inter, sans-serif" }}
                  >
                    {tab.replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>

            {filteredInterviews.length === 0 ? (
              <EmptyState onNewInterview={() => setShowCreateModal(true)} />
            ) : (
              <div>
                {filteredInterviews.map((interview, idx) => (
                  <InterviewRow
                    key={interview._id}
                    interview={interview}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                    isLast={idx === filteredInterviews.length - 1}
                    onAction={() => navigate(interview.status === "completed" ? `/interview/${interview._id}/results` : `/interview/${interview._id}`)}
                  />
                ))}
              </div>
            )}
          </div>

        </main>
      </div>

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
    </>
  );
}

// ── Welcome Banner ─────────────────────────────────────────────────────────────
function WelcomeBanner({ user, profile, stats, avgScore, performanceLevel, onNewInterview, navigate, EXPERIENCE_LABEL }) {
  const isStudent = profile?.userType === "student";
  const isJobseeker = profile?.userType === "jobseeker";

  return (
    <div className="noise fade-up" style={{
      position: "relative", overflow: "hidden",
      background: "linear-gradient(135deg, #0f0e17 0%, #1a1433 45%, #0d0c1a 100%)",
      borderRadius: 24, padding: "36px 40px",
      boxShadow: "0 20px 60px rgba(91,62,245,.22)",
    }}>
      {/* Glow blobs */}
      <div style={{
        position: "absolute", width: 380, height: 380, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(91,62,245,.35) 0%, transparent 70%)",
        top: -120, right: -80, pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", width: 260, height: 260, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(224,74,255,.2) 0%, transparent 70%)",
        bottom: -80, left: "30%", pointerEvents: "none",
      }} />

      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
        {/* Left */}
        <div style={{ flex: 1, minWidth: 260 }}>
          {/* Badges row */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
            {isStudent && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 99,
                background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)",
                color: "#d6cfff", fontSize: 12, fontWeight: 500, backdropFilter: "blur(8px)",
              }}>
                <GraduationCap style={{ width: 13, height: 13 }} />
                {profile?.studentClass}{profile?.stream ? ` · ${profile.stream}` : ""}
              </span>
            )}
            {isJobseeker && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 99,
                background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)",
                color: "#d6cfff", fontSize: 12, fontWeight: 500,
              }}>
                <Briefcase style={{ width: 13, height: 13 }} />
                {profile?.domain} · {EXPERIENCE_LABEL[profile?.experienceLevel] || profile?.experienceLevel}
              </span>
            )}
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 99,
              background: `rgba(${performanceLevel.accent === "#00d4aa" ? "0,212,170" : performanceLevel.accent === "#5b3ef5" ? "91,62,245" : performanceLevel.accent === "#f5a623" ? "245,166,35" : "224,74,255"},.15)`,
              border: `1px solid ${performanceLevel.accent}40`,
              color: performanceLevel.accent, fontSize: 12, fontWeight: 600,
            }}>
              {performanceLevel.emoji} {performanceLevel.label}
            </span>
          </div>

          <h1 className="syne" style={{ fontSize: 32, fontWeight: 800, color: "#fff", margin: "0 0 8px", lineHeight: 1.15 }}>
            Hey, {user?.firstName || "there"}! 👋
          </h1>
          <p style={{ color: "#9d96c8", fontSize: 15, margin: "0 0 24px", lineHeight: 1.6 }}>
            {isStudent
              ? `You're on track with ${profile?.studentClass} prep. Keep the momentum going.`
              : isJobseeker
              ? `${profile?.jobTitle ? `${profile.jobTitle}${profile.company ? ` @ ${profile.company}` : ""} — ` : ""}Your interviews are looking stronger every day.`
              : "Ready to ace your next interview? Let's get to work."}
          </p>

          {/* Score bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,.1)", borderRadius: 99, overflow: "hidden", maxWidth: 220 }}>
              <div
                className="score-bar-fill"
                style={{
                  "--w": `${avgScore}%`,
                  height: "100%", borderRadius: 99,
                  background: `linear-gradient(90deg, #5b3ef5, #e04aff)`,
                  boxShadow: "0 0 10px #5b3ef580",
                }}
              />
            </div>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 20, fontFamily: "Syne, sans-serif" }}>{avgScore}%</span>
            <span style={{ color: "#6b6880", fontSize: 13 }}>· {stats?.completed || 0} sessions</span>
          </div>
        </div>

        {/* Right: Action buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => navigate("/interviews")}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "11px 22px", borderRadius: 14,
              background: "rgba(255,255,255,.07)", border: "1.5px solid rgba(255,255,255,.15)",
              color: "#d6cfff", fontSize: 14, fontWeight: 600, cursor: "pointer",
              transition: "all .2s", fontFamily: "Inter, sans-serif",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.13)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.07)"}
          >
            <Briefcase style={{ width: 15, height: 15 }} /> All Sessions
          </button>
          <button
            onClick={onNewInterview}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "11px 22px", borderRadius: 14,
              background: "linear-gradient(135deg,#5b3ef5,#9b6ff7)",
              border: "none", color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: "pointer", boxShadow: "0 6px 24px rgba(91,62,245,.45)",
              transition: "all .2s", fontFamily: "Inter, sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(91,62,245,.55)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 6px 24px rgba(91,62,245,.45)"; }}
          >
            <Plus style={{ width: 15, height: 15 }} /> New Interview
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Metric Card ────────────────────────────────────────────────────────────────
function MetricCard({ icon: Icon, label, value, sub, accent, bg, delay }) {
  return (
    <div
      className="card-lift fade-up"
      style={{
        animationDelay: `${delay}s`,
        background: "var(--card)", borderRadius: 18,
        border: "1.5px solid var(--border)", padding: "22px 20px",
        boxShadow: "0 2px 12px rgba(15,14,23,.04)",
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
        <Icon style={{ width: 18, height: 18, color: accent }} />
      </div>
      <p className="syne" style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", margin: "0 0 3px", letterSpacing: "-0.5px" }}>{value}</p>
      <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, fontWeight: 500 }}>{sub}</p>
    </div>
  );
}

// ── Personalized Section ───────────────────────────────────────────────────────
function PersonalizedSection({ profile, syllabus, isStudent, onNewInterview, navigate }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>

      {/* Focus Areas */}
      <div className="card-lift" style={{ background: "var(--card)", borderRadius: 20, border: "1.5px solid var(--border)", padding: "22px 22px", boxShadow: "0 2px 12px rgba(15,14,23,.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "#f0eeff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Target style={{ width: 16, height: 16, color: "#5b3ef5" }} />
          </div>
          <h3 className="syne" style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", margin: 0 }}>
            {isStudent ? `${profile?.studentClass} Focus Areas` : `${profile?.domain} Focus`}
          </h3>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(syllabus.focusAreas || []).map((area, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#5b3ef5", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "var(--ink2)", fontWeight: 400 }}>{area}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Prep Topics */}
      <div className="card-lift" style={{ background: "var(--card)", borderRadius: 20, border: "1.5px solid var(--border)", padding: "22px 22px", boxShadow: "0 2px 12px rgba(15,14,23,.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "#fdf0ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BookOpen style={{ width: 16, height: 16, color: "#e04aff" }} />
          </div>
          <h3 className="syne" style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Prep Topics</h3>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(syllabus.prepTopics || []).map((topic, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "var(--ink2)" }}>{topic}</span>
              <button
                onClick={() => navigate("/preparation")}
                style={{
                  display: "flex", alignItems: "center", gap: 2,
                  background: "none", border: "none", cursor: "pointer",
                  color: "#5b3ef5", fontSize: 12, fontWeight: 600, padding: "2px 6px",
                  borderRadius: 6, transition: "background .15s", fontFamily: "Inter, sans-serif",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f0eeff"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                Go <ChevronRight style={{ width: 12, height: 12 }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Start + Tips */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Quick start card */}
        <div style={{
          borderRadius: 20, padding: "20px 20px",
          background: "linear-gradient(135deg,#1a1433 0%,#0f0e17 100%)",
          border: "1.5px solid rgba(91,62,245,.25)",
          boxShadow: "0 4px 20px rgba(91,62,245,.15)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Zap style={{ width: 16, height: 16, color: "#a899f7" }} />
            <span className="syne" style={{ fontWeight: 700, fontSize: 13, color: "#d6cfff" }}>Quick Start</span>
          </div>
          <p style={{ fontSize: 11, color: "#6b6880", marginBottom: 12, lineHeight: 1.5 }}>
            {isStudent ? `Recommended for ${profile?.studentClass}` : `Curated for ${profile?.domain}`}
          </p>
          {(syllabus.recommendedInterviews || []).slice(0, 2).map((rec, i) => (
            <button
              key={i}
              onClick={onNewInterview}
              style={{
                width: "100%", textAlign: "left", marginBottom: 8, cursor: "pointer",
                background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.09)",
                padding: "9px 12px", borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                transition: "background .2s", fontFamily: "Inter, sans-serif",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(91,62,245,.2)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.06)"}
            >
              <span style={{ fontSize: 12, fontWeight: 500, color: "#d6cfff" }}>{rec}</span>
              <ChevronRight style={{ width: 13, height: 13, color: "#6b6880" }} />
            </button>
          ))}
        </div>

        {/* Tips card */}
        <div className="card-lift" style={{ background: "var(--card)", borderRadius: 20, border: "1.5px solid var(--border)", padding: "18px 20px", boxShadow: "0 2px 12px rgba(15,14,23,.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Star style={{ width: 15, height: 15, color: "#f5a623" }} />
            <span className="syne" style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>Pro Tips</span>
          </div>
          {(syllabus.quickTips || []).slice(0, 3).map((tip, i) => (
            <p key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "var(--muted)", margin: "0 0 8px", lineHeight: 1.6 }}>
              <span style={{ color: "#f5a623", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
              {tip}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Interview Row ──────────────────────────────────────────────────────────────
function InterviewRow({ interview, onAction, getStatusColor, getStatusIcon, isLast }) {
  const s = getStatusColor(interview.status);
  return (
    <div
      className="irow"
      style={{
        padding: "16px 24px",
        borderBottom: isLast ? "none" : "1.5px solid var(--border)",
        display: "flex", alignItems: "center", gap: 16,
        transition: "background .15s", cursor: "default",
      }}
    >
      {/* Color bar */}
      <div style={{ width: 4, height: 36, borderRadius: 99, background: s.dot, flexShrink: 0 }} />

      {/* ── Content — wraps on mobile ── */}
      <div className="irow-content" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5, flexWrap: "wrap" }}>
          <p
            className="irow-title"
            style={{
              fontWeight: 600, color: "var(--ink)", fontSize: 14, margin: 0,
              overflow: "hidden", textOverflow: "ellipsis",
              whiteSpace: "nowrap", maxWidth: "100%",
              flex: "1 1 120px", minWidth: 0,
              transition: "color .15s",
            }}
          >
            {interview.title}
          </p>
          <span
            className="irow-badge"
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 600,
              background: s.bg, color: s.text, flexShrink: 0,
            }}
          >
            {getStatusIcon(interview.status)}
            {interview.status.replace("_", " ")}
          </span>
        </div>
        <div className="irow-meta" style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--muted)" }}>
            <Calendar style={{ width: 11, height: 11 }} />
            {new Date(interview.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          {interview.overallScore > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: "#007a5e" }}>
              Score: {interview.overallScore}%
            </span>
          )}
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{interview.questions?.length || 0} questions</span>
        </div>
      </div>

      {/* ── Action button — full width on mobile ── */}
      <button
        className="irow-action"
        onClick={onAction}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "9px 18px", borderRadius: 12, border: "none", cursor: "pointer",
          background: interview.status === "completed" ? "#f0eeff" : "linear-gradient(135deg,#5b3ef5,#9b6ff7)",
          color: interview.status === "completed" ? "#5b3ef5" : "#fff",
          fontSize: 13, fontWeight: 700, flexShrink: 0,
          boxShadow: interview.status === "completed" ? "none" : "0 4px 14px rgba(91,62,245,.35)",
          transition: "all .2s", fontFamily: "Inter, sans-serif",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
      >
        {interview.status === "completed"
          ? <><BarChart3 style={{ width: 13, height: 13 }} /> Results</>
          : <><Play style={{ width: 13, height: 13 }} /> Continue</>}
      </button>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────
function EmptyState({ onNewInterview }) {
  return (
    <div style={{ padding: "56px 24px", textAlign: "center" }}>
      <div style={{
        width: 64, height: 64, borderRadius: 20, margin: "0 auto 18px",
        background: "linear-gradient(135deg,#f0eeff,#fdf0ff)",
        border: "2px dashed #c4b8f7",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Target style={{ width: 28, height: 28, color: "#a899f7" }} />
      </div>
      <p className="syne" style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", margin: "0 0 6px" }}>No interviews yet</p>
      <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 24px" }}>Start your first practice session to track progress</p>
      <button
        onClick={onNewInterview}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "11px 26px", borderRadius: 14, border: "none", cursor: "pointer",
          background: "linear-gradient(135deg,#5b3ef5,#9b6ff7)",
          color: "#fff", fontSize: 14, fontWeight: 700,
          boxShadow: "0 6px 22px rgba(91,62,245,.35)",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <Plus style={{ width: 15, height: 15 }} /> Start Interview
      </button>
    </div>
  );
}

export default DashboardPage;