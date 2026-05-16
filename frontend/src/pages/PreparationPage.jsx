import { useUser } from "@clerk/clerk-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import {
  BookOpen, Video, FileText, Clock, Star, Search,
  Bookmark, Share2, Loader, ExternalLink,
  Target, GraduationCap, Briefcase,
  Code, ChevronRight, ChevronDown, Layers, Zap, CheckCircle,
  BarChart3, MessageSquare, Sparkles, Youtube,
  TrendingUp, Award, Brain, Lightbulb, X,
  List, Hash, PlayCircle, Globe, AlertCircle,
  BookMarked, Cpu, FlaskConical, Calculator, Atom,
  FileCode, Database, Network, Shield, Paintbrush, Users,
  DollarSign, MapPin, Rocket, Flame, Building2, ArrowUpRight,
  GitBranch, Trophy, Compass, Filter
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Normalize domain values from ProfilePage short-keys → full display names ──
const DOMAIN_NORMALIZE = {
  "software":           "Software Development",
  "data_science":       "Data Science / AI / ML",
  "product":            "Product Management",
  "design":             "Design (UI/UX)",
  "marketing":          "Marketing / Growth",
  "finance":            "Finance / Accounting",
  "hr":                 "Human Resources",
  "operations":         "Operations",
  "consulting":         "Consulting",
  "sales":              "Sales",
  "devops":             "DevOps / Cloud",
  "cybersecurity":      "Cybersecurity",
  "Software Development":    "Software Development",
  "Data Science / AI / ML":  "Data Science / AI / ML",
  "DevOps / Cloud":          "DevOps / Cloud",
  "Cybersecurity":           "Cybersecurity",
  "QA / Testing":            "QA / Testing",
  "Embedded / IoT":          "Embedded / IoT",
  "Blockchain / Web3":       "Blockchain / Web3",
  "Game Development":        "Game Development",
  "Product Management":      "Product Management",
  "Consulting":              "Consulting",
  "Business Analyst":        "Business Analyst",
  "Strategy & Ops":          "Strategy & Ops",
  "Entrepreneurship":        "Entrepreneurship",
  "Finance / Accounting":    "Finance / Accounting",
  "Investment Banking":      "Investment Banking",
  "Private Equity / VC":     "Private Equity / VC",
  "Risk / Compliance":       "Risk / Compliance",
  "Tax / Audit":             "Tax / Audit",
  "Fintech":                 "Fintech",
  "Design (UI/UX)":          "Design (UI/UX)",
  "Graphic Design":          "Graphic Design",
  "Content Creation":        "Content Creation",
  "Video / Film":            "Video / Film",
  "Architecture / Interior": "Architecture / Interior",
  "Marketing / Growth":      "Marketing / Growth",
  "Sales":                   "Sales",
  "E-commerce / D2C":        "E-commerce / D2C",
  "PR / Communications":     "PR / Communications",
  "Human Resources":         "Human Resources",
  "Operations":              "Operations",
  "Customer Success":        "Customer Success",
  "Project Management":      "Project Management",
  "Healthcare / Clinical":   "Healthcare / Clinical",
  "Pharma / Biotech":        "Pharma / Biotech",
  "Health Tech":             "Health Tech",
  "Legal":                   "Legal",
  "Government / Policy":     "Government / Policy",
  "Education / EdTech":      "Education / EdTech",
  "Research / Academia":     "Research / Academia",
};

function normalizeDomain(raw) {
  if (!raw) return null;
  return DOMAIN_NORMALIZE[raw] || DOMAIN_NORMALIZE[raw.toLowerCase()] || raw;
}

const STREAM_NORMALIZE = {
  "pcm": "PCM (Physics, Chemistry, Maths)",
  "pcb": "PCB (Physics, Chemistry, Biology)",
  "PCM (Physics, Chemistry, Maths)":   "PCM (Physics, Chemistry, Maths)",
  "PCB (Physics, Chemistry, Biology)": "PCB (Physics, Chemistry, Biology)",
};

function normalizeStream(raw) {
  if (!raw) return raw;
  return STREAM_NORMALIZE[raw] || STREAM_NORMALIZE[raw.toLowerCase()] || raw;
}

const DOMAIN_COLORS = {
  "Software Development":    { from: "#6366f1", to: "#8b5cf6", light: "#eef2ff" },
  "Data Science / AI / ML":  { from: "#0ea5e9", to: "#6366f1", light: "#f0f9ff" },
  "Product Management":      { from: "#f59e0b", to: "#ef4444", light: "#fffbeb" },
  "Finance / Accounting":    { from: "#10b981", to: "#0ea5e9", light: "#ecfdf5" },
  "Consulting":              { from: "#8b5cf6", to: "#ec4899", light: "#fdf4ff" },
  "Design (UI/UX)":          { from: "#ec4899", to: "#f59e0b", light: "#fdf2f8" },
  "Marketing / Growth":      { from: "#f97316", to: "#ef4444", light: "#fff7ed" },
  "Human Resources":         { from: "#f59e0b", to: "#ef4444", light: "#fffbeb" },
  "Operations":              { from: "#64748b", to: "#475569", light: "#f8fafc" },
  "Sales":                   { from: "#10b981", to: "#0ea5e9", light: "#ecfdf5" },
  "DevOps / Cloud":          { from: "#0ea5e9", to: "#6366f1", light: "#f0f9ff" },
  "Cybersecurity":           { from: "#ef4444", to: "#7c3aed", light: "#fef2f2" },
  "QA / Testing":            { from: "#7c3aed", to: "#6366f1", light: "#f5f3ff" },
  "Embedded / IoT":          { from: "#374151", to: "#6366f1", light: "#f9fafb" },
  "Blockchain / Web3":       { from: "#f59e0b", to: "#6366f1", light: "#fffbeb" },
  "Game Development":        { from: "#ef4444", to: "#f97316", light: "#fef2f2" },
  "Business Analyst":        { from: "#8b5cf6", to: "#0ea5e9", light: "#fdf4ff" },
  "Strategy & Ops":          { from: "#6366f1", to: "#8b5cf6", light: "#eef2ff" },
  "Entrepreneurship":        { from: "#f59e0b", to: "#10b981", light: "#fffbeb" },
  "Investment Banking":      { from: "#10b981", to: "#065f46", light: "#ecfdf5" },
  "Private Equity / VC":     { from: "#065f46", to: "#0ea5e9", light: "#f0fdf4" },
  "Risk / Compliance":       { from: "#dc2626", to: "#7c3aed", light: "#fef2f2" },
  "Tax / Audit":             { from: "#0ea5e9", to: "#10b981", light: "#f0f9ff" },
  "Fintech":                 { from: "#6366f1", to: "#10b981", light: "#eef2ff" },
  "Graphic Design":          { from: "#ec4899", to: "#8b5cf6", light: "#fdf2f8" },
  "Content Creation":        { from: "#f97316", to: "#ec4899", light: "#fff7ed" },
  "Video / Film":            { from: "#dc2626", to: "#f97316", light: "#fef2f2" },
  "Architecture / Interior": { from: "#78716c", to: "#a8a29e", light: "#fafaf9" },
  "E-commerce / D2C":        { from: "#f97316", to: "#f59e0b", light: "#fff7ed" },
  "PR / Communications":     { from: "#8b5cf6", to: "#ec4899", light: "#fdf4ff" },
  "Customer Success":        { from: "#10b981", to: "#f59e0b", light: "#ecfdf5" },
  "Project Management":      { from: "#6366f1", to: "#0ea5e9", light: "#eef2ff" },
  "Healthcare / Clinical":   { from: "#0ea5e9", to: "#10b981", light: "#f0f9ff" },
  "Pharma / Biotech":        { from: "#10b981", to: "#065f46", light: "#ecfdf5" },
  "Health Tech":             { from: "#6366f1", to: "#0ea5e9", light: "#eef2ff" },
  "Legal":                   { from: "#374151", to: "#6366f1", light: "#f9fafb" },
  "Government / Policy":     { from: "#1e40af", to: "#6366f1", light: "#eff6ff" },
  "Education / EdTech":      { from: "#f59e0b", to: "#10b981", light: "#fffbeb" },
  "Research / Academia":     { from: "#8b5cf6", to: "#6366f1", light: "#fdf4ff" },
  "JEE":    { from: "#ef4444", to: "#f97316", light: "#fef2f2" },
  "NEET":   { from: "#10b981", to: "#0ea5e9", light: "#ecfdf5" },
  "UPSC":   { from: "#1e40af", to: "#6366f1", light: "#eff6ff" },
  "GATE":   { from: "#7c3aed", to: "#6366f1", light: "#f5f3ff" },
  "BANKING":{ from: "#0ea5e9", to: "#10b981", light: "#f0f9ff" },
  default:  { from: "#7c3aed", to: "#4f46e5", light: "#f5f3ff" },
};

const CAREER_DATA = {
  "Software Development": {
    overview: "Software development is one of the fastest-growing fields globally. Developers build apps, systems, and infrastructure that power every industry.",
    marketSize: "₹12 Lakh Cr+ industry in India",
    avgSalary: "₹8–45 LPA",
    jobGrowth: "+25% by 2030",
    topCompanies: ["Google","Microsoft","Amazon","Flipkart","Infosys","Razorpay","Zepto","PhonePe"],
    roles: [
      { title:"Frontend Developer",      salary:"₹6–25 LPA",  level:"Entry–Mid",    skills:["React","TypeScript","CSS","Next.js","Figma"],         demand:"Very High", desc:"Build user interfaces and web experiences. Work with designers to implement pixel-perfect UIs." },
      { title:"Backend Developer",        salary:"₹7–30 LPA",  level:"Entry–Senior", skills:["Node.js","Python","Java","PostgreSQL","Redis","AWS"],  demand:"Very High", desc:"Build APIs, databases, and server-side logic that power applications at scale." },
      { title:"Full Stack Developer",     salary:"₹8–35 LPA",  level:"Entry–Senior", skills:["React","Node.js","MongoDB","Docker","AWS"],            demand:"High",      desc:"Own entire features end-to-end — from UI to database. Most versatile software role." },
      { title:"Mobile Developer",         salary:"₹7–28 LPA",  level:"Entry–Mid",    skills:["React Native","Flutter","Swift","Kotlin","Firebase"],  demand:"High",      desc:"Build iOS and Android apps used by millions. Critical role at consumer companies." },
      { title:"DevOps / SRE Engineer",    salary:"₹10–40 LPA", level:"Mid–Senior",   skills:["Kubernetes","Terraform","AWS","CI/CD","Python"],       demand:"Very High", desc:"Keep systems running at 99.99% uptime. Build deployment pipelines for fast, safe releases." },
      { title:"Data Engineer",            salary:"₹9–35 LPA",  level:"Mid–Senior",   skills:["Spark","Kafka","Airflow","SQL","Python","dbt"],         demand:"Very High", desc:"Build data pipelines that move and transform terabytes of data for analytics teams." },
      { title:"Software Architect",       salary:"₹25–80 LPA", level:"Senior+",      skills:["System Design","Cloud","Microservices","Leadership"],   demand:"High",      desc:"Define the technical vision for engineering teams. Make build vs. buy decisions at scale." },
      { title:"Engineering Manager",      salary:"₹30–90 LPA", level:"Senior+",      skills:["Leadership","System Design","Hiring","OKRs"],           demand:"Moderate",  desc:"Manage teams of 6–15 engineers. Balance technical decisions with people management." },
    ],
    careerPaths: [
      { path:"IC Track",      steps:["Intern","Junior Dev","Mid Dev","Senior Dev","Staff Eng","Principal Eng"],         years:"0–15 yrs" },
      { path:"Management",    steps:["Senior Dev","Tech Lead","Eng Manager","Director Eng","VP Eng","CTO"],            years:"5–20 yrs" },
      { path:"Entrepreneurship", steps:["Senior Dev","Tech Lead","Co-founder/CTO","Startup Founder"],                 years:"5–12 yrs" },
    ],
    certifications:["AWS Solutions Architect","Google Cloud Professional","CKAD (Kubernetes)","Meta Frontend Developer"],
    interviewTopics:["DSA & LeetCode","System Design","Behavioral (STAR)","Coding Round","CS Fundamentals"],
    topSkillsInDemand:["React/Next.js","Python","AWS","Kubernetes","System Design","TypeScript","SQL","GenAI/LLMs"],
    realityCheck:"Most top companies hire via coding rounds. LeetCode 150–300 problems + system design = 80% ready. Networking matters at senior levels.",
  },

  "Data Science / AI / ML": {
    overview: "Data Science and AI is transforming every industry. From recommendation engines to fraud detection to generative AI — this field is at the core of modern technology.",
    marketSize: "₹4 Lakh Cr+ AI market by 2027 in India",
    avgSalary: "₹8–50 LPA",
    jobGrowth: "+40% by 2030 (fastest growing)",
    topCompanies: ["Google DeepMind","OpenAI","Microsoft","Flipkart","Paytm","Meesho","Jio","NVIDIA"],
    roles: [
      { title:"Data Analyst",             salary:"₹5–18 LPA",  level:"Entry–Mid",    skills:["SQL","Excel","Tableau","Power BI","Python"],           demand:"Very High", desc:"Turn raw data into insights. Answer business questions using SQL, dashboards, and statistical analysis." },
      { title:"Data Scientist",           salary:"₹8–35 LPA",  level:"Mid–Senior",   skills:["Python","ML","Stats","Scikit-learn","SQL","Spark"],    demand:"Very High", desc:"Build predictive models and run experiments. Bridge between business problems and ML solutions." },
      { title:"ML Engineer",              salary:"₹12–50 LPA", level:"Mid–Senior",   skills:["PyTorch","TensorFlow","MLOps","Python","Kubernetes"],   demand:"Very High", desc:"Take ML models from notebooks to production. Focus on scalability, latency, and reliability." },
      { title:"AI/LLM Engineer",          salary:"₹15–60 LPA", level:"Mid–Senior",   skills:["LLMs","RAG","LangChain","Python","Vector DBs","APIs"],  demand:"Exploding", desc:"Build AI-powered products using GPT, Gemini, Claude. Fastest growing role in tech right now." },
      { title:"Research Scientist",       salary:"₹20–80 LPA", level:"Senior (PhD)", skills:["Deep Learning","Research","PyTorch","Math","NLP"],      demand:"High",      desc:"Push the frontier of AI. Work at labs like Google Brain, FAIR, or top university labs." },
      { title:"Data Engineer",            salary:"₹9–35 LPA",  level:"Mid",          skills:["Spark","Kafka","Airflow","SQL","Python","dbt"],         demand:"Very High", desc:"Build the data infrastructure that data scientists depend on. Critical and often under-valued role." },
      { title:"Analytics Engineer",       salary:"₹10–30 LPA", level:"Mid",          skills:["dbt","SQL","Looker","Python","Data Modeling"],          demand:"High",      desc:"Bridge data engineering and analytics. Build clean, reliable data models for business teams." },
      { title:"BI Developer",             salary:"₹6–20 LPA",  level:"Entry–Mid",    skills:["Tableau","Power BI","SQL","DAX","Python"],              demand:"High",      desc:"Build executive dashboards and reports. Help companies make data-driven decisions visually." },
    ],
    careerPaths: [
      { path:"Analytics Track",   steps:["Data Analyst","Senior Analyst","Analytics Manager","Head of Analytics","Chief Data Officer"], years:"0–15 yrs" },
      { path:"ML Track",          steps:["Data Scientist","ML Engineer","Senior ML Eng","Staff ML Eng","ML Director"],                  years:"2–15 yrs" },
      { path:"Research Track",    steps:["Research Intern","Research Scientist","Senior Researcher","Research Director"],              years:"4–20 yrs" },
    ],
    certifications:["Google Data Analytics","AWS ML Specialty","TensorFlow Developer","Databricks Certified","Kaggle Competitions"],
    interviewTopics:["Statistics & Probability","ML Theory","SQL (window functions)","Python Coding","ML Case Studies","System Design"],
    topSkillsInDemand:["Python","SQL","PyTorch","LLMs/RAG","dbt","Spark","Statistics","GenAI"],
    realityCheck:"Build real projects on Kaggle, GitHub. A strong portfolio of 2–3 end-to-end ML projects beats a certificate every time.",
  },

  "Product Management": {
    overview: "Product Managers are the CEOs of their products. They sit at the intersection of business, design, and engineering — driving strategy and execution.",
    marketSize: "PM roles growing 30% YoY at Indian startups",
    avgSalary: "₹12–80 LPA",
    jobGrowth: "+28% by 2030",
    topCompanies: ["Google","Amazon","Flipkart","Swiggy","CRED","Razorpay","Meesho","Zepto"],
    roles: [
      { title:"Associate Product Manager",salary:"₹12–22 LPA", level:"Entry",         skills:["Product Thinking","Analytics","SQL","Wireframing","Stakeholder Mgmt"], demand:"High",      desc:"Entry-level PM role. Own a feature or sub-product. Perfect for MBA grads or engineers switching to PM." },
      { title:"Product Manager",          salary:"₹18–40 LPA", level:"Mid",           skills:["Roadmapping","OKRs","A/B Testing","User Research","Data Analysis"],    demand:"Very High", desc:"Own a product area end-to-end. Define the vision, build the roadmap, and drive execution." },
      { title:"Senior Product Manager",   salary:"₹30–60 LPA", level:"Senior",        skills:["Strategy","Cross-functional Leadership","Metrics","System Thinking"],  demand:"High",      desc:"Lead multiple PMs or own a large product area. Mentor junior PMs and define team direction." },
      { title:"Group PM / Director PM",   salary:"₹50–90 LPA", level:"Senior+",       skills:["Leadership","P&L Ownership","Hiring","Strategy","Org Design"],         demand:"Moderate",  desc:"Manage a portfolio of products and a team of PMs. Report to CPO or VP Product." },
      { title:"Growth PM",                salary:"₹15–45 LPA", level:"Mid",           skills:["Growth Loops","A/B Testing","SQL","Experimentation","Funnels"],        demand:"Very High", desc:"Obsessively focus on user acquisition, activation, and retention metrics." },
      { title:"Technical PM",             salary:"₹20–50 LPA", level:"Mid–Senior",    skills:["APIs","System Design","SQL","Engineering Collaboration"],              demand:"High",      desc:"Work closely with engineering on highly technical products — platforms, APIs, infrastructure." },
      { title:"Chief Product Officer",    salary:"₹80 LPA–2Cr",level:"C-Suite",       skills:["Vision","P&L","Company Strategy","Leadership"],                        demand:"Low",       desc:"Define the product strategy for the entire company. Reports to CEO." },
    ],
    careerPaths: [
      { path:"Startup PM Track",    steps:["APM","PM","Senior PM","Head of Product","CPO/Founder"],              years:"0–12 yrs" },
      { path:"Big Tech PM Track",   steps:["APM","PM II","Senior PM","Group PM","Director PM","VP Product"],    years:"0–20 yrs" },
      { path:"MBA → PM Track",      steps:["MBA Intern","APM","PM","Senior PM","Director PM"],                  years:"MBA+0–12 yrs" },
    ],
    certifications:["AIPMM CPM","Product School Certification","Reforge Programs","Google PM Certificate"],
    interviewTopics:["Product Design (CIRCLES)","Metrics & Analytics","Strategy Cases","Behavioral","Estimation","Technical Fluency"],
    topSkillsInDemand:["Product Strategy","Data Analytics","SQL","User Research","Roadmapping","A/B Testing","Stakeholder Management"],
    realityCheck:"PM is one of the hardest roles to break into without experience. Best paths: engineer → PM, MBA → APM program, or intern → APM at a top startup.",
  },

  "Finance / Accounting": {
    overview: "Finance powers every business decision. From investment banking to fintech to CFO roles — financial professionals are essential in every industry.",
    marketSize: "India's financial services market: ₹20+ Lakh Cr",
    avgSalary: "₹6–60 LPA (varies widely by sub-field)",
    jobGrowth: "+15% by 2030",
    topCompanies: ["Goldman Sachs","JP Morgan","Morgan Stanley","HDFC","Zerodha","ClearTax","KPMG","Deloitte"],
    roles: [
      { title:"Investment Banking Analyst", salary:"₹10–25 LPA",  level:"Entry",        skills:["Financial Modeling","Excel","PowerPoint","DCF","Pitch Decks"],  demand:"High",      desc:"Build pitch decks, financial models, and analysis for M&A and capital raising deals. Intense but highly paid." },
      { title:"Equity Research Analyst",    salary:"₹8–25 LPA",   level:"Entry–Mid",    skills:["Valuation","Sector Research","Financial Modeling","Report Writing"], demand:"High",  desc:"Analyse companies and write research reports with buy/sell recommendations for fund managers." },
      { title:"Private Equity Associate",   salary:"₹15–50 LPA",  level:"Mid",          skills:["LBO Modeling","Due Diligence","Deal Sourcing","Valuation"],     demand:"Moderate",  desc:"Evaluate and execute buyout investments. Work with portfolio companies post-investment." },
      { title:"FP&A Analyst",               salary:"₹7–20 LPA",   level:"Entry–Mid",    skills:["Excel","Budgeting","Forecasting","SQL","Power BI"],             demand:"Very High", desc:"Financial Planning & Analysis — build budgets, forecasts, and business cases for internal stakeholders." },
      { title:"Chartered Accountant (CA)",  salary:"₹8–35 LPA",   level:"All levels",   skills:["Audit","Taxation","IFRS","Financial Reporting","GST"],          demand:"Very High", desc:"India's most respected finance credential. Opens doors to CFO track, Big 4, and senior finance roles." },
      { title:"Risk Analyst",               salary:"₹6–22 LPA",   level:"Entry–Mid",    skills:["Statistical Modeling","Excel","VaR","Stress Testing","SQL"],    demand:"High",      desc:"Identify and model financial risks — credit, market, operational — for banks and NBFCs." },
      { title:"CFO / Finance Director",     salary:"₹40 LPA–2 Cr",level:"C-Suite",      skills:["Strategy","Capital Allocation","M&A","Board Reporting","P&L"],  demand:"Moderate",  desc:"Own the financial health of the company. Partner with CEO on strategy and capital decisions." },
      { title:"Fintech Product / Analyst",  salary:"₹10–35 LPA",  level:"Mid",          skills:["Finance","SQL","Product Thinking","APIs","Compliance"],         demand:"Very High", desc:"Work at the intersection of finance and technology — lending, payments, wealth tech, insurance tech." },
    ],
    careerPaths: [
      { path:"IB Track",        steps:["IB Analyst","Associate","VP","Director","MD"],                           years:"0–15 yrs" },
      { path:"CA/CFO Track",    steps:["CA Articleship","CA","Senior Manager","Finance Director","CFO"],         years:"3–20 yrs" },
      { path:"Fintech Track",   steps:["Analyst","Senior Analyst","Finance Manager","Head of Finance","CFO"],   years:"0–15 yrs" },
    ],
    certifications:["CA (ICAI)","CFA (CFA Institute)","FRM","CPA","CMA India","ACCA"],
    interviewTopics:["DCF Valuation","Financial Statements","M&A Concepts","LBO Basics","Accounting","Mental Math"],
    topSkillsInDemand:["Financial Modeling","Excel","DCF","SQL","CFA","Python (for quants)","Tableau"],
    realityCheck:"CFA + strong modeling skills open most doors. IB is extremely competitive — target BBs via target college placements or lateral moves from Big 4.",
  },

  "Consulting": {
    overview: "Management consultants solve the hardest business problems for the world's biggest companies and governments. MBB (McKinsey, BCG, Bain) is the gold standard.",
    marketSize: "Global consulting: $900Bn market",
    avgSalary: "₹12–60 LPA (MBB pays ₹25–40 LPA for freshers)",
    jobGrowth: "+14% by 2030",
    topCompanies: ["McKinsey","BCG","Bain","Deloitte","EY","KPMG","Accenture Strategy","Kearney","Roland Berger"],
    roles: [
      { title:"Business Analyst",         salary:"₹12–22 LPA",  level:"Entry",        skills:["Case Solving","Excel","PowerPoint","Structured Thinking","Client Skills"], demand:"High",     desc:"Entry-level at MBB for undergrads. Solve client problems, build decks, run analysis." },
      { title:"Analyst / Consultant",     salary:"₹18–35 LPA",  level:"Entry–Mid",    skills:["Problem Structuring","Data Analysis","Storytelling","Project Management"],  demand:"High",     desc:"Lead workstreams, client interactions, and analysis. Core execution role at top consulting firms." },
      { title:"Senior Consultant",        salary:"₹25–50 LPA",  level:"Mid",          skills:["Leadership","Client Management","Business Development","Industry Expertise"], demand:"Moderate", desc:"Own client relationships and lead teams. Begin to specialize in an industry (Healthcare, Tech, etc.)." },
      { title:"Manager / Principal",      salary:"₹40–80 LPA",  level:"Senior",       skills:["P&L Ownership","Business Dev","People Leadership","Strategy"],              demand:"Moderate", desc:"Lead multiple projects and teams. Responsible for bringing in new business." },
      { title:"Partner / Director",       salary:"₹80 LPA–3 Cr",level:"Senior+",      skills:["Business Development","Vision","Network","Industry Authority"],               demand:"Low",       desc:"Equity partner at top firms. Build and maintain senior client relationships." },
      { title:"Strategy Analyst (Corp.)", salary:"₹10–25 LPA",  level:"Entry–Mid",    skills:["Market Research","Competitive Analysis","Presentations","Financial Modeling"], demand:"High",   desc:"In-house strategy role at corporates. Similar work to consulting but focused on one company." },
    ],
    careerPaths: [
      { path:"MBB Track",           steps:["BA/Analyst","Consultant","Senior Consultant","Manager","Partner"],              years:"0–15 yrs" },
      { path:"MBA Consulting",      steps:["MBA","Associate","Manager","Senior Manager","Partner"],                         years:"MBA+0–12 yrs" },
      { path:"Industry Exit",       steps:["Consultant","VP Strategy (Corporate)","SVP Strategy","CEO/COO"],               years:"3–15 yrs" },
    ],
    certifications:["MBA (IIM/ISB/IIT)","CFA (for finance consulting)","PMP","Six Sigma","Industry certifications"],
    interviewTopics:["Case Interviews (Profitability, Market Entry, M&A)","Fit/Behavioral","Market Sizing","Mental Math","Frameworks"],
    topSkillsInDemand:["Structured Problem Solving","Case Interviews","Excel","PowerPoint","Communication","Hypothesis Thinking"],
    realityCheck:"Case interviews are learnable. 30–50 practice cases + peer mock interviews is the recipe. GPA + target college matters a lot for MBB.",
  },

  "Design (UI/UX)": {
    overview: "UX/UI Design shapes how millions of people interact with products. Designers are in high demand at every tech company, startup, and digital agency.",
    marketSize: "Design roles 50% growth in India (2022–2025)",
    avgSalary: "₹5–35 LPA",
    jobGrowth: "+20% by 2030",
    topCompanies: ["Google","Apple","Airbnb","Swiggy","CRED","Meesho","Dunzo","Razorpay","design studios"],
    roles: [
      { title:"UI Designer",              salary:"₹4–18 LPA",   level:"Entry–Mid",    skills:["Figma","Visual Design","Typography","Color Theory","CSS basics"],    demand:"High",      desc:"Create beautiful, pixel-perfect visual interfaces. Focus on aesthetics, layouts, and design systems." },
      { title:"UX Designer",              salary:"₹5–22 LPA",   level:"Entry–Mid",    skills:["User Research","Wireframing","Prototyping","Figma","Usability Testing"], demand:"Very High", desc:"Design experiences that are intuitive and user-friendly. Research users, map journeys, test prototypes." },
      { title:"Product Designer",         salary:"₹8–35 LPA",   level:"Mid–Senior",   skills:["End-to-end Design","Design Systems","Cross-func Collab","Strategy"], demand:"Very High", desc:"Owns the design of an entire product or feature. Works closely with PM and engineering." },
      { title:"UX Researcher",            salary:"₹7–25 LPA",   level:"Mid",          skills:["Qual Research","Surveys","User Interviews","Data Analysis","Synthesis"], demand:"High",    desc:"Dedicated researcher who uncovers deep user insights. Increasingly data-driven role." },
      { title:"Design Systems Lead",      salary:"₹15–40 LPA",  level:"Senior",       skills:["Component Libraries","Tokens","Figma","Engineering Collaboration"],   demand:"High",      desc:"Build and maintain the design system used by all designers and engineers in the company." },
      { title:"Design Manager / Lead",    salary:"₹25–60 LPA",  level:"Senior+",      skills:["Leadership","Critique","Hiring","Design Vision","Cross-team Collab"], demand:"Moderate",  desc:"Lead a team of designers. Set design culture, run critiques, hire, and represent design at leadership." },
    ],
    careerPaths: [
      { path:"IC Design Track",   steps:["UI/UX Designer","Senior Designer","Staff Designer","Principal Designer"],   years:"0–12 yrs" },
      { path:"Management Track",  steps:["Senior Designer","Design Lead","Design Manager","VP Design","CDO"],         years:"4–18 yrs" },
      { path:"Freelance Track",   steps:["Junior Designer","Senior Designer","Freelance/Consultant","Agency Owner"],  years:"0–10 yrs" },
    ],
    certifications:["Google UX Design Certificate","Interaction Design Foundation","Nielsen Norman UX","NN/g UX Certification"],
    interviewTopics:["Portfolio Case Studies","Design Challenge (timed)","Critique Session","Product Sense","Behavioral"],
    topSkillsInDemand:["Figma","User Research","Design Systems","Prototyping","Cross-functional Collaboration","AI Design Tools"],
    realityCheck:"Portfolio quality matters more than degrees. 3 strong, well-documented case studies beat 10 mediocre ones. Process > polish.",
  },

  "Marketing / Growth": {
    overview: "Marketing drives awareness, acquisition, and retention. Growth marketers at startups are some of the most impactful people at the company.",
    marketSize: "Digital marketing in India: ₹35,000 Cr+ by 2026",
    avgSalary: "₹5–40 LPA",
    jobGrowth: "+22% by 2030",
    topCompanies: ["Swiggy","Zomato","Meesho","Nykaa","Urban Company","HUL","P&G","GroupM","dentsu"],
    roles: [
      { title:"Digital Marketing Analyst", salary:"₹4–12 LPA",  level:"Entry",        skills:["Google Ads","Meta Ads","SEO","Analytics","Email Marketing"],   demand:"Very High", desc:"Manage paid campaigns, track performance, and optimize ROI across digital channels." },
      { title:"SEO Specialist",            salary:"₹4–15 LPA",  level:"Entry–Mid",    skills:["SEO","Content Strategy","Keyword Research","Ahrefs","WordPress"], demand:"High",    desc:"Drive organic traffic through search optimization. Critical for content businesses." },
      { title:"Growth Manager",            salary:"₹10–35 LPA", level:"Mid",          skills:["Growth Loops","A/B Testing","SQL","Funnels","Experimentation"],  demand:"Very High", desc:"Own user acquisition and retention metrics. Run experiments across all channels." },
      { title:"Brand Manager",             salary:"₹8–25 LPA",  level:"Mid",          skills:["Brand Strategy","Campaign Planning","Consumer Insight","P&L"],  demand:"High",      desc:"Build and maintain brand identity. Own ATL/BTL campaigns and brand P&L at FMCG companies." },
      { title:"Content Strategist",        salary:"₹5–18 LPA",  level:"Entry–Mid",    skills:["Content Writing","SEO","Social Media","Analytics","Strategy"],  demand:"High",      desc:"Plan and execute content that drives traffic, engagement, and conversions." },
      { title:"CMO / VP Marketing",        salary:"₹40 LPA–1 Cr",level:"C-Suite",     skills:["Brand","Performance","Leadership","P&L","Strategy"],            demand:"Moderate",  desc:"Own the full marketing function. Accountable for brand, growth, and revenue contribution." },
    ],
    careerPaths: [
      { path:"Performance Marketing",   steps:["Digital Analyst","Growth Executive","Growth Manager","Head of Growth","CMO"], years:"0–12 yrs" },
      { path:"Brand & Strategy",        steps:["Brand Executive","Brand Manager","Group Brand Manager","Marketing Director","CMO"], years:"0–15 yrs" },
      { path:"Content & SEO",           steps:["Content Writer","SEO Analyst","Content Lead","Head of Content","VP Content"], years:"0–10 yrs" },
    ],
    certifications:["Google Ads Certification","HubSpot Inbound","Meta Blueprint","Google Analytics","Reforge Growth"],
    interviewTopics:["Growth Strategy Cases","Campaign Design","Analytics & Attribution","Behavioral","Channel Strategy"],
    topSkillsInDemand:["Performance Marketing","SQL","A/B Testing","Google/Meta Ads","CRM (HubSpot)","SEO","Content Strategy"],
    realityCheck:"Show results in your portfolio — CAC reduced by X%, organic traffic grew Y%. Numbers matter more than theory in marketing interviews.",
  },

  "Human Resources": {
    overview: "HR is evolving from administrative to strategic. Modern HR professionals are business partners who use data to attract, develop, and retain talent.",
    marketSize: "HR Tech India: ₹7,000 Cr+ by 2025",
    avgSalary: "₹5–30 LPA",
    jobGrowth: "+18% by 2030",
    topCompanies: ["Unacademy","Razorpay","Swiggy","Deloitte","Infosys","TATA Group","Aon Hewitt","Korn Ferry"],
    roles: [
      { title:"HR Executive / Generalist",salary:"₹3–8 LPA",    level:"Entry",        skills:["Recruitment","Onboarding","HRIS","Employee Relations","Compliance"], demand:"Very High", desc:"Handle end-to-end HR operations — hiring, onboarding, payroll, compliance, and employee support." },
      { title:"Talent Acquisition Specialist",salary:"₹5–18 LPA",level:"Entry–Mid",   skills:["Sourcing","JD Writing","ATS","Stakeholder Management","Interviewing"], demand:"Very High",desc:"Own the hiring pipeline for specific functions. Partner with managers to hire top talent fast." },
      { title:"HR Business Partner (HRBP)", salary:"₹10–30 LPA",level:"Mid–Senior",   skills:["Stakeholder Management","OKRs","Performance Mgmt","Org Design","Data"], demand:"High",   desc:"Strategic HR partner to business leaders. Solve org problems through people solutions." },
      { title:"L&D Specialist",            salary:"₹6–20 LPA",  level:"Mid",          skills:["Training Design","LMS","Content Creation","Facilitation","Analytics"], demand:"High",    desc:"Design and deliver learning programs that upskill employees and drive business outcomes." },
      { title:"Compensation & Benefits",   salary:"₹8–25 LPA",  level:"Mid–Senior",   skills:["Salary Benchmarking","Benefits Design","Equity Comp","Excel","Analytics"], demand:"Moderate",desc:"Design fair, competitive pay structures. Increasingly data-driven and strategic role." },
      { title:"CHRO / HR Director",        salary:"₹30 LPA–1 Cr",level:"C-Suite",     skills:["Strategy","Culture","Talent","DEI","Leadership","Board Reporting"],    demand:"Moderate",  desc:"Own the people strategy for the entire company. Board-level role focused on org health and culture." },
    ],
    careerPaths: [
      { path:"HRBP Track",      steps:["HR Executive","HR Generalist","HRBP","Senior HRBP","HR Director","CHRO"],   years:"0–18 yrs" },
      { path:"Talent Acq.",     steps:["TA Executive","TA Lead","TA Manager","Head of TA","VP Talent"],             years:"0–12 yrs" },
      { path:"HR Tech",         steps:["HR Analyst","HR Tech Consultant","HRIS Manager","Head of HR Tech"],        years:"0–12 yrs" },
    ],
    certifications:["SHRM-CP/SCP","PHR/SPHR","LinkedIn Talent Insights","People Analytics (Coursera)","NHRDN"],
    interviewTopics:["Situational HR Cases","Competency-based Q&A","HR Policy","Analytics","Labor Law","Culture Fit"],
    topSkillsInDemand:["Stakeholder Management","Data & Analytics","HRIS Tools","Talent Acquisition","Change Management","DEI"],
    realityCheck:"HR is becoming more data-driven. Learning SQL and people analytics gives you a massive edge over traditional HR professionals.",
  },

  "Operations": {
    overview: "Operations professionals ensure businesses run efficiently. From supply chain to process improvement — ops roles exist in every industry.",
    marketSize: "Supply chain management in India: ₹12 Lakh Cr+",
    avgSalary: "₹6–35 LPA",
    jobGrowth: "+16% by 2030",
    topCompanies: ["Amazon","Flipkart","Zomato","Delhivery","Blue Dart","Maersk","McKinsey Ops","GE","Tata Motors"],
    roles: [
      { title:"Operations Analyst",       salary:"₹5–14 LPA",  level:"Entry",        skills:["Excel","SQL","Process Mapping","Root Cause Analysis","Dashboards"],  demand:"Very High", desc:"Analyse operational data to identify inefficiencies and improvement opportunities." },
      { title:"Supply Chain Manager",     salary:"₹8–25 LPA",  level:"Mid",          skills:["Demand Forecasting","Vendor Mgmt","ERP","Logistics","Inventory"],    demand:"Very High", desc:"Own end-to-end supply chain — from procurement to last-mile delivery." },
      { title:"Project Manager",          salary:"₹8–28 LPA",  level:"Mid",          skills:["PMP","Risk Management","Agile","Stakeholder Mgmt","Budgeting"],      demand:"Very High", desc:"Plan and deliver projects on time and budget. Works across all industries." },
      { title:"Lean Six Sigma Consultant",salary:"₹10–30 LPA", level:"Mid–Senior",   skills:["DMAIC","VSM","Statistical Analysis","Change Mgmt","Facilitation"],   demand:"High",      desc:"Drive process improvement initiatives that save costs and improve quality." },
      { title:"Logistics Manager",        salary:"₹7–22 LPA",  level:"Mid",          skills:["Route Optimization","3PL Management","WMS","KPIs","Cost Control"],   demand:"Very High", desc:"Manage the movement of goods from warehouse to customer. Critical in e-commerce." },
      { title:"COO / VP Operations",      salary:"₹35 LPA–1 Cr",level:"C-Suite",     skills:["Strategy","P&L","Scale","Leadership","Process Excellence"],          demand:"Moderate",  desc:"Own operational excellence for the company. Second-in-command at many startups." },
    ],
    careerPaths: [
      { path:"Supply Chain",      steps:["Ops Analyst","Supply Chain Exec","SCM Manager","Head of Supply Chain","VP Ops","COO"], years:"0–15 yrs" },
      { path:"Project Mgmt",      steps:["Project Coord.","Project Manager","Senior PM","Program Manager","PMO Head"],         years:"0–12 yrs" },
      { path:"Process Excellence",steps:["Ops Analyst","Process Improvement Mgr","Six Sigma Black Belt","Head of Ops Exc."],  years:"2–12 yrs" },
    ],
    certifications:["PMP (PMI)","CSCP (Supply Chain)","Lean Six Sigma Black Belt","APICS","AWS Supply Chain"],
    interviewTopics:["Operations Case Studies","Process Improvement","Supply Chain Scenarios","Behavioral","Data Analysis"],
    topSkillsInDemand:["Supply Chain","Project Management","SQL","ERP (SAP/Oracle)","Lean Six Sigma","Data Analysis"],
    realityCheck:"Get the PMP early. It dramatically increases interview callbacks. Hands-on experience with ERP systems (SAP, Oracle) is highly valued.",
  },

  "Sales": {
    overview: "Sales is the engine of every business. Top sales professionals are among the highest-paid people in any company — and it's one of the most transferable careers.",
    marketSize: "B2B SaaS sales booming in India — 1000+ SaaS companies hiring",
    avgSalary: "₹5–50 LPA (base + commission)",
    jobGrowth: "+20% by 2030",
    topCompanies: ["Salesforce","Freshworks","Zoho","Razorpay","LeadSquared","HubSpot","Oracle","SAP","Infosys"],
    roles: [
      { title:"Sales Development Rep (SDR)",salary:"₹4–10 LPA",  level:"Entry",       skills:["Cold Calling","Email Outreach","CRM (Salesforce)","Prospecting","Objection Handling"], demand:"Very High", desc:"Generate pipeline through outbound prospecting. First role for most sales careers." },
      { title:"Account Executive (AE)",   salary:"₹8–30 LPA",  level:"Mid",          skills:["Discovery","Demo","Negotiation","Closing","CRM","SPIN Selling"],    demand:"Very High", desc:"Own full sales cycles from discovery to close. Commission can double base salary." },
      { title:"Enterprise Account Exec.", salary:"₹15–50 LPA", level:"Senior",       skills:["Enterprise Sales","Executive Presence","Contract Negotiation","Multi-threading"],demand:"High", desc:"Sell high-value deals (₹50L–10Cr) to large enterprises. Requires strategic relationship skills." },
      { title:"Customer Success Manager", salary:"₹6–22 LPA",  level:"Entry–Mid",    skills:["Account Management","Onboarding","Renewal","Upsell","QBRs","CRM"],  demand:"Very High", desc:"Ensure customers get value and renew. Key retention role at SaaS companies." },
      { title:"Sales Manager",            salary:"₹12–35 LPA", level:"Mid–Senior",   skills:["Coaching","Pipeline Management","Forecasting","CRM","Leadership"],  demand:"High",      desc:"Lead a team of 6–12 AEs. Own team quota and coaching. First management role in sales." },
      { title:"VP Sales / CRO",           salary:"₹40 LPA–2 Cr",level:"C-Suite",     skills:["Revenue Strategy","Hiring","Comp Design","Board Reporting","CRM"], demand:"Moderate",  desc:"Own all revenue generation for the company. Reports to CEO, manages all sales teams." },
    ],
    careerPaths: [
      { path:"SaaS Sales Track",    steps:["SDR","AE","Senior AE","Enterprise AE","Sales Manager","VP Sales"],         years:"0–12 yrs" },
      { path:"Customer Success",    steps:["CSM","Senior CSM","CS Manager","Head of CS","VP CS"],                       years:"0–10 yrs" },
      { path:"Revenue Leadership",  steps:["AE","Sales Manager","Director Sales","VP Sales","CRO"],                     years:"3–15 yrs" },
    ],
    certifications:["Salesforce Admin/Sales Cloud","HubSpot Sales Certification","SPIN Selling","Sandler Training","Challenger Sale"],
    interviewTopics:["Sales Role Play","Discovery Call Simulation","Objection Handling","Territory Planning","Behavioral","CRM Proficiency"],
    topSkillsInDemand:["CRM (Salesforce/HubSpot)","SPIN/Challenger Selling","Prospecting","Negotiation","Sales Analytics","Account Management"],
    realityCheck:"Show your numbers — quota attainment %, deals closed, revenue generated. Sales is 100% a metrics-driven career. Results speak louder than anything.",
  },

  "DevOps / Cloud": {
    overview: "DevOps and Cloud Engineering is the infrastructure backbone of modern software. Every company that runs software needs DevOps engineers.",
    marketSize: "Cloud services India: ₹60,000 Cr+ by 2026",
    avgSalary: "₹9–50 LPA",
    jobGrowth: "+30% by 2030",
    topCompanies: ["AWS","Google Cloud","Microsoft Azure","Infosys","TCS","Razorpay","Zepto","Juspay","HashiCorp"],
    roles: [
      { title:"DevOps Engineer",          salary:"₹8–28 LPA",  level:"Entry–Mid",    skills:["CI/CD","Docker","Kubernetes","Linux","Python","Bash","Jenkins"],     demand:"Very High", desc:"Automate software deployment, build CI/CD pipelines, and maintain infrastructure." },
      { title:"Cloud Engineer",           salary:"₹9–30 LPA",  level:"Mid",          skills:["AWS/GCP/Azure","Terraform","Networking","IAM","Cost Optimization"], demand:"Very High", desc:"Design and manage cloud infrastructure on AWS, GCP, or Azure." },
      { title:"Site Reliability Engineer",salary:"₹12–45 LPA", level:"Mid–Senior",   skills:["SLI/SLO/SLA","Observability","Incident Response","Python","K8s"],   demand:"Very High", desc:"Keep production systems reliable at scale. Google invented this role — now universal at tech companies." },
      { title:"Platform Engineer",        salary:"₹12–40 LPA", level:"Mid–Senior",   skills:["Internal Developer Platform","K8s","Backstage","Terraform","APIs"],  demand:"High",      desc:"Build internal developer tools and platforms that make engineering teams more productive." },
      { title:"Cloud Architect",          salary:"₹20–70 LPA", level:"Senior",       skills:["Cloud Design Patterns","Multi-cloud","Security","Cost Design","IaC"],demand:"High",      desc:"Design entire cloud architectures for enterprises. Require deep AWS/GCP/Azure expertise." },
      { title:"Security Engineer",        salary:"₹12–45 LPA", level:"Mid–Senior",   skills:["DevSecOps","SAST/DAST","Secrets Mgmt","Zero Trust","Compliance"],    demand:"Very High", desc:"Embed security into DevOps pipelines and cloud infrastructure. Critical shortage of talent." },
    ],
    careerPaths: [
      { path:"DevOps Track",      steps:["Junior DevOps","DevOps Engineer","Senior DevOps","DevOps Lead","Platform Engineering Lead"], years:"0–12 yrs" },
      { path:"SRE Track",         steps:["Software Eng","SRE","Senior SRE","Staff SRE","Engineering Director"],                       years:"2–15 yrs" },
      { path:"Cloud Architecture",steps:["Cloud Eng","Senior Cloud Eng","Cloud Architect","Principal Architect","CTO"],               years:"3–18 yrs" },
    ],
    certifications:["AWS Solutions Architect (SAA-C03)","CKA / CKAD (Kubernetes)","GCP Professional DevOps","Terraform Associate","Azure Administrator"],
    interviewTopics:["System Design (Cloud)","Kubernetes Scenarios","CI/CD Design","Linux & Networking","Coding (Python/Bash)","SRE Behavioral"],
    topSkillsInDemand:["Kubernetes","Terraform","AWS","CI/CD (GitHub Actions)","Python","Observability (Prometheus/Grafana)","Linux"],
    realityCheck:"Get AWS SAA + CKAD. These two certs + hands-on projects on GitHub get you past most screenings. Build a home lab / use free tiers.",
  },

  "Cybersecurity": {
    overview: "Cybersecurity is one of the most critical and fastest-growing fields. With cyber threats surging, every organization is desperately hiring security professionals.",
    marketSize: "India cybersecurity market: ₹25,000 Cr by 2025",
    avgSalary: "₹7–50 LPA",
    jobGrowth: "+35% by 2030 (massive shortage)",
    topCompanies: ["Palo Alto Networks","CrowdStrike","Razorpay","Juspay","HDFC Bank","HCL","TATA Communications","Wipro Cybersecurity"],
    roles: [
      { title:"SOC Analyst (L1/L2)",      salary:"₹4–15 LPA",  level:"Entry",        skills:["SIEM (Splunk/QRadar)","Log Analysis","Incident Response","Networking","Threat Intel"], demand:"Very High", desc:"Monitor security alerts 24/7, triage incidents, and escalate threats. Entry point for most security careers." },
      { title:"Penetration Tester",       salary:"₹7–30 LPA",  level:"Entry–Mid",    skills:["Kali Linux","Burp Suite","Metasploit","OWASP","Scripting","Recon"],  demand:"Very High", desc:"Legally hack systems to find vulnerabilities before attackers do. Exciting, hands-on role." },
      { title:"Application Security Eng.",salary:"₹10–40 LPA", level:"Mid",          skills:["OWASP Top 10","SAST/DAST","Secure Code Review","Threat Modeling","APIs"], demand:"Very High",desc:"Secure software during development. Work with dev teams to eliminate vulnerabilities early." },
      { title:"Cloud Security Engineer",  salary:"₹12–45 LPA", level:"Mid–Senior",   skills:["AWS Security","CSPM","IAM","Zero Trust","Compliance","Terraform"],    demand:"Exploding", desc:"Secure cloud infrastructure. One of the most in-demand sub-roles in security right now." },
      { title:"Security Architect",       salary:"₹20–70 LPA", level:"Senior",       skills:["Zero Trust Architecture","Risk Management","Compliance Frameworks","Leadership"], demand:"High", desc:"Design the security architecture for entire organizations. Strategic, high-impact role." },
      { title:"CISO / Security Director", salary:"₹40 LPA–2 Cr",level:"C-Suite",     skills:["Strategy","Risk","Compliance","Leadership","Stakeholder Mgmt","Incidents"], demand:"Moderate",desc:"Own the security posture of the entire company. Board-level accountability for cyber risk." },
    ],
    careerPaths: [
      { path:"Blue Team",     steps:["SOC Analyst","Threat Hunter","Incident Responder","Security Engineer","Security Architect"], years:"0–12 yrs" },
      { path:"Red Team",      steps:["Junior Pentester","Pentester","Senior Pentester","Red Team Lead","VP Offensive Security"],  years:"0–12 yrs" },
      { path:"Cloud Security",steps:["SOC Analyst","Cloud Security Analyst","Cloud Security Eng.","Cloud Security Architect"],    years:"1–10 yrs" },
    ],
    certifications:["CompTIA Security+","CEH (EC-Council)","OSCP (Offensive Security)","CISSP","AWS Security Specialty","CCSP"],
    interviewTopics:["Network & Security Fundamentals","OWASP Top 10","Incident Response Scenarios","CTF/Practical Challenges","Behavioral"],
    topSkillsInDemand:["SIEM Tools","Penetration Testing","Cloud Security","Python/Bash Scripting","OWASP","Zero Trust","Threat Intelligence"],
    realityCheck:"Do CTF challenges on HackTheBox and TryHackMe. Certifications like Security+ and OSCP are widely recognized. Hands-on > theory.",
  },
};

const DEMAND_COLORS = {
  "Very High":  { bg: "bg-green-50",   text: "text-green-700",   dot: "bg-green-500" },
  "High":       { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500" },
  "Exploding":  { bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-500" },
  "Moderate":   { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500" },
  "Low":        { bg: "bg-gray-100",   text: "text-gray-600",    dot: "bg-gray-400" },
};

function getDomainColor(profile) {
  if (!profile) return DOMAIN_COLORS.default;
  if (profile.userType === "student") {
    const cat = profile.studentCategory || normalizeStream(profile.stream) || "";
    if (cat.includes("PCM") || cat === "PCM_JEE" || cat === "PCMB") return DOMAIN_COLORS["JEE"];
    if (cat.includes("PCB") || cat === "PCB_NEET") return DOMAIN_COLORS["NEET"];
    if (cat === "UPSC_Civil" || cat.includes("UPSC")) return DOMAIN_COLORS["UPSC"];
    if (cat === "Banking_PO") return DOMAIN_COLORS["BANKING"];
    if (cat.includes("GATE")) return DOMAIN_COLORS["GATE"];
    const mappedDomain = STREAM_TO_SYLLABUS_KEY[cat];
    if (mappedDomain) return DOMAIN_COLORS[mappedDomain] || DOMAIN_COLORS.default;
  }
  const domain = normalizeDomain(profile.domain);
  return DOMAIN_COLORS[domain] || DOMAIN_COLORS.default;
}

const SYLLABUS_DATA = {
  "JEE_PCM": {
    label: "JEE Main & Advanced",
    subjects: [
      {
        name: "Physics", icon: Atom, color: "blue",
        topics: [
          { name: "Mechanics", subtopics: ["Laws of Motion", "Work & Energy", "Rotational Motion", "Gravitation", "Fluid Mechanics"] },
          { name: "Thermodynamics", subtopics: ["Kinetic Theory", "Laws of Thermodynamics", "Heat Transfer", "Carnot Engine"] },
          { name: "Electrostatics & Magnetism", subtopics: ["Coulomb's Law", "Gauss's Law", "Capacitors", "Magnetic Fields", "Faraday's Law"] },
          { name: "Optics & Modern Physics", subtopics: ["Ray Optics", "Wave Optics", "Photoelectric Effect", "Bohr's Model", "Nuclear Physics"] },
          { name: "Waves & Oscillations", subtopics: ["SHM", "Waves", "Sound", "Doppler Effect"] },
        ]
      },
      {
        name: "Chemistry", icon: FlaskConical, color: "green",
        topics: [
          { name: "Physical Chemistry", subtopics: ["Mole Concept", "Chemical Equilibrium", "Electrochemistry", "Chemical Kinetics", "Thermochemistry"] },
          { name: "Organic Chemistry", subtopics: ["GOC", "Hydrocarbons", "Halides", "Alcohols & Ethers", "Carbonyl Compounds", "Named Reactions"] },
          { name: "Inorganic Chemistry", subtopics: ["Periodic Table", "Chemical Bonding", "s-block Elements", "p-block Elements", "d & f-block", "Coordination Compounds"] },
        ]
      },
      {
        name: "Mathematics", icon: Calculator, color: "purple",
        topics: [
          { name: "Algebra", subtopics: ["Complex Numbers", "Quadratic Equations", "Sequences & Series", "Matrices & Determinants", "Permutation & Combination"] },
          { name: "Calculus", subtopics: ["Limits", "Differentiation", "Integration", "Differential Equations", "Area Under Curves"] },
          { name: "Coordinate Geometry", subtopics: ["Straight Lines", "Circles", "Parabola", "Ellipse", "Hyperbola"] },
          { name: "Trigonometry & Vectors", subtopics: ["Trigonometric Identities", "Inverse Trig", "Vectors", "3D Geometry"] },
        ]
      },
    ],
    examPattern: { total: "300 marks", duration: "3 hours", sections: "Physics (100) + Chemistry (100) + Maths (100)" },
    importantBooks: ["HC Verma (Physics)", "NCERT Chemistry", "RD Sharma / Cengage (Maths)", "VK Jaiswal (Inorganic)"]
  },

  "NEET_PCB": {
    label: "NEET UG",
    subjects: [
      {
        name: "Biology", icon: Atom, color: "green",
        topics: [
          { name: "Cell Biology & Genetics", subtopics: ["Cell Structure", "Cell Division", "Genetics & Heredity", "Molecular Basis of Inheritance", "Biotechnology"] },
          { name: "Human Physiology", subtopics: ["Digestion", "Respiration", "Circulation", "Excretion", "Locomotion", "Neural Control", "Endocrine System"] },
          { name: "Plant Biology", subtopics: ["Photosynthesis", "Plant Growth", "Mineral Nutrition", "Transport in Plants", "Reproduction in Plants"] },
          { name: "Ecology & Evolution", subtopics: ["Ecosystems", "Biodiversity", "Environmental Issues", "Evolution", "Origin of Life"] },
        ]
      },
      {
        name: "Chemistry", icon: FlaskConical, color: "blue",
        topics: [
          { name: "Physical Chemistry", subtopics: ["Solutions", "Electrochemistry", "Chemical Kinetics", "Surface Chemistry", "Thermodynamics"] },
          { name: "Organic Chemistry", subtopics: ["Biomolecules", "Polymers", "Chemistry in Everyday Life", "Amines", "Aldehydes & Ketones"] },
          { name: "Inorganic Chemistry", subtopics: ["d-block Elements", "Coordination Compounds", "p-block Elements", "Metallurgy"] },
        ]
      },
      {
        name: "Physics", icon: Calculator, color: "purple",
        topics: [
          { name: "Mechanics & Thermodynamics", subtopics: ["Laws of Motion", "Work-Energy Theorem", "Thermodynamics", "Kinetic Theory"] },
          { name: "Electrostatics & Current", subtopics: ["Electrostatics", "Current Electricity", "Magnetic Effects", "EMI"] },
          { name: "Modern Physics", subtopics: ["Dual Nature", "Atoms & Nuclei", "Semiconductor Devices"] },
        ]
      },
    ],
    examPattern: { total: "720 marks", duration: "3 hours 20 min", sections: "Biology (360) + Physics (180) + Chemistry (180)" },
    importantBooks: ["NCERT Biology (must)", "DC Pandey (Physics)", "NCERT Chemistry", "Trueman's Biology"]
  },

  "Software Development": {
    label: "Software Engineering Interviews",
    subjects: [
      {
        name: "Data Structures & Algorithms", icon: FileCode, color: "blue",
        topics: [
          { name: "Arrays & Strings", subtopics: ["Two Pointers", "Sliding Window", "Kadane's Algorithm", "String Manipulation", "Prefix Sum"] },
          { name: "Trees & Graphs", subtopics: ["Binary Trees", "BST", "BFS/DFS", "Dijkstra's", "Union Find", "Topological Sort"] },
          { name: "Dynamic Programming", subtopics: ["Memoization", "Tabulation", "Knapsack", "LCS/LIS", "Matrix DP"] },
          { name: "Sorting & Searching", subtopics: ["Quick Sort", "Merge Sort", "Binary Search", "Heap Sort"] },
          { name: "Linked List & Stack/Queue", subtopics: ["Reversal", "Cycle Detection", "LRU Cache", "Monotonic Stack"] },
        ]
      },
      {
        name: "System Design", icon: Network, color: "purple",
        topics: [
          { name: "Fundamentals", subtopics: ["CAP Theorem", "Load Balancing", "Caching (Redis)", "CDN", "Consistent Hashing"] },
          { name: "Database Design", subtopics: ["SQL vs NoSQL", "Sharding", "Replication", "Indexing", "ACID Properties"] },
          { name: "Real Systems", subtopics: ["Design Netflix", "Design Twitter", "Design Uber", "Design WhatsApp", "Rate Limiter"] },
          { name: "Microservices", subtopics: ["API Gateway", "Message Queues", "Service Discovery", "Circuit Breaker"] },
        ]
      },
      {
        name: "Core CS Concepts", icon: Cpu, color: "green",
        topics: [
          { name: "Operating Systems", subtopics: ["Processes & Threads", "Deadlocks", "Memory Management", "File Systems", "Scheduling"] },
          { name: "Computer Networks", subtopics: ["TCP/IP", "HTTP/HTTPS", "DNS", "REST vs GraphQL", "WebSockets"] },
          { name: "DBMS", subtopics: ["Normalization", "Transactions", "Joins", "Query Optimization", "Triggers"] },
          { name: "OOP & Design Patterns", subtopics: ["SOLID Principles", "Singleton", "Observer", "Factory", "Strategy Pattern"] },
        ]
      },
    ],
    examPattern: { total: "3-5 rounds", duration: "45-60 min each", sections: "DSA + System Design + Behavioral + HR" },
    importantBooks: ["Cracking the Coding Interview", "System Design Interview (Alex Xu)", "DDIA (Kleppmann)", "Clean Code"]
  },

  "Data Science / AI / ML": {
    label: "Data Science & ML Interviews",
    subjects: [
      {
        name: "Machine Learning", icon: Brain, color: "blue",
        topics: [
          { name: "Supervised Learning", subtopics: ["Linear Regression", "Logistic Regression", "Decision Trees", "Random Forest", "Gradient Boosting", "SVM"] },
          { name: "Unsupervised Learning", subtopics: ["K-Means", "DBSCAN", "PCA", "t-SNE", "Autoencoders"] },
          { name: "Deep Learning", subtopics: ["Neural Networks", "CNNs", "RNNs/LSTMs", "Transformers", "Attention Mechanism", "Transfer Learning"] },
          { name: "MLOps & Production", subtopics: ["Feature Engineering", "Model Evaluation", "A/B Testing", "Model Serving", "Data Drift"] },
        ]
      },
      {
        name: "Statistics & Mathematics", icon: Calculator, color: "green",
        topics: [
          { name: "Probability & Stats", subtopics: ["Probability Distributions", "Bayes Theorem", "Central Limit Theorem", "Hypothesis Testing", "p-values"] },
          { name: "Linear Algebra", subtopics: ["Matrix Operations", "Eigenvalues", "SVD", "Dot Products", "Vector Spaces"] },
          { name: "Calculus", subtopics: ["Gradients", "Chain Rule", "Backpropagation", "Optimization (SGD/Adam)"] },
        ]
      },
      {
        name: "SQL & Data Engineering", icon: Database, color: "purple",
        topics: [
          { name: "SQL", subtopics: ["Window Functions", "CTEs", "Subqueries", "Joins", "Group By & Having", "Query Optimization"] },
          { name: "Data Pipeline", subtopics: ["ETL/ELT", "Apache Spark", "Airflow", "Data Warehouses", "Kafka"] },
          { name: "Python", subtopics: ["Pandas", "NumPy", "Scikit-learn", "Matplotlib/Seaborn", "PySpark"] },
        ]
      },
    ],
    examPattern: { total: "4-6 rounds", duration: "45-60 min each", sections: "Coding + ML Theory + Stats + Case Study + System Design" },
    importantBooks: ["Hands-On ML (Géron)", "Python ML (Raschka)", "Intro to Statistical Learning", "Deep Learning (Goodfellow)"]
  },

  "Finance / Accounting": {
    label: "Finance & Investment Banking",
    subjects: [
      {
        name: "Financial Modeling", icon: BarChart3, color: "green",
        topics: [
          { name: "Valuation Methods", subtopics: ["DCF Analysis", "Comparable Company Analysis", "Precedent Transactions", "LBO Model", "Sum of Parts"] },
          { name: "Financial Statements", subtopics: ["Income Statement", "Balance Sheet", "Cash Flow Statement", "Ratio Analysis", "Working Capital"] },
          { name: "Excel & Modeling", subtopics: ["3-Statement Model", "Sensitivity Analysis", "Scenario Analysis", "Pivot Tables", "INDEX/MATCH"] },
        ]
      },
      {
        name: "Investment Banking", icon: TrendingUp, color: "blue",
        topics: [
          { name: "M&A Concepts", subtopics: ["Accretion/Dilution", "Purchase Price Allocation", "Synergies", "Deal Structuring", "Due Diligence"] },
          { name: "Capital Markets", subtopics: ["IPO Process", "Debt Issuance", "Rights Issues", "Bond Pricing", "Yield Calculations"] },
          { name: "Technical Q&A", subtopics: ["Walk me through a DCF", "Preferred Valuation Method", "Enterprise vs Equity Value", "Beta Unlevering"] },
        ]
      },
    ],
    examPattern: { total: "3-4 rounds", duration: "45-60 min each", sections: "Technical + Modeling Test + Behavioral + Partner" },
    importantBooks: ["Investment Banking (Rosenbaum)", "Financial Modeling (Benninga)", "WSP/Breaking Into Wall Street"]
  },

  "Product Management": {
    label: "Product Management Interviews",
    subjects: [
      {
        name: "Product Frameworks", icon: Layers, color: "purple",
        topics: [
          { name: "Product Design", subtopics: ["CIRCLES Method", "User Personas", "Pain Points", "Prioritization Frameworks", "MVP Definition"] },
          { name: "Metrics & Analytics", subtopics: ["HEART Framework", "North Star Metric", "Funnels", "Cohort Analysis", "A/B Testing"] },
          { name: "Strategy", subtopics: ["Market Sizing", "Competitive Analysis", "GTM Strategy", "Pricing", "Build vs Buy"] },
        ]
      },
      {
        name: "Execution & Leadership", icon: Target, color: "blue",
        topics: [
          { name: "Stakeholder Management", subtopics: ["Cross-functional Alignment", "Roadmap Planning", "OKRs", "Prioritization", "Trade-off Decisions"] },
          { name: "Technical Fluency", subtopics: ["APIs", "Databases Basics", "System Architecture", "Agile/Scrum", "Technical Debt"] },
        ]
      },
    ],
    examPattern: { total: "4-5 rounds", duration: "45-60 min each", sections: "Product Design + Strategy + Metrics + Behavioral + Leadership" },
    importantBooks: ["Inspired (Cagan)", "Decode and Conquer", "Cracking the PM Interview", "Lenny's Newsletter"]
  },

  "Consulting": {
    label: "Management Consulting (MBB)",
    subjects: [
      {
        name: "Case Interviews", icon: Brain, color: "blue",
        topics: [
          { name: "Case Types", subtopics: ["Profitability Cases", "Market Entry", "Market Sizing", "M&A Cases", "Operations", "Pricing Strategy"] },
          { name: "Frameworks", subtopics: ["Issue Tree", "Hypothesis-First", "MECE Principle", "Porter's 5 Forces", "3Cs/4Ps", "McKinsey 7S"] },
          { name: "Math & Charts", subtopics: ["Mental Math Speed", "Chart Interpretation", "Data Sufficiency", "Exhibits Analysis"] },
        ]
      },
      {
        name: "Fit & Behavioral", icon: MessageSquare, color: "green",
        topics: [
          { name: "Story Bank", subtopics: ["Leadership Example", "Failure & Learning", "Impact Story", "Conflict Resolution", "Why Consulting"] },
          { name: "Firm Knowledge", subtopics: ["McKinsey Culture", "BCG Approach", "Bain Values", "Firm Differentiators", "Recent Projects"] },
        ]
      },
    ],
    examPattern: { total: "3-5 rounds", duration: "45 min each", sections: "Case (60%) + Fit (40%) per round" },
    importantBooks: ["Case in Point (Cosentino)", "PrepLounge Library", "Victor Cheng's LOMS", "McKinsey Problem Solving Test"]
  },

  "Design (UI/UX)": {
    label: "UI/UX Design Interviews",
    subjects: [
      {
        name: "Design Process & Thinking", icon: Paintbrush, color: "purple",
        topics: [
          { name: "Design Thinking", subtopics: ["Empathize", "Define", "Ideate", "Prototype", "Test", "Iteration"] },
          { name: "User Research", subtopics: ["User Interviews", "Surveys", "Usability Testing", "Affinity Mapping", "Personas", "Journey Maps"] },
          { name: "Visual Design", subtopics: ["Typography", "Color Theory", "Spacing & Grids", "Iconography", "Motion Design"] },
          { name: "Interaction Design", subtopics: ["Micro-interactions", "Affordances", "Mental Models", "Flow Design", "Error States"] },
        ]
      },
      {
        name: "Tools & Portfolio", icon: Layers, color: "blue",
        topics: [
          { name: "Figma Mastery", subtopics: ["Components & Variants", "Auto Layout", "Prototyping", "Design Systems", "Dev Handoff"] },
          { name: "Portfolio Prep", subtopics: ["Case Study Structure", "Problem Statement", "Process Documentation", "Outcome Metrics", "Presentation Skills"] },
          { name: "Accessibility", subtopics: ["WCAG Guidelines", "Screen Readers", "Color Contrast", "Focus States", "ARIA Labels"] },
        ]
      },
    ],
    examPattern: { total: "3-4 rounds", duration: "45-60 min each", sections: "Portfolio Review + Design Challenge + Critique + Behavioral" },
    importantBooks: ["The Design of Everyday Things", "Don't Make Me Think", "Hooked (Eyal)", "Refactoring UI"]
  },

  "Marketing / Growth": {
    label: "Marketing & Growth Interviews",
    subjects: [
      {
        name: "Digital Marketing", icon: TrendingUp, color: "blue",
        topics: [
          { name: "SEO & Content", subtopics: ["Keyword Research", "On-page SEO", "Backlink Strategy", "Content Calendar", "SERP Analysis"] },
          { name: "Paid Advertising", subtopics: ["Google Ads", "Meta Ads", "Audience Targeting", "Bid Strategies", "ROAS Optimization"] },
          { name: "Email Marketing", subtopics: ["Segmentation", "A/B Testing", "Drip Campaigns", "Open Rate Optimization", "CRM Tools"] },
          { name: "Analytics", subtopics: ["Google Analytics 4", "Attribution Models", "Funnel Analysis", "Cohort Analysis", "UTM Tracking"] },
        ]
      },
      {
        name: "Growth Strategy", icon: BarChart3, color: "green",
        topics: [
          { name: "Growth Frameworks", subtopics: ["AARRR (Pirate Metrics)", "North Star Metric", "Growth Loops", "PLG Strategy", "Viral Coefficient"] },
          { name: "Brand & Positioning", subtopics: ["Brand Identity", "Value Proposition", "Competitive Positioning", "Messaging Framework", "GTM Strategy"] },
        ]
      },
    ],
    examPattern: { total: "3-4 rounds", duration: "45-60 min each", sections: "Strategy Case + Analytics + Campaign Design + Behavioral" },
    importantBooks: ["Traction (Weinberg)", "Hacking Growth (Ellis)", "Building a StoryBrand", "Obviously Awesome"]
  },

  "Human Resources": {
    label: "HR & People Operations Interviews",
    subjects: [
      {
        name: "Core HR Functions", icon: Users, color: "blue",
        topics: [
          { name: "Talent Acquisition", subtopics: ["Sourcing Strategies", "JD Writing", "Interview Frameworks", "Offer Negotiation", "Employer Branding"] },
          { name: "Performance Management", subtopics: ["OKRs & KPIs", "Review Cycles", "PIP Process", "360 Feedback", "Calibration"] },
          { name: "Compensation & Benefits", subtopics: ["Salary Benchmarking", "Total Rewards", "Equity Compensation", "Benefits Design", "Pay Equity"] },
          { name: "Employee Relations", subtopics: ["Conflict Resolution", "Grievance Process", "Disciplinary Procedures", "Engagement Surveys", "Culture Building"] },
        ]
      },
      {
        name: "HR Strategy & Compliance", icon: Shield, color: "green",
        topics: [
          { name: "Employment Law", subtopics: ["Labor Laws", "Anti-discrimination", "Termination Protocols", "Leave Policies", "POSH Compliance"] },
          { name: "HR Analytics", subtopics: ["Attrition Analysis", "Hiring Funnel Metrics", "Workforce Planning", "HRIS Tools", "Dashboards"] },
        ]
      },
    ],
    examPattern: { total: "3-4 rounds", duration: "45 min each", sections: "Technical HR + Case Study + Behavioral + Culture Fit" },
    importantBooks: ["Work Rules (Bock)", "The HR Scorecard", "First, Break All the Rules", "SHRM Body of Knowledge"]
  },

  "Operations": {
    label: "Operations & Supply Chain Interviews",
    subjects: [
      {
        name: "Operations Management", icon: Cpu, color: "blue",
        topics: [
          { name: "Process Improvement", subtopics: ["Lean Six Sigma", "Value Stream Mapping", "5S Methodology", "Kaizen", "Root Cause Analysis"] },
          { name: "Supply Chain", subtopics: ["Demand Forecasting", "Inventory Management", "Vendor Management", "Logistics", "Last-mile Delivery"] },
          { name: "Project Management", subtopics: ["Agile & Scrum", "PMP Concepts", "Risk Management", "Gantt Charts", "RACI Matrix"] },
          { name: "Quality Management", subtopics: ["ISO Standards", "Quality Audits", "SLA Management", "CAPA Process", "Statistical Process Control"] },
        ]
      },
    ],
    examPattern: { total: "3-4 rounds", duration: "45-60 min each", sections: "Case Study + Technical Ops + Behavioral + Leadership" },
    importantBooks: ["The Goal (Goldratt)", "Operations Management (Slack)", "Lean Thinking", "Project Management Body of Knowledge"]
  },

  "Sales": {
    label: "Sales & Business Development Interviews",
    subjects: [
      {
        name: "Sales Fundamentals", icon: TrendingUp, color: "blue",
        topics: [
          { name: "Sales Process", subtopics: ["Prospecting & Lead Gen", "Discovery Calls", "Needs Analysis", "Proposal & Demo", "Closing Techniques", "Follow-up"] },
          { name: "Sales Frameworks", subtopics: ["SPIN Selling", "Challenger Sale", "MEDDIC", "Value-Based Selling", "Solution Selling"] },
          { name: "Account Management", subtopics: ["Customer Success", "Upsell & Cross-sell", "QBRs", "Churn Prevention", "NPS & CSAT"] },
          { name: "CRM & Tools", subtopics: ["Salesforce", "HubSpot", "Pipeline Management", "Forecasting", "Sales Automation"] },
        ]
      },
    ],
    examPattern: { total: "3-4 rounds", duration: "30-60 min each", sections: "Role Play + Sales Case + Behavioral + Leadership" },
    importantBooks: ["SPIN Selling (Rackham)", "The Challenger Sale", "To Sell Is Human (Pink)", "Fanatical Prospecting"]
  },

  "DevOps / Cloud": {
    label: "DevOps & Cloud Engineering Interviews",
    subjects: [
      {
        name: "Cloud Platforms", icon: Network, color: "blue",
        topics: [
          { name: "AWS Core Services", subtopics: ["EC2 & ECS", "S3 & CloudFront", "RDS & DynamoDB", "Lambda & API Gateway", "VPC & Security Groups", "IAM"] },
          { name: "Infrastructure as Code", subtopics: ["Terraform", "CloudFormation", "Ansible", "Pulumi", "Helm Charts"] },
          { name: "Kubernetes & Docker", subtopics: ["Pods & Deployments", "Services & Ingress", "ConfigMaps & Secrets", "HPA & VPA", "Helm", "Service Mesh"] },
        ]
      },
      {
        name: "DevOps Practices", icon: Cpu, color: "green",
        topics: [
          { name: "CI/CD Pipelines", subtopics: ["GitHub Actions", "Jenkins", "ArgoCD", "Blue-Green Deployments", "Canary Releases", "Feature Flags"] },
          { name: "Observability", subtopics: ["Prometheus & Grafana", "ELK Stack", "Distributed Tracing", "SLI/SLO/SLA", "Incident Management"] },
          { name: "Security", subtopics: ["DevSecOps", "SAST/DAST", "Secrets Management", "Zero Trust", "Compliance Automation"] },
        ]
      },
    ],
    examPattern: { total: "4-5 rounds", duration: "45-60 min each", sections: "System Design + Coding + Cloud Architecture + Behavioral" },
    importantBooks: ["The Phoenix Project", "The DevOps Handbook", "Kubernetes in Action", "AWS Solutions Architect Guide"]
  },

  "Cybersecurity": {
    label: "Cybersecurity Interviews",
    subjects: [
      {
        name: "Security Fundamentals", icon: Shield, color: "blue",
        topics: [
          { name: "Network Security", subtopics: ["Firewalls & IDS/IPS", "VPN & Zero Trust", "Network Protocols", "Packet Analysis", "DDoS Mitigation"] },
          { name: "Application Security", subtopics: ["OWASP Top 10", "SQL Injection", "XSS & CSRF", "Secure SDLC", "Penetration Testing"] },
          { name: "Cryptography", subtopics: ["Symmetric & Asymmetric Encryption", "PKI & Certificates", "Hashing Algorithms", "TLS/SSL", "Key Management"] },
          { name: "Incident Response", subtopics: ["Threat Detection", "SIEM Tools", "Forensic Analysis", "Containment & Recovery", "Post-mortem"] },
        ]
      },
    ],
    examPattern: { total: "3-5 rounds", duration: "45-60 min each", sections: "Technical + CTF Challenge + Behavioral + System Design" },
    importantBooks: ["The Web Application Hacker's Handbook", "CompTIA Security+ Study Guide", "Hacking: The Art of Exploitation", "CISSP All-in-One"]
  },
};

const STREAM_TO_SYLLABUS_KEY = {
  "PCM_JEE":       "JEE_PCM",
  "PCB_NEET":      "NEET_PCB",
  "PCMB":          "JEE_PCM",
  "CS_Engg":       "Software Development",
  "BCA":           "Software Development",
  "MCA":           "Software Development",
  "Diploma_CS":    "Software Development",
  "ECE_Engg":      "Software Development",
  "EEE_Engg":      "DevOps / Cloud",
  "Mech_Engg":     "Operations",
  "Civil_Engg":    "Operations",
  "Chem_Engg":     "Operations",
  "Aero_Engg":     "Operations",
  "BioTech":       "Pharma / Biotech",
  "CloudComp":     "DevOps / Cloud",
  "Cybersec_PG":   "Cybersecurity",
  "DataSci_PG":    "Data Science / AI / ML",
  "BSc_CS":        "Software Development",
  "BSc_Math":      "Data Science / AI / ML",
  "BSc_Physics":   "Data Science / AI / ML",
  "BSc_Chem":      "Pharma / Biotech",
  "MSc_Research":  "Research / Academia",
  "PhD_STEM":      "Research / Academia",
  "PhD_Hum":       "Research / Academia",
  "NET_JRF":       "Education / EdTech",
  "GATE_PG":       "Software Development",
  "Commerce_12":   "Finance / Accounting",
  "BCom":          "Finance / Accounting",
  "BBA":           "Consulting",
  "MBA_Finance":   "Investment Banking",
  "MBA_Marketing": "Marketing / Growth",
  "MBA_HR":        "Human Resources",
  "MBA_Ops":       "Operations",
  "MBA_General":   "Consulting",
  "CA_Foundation": "Tax / Audit",
  "CFA_Level":     "Investment Banking",
  "CAT_MBA":       "Consulting",
  "Arts_12":       "Content Creation",
  "BA_GenLit":     "Content Creation",
  "BA_Eco":        "Finance / Accounting",
  "BA_Psych":      "Human Resources",
  "BA_Socio":      "Government / Policy",
  "BDes_UXUI":     "Design (UI/UX)",
  "BDes_Graphic":  "Graphic Design",
  "BDes_Fashion":  "Graphic Design",
  "BArch":         "Architecture / Interior",
  "BJourn":        "PR / Communications",
  "BFA":           "Content Creation",
  "MBBS":          "Healthcare / Clinical",
  "BDS":           "Healthcare / Clinical",
  "BAMS_BHMS":     "Healthcare / Clinical",
  "BPharm":        "Pharma / Biotech",
  "BPT_MPT":       "Healthcare / Clinical",
  "BScNursing":    "Healthcare / Clinical",
  "MLT":           "Health Tech",
  "PublicHealth":  "Government / Policy",
  "LLB_3yr":       "Legal",
  "BA_LLB":        "Legal",
  "UPSC_Civil":    "Government / Policy",
  "SSC_Exams":     "Government / Policy",
  "Banking_PO":    "Finance / Accounting",
  "Defence":       "Government / Policy",
  "RailwayExam":   "Government / Policy",
  "StateGovt":     "Government / Policy",
  "PCM (Physics, Chemistry, Maths)":   "JEE_PCM",
  "PCB (Physics, Chemistry, Biology)": "NEET_PCB",
  "Computer Science":                  "Software Development",
  "Commerce":                          "Finance / Accounting",
  "BSc":                               "Data Science / AI / ML",
  "Arts / Humanities":                 "Content Creation",
  "BCA / MCA":                         "Software Development",
  "Electronics Engineering":           "Software Development",
  "Mechanical Engineering":            "Operations",
  "Civil Engineering":                 "Operations",
  "MBA / Management":                  "Consulting",
};

function getSyllabusKey(profile) {
  if (!profile) return null;

  if (profile.userType === "student") {
    const cat = profile.studentCategory || profile.stream || "";
    if (STREAM_TO_SYLLABUS_KEY[cat]) return STREAM_TO_SYLLABUS_KEY[cat];
    if (cat.includes("PCM")) return "JEE_PCM";
    if (cat.includes("PCB")) return "NEET_PCB";
    const goalText = (profile.goals || []).join(" ").toLowerCase();
    if (goalText.includes("software") || goalText.includes("coding") || goalText.includes("developer")) return "Software Development";
    if (goalText.includes("data") || goalText.includes("ml") || goalText.includes("ai")) return "Data Science / AI / ML";
    if (goalText.includes("finance") || goalText.includes("banking") || goalText.includes("ca ")) return "Finance / Accounting";
    if (goalText.includes("product") || goalText.includes(" pm")) return "Product Management";
    if (goalText.includes("design") || goalText.includes("ux") || goalText.includes("ui")) return "Design (UI/UX)";
    if (goalText.includes("doctor") || goalText.includes("mbbs") || goalText.includes("neet")) return "Healthcare / Clinical";
    if (goalText.includes("upsc") || goalText.includes("ias") || goalText.includes("govt")) return "Government / Policy";
    if (goalText.includes("law") || goalText.includes("llb")) return "Legal";
    return "Software Development";
  }

  return profile.domain || "Software Development";
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function PreparationPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm]         = useState("");
  const [profile, setProfile]               = useState(null);
  const [resources, setResources]           = useState([]);
  const [loading, setLoading]               = useState(true);
  const [regenerating, setRegenerating]     = useState(false);
  const [savedResources, setSavedResources] = useState(new Set());
  const [aiGenerated, setAiGenerated]       = useState(false);
  const [expandedCard, setExpandedCard]     = useState(null);
  const [activeTab, setActiveTab]           = useState("resources");
  const [careerDomain, setCareerDomain]     = useState(null);
  const [careerRole, setCareerRole]         = useState(null);
  const [syllabusOpen, setSyllabusOpen]     = useState({});

  useEffect(() => { if (user) fetchProfileAndResources(); }, [user]);

  const fetchProfileAndResources = async () => {
    try {
      setLoading(true);
      const profileRes  = await fetch(`${API_URL}/users/profile/${user.id}`);
      const profileData = await profileRes.json();
      const raw = profileData.success ? profileData.data : null;
      const p = raw ? {
        ...raw,
        domain:          normalizeDomain(raw.domain),
        stream:          normalizeStream(raw.stream),
        studentCategory: raw.studentCategory || normalizeStream(raw.stream) || "",
      } : null;
      setProfile(p);
      await loadResources(p);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const loadResources = async (p, forceRegenerate = false) => {
    try {
      if (forceRegenerate) {
        setRegenerating(true);
        const res  = await fetch(`${API_URL}/preparation/resources/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile: p }),
        });
        const data = await res.json();
        if (data.success && data.data?.length > 0) {
          setResources(data.data);
          setAiGenerated(true);
          toast.success("✨ AI generated personalized resources!");
        }
        return;
      }

      const params = new URLSearchParams();
      if (p) {
        const cleanDomain = normalizeDomain(p.domain) || "";
        const cleanStream = normalizeStream(p.stream)  || "";
        params.set("userId",          user.id);
        params.set("userType",        p.userType        || "");
        params.set("studentClass",    p.studentClass    || "");
        params.set("stream",          cleanStream);
        params.set("domain",          cleanDomain);
        params.set("experienceLevel", p.experienceLevel || "");
        if (p.skills?.length) params.set("skills", p.skills.join(","));
        if (p.goals?.length)  params.set("goals",  p.goals.join(","));
      }

      const res  = await fetch(`${API_URL}/preparation/resources?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        setResources(data.data);
        setAiGenerated(data.aiGenerated || false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not load resources");
    } finally {
      setRegenerating(false);
    }
  };

  const handleRegenerate  = async () => { if (profile) await loadResources(profile, true); };
  const handleSave        = (id) => {
    setSavedResources(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); toast.success("Removed from saved"); }
      else              { next.add(id);    toast.success("Saved ✓"); }
      return next;
    });
  };
  const handleView = (resource) => {
    if (resource.type === "practice") { navigate("/interviews"); toast.success("Starting practice…"); return; }
    if (resource.externalUrl) window.open(resource.externalUrl, "_blank", "noopener,noreferrer");
    else toast("Opening resource…");
  };
  const handleShare = async (resource) => {
    const url = resource.externalUrl || window.location.href;
    try { await navigator.clipboard.writeText(`${resource.title}\n${url}`); toast.success("Link copied!"); }
    catch { toast("Could not copy"); }
  };

  const isStudent   = profile?.userType === "student";
  const isJobseeker = profile?.userType === "jobseeker";
  const domainColor = getDomainColor(profile);
  const syllabusKey = getSyllabusKey(profile);
  const syllabus    = syllabusKey ? SYLLABUS_DATA[syllabusKey] : null;

  const allCategories = [
    { id: "all",        name: "All",        icon: Layers },
    { id: "technical",  name: "Technical",  icon: Code },
    { id: "behavioral", name: "Behavioral", icon: MessageSquare },
    { id: "competitive",name: "Competitive",icon: Target },
    { id: "academic",   name: "Academic",   icon: BookOpen },
    { id: "career",     name: "Career",     icon: Briefcase },
    { id: "practice",   name: "Practice",   icon: Zap },
  ].filter(c => c.id === "all" || resources.some(r => r.category === c.id));

  const filteredResources = resources.filter(r => {
    const matchCat    = activeCategory === "all" || r.category === activeCategory;
    const q           = searchTerm.toLowerCase();
    const matchSearch = !q || r.title?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q) || (r.tags||[]).some(t => t.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  const syllabusLabel = syllabus?.label || (profile?.domain || profile?.stream || "Your Domain");
  const pageTitle = isStudent
    ? `${profile?.studentClass || "Student"} · ${profile?.stream || "General"} — Prep Hub`
    : isJobseeker
    ? `${profile?.domain || "Career"} — Interview Prep`
    : "Interview Preparation Hub";

  if (loading) return (
    <div className="min-h-screen bg-[#f7f8fc]">
      
      <div className="flex items-center justify-center h-[calc(100vh-70px)]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto animate-pulse">
            <Loader className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-gray-900 font-semibold">Personalizing your prep hub…</p>
          <p className="text-gray-400 text-sm">Building syllabus, roadmap &amp; resources for you</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">

        {/* ── Hero Banner ─────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl p-5 sm:p-8 text-white"
          style={{ background: `linear-gradient(135deg, ${domainColor.from} 0%, ${domainColor.to} 100%)` }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white blur-3xl -translate-y-1/3 translate-x-1/4" />
            <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-white blur-2xl translate-y-1/2" />
          </div>
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {isStudent   && <span className="flex items-center gap-1.5 text-xs font-bold bg-white/20 px-3 py-1 rounded-full"><GraduationCap className="w-3.5 h-3.5" /> Student Mode</span>}
                {isJobseeker && <span className="flex items-center gap-1.5 text-xs font-bold bg-white/20 px-3 py-1 rounded-full"><Briefcase className="w-3.5 h-3.5" /> Professional Mode</span>}
                {aiGenerated && <span className="flex items-center gap-1.5 text-xs font-bold bg-white/20 px-3 py-1 rounded-full"><Sparkles className="w-3.5 h-3.5" /> AI Personalized</span>}
                {syllabus    && <span className="flex items-center gap-1.5 text-xs font-bold bg-white/20 px-3 py-1 rounded-full"><BookMarked className="w-3.5 h-3.5" /> Full Syllabus Available</span>}
              </div>
              <h1 className="text-xl sm:text-3xl font-black mb-2 leading-tight">{pageTitle}</h1>
              <p className="text-white/80 text-xs sm:text-sm max-w-xl">
                {isStudent
                  ? `Complete ${syllabusLabel} prep for ${profile?.studentClass || ""} ${profile?.stream || ""} · ${resources.length} curated resources`
                  : `End-to-end prep for ${profile?.domain || "your field"} · ${profile?.experienceLevel || ""} level · ${resources.length} curated resources`}
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3 flex-wrap">
              <button onClick={handleRegenerate} disabled={regenerating} className="flex items-center gap-2 bg-white/15 backdrop-blur border border-white/30 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-white/25 transition-all disabled:opacity-50">
                {regenerating ? <><Loader className="w-4 h-4 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4" /> Regenerate with AI</>}
              </button>
              <button onClick={() => navigate("/interviews")} className="flex items-center gap-2 bg-white text-gray-900 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:shadow-lg hover:scale-105 transition-all">
                <Zap className="w-4 h-4" style={{ color: domainColor.from }} /> Start Mock Interview
              </button>
            </div>
          </div>
        </div>

        {/* ── Stats Row ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: BookOpen,  label: "Resources",    value: resources.length, color: "indigo" },
            { icon: Zap,       label: "Practice Sets", value: resources.filter(r => r.type === "practice").length, color: "violet" },
            { icon: Star,      label: "Avg Rating",    value: resources.length ? `${(resources.reduce((a,r)=>a+(r.rating||0),0)/resources.length).toFixed(1)}` : "—", color: "amber" },
            { icon: Bookmark,  label: "Saved",         value: savedResources.size, color: "emerald" },
          ].map((s,i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                s.color==="indigo"  ? "bg-indigo-50 text-indigo-600"  :
                s.color==="violet"  ? "bg-violet-50 text-violet-600"  :
                s.color==="amber"   ? "bg-amber-50 text-amber-600"    :
                                      "bg-emerald-50 text-emerald-600"}`}>
                <s.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-black text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tab Nav ────────────────────────────────────────────────── */}
        {/* Mobile: 2x2 grid; sm+: single row */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 grid grid-cols-2 sm:flex gap-1">
          {[
            { id: "resources", label: "Resources & Videos", icon: BookOpen },
            { id: "syllabus",  label: "Full Syllabus",       icon: List },
            { id: "roadmap",   label: "Learning Roadmap",    icon: TrendingUp },
            { id: "careers",   label: "Career Explorer",     icon: Compass },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all sm:flex-1 ${
                activeTab === tab.id
                  ? "text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
              style={activeTab === tab.id ? { background: `linear-gradient(135deg, ${domainColor.from}, ${domainColor.to})` } : {}}
            >
              <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            TAB 1: RESOURCES
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === "resources" && (
          <>
            {/* Search & Filter */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text" placeholder="Search resources, topics, tags…"
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                    style={{ "--tw-ring-color": domainColor.from }}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {allCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                        activeCategory === cat.id ? "text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      style={activeCategory === cat.id ? { background: `linear-gradient(135deg, ${domainColor.from}, ${domainColor.to})` } : {}}
                    >
                      <cat.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      {cat.name}
                      <span className="text-xs opacity-60">({cat.id==="all" ? resources.length : resources.filter(r=>r.category===cat.id).length})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Resources Grid */}
            {filteredResources.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-12 sm:py-16 text-center px-4">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-semibold text-gray-900 mb-1">No resources found</p>
                <p className="text-gray-500 text-sm mb-4">Try a different search or category</p>
                <button onClick={() => { setSearchTerm(""); setActiveCategory("all"); }} className="text-sm font-medium" style={{ color: domainColor.from }}>Clear filters</button>
              </div>
            ) : (
              <>
                {regenerating && (
                  <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <Loader className="w-5 h-5 text-purple-600 animate-spin flex-shrink-0" />
                    <p className="text-purple-700 text-sm font-medium">AI is generating personalized resources…</p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {filteredResources.map(resource => (
                    <ResourceCard
                      key={resource._id}
                      resource={resource}
                      isSaved={savedResources.has(resource._id)}
                      isExpanded={expandedCard === resource._id}
                      onToggleExpand={() => setExpandedCard(expandedCard === resource._id ? null : resource._id)}
                      onSave={() => handleSave(resource._id)}
                      onView={() => handleView(resource)}
                      onShare={() => handleShare(resource)}
                      accentColor={domainColor.from}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 2: FULL SYLLABUS
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === "syllabus" && (
          <div className="space-y-4 sm:space-y-6">
          {!syllabus && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-10 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-bold text-gray-800 text-lg mb-1">Syllabus content is loading</p>
              <p className="text-gray-500 text-sm mb-4">We are building your personalized {profile?.domain || profile?.stream || "domain"} syllabus. Try regenerating resources or update your profile.</p>
              <button onClick={() => loadResources(profile, true)} className="text-sm font-semibold px-4 py-2 rounded-xl text-white" style={{background: `linear-gradient(135deg, ${domainColor.from}, ${domainColor.to})`}}>Regenerate Resources</button>
            </div>
          )}
          {!!syllabus && <>
            {/* Exam Pattern Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: domainColor.light }}>
                  <AlertCircle className="w-5 h-5" style={{ color: domainColor.from }} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Exam / Interview Pattern</h2>
                  <p className="text-xs text-gray-500">{syllabus.label}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                {[
                  { label: "Total Marks / Rounds", value: syllabus.examPattern.total },
                  { label: "Duration",              value: syllabus.examPattern.duration },
                  { label: "Sections",              value: syllabus.examPattern.sections },
                ].map((e,i) => (
                  <div key={i} className="p-3 sm:p-4 rounded-xl" style={{ background: domainColor.light }}>
                    <p className="text-xs text-gray-500 mb-1">{e.label}</p>
                    <p className="text-sm font-bold text-gray-900">{e.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recommended Books / Resources</p>
                <div className="flex flex-wrap gap-2">
                  {syllabus.importantBooks.map((b,i) => (
                    <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium flex items-center gap-1.5">
                      <BookMarked className="w-3 h-3 flex-shrink-0" /> {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Subject Cards */}
            {syllabus.subjects.map((subject, si) => {
              const SubjectIcon = subject.icon;
              const isOpen = syllabusOpen[si] !== false;
              return (
                <div key={si} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-gray-50 transition-colors"
                    onClick={() => setSyllabusOpen(prev => ({ ...prev, [si]: !isOpen }))}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        subject.color==="blue"  ? "bg-blue-50 text-blue-600"  :
                        subject.color==="green" ? "bg-green-50 text-green-600":
                        subject.color==="purple"? "bg-purple-50 text-purple-600": "bg-gray-100 text-gray-600"
                      }`}>
                        <SubjectIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base">{subject.name}</h3>
                        <p className="text-xs text-gray-500">{subject.topics.length} topics · {subject.topics.reduce((a,t)=>a+t.subtopics.length,0)} subtopics</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {subject.topics.map((topic, ti) => (
                        <div key={ti} className="border border-gray-100 rounded-xl p-3 sm:p-4 hover:border-gray-300 transition-colors">
                          <div className="flex items-center gap-2 mb-3">
                            <Hash className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <p className="text-sm font-bold text-gray-900">{topic.name}</p>
                          </div>
                          <ul className="space-y-1.5">
                            {topic.subtopics.map((sub, subi) => (
                              <li key={subi} className="flex items-center gap-2 text-xs text-gray-600">
                                <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                                {sub}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Practice CTA */}
            <div className="rounded-2xl p-5 sm:p-6 text-white text-center" style={{ background: `linear-gradient(135deg, ${domainColor.from}, ${domainColor.to})` }}>
              <Zap className="w-8 h-8 mx-auto mb-3 opacity-90" />
              <h3 className="text-lg font-black mb-2">Ready to test your knowledge?</h3>
              <p className="text-white/80 text-sm mb-4">Take a mock interview with questions from this exact syllabus</p>
              <button onClick={() => navigate("/interviews")} className="bg-white text-gray-900 px-6 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:scale-105 transition-all inline-flex items-center gap-2">
                <PlayCircle className="w-4 h-4" style={{ color: domainColor.from }} /> Start Mock Interview
              </button>
            </div>
          </>}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 3: LEARNING ROADMAP
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === "roadmap" && (
          <div className="space-y-4 sm:space-y-5">
            {/* Profile context banner */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: domainColor.light }}>
                  <Target className="w-5 h-5" style={{ color: domainColor.from }} />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-gray-900 mb-1">Your Personalized Roadmap</h2>
                  <p className="text-sm text-gray-500">
                    {isStudent
                      ? `Structured path for ${profile?.studentClass || ""} ${profile?.stream || ""} → ${(profile?.goals||[]).join(", ") || syllabusKey || "career excellence"}`
                      : `Designed for ${profile?.domain} · ${profile?.experienceLevel} · targeting ${(profile?.targetRoles||[]).join(", ") || "your dream role"}`
                    }
                  </p>
                  {profile?.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {profile.skills.map((s,i) => (
                        <span key={i} className="px-2.5 py-1 text-xs font-semibold rounded-lg" style={{ background: domainColor.light, color: domainColor.from }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Roadmap Steps */}
            <div className="space-y-4">
              {(() => {
              const isBoardStudent = isStudent && (profile?.stream?.includes("PCM") || profile?.stream?.includes("PCB"));
              const roadmapDomain  = syllabusKey || profile?.domain || "Software Development";
              return (isBoardStudent ? [
                {
                  step: 1, phase: "Foundation",
                  title: "Master NCERT & Core Concepts",
                  desc: `Start with NCERT textbooks — they form the base of all board and entrance exams. Cover every chapter systematically for ${profile?.stream || "your stream"}.`,
                  duration: "4–6 weeks",
                  actions: ["Complete NCERT for all subjects", "Make chapter-wise notes", "Solve NCERT exercises & examples", "Watch concept videos for tough topics"],
                  color: "blue", icon: BookOpen
                },
                {
                  step: 2, phase: "Practice",
                  title: "Topic-wise Practice & Problem Solving",
                  desc: `Once concepts are clear, solve topic-wise problems progressively. Move from easy → medium → hard. Focus on weak areas identified from mistakes.`,
                  duration: "6–8 weeks",
                  actions: ["Solve topic-wise MCQs (100+ per topic)", "Attempt previous year questions", "Take weekly chapter tests", "Track and revisit mistakes"],
                  color: "violet", icon: Brain
                },
                {
                  step: 3, phase: "Mock Tests",
                  title: "Full-Length Mock Tests & Revision",
                  desc: `Simulate real exam conditions. Take full-length mocks, analyze performance, and revise weak areas. Aim for at least 10 full mocks before the exam.`,
                  duration: "4–6 weeks",
                  actions: ["Take 1 full mock test every 3 days", "Analyse mistakes deeply", "Quick revision of formulas & concepts", "Work on speed and accuracy"],
                  color: "emerald", icon: Target
                },
                {
                  step: 4, phase: "Final Sprint",
                  title: "Last-Mile Prep & Confidence Building",
                  desc: `In the last 2 weeks: quick revision, important formulas, high-weightage chapters only. Stay healthy, manage stress, and trust your preparation.`,
                  duration: "1–2 weeks",
                  actions: ["Revise all formula sheets", "Solve only high-weightage topics", "Light revision of previous mocks", "Rest well & manage exam stress"],
                  color: "amber", icon: Award
                }
              ] : [
                {
                  step: 1, phase: "Foundation",
                  title: `Master ${roadmapDomain} Fundamentals`,
                  desc: `Build a deep understanding of ${roadmapDomain} concepts. Study the core topics, tools, and frameworks that appear in interviews and real-world work.`,
                  duration: "3–4 weeks",
                  actions: ["Read recommended books & docs", `Study core ${roadmapDomain} concepts`, "Complete relevant online courses", "Build foundational hands-on projects"],
                  color: "blue", icon: BookOpen
                },
                {
                  step: 2, phase: "Skill Building",
                  title: "Deep-dive into Your Skill Stack",
                  desc: `Focus intensively on your listed skills: ${profile?.skills?.join(", ") || roadmapDomain + " core skills"}. Build projects and solve problems that use these technologies directly.`,
                  duration: "4–6 weeks",
                  actions: [
                    ...(profile?.skills?.slice(0,3) || ["Core skill"]).map(s => `Master ${s} with real problems`),
                    "Build 1-2 portfolio projects"
                  ],
                  color: "violet", icon: Code
                },
                {
                  step: 3, phase: "Interview Prep",
                  title: "Targeted Interview Preparation",
                  desc: `Focus on ${roadmapDomain}-specific interview patterns. Study the most common questions, practice clear explanations, and prepare behavioral stories using STAR method.`,
                  duration: "3–4 weeks",
                  actions: ["Study top 50 domain interview questions", "Prepare STAR behavioral stories", "Practice explaining past projects", "Research target companies"],
                  color: "emerald", icon: MessageSquare
                },
                {
                  step: 4, phase: "Mock Interviews",
                  title: "Mock Interviews & Final Polish",
                  desc: `Simulate real interviews end-to-end. Get feedback, work on weak spots, and build confidence. Aim for at least 5 complete mock interview sessions.`,
                  duration: "2–3 weeks",
                  actions: ["Take 5+ AI mock interviews", "Review and improve each answer", "Refine resume and LinkedIn", "Practice salary negotiation"],
                  color: "amber", icon: Award
                }
              ]).map(step => (
                <RoadmapStep key={step.step} step={step} accentFrom={domainColor.from} accentLight={domainColor.light} />
              ));
              })()}
            </div>

            {/* Weekly schedule suggestion */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: domainColor.light }}>
                  <Clock className="w-5 h-5" style={{ color: domainColor.from }} />
                </div>
                <h2 className="font-bold text-gray-900">Suggested Weekly Schedule</h2>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day, i) => {
                  const isBoardStudentSched = isStudent && (profile?.stream?.includes("PCM") || profile?.stream?.includes("PCB"));
                  const domainLabel = syllabusKey || profile?.domain || "Technical";
                  const plans = isBoardStudentSched
                    ? ["Physics concepts", "Chemistry practice", "Maths problems", "Mock test", "Weak area revision", "Full mock test", "Rest & revision"]
                    : [`${domainLabel} study`, "Problem solving", `${profile?.skills?.[0] || domainLabel} practice`, "Mock interview", "Behavioral prep", "Full mock session", "Rest & review"];
                  return (
                    <div key={i} className={`text-center p-2 sm:p-3 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors ${i >= 4 ? "hidden sm:block" : ""}`}>
                      <p className="text-xs font-bold text-gray-500 mb-1 sm:mb-2">{day}</p>
                      <p className="text-xs text-gray-700 leading-tight">{plans[i]}</p>
                    </div>
                  );
                })}
                {/* Show remaining days collapsed on mobile */}
                <div className="sm:hidden col-span-4 mt-1">
                  <p className="text-xs text-gray-400 text-center">+ Fri–Sun shown on larger screens</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-2xl p-5 sm:p-6 text-white text-center" style={{ background: `linear-gradient(135deg, ${domainColor.from}, ${domainColor.to})` }}>
              <Brain className="w-8 h-8 mx-auto mb-3 opacity-90" />
              <h3 className="text-lg font-black mb-1">Start your roadmap today</h3>
              <p className="text-white/80 text-sm mb-4">Practice with AI-powered mock interviews tailored to your profile</p>
              <button onClick={() => navigate("/interviews")} className="bg-white text-gray-900 px-6 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:scale-105 transition-all inline-flex items-center gap-2">
                <Zap className="w-4 h-4" style={{ color: domainColor.from }} /> Begin Practice Now
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 4: CAREER EXPLORER
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === "careers" && (() => {
          const allDomains = Object.keys(CAREER_DATA);
          const activeDomain = careerDomain || normalizeDomain(profile?.domain) || syllabusKey || allDomains[0];
          const career = CAREER_DATA[activeDomain];
          if (!career) return null;
          return (
            <div className="space-y-4 sm:space-y-5">

              {/* Domain selector */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Compass className="w-4 h-4 flex-shrink-0" style={{ color: domainColor.from }} />
                  <p className="text-sm font-bold text-gray-700">Explore any career field — click to switch</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allDomains.map(d => (
                    <button key={d} onClick={() => { setCareerDomain(d); setCareerRole(null); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${activeDomain === d ? "text-white border-transparent shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}
                      style={activeDomain === d ? { background: `linear-gradient(135deg, ${domainColor.from}, ${domainColor.to})` } : {}}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Domain overview card */}
              <div className="rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${domainColor.from}, ${domainColor.to})` }}>
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 bg-white" style={{ transform: "translate(30%,-30%)" }} />
                <div className="relative">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Career Field</p>
                      <h2 className="text-xl sm:text-2xl font-black mb-2">{activeDomain}</h2>
                      <p className="text-white/85 text-sm leading-relaxed max-w-xl">{career.overview}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                    {[
                      { icon: DollarSign, label: "Avg. Salary", value: career.avgSalary },
                      { icon: TrendingUp, label: "Job Growth", value: career.jobGrowth },
                      { icon: Building2,  label: "Market Size", value: career.marketSize },
                    ].map((s,i) => (
                      <div key={i} className="bg-white/15 backdrop-blur rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <s.icon className="w-3.5 h-3.5 text-white/70 flex-shrink-0" />
                          <p className="text-white/70 text-xs font-semibold">{s.label}</p>
                        </div>
                        <p className="text-white font-black text-sm">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* All Roles grid */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4 sm:mb-5 flex-wrap">
                  <Briefcase className="w-4 h-4 flex-shrink-0" style={{ color: domainColor.from }} />
                  <h3 className="font-bold text-gray-900">All Roles in {activeDomain}</h3>
                  <span className="text-xs text-gray-400 ml-auto">{career.roles.length} roles · click to deep-dive</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {career.roles.map((role, i) => {
                    const d = DEMAND_COLORS[role.demand] || DEMAND_COLORS["High"];
                    const isSelected = careerRole === i;
                    return (
                      <button key={i} onClick={() => setCareerRole(isSelected ? null : i)} className={`text-left p-3 sm:p-4 rounded-xl border transition-all ${isSelected ? "border-transparent shadow-md" : "border-gray-100 hover:border-gray-300 bg-gray-50 hover:bg-white"}`}
                        style={isSelected ? { background: `linear-gradient(135deg, ${domainColor.from}18, ${domainColor.to}18)`, borderColor: domainColor.from } : {}}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-bold text-gray-900 text-sm leading-tight">{role.title}</p>
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${d.bg} ${d.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${d.dot}`} />
                            {role.demand}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-lg">{role.salary}</span>
                          <span className="text-xs text-gray-400">{role.level}</span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{role.desc}</p>

                        {/* Expanded role detail */}
                        {isSelected && (
                          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                            <div>
                              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Key Skills to Master</p>
                              <div className="flex flex-wrap gap-1.5">
                                {role.skills.map((s,j) => (
                                  <span key={j} className="px-2.5 py-1 text-xs font-semibold rounded-lg text-white" style={{ background: domainColor.from }}>{s}</span>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              <button onClick={(e) => { e.stopPropagation(); setActiveTab("roadmap"); }}
                                className="flex-1 min-w-[120px] text-center py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                                style={{ background: `linear-gradient(135deg, ${domainColor.from}, ${domainColor.to})` }}>
                                📍 View Learning Roadmap
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setActiveTab("resources"); }}
                                className="flex-1 min-w-[120px] text-center py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all">
                                📚 Browse Resources
                              </button>
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Career Paths */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4 sm:mb-5">
                  <GitBranch className="w-4 h-4 flex-shrink-0" style={{ color: domainColor.from }} />
                  <h3 className="font-bold text-gray-900">Career Progression Paths</h3>
                </div>
                <div className="space-y-4">
                  {career.careerPaths.map((cp, i) => (
                    <div key={i} className="p-3 sm:p-4 rounded-xl border border-gray-100 bg-gray-50">
                      <div className="flex items-center justify-between mb-3 gap-2">
                        <p className="text-sm font-bold text-gray-800">{cp.path}</p>
                        <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded-lg border border-gray-200 flex-shrink-0">{cp.years}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {cp.steps.map((step, j) => (
                          <div key={j} className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-lg text-white" style={{ background: j === 0 ? "#94a3b8" : j === cp.steps.length-1 ? domainColor.from : `${domainColor.from}99` }}>{step}</span>
                            {j < cp.steps.length - 1 && <ArrowUpRight className="w-3 h-3 text-gray-300 flex-shrink-0" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Two-column: Top Companies + Certifications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-4 h-4 flex-shrink-0" style={{ color: domainColor.from }} />
                    <h3 className="font-bold text-gray-900 text-sm">Top Hiring Companies</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {career.topCompanies.map((c,i) => (
                      <span key={i} className="text-xs font-bold px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700">{c}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-4 h-4 flex-shrink-0" style={{ color: domainColor.from }} />
                    <h3 className="font-bold text-gray-900 text-sm">Valuable Certifications</h3>
                  </div>
                  <div className="space-y-2">
                    {career.certifications.map((cert,i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: domainColor.from }} />
                        <span className="text-xs text-gray-700 font-medium">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top skills + Interview topics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Flame className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <h3 className="font-bold text-gray-900 text-sm">Most In-Demand Skills (2025)</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {career.topSkillsInDemand.map((s,i) => (
                      <span key={i} className="text-xs font-bold px-3 py-1.5 rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${domainColor.from}, ${domainColor.to})`, opacity: 1 - i * 0.07 }}>{s}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-4 h-4 flex-shrink-0" style={{ color: domainColor.from }} />
                    <h3 className="font-bold text-gray-900 text-sm">Interview Topics to Master</h3>
                  </div>
                  <div className="space-y-2">
                    {career.interviewTopics.map((t,i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: domainColor.from }} />
                        <span className="text-xs text-gray-700 font-medium">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reality check */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">⚡</span>
                  <div>
                    <p className="font-bold text-amber-900 mb-1">Reality Check — What Actually Gets You Hired</p>
                    <p className="text-sm text-amber-800 leading-relaxed">{career.realityCheck}</p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="rounded-2xl p-5 sm:p-6 text-white text-center" style={{ background: `linear-gradient(135deg, ${domainColor.from}, ${domainColor.to})` }}>
                <Rocket className="w-8 h-8 mx-auto mb-3 opacity-90" />
                <h3 className="text-lg font-black mb-2">Ready to start your {activeDomain} journey?</h3>
                <p className="text-white/80 text-sm mb-4">Go through the full syllabus, study resources, and practice with mock interviews</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <button onClick={() => setActiveTab("syllabus")} className="bg-white/20 border border-white/30 text-white px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-white/30 transition-all">📖 View Syllabus</button>
                  <button onClick={() => navigate("/interviews")} className="bg-white text-gray-900 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:scale-105 transition-all">🎯 Start Mock Interview</button>
                </div>
              </div>

            </div>
          );
        })()}


      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Resource Card — with expandable content panel
// ─────────────────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  video:      { color: "bg-red-50 text-red-700",     icon: Youtube,   label: "Video" },
  guide:      { color: "bg-blue-50 text-blue-700",    icon: BookOpen,  label: "Guide" },
  article:    { color: "bg-green-50 text-green-700",  icon: FileText,  label: "Article" },
  practice:   { color: "bg-orange-50 text-orange-700",icon: Zap,       label: "Practice" },
  cheatsheet: { color: "bg-pink-50 text-pink-700",    icon: Lightbulb, label: "Cheatsheet" },
};
const DIFF_CONFIG = {
  beginner:     { color: "bg-green-50 text-green-700",  dot: "bg-green-500" },
  intermediate: { color: "bg-amber-50 text-amber-700",  dot: "bg-amber-500" },
  advanced:     { color: "bg-red-50 text-red-700",      dot: "bg-red-500" },
};

function getResourceContent(resource) {
  const titleLower = (resource.title || "").toLowerCase();

  if (titleLower.includes("dsa") || titleLower.includes("data structure") || titleLower.includes("leetcode") || titleLower.includes("blind 75")) return {
    whatYouLearn: ["Array & string manipulation patterns", "Tree traversal techniques (BFS, DFS)", "Dynamic programming patterns", "Graph algorithms (Dijkstra, Union Find)", "Sliding window & two-pointer techniques"],
    keyTopics: ["Arrays", "Linked Lists", "Trees", "Graphs", "DP", "Sorting", "Binary Search"],
    prerequisites: ["Basic programming knowledge", "Understanding of time/space complexity"],
    expectedOutcome: "Solve 70-80% of medium LeetCode problems confidently within 6 weeks",
  };

  if (titleLower.includes("system design")) return {
    whatYouLearn: ["How to design scalable distributed systems", "Database selection (SQL vs NoSQL)", "Caching strategies and CDN usage", "Load balancing and horizontal scaling", "Real-world architectures (Netflix, Uber, Twitter)"],
    keyTopics: ["CAP Theorem", "Load Balancers", "Caching (Redis)", "Database Sharding", "Message Queues", "Microservices"],
    prerequisites: ["Basic networking knowledge", "Understanding of databases", "Familiarity with cloud concepts"],
    expectedOutcome: "Confidently design any system in a 45-min interview",
  };

  if (titleLower.includes("jee") || titleLower.includes("physics") || titleLower.includes("mechanics")) return {
    whatYouLearn: ["Core physics concepts tested in JEE", "Problem-solving techniques for numerical questions", "Important derivations and their applications", "Short-cut tricks for MCQs", "Common mistake patterns to avoid"],
    keyTopics: ["Kinematics", "Newton's Laws", "Energy Conservation", "Rotational Dynamics", "Gravitation"],
    prerequisites: ["Class 11 Maths (Calculus basics)", "Basic trigonometry"],
    expectedOutcome: "Score 50+ marks in Physics in JEE Main",
  };

  if (titleLower.includes("neet") || titleLower.includes("biology") || titleLower.includes("physiology")) return {
    whatYouLearn: ["All NCERT diagrams and their labels", "Important MCQ patterns from past papers", "High-weightage topics and their depth", "Memory techniques for taxonomy/nomenclature", "Quick revision shortcuts"],
    keyTopics: ["Human Physiology", "Genetics", "Ecology", "Cell Biology", "Evolution"],
    prerequisites: ["NCERT Class 11 & 12 Biology basics"],
    expectedOutcome: "Score 120+ marks in Biology in NEET",
  };

  if (titleLower.includes("dcf") || titleLower.includes("valuation") || titleLower.includes("financial model")) return {
    whatYouLearn: ["Build a 3-statement financial model from scratch", "DCF valuation step-by-step", "WACC calculation and terminal value", "Sensitivity analysis and scenario planning", "Common IB interview question answers"],
    keyTopics: ["DCF", "Comparable Companies", "LBO Model", "WACC", "Terminal Value", "Precedent Transactions"],
    prerequisites: ["Basic accounting (Income Statement, Balance Sheet)", "Excel fundamentals"],
    expectedOutcome: "Ace technical rounds at IB and Big 4 firms",
  };

  if (titleLower.includes("behavioral") || titleLower.includes("star")) return {
    whatYouLearn: ["The STAR framework mastered with real examples", "30 must-prepare behavioral questions", "How to structure impactful stories", "Dos and don'ts in behavioral rounds", "Tailoring answers to company culture"],
    keyTopics: ["Leadership", "Conflict Resolution", "Failure & Learning", "Teamwork", "Initiative", "Why Company"],
    prerequisites: ["Some work/project experience to draw stories from"],
    expectedOutcome: "Never be caught off-guard by any behavioral question",
  };

  if (titleLower.includes("product") || titleLower.includes("pm") || titleLower.includes("circles")) return {
    whatYouLearn: ["Product design using CIRCLES and other frameworks", "How to structure market-sizing answers", "Metrics selection and KPI definition", "Prioritization using RICE/ICE scoring", "How to think like a PM in 30 days"],
    keyTopics: ["User Personas", "Pain Points", "Prioritization", "Metrics", "GTM Strategy", "Roadmaps"],
    prerequisites: ["Interest in product strategy", "Basic business understanding"],
    expectedOutcome: "Crack PM interviews at top tech companies",
  };

  if (titleLower.includes("machine learning") || titleLower.includes("ml") || titleLower.includes("data science")) return {
    whatYouLearn: ["Core ML algorithms and when to use each", "Feature engineering best practices", "Model evaluation metrics (ROC, F1, etc.)", "Handling imbalanced data and overfitting", "End-to-end ML project structure"],
    keyTopics: ["Regression", "Classification", "Clustering", "Deep Learning", "Model Evaluation", "Feature Engineering"],
    prerequisites: ["Python basics", "Statistics fundamentals", "Basic linear algebra"],
    expectedOutcome: "Confidently solve ML case studies in data science interviews",
  };

  if (titleLower.includes("case") || titleLower.includes("consulting") || titleLower.includes("mckinsey")) return {
    whatYouLearn: ["How to structure any consulting case in 60 seconds", "Hypothesis-driven problem solving", "How to do mental math quickly in interviews", "Framework selection for different case types", "Communication and client presence"],
    keyTopics: ["Profitability", "Market Entry", "Market Sizing", "M&A Cases", "MECE Principle", "Issue Trees"],
    prerequisites: ["Basic business concepts", "Interest in strategy and operations"],
    expectedOutcome: "Pass first-round case interviews at MBB firms",
  };

  return {
    whatYouLearn: [
      `Understand core concepts covered in "${resource.title}"`,
      "Apply knowledge to real interview/exam scenarios",
      "Practice with targeted exercises and questions",
      "Build confidence for the actual interview/exam",
    ],
    keyTopics: resource.tags || [],
    prerequisites: ["Basic domain knowledge"],
    expectedOutcome: `Improve your performance in ${resource.category || "this area"} significantly`,
  };
}

function ResourceCard({ resource, isSaved, isExpanded, onToggleExpand, onSave, onView, onShare, accentColor }) {
  const typeConf  = TYPE_CONFIG[resource.type]  || TYPE_CONFIG.guide;
  const diffConf  = DIFF_CONFIG[resource.difficulty] || DIFF_CONFIG.intermediate;
  const TypeIcon  = typeConf.icon;
  const isYouTube = resource.externalUrl?.includes("youtube.com");
  const isPractice = resource.type === "practice";
  const content   = isExpanded ? getResourceContent(resource) : null;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-200 group flex flex-col ${isExpanded ? "border-gray-300 shadow-md" : "border-gray-100 hover:-translate-y-1"}`}>
      {/* Header */}
      <div className="p-4 sm:p-5 flex-1">
        <div className="flex items-start justify-between mb-3">
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${typeConf.color}`}>
            <TypeIcon className="w-3.5 h-3.5 flex-shrink-0" /> {typeConf.label}
          </span>
          <button onClick={onSave} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
            <Bookmark className={`w-4 h-4 transition-colors ${isSaved ? "fill-purple-600 text-purple-600" : "text-gray-400 hover:text-purple-500"}`} />
          </button>
        </div>

        <h3 className="font-bold text-gray-900 text-sm mb-1.5 leading-snug" style={{ ...(isExpanded ? { color: accentColor } : {}) }}>
          {resource.title}
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{resource.description}</p>

        {isYouTube && (
          <div className="flex items-center gap-1.5 mb-3">
            <Youtube className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            <span className="text-xs text-red-500 font-medium">{resource.channel || "YouTube"}</span>
          </div>
        )}

        {resource.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1">
            {resource.tags.slice(0,3).map((tag,i) => (
              <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-md">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && content && (
        <div className="px-4 sm:px-5 pb-4 border-t border-gray-100 pt-4 space-y-4">
          {/* What you'll learn */}
          <div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> What You'll Learn
            </p>
            <ul className="space-y-1.5">
              {content.whatYouLearn.map((item,i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: accentColor }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Key topics */}
          {content.keyTopics?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" /> Key Topics
              </p>
              <div className="flex flex-wrap gap-1.5">
                {content.keyTopics.map((t,i) => (
                  <span key={i} className="px-2.5 py-1 text-xs font-medium rounded-lg" style={{ background: `${accentColor}15`, color: accentColor }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Prerequisites & outcome */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-amber-50 rounded-xl">
              <p className="text-xs font-bold text-amber-700 mb-1.5">Prerequisites</p>
              {content.prerequisites?.map((p,i) => <p key={i} className="text-xs text-amber-700">• {p}</p>)}
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <p className="text-xs font-bold text-green-700 mb-1.5">Outcome</p>
              <p className="text-xs text-green-700">{content.expectedOutcome}</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 flex-shrink-0" />{resource.duration}</span>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${diffConf.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${diffConf.dot}`} /> {resource.difficulty}
            </span>
          </div>
          {resource.rating && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold text-gray-700">{resource.rating}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onView}
            className="flex-1 text-white py-2 px-3 rounded-xl text-xs font-bold hover:opacity-90 hover:shadow-md transition-all flex items-center justify-center gap-1.5"
            style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
          >
            {isPractice ? <><Zap className="w-3.5 h-3.5 flex-shrink-0" /> Practice</> : isYouTube ? <><Youtube className="w-3.5 h-3.5 flex-shrink-0" /> Watch</> : <><ExternalLink className="w-3.5 h-3.5 flex-shrink-0" /> Open</>}
          </button>
          <button
            onClick={onToggleExpand}
            className={`p-2 border rounded-xl transition-colors text-xs font-bold flex-shrink-0 ${isExpanded ? "border-gray-300 bg-gray-100 text-gray-700" : "border-gray-200 hover:bg-gray-50 text-gray-500"}`}
            title={isExpanded ? "Hide details" : "Show details"}
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5 rotate-180" /> : <List className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onShare} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-600 flex-shrink-0" title="Copy link">
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Roadmap Step Component
// ─────────────────────────────────────────────────────────────────────────────
function RoadmapStep({ step, accentFrom, accentLight }) {
  const [open, setOpen] = useState(step.step === 1);
  const StepIcon = step.icon;
  const colorMap = {
    blue:    { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-500" },
    violet:  { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200",  dot: "bg-violet-500" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
    amber:   { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-500" },
  };
  const c = colorMap[step.color] || colorMap.blue;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${open ? "border-gray-200" : "border-gray-100"}`}>
      <button className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 hover:bg-gray-50 transition-colors text-left" onClick={() => setOpen(!open)}>
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg}`}>
          <StepIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${c.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${c.bg} ${c.text}`}>PHASE {step.step} · {step.phase}</span>
            <span className="text-xs text-gray-400">{step.duration}</span>
          </div>
          <p className="font-bold text-gray-900 text-sm">{step.title}</p>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Action Items</p>
            <div className="space-y-2">
              {step.actions.map((action, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${c.bg}`}>
                    <span className={`text-xs font-black ${c.text}`}>{i+1}</span>
                  </div>
                  <p className="text-xs text-gray-700 font-medium">{action}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}