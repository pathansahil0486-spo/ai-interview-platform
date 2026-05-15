import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Loader, X, Briefcase, FileText, BarChart2, Layers, Hash,
  Search, Check, Sparkles, GraduationCap, BookOpen,
  Code2, Brain, Shield, TrendingUp, Building2, FlaskConical,
  Stethoscope, Scale, Palette, Globe, Landmark,
  Cpu, Wrench, Plane, Leaf, ShoppingCart,
  Camera, HeartHandshake, Banknote, Hotel, Truck,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* ══════════════════════════════════════════════════════════════════════════════
   STUDENT CATEGORIES
   streams[] → exact values from OnboardingPage STUDENT_STREAMS
   domain    → sent to backend as context hint for Gemini
══════════════════════════════════════════════════════════════════════════════ */
const STUDENT_CATEGORIES = [
  {
    id: "s_engineering", label: "Engineering", icon: Code2, color: "#6366f1",
    streams: ["Engineering / Technology", "Science (PCM)", "M.Tech"],
    domain: "Engineering / Technology",
    positions: [
      "JEE Mains Preparation", "JEE Advanced Preparation",
      "GATE — Computer Science", "GATE — Electronics (ECE)", "GATE — Mechanical",
      "GATE — Civil", "GATE — Electrical (EEE)",
      "GATE — Chemical Engineering", "GATE — Biotechnology", "GATE — Aerospace Engineering",
      "GATE — Instrumentation Engineering", "GATE — Mining Engineering",
      "GATE — Textile Engineering", "GATE — Production & Industrial Engineering",
      "Campus Placement — Software Engineer", "Campus Placement — Full Stack Developer",
      "Campus Placement — Data Engineer", "Campus Placement — ML Engineer",
      "Campus Placement — DevOps Engineer", "Campus Placement — Embedded Systems",
      "Campus Placement — VLSI / Chip Design", "Campus Placement — Mechanical Engineer",
      "Campus Placement — Civil Engineer", "Campus Placement — Electrical Engineer",
      "Campus Placement — Chemical Engineer",
      "Internship — Frontend Developer", "Internship — Backend Developer",
      "Internship — Data Science", "Internship — Mechanical Design",
      "Internship — Civil / Structural", "Internship — Electrical / Power",
      "B.Tech — Computer Science Viva", "B.Tech — Electronics Viva",
      "B.Tech — Mechanical Viva", "B.Tech — Civil Viva",
      "B.Tech — Electrical Viva", "B.Tech — Chemical Viva",
      "B.Tech — Aerospace Viva", "B.Tech — Biomedical Viva",
      "B.Tech — Production Engineering Viva", "B.Tech — Marine Engineering Viva",
      "M.Tech — CSE Viva", "M.Tech — VLSI Viva", "M.Tech — Structural Viva",
      "M.Tech — Power Systems Viva", "M.Tech — Thermal Engineering Viva",
      "Engineering Design Project Review",
      "ISRO / DRDO Scientist Interview Prep",
      "PSU Technical Interview (BHEL / ONGC / NTPC / SAIL)",
      "Robotics & Automation Interview", "Nanotechnology Interview",
      "Petroleum / Oil & Gas Engineering Interview",
    ],
  },
  {
    id: "s_medical", label: "Medical & Health", icon: Stethoscope, color: "#dc2626",
    streams: ["Medical / Health Sciences", "Science (PCB)"],
    domain: "Medical / Health Sciences",
    positions: [
      "NEET UG Preparation", "NEET PG Preparation", "AIIMS Entrance Prep",
      "JIPMER Entrance Preparation", "PGI Chandigarh Entrance Prep",
      "MBBS Final Year Viva", "MD / MS Residency Interview",
      "MD — Internal Medicine Viva", "MD — Paediatrics Viva",
      "MD — Obstetrics & Gynaecology Viva", "MD — Psychiatry Viva",
      "MD — Dermatology Viva", "MD — Radiology Viva",
      "MD — Anaesthesiology Viva", "MD — Pathology Viva",
      "MS — General Surgery Viva", "MS — Orthopaedics Viva",
      "MS — Ophthalmology Viva", "MS — ENT Viva",
      "Pharmacy Entrance Prep (GPAT)", "B.Pharm Viva", "D.Pharm Viva",
      "Clinical Pharmacology Viva", "Pharmacovigilance Interview",
      "Microbiology Viva", "Microbiology Research Interview",
      "Medical Microbiology — Bacteriology", "Medical Microbiology — Virology",
      "Medical Microbiology — Parasitology", "Medical Microbiology — Mycology",
      "Biochemistry Viva", "Anatomy Viva", "Physiology Viva",
      "Forensic Medicine Viva", "Community Medicine / PSM Viva",
      "Nursing Entrance Interview", "B.Sc Nursing Viva", "M.Sc Nursing Viva",
      "Physiotherapy Admissions Interview", "B.P.T Viva", "M.P.T Viva",
      "Occupational Therapy Interview", "Speech & Language Therapy Interview",
      "AYUSH / Homeopathy Entrance", "BAMS — Ayurveda Viva",
      "BHMS — Homeopathy Viva", "BUMS — Unani Viva",
      "Medical Internship Interview", "Dentistry (BDS) Entrance Prep",
      "BDS Viva — Oral Medicine", "BDS Viva — Orthodontics",
      "BDS Viva — Oral Surgery", "MDS Entrance Prep",
      "Veterinary Science (BVSc) Prep", "BVSc Viva",
      "Clinical Research Interview", "Clinical Trials Associate Interview",
      "Hospital Administration Interview", "Health Services Management Interview",
      "Public Health Interview", "MPH Entrance Prep",
      "Epidemiology Interview", "Biostatistics Viva",
      "Dietetics & Nutrition Interview", "Radiography Interview",
      "Medical Lab Technology (MLT) Interview", "Blood Bank Technology Interview",
      "Dialysis Technology Interview", "Operation Theatre Technology Interview",
      "Cardiac Technology / Perfusionist Interview",
      "Optometry Interview", "Audiology Interview",
      "Prosthetics & Orthotics Interview", "Dental Hygiene Interview",
      "Health Informatics Interview", "Telemedicine / Digital Health Interview",
    ],
  },
  {
    id: "s_science", label: "Pure Science", icon: FlaskConical, color: "#0891b2",
    streams: ["M.Sc", "Science", "Science (PCM)", "Science (PCB)"],
    domain: "Pure Science",
    positions: [
      "B.Sc Physics Viva", "B.Sc Chemistry Viva", "B.Sc Mathematics Viva",
      "B.Sc Biology / Zoology Viva", "B.Sc Botany Viva",
      "B.Sc Microbiology Viva", "B.Sc Biotechnology Viva",
      "B.Sc Biochemistry Viva", "B.Sc Genetics Viva",
      "B.Sc Statistics Viva", "B.Sc Computer Science Viva",
      "B.Sc Electronics Viva", "B.Sc Industrial Chemistry Viva",
      "B.Sc Geology Viva", "B.Sc Geography Viva",
      "B.Sc Environmental Science Viva", "B.Sc Oceanography Viva",
      "B.Sc Astronomy / Astrophysics Viva", "B.Sc Actuarial Science Viva",
      "M.Sc Physics Viva", "M.Sc Chemistry Viva", "M.Sc Mathematics Viva",
      "M.Sc Biotechnology Viva", "M.Sc Microbiology Viva",
      "M.Sc Biochemistry Viva", "M.Sc Genetics Viva",
      "M.Sc Bioinformatics Viva", "M.Sc Statistics Viva",
      "M.Sc Environmental Science Viva", "M.Sc Geology Viva",
      "M.Sc Zoology Viva", "M.Sc Botany Viva",
      "M.Sc Organic Chemistry Viva", "M.Sc Inorganic Chemistry Viva",
      "M.Sc Physical Chemistry Viva", "M.Sc Analytical Chemistry Viva",
      "IIT JAM Preparation", "CSIR-NET / JRF Preparation",
      "DBT — JRF / BET Preparation", "ICMR JRF Preparation",
      "JEST (Physics) Preparation", "TIFR Entrance Preparation",
      "Research Internship Interview", "PhD Research Interview — Science",
      "PhD Research Interview — Life Sciences", "PhD Research Interview — Chemistry",
      "PhD Research Interview — Physics", "PhD Research Interview — Mathematics",
      "Post-Doctoral Research Interview",
      "Biochemistry Viva", "Environmental Science Interview",
      "Nanotechnology Interview", "Biophysics Viva",
      "Food Science & Technology Viva", "Pharmaceutical Chemistry Viva",
    ],
  },
  {
    id: "s_commerce", label: "Commerce & Finance", icon: Banknote, color: "#059669",
    streams: ["Commerce", "Commerce / Business", "MBA"],
    domain: "Finance / Accounting",
    positions: [
      "CA Foundation Preparation", "CA Intermediate Preparation", "CA Final Preparation",
      "CA Articleship Interview", "CA Industrial Training Interview",
      "CMA Foundation Prep", "CMA Intermediate Prep", "CMA Final Prep",
      "CS Foundation Prep", "CS Executive Prep", "CS Professional Prep",
      "MBA Entrance — CAT", "MBA Entrance — XAT / SNAP",
      "MBA Entrance — NMAT", "MBA Entrance — CMAT", "MBA Entrance — MAT",
      "MBA Entrance — GMAT", "MBA Entrance — WAT (Written Ability Test)",
      "MBA Finance Interview", "MBA HR Interview", "MBA Marketing Interview",
      "MBA Operations Interview", "MBA International Business Interview",
      "MBA IT / Systems Interview", "MBA Entrepreneurship Interview",
      "IIM Admissions Interview", "ISB Admissions Interview",
      "B.Com Viva / Semester Exam", "M.Com Viva",
      "BBA Admissions Interview", "BBA Viva",
      "BBM / BMS Viva", "BFIA (Bachelor of Financial & Investment Analysis) Prep",
      "Banking PO Interview (IBPS / SBI)", "RBI Grade B Interview",
      "SEBI Grade A Interview", "IRDAI Assistant Manager Interview",
      "NABARD Development Assistant Interview",
      "Finance Analyst Fresher Interview", "Stock Market / CFA Prep",
      "CFA Level 1 Prep", "CFA Level 2 Prep", "CFA Level 3 Prep",
      "ACCA Exam Preparation", "FRM (Financial Risk Manager) Prep",
      "CAIA (Chartered Alternative Investment Analyst) Prep",
      "CFP (Certified Financial Planner) Prep",
      "B.Com — Financial Accounting Viva", "B.Com — Cost Accounting Viva",
      "B.Com — Business Law Viva", "B.Com — Income Tax Viva",
      "B.Com — Auditing Viva", "B.Com — Financial Management Viva",
      "Economics Viva — Microeconomics", "Economics Viva — Macroeconomics",
      "Statistics / Econometrics Viva",
    ],
  },
  {
    id: "s_law", label: "Law", icon: Scale, color: "#7c3aed",
    streams: ["Law", "LLM"],
    domain: "Law",
    positions: [
      "CLAT Entrance Preparation", "AILET Preparation",
      "LSAT India Preparation", "SLAT Preparation",
      "Law School Admissions Interview", "LLB Viva / Semester Prep",
      "LLM Entrance Prep", "LLM — Constitutional Law",
      "LLM — Criminal Law", "LLM — Corporate Law",
      "LLM — International Law", "LLM — Intellectual Property Law",
      "LLM — Labour & Employment Law", "LLM — Tax Law",
      "LLM — Environmental Law", "LLM — Human Rights Law",
      "LLM — Cyber Law", "LLM — Family Law",
      "Judicial Services Interview", "District Judge Interview Prep",
      "Corporate Law Internship Interview", "Criminal Law Viva",
      "Constitutional Law Viva", "Moot Court Practice Session",
      "IPR / Patent Law Interview", "Bar Exam Preparation",
      "Legal Aid Internship Interview", "Arbitration / Mediation Interview",
      "Legal Drafting & Documentation Interview",
      "Civil Procedure Code (CPC) Viva", "Criminal Procedure Code (CrPC) Viva",
      "Law of Evidence Viva", "Property Law Viva", "Contract Law Viva",
      "Tort Law Viva", "Administrative Law Viva",
      "Public International Law Viva", "Private International Law Viva",
      "Banking & Finance Law Interview", "Insurance Law Viva",
      "Competition Law Interview", "Real Estate Law Interview",
      "Company Law Viva", "GDPR / Data Protection Law Interview",
    ],
  },
  {
    id: "s_arts", label: "Arts & Humanities", icon: BookOpen, color: "#b45309",
    streams: ["Arts / Humanities", "MA", "Humanities"],
    domain: "Arts / Humanities",
    positions: [
      "UPSC Civil Services (IAS) Prep", "UPSC Personality Test (Interview)",
      "UPSC Essay Writing Practice", "UPSC Optional — History",
      "UPSC Optional — Political Science & IR", "UPSC Optional — Geography",
      "UPSC Optional — Sociology", "UPSC Optional — Philosophy",
      "UPSC Optional — Psychology", "UPSC Optional — Public Administration",
      "UPSC Optional — Literature (English)", "UPSC Optional — Economics",
      "UPSC Optional — Anthropology", "UPSC Optional — Hindi Literature",
      "State PSC Interview Prep",
      "BA English Viva", "BA English Literature — Poetry Viva",
      "BA English Literature — Novel Viva", "BA English Literature — Drama Viva",
      "BA History Viva", "BA Modern History Viva", "BA Ancient History Viva",
      "BA Political Science Viva", "BA International Relations Viva",
      "BA Psychology Viva", "BA Sociology Viva",
      "BA Philosophy Viva", "BA Economics Viva",
      "BA Geography Viva", "BA Anthropology Viva",
      "BA Hindi / Regional Literature Viva", "BA Sanskrit Viva",
      "BA Public Administration Viva", "BA Social Work Viva",
      "BA Criminology Viva", "BA Gender Studies Viva",
      "MA Entrance Preparation", "MA — English Literature",
      "MA — History", "MA — Political Science", "MA — Sociology",
      "MA — Psychology", "MA — Economics", "MA — Philosophy",
      "MA — Geography", "MA — Public Administration",
      "M.Phil / PhD Humanities Interview",
      "UGC-NET — English", "UGC-NET — History", "UGC-NET — Political Science",
      "UGC-NET — Sociology", "UGC-NET — Psychology", "UGC-NET — Economics",
      "UGC-NET — Philosophy", "UGC-NET — Geography", "UGC-NET — Education",
      "Journalism & Mass Communication Interview", "Content Writing Interview",
      "Teaching / B.Ed Interview", "Social Work Interview", "NGO / Non-Profit Interview",
      "International Relations & Diplomacy Interview", "Foreign Service Interview",
      "Translation & Linguistics Interview", "Library Science Interview",
    ],
  },
  {
    id: "s_design", label: "Design & Architecture", icon: Palette, color: "#db2777",
    streams: ["Design"],
    domain: "Design (UI/UX)",
    positions: [
      "NID Entrance Preparation", "NIFT Entrance Preparation", "CEED / UCEED Prep",
      "B.Arch Entrance (NATA / JEE Paper 2)", "Architecture Viva / Portfolio Review",
      "B.Des Viva", "M.Des Entrance Prep", "M.Des Viva",
      "UI/UX Design Internship Interview", "Product Design Interview",
      "Graphic Design Portfolio Review", "Motion Design Interview",
      "Fashion Design Admissions Interview", "Fashion Design Viva",
      "Interior Design Interview", "Interior Architecture Viva",
      "Landscape Architecture Interview",
      "Urban Planning Interview", "Town Planning Viva",
      "UX Research Interview", "Design Thinking Assessment",
      "Industrial / Product Design Viva", "Furniture Design Interview",
      "Textile Design Interview", "Accessory Design Interview",
      "Jewellery Design Interview", "Leather Design Interview",
      "Communication Design Viva", "Illustration Interview",
      "Packaging Design Interview", "Exhibition Design Interview",
      "Game Design Interview", "AR / VR Experience Design Interview",
      "Interaction Design Interview", "Service Design Interview",
      "Typography & Branding Interview", "Design Research Interview",
    ],
  },
  {
    id: "s_management", label: "Management & MBA", icon: Building2, color: "#0369a1",
    streams: ["MBA", "Management"],
    domain: "Consulting",
    positions: [
      "MBA Group Discussion (GD) Practice", "MBA Personal Interview (PI) Prep",
      "IIM Admissions Interview", "ISB Admissions Interview",
      "XLRI / XIMB Admissions Interview", "MDI / IMT Admissions Interview",
      "BBA Admissions Interview", "BBA Semester Viva",
      "BMS / BBM Viva",
      "Operations Management Viva", "Human Resource Management Viva",
      "Marketing Management Viva", "Financial Management Viva",
      "Strategic Management Viva", "Business Ethics & CSR Viva",
      "Organisational Behaviour Viva", "Research Methodology Viva",
      "Entrepreneurship / Startup Pitch", "Business Plan Presentation",
      "International Business Interview",
      "Supply Chain Management Viva", "Logistics Management Viva",
      "Retail Management Interview", "Rural Management Interview",
      "Agribusiness Management Interview",
      "Hotel Management Admissions Interview", "Hotel Management Viva",
      "Event Management Interview", "Sports Management Interview",
      "Healthcare Management Interview", "NGO / Development Management Interview",
      "Project Management Professional (PMP) Prep",
      "Six Sigma / Lean Management Interview",
      "Change Management Interview",
    ],
  },
  {
    id: "s_education", label: "Education & Teaching", icon: GraduationCap, color: "#7c3aed",
    streams: ["Other"],
    domain: "Other",
    positions: [
      "B.Ed Admissions Interview", "B.Ed Viva",
      "M.Ed Entrance Prep", "M.Ed Viva",
      "D.El.Ed (Diploma in Elementary Education) Prep",
      "CTET Preparation", "TET Preparation",
      "UGC-NET — Education", "NVS / KVS Teacher Interview",
      "School Teacher Interview — Primary", "School Teacher Interview — Secondary",
      "School Teacher Interview — Higher Secondary",
      "College Lecturer Interview", "Assistant Professor Interview",
      "Special Education Interview", "B.Ed Special Education Prep",
      "Online Tutor Interview", "EdTech Content Creator Interview",
      "Early Childhood Education Interview", "Montessori Teacher Interview",
      "School Counsellor Interview", "Career Counsellor Interview",
      "Educational Technology Interview", "Instructional Designer Interview",
      "Curriculum Developer Interview", "Academic Coordinator Interview",
      "School Principal / Vice-Principal Interview",
      "Library & Information Science Interview",
      "Physical Education Teacher Interview (B.P.Ed)",
      "Yoga Teacher Interview",
    ],
  },
  {
    id: "s_agriculture", label: "Agriculture & Environment", icon: Leaf, color: "#15803d",
    streams: ["Other"],
    domain: "Other",
    positions: [
      "ICAR Entrance Preparation", "JRF / SRF Agriculture Interview",
      "B.Sc Agriculture Viva", "M.Sc Agriculture Viva",
      "Ph.D Agriculture Interview",
      "Agronomy Interview", "Soil Science Viva",
      "Horticulture Interview", "Plant Pathology Viva",
      "Entomology Viva", "Seed Science & Technology Viva",
      "Agricultural Economics Viva", "Agricultural Extension Viva",
      "Crop Physiology Viva", "Agroforestry Viva",
      "Plant Biotechnology Interview", "Sericulture Interview",
      "Fisheries Science Interview", "Aquaculture Viva",
      "Animal Husbandry Interview", "Dairy Science Viva",
      "Poultry Science Interview",
      "Forestry Interview", "Wildlife Science Viva",
      "Silviculture & Agroforestry Interview",
      "Environmental Science Interview", "M.Sc Environmental Science Viva",
      "Wildlife Conservation Interview", "Ecology & Biodiversity Viva",
      "Climate Change & Sustainability Interview",
      "Remote Sensing & GIS Interview",
      "Food Technology Interview", "Food Processing Interview",
      "Dairy Technology Viva", "Post Harvest Technology Viva",
      "NABARD Agriculture Officer Interview",
      "Agricultural Officer — State Govt Interview",
      "IARI Scientist Interview Prep",
    ],
  },
  {
    id: "s_aviation", label: "Aviation & Defence", icon: Plane, color: "#1d4ed8",
    streams: ["Other"],
    domain: "Other",
    positions: [
      "NDA Entrance Preparation", "CDS Examination Prep", "AFCAT Preparation",
      "Indian Navy SSB Interview", "Indian Army SSB Interview",
      "Indian Air Force SSB Interview", "Indian Coast Guard Interview",
      "Territorial Army Interview", "CAPF (BSF / CRPF / CISF / SSB / ITBP) Interview",
      "SSC GD Constable Interview", "SSC CPO Sub-Inspector Interview",
      "Sainik School Entrance Prep", "Military School Entrance Prep",
      "Rashtriya Military School Prep",
      "Commercial Pilot License Interview", "Private Pilot License Prep",
      "Airline Transport Pilot (ATPL) Interview",
      "Pilot — IndiGo / Air India / SpiceJet Interview",
      "Airport Ground Staff Interview", "Aircraft Maintenance Engineer (AME) Interview",
      "Air Traffic Controller (ATC) Interview",
      "Aviation Management Interview", "Aviation Security Interview",
      "Cabin Crew / Flight Attendant Interview",
      "Merchant Navy Admissions Interview", "B.Sc Nautical Science Prep",
      "Marine Engineer Interview", "Deck Officer Interview",
      "DGCA Ground Exams Prep", "DGCA RTR(A) Exam Prep",
      "Paramilitary Officer Interview", "Police Officer Interview Prep",
    ],
  },
  {
    id: "s_media", label: "Media, Arts & Sports", icon: Camera, color: "#be185d",
    streams: ["Other"],
    domain: "Other",
    positions: [
      "Film / Mass Communication Entrance", "FTII Entrance Preparation",
      "Journalism Entrance Prep", "BA Journalism Viva",
      "MA Journalism & Mass Communication Viva",
      "Print Journalism Interview", "Broadcast Journalism Interview",
      "Digital Journalism Interview",
      "Photography Portfolio Review", "Cinematography Interview",
      "Film Direction Interview", "Screenplay Writing Interview",
      "Film Production Interview", "Sound Design Interview",
      "Documentary Filmmaking Interview",
      "Music School Audition Prep", "Classical Music Viva",
      "Music Production Interview", "Sound Engineering Interview",
      "Fine Arts College Interview", "BFA Viva", "MFA Interview",
      "Theatre / Drama Interview", "Acting School Audition Prep",
      "Dance Academy Interview", "Choreography Interview",
      "Animation & VFX Interview", "Graphic Novel / Illustration Interview",
      "Sports Management Interview", "Physical Education (B.P.Ed) Interview",
      "Sports Coaching Interview", "Sports Science Interview",
      "Athletic Training Interview", "Sports Psychology Interview",
      "Yoga Instructor Interview", "Fitness Trainer Interview",
      "Event Management Interview", "PR & Advertising Interview",
      "Advertising Copywriting Interview",
      "Radio Jockey (RJ) Audition Prep", "Social Media Influencer Interview",
    ],
  },
  {
    id: "s_competitive", label: "Competitive & Govt Exams", icon: Landmark, color: "#92400e",
    streams: ["General", "Other"],
    domain: "Other",
    positions: [
      "UPSC IAS Full Mock Interview", "UPSC IPS Mock Interview",
      "UPSC IFS (Foreign Service) Mock Interview",
      "UPSC IRS Mock Interview", "UPSC IRPS Mock Interview",
      "SSC CGL Interview Prep", "SSC CHSL Preparation",
      "SSC MTS Preparation", "SSC JE (Junior Engineer) Prep",
      "SSC Stenographer Prep", "SSC CPO Prep",
      "Railway (RRB NTPC) Prep", "RRB JE (Junior Engineer) Prep",
      "RRB ALP (Loco Pilot) Prep", "RRB Group D Prep",
      "Police Sub-Inspector Interview", "Police Constable Interview",
      "IB ACIO Interview Prep", "RAW / Intelligence Services Prep",
      "Bank Clerk (IBPS) Interview", "SBI PO Interview Prep",
      "SBI Clerk Interview Prep", "IBPS PO Interview Prep",
      "IBPS SO (Specialist Officer) Interview",
      "RBI Grade B Interview", "RBI Assistant Interview",
      "NABARD Grade A / B Interview", "SIDBI Interview Prep",
      "LIC AAO / ADO Interview", "LIC Agent Licensing Prep",
      "GIC / Insurance Officer Interview",
      "State Government Job Interview", "State PSC Interview",
      "Municipal Corporation Officer Interview",
      "Panchayati Raj / Block Development Officer Interview",
      "FCI (Food Corporation of India) Interview",
      "SEBI Grade A Officer Interview",
      "IOCL / HPCL / BPCL Officer Interview",
      "AAI (Airports Authority) Junior Executive Interview",
      "Postal Service Inspector Interview",
      "Defence GD / Physical Fitness Prep",
      "Group Discussion Practice (General)", "Extempore / Public Speaking Practice",
      "Current Affairs & General Knowledge Practice",
      "Reasoning & Aptitude Interview Prep",
    ],
  },
];

/* ══════════════════════════════════════════════════════════════════════════════
   PROFESSIONAL CATEGORIES
   domains[] → exact values from OnboardingPage JOB_DOMAINS
══════════════════════════════════════════════════════════════════════════════ */
const JOB_CATEGORIES = [
  {
    id: "j_software", label: "Software Engineering", icon: Code2, color: "#6366f1",
    domains: ["Software Development"],
    positions: [
      "Frontend Developer", "Backend Developer", "Full Stack Developer",
      "React Developer", "Angular / Vue Developer", "Node.js Developer",
      "Python Developer", "Java Developer", "Golang Developer",
      "Ruby on Rails Developer", "PHP Developer",
      "C / C++ Developer", "Rust Developer", "Scala Developer",
      "Kotlin Developer (Backend)", "Swift Developer (Backend)",
      "iOS Developer (Swift)", "Android Developer (Kotlin)",
      "React Native Developer", "Flutter Developer",
      "Xamarin / .NET MAUI Developer",
      "Embedded Systems Engineer", "Firmware Engineer",
      "RTOS / Real-Time Systems Engineer",
      "Game Developer", "Unity Developer", "Unreal Engine Developer",
      "Blockchain Developer", "Smart Contract Developer",
      "Solidity Developer", "Web3 Developer",
      "Salesforce Developer", "SAP Developer",
      "WordPress / CMS Developer",
      "Low-Code / No-Code Developer",
      "QA Engineer / SDET", "Automation Test Engineer",
      "Performance Test Engineer", "Security Test Engineer",
      "API Developer", "Microservices Engineer",
      "Compiler / Interpreter Engineer",
      "Graphics / GPU Programming Engineer",
      "WebAssembly Developer",
    ],
  },
  {
    id: "j_data", label: "Data & AI / ML", icon: Brain, color: "#7c3aed",
    domains: ["Data Science / AI / ML"],
    positions: [
      "Data Scientist", "Data Analyst", "Business Intelligence Analyst",
      "Machine Learning Engineer", "Deep Learning Engineer", "AI Researcher",
      "NLP Engineer", "Computer Vision Engineer", "MLOps Engineer",
      "Quantitative Analyst", "Analytics Engineer", "Data Engineer",
      "Big Data Engineer (Spark / Hadoop)", "BI Developer (Power BI / Tableau)",
      "Statistician",
      "Applied Scientist", "AI Product Scientist",
      "Reinforcement Learning Engineer",
      "Generative AI Engineer", "LLM Engineer / Prompt Engineer",
      "Speech & Audio ML Engineer",
      "Recommendation Systems Engineer",
      "AI Safety Researcher", "AI Ethics Analyst",
      "Data Governance Analyst", "Master Data Management Analyst",
      "Data Quality Engineer", "Data Architect",
      "Knowledge Graph Engineer", "Ontology Engineer",
      "Financial Data Scientist", "Healthcare Data Scientist",
      "Marketing Data Scientist", "Retail Analytics Manager",
      "Supply Chain Data Analyst",
      "Geospatial Data Analyst", "Remote Sensing Analyst",
    ],
  },
  {
    id: "j_infra", label: "DevOps & Cloud", icon: Cpu, color: "#0891b2",
    domains: ["Software Development"],
    positions: [
      "DevOps Engineer", "Site Reliability Engineer (SRE)",
      "Cloud Architect (AWS)", "Cloud Architect (Azure)", "Cloud Architect (GCP)",
      "Platform Engineer", "Infrastructure Engineer",
      "Kubernetes / Container Engineer", "CI/CD Engineer",
      "Systems Administrator", "Network Engineer",
      "Database Administrator (DBA)", "Storage Engineer", "IT Operations Manager",
      "Cloud FinOps Analyst", "Cloud Migration Engineer",
      "Terraform / IaC Engineer", "Ansible / Configuration Management Engineer",
      "Linux / Unix Systems Engineer",
      "Windows Server Administrator",
      "VMware / Virtualisation Engineer",
      "Network Security Engineer", "Firewall / VPN Engineer",
      "BGP / MPLS Network Engineer",
      "Observability / Monitoring Engineer",
      "Chaos Engineering Specialist",
      "GitOps Engineer",
      "DataOps Engineer",
      "Edge Computing Engineer",
      "SAP Basis / Netweaver Administrator",
      "Oracle DBA", "PostgreSQL DBA", "MySQL DBA", "MongoDB Administrator",
      "Elasticsearch / OpenSearch Engineer",
      "Mainframe / zOS Systems Programmer",
    ],
  },
  {
    id: "j_security", label: "Cybersecurity", icon: Shield, color: "#dc2626",
    domains: ["Software Development"],
    positions: [
      "Security Engineer", "Penetration Tester / Ethical Hacker",
      "Security Analyst (SOC)", "Cloud Security Engineer",
      "Application Security Engineer", "Incident Response Analyst",
      "Threat Intelligence Analyst",
      "Identity & Access Management Engineer",
      "Compliance / GRC Analyst", "Cryptography Engineer",
      "Malware Analyst", "Bug Bounty Hunter",
      "Red Team Operator", "Blue Team Analyst", "Purple Team Engineer",
      "Digital Forensics Analyst", "DFIR Specialist",
      "Security Architect", "Chief Information Security Officer (CISO)",
      "Zero Trust Security Engineer",
      "OT / ICS / SCADA Security Engineer",
      "Mobile Application Security Engineer",
      "Blockchain Security Auditor",
      "DevSecOps Engineer",
      "Threat Modelling Specialist",
      "Vulnerability Management Engineer",
      "Security Awareness Trainer",
      "Privacy Engineer (GDPR / CCPA)",
      "Cyber Risk Analyst",
      "OSINT Analyst",
      "Network Forensics Engineer",
    ],
  },
  {
    id: "j_product", label: "Product Management", icon: Layers, color: "#db2777",
    domains: ["Product Management"],
    positions: [
      "Product Manager", "Technical Product Manager", "Growth Product Manager",
      "Senior Product Manager", "Director of Product", "VP of Product",
      "Chief Product Officer (CPO)", "Associate Product Manager (APM)",
      "Product Analyst", "Product Operations Manager",
      "Platform Product Manager", "API Product Manager",
      "Mobile Product Manager",
      "AI / ML Product Manager",
      "Consumer Product Manager", "Enterprise Product Manager",
      "SaaS Product Manager", "Marketplace Product Manager",
      "Fintech Product Manager", "Healthtech Product Manager",
      "Edtech Product Manager",
      "Product Marketing Manager",
      "Product Strategy Manager",
      "Head of Product",
      "Founding Product Manager (Startup)",
      "Product Management Intern",
    ],
  },
  {
    id: "j_design", label: "Design & UX", icon: Palette, color: "#be185d",
    domains: ["Design (UI/UX)"],
    positions: [
      "UX Designer", "UI Designer", "Product Designer", "UX Researcher",
      "Interaction Designer", "Visual Designer", "Design Lead", "Head of Design",
      "Motion Designer", "Brand Designer", "Graphic Designer",
      "Creative Director", "Content Designer",
      "Service Designer", "Design Strategist",
      "Design Systems Engineer", "Figma / Sketch Expert",
      "Accessibility Designer",
      "AR / VR / XR Designer",
      "Industrial Designer", "Packaging Designer",
      "Marketing Designer",
      "3D Designer / CGI Artist",
      "Illustration Artist",
      "Game UI Designer",
      "Environmental / Wayfinding Designer",
      "Design Researcher",
      "Design Program Manager",
      "VP of Design / CDO",
    ],
  },
  {
    id: "j_management", label: "Engineering Management", icon: Building2, color: "#059669",
    domains: ["Software Development", "Operations"],
    positions: [
      "Engineering Manager", "Director of Engineering", "VP of Engineering",
      "CTO", "Technical Lead", "Staff Engineer", "Principal Engineer",
      "Scrum Master", "Agile Coach", "Project Manager (IT)",
      "Program Manager", "Delivery Manager",
      "Head of Engineering",
      "R&D Manager", "Innovation Manager",
      "Technology Director",
      "Chief Architect",
      "Transformation Lead",
      "Portfolio Manager (IT)",
      "Release Manager",
      "Vendor Management Manager (IT)",
      "IT Governance Manager",
      "Digital Transformation Lead",
    ],
  },
  {
    id: "j_medical", label: "Medical & Healthcare", icon: Stethoscope, color: "#b91c1c",
    domains: ["Other"],
    positions: [
      "Medical Officer / Doctor", "Resident Doctor Interview",
      "General Practitioner (GP)", "Hospitalist / General Medicine Doctor",
      "Cardiologist Interview", "Neurologist Interview",
      "Oncologist Interview", "Endocrinologist Interview",
      "Pulmonologist Interview", "Nephrologist Interview",
      "Gastroenterologist Interview", "Rheumatologist Interview",
      "Dermatologist Interview", "Psychiatrist Interview",
      "Paediatrician Interview", "Neonatologist Interview",
      "Obstetrician & Gynaecologist Interview",
      "Surgeon — General Surgery Interview",
      "Surgeon — Orthopaedic Interview", "Surgeon — Cardiothoracic Interview",
      "Surgeon — Neurosurgery Interview", "Surgeon — Plastic Surgery Interview",
      "Anaesthesiologist Interview", "Intensivist / Critical Care Interview",
      "Emergency Medicine Doctor Interview",
      "Radiologist Interview", "Pathologist Interview",
      "Ophthalmologist Interview", "ENT Surgeon Interview",
      "Dentist / Dental Surgeon Interview",
      "Microbiologist (Clinical) Interview",
      "Clinical Biochemist Interview",
      "Haematologist Interview",
      "Immunologist / Allergist Interview",
      "Sports Medicine Doctor Interview",
      "Occupational Medicine Physician Interview",
      "Clinical Research Associate", "Clinical Research Manager",
      "Medical Affairs Manager", "Pharmacovigilance Associate",
      "Regulatory Affairs Manager (Pharma)",
      "Healthcare Data Analyst", "Health Informatics Manager",
      "Hospital Administrator", "Healthcare Operations Manager",
      "Pharmacist — Retail / Hospital", "Clinical Pharmacist",
      "Registered Nurse", "Nurse Practitioner / NP",
      "Physiotherapist", "Occupational Therapist",
      "Speech Language Pathologist",
      "Dietitian / Nutritionist",
      "Radiographer / Radiologic Technologist",
      "Medical Lab Technologist (MLT)",
      "Medical Coder / Biller", "Biomedical Engineer",
      "Pharmaceutical Sales Rep", "Medical Device Sales Rep",
      "Public Health Specialist", "Epidemiologist",
      "Healthcare Consultant", "Telemedicine Specialist",
      "Mental Health Counsellor / Therapist",
      "Addiction Medicine Specialist",
      "Wound Care Specialist",
      "Perfusionist / Cardiac Technologist",
    ],
  },
  {
    id: "j_finance", label: "Finance & Accounting", icon: Banknote, color: "#047857",
    domains: ["Finance / Accounting"],
    positions: [
      "Financial Analyst", "Investment Banker", "Chartered Accountant (CA)",
      "Cost Accountant (CMA)", "Equity Research Analyst", "Credit Analyst",
      "Risk Analyst", "Audit Manager", "Tax Consultant",
      "Chief Financial Officer (CFO)", "Treasury Analyst",
      "Insurance Underwriter", "Actuary", "Financial Controller",
      "Compliance Officer",
      "FP&A Analyst (Financial Planning & Analysis)",
      "M&A Analyst / Associate", "Leveraged Finance Analyst",
      "Debt Capital Markets Analyst", "Equity Capital Markets Analyst",
      "Private Equity Analyst / Associate", "Venture Capital Analyst",
      "Hedge Fund Analyst", "Portfolio Manager",
      "Fixed Income Analyst", "Derivatives Analyst",
      "Foreign Exchange (Forex) Analyst",
      "Commodity Analyst",
      "Internal Auditor", "External Auditor",
      "Forensic Accountant", "Anti-Money Laundering (AML) Analyst",
      "KYC Analyst", "FATCA / CRS Compliance Analyst",
      "GST / Indirect Tax Consultant",
      "Transfer Pricing Specialist",
      "IFRS / US GAAP Specialist",
      "Insolvency & Restructuring Professional",
      "Real Estate Finance Analyst",
      "Project Finance Analyst",
      "Chief Risk Officer (CRO)",
      "Quantitative Finance Analyst",
    ],
  },
  {
    id: "j_banking", label: "Banking & Fintech", icon: Landmark, color: "#1d4ed8",
    domains: ["Finance / Accounting"],
    positions: [
      "Bank PO / Manager", "Relationship Manager — Banking",
      "Investment Advisor", "Wealth Manager", "Forex Trader",
      "Fintech Product Manager", "Payments Engineer",
      "Lending Operations Manager", "Core Banking Specialist",
      "KYC / AML Analyst", "Digital Banking Specialist",
      "NBFC Operations Manager",
      "Retail Banking Manager", "SME Banking Manager",
      "Corporate Banking Relationship Manager",
      "Trade Finance Manager",
      "Cash Management Specialist",
      "Credit Underwriter — Retail", "Credit Underwriter — Corporate",
      "Mortgage / Home Loan Advisor",
      "Insurance & Bancassurance Manager",
      "Microfinance / MFI Officer",
      "Payment Gateway / PSP Specialist",
      "UPI / NPCI Product Manager",
      "Neo-Bank Operations Lead",
      "Crypto / Digital Assets Compliance Officer",
      "RegTech Specialist",
      "Open Banking API Developer",
      "Buy Now Pay Later (BNPL) Analyst",
      "Embedded Finance Specialist",
      "Financial Inclusion Manager",
    ],
  },
  {
    id: "j_marketing", label: "Marketing & Growth", icon: TrendingUp, color: "#b45309",
    domains: ["Marketing / Growth"],
    positions: [
      "Digital Marketing Manager", "SEO / SEM Specialist",
      "Performance Marketing Manager", "Content Marketing Manager",
      "Social Media Manager", "Email Marketing Specialist",
      "Growth Hacker", "Brand Manager", "Marketing Analyst",
      "CMO / Head of Marketing", "Affiliate Marketing Manager",
      "Influencer Marketing Manager", "CRM Marketing Specialist",
      "Product Marketing Manager",
      "Demand Generation Manager",
      "Marketing Automation Specialist (HubSpot / Marketo)",
      "Conversion Rate Optimisation (CRO) Specialist",
      "Community Manager",
      "Video Marketing Specialist",
      "Podcast Marketing Manager",
      "B2B Marketing Manager",
      "Account-Based Marketing (ABM) Manager",
      "E-commerce Marketing Manager",
      "Mobile Marketing / ASO Specialist",
      "Marketing Data Analyst",
      "Chief Marketing Officer (CMO)",
      "Brand Strategist", "Creative Strategist",
      "Market Research Analyst",
      "PR & Communications Manager",
      "Event & Experiential Marketing Manager",
      "Trade Marketing Manager",
    ],
  },
  {
    id: "j_sales", label: "Sales & Business Dev", icon: ShoppingCart, color: "#7c2d12",
    domains: ["Sales / Business Development"],
    positions: [
      "Sales Executive", "Business Development Executive", "Account Executive",
      "Sales Manager", "VP of Sales", "Enterprise Account Manager",
      "Inside Sales Representative", "Solutions Engineer / Pre-Sales",
      "Channel Sales Manager", "Key Account Manager",
      "Sales Operations Manager", "Customer Success Manager",
      "Chief Revenue Officer (CRO)",
      "Field Sales Representative", "Outbound / SDR (Sales Dev Rep)",
      "Inbound Sales Representative",
      "Technical Sales Engineer",
      "SaaS Account Executive",
      "Retail Store Manager / Floor Sales Manager",
      "Territory Sales Manager",
      "Franchise Development Manager",
      "Partner / Alliance Manager",
      "Customer Retention Manager",
      "Renewal Manager",
      "Revenue Operations (RevOps) Analyst",
      "Contract Negotiation Specialist",
      "Pharma / MedTech Sales Representative",
      "Real Estate Sales Agent / Broker",
      "Insurance Sales Manager",
      "FMCG Sales Manager",
      "Export / International Sales Manager",
    ],
  },
  {
    id: "j_hr", label: "HR & People Ops", icon: HeartHandshake, color: "#9d174d",
    domains: ["Human Resources"],
    positions: [
      "HR Executive / Generalist", "Talent Acquisition Manager",
      "HR Business Partner (HRBP)", "Compensation & Benefits Manager",
      "Learning & Development Manager", "Diversity & Inclusion Manager",
      "Payroll Manager", "HR Operations Manager",
      "Chief People Officer (CPO)", "Organizational Development Manager",
      "Employee Engagement Manager",
      "Recruiter — Technical", "Recruiter — Non-Technical",
      "Sourcing Specialist",
      "Campus Recruitment Manager",
      "Global Mobility Manager",
      "HR Shared Services Lead",
      "HR Analytics Manager / People Analytics",
      "Performance Management Specialist",
      "Workforce Planning Analyst",
      "Culture & Values Manager",
      "Employee Relations Manager",
      "Industrial Relations (IR) Manager",
      "HR Compliance & Policy Manager",
      "HR Technology (HRMS / HRIS) Manager",
      "Succession Planning Manager",
      "Wellbeing & Mental Health Lead",
      "Employer Branding Manager",
      "CHRO (Chief Human Resources Officer)",
    ],
  },
  {
    id: "j_consulting", label: "Consulting & Strategy", icon: Globe, color: "#374151",
    domains: ["Consulting"],
    positions: [
      "Management Consultant", "Strategy Consultant", "Business Analyst",
      "IT Consultant", "Solutions Architect",
      "McKinsey / BCG / Bain Case Interview",
      "Digital Transformation Consultant", "Change Management Consultant",
      "Supply Chain Consultant", "Operations Analyst",
      "Market Research Analyst", "Policy Analyst",
      "ERP Consultant (SAP / Oracle)", "Salesforce Consultant",
      "HR Transformation Consultant",
      "Finance Transformation Consultant",
      "Customer Experience (CX) Consultant",
      "Data Strategy Consultant",
      "AI / Automation Consultant",
      "Sustainability / ESG Consultant",
      "Healthcare Consulting Analyst",
      "Public Sector / Government Consultant",
      "Infrastructure & Project Advisory Consultant",
      "Deloitte / KPMG / EY / PwC Consulting Interview",
      "Accenture / Capgemini / Cognizant Consulting Interview",
      "Boutique Strategy Consulting Interview",
      "Economic Consulting Analyst",
      "Forensic Consulting Analyst",
      "Turnaround & Restructuring Consultant",
    ],
  },
  {
    id: "j_operations", label: "Operations & Logistics", icon: Truck, color: "#92400e",
    domains: ["Operations"],
    positions: [
      "Operations Manager", "Supply Chain Manager", "Logistics Manager",
      "Warehouse Manager", "Procurement Manager", "Inventory Analyst",
      "Plant Manager", "Quality Assurance Manager",
      "Process Improvement Manager", "Fleet Manager",
      "Import / Export Manager",
      "Chief Operating Officer (COO)",
      "Sourcing & Vendor Development Manager",
      "Category Manager — Procurement",
      "Contract & Commercial Manager",
      "Demand Planning Analyst",
      "S&OP (Sales & Operations Planning) Manager",
      "Production Planning Manager",
      "Last-Mile Delivery Operations Manager",
      "E-Commerce Fulfilment Manager",
      "Cold Chain / Pharma Logistics Manager",
      "Freight Forwarding Manager",
      "Customs & Trade Compliance Manager",
      "3PL / 4PL Partnership Manager",
      "Lean / Six Sigma Black Belt",
      "Business Continuity Manager",
      "Facilities Manager",
      "Health, Safety & Environment (HSE) Manager",
      "Quality Control Inspector",
      "ISO / Compliance Auditor",
      "Reverse Logistics Manager",
    ],
  },
  {
    id: "j_legal", label: "Legal & Compliance", icon: Scale, color: "#4b5563",
    domains: ["Other"],
    positions: [
      "Corporate Lawyer", "In-House Counsel", "Legal Associate",
      "Compliance Manager", "Contract Manager",
      "Intellectual Property (IP) Lawyer", "Labour Law Specialist",
      "Legal Analyst", "Paralegal", "GDPR / Data Privacy Counsel",
      "Arbitration / Dispute Resolution",
      "General Counsel (GC)", "Chief Legal Officer (CLO)",
      "M&A / Transaction Lawyer",
      "Banking & Finance Lawyer",
      "Real Estate / Property Lawyer",
      "Tax Lawyer",
      "Competition & Antitrust Lawyer",
      "Regulatory Affairs Lawyer",
      "Criminal Defence Lawyer",
      "Family Law Attorney",
      "Immigration Lawyer",
      "Environmental / Climate Law Specialist",
      "Insurance Lawyer",
      "Media & Entertainment Lawyer",
      "Technology & Cyber Law Specialist",
      "Employment & Benefits Lawyer",
      "Litigation Associate / Senior Associate",
      "Court Manager / Judicial Officer Interview",
      "Legal Operations Manager",
      "Legal Project Manager",
      "Notary / Documentation Specialist",
    ],
  },
  {
    id: "j_education", label: "Education & EdTech", icon: GraduationCap, color: "#6d28d9",
    domains: ["Other"],
    positions: [
      "School Teacher", "College / University Professor",
      "Online Educator / Tutor", "Curriculum Designer",
      "EdTech Product Manager", "Instructional Designer",
      "Academic Counsellor", "School Principal / Administrator",
      "Training & Development Specialist", "Special Education Teacher",
      "Early Childhood Educator", "Montessori Teacher",
      "STEM Education Specialist",
      "Education Programme Manager",
      "Corporate Trainer / L&D Specialist",
      "E-Learning Content Developer",
      "Learning Experience Designer (LXD)",
      "Education Policy Analyst",
      "University Admissions Counsellor",
      "Student Affairs Manager",
      "Research Academic / Post-Doc",
      "Assessment & Evaluation Specialist",
      "Literacy & Numeracy Coach",
      "TESOL / ESL Teacher",
      "Librarian / Information Specialist",
      "EdTech Sales Manager",
      "EdTech Customer Success Manager",
      "School Psychologist / Counsellor",
      "Vocational Training Instructor",
    ],
  },
  {
    id: "j_engineering_core", label: "Core Engineering", icon: Wrench, color: "#1e3a5f",
    domains: ["Other"],
    positions: [
      "Mechanical Engineer", "Civil Engineer", "Electrical Engineer",
      "Electronics Engineer", "Chemical Engineer", "Aerospace Engineer",
      "Structural Engineer", "Automotive Engineer", "Manufacturing Engineer",
      "Process Engineer", "Quality Control Engineer",
      "Project Engineer (Construction)", "Environmental Engineer",
      "Petroleum / Oil & Gas Engineer",
      "Mining Engineer",
      "Naval Architect / Marine Engineer",
      "Textile / Fibre Engineer",
      "Biomedical Engineer",
      "Nuclear Engineer",
      "Agricultural Engineer",
      "Robotics & Automation Engineer",
      "Instrumentation & Control Engineer",
      "HVAC Engineer",
      "Fire & Safety Engineer",
      "Geotechnical Engineer",
      "Transportation / Highway Engineer",
      "Water Resources / Irrigation Engineer",
      "Power Systems Engineer",
      "Renewable Energy Engineer (Solar / Wind)",
      "VLSI / Semiconductor Design Engineer",
      "Telecommunication Engineer",
      "Maintenance Engineer",
      "Reliability / Asset Integrity Engineer",
      "Technical Sales Engineer (Core)",
    ],
  },
  {
    id: "j_media", label: "Media & Creative", icon: Camera, color: "#be185d",
    domains: ["Other"],
    positions: [
      "Journalist / Reporter", "Content Writer", "Copywriter",
      "Video Editor", "Photographer", "Film Director / Producer",
      "Social Media Content Creator", "Podcast Producer",
      "Animator / Motion Graphics", "Creative Director",
      "PR Manager", "Scriptwriter",
      "News Anchor / Broadcast Journalist",
      "Investigative Journalist",
      "Data Journalist",
      "Sports Journalist",
      "Entertainment Journalist",
      "Technical Writer / Documentation Specialist",
      "UX Writer",
      "Ghostwriter",
      "Editor — Publishing / Books",
      "Magazine / Feature Writer",
      "Radio Jockey (RJ)",
      "Game Narrative Designer",
      "Influencer Marketing Creator",
      "YouTube Content Strategist",
      "Brand Content Manager",
      "Advertising Art Director",
      "Digital Illustrator",
      "3D Modeller / VFX Artist",
      "Storyboard Artist",
      "Music Composer / Jingle Creator",
      "Voice Over Artist",
      "Subtitling & Localisation Specialist",
    ],
  },
  {
    id: "j_hospitality", label: "Hospitality & Travel", icon: Hotel, color: "#d97706",
    domains: ["Other"],
    positions: [
      "Hotel Manager", "Front Office Manager", "Food & Beverage Manager",
      "Event Manager", "Travel Consultant", "Airline Cabin Crew",
      "Airport Customer Service", "Tourism Manager",
      "Restaurant Manager", "Catering Manager", "Spa / Resort Manager",
      "Revenue Manager — Hotels", "Sales Manager — Hotels",
      "Housekeeping Manager", "Guest Relations Manager",
      "Butler / Concierge Manager",
      "Chef / Head Chef", "Sous Chef", "Pastry Chef",
      "Food Stylist / Culinary Creator",
      "Sommelier / Beverage Manager",
      "Banquet & Conferences Manager",
      "Cruise Ship Manager",
      "Travel & Tourism Product Manager",
      "Online Travel Agency (OTA) Manager",
      "Tour Operations Manager",
      "Destination Wedding Planner",
      "Ecotourism & Responsible Travel Specialist",
      "Hospitality Trainer / L&D Manager",
      "Quality Assurance — Food Safety (HACCP)",
      "Airport Lounge Operations Manager",
      "Airline Ground Operations Manager",
      "Hotel GM (General Manager) Interview",
    ],
  },
  {
    id: "j_government", label: "Government & PSU", icon: Landmark, color: "#064e3b",
    domains: ["Other"],
    positions: [
      "IAS / IPS / IFS Officer Interview",
      "IRS (Revenue Service) Officer Interview",
      "IFoS (Forest Service) Officer Interview",
      "PSU Technical Interview (BHEL / ONGC / NTPC)",
      "PSU Interview — SAIL / GAIL / IOCL / HPCL / BPCL",
      "PSU Interview — Power Grid / PGCIL",
      "PSU Interview — Coal India / NLC India",
      "DRDO Scientist Interview", "ISRO Scientist Interview",
      "BARC Scientific Officer Interview",
      "CSIR Scientist Interview",
      "ICAR Scientist Interview",
      "ICMR Scientist Interview",
      "Railways Senior Engineer Interview",
      "RRB Senior Section Engineer Interview",
      "Municipal Corporation Officer Interview",
      "Town Planner — Government Interview",
      "Defence Civilian Interview",
      "Government Bank Officer (RBI / NABARD)",
      "SEBI / IRDA / PFRDA Officer Interview",
      "Postal Services Group A Officer Interview",
      "Indian Audit & Accounts Service Interview",
      "Indian Information Service Interview",
      "Indian Railway Accounts Service Interview",
      "Indian Trade Service Interview",
      "Statistical Service (ISS) Interview",
      "Economic Service (IES) Interview",
      "Public Policy Analyst",
      "Smart Cities Mission Officer Interview",
      "National Health Mission (NHM) Officer Interview",
      "District Collector Office Interview",
    ],
  },
];

/* ── Title map ───────────────────────────────────────────────────────────── */
const TITLE_MAP = {
  "JEE Mains Preparation":                  ["JEE Mains Mock Interview", "Maths & Physics Assessment", "JEE Concept Round"],
  "JEE Advanced Preparation":               ["JEE Advanced Mock Round", "Advanced Physics & Maths", "JEE Advanced Concept Test"],
  "NEET UG Preparation":                    ["NEET UG Mock Interview", "Biology & PCB Assessment", "NEET Concept Round"],
  "NEET PG Preparation":                    ["NEET PG Mock Round", "Clinical Knowledge Assessment", "Medical PG Entrance Prep"],
  "GATE — Computer Science":                ["GATE CS Mock Interview", "Algorithms & OS Round", "GATE CS Technical Assessment"],
  "UPSC Civil Services (IAS) Prep":         ["UPSC IAS Mock Interview", "Civil Services Personality Test", "UPSC GS Round"],
  "UPSC Personality Test (Interview)":      ["UPSC Board Interview Prep", "UPSC Personality Test Round", "IAS Interview Mock"],
  "Campus Placement — Software Engineer":   ["Campus Placement — SWE Round", "DSA & Coding Assessment", "Campus Technical Interview"],
  "Campus Placement — Full Stack Developer":["Full Stack Campus Round", "MERN Stack Assessment", "Full Stack Campus Interview"],
  "Campus Placement — ML Engineer":         ["ML Campus Placement Round", "ML & Stats Assessment", "AI/ML Campus Interview"],
  "MBA Entrance — CAT":                     ["CAT Mock GD-PI Round", "MBA Entrance Interview Prep", "Business School Interview"],
  "MBA Finance Interview":                  ["MBA Finance Round", "Corporate Finance Assessment", "Financial Analysis Interview"],
  "CA Foundation Preparation":              ["CA Foundation Mock Interview", "Accounts & Law Assessment", "CA Foundation Round"],
  "Banking PO Interview (IBPS / SBI)":      ["Bank PO Mock Interview", "Banking GK & Reasoning Round", "IBPS Interview Prep"],
  "CLAT Entrance Preparation":              ["CLAT Mock Interview", "Legal Reasoning Assessment", "Law Entrance Prep Round"],
  "Microbiology Viva":                      ["Microbiology Viva Round", "Microbial World Assessment", "Microbiology Lab Exam Prep"],
  "Medical Microbiology — Bacteriology":    ["Bacteriology Assessment", "Clinical Bacteriology Round", "Bacteriology Viva Prep"],
  "Medical Microbiology — Virology":        ["Virology Assessment Round", "Clinical Virology Viva", "Virology Concept Test"],
  "Medical Microbiology — Parasitology":    ["Parasitology Viva", "Clinical Parasitology Round", "Parasitology Assessment"],
  "Medical Microbiology — Mycology":        ["Mycology Viva Round", "Clinical Mycology Assessment", "Fungal Infections Viva"],
  "B.Sc Microbiology Viva":                 ["B.Sc Microbiology Assessment", "Microbiology Lab Viva", "Microbiology Concept Round"],
  "M.Sc Microbiology Viva":                 ["M.Sc Microbiology Assessment", "Advanced Microbiology Viva", "Microbiology Research Round"],
  "Clinical Research Associate":            ["CRA Interview Round", "Clinical Trials Assessment", "GCP & Regulatory Round"],
  "Generative AI Engineer":                 ["GenAI Engineer Interview", "LLM & Prompt Engineering Round", "Generative AI Assessment"],
  "LLM Engineer / Prompt Engineer":         ["LLM Engineering Interview", "Prompt Engineering Round", "GenAI Systems Assessment"],
  "Renewable Energy Engineer (Solar / Wind)":["Renewable Energy Interview", "Solar / Wind Engineering Round", "Clean Energy Assessment"],
  "Frontend Developer":       ["Frontend Developer Interview", "React & CSS Assessment", "Frontend Coding Challenge"],
  "Backend Developer":        ["Backend Developer Interview", "API & Database Deep-Dive", "Server-Side Assessment"],
  "Full Stack Developer":     ["Full Stack Developer Interview", "End-to-End Engineering Round", "Full Stack Technical Loop"],
  "React Developer":          ["React Developer Interview", "React Hooks & State Assessment", "React Frontend Round"],
  "Data Scientist":           ["Data Scientist Interview", "ML & Stats Assessment", "Data Science Technical Round"],
  "Machine Learning Engineer":["ML Engineer Interview", "ML Systems Design Round", "AI & Modelling Assessment"],
  "DevOps Engineer":          ["DevOps Engineer Interview", "CI/CD & Cloud Round", "DevOps Technical Assessment"],
  "Product Manager":          ["Product Manager Interview", "PM Case Study Round", "Product Sense Assessment"],
  "Security Engineer":        ["Security Engineer Interview", "Threat Analysis Round", "AppSec Technical Assessment"],
  "Financial Analyst":        ["Financial Analyst Interview", "Finance & Valuation Round", "Financial Modelling Assessment"],
  "Management Consultant":    ["Consulting Case Interview", "Strategy & Problem Solving Round", "Management Consulting Assessment"],
  "UX Designer":              ["UX Designer Interview", "Design Thinking Assessment", "UX Portfolio Review"],
  "Data Analyst":             ["Data Analyst Interview", "SQL & Analytics Round", "Data Analysis Assessment"],
  "Business Analyst":         ["Business Analyst Interview", "Requirements & Analysis Round", "BA Case Study"],
  "HR Executive / Generalist":["HR Interview Round", "People & Culture Assessment", "HR Generalist Interview"],
  "Sales Executive":          ["Sales Interview Round", "Sales Pitch & Negotiation Assessment", "BD Interview"],
};

function getTitleSuggestions(pos, type) {
  if (!pos?.trim()) return [];
  if (TITLE_MAP[pos]) return TITLE_MAP[pos];
  const sfx = type === "technical" ? "Technical Round" : type === "behavioral" ? "Behavioral Interview" : "Interview";
  return [`${pos} ${sfx}`, `${pos} — Full Assessment`, `${pos} — Practice Session`];
}
function getAutoTitle(pos, type) { return getTitleSuggestions(pos, type)[0] || ""; }

/* ── Map profile → default category ─────────────────────────────────────── */
function getDefaultCatId(profile, tab) {
  if (!profile) return null;
  if (tab === "student") {
    const found = STUDENT_CATEGORIES.find(c => c.streams.includes(profile.stream));
    return found?.id || "s_competitive";
  }
  const found = JOB_CATEGORIES.find(c => c.domains.includes(profile.domain));
  return found?.id || "j_software";
}

/* ── Resolve domain string for backend ──────────────────────────────────── */
function resolveDomain(catId, isStudent) {
  if (isStudent) return STUDENT_CATEGORIES.find(c => c.id === catId)?.domain || "Other";
  const map = {
    j_software: "Software Development", j_data: "Data Science / AI / ML",
    j_infra: "Software Development",    j_security: "Software Development",
    j_product: "Product Management",    j_design: "Design (UI/UX)",
    j_management: "Operations",         j_medical: "Other",
    j_finance: "Finance / Accounting",  j_banking: "Finance / Accounting",
    j_marketing: "Marketing / Growth",  j_sales: "Sales / Business Development",
    j_hr: "Human Resources",            j_consulting: "Consulting",
    j_operations: "Operations",         j_legal: "Other",
    j_education: "Other",               j_engineering_core: "Other",
    j_media: "Other",                   j_hospitality: "Other",
    j_government: "Other",
  };
  return map[catId] || "Other";
}

// OnboardingPage → Interview model experience mapping
const EXP_TO_MODEL = {
  fresher: "entry", junior: "entry", mid: "intermediate",
  senior: "senior", lead: "expert",
  entry: "entry", intermediate: "intermediate", expert: "expert",
};

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN MODAL
══════════════════════════════════════════════════════════════════════════════ */
export default function CreateInterviewModal({ user, onClose, onSuccess, userProfile = null }) {
  const profileType = userProfile?.userType === "student" ? "student" : "jobseeker";
  const [activeTab, setActiveTab] = useState(profileType);
  const isStudent = activeTab === "student";
  const allCats   = isStudent ? STUDENT_CATEGORIES : JOB_CATEGORIES;

  const [activeCat, setActiveCat] = useState(() => {
    const def = getDefaultCatId(userProfile, activeTab);
    if (def && allCats.some(c => c.id === def)) return def;
    return allCats[0]?.id || null;
  });

  const [formData, setFormData] = useState({
    title: "", jobPosition: "", jobDescription: "",
    experienceLevel: "intermediate", interviewType: "mixed", totalQuestions: 5,
  });
  const [creating, setCreating] = useState(false);

  const [posSearch,     setPosSearch]     = useState("");
  const [posDropOpen,   setPosDropOpen]   = useState(false);
  const [titleDropOpen, setTitleDropOpen] = useState(false);
  const posRef   = useRef(null);
  const titleRef = useRef(null);

  // Reset category + position when tab changes
  useEffect(() => {
    const cats = isStudent ? STUDENT_CATEGORIES : JOB_CATEGORIES;
    const def  = getDefaultCatId(activeTab === profileType ? userProfile : null, activeTab);
    setActiveCat(def && cats.some(c => c.id === def) ? def : cats[0]?.id || null);
    setPosSearch("");
    setPosDropOpen(false);
    setFormData(f => ({ ...f, jobPosition: "", title: "" }));
  }, [activeTab]); // eslint-disable-line

  // Pre-fill from profile on mount
  useEffect(() => {
    if (!userProfile) return;
    const u = {};
    if (userProfile.experienceLevel) u.experienceLevel = EXP_TO_MODEL[userProfile.experienceLevel] || "intermediate";
    if (userProfile.userType !== "student" && userProfile.jobTitle?.trim()) {
      u.jobPosition = userProfile.jobTitle.trim();
      u.title = getAutoTitle(userProfile.jobTitle.trim(), "mixed");
    }
    if (Object.keys(u).length) setFormData(f => ({ ...f, ...u }));
  }, []); // eslint-disable-line

  const activeCatObj = allCats.find(c => c.id === activeCat);
  const allPositions = allCats.flatMap(c => c.positions.map(p => ({ position: p, cat: c })));

  const filteredPos = posSearch.trim()
    ? allPositions.filter(({ position }) => position.toLowerCase().includes(posSearch.toLowerCase()))
    : activeCatObj
      ? activeCatObj.positions.map(p => ({ position: p, cat: activeCatObj }))
      : [];

  const titleSuggestions = getTitleSuggestions(formData.jobPosition, formData.interviewType);

  const selectPosition = (pos) => {
    const autoTitle = getAutoTitle(pos, formData.interviewType);
    setFormData(f => ({ ...f, jobPosition: pos, title: f.title || autoTitle }));
    setPosSearch("");
    setPosDropOpen(false);
  };

  // ── Submit — sends ALL context the backend needs ─────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.jobPosition.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setCreating(true);
    try {
      // Find the category object for the currently selected position
      // (it may differ from activeCat if user searched across categories)
      const positionCatObj =
        allCats.find(c => c.positions.includes(formData.jobPosition)) ||
        activeCatObj;

      const payload = {
        // ── Interview schema fields ──────────────────────────────────────
        title:           formData.title.trim(),
        jobPosition:     formData.jobPosition.trim(),
        jobDescription:  formData.jobDescription.trim(),
        experienceLevel: formData.experienceLevel,
        interviewType:   formData.interviewType,
        totalQuestions:  formData.totalQuestions,

        // ── User identity ────────────────────────────────────────────────
        userId:    user.id,
        userEmail: user.primaryEmailAddress?.emailAddress,
        userName:  user.fullName,

        // ── Context fields → drive Gemini question generation ────────────
        // These three are the NEW fields that make questions accurate:
        userType:      activeTab === "student" ? "student" : "jobseeker",
        domain:        positionCatObj ? resolveDomain(positionCatObj.id, isStudent) : "Other",
        categoryLabel: positionCatObj?.label || "",

        // Pass student-specific fields if applicable
        ...(isStudent && {
          stream:       userProfile?.stream || "",
          studentClass: userProfile?.studentClass || "",
        }),
      };

      const response = await fetch(`${API_URL}/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      if (data.success) {
        toast.success("Interview created successfully!");
        onSuccess(data.data);
      } else {
        toast.error(data.message || "Failed to create interview");
      }
    } catch (error) {
      console.error("Error creating interview:", error);
      toast.error("Failed to create interview");
    } finally {
      setCreating(false);
    }
  };

  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

  const labelStyle = {
    display: "flex", alignItems: "center", gap: 5,
    fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 6,
    textTransform: "uppercase", letterSpacing: "0.06em",
    fontFamily: "'Sora','Segoe UI',sans-serif",
  };

  return (
    <div onClick={handleOverlayClick} style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(15,23,42,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px", boxSizing: "border-box",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        .cim-card,.cim-card * { -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility; }
        .cim-input {
          width:100%; background:#fff; border:1.5px solid #94a3b8; border-radius:10px;
          padding:10px 14px; font-size:16px; color:#0f172a; font-family:'Sora','Segoe UI',sans-serif;
          outline:none; transition:border-color .2s,box-shadow .2s; box-sizing:border-box;
        }
        .cim-input:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.1); font-size:16px; }
        .cim-input::placeholder { color:#64748b; font-size:16px; }
        .cim-input option { background:#fff; color:#0f172a; }
        .cim-scroll::-webkit-scrollbar { width:4px; }
        .cim-scroll::-webkit-scrollbar-thumb { background:#e2e8f0; border-radius:99px; }
        .cim-inner::-webkit-scrollbar { width:3px; }
        .cim-inner::-webkit-scrollbar-thumb { background:#e2e8f0; border-radius:99px; }
        .cim-range {
          -webkit-appearance:none; appearance:none; height:5px; border-radius:5px;
          outline:none; cursor:pointer; width:100%;
          background:linear-gradient(to right,#6366f1 0%,#6366f1 var(--val,29%),#e2e8f0 var(--val,29%),#e2e8f0 100%);
        }
        .cim-range::-webkit-slider-thumb {
          -webkit-appearance:none; width:18px; height:18px; border-radius:50%;
          background:linear-gradient(135deg,#6366f1,#a855f7);
          border:2.5px solid #fff; box-shadow:0 2px 8px rgba(99,102,241,.35); cursor:pointer;
        }
        @keyframes cimIn { from{opacity:0;transform:scale(.96) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .cim-card { animation:cimIn .28s cubic-bezier(.34,1.56,.64,1) forwards; }
        @keyframes dropIn { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }
        .cim-dropdown { animation:dropIn .15s ease forwards; }
        .cim-btn-cancel {
          flex:1; padding:11px 16px; border-radius:10px; border:1.5px solid #cbd5e1;
          background:#f1f5f9; color:#000; font-size:13px; font-weight:600;
          cursor:pointer; font-family:'Sora','Segoe UI',sans-serif; transition:all .15s;
        }
        .cim-btn-cancel:hover:not(:disabled) { background:#e2e8f0; border-color:#94a3b8; }
        .cim-btn-cancel:disabled { opacity:.5; cursor:not-allowed; }
        .cim-btn-submit {
          flex:2; padding:11px 16px; border-radius:10px; border:none;
          background:linear-gradient(135deg,#2563eb 0%,#7c3aed 55%,#db2777 100%);
          color:#fff; font-size:13px; font-weight:700; cursor:pointer;
          font-family:'Sora','Segoe UI',sans-serif;
          display:flex; align-items:center; justify-content:center; gap:7px;
          transition:all .2s; box-shadow:0 4px 16px rgba(99,102,241,.28);
        }
        .cim-btn-submit:hover:not(:disabled) { box-shadow:0 8px 28px rgba(99,102,241,.42); transform:translateY(-1px); }
        .cim-btn-submit:disabled { opacity:.5; cursor:not-allowed; transform:none; }
        .cim-close:hover { background:#f1f5f9 !important; border-color:#94a3b8 !important; }
        .cim-tab { padding:7px 0; flex:1; border:none; cursor:pointer; font-size:12.5px; font-weight:700; border-radius:8px; transition:all .18s; font-family:'Sora','Segoe UI',sans-serif; }
        .cim-tab.active   { background:#fff; color:#6366f1; box-shadow:0 1px 6px rgba(99,102,241,.15); }
        .cim-tab.inactive { background:transparent; color:#94a3b8; }
        .cim-cat-pill {
          padding:5px 11px; border-radius:20px; cursor:pointer; white-space:nowrap;
          border:1.5px solid #e2e8f0; background:#f8faff; font-size:11px; font-weight:600;
          color:#475569; font-family:'Sora','Segoe UI',sans-serif;
          display:flex; align-items:center; gap:4px; transition:all .15s; flex-shrink:0;
        }
        .cim-cat-pill:hover { border-color:#a5b4fc; background:#f5f3ff; color:#4f46e5; }
        .cim-pos-tile {
          padding:8px 10px; border-radius:9px; cursor:pointer; text-align:left;
          border:1.5px solid #e2e8f0; background:#f8faff;
          display:flex; align-items:flex-start; justify-content:space-between; gap:4px;
          transition:all .13s; font-family:'Sora','Segoe UI',sans-serif;
        }
        .cim-pos-tile:hover { border-color:#a5b4fc; background:#f5f3ff; }
        .cim-drop-row {
          padding:9px 12px; cursor:pointer; background:transparent; border:none;
          width:100%; text-align:left; display:flex; align-items:center; gap:8px;
          border-bottom:1px solid #f1f5f9; font-family:'Sora','Segoe UI',sans-serif; transition:background .1s;
        }
        .cim-drop-row:hover { background:#f8faff; }
        .cim-drop-row:last-child { border-bottom:none; }
        .cim-title-row {
          padding:8px 12px; cursor:pointer; background:transparent; border:none;
          width:100%; text-align:left; display:flex; align-items:center; gap:7px;
          border-bottom:1px solid #f1f5f9; font-family:'Sora','Segoe UI',sans-serif; transition:background .1s;
        }
        .cim-title-row:hover { background:#f8faff; }
        .cim-title-row:last-child { border-bottom:none; }
        @media (max-width:420px) {
          .cim-card { border-radius:16px !important; }
          .cim-card form { padding:14px 16px 18px !important; gap:11px !important; }
          .cim-input { padding:8px 11px !important; font-size:15px !important; border-radius:8px !important; }
          .cim-g2 { grid-template-columns:1fr !important; }
        }
      `}</style>

      <div className="cim-card cim-scroll" style={{
        background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: 20,
        width: "100%", maxWidth: 580, maxHeight: "94dvh", overflowY: "auto",
        boxShadow: "0 24px 64px rgba(15,23,42,0.18),0 4px 16px rgba(99,102,241,0.08)",
        fontFamily: "'Sora','Segoe UI',sans-serif",
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: "18px 24px 14px", borderBottom: "1.5px solid #f1f5f9",
          background: "linear-gradient(135deg,rgba(99,102,241,0.05),rgba(168,85,247,0.03),rgba(219,39,119,0.02))",
          borderRadius: "20px 20px 0 0",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 13,
                background: "linear-gradient(135deg,#ede9fe,#dbeafe)",
                border: "1.5px solid #c4b5fd",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(99,102,241,0.12)",
              }}>
                {isStudent ? <GraduationCap style={{ width: 18, height: 18, color: "#7c3aed" }} />
                           : <Briefcase     style={{ width: 18, height: 18, color: "#7c3aed" }} />}
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                  Create New Interview
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, fontWeight: 500 }}>
                  {activeCatObj
                    ? `Questions will be specific to: ${activeCatObj.label}`
                    : "Select a category to get started"}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="cim-close" style={{
              width: 32, height: 32, borderRadius: 9, border: "1.5px solid #e2e8f0",
              background: "#f8faff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#64748b", transition: "all .15s",
            }}>
              <X style={{ width: 15, height: 15 }} />
            </button>
          </div>

          {/* Tab toggle */}
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 10, padding: 3, gap: 3 }}>
            <button type="button" className={`cim-tab ${activeTab === "student" ? "active" : "inactive"}`}
              onClick={() => setActiveTab("student")}>
              🎓 Student
              {profileType === "student" && <span style={{ fontSize: 9, marginLeft: 4, opacity: .7 }}>★ your profile</span>}
            </button>
            <button type="button" className={`cim-tab ${activeTab === "jobseeker" ? "active" : "inactive"}`}
              onClick={() => setActiveTab("jobseeker")}>
              💼 Professional
              {profileType === "jobseeker" && <span style={{ fontSize: 9, marginLeft: 4, opacity: .7 }}>★ your profile</span>}
            </button>
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ══ CATEGORY PILLS ════════════════════════════════════════════ */}
          <div>
            <label style={labelStyle}>
              <Layers style={{ width: 11, height: 11, color: "#7c3aed" }} />
              {isStudent ? "Study Category" : "Job Category"}
              <span style={{ fontSize: 10, fontWeight: 400, color: "#94a3b8", textTransform: "none", letterSpacing: 0, marginLeft: 4 }}>
                — questions will match your selection
              </span>
            </label>

            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 10 }}>
              {allCats.map(cat => {
                const Icon = cat.icon;
                const sel  = activeCat === cat.id;
                const isProfileMatch = (() => {
                  if (!userProfile || activeTab !== profileType) return false;
                  return isStudent
                    ? cat.streams.includes(userProfile.stream)
                    : cat.domains.includes(userProfile.domain);
                })();
                return (
                  <button type="button" key={cat.id} className="cim-cat-pill"
                    onClick={() => { setActiveCat(sel ? null : cat.id); setPosSearch(""); }}
                    style={sel ? { borderColor: cat.color, background: `${cat.color}14`, color: cat.color }
                               : isProfileMatch ? { borderColor: `${cat.color}80`, background: `${cat.color}08` }
                               : {}}
                  >
                    <Icon style={{ width: 10, height: 10 }} />
                    {cat.label}
                    {isProfileMatch && !sel && (
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Position grid */}
            {activeCat && !posSearch.trim() && activeCatObj && (
              <div className="cim-inner" style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5,
                maxHeight: 190, overflowY: "auto", paddingRight: 2,
              }}>
                {activeCatObj.positions.map(pos => {
                  const sel = formData.jobPosition === pos;
                  return (
                    <button type="button" key={pos} className="cim-pos-tile"
                      onClick={() => selectPosition(pos)}
                      style={sel ? { borderColor: activeCatObj.color, background: `${activeCatObj.color}10` } : {}}
                    >
                      <span style={{ fontSize: 11.5, lineHeight: 1.35, flex: 1, color: sel ? "#0f172a" : "#334155", fontWeight: sel ? 700 : 400 }}>
                        {pos}
                      </span>
                      {sel && <Check style={{ width: 11, height: 11, color: activeCatObj.color, flexShrink: 0, marginTop: 1 }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ══ POSITION SEARCH ══════════════════════════════════════════ */}
          <div>
            <label style={labelStyle}>
              <Briefcase style={{ width: 11, height: 11, color: "#6366f1" }} />
              {isStudent ? "Exam / Topic / Role" : "Job Position"}
              <span style={{ color: "#ef4444", fontWeight: 800 }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "#94a3b8", pointerEvents: "none" }} />
              <input ref={posRef} type="text" value={posSearch}
                onChange={e => { setPosSearch(e.target.value); setPosDropOpen(true); }}
                onFocus={() => setPosDropOpen(true)}
                onBlur={() => setTimeout(() => setPosDropOpen(false), 170)}
                placeholder={formData.jobPosition ? formData.jobPosition : isStudent ? "Search exams, topics, placements…" : "Search any job role…"}
                className="cim-input"
                style={{
                  paddingLeft: 34, paddingRight: formData.jobPosition ? 34 : 14,
                  color: !posSearch && formData.jobPosition ? "#6366f1" : undefined,
                  fontWeight: !posSearch && formData.jobPosition ? 700 : undefined,
                }}
              />
              {formData.jobPosition && (
                <button type="button"
                  onClick={() => { setFormData(f => ({ ...f, jobPosition: "", title: "" })); setPosSearch(""); }}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 2 }}>
                  <X style={{ width: 13, height: 13 }} />
                </button>
              )}
              {posDropOpen && posSearch.trim() && (
                <div className="cim-dropdown cim-inner" style={{
                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 99,
                  background: "#fff", border: "1.5px solid #e2e8f0", borderTop: "none",
                  borderRadius: "0 0 12px 12px", maxHeight: 220, overflowY: "auto",
                  boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
                }}>
                  {filteredPos.length === 0 && (
                    <div style={{ padding: "12px", color: "#94a3b8", fontSize: 12.5, textAlign: "center" }}>
                      Not in list — use the option below
                    </div>
                  )}
                  {filteredPos.slice(0, 40).map(({ position, cat }) => {
                    const sel = formData.jobPosition === position;
                    return (
                      <button type="button" key={position} className="cim-drop-row"
                        onMouseDown={() => selectPosition(position)}
                        style={{ borderLeft: `3px solid ${sel ? cat.color : "transparent"}` }}>
                        <span style={{ flex: 1, fontSize: 13, color: sel ? "#1e293b" : "#334155", fontWeight: sel ? 700 : 400 }}>
                          {position}
                        </span>
                        <span style={{ fontSize: 9.5, color: cat.color, fontWeight: 700, background: `${cat.color}18`, padding: "1px 7px", borderRadius: 99, flexShrink: 0 }}>
                          {cat.label}
                        </span>
                        {sel && <Check style={{ width: 11, height: 11, color: "#6366f1", flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                  {!filteredPos.some(({ position }) => position.toLowerCase() === posSearch.toLowerCase()) && (
                    <button type="button" className="cim-drop-row"
                      onMouseDown={() => selectPosition(posSearch.trim())}
                      style={{ borderLeft: "3px solid #6366f1", background: "#f8faff" }}>
                      <Sparkles style={{ width: 11, height: 11, color: "#6366f1", flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, color: "#4f46e5", fontWeight: 600 }}>
                        Use "{posSearch.trim()}"
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
            {formData.jobPosition && (
              <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1" }} />
                <span style={{ fontSize: 12, color: "#4f46e5", fontWeight: 600 }}>{formData.jobPosition}</span>
              </div>
            )}
          </div>

          {/* ══ TITLE ════════════════════════════════════════════════════ */}
          <div>
            <label style={labelStyle}>
              <FileText style={{ width: 11, height: 11, color: "#6366f1" }} />
              Interview Title <span style={{ color: "#ef4444", fontWeight: 800 }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <input ref={titleRef} type="text" value={formData.title}
                onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                onFocus={() => titleSuggestions.length > 0 && setTitleDropOpen(true)}
                onBlur={() => setTimeout(() => setTitleDropOpen(false), 170)}
                placeholder="e.g. NEET UG Biology Assessment" required
                className="cim-input" style={{ paddingRight: titleSuggestions.length ? 36 : 14 }}
              />
              {titleSuggestions.length > 0 && (
                <button type="button" tabIndex={-1} onClick={() => setTitleDropOpen(d => !d)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                  <Sparkles style={{ width: 13, height: 13, color: "#6366f1" }} />
                </button>
              )}
              {titleDropOpen && titleSuggestions.length > 0 && (
                <div className="cim-dropdown" style={{
                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 99,
                  background: "#fff", border: "1.5px solid #e2e8f0", borderTop: "none",
                  borderRadius: "0 0 12px 12px", overflow: "hidden",
                  boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
                }}>
                  <div style={{ padding: "6px 12px 4px", fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9" }}>
                    ✦ Smart suggestions
                  </div>
                  {titleSuggestions.map(s => (
                    <button type="button" key={s} className="cim-title-row"
                      onMouseDown={() => { setFormData(f => ({ ...f, title: s })); setTitleDropOpen(false); }}>
                      <Sparkles style={{ width: 10, height: 10, color: "#6366f1", flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "#334155" }}>{s}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ══ SYLLABUS / JD ════════════════════════════════════════════ */}
          <div>
            <label style={labelStyle}>
              <FileText style={{ width: 11, height: 11, color: "#db2777" }} />
              {isStudent ? "Syllabus / Extra Context" : "Job Description"}
              <span style={{ fontSize: 10, fontWeight: 500, color: "#94a3b8", textTransform: "none", letterSpacing: 0, marginLeft: 3 }}>(optional)</span>
            </label>
            <textarea value={formData.jobDescription}
              onChange={e => setFormData(f => ({ ...f, jobDescription: e.target.value }))}
              placeholder={isStudent
                ? "Paste your syllabus or exam topics — AI will use these to generate targeted questions…"
                : "Paste the job description — AI will tailor questions specifically to it…"}
              rows={3} className="cim-input" style={{ resize: "vertical", lineHeight: 1.6 }}
            />
          </div>

          {/* ══ DIFFICULTY + TYPE ════════════════════════════════════════ */}
          <div className="cim-g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>
                <BarChart2 style={{ width: 11, height: 11, color: "#6366f1" }} />
                {isStudent ? "Difficulty" : "Experience"}
              </label>
              <select value={formData.experienceLevel} onChange={e => setFormData(f => ({ ...f, experienceLevel: e.target.value }))} className="cim-input">
                {isStudent ? <>
                  <option value="entry">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="senior">Advanced</option>
                  <option value="expert">Expert / Competitive</option>
                </> : <>
                  <option value="entry">Entry Level</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="senior">Senior</option>
                  <option value="expert">Expert / Lead</option>
                </>}
              </select>
            </div>
            <div>
              <label style={labelStyle}>
                <Layers style={{ width: 11, height: 11, color: "#7c3aed" }} /> Type
              </label>
              <select value={formData.interviewType} onChange={e => setFormData(f => ({ ...f, interviewType: e.target.value }))} className="cim-input">
                <option value="mixed">Mixed</option>
                <option value="technical">{isStudent ? "Subject / Technical" : "Technical"}</option>
                <option value="behavioral">{isStudent ? "Communication / HR" : "Behavioral"}</option>
              </select>
            </div>
          </div>

          {/* ══ QUESTIONS SLIDER ════════════════════════════════════════ */}
          <div style={{ background: "linear-gradient(135deg,#f8faff,#faf5ff)", border: "1.5px solid #e0e7ff", borderRadius: 12, padding: "12px 16px" }}>
            <label style={{ ...labelStyle, justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Hash style={{ width: 11, height: 11, color: "#6366f1" }} /> Questions
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#7c3aed", background: "#ede9fe", border: "1.5px solid #c4b5fd", borderRadius: 7, padding: "1px 10px", textTransform: "none", letterSpacing: 0 }}>
                {formData.totalQuestions}
              </span>
            </label>
            <input type="range" min="3" max="10" value={formData.totalQuestions}
              onChange={e => {
                const val = parseInt(e.target.value);
                e.target.style.setProperty("--val", `${((val - 3) / 7) * 100}%`);
                setFormData(f => ({ ...f, totalQuestions: val }));
              }}
              className="cim-range" style={{ "--val": `${((formData.totalQuestions - 3) / 7) * 100}%` }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10.5, color: "#1e293b", fontWeight: 500, fontFamily: "'Sora','Segoe UI',sans-serif" }}>
              <span>3 min</span><span>10 max</span>
            </div>
          </div>

          <div style={{ height: "1.5px", background: "#f1f5f9" }} />

          {/* ══ BUTTONS ══════════════════════════════════════════════════ */}
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose} disabled={creating} className="cim-btn-cancel">Cancel</button>
            <button type="submit" disabled={creating} className="cim-btn-submit">
              {creating
                ? <><Loader style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} /> Creating…</>
                : "Create Interview"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}