import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
const genAI  = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ── Domain normalizer — handles short keys saved by ProfilePage ──────────────
const DOMAIN_NORMALIZE = {
  "software":      "Software Development",
  "data_science":  "Data Science / AI / ML",
  "product":       "Product Management",
  "design":        "Design (UI/UX)",
  "marketing":     "Marketing / Growth",
  "finance":       "Finance / Accounting",
  "hr":            "Human Resources",
  "operations":    "Operations",
  "consulting":    "Consulting",
  "sales":         "Sales",
  "devops":        "DevOps / Cloud",
  "cybersecurity": "Cybersecurity",
};

const STREAM_NORMALIZE = {
  "pcm": "PCM (Physics, Chemistry, Maths)",
  "pcb": "PCB (Physics, Chemistry, Biology)",
};

function normalizeDomain(raw) {
  if (!raw) return null;
  return DOMAIN_NORMALIZE[raw] || DOMAIN_NORMALIZE[raw.toLowerCase()] || raw;
}

function normalizeStream(raw) {
  if (!raw) return raw;
  return STREAM_NORMALIZE[raw] || STREAM_NORMALIZE[raw.toLowerCase()] || raw;
}

function safeParseJSON(text) {
  try {
    const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    return JSON.parse(clean);
  } catch {
    const arrMatch = text.match(/\[[\s\S]*\]/);
    if (arrMatch) { try { return JSON.parse(arrMatch[0]); } catch {} }
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) { try { return JSON.parse(objMatch[0]); } catch {} }
    return null;
  }
}

// ── YouTube search URL builder ────────────────────────────────────────────────
function ytSearch(query) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

// ── Domain-to-syllabus context map (for Gemini prompts) ──────────────────────
const DOMAIN_SYLLABUS_CONTEXT = {
  "Software Development": {
    coreTopics: ["DSA (Arrays, Trees, Graphs, DP)", "System Design", "OS, DBMS, Computer Networks", "OOP & Design Patterns", "Behavioral Interview"],
    interviewRounds: ["Coding Round (DSA)", "Technical Round (System Design)", "Behavioral Round", "HR Round"],
    hotTopics2024: ["LLM Integration", "Distributed Systems", "React + TypeScript", "Microservices", "Kubernetes"],
  },
  "Data Science / AI / ML": {
    coreTopics: ["ML Algorithms (Supervised/Unsupervised)", "Statistics & Probability", "Deep Learning & Transformers", "SQL & Data Engineering", "Python (Pandas, Sklearn)"],
    interviewRounds: ["Coding Round", "ML Theory Round", "Statistics Round", "Case Study Round", "System Design"],
    hotTopics2024: ["LLMs & RAG", "MLOps", "Feature Stores", "Vector Databases", "A/B Testing"],
  },
  "Finance / Accounting": {
    coreTopics: ["DCF Valuation", "Financial Modeling (3-statement)", "M&A Concepts", "LBO Analysis", "Accounting Fundamentals"],
    interviewRounds: ["Technical Round (Accounting/Valuation)", "Modeling Test", "Case Study", "Behavioral", "Partner Round"],
    hotTopics2024: ["ESG Investing", "AI in Finance", "Private Credit", "SPACs", "Digital Assets"],
  },
  "Product Management": {
    coreTopics: ["Product Design (CIRCLES)", "Metrics & Analytics", "Market Sizing", "Prioritization Frameworks", "Technical Fluency"],
    interviewRounds: ["Product Design Round", "Strategy Round", "Metrics Round", "Behavioral Round", "Leadership Round"],
    hotTopics2024: ["AI Product Strategy", "Growth Loops", "PLG (Product-Led Growth)", "Data-driven PM", "Platform Products"],
  },
  "Consulting": {
    coreTopics: ["Case Interviews (Profitability, Market Entry, M&A)", "MECE Framework", "Market Sizing", "Hypothesis-driven thinking", "Fit Interview"],
    interviewRounds: ["Case Interview Round 1", "Case Interview Round 2", "Fit/Behavioral Round", "Partner Round"],
    hotTopics2024: ["Digital Transformation", "AI Strategy", "ESG Consulting", "Healthcare Strategy", "Supply Chain"],
  },
  "Design (UI/UX)": {
    coreTopics: ["Design Thinking Process", "User Research Methods", "Figma Prototyping", "Design Systems", "Accessibility"],
    interviewRounds: ["Portfolio Review", "Design Challenge", "Critique Session", "Behavioral Round"],
    hotTopics2024: ["AI-assisted design", "Voice UI", "Motion Design", "Inclusive Design", "AR/VR Design"],
  },
};

const STUDENT_SYLLABUS_CONTEXT = {
  "JEE_PCM": {
    subjects: ["Physics (Mechanics, Electrostatics, Modern Physics)", "Chemistry (Physical, Organic, Inorganic)", "Mathematics (Calculus, Coordinate Geometry, Algebra)"],
    examPattern: "300 marks | 3 hours | MCQ + Numerical",
    keyFocus: ["NCERT mastery", "Previous year JEE papers", "Mock tests with analysis", "Shortcut tricks for MCQs"],
  },
  "NEET_PCB": {
    subjects: ["Biology (Human Physiology, Genetics, Ecology)", "Chemistry (Physical, Organic, Inorganic)", "Physics (Mechanics, Electrostatics, Modern Physics)"],
    examPattern: "720 marks | 3hr 20min | MCQ only",
    keyFocus: ["NCERT line-by-line reading", "Diagram labeling", "Previous year NEET papers", "Biology dominates with 360 marks"],
  },
  "10th": {
    subjects: ["Mathematics", "Science (Physics + Chemistry + Biology)", "Social Science", "English"],
    examPattern: "Board exam | 80 marks per subject | Descriptive + MCQ",
    keyFocus: ["NCERT solutions", "Sample papers", "Board question patterns", "Time management in exam"],
  },
};

// ── Generate rich personalized resources via Gemini ──────────────────────────
async function generatePersonalizedResources(profile) {
  const model     = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '').getGenerativeModel({ model: 'gemini-1.5-flash' });
  const isStudent = profile?.userType === 'student';

  // Normalize domain + stream before use
  const cleanDomain = normalizeDomain(profile?.domain);
  const cleanStream = normalizeStream(profile?.stream);
  const normalizedProfile = { ...profile, domain: cleanDomain, stream: cleanStream };

  // Build rich context for the prompt
  // Map student streams to domain context for non-board students
  const STREAM_TO_DOMAIN = {
    "Computer Science": "Software Development", "BCA / MCA": "Software Development",
    "Electronics Engineering": "Software Development", "Commerce": "Finance / Accounting",
    "BCom": "Finance / Accounting", "MBA / Management": "Consulting",
    "BSc": "Data Science / AI / ML", "Arts / Humanities": "Marketing / Growth",
    "Mechanical Engineering": "Operations", "Civil Engineering": "Operations",
  };
  const syllabusKey = isStudent
    ? (cleanStream?.includes('PCM') ? 'JEE_PCM' : cleanStream?.includes('PCB') ? 'NEET_PCB' : '10th')
    : null;
  // For non-PCM/PCB students, pick domain context from their stream
  const effectiveDomain = !isStudent
    ? cleanDomain
    : (STREAM_TO_DOMAIN[cleanStream] || cleanDomain || "Software Development");
  const domainCtx = DOMAIN_SYLLABUS_CONTEXT[effectiveDomain] || null;
  const studentCtx = isStudent ? STUDENT_SYLLABUS_CONTEXT[syllabusKey] : null;

  const profileDesc = isStudent
    ? `Board exam student: Class/Level "${normalizedProfile.studentClass}", Stream "${normalizedProfile.stream || 'General'}".
       Exam focus: ${studentCtx?.examPattern || 'Board exam'}.
       Core subjects: ${studentCtx?.subjects?.join(' | ') || 'standard curriculum'}.
       Key prep areas: ${studentCtx?.keyFocus?.join(', ') || 'concept building and practice'}.
       Goals: ${(profile.goals || []).join(', ') || 'score well in exams'}.`
    : `${isStudent ? 'Student' : 'Job seeker'} targeting: "${effectiveDomain}".
       Background/Stream: "${normalizedProfile.stream || normalizedProfile.studentClass || 'General'}".
       Experience: "${normalizedProfile.experienceLevel || 'beginner'}".
       Core topics: ${domainCtx?.coreTopics?.join(' | ') || effectiveDomain + ' fundamentals'}.
       Interview rounds: ${domainCtx?.interviewRounds?.join(', ') || '3-4 rounds'}.
       Hot topics 2024-25: ${domainCtx?.hotTopics2024?.join(', ') || 'latest trends'}.
       Skills: ${(profile.skills || []).join(', ') || 'not listed'}.
       Goals: ${(profile.goals || []).join(', ') || 'excel in field'}.`;

  const prompt = `You are a world-class career coach and academic counselor.

Generate exactly 12 highly personalized, realistic learning resources for this user:

═══ USER PROFILE ═══
${profileDesc}

═══ RESOURCE REQUIREMENTS ═══
Generate a VARIETY of resource types:
- 3 video resources (YouTube search links, real channels like Striver, Abdul Bari, take U forward, Andrej Karpathy, Khan Academy, Unacademy, etc.)
- 3 guide/article resources (real authoritative websites)
- 2 practice resources (type: "practice", externalUrl: null — these trigger mock interview in our app)
- 2 cheatsheet resources (type: "cheatsheet", concise reference sheets)
- 2 article resources (blog posts, official docs)

For EACH resource:
1. Title must be SPECIFIC and contain the actual topic (e.g. "JEE Physics — Rotational Motion Complete" not "Physics Guide")
2. Description must explain EXACTLY what topics/concepts this resource covers (2 sentences, be specific)
3. Tags must be actual keywords from their domain/exam
4. Use REAL YouTube channels for videos: Striver (DSA), Abdul Bari (Algo), Aditya Verma (DP), Ravindrababu Ravula (Gate/OS), Khan Academy, 3Blue1Brown, StatQuest, Jeremy Howard, Aswath Damodaran (finance), Victor Cheng (consulting), Rachna Ranade (finance India), Physics Wallah, Vedantu, Unacademy (students)
5. For guide/article URLs use real sites: leetcode.com, geeksforgeeks.org, techinterviewhandbook.org, kaggle.com, wallstreetprep.com, managementconsulted.com, preplounge.com, ncert.nic.in, byjus.com, toppr.com, etc.
6. Duration should be realistic: video 15-90min, guide 10-30min, practice 30-60min
7. Rating between 4.5 and 5.0

Respond ONLY with a valid JSON array of exactly 12 objects — no markdown, no preamble:
[
  {
    "title": "Very specific descriptive title",
    "type": "video|guide|article|practice|cheatsheet",
    "category": "technical|behavioral|competitive|career|academic|practice",
    "duration": "X min",
    "difficulty": "beginner|intermediate|advanced",
    "rating": 4.8,
    "description": "Specific 2-sentence description of exactly what topics this covers and what the user will be able to do after.",
    "tags": ["specific-tag1", "topic-name2", "exam-name3"],
    "externalUrl": "https://real-url.com or null for practice type",
    "youtubeQuery": "specific youtube search query if video, else null",
    "channel": "YouTube channel name if video, else null",
    "whatYouLearn": ["specific learning point 1", "specific learning point 2", "specific learning point 3"],
    "keyTopics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4"],
    "prerequisites": ["prerequisite 1"],
    "expectedOutcome": "One sentence on what the user can do after completing this resource"
  }
]`;

  try {
    const result = await model.generateContent(prompt);
    const text   = result.response.text();
    const parsed = safeParseJSON(text);

    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Invalid resources from Gemini');

    return parsed.map((r, i) => ({
      ...r,
      _id: `gen_${Date.now()}_${i}`,
      externalUrl: r.type === 'video' && r.youtubeQuery
        ? ytSearch(r.youtubeQuery)
        : (r.type === 'practice' ? null : (r.externalUrl || 'https://www.youtube.com/')),
      saved: false,
    }));
  } catch (err) {
    console.error('generatePersonalizedResources error:', err.message);
    return null;
  }
}

// ── Static fallback resources (rich content) ──────────────────────────────────
function getFallbackResources(profile) {
  const isStudent = profile?.userType === 'student';

  if (isStudent) {
    const stream = normalizeStream(profile?.stream) || '';
    const isJEE  = stream.includes('PCM');
    const isNEET = stream.includes('PCB');
    // Non-board students (CS, Commerce etc) get domain-based resources
    if (!isJEE && !isNEET) {
      const mappedDomain = {
        "Computer Science": "Software Development", "BCA / MCA": "Software Development",
        "Electronics Engineering": "Software Development", "Commerce": "Finance / Accounting",
        "BCom": "Finance / Accounting", "MBA / Management": "Consulting",
        "BSc": "Data Science / AI / ML",
      }[stream] || normalizeDomain(profile?.domain) || "Software Development";
      const domainResources = getFallbackResources({ ...profile, userType: "jobseeker", domain: mappedDomain });
      return domainResources;
    }

    const jeeResources = [
      {
        title: "JEE Physics — Mechanics & Laws of Motion (Complete)",
        type: "video", category: "technical", duration: "1hr 15min", difficulty: "intermediate", rating: 4.9,
        description: "Complete JEE-level mechanics covering Newton's Laws, conservation of energy, rotational motion, and gravitation. Includes numerical problem-solving techniques.",
        tags: ["JEE", "physics", "mechanics", "PCM", "Newton"],
        externalUrl: ytSearch("JEE physics mechanics laws of motion complete Striver"),
        channel: "Physics Wallah", whatYouLearn: ["Newton's Laws with JEE numericals", "Work-energy theorem applications", "Rotational dynamics", "Conservation laws"], keyTopics: ["Kinematics", "Newton's Laws", "Rotational Motion", "Gravitation"], prerequisites: ["Basic trigonometry", "Class 11 intro"], expectedOutcome: "Solve 85% of JEE mechanics questions"
      },
      {
        title: "JEE Maths — Calculus: Limits, Differentiation & Integration",
        type: "video", category: "technical", duration: "1hr 30min", difficulty: "advanced", rating: 4.9,
        description: "End-to-end JEE Calculus covering limits, L'Hôpital's rule, all differentiation rules, integration by parts, and definite integrals with past JEE questions.",
        tags: ["JEE", "maths", "calculus", "PCM"],
        externalUrl: ytSearch("JEE maths calculus limits differentiation integration complete"),
        channel: "Vedantu JEE", whatYouLearn: ["Limits using standard formulae", "Chain rule and implicit differentiation", "Integration techniques", "Application of integrals"], keyTopics: ["Limits", "Differentiation", "Integration", "Differential Equations"], prerequisites: ["Class 11 functions", "Basic algebra"], expectedOutcome: "Score full marks in Calculus section of JEE"
      },
      {
        title: "JEE Chemistry — Organic Chemistry Named Reactions Cheatsheet",
        type: "cheatsheet", category: "academic", duration: "15 min", difficulty: "intermediate", rating: 4.8,
        description: "Quick-reference cheatsheet for all 30+ named reactions tested in JEE with reagents, conditions, mechanism overview, and expected products.",
        tags: ["JEE", "chemistry", "organic", "named-reactions", "PCM"],
        externalUrl: "https://www.chemistryden.com/named-reactions-jee/",
        channel: null, whatYouLearn: ["Aldol condensation", "Cannizzaro reaction", "Diels-Alder", "Wurtz reaction", "Friedel-Crafts"], keyTopics: ["Named Reactions", "Reagents", "Mechanisms", "Products"], prerequisites: ["Basic organic chemistry"], expectedOutcome: "Never miss a named reaction question in JEE"
      },
      {
        title: "JEE Previous Year Papers — Chapter-wise (2015–2024)",
        type: "guide", category: "competitive", duration: "30 min", difficulty: "advanced", rating: 4.9,
        description: "Structured approach to solving JEE previous year papers chapter-wise. Includes weightage analysis per topic and most-repeated question patterns.",
        tags: ["JEE", "PYQ", "previous-year", "strategy"],
        externalUrl: "https://www.embibe.com/exams/jee-main/",
        channel: null, whatYouLearn: ["Topic-wise weightage in JEE", "Most repeated question types", "How to prioritise chapters", "Time allocation strategy"], keyTopics: ["PYQ Analysis", "Weightage", "Strategy", "Time Management"], prerequisites: ["Basic preparation done"], expectedOutcome: "Identify high-ROI topics for last-minute prep"
      },
      {
        title: "JEE Mock Test — Full Simulation (3 Hours)",
        type: "practice", category: "practice", duration: "3 hours", difficulty: "advanced", rating: 4.9,
        description: "Full 3-hour JEE mock test simulation with 90 questions across Physics, Chemistry, and Mathematics. AI analysis of weak areas after completion.",
        tags: ["JEE", "mock", "practice", "simulation"],
        externalUrl: null, channel: null, whatYouLearn: ["Exam stamina building", "Speed and accuracy improvement", "Weak area identification", "Answer marking strategy"], keyTopics: ["Physics", "Chemistry", "Mathematics", "Time Management"], prerequisites: ["Minimum 70% syllabus completion"], expectedOutcome: "Get a realistic JEE percentile estimate"
      },
      {
        title: "Physical Chemistry — Electrochemistry & Chemical Kinetics",
        type: "video", category: "technical", duration: "55 min", difficulty: "intermediate", rating: 4.8,
        description: "Complete coverage of Electrochemistry (Nernst equation, EMF, electrolysis) and Chemical Kinetics (rate laws, Arrhenius equation) for JEE.",
        tags: ["JEE", "chemistry", "electrochemistry", "kinetics"],
        externalUrl: ytSearch("JEE physical chemistry electrochemistry chemical kinetics"),
        channel: "Unacademy JEE", whatYouLearn: ["Nernst equation applications", "EMF cell calculations", "Rate laws and orders", "Arrhenius equation"], keyTopics: ["EMF", "Nernst Equation", "Rate Laws", "Activation Energy"], prerequisites: ["Class 11 physical chemistry"], expectedOutcome: "Full marks in Physical Chemistry section"
      },
    ];

    const neetResources = [
      {
        title: "NEET Biology — Human Physiology Complete (All Systems)",
        type: "video", category: "technical", duration: "1hr 20min", difficulty: "intermediate", rating: 4.9,
        description: "Complete human physiology covering all 9 systems — digestive, respiratory, circulatory, excretory, nervous, endocrine, locomotion, neural & reproductive — with NCERT diagrams.",
        tags: ["NEET", "biology", "physiology", "PCB", "NCERT"],
        externalUrl: ytSearch("NEET biology human physiology all systems complete NCERT"),
        channel: "Physics Wallah Biology", whatYouLearn: ["All physiological processes", "Important diagrams and labels", "Hormones and their functions", "Common NEET MCQ patterns"], keyTopics: ["Digestion", "Circulation", "Excretion", "Neural System", "Reproduction"], prerequisites: ["Class 11 Biology basics"], expectedOutcome: "Score 80+ marks in Biology physiology section"
      },
      {
        title: "NEET Chemistry — Organic Chemistry Biomolecules & Polymers",
        type: "video", category: "technical", duration: "45 min", difficulty: "intermediate", rating: 4.8,
        description: "NEET-focused organic chemistry covering biomolecules (carbohydrates, proteins, enzymes, DNA/RNA) and polymers with all NCERT reactions and examples.",
        tags: ["NEET", "chemistry", "biomolecules", "organic"],
        externalUrl: ytSearch("NEET chemistry biomolecules polymers organic complete"),
        channel: "Vedantu NEET", whatYouLearn: ["Structures of glucose, amino acids, DNA", "Enzyme types and cofactors", "Polymer classification", "NEET MCQ tricks for organic"], keyTopics: ["Biomolecules", "Polymers", "Carbohydrates", "Proteins", "Nucleic Acids"], prerequisites: ["Basic organic chemistry class 12"], expectedOutcome: "Score full marks in biomolecules NEET questions"
      },
      {
        title: "NEET Previous 10 Years MCQ — Biology Chapter-wise",
        type: "practice", category: "practice", duration: "2 hours", difficulty: "advanced", rating: 4.9,
        description: "Solve the last 10 years of NEET Biology MCQs organized chapter-wise with detailed explanations and NCERT line references for each answer.",
        tags: ["NEET", "biology", "PYQ", "MCQ"],
        externalUrl: "https://www.nta.ac.in/neetug", channel: null, whatYouLearn: ["Exact NEET MCQ patterns", "High-frequency topics", "Answer justification from NCERT", "Time management"], keyTopics: ["PYQ", "MCQ Patterns", "NCERT References", "Weak Areas"], prerequisites: ["60% syllabus completion"], expectedOutcome: "Identify and eliminate weak areas in NEET Biology"
      },
      {
        title: "Genetics & Molecular Biology — NEET Complete Guide",
        type: "guide", category: "academic", duration: "25 min", difficulty: "intermediate", rating: 4.8,
        description: "Comprehensive notes on Genetics (Mendelian, Chromosomal) and Molecular Biology (DNA structure, replication, transcription, translation) for NEET.",
        tags: ["NEET", "genetics", "molecular-biology", "DNA"],
        externalUrl: "https://byjus.com/neet/genetics-and-evolution-notes/",
        channel: null, whatYouLearn: ["Laws of Mendelian genetics", "DNA structure and base pairing", "Central dogma of molecular biology", "Genetic disorders"], keyTopics: ["Mendel's Laws", "DNA Replication", "Transcription", "Translation", "Mutations"], prerequisites: ["Cell biology basics"], expectedOutcome: "Score 100% in Genetics in NEET"
      },
      {
        title: "NEET Physics — Modern Physics & Dual Nature",
        type: "video", category: "technical", duration: "50 min", difficulty: "intermediate", rating: 4.7,
        description: "Complete NEET Physics Modern Physics covering Photoelectric effect, Bohr's model, radioactivity, nuclear reactions and semiconductor devices.",
        tags: ["NEET", "physics", "modern-physics", "nuclear"],
        externalUrl: ytSearch("NEET physics modern physics dual nature photoelectric effect complete"),
        channel: "Unacademy NEET", whatYouLearn: ["Photoelectric effect equations", "Bohr model calculations", "Radioactive decay problems", "Semiconductor devices"], keyTopics: ["Photoelectric Effect", "Bohr Model", "Radioactivity", "Semiconductors"], prerequisites: ["Class 12 physics basics"], expectedOutcome: "Score 30+ marks in NEET Physics from modern physics alone"
      },
      {
        title: "NEET Ecology & Environment — Quick Revision",
        type: "cheatsheet", category: "academic", duration: "20 min", difficulty: "beginner", rating: 4.8,
        description: "One-page visual cheatsheet for NEET Ecology covering ecosystems, biodiversity, environmental issues, and all important terms with definitions.",
        tags: ["NEET", "ecology", "environment", "biodiversity"],
        externalUrl: "https://byjus.com/neet/ecology-notes/",
        channel: null, whatYouLearn: ["Ecosystem types and food chains", "Biodiversity hotspots in India", "Environmental issues and legislation", "Population growth models"], keyTopics: ["Ecosystems", "Biodiversity", "Environmental Issues", "Population Ecology"], prerequisites: ["None"], expectedOutcome: "Score full marks in ecology section of NEET"
      },
    ];

    const genericStudentResources = [
      {
        title: "How to Build a Topper Study Routine (Board + Entrance)",
        type: "article", category: "career", duration: "10 min", difficulty: "beginner", rating: 4.7,
        description: "Science-backed study routine used by IIT/AIIMS toppers — spaced repetition, Pomodoro timing, active recall strategies, and managing burnout.",
        tags: ["study-routine", "topper", "tips", "time-management"],
        externalUrl: "https://www.toppr.com/guides/study-tips/",
        channel: null, whatYouLearn: ["Spaced repetition technique", "Active recall vs. passive reading", "How to make effective notes", "Balancing study and health"], keyTopics: ["Study Techniques", "Time Management", "Revision Strategies"], prerequisites: ["None"], expectedOutcome: "Double your retention with the same study hours"
      },
      {
        title: "AI Mock Interview Practice Session",
        type: "practice", category: "practice", duration: "30–45 min", difficulty: "intermediate", rating: 4.9,
        description: "Practice scholarship, admission, or campus placement interview questions tailored to your academic profile. Get AI feedback on your answers.",
        tags: ["mock", "interview", "practice", "AI-feedback"],
        externalUrl: null, channel: null, whatYouLearn: ["Interview confidence", "Articulating academic achievements", "Answering 'Why this college/stream'", "Body language and tone"], keyTopics: ["Interview Prep", "Communication", "Academic Portfolio"], prerequisites: ["None"], expectedOutcome: "Walk into any interview with confidence"
      },
    ];

    const resources = isJEE ? jeeResources : isNEET ? neetResources : [...jeeResources.slice(0,2), ...neetResources.slice(0,2)];
    return [...resources, ...genericStudentResources].map((r, i) => ({ ...r, _id: `fallback_${i}` }));
  }

  // ── Job seeker fallbacks ──────────────────────────────────────────────────
  const domain = normalizeDomain(profile?.domain) || 'Software Development';
  const expLevel = profile?.experienceLevel || 'intermediate';

  const domainFallbacks = {
    "Software Development": [
      {
        title: "Blind 75 LeetCode — The Only DSA Sheet You Need",
        type: "guide", category: "technical", duration: "ongoing", difficulty: "intermediate", rating: 4.9,
        description: "The 75 hand-picked LeetCode problems that cover every important DSA pattern — arrays, trees, graphs, DP, and more. Solve these and you'll be ready for any FAANG interview.",
        tags: ["DSA", "leetcode", "FAANG", "coding", "algorithms"],
        externalUrl: "https://neetcode.io/practice",
        channel: null, whatYouLearn: ["Two pointer patterns", "Sliding window", "Tree traversal", "DP recurrences", "Graph BFS/DFS"], keyTopics: ["Arrays", "Trees", "Graphs", "Dynamic Programming", "Binary Search"], prerequisites: ["Basic programming", "One language proficiency"], expectedOutcome: "Solve 70% of medium LeetCode independently"
      },
      {
        title: "System Design Interview — Build Scalable Systems",
        type: "video", category: "technical", duration: "1hr 45min", difficulty: "advanced", rating: 4.9,
        description: "Design Netflix, Uber, Twitter and WhatsApp from scratch in a 45-min interview. Covers load balancers, caching, database sharding, and microservices architecture.",
        tags: ["system-design", "distributed-systems", "FAANG", "senior"],
        externalUrl: ytSearch("system design interview complete guide 2024"),
        channel: "Gaurav Sen", whatYouLearn: ["CAP theorem and BASE", "Database sharding and replication", "Designing for millions of users", "Trade-off discussions"], keyTopics: ["Load Balancing", "Caching", "Database Design", "Microservices", "Message Queues"], prerequisites: ["3+ years coding experience", "Basic networking"], expectedOutcome: "Confidently design any system asked in top-tier interviews"
      },
      {
        title: "JavaScript/TypeScript Interview Mastery 2024",
        type: "video", category: "technical", duration: "55 min", difficulty: "intermediate", rating: 4.8,
        description: "Top 60 JavaScript and TypeScript interview questions covering closures, promises, event loop, TypeScript generics, and frontend system design.",
        tags: ["JavaScript", "TypeScript", "frontend", "interview"],
        externalUrl: ytSearch("javascript interview questions 2024 closures promises event loop"),
        channel: "Akshay Saini", whatYouLearn: ["Event loop internals", "Closures and scope", "Promise chaining and async/await", "TypeScript utility types"], keyTopics: ["Closures", "Promises", "Event Loop", "Prototypes", "TypeScript"], prerequisites: ["1+ year JavaScript experience"], expectedOutcome: "Ace frontend technical rounds at product companies"
      },
      {
        title: "Tech Interview Handbook — Complete Guide",
        type: "article", category: "career", duration: "45 min read", difficulty: "beginner", rating: 4.9,
        description: "The definitive free guide to cracking software engineering interviews — from resume writing to DSA preparation to offer negotiation at FAANG.",
        tags: ["interview-handbook", "FAANG", "career", "resume"],
        externalUrl: "https://www.techinterviewhandbook.org/",
        channel: null, whatYouLearn: ["Resume writing for SWE roles", "Interview timelines and prep schedule", "Behavioral question framework", "Offer evaluation and negotiation"], keyTopics: ["Resume", "Behavioral Questions", "DSA Strategy", "Negotiation"], prerequisites: ["None"], expectedOutcome: "Have a complete action plan for your SWE job search"
      },
      {
        title: "Operating Systems & Computer Networks — Quick Reference",
        type: "cheatsheet", category: "technical", duration: "20 min", difficulty: "intermediate", rating: 4.7,
        description: "Dense cheatsheet covering OS concepts (scheduling, deadlocks, memory management) and CN concepts (TCP/IP, HTTP, DNS, REST) frequently asked in backend interviews.",
        tags: ["OS", "computer-networks", "backend", "systems"],
        externalUrl: "https://github.com/donnemartin/system-design-primer",
        channel: null, whatYouLearn: ["Process scheduling algorithms", "Deadlock detection & prevention", "TCP vs UDP differences", "HTTP methods and status codes"], keyTopics: ["Processes", "Memory Management", "TCP/IP", "HTTP", "DNS"], prerequisites: ["Basic CS fundamentals"], expectedOutcome: "Answer all core CS theory questions confidently"
      },
      {
        title: "Mock Coding Interview — DSA + System Design",
        type: "practice", category: "practice", duration: "60 min", difficulty: "intermediate", rating: 4.9,
        description: "Full simulated coding interview with a DSA problem, system design question, and behavioral round — timed, scored, and reviewed by AI.",
        tags: ["mock", "DSA", "system-design", "practice"],
        externalUrl: null, channel: null, whatYouLearn: ["Interview pressure management", "Thinking out loud technique", "Approaching unknown problems", "Code optimization under time pressure"], keyTopics: ["DSA Problem Solving", "System Design", "Behavioral Questions"], prerequisites: ["50+ LeetCode problems solved"], expectedOutcome: "Experience a real Google/Amazon interview before the real one"
      },
      {
        title: "STAR Behavioral Interview for Engineers — 30 Q&A",
        type: "guide", category: "behavioral", duration: "25 min", difficulty: "beginner", rating: 4.8,
        description: "The 30 most-asked behavioral questions at top tech companies with STAR-format answers tailored for software engineers and engineering managers.",
        tags: ["behavioral", "STAR", "HR-round", "soft-skills"],
        externalUrl: "https://www.techinterviewhandbook.org/behavioral-interview/",
        channel: null, whatYouLearn: ["STAR story structure", "Leadership under pressure", "Conflict resolution with coworkers", "Failure and growth narratives"], keyTopics: ["Leadership", "Teamwork", "Failure", "Initiative", "Communication"], prerequisites: ["Some project/work experience"], expectedOutcome: "Never be caught off-guard in any behavioral interview"
      },
    ],
    "Data Science / AI / ML": [
      {
        title: "Machine Learning Interview Questions — 100 Must-Know",
        type: "guide", category: "technical", duration: "40 min", difficulty: "intermediate", rating: 4.9,
        description: "The 100 most frequently asked ML theory questions at top tech and AI companies — covering regression, trees, neural networks, regularization, and evaluation metrics.",
        tags: ["ML", "interview", "algorithms", "theory"],
        externalUrl: "https://github.com/khangich/machine-learning-interview",
        channel: null, whatYouLearn: ["Bias-variance tradeoff", "Regularization techniques", "Evaluation metrics (ROC, F1, AUC)", "Ensemble methods explained"], keyTopics: ["Bias-Variance", "Regularization", "Evaluation Metrics", "Ensembles", "Gradient Boosting"], prerequisites: ["ML fundamentals", "Python basics"], expectedOutcome: "Pass ML theory rounds at top AI companies"
      },
      {
        title: "Statistics for Data Science Interviews — Complete",
        type: "video", category: "technical", duration: "1hr 10min", difficulty: "intermediate", rating: 4.8,
        description: "All probability and statistics concepts asked in data science interviews — distributions, hypothesis testing, Bayesian inference, CLT, and A/B testing.",
        tags: ["statistics", "probability", "hypothesis-testing", "data-science"],
        externalUrl: ytSearch("statistics for data science interviews hypothesis testing Bayesian"),
        channel: "StatQuest with Josh Starmer", whatYouLearn: ["Probability distributions (Normal, Binomial, Poisson)", "Hypothesis testing and p-values", "Bayes theorem applications", "A/B test design and analysis"], keyTopics: ["Probability", "Distributions", "Hypothesis Testing", "Bayesian Stats", "A/B Testing"], prerequisites: ["Basic statistics", "Python/R basics"], expectedOutcome: "Ace statistics rounds at Google, Meta, and Airbnb"
      },
      {
        title: "SQL for Data Scientists — Window Functions & Analytics",
        type: "video", category: "technical", duration: "45 min", difficulty: "intermediate", rating: 4.8,
        description: "Advanced SQL for data science interviews: window functions (RANK, LAG, LEAD), CTEs, subqueries, and solving real analytical SQL problems from Stratascratch.",
        tags: ["SQL", "analytics", "window-functions", "data-analyst"],
        externalUrl: ytSearch("SQL window functions CTEs data science interview 2024"),
        channel: "Alex the Analyst", whatYouLearn: ["RANK, ROW_NUMBER, DENSE_RANK", "LAG/LEAD for time series analysis", "CTEs for readability", "Query optimization basics"], keyTopics: ["Window Functions", "CTEs", "Subqueries", "Joins", "Aggregations"], prerequisites: ["Basic SQL (SELECT, WHERE, GROUP BY)"], expectedOutcome: "Solve top-5% SQL problems on LeetCode and Stratascratch"
      },
      {
        title: "Deep Learning — Transformers & LLMs Explained",
        type: "video", category: "technical", duration: "1hr 20min", difficulty: "advanced", rating: 4.9,
        description: "From attention mechanism to full Transformer architecture, BERT, GPT, and how LLMs work — essential for ML engineer interviews at AI companies in 2024-25.",
        tags: ["deep-learning", "transformers", "LLM", "BERT", "GPT"],
        externalUrl: ytSearch("transformers attention mechanism LLM explained Andrej Karpathy"),
        channel: "Andrej Karpathy", whatYouLearn: ["Self-attention mechanism", "Multi-head attention", "BERT vs GPT architectures", "Fine-tuning and RAG basics"], keyTopics: ["Attention", "Transformers", "BERT", "GPT", "LLM Fine-tuning"], prerequisites: ["Neural network basics", "Linear algebra"], expectedOutcome: "Discuss LLMs confidently in AI/ML engineer interviews"
      },
      {
        title: "Kaggle Learn — Hands-on ML & Feature Engineering",
        type: "article", category: "technical", duration: "2-3 hours", difficulty: "intermediate", rating: 4.8,
        description: "Free Kaggle mini-courses on feature engineering, model interpretation, machine learning explainability, and working with real datasets.",
        tags: ["kaggle", "feature-engineering", "hands-on", "ML"],
        externalUrl: "https://www.kaggle.com/learn",
        channel: null, whatYouLearn: ["Feature creation and selection", "Handling missing data", "Model interpretation (SHAP)", "Encoding categorical variables"], keyTopics: ["Feature Engineering", "Data Cleaning", "Model Interpretation", "SHAP Values"], prerequisites: ["Python basics", "Pandas knowledge"], expectedOutcome: "Build a Kaggle competition project for your portfolio"
      },
      {
        title: "Data Science Mock Interview — Stats + ML + SQL",
        type: "practice", category: "practice", duration: "60 min", difficulty: "intermediate", rating: 4.9,
        description: "Full mock data science interview session covering a statistics case, SQL problem, ML model selection question, and product analytics behavioral round.",
        tags: ["mock", "data-science", "SQL", "ML", "practice"],
        externalUrl: null, channel: null, whatYouLearn: ["Interview question patterns at DS companies", "Structuring ML problem answers", "SQL problem-solving approach", "Communicating data insights"], keyTopics: ["Statistics Case", "SQL Problem", "ML Theory", "Product Metrics"], prerequisites: ["Basic DS preparation"], expectedOutcome: "Simulate a real Airbnb/Meta data science interview"
      },
    ],
    "Finance / Accounting": [
      {
        title: "DCF Valuation — Build a Full Model from Scratch",
        type: "video", category: "technical", duration: "1hr 15min", difficulty: "advanced", rating: 4.9,
        description: "Step-by-step DCF model construction: revenue forecasting, EBITDA to FCFF, WACC calculation, terminal value, and sensitivity tables — the core IB technical skill.",
        tags: ["DCF", "valuation", "IB", "WACC", "financial-modeling"],
        externalUrl: ytSearch("DCF valuation financial model tutorial investment banking"),
        channel: "Aswath Damodaran (NYU)", whatYouLearn: ["Revenue and EBITDA projections", "WACC computation (CAPM)", "Terminal value (Gordon Growth vs. Exit Multiple)", "Sensitivity and scenario analysis"], keyTopics: ["FCFF", "WACC", "Terminal Value", "Sensitivity Analysis", "Equity Value"], prerequisites: ["Basic accounting (3 financial statements)", "Excel fundamentals"], expectedOutcome: "Build a live DCF model and answer technical IB questions"
      },
      {
        title: "IB Interview Technical Questions — 200 Q&A",
        type: "guide", category: "technical", duration: "45 min", difficulty: "advanced", rating: 4.9,
        description: "The 200 most-asked investment banking interview technical questions covering accounting, valuation, M&A, LBO, and markets — organized by difficulty.",
        tags: ["IB", "investment-banking", "technical", "interview"],
        externalUrl: "https://corporatefinanceinstitute.com/resources/career/investment-banking-interview/",
        channel: null, whatYouLearn: ["Walk me through a DCF", "Why use each valuation method", "EV vs equity value", "Accretion/dilution in M&A", "LBO entry and exit"], keyTopics: ["DCF", "Comparables", "LBO", "M&A", "Accounting Adjustments"], prerequisites: ["Basic finance knowledge", "Understanding of financial statements"], expectedOutcome: "Pass technical screens at BB and EB banks"
      },
      {
        title: "Financial Modeling Excel Cheatsheet — IB Ready",
        type: "cheatsheet", category: "technical", duration: "10 min", difficulty: "intermediate", rating: 4.8,
        description: "Quick-reference Excel shortcuts, financial modeling best practices, and formula bank for building 3-statement, DCF, and LBO models during interviews.",
        tags: ["Excel", "financial-modeling", "shortcuts", "IB"],
        externalUrl: "https://www.wallstreetprep.com/knowledge/financial-modeling-best-practices/",
        channel: null, whatYouLearn: ["50 essential Excel shortcuts", "Model structure best practices", "Error-checking formulas", "INDEX/MATCH vs VLOOKUP"], keyTopics: ["Excel Shortcuts", "Model Architecture", "Error Checking", "Data Tables"], prerequisites: ["Basic Excel knowledge"], expectedOutcome: "Build and navigate models at full IB analyst speed"
      },
      {
        title: "Finance & Banking Mock Interview — Technical Round",
        type: "practice", category: "practice", duration: "45 min", difficulty: "advanced", rating: 4.9,
        description: "Simulated IB/Corporate Finance technical interview with valuation questions, accounting adjustments, M&A scenarios, and a quick mental math test.",
        tags: ["mock", "IB", "finance", "valuation", "practice"],
        externalUrl: null, channel: null, whatYouLearn: ["Handling tough IB technical questions", "Walking through valuation models verbally", "Mental math for quick ratios", "Composure under interview pressure"], keyTopics: ["Valuation", "Accounting", "M&A", "Mental Math"], prerequisites: ["DCF and comparable company analysis knowledge"], expectedOutcome: "Walk into Goldman/JP Morgan interviews with confidence"
      },
    ],
    "Consulting": [
      {
        title: "McKinsey Case Interview — Hypothesis-Driven Approach",
        type: "video", category: "technical", duration: "50 min", difficulty: "advanced", rating: 4.9,
        description: "Master McKinsey's interviewer-led case format with hypothesis-first structuring, issue trees, chart interpretation, and synthesis — by a former McKinsey consultant.",
        tags: ["McKinsey", "case-interview", "MBB", "hypothesis", "strategy"],
        externalUrl: ytSearch("McKinsey case interview hypothesis driven approach former consultant"),
        channel: "Victor Cheng", whatYouLearn: ["Hypothesis-first case opening", "Building MECE issue trees", "Exhibit analysis and data interpretation", "Recommendation synthesis"], keyTopics: ["Issue Trees", "MECE", "Hypothesis Testing", "Chart Interpretation", "Synthesis"], prerequisites: ["Basic business understanding", "Interest in strategy"], expectedOutcome: "Pass first-round case interviews at McKinsey, BCG, and Bain"
      },
      {
        title: "Market Sizing & Estimation — 20 Case Walkthroughs",
        type: "guide", category: "technical", duration: "30 min", difficulty: "intermediate", rating: 4.8,
        description: "20 solved market sizing cases (How many piano tuners in Chicago? Size the Indian cloud market) with step-by-step breakdowns and common mistake analysis.",
        tags: ["market-sizing", "estimation", "consulting", "fermi"],
        externalUrl: "https://managementconsulted.com/case-interview/market-sizing/",
        channel: null, whatYouLearn: ["Top-down vs. bottom-up approach", "Driver-based estimation frameworks", "Sanity checking your numbers", "Presenting estimates confidently"], keyTopics: ["Market Sizing", "Fermi Estimation", "Top-down Analysis", "Sanity Checks"], prerequisites: ["Basic math", "Comfort with approximations"], expectedOutcome: "Answer any market sizing in 3-4 minutes with structure"
      },
      {
        title: "PrepLounge Free Case Library — 50+ Cases",
        type: "article", category: "competitive", duration: "ongoing", difficulty: "advanced", rating: 4.8,
        description: "Access 50+ free consulting cases on PrepLounge — profitability, market entry, M&A, operations — with expert feedback and peer practice partner matching.",
        tags: ["case-library", "consulting", "practice", "PrepLounge"],
        externalUrl: "https://www.preplounge.com/en/consulting-forum",
        channel: null, whatYouLearn: ["Profitability case framework", "Market entry case structure", "Operations improvement cases", "M&A synergy cases"], keyTopics: ["Profitability", "Market Entry", "Operations", "M&A", "Growth Strategy"], prerequisites: ["Basic case interview introduction"], expectedOutcome: "Practice 30+ cases and develop case-cracking muscle memory"
      },
      {
        title: "Consulting Mock Interview — BCG Interviewer-Led Case",
        type: "practice", category: "practice", duration: "45 min", difficulty: "advanced", rating: 4.9,
        description: "Full BCG-style consulting mock interview: a profitability case with exhibits, mental math, synthesis, and a 5-min behavioral fit section.",
        tags: ["mock", "BCG", "case", "consulting", "practice"],
        externalUrl: null, channel: null, whatYouLearn: ["Manage nerves in a live case", "Structure a 45-second opening", "Handle unexpected data in exhibits", "Give a crisp 60-second recommendation"], keyTopics: ["Case Structure", "Exhibit Analysis", "Mental Math", "Recommendation"], prerequisites: ["5+ practice cases completed"], expectedOutcome: "Experience a real BCG interview and identify gaps"
      },
    ],
    "Product Management": [
      {
        title: "PM Interview — Product Design with CIRCLES Framework",
        type: "video", category: "technical", duration: "45 min", difficulty: "intermediate", rating: 4.9,
        description: "Master the CIRCLES method for product design questions at top tech companies — complete with 5 full example walkthroughs for different product types.",
        tags: ["PM", "CIRCLES", "product-design", "interview"],
        externalUrl: ytSearch("product manager interview CIRCLES framework product design 2024"),
        channel: "Exponent", whatYouLearn: ["CIRCLES step-by-step process", "How to identify user segments", "Pain point prioritization", "MVP feature selection", "Trade-off articulation"], keyTopics: ["CIRCLES Method", "User Personas", "Pain Points", "Prioritization", "MVP"], prerequisites: ["Interest in product management"], expectedOutcome: "Answer any product design question with a clear, structured framework"
      },
      {
        title: "Cracking the PM Interview — Full Strategy Guide",
        type: "guide", category: "technical", duration: "35 min", difficulty: "intermediate", rating: 4.9,
        description: "Comprehensive PM interview prep guide covering product design, metrics, strategy, estimation, and behavioral questions with answers from Google/Meta/Amazon PMs.",
        tags: ["PM", "interview-guide", "strategy", "metrics"],
        externalUrl: "https://www.productplan.com/learn/product-manager-interview-guide/",
        channel: null, whatYouLearn: ["Product intuition development", "Metrics selection and success criteria", "Prioritization using RICE/ICE", "Product sense questions answered"], keyTopics: ["Product Design", "Metrics", "Prioritization", "Strategy", "Roadmapping"], prerequisites: ["Basic business and tech knowledge"], expectedOutcome: "Have a complete framework for every PM interview question type"
      },
      {
        title: "PM Mock Interview — Product Design + Metrics Round",
        type: "practice", category: "practice", duration: "45 min", difficulty: "intermediate", rating: 4.9,
        description: "Full mock PM interview with a product design question, a metrics/analytics case, and behavioral fit questions — scored with AI feedback on structure and clarity.",
        tags: ["mock", "PM", "product", "metrics", "practice"],
        externalUrl: null, channel: null, whatYouLearn: ["Real-time product thinking", "Metrics case structuring", "Communication and clarity", "Handling ambiguous questions"], keyTopics: ["Product Design", "Success Metrics", "Behavioral", "Communication"], prerequisites: ["Basic PM prep done"], expectedOutcome: "Pass Google/Meta/Amazon APM interviews confidently"
      },
    ],
  };

  domainFallbacks["Design (UI/UX)"] = [
    { title: "UI/UX Portfolio Case Study — How to Structure It", type: "guide", category: "technical", duration: "20 min", difficulty: "intermediate", rating: 4.8, description: "Learn to structure a compelling design case study covering problem, process, decisions, and measurable outcomes for top tech company interviews.", tags: ["portfolio", "case-study", "UX", "design"], externalUrl: "https://www.interaction-design.org/literature/topics/portfolio", channel: null, whatYouLearn: ["Problem framing", "Research documentation", "Design decisions", "Outcome metrics"], keyTopics: ["Case Study", "Portfolio", "Storytelling", "Metrics"], prerequisites: ["Some design projects"], expectedOutcome: "Create a portfolio that passes Google/Airbnb design screens" },
    { title: "Figma Advanced — Design Systems & Auto Layout", type: "video", category: "technical", duration: "55 min", difficulty: "intermediate", rating: 4.9, description: "Master Figma components, variants, auto-layout, and design tokens to build production-grade design systems from scratch.", tags: ["Figma", "design-systems", "components", "UX"], externalUrl: "https://www.youtube.com/results?search_query=Figma+design+system+auto+layout+advanced", channel: "DesignCourse", whatYouLearn: ["Component architecture", "Auto layout rules", "Design tokens", "Dev handoff"], keyTopics: ["Components", "Auto Layout", "Design Tokens", "Variants"], prerequisites: ["Basic Figma"], expectedOutcome: "Build an enterprise-ready Figma design system" },
    { title: "UX Design Interview — Design Challenge Walkthrough", type: "video", category: "practice", duration: "45 min", difficulty: "intermediate", rating: 4.9, description: "Watch a real UX design challenge being solved end-to-end — research, wireframes, prototypes, and presenting the final solution under time pressure.", tags: ["design-challenge", "UX", "interview", "process"], externalUrl: "https://www.youtube.com/results?search_query=UX+design+challenge+interview+walkthrough", channel: "AJ&Smart", whatYouLearn: ["Time management in design sprints", "Rapid ideation", "Sketching vs wireframing", "Presenting design decisions"], keyTopics: ["Design Sprint", "Wireframing", "Prototyping", "Presentation"], prerequisites: ["Basic UX knowledge"], expectedOutcome: "Pass any timed design challenge at top companies" },
    { title: "Mock Design Portfolio Review", type: "practice", category: "practice", duration: "45 min", difficulty: "intermediate", rating: 4.9, description: "Practice presenting your portfolio case studies with AI-guided feedback on storytelling, structure, and depth of design thinking.", tags: ["mock", "portfolio", "design", "practice"], externalUrl: null, channel: null, whatYouLearn: ["Portfolio presentation flow", "Responding to critique", "Showcasing process", "Handling tough questions"], keyTopics: ["Portfolio Review", "Critique", "Design Storytelling"], prerequisites: ["At least 2 portfolio projects"], expectedOutcome: "Walk into any design interview with a compelling portfolio story" },
  ];
  domainFallbacks["Marketing / Growth"] = [
    { title: "Growth Marketing — AARRR Framework Mastery", type: "guide", category: "technical", duration: "20 min", difficulty: "intermediate", rating: 4.8, description: "Complete guide to the AARRR (Pirate Metrics) framework — Acquisition, Activation, Retention, Revenue, Referral — with real company examples and metrics.", tags: ["AARRR", "growth", "metrics", "marketing"], externalUrl: "https://www.reforge.com/blog/growth-model", channel: null, whatYouLearn: ["Funnel analysis", "North Star metric selection", "Retention loops", "Viral coefficient"], keyTopics: ["AARRR", "North Star", "Retention", "Acquisition", "Viral Loops"], prerequisites: ["Basic marketing knowledge"], expectedOutcome: "Define and analyze growth funnels confidently in interviews" },
    { title: "Google Analytics 4 — Complete Tutorial for Marketers", type: "video", category: "technical", duration: "50 min", difficulty: "intermediate", rating: 4.7, description: "Master GA4 events, conversions, audiences, and attribution models — the most asked analytics tool in marketing interviews in 2024-25.", tags: ["GA4", "analytics", "google", "marketing"], externalUrl: "https://www.youtube.com/results?search_query=Google+Analytics+4+complete+tutorial+marketers+2024", channel: "Loves Data", whatYouLearn: ["Event tracking setup", "Conversion goals", "Attribution models", "Custom reports"], keyTopics: ["GA4", "Events", "Conversions", "Attribution", "Audiences"], prerequisites: ["Basic digital marketing knowledge"], expectedOutcome: "Use GA4 confidently for campaign and funnel analysis" },
    { title: "Meta & Google Ads — Performance Marketing Interviews", type: "video", category: "technical", duration: "40 min", difficulty: "intermediate", rating: 4.8, description: "All paid media interview questions covered — campaign structure, bidding strategies, audience targeting, ROAS optimization, and creative testing.", tags: ["Meta Ads", "Google Ads", "performance", "paid-media"], externalUrl: "https://www.youtube.com/results?search_query=Meta+Google+ads+interview+questions+performance+marketing", channel: "Surfside PPC", whatYouLearn: ["Campaign hierarchy", "Bid strategy selection", "Audience segmentation", "A/B creative testing"], keyTopics: ["Campaign Structure", "ROAS", "Bidding", "Audiences", "Creative Testing"], prerequisites: ["Basic ads platform knowledge"], expectedOutcome: "Pass paid media technical rounds at agencies and in-house teams" },
    { title: "Mock Marketing Strategy Interview", type: "practice", category: "practice", duration: "45 min", difficulty: "intermediate", rating: 4.9, description: "Full mock marketing interview with a growth strategy case, analytics question, and campaign design task — scored and reviewed by AI.", tags: ["mock", "marketing", "growth", "practice"], externalUrl: null, channel: null, whatYouLearn: ["Structuring marketing cases", "Data-driven decisions", "GTM strategy presentation"], keyTopics: ["Growth Strategy", "Analytics Case", "Campaign Design"], prerequisites: ["Basic marketing prep done"], expectedOutcome: "Crack marketing roles at top product and DTC companies" },
  ];
  domainFallbacks["Human Resources"] = [
    { title: "HR Interview Questions — Top 50 with Answers", type: "guide", category: "technical", duration: "25 min", difficulty: "intermediate", rating: 4.8, description: "The 50 most-asked HR interview questions covering talent acquisition, performance management, labor laws, and HR analytics — with model answers.", tags: ["HR", "interview", "talent", "HR-tech"], externalUrl: "https://www.shrm.org/resourcesandtools/tools-and-samples/interview-questions/pages/default.aspx", channel: null, whatYouLearn: ["HR process questions", "Situational HR cases", "Compensation questions", "Culture and DEI questions"], keyTopics: ["Talent Acquisition", "Performance Management", "Labor Law", "DEI", "Analytics"], prerequisites: ["HR fundamentals"], expectedOutcome: "Pass technical HR rounds at any company size" },
    { title: "SHRM Certification Prep — HR Body of Knowledge", type: "article", category: "technical", duration: "30 min", difficulty: "intermediate", rating: 4.7, description: "Overview of the SHRM-CP/SCP competency model covering behavioral and technical HR competencies tested in interviews and certification exams.", tags: ["SHRM", "certification", "HR", "competencies"], externalUrl: "https://www.shrm.org/certification/pages/default.aspx", channel: null, whatYouLearn: ["SHRM competency model", "HR behavioral standards", "Technical HR knowledge areas"], keyTopics: ["SHRM Competencies", "HR Strategy", "People Management", "Ethics"], prerequisites: ["2+ years HR experience"], expectedOutcome: "Align your HR practice with SHRM standards for senior roles" },
    { title: "Mock HR Interview — Case Study + Behavioral", type: "practice", category: "practice", duration: "45 min", difficulty: "intermediate", rating: 4.9, description: "Simulated HR interview with an employee relations case, talent acquisition scenario, and 3 behavioral questions from real CHRO interview banks.", tags: ["mock", "HR", "case", "behavioral"], externalUrl: null, channel: null, whatYouLearn: ["HR case structuring", "Policy decision-making", "Handling sensitive scenarios"], keyTopics: ["Employee Relations Case", "TA Scenario", "Behavioral HR"], prerequisites: ["HR fundamentals"], expectedOutcome: "Prepare for HRBP and senior HR roles at top companies" },
  ];
  domainFallbacks["Operations"] = [
    { title: "Operations Case Interview — Frameworks & Examples", type: "guide", category: "technical", duration: "20 min", difficulty: "intermediate", rating: 4.8, description: "Frameworks for solving operations cases — process improvement, capacity planning, supply chain optimization — with 5 solved examples.", tags: ["operations", "case", "process-improvement", "supply-chain"], externalUrl: "https://managementconsulted.com/case-interview/operations-case/", channel: null, whatYouLearn: ["Process bottleneck analysis", "Capacity planning math", "Make vs buy decisions", "Vendor negotiation cases"], keyTopics: ["Process Improvement", "Capacity Planning", "Supply Chain", "Lean"], prerequisites: ["Basic business knowledge"], expectedOutcome: "Confidently solve operations cases in consulting and industry interviews" },
    { title: "Lean Six Sigma — Green Belt Concepts", type: "video", category: "technical", duration: "1hr", difficulty: "intermediate", rating: 4.8, description: "Complete Lean Six Sigma Green Belt concepts — DMAIC methodology, waste elimination, process control charts, and real industry examples.", tags: ["lean", "six-sigma", "DMAIC", "process"], externalUrl: "https://www.youtube.com/results?search_query=lean+six+sigma+green+belt+concepts+DMAIC", channel: "Lean Six Sigma", whatYouLearn: ["DMAIC framework", "7 types of waste", "Control charts", "Process capability"], keyTopics: ["DMAIC", "Waste Elimination", "Control Charts", "5S"], prerequisites: ["Basic operations knowledge"], expectedOutcome: "Apply Lean Six Sigma tools to solve real operations problems" },
    { title: "Mock Operations Interview", type: "practice", category: "practice", duration: "45 min", difficulty: "intermediate", rating: 4.9, description: "Full operations mock interview with a supply chain case, process improvement scenario, and behavioral leadership questions.", tags: ["mock", "operations", "supply-chain", "practice"], externalUrl: null, channel: null, whatYouLearn: ["Operations case structuring", "Data-driven decisions", "Process presentation"], keyTopics: ["Supply Chain Case", "Process Improvement", "Leadership"], prerequisites: ["Basic operations prep"], expectedOutcome: "Land operations and supply chain roles at top companies" },
  ];
  domainFallbacks["Sales"] = [
    { title: "Sales Interview — SPIN Selling & Challenger Sale", type: "guide", category: "technical", duration: "20 min", difficulty: "intermediate", rating: 4.8, description: "Master SPIN Selling and The Challenger Sale methodologies — the two most asked sales frameworks in AE and enterprise sales interviews.", tags: ["SPIN", "Challenger", "sales", "methodology"], externalUrl: "https://www.saleshacker.com/spin-selling/", channel: null, whatYouLearn: ["SPIN question types", "Challenger reframe technique", "Discovery call structure", "Objection handling"], keyTopics: ["SPIN Selling", "Challenger Sale", "Discovery", "Objection Handling"], prerequisites: ["Basic sales experience"], expectedOutcome: "Demonstrate sales methodology mastery in any interview" },
    { title: "Sales Role Play — Cold Call & Discovery Call Mastery", type: "video", category: "technical", duration: "35 min", difficulty: "intermediate", rating: 4.8, description: "Watch expert cold calls and discovery calls performed and critiqued — learn exactly what top AEs do differently in the first 5 minutes.", tags: ["cold-call", "discovery", "role-play", "sales"], externalUrl: "https://www.youtube.com/results?search_query=sales+cold+call+discovery+call+role+play+expert", channel: "SalesFeed", whatYouLearn: ["Opening hook techniques", "Need discovery questions", "Handling early objections", "Setting next steps"], keyTopics: ["Cold Calling", "Discovery Call", "Objection Handling", "Closing"], prerequisites: ["Interest in sales"], expectedOutcome: "Perform confidently in sales role-play rounds" },
    { title: "Mock Sales Interview — Role Play + Case", type: "practice", category: "practice", duration: "45 min", difficulty: "intermediate", rating: 4.9, description: "Full sales mock interview with a cold call role-play, a territory planning case, and behavioral questions on quota attainment and teamwork.", tags: ["mock", "sales", "role-play", "practice"], externalUrl: null, channel: null, whatYouLearn: ["Live role-play confidence", "Sales case structuring", "Territory planning basics"], keyTopics: ["Role Play", "Territory Planning", "Quota Questions"], prerequisites: ["Basic sales prep"], expectedOutcome: "Land AE or SDR roles at top SaaS companies" },
  ];
  domainFallbacks["DevOps / Cloud"] = [
    { title: "Kubernetes — Complete Interview Prep", type: "guide", category: "technical", duration: "30 min", difficulty: "advanced", rating: 4.9, description: "All Kubernetes concepts asked in DevOps/SRE interviews — pods, deployments, services, ingress, HPA, Helm, and troubleshooting scenarios.", tags: ["Kubernetes", "K8s", "DevOps", "containers"], externalUrl: "https://github.com/dgkanatsios/CKAD-exercises", channel: null, whatYouLearn: ["Pod lifecycle", "Service types", "Scaling with HPA", "Helm chart structure", "Debugging pods"], keyTopics: ["Pods", "Deployments", "Services", "HPA", "Helm", "Ingress"], prerequisites: ["Docker basics", "Linux command line"], expectedOutcome: "Pass CKAD/CKA and DevOps technical interviews" },
    { title: "Terraform & AWS — Infrastructure as Code Interview", type: "video", category: "technical", duration: "55 min", difficulty: "intermediate", rating: 4.8, description: "Terraform modules, state management, and AWS resource provisioning — all asked in cloud infrastructure interviews at top tech companies.", tags: ["Terraform", "AWS", "IaC", "cloud"], externalUrl: "https://www.youtube.com/results?search_query=Terraform+AWS+infrastructure+code+interview+2024", channel: "TechWorld with Nana", whatYouLearn: ["Terraform state management", "Module design", "AWS VPC provisioning", "Remote backends", "Terraform Cloud"], keyTopics: ["Terraform Modules", "State", "AWS Resources", "Variables", "Workspaces"], prerequisites: ["Basic cloud knowledge", "CLI comfort"], expectedOutcome: "Build and explain IaC solutions in cloud architect interviews" },
    { title: "CI/CD & GitHub Actions — DevOps Interview Must-Know", type: "video", category: "technical", duration: "40 min", difficulty: "intermediate", rating: 4.8, description: "Build complete CI/CD pipelines with GitHub Actions — build, test, security scan, and deploy to Kubernetes — covering all interview questions.", tags: ["CI/CD", "GitHub Actions", "pipeline", "DevOps"], externalUrl: "https://www.youtube.com/results?search_query=GitHub+Actions+CI+CD+pipeline+Kubernetes+2024", channel: "TechWorld with Nana", whatYouLearn: ["Workflow YAML syntax", "Job dependencies", "Docker build & push", "Deploy to K8s", "Secrets management"], keyTopics: ["Workflows", "Jobs", "Artifacts", "Docker", "Deployment"], prerequisites: ["Git basics", "Docker basics"], expectedOutcome: "Design and explain CI/CD pipelines in DevOps interviews" },
    { title: "Mock DevOps Interview — System Design + Cloud", type: "practice", category: "practice", duration: "60 min", difficulty: "advanced", rating: 4.9, description: "Full DevOps mock interview: cloud architecture design question, Kubernetes scenario, CI/CD design, and SRE behavioral questions.", tags: ["mock", "DevOps", "cloud", "K8s", "practice"], externalUrl: null, channel: null, whatYouLearn: ["Cloud architecture under interview pressure", "K8s troubleshooting scenarios", "SRE on-call questions"], keyTopics: ["Cloud Design", "K8s", "CI/CD", "SRE"], prerequisites: ["6+ months DevOps experience"], expectedOutcome: "Pass DevOps/SRE interviews at FAANG and top cloud companies" },
  ];
  domainFallbacks["Cybersecurity"] = [
    { title: "OWASP Top 10 — Web Security Interview Essentials", type: "guide", category: "technical", duration: "25 min", difficulty: "intermediate", rating: 4.9, description: "Deep dive into all OWASP Top 10 vulnerabilities — SQL injection, XSS, CSRF, SSRF, broken auth — with real exploitation examples and mitigations.", tags: ["OWASP", "web-security", "XSS", "SQLi", "AppSec"], externalUrl: "https://owasp.org/www-project-top-ten/", channel: null, whatYouLearn: ["SQL injection detection & prevention", "XSS attack vectors", "Authentication bypass", "SSRF exploitation", "Security headers"], keyTopics: ["SQL Injection", "XSS", "CSRF", "SSRF", "Auth Flaws", "Security Misconfig"], prerequisites: ["Basic web development knowledge"], expectedOutcome: "Answer all OWASP-related security interview questions confidently" },
    { title: "Network Security & Penetration Testing — Interview Prep", type: "video", category: "technical", duration: "55 min", difficulty: "intermediate", rating: 4.8, description: "Penetration testing methodology, network attack vectors, and defensive security concepts asked in security analyst and ethical hacker interviews.", tags: ["pentest", "network-security", "ethical-hacking", "security"], externalUrl: "https://www.youtube.com/results?search_query=penetration+testing+network+security+interview+2024", channel: "NetworkChuck", whatYouLearn: ["Reconnaissance techniques", "Exploitation methodology", "Privilege escalation", "Network scanning", "Report writing"], keyTopics: ["Reconnaissance", "Exploitation", "Post-exploitation", "Network Scanning", "Reporting"], prerequisites: ["Basic networking (TCP/IP)", "Linux basics"], expectedOutcome: "Pass security analyst and pentester technical screens" },
    { title: "Mock Cybersecurity Interview — Technical + Scenario", type: "practice", category: "practice", duration: "60 min", difficulty: "advanced", rating: 4.9, description: "Full cybersecurity interview simulation: threat modeling question, incident response scenario, network security quiz, and behavioral round.", tags: ["mock", "cybersecurity", "incident-response", "practice"], externalUrl: null, channel: null, whatYouLearn: ["Threat modeling articulation", "IR process walkthrough", "Network attack response", "SOC analyst questions"], keyTopics: ["Threat Modeling", "Incident Response", "Network Security", "SOC"], prerequisites: ["Basic security knowledge"], expectedOutcome: "Land SOC analyst, security engineer, or pentester roles" },
  ];

  const specific = domainFallbacks[domain] || domainFallbacks["Software Development"];
  const generic  = [
    {
      title: "STAR Behavioral Interview — 30 Real Questions & Answers",
      type: "guide", category: "behavioral", duration: "20 min", difficulty: "beginner", rating: 4.8,
      description: "The definitive STAR method guide with 30 example behavioral questions and model answers tailored for professional and technical roles.",
      tags: ["behavioral", "STAR", "HR", "soft-skills"],
      externalUrl: "https://www.themuse.com/advice/star-interview-method",
      channel: null, whatYouLearn: ["STAR framework mastered", "30 ready-to-use stories", "Adapting stories to different questions", "Common pitfalls to avoid"], keyTopics: ["Leadership", "Conflict", "Failure", "Teamwork", "Initiative"], prerequisites: ["Some work or project experience"], expectedOutcome: "Never blank in behavioral rounds"
    },
    {
      title: "Salary Negotiation — Get 15–30% More on Your Offer",
      type: "video", category: "career", duration: "18 min", difficulty: "beginner", rating: 4.7,
      description: "Proven negotiation scripts and psychology-backed strategies to push your job offer higher — when to counter, what to say, and how to handle lowball offers.",
      tags: ["salary", "negotiation", "offer", "career"],
      externalUrl: ytSearch("salary negotiation scripts get more offer job 2024"),
      channel: "Negotiation Advice", whatYouLearn: ["When and how to counter-offer", "Using competing offers as leverage", "Negotiating beyond base salary (equity, signing, PTO)", "Scripts for common objections"], keyTopics: ["Counter-offer", "Competing Offers", "Total Comp", "Scripts"], prerequisites: ["Have a job offer in hand"], expectedOutcome: "Negotiate confidently and get at least 10% above initial offer"
    },
  ];

  return [...specific, ...generic].map((r, i) => ({ ...r, _id: `fallback_${i}` }));
}

// ── GET /resources ────────────────────────────────────────────────────────────
router.get('/resources', async (req, res) => {
  try {
    const { userId, userType, studentClass, stream, domain, experienceLevel, skills, goals } = req.query;

    const profile = userId ? {
      userType,
      studentClass,
      stream:          normalizeStream(stream),
      domain:          normalizeDomain(domain),
      experienceLevel,
      skills: skills ? skills.split(',').filter(Boolean) : [],
      goals:  goals  ? goals.split(',').filter(Boolean)  : [],
    } : null;

    // Try Gemini first
    let resources = null;
    if (profile?.userType) {
      resources = await generatePersonalizedResources(profile);
    }

    // Fallback to rich static resources
    if (!resources || resources.length === 0) {
      resources = getFallbackResources(profile);
    }

    res.json({ success: true, data: resources, aiGenerated: !!resources?.[0]?._id?.startsWith('gen_') });
  } catch (err) {
    console.error('GET /resources error:', err);
    res.status(500).json({ success: false, message: 'Failed to load preparation resources' });
  }
});

// ── POST /resources/generate ─────────────────────────────────────────────────
router.post('/resources/generate', async (req, res) => {
  try {
    const { profile } = req.body;
    if (!profile) return res.status(400).json({ success: false, message: 'Profile required' });

    let resources = await generatePersonalizedResources(profile);
    if (!resources || resources.length === 0) {
      resources = getFallbackResources(profile);
    }

    res.json({ success: true, data: resources, aiGenerated: true });
  } catch (err) {
    console.error('POST /resources/generate error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate resources' });
  }
});

// ── Individual resource stubs ─────────────────────────────────────────────────
router.get('/resources/:id',         async (req, res) => res.json({ success: false, message: 'Use dynamic mode' }));
router.post('/resources/:id/save',   async (req, res) => res.json({ success: true, message: 'Saved (client-side)' }));
router.post('/resources/:id/view',   async (req, res) => res.json({ success: true, message: 'View tracked' }));
router.post('/resources/:id/share',  async (req, res) => res.json({ success: true, message: 'Share tracked' }));

export default router;