// frontend/pages/ProfilePage.jsx
import { useUser } from "@clerk/clerk-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import {
  User, Mail, Calendar, TrendingUp, Target, Edit3, Save, X,
  BarChart3, Clock, BookOpen, Settings, Bell, Shield, HelpCircle,
  Loader, Briefcase, GraduationCap, CheckCircle, ChevronDown,
  Zap, Award, Star, Plus, Trash2, Info, ChevronRight,
  Sparkles, Brain, Code, Atom, FlaskConical, Calculator,
  Building2, MapPin, Layers, Globe, Flame, Trophy,
  GitBranch, Compass, BarChart2, Activity, Hash, ArrowRight
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT CATEGORIES — every stream a student in India might be in
// ═══════════════════════════════════════════════════════════════════════════════
export const STUDENT_CATEGORIES = [
  {
    group: "🔬 Science & Engineering",
    color: "blue",
    streams: [
      { value: "PCM_JEE",     label: "PCM — Physics, Chem, Maths (JEE)",          exam: "JEE Main & Advanced",  icon: "⚗️" },
      { value: "PCB_NEET",    label: "PCB — Physics, Chem, Biology (NEET)",        exam: "NEET UG / PG",         icon: "🧬" },
      { value: "PCMB",        label: "PCMB — All four subjects",                   exam: "JEE + NEET",           icon: "🔭" },
      { value: "CS_Engg",     label: "Computer Science Engineering (B.Tech)",       exam: "Campus Placements",    icon: "💻" },
      { value: "ECE_Engg",    label: "Electronics & Communication Engg",           exam: "GATE / Placements",    icon: "📡" },
      { value: "Mech_Engg",   label: "Mechanical Engineering",                     exam: "GATE / Placements",    icon: "⚙️" },
      { value: "Civil_Engg",  label: "Civil Engineering",                          exam: "GATE / Placements",    icon: "🏗️" },
      { value: "Chem_Engg",   label: "Chemical Engineering",                       exam: "GATE / Placements",    icon: "🧪" },
      { value: "EEE_Engg",    label: "Electrical Engineering (EEE)",               exam: "GATE / Placements",    icon: "⚡" },
      { value: "Aero_Engg",   label: "Aerospace / Aeronautical Engineering",       exam: "GATE / ISRO / DRDO",   icon: "✈️" },
      { value: "BioTech",     label: "Biotechnology / Biomedical",                 exam: "GATE / Research",      icon: "🔬" },
      { value: "BSc_Physics", label: "B.Sc Physics / Applied Physics",             exam: "IIT JAM / Research",   icon: "⚛️" },
      { value: "BSc_Chem",    label: "B.Sc Chemistry",                             exam: "IIT JAM / CSIR",       icon: "🧫" },
      { value: "BSc_Math",    label: "B.Sc Mathematics / Statistics",              exam: "IIT JAM / Data roles", icon: "📐" },
      { value: "BSc_CS",      label: "B.Sc Computer Science",                      exam: "Placements / M.Sc",    icon: "🖥️" },
    ]
  },
  {
    group: "💼 Commerce & Business",
    color: "emerald",
    streams: [
      { value: "Commerce_12",   label: "Class 12 Commerce (Accountancy, Eco, BSt)", exam: "CA Foundation / B.Com",  icon: "📊" },
      { value: "BCom",          label: "B.Com — Bachelor of Commerce",              exam: "CA / MBA / Placements",  icon: "📈" },
      { value: "BBA",           label: "BBA — Bachelor of Business Administration", exam: "MBA Entrance / Jobs",    icon: "🏢" },
      { value: "MBA_Finance",   label: "MBA — Finance / Banking",                   exam: "Placements / CFA",       icon: "💰" },
      { value: "MBA_Marketing", label: "MBA — Marketing",                           exam: "Placements",             icon: "📣" },
      { value: "MBA_HR",        label: "MBA — Human Resources",                     exam: "Placements",             icon: "👥" },
      { value: "MBA_Ops",       label: "MBA — Operations / Supply Chain",           exam: "Placements",             icon: "🔄" },
      { value: "MBA_General",   label: "MBA — General Management / Strategy",       exam: "Placements / Consulting",icon: "🎯" },
      { value: "CA_Foundation", label: "CA Foundation / Intermediate / Final",      exam: "CA Exams",               icon: "📋" },
      { value: "CFA_Level",     label: "CFA Level I / II / III",                   exam: "CFA Exams",              icon: "💹" },
    ]
  },
  {
    group: "🎨 Arts, Design & Humanities",
    color: "pink",
    streams: [
      { value: "Arts_12",      label: "Class 12 Arts / Humanities",                exam: "Entrance Exams / BA",    icon: "🎭" },
      { value: "BA_GenLit",    label: "BA — Literature / English / Languages",     exam: "UPSC / Teaching / Jobs", icon: "📚" },
      { value: "BA_Eco",       label: "BA / B.Sc Economics",                       exam: "MBA / UPSC / Research",  icon: "📉" },
      { value: "BA_Psych",     label: "BA / B.Sc Psychology",                      exam: "PG Entrance / HR roles", icon: "🧠" },
      { value: "BA_Socio",     label: "BA Sociology / Political Science / History", exam: "UPSC / Journalism",     icon: "🌍" },
      { value: "BDes_UXUI",    label: "B.Des / Diploma — UI/UX Design",            exam: "NID / NIFT / Portfolio",  icon: "🎨" },
      { value: "BDes_Graphic", label: "Graphic Design / Visual Communication",     exam: "Portfolio",              icon: "🖌️" },
      { value: "BDes_Fashion", label: "Fashion Design (NIFT / NID)",               exam: "NIFT / NID Entrance",    icon: "👗" },
      { value: "BArch",        label: "B.Arch — Architecture",                     exam: "NATA / JEE Paper 2",     icon: "🏛️" },
      { value: "BJourn",       label: "BA Journalism / Mass Communication",        exam: "IIMC / Jobs",            icon: "📰" },
      { value: "BFA",          label: "BFA — Fine Arts / Performing Arts",         exam: "Entrance / Portfolio",   icon: "🎬" },
    ]
  },
  {
    group: "💻 Technology & IT",
    color: "violet",
    streams: [
      { value: "BCA",          label: "BCA — Bachelor of Computer Applications",   exam: "MCA / Placements",       icon: "🖥️" },
      { value: "MCA",          label: "MCA — Master of Computer Applications",     exam: "Placements / GATE",      icon: "🔧" },
      { value: "Diploma_CS",   label: "Diploma in Computer Science / IT",          exam: "Placements / B.Tech lateral", icon: "📱" },
      { value: "DataSci_PG",   label: "M.Sc / PG in Data Science / AI / ML",      exam: "Placements / Research",  icon: "🤖" },
      { value: "Cybersec_PG",  label: "PG in Cybersecurity / Information Security",exam: "Placements / CEH/CISSP", icon: "🔐" },
      { value: "CloudComp",    label: "B.Tech / PG in Cloud Computing / DevOps",   exam: "AWS/Azure Certs / Jobs", icon: "☁️" },
    ]
  },
  {
    group: "⚕️ Medical & Health Sciences",
    color: "teal",
    streams: [
      { value: "MBBS",        label: "MBBS — Bachelor of Medicine & Surgery",      exam: "PG (NEET-PG / USMLE)",   icon: "🏥" },
      { value: "BDS",         label: "BDS — Bachelor of Dental Surgery",           exam: "MDS / NEET-PG",          icon: "🦷" },
      { value: "BAMS_BHMS",   label: "BAMS / BHMS / BUMS (Ayurveda etc.)",        exam: "PG Entrance",            icon: "🌿" },
      { value: "BPharm",      label: "B.Pharm / M.Pharm — Pharmacy",              exam: "GPAT / Jobs",            icon: "💊" },
      { value: "BPT_MPT",     label: "BPT / MPT — Physiotherapy",                 exam: "Jobs / Research",        icon: "🩺" },
      { value: "BScNursing",  label: "B.Sc Nursing / GNM",                        exam: "Govt Jobs / Abroad",     icon: "🩻" },
      { value: "MLT",         label: "B.Sc Medical Lab Technology / Radiology",   exam: "Jobs / Govt",            icon: "🔬" },
      { value: "PublicHealth",label: "MPH — Master of Public Health",             exam: "Research / NGO / WHO",   icon: "🌡️" },
    ]
  },
  {
    group: "⚖️ Law & Governance",
    color: "amber",
    streams: [
      { value: "LLB_3yr",     label: "LLB (3-year) — Law",                        exam: "Bar Council / UPSC",     icon: "⚖️" },
      { value: "BA_LLB",      label: "BA LLB / B.Com LLB (5-year Integrated)",    exam: "Judiciary / Corporate",  icon: "🏛️" },
      { value: "UPSC_Civil",  label: "UPSC Civil Services (IAS / IPS / IFS)",     exam: "UPSC Prelims / Mains",   icon: "🇮🇳" },
      { value: "SSC_Exams",   label: "SSC CGL / CHSL / MTS — Govt Jobs",         exam: "SSC Exams",              icon: "📝" },
      { value: "Banking_PO",  label: "Banking — IBPS PO / SBI PO / Clerk",       exam: "IBPS / SBI Exams",       icon: "🏦" },
      { value: "Defence",     label: "NDA / CDS / AFCAT — Defence Forces",        exam: "NDA / CDS / AFCAT",      icon: "🎖️" },
      { value: "RailwayExam", label: "Railway Recruitment (RRB NTPC / Group D)", exam: "RRB Exams",              icon: "🚂" },
      { value: "StateGovt",   label: "State Government Exams (PSC / Police)",    exam: "State PSC / Police",     icon: "🏢" },
    ]
  },
  {
    group: "🎓 Research & Academia",
    color: "indigo",
    streams: [
      { value: "MSc_Research",label: "M.Sc Research — Science / Technology",      exam: "PhD Entrance / CSIR",    icon: "🔭" },
      { value: "PhD_STEM",    label: "PhD — Science, Technology, Engineering",    exam: "PhD interviews / Pubs",  icon: "📜" },
      { value: "PhD_Hum",     label: "PhD — Humanities / Social Sciences",        exam: "NET / SET / Academia",   icon: "📖" },
      { value: "NET_JRF",     label: "UGC NET / JRF — Assistant Professor",       exam: "UGC NET",                icon: "🎓" },
      { value: "GATE_PG",     label: "GATE — PG Admissions (IIT / NIT / IISc)",   exam: "GATE Exam",              icon: "🏆" },
      { value: "CAT_MBA",     label: "CAT / XAT / SNAP / MAT — MBA Entrance",    exam: "IIM / Top B-School",     icon: "📊" },
    ]
  },
];

export const ALL_STUDENT_STREAMS = STUDENT_CATEGORIES.flatMap(g =>
  g.streams.map(s => ({ ...s, group: g.group, groupColor: g.color }))
);

// ═══════════════════════════════════════════════════════════════════════════════
// JOBSEEKER CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════
export const JOBSEEKER_CATEGORIES = [
  {
    group: "💻 Technology",
    color: "blue",
    domains: [
      { value: "Software Development",    label: "Software Development / Engineering",    icon: "💻", desc: "Frontend, Backend, Full Stack, Mobile" },
      { value: "Data Science / AI / ML",  label: "Data Science / AI / Machine Learning",  icon: "🤖", desc: "Data Analyst, ML Engineer, Research Scientist" },
      { value: "DevOps / Cloud",          label: "DevOps / Cloud / Infrastructure",        icon: "☁️", desc: "SRE, Cloud Architect, Platform Eng" },
      { value: "Cybersecurity",           label: "Cybersecurity / Information Security",   icon: "🔐", desc: "Pentester, SOC, AppSec, Cloud Security" },
      { value: "QA / Testing",            label: "QA / Software Testing",                  icon: "🧪", desc: "Manual Testing, Automation, SDET" },
      { value: "Embedded / IoT",          label: "Embedded Systems / IoT / Hardware",      icon: "🔧", desc: "Firmware, VLSI, Circuit Design, IoT" },
      { value: "Blockchain / Web3",       label: "Blockchain / Web3 / Crypto",             icon: "⛓️", desc: "Smart Contracts, DeFi, Solidity" },
      { value: "Game Development",        label: "Game Development / XR / Metaverse",      icon: "🎮", desc: "Unity, Unreal, AR/VR, Game Design" },
    ]
  },
  {
    group: "📊 Business & Strategy",
    color: "violet",
    domains: [
      { value: "Product Management",      label: "Product Management",                     icon: "🎯", desc: "APM, PM, Growth PM, Technical PM" },
      { value: "Consulting",              label: "Management Consulting / Strategy",        icon: "🏆", desc: "MBB, Big 4, In-house Strategy" },
      { value: "Business Analyst",        label: "Business / Systems Analysis",            icon: "📈", desc: "Business Analyst, Systems Analyst" },
      { value: "Strategy & Ops",          label: "Strategy & Operations",                  icon: "⚙️", desc: "Strategy, Business Ops, Chief of Staff" },
      { value: "Entrepreneurship",        label: "Entrepreneurship / Startups",            icon: "🚀", desc: "Founder, Co-founder, Intrapreneur" },
    ]
  },
  {
    group: "💰 Finance & Accounting",
    color: "emerald",
    domains: [
      { value: "Finance / Accounting",    label: "Finance / Accounting / Audit",           icon: "💹", desc: "FP&A, IB Analyst, CA, Controller" },
      { value: "Investment Banking",      label: "Investment Banking / Capital Markets",    icon: "🏦", desc: "M&A, ECM, DCM, Structuring" },
      { value: "Private Equity / VC",     label: "Private Equity / Venture Capital",        icon: "💰", desc: "PE Associate, VC Analyst" },
      { value: "Risk / Compliance",       label: "Risk Management / Compliance",            icon: "⚖️", desc: "Credit Risk, Market Risk, Compliance" },
      { value: "Tax / Audit",             label: "Taxation / Audit / Assurance",            icon: "📋", desc: "Big 4, CA, Tax Manager, Internal Audit" },
      { value: "Fintech",                 label: "Fintech / Payments / Insurtech",          icon: "📲", desc: "Fintech PM/Analyst, Payments Ops" },
    ]
  },
  {
    group: "🎨 Creative & Design",
    color: "pink",
    domains: [
      { value: "Design (UI/UX)",          label: "UI/UX / Product Design",                 icon: "🎨", desc: "UI Designer, UX Researcher, Product Designer" },
      { value: "Graphic Design",          label: "Graphic Design / Visual Design",          icon: "🖌️", desc: "Brand Designer, Motion Designer" },
      { value: "Content Creation",        label: "Content Creation / Writing",              icon: "✍️", desc: "Content Writer, Copywriter, Scriptwriter" },
      { value: "Video / Film",            label: "Video Production / Film / Media",         icon: "🎬", desc: "Video Editor, Cinematographer, Producer" },
      { value: "Architecture / Interior", label: "Architecture / Interior Design",          icon: "🏛️", desc: "Architect, Interior Designer" },
    ]
  },
  {
    group: "📣 Marketing & Sales",
    color: "orange",
    domains: [
      { value: "Marketing / Growth",      label: "Marketing / Digital Marketing / Growth",  icon: "📣", desc: "Performance, SEO, Brand, Growth Manager" },
      { value: "Sales",                   label: "Sales / Business Development",            icon: "🤝", desc: "SDR, AE, Enterprise Sales, BD Manager" },
      { value: "E-commerce / D2C",        label: "E-commerce / D2C / Retail Tech",          icon: "🛒", desc: "Category Mgmt, Seller Ops, Growth" },
      { value: "PR / Communications",     label: "PR / Corporate Communications",           icon: "📰", desc: "PR Manager, Corp Comms, Crisis Comms" },
    ]
  },
  {
    group: "👥 People & Operations",
    color: "cyan",
    domains: [
      { value: "Human Resources",         label: "Human Resources / Talent",               icon: "👥", desc: "HRBP, TA, L&D, Comp & Benefits" },
      { value: "Operations",              label: "Operations / Supply Chain / Logistics",   icon: "🔄", desc: "Supply Chain, Project Mgr, Process Improvement" },
      { value: "Customer Success",        label: "Customer Success / Account Management",   icon: "🌟", desc: "CSM, KAM, Support Ops, CX" },
      { value: "Project Management",      label: "Project / Program Management",            icon: "📌", desc: "PMP, Scrum Master, Program Director" },
    ]
  },
  {
    group: "🏥 Healthcare & Sciences",
    color: "teal",
    domains: [
      { value: "Healthcare / Clinical",   label: "Healthcare / Clinical / Medical",         icon: "🏥", desc: "Doctor, Clinical Research, Health Tech" },
      { value: "Pharma / Biotech",        label: "Pharma / Biotech / Life Sciences",        icon: "💊", desc: "Medical Affairs, Clinical Trials, Regulatory" },
      { value: "Health Tech",             label: "Health Tech / MedTech Startups",          icon: "📱", desc: "Health PM, Clinical Informatics" },
    ]
  },
  {
    group: "⚖️ Law & Governance",
    color: "amber",
    domains: [
      { value: "Legal",                   label: "Legal / Law / Compliance",                icon: "⚖️", desc: "Corporate Lawyer, Litigation, In-house" },
      { value: "Government / Policy",     label: "Government / Public Policy / NGO",        icon: "🏛️", desc: "Policy Analyst, IAS, NGO Program Manager" },
    ]
  },
  {
    group: "🎓 Education & Research",
    color: "indigo",
    domains: [
      { value: "Education / EdTech",      label: "Education / Teaching / EdTech",           icon: "🎓", desc: "Teacher, Instructional Designer, EdTech PM" },
      { value: "Research / Academia",     label: "Research / Academia / Think Tank",         icon: "🔭", desc: "Research Analyst, Post-doc, Policy Research" },
    ]
  },
];

export const ALL_JOBSEEKER_DOMAINS = JOBSEEKER_CATEGORIES.flatMap(g =>
  g.domains.map(d => ({ ...d, group: g.group, groupColor: g.color }))
);

const EXPERIENCE_LEVELS = [
  { value: "fresher",      label: "Fresher",        sub: "No experience yet",        icon: "🌱" },
  { value: "junior",       label: "Junior",         sub: "0–2 years",                icon: "⚡" },
  { value: "intermediate", label: "Mid-level",      sub: "2–5 years",                icon: "🔥" },
  { value: "senior",       label: "Senior",         sub: "5–10 years",               icon: "💎" },
  { value: "lead",         label: "Lead / Principal", sub: "10+ years",              icon: "👑" },
];

const STUDENT_GOALS = [
  "Crack JEE / NEET / Board Exams", "Get into IIT / NIT / IISc",
  "Crack UPSC / SSC / Banking", "Get a top college placement",
  "Study abroad (MS / MBA)", "Start my own business",
  "Switch to tech / coding", "Get a government job",
  "Pursue higher education / PhD", "Crack GATE / CAT / GRE / GMAT",
  "Build a strong portfolio / projects", "Get internships at top companies",
];

const JOBSEEKER_GOALS = [
  "Land my first job", "Switch careers / domains",
  "Get into a FAANG / top startup", "Get promoted to senior level",
  "Move abroad / international job", "Start my own company",
  "Get into consulting (MBB / Big 4)", "Get into IIM / top MBA",
  "Increase my salary by 50%+", "Build a strong LinkedIn presence",
  "Master a new skill / tool", "Crack product management interviews",
];

const SKILL_SUGGESTIONS = {
  "Software Development":   ["React","Node.js","Python","Java","System Design","SQL","AWS","TypeScript","Docker","Git"],
  "Data Science / AI / ML": ["Python","SQL","Machine Learning","Deep Learning","PyTorch","Statistics","Tableau","dbt","Spark"],
  "DevOps / Cloud":         ["AWS","Kubernetes","Docker","Terraform","Linux","CI/CD","Python","Monitoring","Jenkins"],
  "Cybersecurity":          ["Penetration Testing","SIEM","Network Security","Python","OWASP","Kali Linux","Cloud Security"],
  "Product Management":     ["Product Strategy","Roadmapping","SQL","User Research","A/B Testing","Figma","Stakeholder Mgmt"],
  "Finance / Accounting":   ["Financial Modeling","Excel","DCF","Accounting","SQL","Power BI","Valuation"],
  "Marketing / Growth":     ["Google Ads","SEO","Meta Ads","SQL","Email Marketing","Analytics","A/B Testing","HubSpot"],
  "Design (UI/UX)":         ["Figma","User Research","Prototyping","Design Systems","Usability Testing","Accessibility"],
  "Consulting":             ["Case Interviews","PowerPoint","Excel","Problem Solving","Stakeholder Mgmt","Industry Research"],
  "Human Resources":        ["Talent Acquisition","HRIS","Performance Mgmt","L&D","Employee Relations","HR Analytics"],
  "Sales":                  ["Salesforce","Cold Calling","Negotiation","CRM","SPIN Selling","Account Mgmt","Pipeline Mgmt"],
  "Operations":             ["Supply Chain","Project Mgmt","Six Sigma","ERP","Excel","Demand Forecasting","Logistics"],
};

function getSkillSuggestions(domain) {
  return SKILL_SUGGESTIONS[domain] || ["Communication","Excel","Problem Solving","Teamwork","Time Management"];
}

function blankProfile(clerkUser) {
  return {
    firstName: clerkUser?.firstName || "", lastName: clerkUser?.lastName || "",
    email: clerkUser?.primaryEmailAddress?.emailAddress || "",
    bio: "", userType: "jobseeker",
    studentCategory: "", studentClass: "", college: "",
    jobTitle: "", company: "", domain: "", targetRoles: [],
    experienceLevel: "junior", skills: [], goals: [], onboarded: false,
  };
}

function defaultStats() {
  return {
    totalInterviews: 0, completedInterviews: 0, averageScore: 0,
    totalPracticeTime: 0, totalQuestionsAnswered: 0, assessmentsTaken: 0,
    skills: [
      { name: "Technical", score: 0 }, { name: "Communication", score: 0 },
      { name: "Problem Solving", score: 0 }, { name: "Confidence", score: 0 }
    ],
    recentActivity: []
  };
}

function getStreamInfo(value) {
  return ALL_STUDENT_STREAMS.find(s => s.value === value) || null;
}

function getDomainInfo(value) {
  return ALL_JOBSEEKER_DOMAINS.find(d => d.value === value) || null;
}

const EXP_STYLES = {
  fresher:      { pill: "bg-emerald-100 text-emerald-700 border-emerald-200",  dot: "bg-emerald-400" },
  junior:       { pill: "bg-sky-100 text-sky-700 border-sky-200",              dot: "bg-sky-400" },
  intermediate: { pill: "bg-violet-100 text-violet-700 border-violet-200",    dot: "bg-violet-400" },
  senior:       { pill: "bg-orange-100 text-orange-700 border-orange-200",    dot: "bg-orange-400" },
  lead:         { pill: "bg-rose-100 text-rose-700 border-rose-200",          dot: "bg-rose-400" },
};

const GROUP_STYLES = {
  blue:   { card: "border-blue-100 bg-blue-50/60",   badge: "bg-blue-100 text-blue-700",   ring: "ring-blue-400 border-blue-400 bg-blue-50"   },
  emerald:{ card: "border-emerald-100 bg-emerald-50/60", badge: "bg-emerald-100 text-emerald-700", ring: "ring-emerald-400 border-emerald-400 bg-emerald-50" },
  pink:   { card: "border-pink-100 bg-pink-50/60",   badge: "bg-pink-100 text-pink-700",   ring: "ring-pink-400 border-pink-400 bg-pink-50"   },
  violet: { card: "border-violet-100 bg-violet-50/60", badge: "bg-violet-100 text-violet-700", ring: "ring-violet-400 border-violet-400 bg-violet-50" },
  teal:   { card: "border-teal-100 bg-teal-50/60",   badge: "bg-teal-100 text-teal-700",   ring: "ring-teal-400 border-teal-400 bg-teal-50"   },
  amber:  { card: "border-amber-100 bg-amber-50/60", badge: "bg-amber-100 text-amber-700", ring: "ring-amber-400 border-amber-400 bg-amber-50" },
  indigo: { card: "border-indigo-100 bg-indigo-50/60", badge: "bg-indigo-100 text-indigo-700", ring: "ring-indigo-400 border-indigo-400 bg-indigo-50" },
  orange: { card: "border-orange-100 bg-orange-50/60", badge: "bg-orange-100 text-orange-700", ring: "ring-orange-400 border-orange-400 bg-orange-50" },
  cyan:   { card: "border-cyan-100 bg-cyan-50/60",   badge: "bg-cyan-100 text-cyan-700",   ring: "ring-cyan-400 border-cyan-400 bg-cyan-50"   },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function ProfilePage() {
  const { user: clerkUser } = useUser();
  const navigate = useNavigate();
  const [activeTab,   setActiveTab]   = useState("overview");
  const [isEditing,   setIsEditing]   = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [stats,       setStats]       = useState(null);
  const [skillInput,  setSkillInput]  = useState("");
  const [roleInput,   setRoleInput]   = useState("");

  useEffect(() => { if (clerkUser) { loadProfile(); loadStats(); } }, [clerkUser]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/users/profile/${clerkUser.id}`);
      const data = await res.json();
      if (data.success) {
        const u = data.data;
        setProfileData({
          firstName:       u.firstName       || clerkUser.firstName || "",
          lastName:        u.lastName        || clerkUser.lastName  || "",
          email:           u.email           || clerkUser.primaryEmailAddress?.emailAddress || "",
          bio:             u.bio             || "",
          userType:        u.userType        || "jobseeker",
          studentCategory: u.studentCategory || u.stream || "",
          studentClass:    u.studentClass    || "",
          college:         u.college         || "",
          jobTitle:        u.jobTitle        || "",
          company:         u.company         || "",
          domain:          u.domain          || "",
          targetRoles:     u.targetRoles     || [],
          experienceLevel: u.experienceLevel || "junior",
          skills:          u.skills          || [],
          goals:           u.goals           || [],
          onboarded:       u.onboarded       || false,
        });
      } else {
        setProfileData(blankProfile(clerkUser));
      }
    } catch {
      setProfileData(blankProfile(clerkUser));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res  = await fetch(`${API_URL}/users/stats/${clerkUser.id}`);
      const data = await res.json();
      setStats(data.success ? data.data : defaultStats());
    } catch {
      setStats(defaultStats());
    }
  };

  const saveProfile = async () => {
    if (!clerkUser) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/users/profile`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId:         clerkUser.id,
          email:           profileData.email,
          firstName:       profileData.firstName,
          lastName:        profileData.lastName,
          profileImage:    clerkUser.profileImageUrl || "",
          onboarded:       true,
          userType:        profileData.userType,
          studentCategory: profileData.studentCategory,
          stream:          profileData.studentCategory,
          studentClass:    profileData.studentClass,
          college:         profileData.college,
          jobTitle:        profileData.jobTitle,
          company:         profileData.company,
          domain:          profileData.domain,
          targetRoles:     profileData.targetRoles,
          experienceLevel: profileData.experienceLevel,
          skills:          profileData.skills,
          goals:           profileData.goals,
          bio:             profileData.bio,
        })
      });
      const data = await res.json();
      if (data.success) {
        try { await fetch(`${API_URL}/syllabus/refresh`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: clerkUser.id }) }); } catch {}
        toast.success("Profile saved! Your prep hub will refresh.");
        setIsEditing(false);
        loadProfile();
      } else {
        toast.error(data.message || "Save failed");
      }
    } catch {
      toast.error("Network error — could not save");
    } finally {
      setSaving(false);
    }
  };

  const update = (key, val) => setProfileData(p => ({ ...p, [key]: val }));
  const addSkill = (skill) => { const s = skill.trim(); if (!s || profileData.skills.includes(s)) return; update("skills", [...profileData.skills, s]); setSkillInput(""); };
  const removeSkill = (s) => update("skills", profileData.skills.filter(x => x !== s));
  const toggleGoal = (g) => { const list = profileData.goals; update("goals", list.includes(g) ? list.filter(x => x !== g) : [...list, g]); };
  const addRole = () => { const r = roleInput.trim(); if (!r || profileData.targetRoles.includes(r)) return; update("targetRoles", [...profileData.targetRoles, r]); setRoleInput(""); };
  const removeRole = (r) => update("targetRoles", profileData.targetRoles.filter(x => x !== r));

  const streamInfo = profileData ? getStreamInfo(profileData.studentCategory) : null;
  const domainInfo = profileData ? getDomainInfo(profileData.domain) : null;
  const isStudent  = profileData?.userType === "student";
  const expStyle   = EXP_STYLES[profileData?.experienceLevel] || EXP_STYLES.junior;
  const expLevel   = EXPERIENCE_LEVELS.find(l => l.value === profileData?.experienceLevel);

  if (loading || !profileData) return (
    <div className="min-h-screen bg-[#f4f5fa]">
      <Navbar />
      <div className="flex items-center justify-center h-[calc(100vh-70px)]">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Loader className="w-7 h-7 text-white animate-spin" />
          </div>
          <p className="text-gray-700 font-semibold">Loading your profile…</p>
          <p className="text-gray-400 text-sm mt-1">Just a moment</p>
        </div>
      </div>
    </div>
  );

  const NAV_ITEMS = [
    { id: "overview",  label: "Overview",       icon: User,       desc: "Your profile summary" },
    { id: "profile",   label: "Edit Profile",   icon: Settings,   desc: "Update your info" },
    { id: "goals",     label: "Goals & Skills", icon: Target,     desc: "What you're working toward" },
    { id: "stats",     label: "Statistics",     icon: BarChart3,  desc: "Your progress" },
    { id: "settings",  label: "Settings",       icon: Bell,       desc: "Preferences" },
    { id: "privacy",   label: "Privacy",        icon: Shield,     desc: "Security & data" },
    { id: "help",      label: "Help",           icon: HelpCircle, desc: "Support & FAQ" },
  ];

  return (
    <div className="min-h-screen bg-[#f4f5fa]">
      <Navbar />

      {/* Top hero card */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-5 sm:py-8 flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
            {/* Avatar + identity row on mobile */}
            <div className="flex items-center gap-4 sm:contents">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center">
                  {clerkUser?.profileImageUrl
                    ? <img src={clerkUser.profileImageUrl} alt="avatar" className="w-full h-full object-cover" />
                    : <span className="text-white text-xl sm:text-3xl font-black">{(profileData.firstName?.[0] || "?")}{ profileData.lastName?.[0] || ""}</span>
                  }
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-400 rounded-full border-2 border-white shadow" />
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5">
                  <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight leading-tight">
                    {profileData.firstName} {profileData.lastName}
                  </h1>
                  <span className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-0.5 rounded-full text-xs font-bold border ${expStyle.pill}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${expStyle.dot}`} />
                    {expLevel?.label || profileData.experienceLevel}
                  </span>
                  {profileData.onboarded && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                      <CheckCircle className="w-3 h-3" /> Complete
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-xs sm:text-sm mb-1 sm:mb-2 truncate">
                  {isStudent
                    ? [profileData.studentClass, streamInfo?.label?.split(" — ")[0], profileData.college].filter(Boolean).join(" · ") || "Student — set up your academic track"
                    : profileData.jobTitle && profileData.company
                      ? `${profileData.jobTitle}  ·  ${profileData.company}`
                      : domainInfo?.label || "Job Seeker — set up your career domain"
                  }
                </p>
                <div className="hidden sm:flex flex-wrap items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{profileData.email}</span>
                  <span className="flex items-center gap-1.5">
                    {isStudent ? <GraduationCap className="w-3.5 h-3.5" /> : <Briefcase className="w-3.5 h-3.5" />}
                    {isStudent ? "Student Mode" : "Job Seeker Mode"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Joined {new Date(clerkUser?.createdAt || Date.now()).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
              {!isEditing ? (
                <button
                  onClick={() => { setIsEditing(true); setActiveTab("profile"); }}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md flex-1 sm:flex-none justify-center sm:justify-start"
                >
                  <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-2 flex-1 sm:flex-none">
                  <button onClick={() => { setIsEditing(false); loadProfile(); }} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs sm:text-sm font-bold hover:bg-gray-50 transition-all">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                  <button onClick={saveProfile} disabled={saving} className="flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-green-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-green-700 transition-all disabled:opacity-60 shadow-sm flex-1 sm:flex-none justify-center">
                    {saving ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save
                  </button>
                </div>
              )}
              <button onClick={() => navigate("/preparation")} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gray-900 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-gray-800 transition-all shadow-sm flex-1 sm:flex-none justify-center sm:justify-start">
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="sm:inline">Prep Hub</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex divide-x divide-gray-100 overflow-x-auto scrollbar-none">
              {[
                { icon: BarChart2,  label: "Mock Interviews",   value: stats.completedInterviews || 0,  color: "text-indigo-600" },
                { icon: Activity,   label: "Avg Score",         value: `${stats.averageScore || 0}%`,   color: "text-emerald-600" },
                { icon: Clock,      label: "Practice Time",     value: `${Math.floor((stats.totalPracticeTime||0)/60)}h`, color: "text-violet-600" },
                { icon: Zap,        label: "Questions Done",    value: stats.totalQuestionsAnswered || 0,color: "text-orange-500" },
              ].map((s, i) => (
                <div key={i} className="flex-1 min-w-[120px] flex items-center gap-2 sm:gap-3 py-3 sm:py-4 px-3 sm:px-6">
                  <s.icon className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${s.color}`} />
                  <div>
                    <p className="text-base sm:text-xl font-black text-gray-900 leading-none">{s.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5 whitespace-nowrap">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 pb-24 sm:pb-8">
        <div className="flex gap-6 items-start">

          {/* Sidebar nav — hidden on mobile, visible sm+ */}
          <aside className="hidden sm:block w-56 shrink-0 sticky top-6">
            <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {NAV_ITEMS.map((item, i) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all group border-l-2 ${
                      active
                        ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                        : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    } ${i < NAV_ITEMS.length - 1 ? "border-b border-gray-50" : ""}`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold leading-none ${active ? "text-indigo-700" : ""}`}>{item.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Quick streak / badge card */}
            <div className="mt-4 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-4 text-white text-center">
              <div className="text-2xl mb-1">🔥</div>
              <p className="text-xl font-black">{stats?.streakDays || 0} days</p>
              <p className="text-white/70 text-xs">Current streak</p>
              <button onClick={() => navigate("/interviews")} className="mt-3 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-4 py-1.5 rounded-lg w-full transition-all flex items-center justify-center gap-1">
                <Zap className="w-3 h-3" /> Practice Now
              </button>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 space-y-4 sm:space-y-5">

            {/* ── OVERVIEW ── */}
            {activeTab === "overview" && (
              <OverviewContent
                profileData={profileData} stats={stats} isStudent={isStudent}
                streamInfo={streamInfo} domainInfo={domainInfo} expStyle={expStyle} expLevel={expLevel}
                onEditProfile={() => { setIsEditing(true); setActiveTab("profile"); }}
                onNavigate={navigate}
              />
            )}

            {/* ── PROFILE / EDIT ── */}
            {activeTab === "profile" && (
              <ProfileEditContent
                profileData={profileData} isEditing={isEditing} isStudent={isStudent}
                update={update} roleInput={roleInput} setRoleInput={setRoleInput}
                addRole={addRole} removeRole={removeRole}
                onSave={saveProfile} onCancel={() => { setIsEditing(false); loadProfile(); }}
                saving={saving} setIsEditing={setIsEditing}
              />
            )}

            {/* ── GOALS & SKILLS ── */}
            {activeTab === "goals" && (
              <GoalsSkillsContent
                profileData={profileData} isEditing={isEditing} isStudent={isStudent}
                toggleGoal={toggleGoal} skillInput={skillInput} setSkillInput={setSkillInput}
                addSkill={addSkill} removeSkill={removeSkill}
                onSave={saveProfile} saving={saving} setIsEditing={setIsEditing}
              />
            )}

            {/* ── STATS ── */}
            {activeTab === "stats" && <StatsContent stats={stats} />}

            {/* ── SETTINGS ── */}
            {activeTab === "settings" && <SettingsContent clerkId={clerkUser?.id} />}

            {/* ── PLACEHOLDERS ── */}
            {(activeTab === "privacy" || activeTab === "help") && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-16 text-center">
                <div className="text-4xl mb-3">{activeTab === "privacy" ? "🔒" : "💬"}</div>
                <h3 className="font-bold text-gray-800 text-lg mb-1">{activeTab === "privacy" ? "Privacy & Security" : "Help & Support"}</h3>
                <p className="text-gray-400 text-sm">This section is coming soon.</p>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* Mobile bottom nav — visible only on small screens */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex items-stretch overflow-x-auto scrollbar-none">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-w-[56px] py-2 px-1 transition-all ${
                  active ? "text-indigo-600 bg-indigo-50" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-[9px] font-bold leading-tight whitespace-nowrap">{item.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// OVERVIEW CONTENT
// ═══════════════════════════════════════════════════════════════════════════════
function OverviewContent({ profileData, stats, isStudent, streamInfo, domainInfo, expLevel, expStyle, onEditProfile, onNavigate }) {
  return (
    <div className="space-y-5">

      {/* Incomplete profile CTA */}
      {(!profileData.onboarded || (!profileData.studentCategory && !profileData.domain)) && (
        <div className="bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl p-4 sm:p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <p className="font-black text-base sm:text-lg mb-1">Complete your profile ✨</p>
            <p className="text-white/75 text-xs sm:text-sm">Set your stream / domain, skills, and goals to unlock a fully personalized prep hub.</p>
          </div>
          <button onClick={onEditProfile} className="shrink-0 bg-white text-indigo-700 font-black text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 w-full sm:w-auto justify-center">
            Set Up <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Track + Info */}
        <div className="lg:col-span-2 space-y-5">

          {/* Academic / Career track */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              {isStudent ? <GraduationCap className="w-4 h-4 text-blue-500" /> : <Briefcase className="w-4 h-4 text-violet-500" />}
              {isStudent ? "Academic Track" : "Career Domain"}
            </h3>
            {isStudent ? (
              streamInfo
                ? <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-blue-100 bg-blue-50/60">
                    <span className="text-3xl sm:text-4xl shrink-0">{streamInfo.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{streamInfo.label}</p>
                      <p className="text-xs font-semibold text-blue-600 mt-0.5">📋 {streamInfo.exam}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{streamInfo.group}</p>
                    </div>
                    {profileData.studentClass && <span className="ml-auto text-xs font-bold text-gray-500 bg-gray-100 px-2 sm:px-3 py-1.5 rounded-xl shrink-0">{profileData.studentClass}</span>}
                  </div>
                : <p className="text-gray-400 text-sm italic">No stream selected. <button onClick={onEditProfile} className="text-indigo-500 font-semibold hover:underline">Select your academic track →</button></p>
            ) : (
              domainInfo
                ? <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-violet-100 bg-violet-50/60">
                    <span className="text-3xl sm:text-4xl shrink-0">{domainInfo.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{domainInfo.label}</p>
                      <p className="text-xs text-violet-600 font-semibold mt-0.5">{domainInfo.desc}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{domainInfo.group}</p>
                    </div>
                    <span className={`ml-auto text-xs font-bold px-2 sm:px-3 py-1.5 rounded-xl border shrink-0 ${(EXP_STYLES[profileData.experienceLevel] || EXP_STYLES.junior).pill}`}>
                      {expLevel?.icon} {expLevel?.label}
                    </span>
                  </div>
                : <p className="text-gray-400 text-sm italic">No domain selected. <button onClick={onEditProfile} className="text-indigo-500 font-semibold hover:underline">Select your career domain →</button></p>
            )}

            {/* Extra fields */}
            {isStudent && profileData.college && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                <Building2 className="w-3.5 h-3.5" /> {profileData.college}
              </div>
            )}
            {!isStudent && profileData.jobTitle && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                <Briefcase className="w-3.5 h-3.5" /> {profileData.jobTitle}{profileData.company && ` at ${profileData.company}`}
              </div>
            )}
          </div>

          {/* Bio */}
          {profileData.bio && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <h3 className="font-bold text-gray-900 mb-3">About</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{profileData.bio}</p>
            </div>
          )}

          {/* Target roles (job seeker only) */}
          {!isStudent && profileData.targetRoles?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-green-500" /> Target Roles
              </h3>
              <div className="flex flex-wrap gap-2">
                {profileData.targetRoles.map((r, i) => (
                  <span key={i} className="px-3 py-1.5 bg-violet-50 text-violet-700 text-xs font-bold rounded-xl border border-violet-100">{r}</span>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {profileData.skills?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" /> Skills ({profileData.skills.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((s, i) => (
                  <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-100">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Goals + Activity */}
        <div className="space-y-5">
          {/* Goals */}
          {profileData.goals?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-green-500" /> Goals
              </h3>
              <div className="space-y-2">
                {profileData.goals.slice(0, 6).map((g, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> {g}
                  </div>
                ))}
                {profileData.goals.length > 6 && (
                  <p className="text-xs text-gray-400 mt-1">+{profileData.goals.length - 6} more goals</p>
                )}
              </div>
            </div>
          )}

          {/* Skill scores */}
          {stats?.skills?.some(s => s.score > 0) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-500" /> Skill Scores
              </h3>
              <div className="space-y-3">
                {stats.skills.map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">{s.name}</span>
                      <span className="font-bold text-gray-900">{s.score}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700" style={{ width: `${s.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent activity */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-500" /> Recent Activity
            </h3>
            {stats?.recentActivity?.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.slice(0, 4).map((a, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{a.description}</p>
                      <p className="text-xs text-gray-400">{a.date ? new Date(a.date).toLocaleDateString() : ""}{a.score != null ? ` · ${a.score}%` : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 text-xs">No interviews yet</p>
                <button onClick={() => onNavigate("/interviews")} className="mt-2 text-indigo-500 text-xs font-bold hover:underline">Start your first one →</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE EDIT CONTENT — THE BIG ONE with all categories
// ═══════════════════════════════════════════════════════════════════════════════
function ProfileEditContent({ profileData, isEditing, isStudent, update, roleInput, setRoleInput, addRole, removeRole, onSave, onCancel, saving, setIsEditing }) {
  const [openGroups, setOpenGroups] = useState({});
  const toggleGroup = (g) => setOpenGroups(p => ({ ...p, [g]: !p[g] }));

  return (
    <div className="space-y-5">
      {!isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
          <Info className="w-4 h-4 text-blue-500 shrink-0" />
          <p className="text-sm text-blue-700">You're in view mode. <button onClick={() => setIsEditing(true)} className="font-bold underline">Click to edit</button> your profile.</p>
        </div>
      )}

      {/* Basic info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
        <h3 className="font-bold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="First Name" value={profileData.firstName} onChange={v => update("firstName", v)} disabled={!isEditing} placeholder="First name" />
          <Field label="Last Name"  value={profileData.lastName}  onChange={v => update("lastName", v)}  disabled={!isEditing} placeholder="Last name" />
          <Field label="Email" type="email" value={profileData.email} onChange={v => update("email", v)} disabled={!isEditing} placeholder="Email" className="md:col-span-2" />
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Bio (optional)</label>
            <textarea value={profileData.bio} onChange={e => update("bio", e.target.value)} disabled={!isEditing} rows={2}
              placeholder="Tell us a bit about yourself…"
              className="w-full px-3 py-2.5 border border-gray-400 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 resize-none transition-all" />
          </div>
        </div>
      </div>

      {/* User type */}
      {isEditing && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <h3 className="font-bold text-gray-900 mb-4">I am a…</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "student",   label: "Student",    sub: "Still studying / preparing for exams", icon: "🎓", color: "blue" },
              { value: "jobseeker", label: "Job Seeker", sub: "Looking for a job or career change",   icon: "💼", color: "violet" },
            ].map(t => (
              <button key={t.value} onClick={() => update("userType", t.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  profileData.userType === t.value
                    ? t.color === "blue" ? "border-blue-400 bg-blue-50" : "border-violet-400 bg-violet-50"
                    : "border-gray-200 hover:border-gray-300 bg-gray-50"
                }`}>
                <div className="text-2xl mb-1.5">{t.icon}</div>
                <p className={`font-bold text-sm ${profileData.userType === t.value ? (t.color === "blue" ? "text-blue-700" : "text-violet-700") : "text-gray-700"}`}>{t.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.sub}</p>
                {profileData.userType === t.value && <CheckCircle className={`w-4 h-4 mt-2 ${t.color === "blue" ? "text-blue-500" : "text-violet-500"}`} />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STUDENT: Academic track picker */}
      {isStudent && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <h3 className="font-bold text-gray-900 mb-1">Academic Track</h3>
          <p className="text-xs text-gray-400 mb-5">Choose your stream — this powers your full preparation plan, syllabus &amp; roadmap</p>

          <div className="space-y-3">
            {STUDENT_CATEGORIES.map((group) => {
              const style = GROUP_STYLES[group.color] || GROUP_STYLES.blue;
              const isGroupOpen = openGroups[group.group] !== false;
              const hasSelected = group.streams.some(s => s.value === profileData.studentCategory);
              return (
                <div key={group.group} className={`rounded-xl border overflow-hidden ${hasSelected ? style.card : "border-gray-100"}`}>
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50/80 transition-colors"
                    onClick={() => toggleGroup(group.group)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-700">{group.group}</span>
                      {hasSelected && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                          Selected
                        </span>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isGroupOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isGroupOpen && (
                    <div className="px-4 pb-4 grid grid-cols-1 gap-2">
                      {group.streams.map(stream => {
                        const selected = profileData.studentCategory === stream.value;
                        return (
                          <button key={stream.value} disabled={!isEditing}
                            onClick={() => update("studentCategory", stream.value)}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                              selected ? `${style.ring} ring-1 ring-offset-0` : "border-gray-100 bg-gray-50/80 hover:border-gray-200 hover:bg-white"
                            } ${!isEditing ? "cursor-default" : ""}`}>
                            <span className="text-lg shrink-0">{stream.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 leading-tight">{stream.label}</p>
                              <p className="text-xs text-gray-400 mt-0.5">📋 {stream.exam}</p>
                            </div>
                            {selected && <CheckCircle className="w-4 h-4 shrink-0 text-indigo-500" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Class / Year</label>
              <input value={profileData.studentClass} onChange={e => update("studentClass", e.target.value)} disabled={!isEditing}
                placeholder="e.g. Class 12, 2nd Year B.Tech, Final Year"
                className="w-full px-3 py-2.5 border border-gray-400 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">College / School</label>
              <input value={profileData.college} onChange={e => update("college", e.target.value)} disabled={!isEditing}
                placeholder="e.g. IIT Bombay, Delhi University"
                className="w-full px-3 py-2.5 border border-gray-400 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all" />
            </div>
          </div>
        </div>
      )}

      {/* JOBSEEKER: Career domain picker */}
      {!isStudent && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <h3 className="font-bold text-gray-900 mb-1">Career Domain</h3>
          <p className="text-xs text-gray-400 mb-5">Choose your field — powers your interview prep, syllabus &amp; career roadmap</p>

          <div className="space-y-3">
            {JOBSEEKER_CATEGORIES.map((group) => {
              const style = GROUP_STYLES[group.color] || GROUP_STYLES.blue;
              const isGroupOpen = openGroups[group.group] !== false;
              const hasSelected = group.domains.some(d => d.value === profileData.domain);
              return (
                <div key={group.group} className={`rounded-xl border overflow-hidden ${hasSelected ? style.card : "border-gray-100"}`}>
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50/80 transition-colors"
                    onClick={() => toggleGroup(group.group)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-700">{group.group}</span>
                      {hasSelected && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.badge}`}>Selected</span>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isGroupOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isGroupOpen && (
                    <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {group.domains.map(domain => {
                        const selected = profileData.domain === domain.value;
                        return (
                          <button key={domain.value} disabled={!isEditing}
                            onClick={() => update("domain", domain.value)}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                              selected ? `${style.ring} ring-1 ring-offset-0` : "border-gray-100 bg-gray-50/80 hover:border-gray-200 hover:bg-white"
                            } ${!isEditing ? "cursor-default" : ""}`}>
                            <span className="text-xl shrink-0">{domain.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 leading-tight">{domain.label}</p>
                              <p className="text-xs text-gray-400 mt-0.5 truncate">{domain.desc}</p>
                            </div>
                            {selected && <CheckCircle className="w-4 h-4 shrink-0 text-violet-500" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Job details */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Current Job Title" value={profileData.jobTitle} onChange={v => update("jobTitle", v)} disabled={!isEditing} placeholder="e.g. Software Engineer" />
            <Field label="Company" value={profileData.company} onChange={v => update("company", v)} disabled={!isEditing} placeholder="e.g. Razorpay, Infosys, Fresher" />
          </div>

          {/* Experience level */}
          <div className="mt-4">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Experience Level</label>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE_LEVELS.map(l => {
                const active = profileData.experienceLevel === l.value;
                const style = EXP_STYLES[l.value] || EXP_STYLES.junior;
                return (
                  <button key={l.value} disabled={!isEditing}
                    onClick={() => update("experienceLevel", l.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                      active ? `border-transparent ${style.pill}` : "border-gray-200 text-gray-500 bg-gray-50 hover:border-gray-300"
                    } ${!isEditing ? "cursor-default" : ""}`}>
                    <span>{l.icon}</span> {l.label}
                    <span className="text-gray-400 font-normal hidden md:inline">· {l.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target roles */}
          <div className="mt-4">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Target Roles</label>
            <div className="flex gap-2 mb-2">
              <input value={roleInput} onChange={e => setRoleInput(e.target.value)} disabled={!isEditing}
                onKeyDown={e => e.key === "Enter" && addRole()}
                placeholder="e.g. Senior Product Manager, Staff Engineer"
                className="flex-1 px-3 py-2.5 border border-gray-400 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all" />
              {isEditing && (
                <button onClick={addRole} className="px-3 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {profileData.targetRoles.map((r, i) => (
                <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 text-xs font-bold rounded-xl border border-violet-100">
                  {r}
                  {isEditing && <button onClick={() => removeRole(r)} className="hover:text-red-400 transition-colors"><X className="w-3 h-3" /></button>}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save / Cancel */}
      {isEditing && (
        <div className="flex gap-3 sticky bottom-4">
          <button onClick={onSave} disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-60 shadow-lg shadow-indigo-200">
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Profile"}
          </button>
          <button onClick={onCancel} disabled={saving}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all disabled:opacity-60 shadow-sm">
            <X className="w-4 h-4" /> Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GOALS & SKILLS CONTENT
// ═══════════════════════════════════════════════════════════════════════════════
function GoalsSkillsContent({ profileData, isEditing, isStudent, toggleGoal, skillInput, setSkillInput, addSkill, removeSkill, onSave, saving, setIsEditing }) {
  return (
    <div className="space-y-5">
      {!isEditing && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">Goals and skills power your personalized roadmap and resources. <button onClick={() => setIsEditing(true)} className="font-bold underline">Edit now</button></p>
        </div>
      )}

      {/* Goals */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
        <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Target className="w-4 h-4 text-green-500" /> Your Goals
        </h3>
        <p className="text-xs text-gray-400 mb-5">Select all that apply — these personalise your roadmap &amp; resources</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {(isStudent ? STUDENT_GOALS : JOBSEEKER_GOALS).map(g => {
            const selected = profileData.goals.includes(g);
            return (
              <button key={g} onClick={() => isEditing && toggleGoal(g)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  selected ? "border-green-300 bg-green-50" : "border-gray-100 bg-gray-50 hover:border-gray-300 hover:bg-white"
                } ${!isEditing ? "cursor-default" : ""}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${selected ? "border-green-500 bg-green-500" : "border-gray-300"}`}>
                  {selected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className={`text-sm font-medium ${selected ? "text-green-800" : "text-gray-700"}`}>{g}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Skills */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
        <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" /> Skills & Tools
        </h3>
        <p className="text-xs text-gray-400 mb-5">Add skills you have or are learning — used to personalise your resources</p>

        {isEditing && (
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
              Quick add — suggested for {profileData.domain || profileData.studentCategory || "your field"}:
            </p>
            <div className="flex flex-wrap gap-2">
              {getSkillSuggestions(profileData.domain || profileData.studentCategory)
                .filter(s => !profileData.skills.includes(s))
                .slice(0, 9)
                .map(s => (
                  <button key={s} onClick={() => addSkill(s)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors">
                    <Plus className="w-3 h-3" /> {s}
                  </button>
                ))}
            </div>
          </div>
        )}

        {isEditing && (
          <div className="flex gap-2 mb-4">
            <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addSkill(skillInput)}
              placeholder="Type a skill and press Enter…"
              className="flex-1 px-3 py-2.5 border border-gray-400 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
            <button onClick={() => addSkill(skillInput)} className="px-3 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}

        {profileData.skills.length === 0
          ? <p className="text-gray-400 text-sm italic">No skills added yet.</p>
          : <div className="flex flex-wrap gap-2">
              {profileData.skills.map((s, i) => (
                <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-100">
                  {s}
                  {isEditing && (
                    <button onClick={() => removeSkill(s)} className="hover:text-red-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
        }
      </div>

      {isEditing && (
        <button onClick={onSave} disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-60 shadow-lg shadow-indigo-200">
          {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATS CONTENT
// ═══════════════════════════════════════════════════════════════════════════════
function StatsContent({ stats }) {
  if (!stats) return null;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Total Interviews",    value: stats.totalInterviews     || 0, icon: "🎯", color: "indigo" },
          { label: "Completed",           value: stats.completedInterviews || 0, icon: "✅", color: "green" },
          { label: "Avg Score",           value: `${stats.averageScore     || 0}%`, icon: "⭐", color: "yellow" },
          { label: "Practice Time",       value: `${Math.floor((stats.totalPracticeTime||0)/60)}h`, icon: "⏱️", color: "blue" },
          { label: "Questions Answered",  value: stats.totalQuestionsAnswered || 0, icon: "💬", color: "violet" },
          { label: "Assessments",         value: stats.assessmentsTaken    || 0, icon: "📝", color: "orange" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-5 flex items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl">{s.icon}</span>
            <div>
              <p className="text-xl sm:text-2xl font-black text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {stats?.skills?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <h3 className="font-bold text-gray-900 mb-5">Skill Breakdown</h3>
          <div className="space-y-4">
            {stats.skills.map((s, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-gray-700">{s.name}</span>
                  <span className="font-bold text-gray-900">{s.score}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700" style={{ width: `${s.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats?.recentActivity?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <h3 className="font-bold text-gray-900 mb-4">Interview History</h3>
          <div className="space-y-2">
            {stats.recentActivity.map((a, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{a.description}</p>
                  <p className="text-xs text-gray-400">{a.date ? new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}</p>
                </div>
                {a.score != null && (
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                    a.score >= 80 ? "bg-green-100 text-green-700" : a.score >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                  }`}>{a.score}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS CONTENT
// ═══════════════════════════════════════════════════════════════════════════════
function SettingsContent({ clerkId }) {
  const [settings, setSettings] = useState({
    emailNotifications: true, pushNotifications: false, weeklyReports: true, autoSave: true, language: "en", theme: "light"
  });

  const handleToggle = async (key) => {
    const newVal = !settings[key];
    try {
      if (clerkId) {
        await fetch(`${API_URL}/users/preferences/${clerkId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferences: { [key]: newVal } })
        });
      }
      setSettings(p => ({ ...p, [key]: newVal }));
      toast.success("Setting updated");
    } catch {
      toast.error("Failed to save setting");
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
        <h3 className="font-bold text-gray-900 mb-5">Notifications</h3>
        <div className="space-y-4">
          {[
            { key: "emailNotifications", label: "Email Notifications",    desc: "Updates and reports via email" },
            { key: "pushNotifications",  label: "Push Notifications",      desc: "Browser notifications for reminders" },
            { key: "weeklyReports",      label: "Weekly Progress Reports", desc: "Receive weekly summaries" },
            { key: "autoSave",           label: "Auto-save Interviews",    desc: "Automatically save interview progress" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <button onClick={() => handleToggle(key)}
                className={`relative w-11 h-6 rounded-full transition-colors ${settings[key] ? "bg-indigo-500" : "bg-gray-200"}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${settings[key] ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
        <h3 className="font-bold text-gray-900 mb-4">Preferences</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[["Language", "language", [["en","English"],["hi","Hindi"],["es","Spanish"],["fr","French"]]],
            ["Theme", "theme", [["light","Light"],["dark","Dark"],["auto","Auto"]]]
          ].map(([label, key, options]) => (
            <div key={key}>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
              <select value={settings[key]} onChange={e => setSettings(p => ({ ...p, [key]: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-400 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-4 sm:p-6">
        <h3 className="font-bold text-red-600 mb-4">Danger Zone</h3>
        <div className="space-y-2">
          <button className="w-full text-left px-4 py-3 border border-red-200 rounded-xl text-sm text-red-600 font-semibold hover:bg-red-50 transition-colors">
            Export All My Data
          </button>
          <button className="w-full text-left px-4 py-3 border border-red-200 rounded-xl text-sm text-red-600 font-semibold hover:bg-red-50 transition-colors">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Field helper ─────────────────────────────────────────────────────────────
function Field({ label, value, onChange, disabled, placeholder, type = "text", className = "" }) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-400 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all" />
    </div>
  );
}