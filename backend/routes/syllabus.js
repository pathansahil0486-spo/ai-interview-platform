// backend/routes/syllabus.js
// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/syllabus/topics?userId=<clerkId>
// POST /api/syllabus/refresh   { userId }
// POST /api/syllabus/feedback  { userId, topic, subtopic, helpful }
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express';
import User from '../models/User.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
// Yeh dikhna chahiye
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY_SYLLABUS || process.env.GEMINI_API_KEY
);

// ── Cosmetic constants (not stored in DB) ─────────────────────────────────────
const TOPIC_COLORS = [
  "#6366f1","#7c3aed","#0891b2","#dc2626",
  "#059669","#db2777","#b45309","#0369a1",
  "#15803d","#1d4ed8","#9d174d","#374151",
];
const TOPIC_ICONS = ["📚","🧠","💡","🔬","⚡","🎯","📊","🛠️","🌐","🔐","📐","🎓"];

// ── Detect user category from profile ────────────────────────────────────────
function detectCategory(user) {
  const stream   = (user.stream        || '').toLowerCase();
  const domain   = (user.domain        || '').toLowerCase();
  const jobTitle = (user.jobTitle      || '').toLowerCase();
  const isStudent = user.userType === 'student';

  if (isStudent) {
    if (stream.includes('pcb') || stream.includes('biology') || stream.includes('medical') || stream.includes('neet')) return 'neet';
    if (stream.includes('pcm') || stream.includes('jee') || stream.includes('engineering') || stream.includes('maths')) return 'jee';
    if (stream.includes('commerce') || stream.includes('bcom') || stream.includes('ca ') || stream.includes('accounts')) return 'commerce';
    if (stream.includes('arts') || stream.includes('humanities') || stream.includes('upsc') || stream.includes('ba ') || stream.includes('political') || stream.includes('history') || stream.includes('sociology') || stream.includes('psychology') || stream.includes('english')) return 'arts';
    if (stream.includes('bca') || stream.includes('mca') || stream.includes('computer science')) return 'cs_student';
    if (stream.includes('bsc') || stream.includes('science') && !stream.includes('pcm') && !stream.includes('pcb')) return 'bsc';
    if (stream.includes('law') || stream.includes('llb')) return 'law_student';
    if (stream.includes('mba') || stream.includes('management')) return 'mba_student';
    return 'general_student';
  }

  // Professionals
  if (domain.includes('software') || domain.includes('engineering')) return 'software';
  if (domain.includes('data') || domain.includes('ml') || domain.includes('ai')) return 'data_science';
  if (domain.includes('product')) return 'product';
  if (domain.includes('devops') || domain.includes('cloud') || domain.includes('infra')) return 'devops';
  if (domain.includes('cyber') || domain.includes('security')) return 'cybersecurity';
  if (domain.includes('design') || domain.includes('ux') || domain.includes('ui')) return 'design';
  if (domain.includes('marketing')) return 'marketing';
  if (domain.includes('finance')) return 'finance';
  if (domain.includes('hr') || domain.includes('human')) return 'hr';
  if (domain.includes('consulting')) return 'consulting';
  if (domain.includes('sales')) return 'sales';
  if (domain.includes('civil') || jobTitle.includes('civil')) return 'civil';
  if (domain.includes('mechanical') || jobTitle.includes('mechanical')) return 'mechanical';
  if (domain.includes('operations') || domain.includes('ops')) return 'operations';
  if (domain.includes('law') || jobTitle.includes('lawyer') || jobTitle.includes('legal')) return 'law';
  if (domain.includes('medical') || domain.includes('health') || jobTitle.includes('doctor') || jobTitle.includes('nurse')) return 'medical_professional';
  if (domain.includes('education') || jobTitle.includes('teacher')) return 'education';

  return 'general';
}

// ── Build Gemini prompt ───────────────────────────────────────────────────────
function buildSyllabusPrompt(profile) {
  const isStudent  = profile.userType === 'student';
  const goals      = (profile.goals      || []).join(', ') || 'Not specified';
  const skills     = (profile.skills     || []).join(', ') || 'Not specified';
  const targetRole = (profile.targetRoles || []).join(', ') || profile.jobTitle || 'Not specified';
  const category   = detectCategory(profile);

  const identity = isStudent
    ? `Student
       Class/Year: ${profile.studentClass || 'Unknown'}
       Stream/Branch: ${profile.stream || 'Unknown'}
       College/School: ${profile.college || 'Not specified'}
       Detected Category: ${category}
       Goals: ${goals}`
    : `Professional
       Domain: ${profile.domain || 'General'} (Category: ${category})
       Job Title: ${profile.jobTitle || 'Unknown'}
       Company: ${profile.company || 'Not specified'}
       Target Roles: ${targetRole}
       Experience Level: ${profile.experienceLevel || 'intermediate'}
       Current Skills: ${skills}
       Goals: ${goals}`;

  return `You are a world-class curriculum designer. Generate a highly detailed, PERSONALISED learning syllabus for this exact user profile.

USER PROFILE:
${identity}

CRITICAL RULES — READ CAREFULLY:
1. The syllabus MUST match the user's EXACT category (${category}). 
   - Arts/Humanities students → Literature, History, Political Science, Philosophy, Sociology, Psychology, Economics, Geography, UPSC prep
   - Commerce students → Accountancy, Business Studies, Economics, Maths/Stats, CA Foundation if applicable
   - Science (PCM) students → Physics, Chemistry, Maths (JEE-aligned)
   - Science (PCB) students → Physics, Chemistry, Biology (NEET-aligned)
   - BCA/MCA/CS students → Programming, DSA, DBMS, OS, Computer Networks, Web Dev
   - BSc students → their specific science subjects
   - Law students → Constitutional Law, Contract Law, Criminal Law, Tort, Legal Drafting
   - MBA students → Management, Marketing, Finance, Operations, Strategy, HR
   - Medical professionals → Clinical skills, specialization topics
   - Software engineers → DSA, System Design, JS/Python, React/Backend, Databases
   - Data scientists → Statistics, ML, Python, SQL, Deep Learning
   - Finance professionals → Financial Analysis, Valuation, Excel Modelling, CFA prep
   - HR professionals → Talent Acquisition, HRBP, Comp & Ben, Employment Law, People Analytics
   - Marketing professionals → Digital Marketing, SEO/SEM, Content Strategy, Brand Management, Analytics
   - Design professionals → UI/UX Principles, Figma, User Research, Design Systems, Accessibility
   - Sales professionals → Sales Process, Negotiation, CRM, Account Management, Sales Analytics
   - Consulting professionals → Problem Solving, Slide Communication, Financial Modelling, Industry Knowledge
   - Operations professionals → Supply Chain, Process Improvement, Lean/Six Sigma, Project Management
   - Civil engineers → Structural Analysis, RCC Design, Geotechnical, AutoCAD, Estimation
   - Mechanical engineers → Thermodynamics, Fluid Mechanics, Manufacturing, CAD/CAM, FEA

2. Generate exactly 6-8 main TOPICS relevant to this user.
3. Each topic must have 4-6 subtopics with full metadata.
4. Subtopic difficulty must progress: foundational → intermediate → advanced.
5. Key concepts: 4-6 specific, assessable concepts per subtopic.
6. Resources: 3 free, real resources per TOPIC (real URLs).
7. studyTip: one specific, actionable tip per topic.
8. interviewFrequency / exam frequency: "very_high" | "high" | "medium" | "low"
9. estimatedHours: realistic hours to complete each topic.
10. DO NOT generate generic topics — be SPECIFIC to the user's exact domain/stream/class.

Respond ONLY with valid JSON. No markdown, no preamble, no trailing commas.

{
  "meta": {
    "label": "<e.g. 'NEET 2025 Biology+Chemistry+Physics' or 'Senior React Engineer' or 'UPSC Civil Services' or 'CA Foundation'>",
    "domain": "<exact domain key: software|data_science|product|finance|hr|general|medical|law|engineering|commerce|marketing|design|devops|cybersecurity|arts|sales|consulting|operations|mechanical|civil>",
    "totalTopics": <number>,
    "totalSubtopics": <number>,
    "totalEstimatedHours": <number>,
    "targetAudience": "<1-line description>",
    "aiSummary": "<2-sentence personalised study plan for this exact user>"
  },
  "topics": [
    {
      "topic": "<Topic Name>",
      "description": "<2-line description>",
      "estimatedHours": <number>,
      "interviewFrequency": "very_high|high|medium|low",
      "prerequisites": ["<topic name>"],
      "studyTip": "<specific actionable tip>",
      "resources": [
        { "title": "<title>", "url": "<url>", "type": "video|docs|article|course" }
      ],
      "subtopics": [
        {
          "name": "<Subtopic Name>",
          "description": "<1-2 line description>",
          "difficulty": "foundational|intermediate|advanced",
          "estimatedHours": <number>,
          "keyConcepts": ["<concept1>", "<concept2>", "<concept3>", "<concept4>"],
          "whyItMatters": "<1 line: real-world or exam context>"
        }
      ]
    }
  ]
}`;
}

// ── Fingerprint ───────────────────────────────────────────────────────────────
function buildProfileFingerprint(user) {
  return [
    user.userType        || '',
    user.domain          || '',
    user.stream          || '',
    user.studentClass    || '',
    user.college         || '',
    user.jobTitle        || '',
    user.company         || '',
    user.experienceLevel || '',
    (user.goals       || []).slice().sort().join(','),
    (user.skills      || []).slice().sort().join(','),
    (user.targetRoles || []).slice().sort().join(','),
  ].join('|').toLowerCase();
}

// ── GET /api/syllabus/topics ──────────────────────────────────────────────────
router.get('/topics', async (req, res) => {
  try {
    const { userId, force } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const user = await User.findOne({ clerkId: userId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const currentFingerprint = buildProfileFingerprint(user);
    const cachedFingerprint  = user.syllabusCache?.profileFingerprint || '';
    const profileChanged     = currentFingerprint !== cachedFingerprint;

    const cacheAge = user.syllabusCache?.generatedAt
      ? (Date.now() - new Date(user.syllabusCache.generatedAt).getTime()) / 86400000
      : 999;

    const cacheTopics      = user.syllabusCache?.topics || [];
    const cacheHasRealData = cacheTopics.length > 0
      && cacheTopics.every(t => t.topic && t.topic.trim() !== '')
      && cacheTopics.every(t => Array.isArray(t.subtopics) && t.subtopics.length > 0);

    const cacheValid = force !== 'true'
      && cacheAge < 7
      && !profileChanged
      && cacheHasRealData;

    if (cacheValid) {
      console.log(`[Syllabus] CACHE HIT ${userId} — ${cacheTopics.length} topics (${detectCategory(user)}), age ${cacheAge.toFixed(1)}d`);
      return res.json({
        success: true,
        data: enrichWithColors(user.syllabusCache),
        cached: true,
        cacheAge: Math.round(cacheAge * 10) / 10,
      });
    }

    const reason = force === 'true' ? 'FORCED' : profileChanged ? 'PROFILE_CHANGED' : !cacheHasRealData ? 'EMPTY_CACHE' : 'STALE';
    console.log(`[Syllabus] REGEN (${reason}) for ${userId} — category: ${detectCategory(user)}`);

    // ── Generate with Gemini ───────────────────────────────────────────────────
    const prompt = buildSyllabusPrompt(user);
    let syllabusData;

    try {
     const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
      const result  = await model.generateContent(prompt);
      const rawText = result.response.text().trim();
      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      syllabusData = JSON.parse(cleaned);

      if (!Array.isArray(syllabusData?.topics) || syllabusData.topics.length === 0)
        throw new Error('Gemini returned empty topics');
      if (syllabusData.topics.some(t => !t.subtopics?.length))
        throw new Error('Gemini returned topics with missing subtopics');

      console.log(`[Syllabus] Gemini SUCCESS — ${syllabusData.topics.length} topics for category: ${syllabusData.meta?.label}`);
    } catch (geminiErr) {
      console.error('[Syllabus] Gemini failed:', geminiErr.message, '— using fallback for category:', detectCategory(user));
      syllabusData = buildFallbackSyllabus(user);
    }

    if (!syllabusData?.topics?.length || syllabusData.topics.some(t => !t.subtopics?.length)) {
      syllabusData = buildFallbackSyllabus(user);
    }

    // ── Save cache ─────────────────────────────────────────────────────────────
    user.syllabusCache = {
      meta:               syllabusData.meta   || {},
      topics:             syllabusData.topics || [],
      generatedAt:        new Date(),
      profileFingerprint: currentFingerprint,
    };
    await user.save();

    const t0 = syllabusData.topics[0];
    console.log(`[Syllabus] SAVED ${syllabusData.topics.length} topics for ${userId} — "${t0?.topic}" has ${t0?.subtopics?.length} subtopics`);

    return res.json({ success: true, data: enrichWithColors(syllabusData), cached: false });

  } catch (err) {
    console.error('[Syllabus] Unexpected error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate syllabus', error: err.message });
  }
});

// ── POST /api/syllabus/refresh ─────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const user = await User.findOne({ clerkId: userId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Mark cache stale immediately so next GET regens — prevents double-regen race
    const currentFingerprint = buildProfileFingerprint(user);
    if (user.syllabusCache) {
      user.syllabusCache.profileFingerprint = '__stale__';
    }
    await user.save();

    res.json({ success: true, message: 'Syllabus will regenerate on next visit.' });

    // ── Background regen ──────────────────────────────────────────────────────
    try {
      console.log(`[Syllabus/refresh] Background regen for ${userId} — category: ${detectCategory(user)}`);
      const prompt = buildSyllabusPrompt(user);

      const geminiRes = await fetch(
       `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
          }),
        }
      );

      const geminiData = await geminiRes.json();
      const raw        = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleaned    = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

      if (!cleaned) throw new Error('Empty Gemini response');
      const syllabusData = JSON.parse(cleaned);
      if (!syllabusData?.topics?.length) throw new Error('No topics in Gemini response');

      user.syllabusCache = {
        meta:               syllabusData.meta   || {},
        topics:             syllabusData.topics || [],
        generatedAt:        new Date(),
        profileFingerprint: currentFingerprint,
      };
      await user.save();
      console.log(`[Syllabus/refresh] Done for ${userId} — ${syllabusData.topics.length} topics`);
    } catch (bgErr) {
      // Clear cache so next GET runs full regen
      try {
        user.syllabusCache = null;
        await user.save();
      } catch {}
      console.error('[Syllabus/refresh] Background regen failed:', bgErr.message);
    }

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/syllabus/fix ─────────────────────────────────────────────────────
router.post('/fix', async (req, res) => {
  try {
    const users = await User.find({ 'syllabusCache.topics.0': { $exists: true } });
    let fixed = 0;
    for (const u of users) {
      const topics = u.syllabusCache?.topics || [];
      const isBad  = topics.some(t => !t.subtopics?.length || !t.topic);
      if (isBad) { u.syllabusCache = null; await u.save(); fixed++; }
    }
    res.json({ success: true, message: `Fixed ${fixed} users with bad syllabus cache` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Enrich with colors + icons ─────────────────────────────────────────────────
function enrichWithColors(data) {
  if (!data?.topics) return data;
  const plain = typeof data.toObject === 'function'
    ? data.toObject({ virtuals: false, versionKey: false })
    : JSON.parse(JSON.stringify(data));
  return {
    ...plain,
    topics: plain.topics.map((t, i) => ({
      ...t,
      color: TOPIC_COLORS[i % TOPIC_COLORS.length],
      icon:  TOPIC_ICONS[i % TOPIC_ICONS.length],
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FALLBACK SYLLABI — one per category
// Used when Gemini fails or API key is invalid
// ─────────────────────────────────────────────────────────────────────────────

function buildFallbackSyllabus(user) {
  const category = detectCategory(user);
  console.log(`[Syllabus] buildFallbackSyllabus — category: ${category}`);

  // Lazy getter — all FALLBACK consts are defined later in the file.
  // Using a function avoids const-hoisting ReferenceError.
  const getFallback = (cat) => {
    const MAP = {
      software:             SOFTWARE_FALLBACK,
      data_science:         DATA_SCIENCE_FALLBACK,
      product:              PRODUCT_FALLBACK,
      devops:               DEVOPS_FALLBACK,
      cybersecurity:        CYBERSECURITY_FALLBACK,
      design:               DESIGN_FALLBACK,
      marketing:            MARKETING_FALLBACK,
      finance:              FINANCE_FALLBACK,
      hr:                   HR_FALLBACK,
      consulting:           CONSULTING_FALLBACK,
      sales:                SALES_FALLBACK,
      operations:           OPERATIONS_FALLBACK,
      civil:                CIVIL_FALLBACK,
      mechanical:           MECHANICAL_FALLBACK,
      neet:                 NEET_FALLBACK,
      jee:                  JEE_FALLBACK,
      commerce:             COMMERCE_FALLBACK,
      arts:                 ARTS_FALLBACK,
      cs_student:           CS_STUDENT_FALLBACK,
      bsc:                  BSC_FALLBACK,
      law_student:          LAW_STUDENT_FALLBACK,
      law:                  LAW_PROFESSIONAL_FALLBACK,
      mba_student:          MBA_FALLBACK,
      medical_professional: MEDICAL_PROFESSIONAL_FALLBACK,
      education:            EDUCATION_FALLBACK,
      general_student:      GENERAL_STUDENT_FALLBACK,
      general:              GENERAL_FALLBACK,
    };
    return MAP[cat] || GENERAL_FALLBACK;
  };

  return getFallback(category);
}

// ─────────────────────────────────────────────────────────────────────────────
// ARTS / HUMANITIES FALLBACK
// ─────────────────────────────────────────────────────────────────────────────
const ARTS_FALLBACK = {
  meta: {
    label: "Arts & Humanities — UPSC / BA Preparation",
    domain: "arts",
    totalTopics: 6,
    totalSubtopics: 24,
    totalEstimatedHours: 400,
    targetAudience: "Arts & Humanities students targeting UPSC, BA exams, or postgraduate entrance",
    aiSummary: "History and Polity are the backbone of UPSC and BA exams. Build strong answer-writing skills from Day 1 — content without structure scores poorly in mains.",
  },
  topics: [
    {
      topic: "History of India & World",
      description: "Ancient, Medieval, and Modern Indian history plus World history — core for UPSC Mains and BA exams.",
      estimatedHours: 80,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "Make a chronological timeline for each era and link events causally. UPSC rewards 'why it happened' over 'what happened'.",
      resources: [
        { title: "NCERT History Class 6-12 (Free PDFs)", url: "https://ncert.nic.in/textbook.php", type: "docs" },
        { title: "Mrunal History Lectures (YouTube)", url: "https://www.youtube.com/@MrunalPatel", type: "video" },
        { title: "Bipin Chandra — Modern India (Archive)", url: "https://archive.org/details/ModernIndiaBipinChandra", type: "article" },
      ],
      subtopics: [
        { name: "Ancient India", description: "Indus Valley, Vedic period, Mauryas, Guptas, religious movements (Buddhism/Jainism)", difficulty: "foundational", estimatedHours: 18, keyConcepts: ["Harappan culture", "Ashoka's Dhamma", "Gupta golden age", "Buddhism spread"], whyItMatters: "5-8 UPSC Prelims questions annually; forms base for cultural heritage answers" },
        { name: "Medieval India", description: "Delhi Sultanate, Mughal Empire, Vijayanagara, Bhakti and Sufi movements", difficulty: "foundational", estimatedHours: 18, keyConcepts: ["Mughal administration", "Bhakti movement", "Vijayanagara architecture", "Akbar's policies"], whyItMatters: "4-6 UPSC questions annually; architecture and culture heavily tested" },
        { name: "Modern India & Freedom Struggle", description: "British colonialism, reform movements, Gandhi, nationalist movements, 1947 partition", difficulty: "intermediate", estimatedHours: 25, keyConcepts: ["1857 revolt", "INC formation", "Gandhian movements", "Partition causes"], whyItMatters: "Highest UPSC Mains weightage in History; 15+ marks in GS Paper 1" },
        { name: "World History (Post-1945)", description: "Cold War, decolonization, UN formation, globalisation, contemporary world order", difficulty: "intermediate", estimatedHours: 15, keyConcepts: ["Cold War blocs", "Non-Aligned Movement", "Decolonization waves", "Globalisation impact"], whyItMatters: "GS Paper 1 UPSC World History section; increasingly important for Mains" },
      ],
    },
    {
      topic: "Indian Polity & Constitution",
      description: "Constitutional framework, governance, and political theory — highest UPSC Prelims weightage.",
      estimatedHours: 70,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "Read Lakshmikanth chapter-by-chapter but always connect articles to real political events — 'Article 356 and President's Rule' means more when linked to actual instances.",
      resources: [
        { title: "M. Lakshmikanth Indian Polity (Key Chapters)", url: "https://www.amazon.in/s?k=lakshmikanth+indian+polity", type: "article" },
        { title: "Vision IAS Polity Notes", url: "https://www.visionias.in/resources/study-material", type: "article" },
        { title: "StudyIQ Polity (YouTube)", url: "https://www.youtube.com/@StudyIQ", type: "video" },
      ],
      subtopics: [
        { name: "Constitutional Framework", description: "Preamble, fundamental rights, DPSP, fundamental duties, amendments", difficulty: "foundational", estimatedHours: 15, keyConcepts: ["Fundamental Rights (Part III)", "DPSP vs FR", "Constitutional amendments", "Preamble significance"], whyItMatters: "10-12 UPSC Prelims questions; directly asked in both Prelims and Mains" },
        { name: "Parliament & Legislature", description: "Lok Sabha, Rajya Sabha, legislative process, parliamentary committees, budget", difficulty: "intermediate", estimatedHours: 15, keyConcepts: ["Money Bill vs Finance Bill", "Joint sitting", "Parliamentary committees", "Speaker powers"], whyItMatters: "High UPSC weightage; current affairs regularly test parliamentary procedures" },
        { name: "Judiciary & Federalism", description: "Supreme Court powers, judicial review, centre-state relations, cooperative federalism", difficulty: "intermediate", estimatedHours: 15, keyConcepts: ["Basic structure doctrine", "Judicial review", "Article 356", "GST Council federalism"], whyItMatters: "GS Paper 2 UPSC — Governance; federalism is a recurring Mains essay topic" },
        { name: "Local Governance & Elections", description: "73rd/74th amendment, panchayati raj, election commission, electoral reforms", difficulty: "intermediate", estimatedHours: 12, keyConcepts: ["Gram Sabha powers", "ECI powers", "NOTA", "Electoral bonds controversy"], whyItMatters: "Polity + current affairs overlap; 4-5 UPSC Prelims questions yearly" },
      ],
    },
    {
      topic: "Geography (India & World)",
      description: "Physical, human, and economic geography — essential for UPSC and BA Geography specialization.",
      estimatedHours: 60,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Draw maps from memory — India's rivers, mountain ranges, major cities. UPSC map-based questions reward spatial understanding that only comes from regular drawing.",
      resources: [
        { title: "NCERT Geography Class 11-12 (Free PDF)", url: "https://ncert.nic.in/textbook.php", type: "docs" },
        { title: "Mrunal Geography Lectures", url: "https://mrunal.org/geography", type: "article" },
        { title: "Khan Academy World Geography", url: "https://www.khanacademy.org/humanities/ap-human-geography", type: "course" },
      ],
      subtopics: [
        { name: "Physical Geography", description: "Geomorphology, climatology, oceanography, biogeography — NCERT Class 11 Fundamentals", difficulty: "foundational", estimatedHours: 15, keyConcepts: ["Rock cycle", "Monsoon mechanism", "Ocean currents", "Soil types"], whyItMatters: "4-6 UPSC Prelims questions; physical geography underpins environmental studies" },
        { name: "Indian Geography", description: "Rivers, mountains, climate zones, agriculture, minerals, transport networks", difficulty: "foundational", estimatedHours: 18, keyConcepts: ["Himalayan vs Peninsular rivers", "Agro-climatic zones", "Mineral belts", "National Highway network"], whyItMatters: "Highest geography weightage in UPSC; 8-10 questions per year" },
        { name: "Human & Economic Geography", description: "Population, urbanisation, migration, economic activities, globalisation", difficulty: "intermediate", estimatedHours: 15, keyConcepts: ["Demographic transition", "Rural-urban migration", "Special Economic Zones", "HDI components"], whyItMatters: "GS Paper 1 and 3 UPSC — development and social issues" },
      ],
    },
    {
      topic: "Sociology & Psychology",
      description: "Social structures, institutions, and human behaviour — core for BA Sociology/Psychology students.",
      estimatedHours: 50,
      interviewFrequency: "medium",
      prerequisites: [],
      studyTip: "Connect every sociological theory to a real Indian social issue. Weber's bureaucracy → Indian administrative challenges. This linkage fetches full marks in exams.",
      resources: [
        { title: "IGNOU BA Sociology Study Material (Free)", url: "https://egyankosh.ac.in/handle/123456789/6", type: "docs" },
        { title: "Crash Course Sociology (YouTube)", url: "https://www.youtube.com/playlist?list=PL8dPuuaLjXtMJ-AfB_7J1538YKZkEjJsN", type: "video" },
        { title: "Simply Psychology", url: "https://www.simplypsychology.org", type: "article" },
      ],
      subtopics: [
        { name: "Social Institutions", description: "Family, marriage, religion, education as social institutions — functionalist vs conflict perspective", difficulty: "foundational", estimatedHours: 12, keyConcepts: ["Functionalism", "Conflict theory", "Nuclear vs joint family", "Secularisation"], whyItMatters: "Foundation for all sociology; UPSC sociology optional heavily tests this" },
        { name: "Social Stratification", description: "Caste, class, gender inequality — Dalit studies, feminist theory, intersectionality", difficulty: "intermediate", estimatedHours: 15, keyConcepts: ["Caste system", "Class mobility", "Patriarchy", "Intersectionality"], whyItMatters: "Current affairs and UPSC essay topics regularly involve social stratification" },
        { name: "Psychology Fundamentals", description: "Sensation, perception, memory, cognition, motivation, personality theories", difficulty: "foundational", estimatedHours: 12, keyConcepts: ["Classical conditioning", "Maslow's hierarchy", "Memory types", "Piaget's stages"], whyItMatters: "BA Psychology core — forms basis for applied psychology and counselling" },
      ],
    },
    {
      topic: "Literature & Language",
      description: "English literature, critical theory, and language skills — essential for BA English students.",
      estimatedHours: 50,
      interviewFrequency: "medium",
      prerequisites: [],
      studyTip: "For literary analysis, always structure answers using: context → close reading → critical perspective → significance. A 3-point argument with textual evidence beats a 10-point summary.",
      resources: [
        { title: "Sparknotes Literary Analysis", url: "https://www.sparknotes.com", type: "article" },
        { title: "Yale Open Courses — English Literature", url: "https://oyc.yale.edu/english", type: "course" },
        { title: "Poetry Foundation", url: "https://www.poetryfoundation.org", type: "article" },
      ],
      subtopics: [
        { name: "Literary Periods & Movements", description: "Renaissance, Romanticism, Victorian, Modernism, Postmodernism — key authors and texts", difficulty: "foundational", estimatedHours: 12, keyConcepts: ["Romanticism tenets", "Victorian realism", "Modernist stream of consciousness", "Postmodern metafiction"], whyItMatters: "BA English exam questions directly test knowledge of literary periods" },
        { name: "Critical Theory", description: "New Criticism, Marxist criticism, feminist theory, postcolonialism, psychoanalytic criticism", difficulty: "advanced", estimatedHours: 15, keyConcepts: ["Close reading", "Ideological criticism", "Male gaze (Mulvey)", "Subaltern studies"], whyItMatters: "MA entrance and competitive exams test critical theory application extensively" },
        { name: "Writing & Communication Skills", description: "Essay writing, précis, comprehension, academic writing conventions, research methods", difficulty: "foundational", estimatedHours: 10, keyConcepts: ["Thesis statement", "Argument structure", "Citation (MLA/APA)", "Précis technique"], whyItMatters: "Core academic skill for all humanities; directly assessed in exams and interviews" },
      ],
    },
    {
      topic: "UPSC Exam Strategy",
      description: "Prelims + Mains strategy, answer writing, and current affairs integration.",
      estimatedHours: 60,
      interviewFrequency: "very_high",
      prerequisites: ["History of India & World", "Indian Polity & Constitution"],
      studyTip: "Write 2 Mains-style answers daily from Week 1 — most aspirants ignore answer writing until too late. Get them evaluated by a peer or online community.",
      resources: [
        { title: "UPSC Official Syllabus & Previous Papers", url: "https://upsc.gov.in/examinations/active-examinations", type: "docs" },
        { title: "Insights on India (IAS)", url: "https://www.insightsonindia.com", type: "article" },
        { title: "ForumIAS Answer Writing Practice", url: "https://forumias.com", type: "course" },
      ],
      subtopics: [
        { name: "Prelims Strategy (GS + CSAT)", description: "Topic-wise weightage analysis, elimination technique, CSAT maths/reasoning shortcuts", difficulty: "foundational", estimatedHours: 15, keyConcepts: ["Topic weightage analysis", "Negative marking strategy", "CSAT elimination", "MCQ pattern recognition"], whyItMatters: "Prelims is the gateway; most aspirants are eliminated here without strategy" },
        { name: "Mains Answer Writing", description: "Introduction types, body structure, diagrams/maps in answers, word limits, conclusion", difficulty: "intermediate", estimatedHours: 20, keyConcepts: ["10-marker structure", "15-marker structure", "Quote-based intro", "Multidimensional analysis"], whyItMatters: "Mains score entirely depends on answer quality, not just knowledge" },
        { name: "Current Affairs Integration", description: "Linking static syllabus to current events, issue-based learning, editorial analysis", difficulty: "intermediate", estimatedHours: 15, keyConcepts: ["Static-dynamic linkage", "Editorial analysis", "Government schemes tracking", "International events mapping"], whyItMatters: "30-40% of UPSC questions in Prelims and Mains require current affairs knowledge" },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN / UX FALLBACK
// ─────────────────────────────────────────────────────────────────────────────
const DESIGN_FALLBACK = {
  meta: {
    label: "UI/UX Design",
    domain: "design",
    totalTopics: 6,
    totalSubtopics: 22,
    totalEstimatedHours: 80,
    targetAudience: "Designers targeting product design, UX, or UI roles at tech companies",
    aiSummary: "Portfolio quality is the #1 hiring signal for designers. Build 3-4 case studies that show your full design process — research, ideation, prototyping, testing, and impact.",
  },
  topics: [
    {
      topic: "UX Research & Strategy",
      description: "User research methods, synthesis, and translating insights into design strategy.",
      estimatedHours: 15,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "Conduct at least 5 real user interviews for any project you're working on. Synthesize findings into a clear insight — not just quotes.",
      resources: [
        { title: "Nielsen Norman Group UX Research", url: "https://www.nngroup.com/articles/", type: "article" },
        { title: "Google UX Design Certificate (Coursera)", url: "https://www.coursera.org/professional-certificates/google-ux-design", type: "course" },
        { title: "Just Enough Research (Book)", url: "https://abookapart.com/products/just-enough-research", type: "article" },
      ],
      subtopics: [
        { name: "User Interviews & Surveys", description: "Interview script design, avoiding leading questions, synthesis, affinity mapping", difficulty: "foundational", estimatedHours: 4, keyConcepts: ["Interview script", "Affinity mapping", "Insight vs observation", "Synthesis methods"], whyItMatters: "All great design starts with real user understanding; tested in every design interview" },
        { name: "Usability Testing", description: "Moderated vs unmoderated testing, task design, severity rating, reporting findings", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["Task completion rate", "Think-aloud protocol", "Severity rating", "Iteration cycle"], whyItMatters: "Demonstrates design validation skills; case studies without testing are weak" },
        { name: "Jobs To Be Done & Personas", description: "JTBD framework, persona creation, scenario mapping, empathy maps", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["JTBD statement", "Persona elements", "Empathy map", "Scenario mapping"], whyItMatters: "Personas anchor design decisions; JTBD is the industry-preferred framework" },
      ],
    },
    {
      topic: "Interaction Design & Prototyping",
      description: "Wireframing, prototyping, interaction patterns — core design delivery skills.",
      estimatedHours: 18,
      interviewFrequency: "very_high",
      prerequisites: ["UX Research & Strategy"],
      studyTip: "Build interactive prototypes in Figma for every concept. A clickable prototype always communicates better than a static wireframe in interviews.",
      resources: [
        { title: "Figma Tutorial (Official)", url: "https://www.figma.com/resources/learn-design/", type: "docs" },
        { title: "Interaction Design Foundation", url: "https://www.interaction-design.org/courses", type: "course" },
        { title: "Laws of UX", url: "https://lawsofux.com", type: "article" },
      ],
      subtopics: [
        { name: "Wireframing", description: "Low to high fidelity wireframes, information architecture, user flows", difficulty: "foundational", estimatedHours: 4, keyConcepts: ["Information architecture", "User flow mapping", "Lo-fi to hi-fi", "Content hierarchy"], whyItMatters: "Wireframes show thinking process; every design role requires fast wireframing" },
        { name: "Figma Mastery", description: "Components, auto-layout, variants, prototyping flows, design tokens", difficulty: "intermediate", estimatedHours: 6, keyConcepts: ["Components & variants", "Auto-layout", "Prototype interactions", "Design tokens"], whyItMatters: "Figma is the industry standard tool; proficiency is a baseline expectation" },
        { name: "Interaction Patterns & Motion", description: "Microinteractions, animation principles, gesture design, feedback patterns", difficulty: "advanced", estimatedHours: 5, keyConcepts: ["Microinteractions", "12 principles of animation", "Haptic feedback", "State transitions"], whyItMatters: "Motion design differentiates senior designers; increasingly tested at FAANG design roles" },
      ],
    },
    {
      topic: "Visual Design & Typography",
      description: "Colour theory, typography, layout grids — the craft of making designs beautiful and functional.",
      estimatedHours: 12,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Study 10 real apps every week — analyze their typography scale, colour system, and spacing grid. Steal like an artist, then adapt.",
      resources: [
        { title: "Refactoring UI (Book)", url: "https://www.refactoringui.com", type: "article" },
        { title: "Google Fonts Knowledge", url: "https://fonts.google.com/knowledge", type: "docs" },
        { title: "Colour Theory Basics — Canva", url: "https://www.canva.com/colors/color-wheel/", type: "article" },
      ],
      subtopics: [
        { name: "Typography", description: "Type scale, font pairing, line height, letter spacing, readability principles", difficulty: "foundational", estimatedHours: 3, keyConcepts: ["Type scale", "Font pairing rules", "Readability vs legibility", "Baseline grid"], whyItMatters: "Typography is 90% of visual design; weak typography instantly signals inexperience" },
        { name: "Color & Visual Hierarchy", description: "Colour theory, accessible contrast, visual weight, emphasis techniques", difficulty: "foundational", estimatedHours: 3, keyConcepts: ["WCAG contrast ratios", "Colour psychology", "Visual hierarchy", "60-30-10 rule"], whyItMatters: "Colour accessibility is increasingly a legal requirement and interview topic" },
        { name: "Design Systems", description: "Atomic design, component libraries, tokens, documentation, team governance", difficulty: "advanced", estimatedHours: 5, keyConcepts: ["Atomic design", "Design tokens", "Component library", "Design governance"], whyItMatters: "Senior designers build design systems; it's a dedicated role at large companies" },
      ],
    },
    {
      topic: "Accessibility & Inclusive Design",
      description: "Designing for all users — WCAG standards, assistive technology, cognitive accessibility.",
      estimatedHours: 8,
      interviewFrequency: "high",
      prerequisites: ["Visual Design & Typography"],
      studyTip: "Use a screen reader (VoiceOver on Mac) to navigate your own designs. 10 minutes of screen reader testing reveals accessibility failures that visual inspection misses.",
      resources: [
        { title: "WCAG 2.1 Guidelines", url: "https://www.w3.org/WAI/WCAG21/quickref/", type: "docs" },
        { title: "A11y Project", url: "https://www.a11yproject.com", type: "article" },
        { title: "Deque University Accessibility", url: "https://dequeuniversity.com", type: "course" },
      ],
      subtopics: [
        { name: "WCAG Standards", description: "Perceivable, Operable, Understandable, Robust — AA vs AAA compliance", difficulty: "intermediate", estimatedHours: 3, keyConcepts: ["POUR principles", "AA compliance", "Colour contrast ratio", "Focus states"], whyItMatters: "Accessibility is legally mandated; most large companies explicitly test this in interviews" },
        { name: "Inclusive Design Patterns", description: "Screen reader design, keyboard navigation, cognitive load reduction, error recovery", difficulty: "intermediate", estimatedHours: 3, keyConcepts: ["ARIA labels", "Focus management", "Error messages", "Plain language"], whyItMatters: "1 billion people have disabilities; inclusive design reaches 100% of your users" },
      ],
    },
    {
      topic: "Product Thinking for Designers",
      description: "Metrics, business impact, and cross-functional collaboration — what separates good designers from great ones.",
      estimatedHours: 10,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "For every design decision, ask: what metric does this move? Be able to articulate design decisions in business terms during interviews.",
      resources: [
        { title: "Lenny's Newsletter on Design", url: "https://www.lennysnewsletter.com", type: "article" },
        { title: "Julie Zhuo — The Making of a Manager", url: "https://www.juliezhuo.com", type: "article" },
        { title: "First Round Design Blog", url: "https://review.firstround.com/design", type: "article" },
      ],
      subtopics: [
        { name: "Design Metrics & Impact", description: "North star metrics, task success rate, SUS score, NPS, engagement metrics", difficulty: "intermediate", estimatedHours: 3, keyConcepts: ["SUS score", "Task completion rate", "NPS for design", "Engagement funnels"], whyItMatters: "Designers who speak metrics get promoted and hired over pure craftspeople" },
        { name: "Stakeholder Communication", description: "Design critiques, presenting to executives, handling pushback, documenting decisions", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["Design critique structure", "Executive presentation", "Decision documentation", "Handling scope creep"], whyItMatters: "Communication skills determine how much design impact actually ships" },
      ],
    },
    {
      topic: "Portfolio & Career Strategy",
      description: "Building a portfolio that gets callbacks and navigating design interviews.",
      estimatedHours: 10,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "Each case study must answer: What was the problem? What was your specific role? What did you decide and why? What was the result? If any of these are missing, the case study is incomplete.",
      resources: [
        { title: "Case Study Club", url: "https://www.casestudy.club", type: "article" },
        { title: "Design Interview Handbook", url: "https://www.designinterviewhandbook.com", type: "article" },
        { title: "Bestfolios Portfolio Inspiration", url: "https://www.bestfolios.com/casestudy", type: "article" },
      ],
      subtopics: [
        { name: "Case Study Structure", description: "Problem → Research → Define → Ideate → Prototype → Test → Ship → Impact", difficulty: "foundational", estimatedHours: 3, keyConcepts: ["Problem framing", "Process documentation", "Decision rationale", "Outcome metrics"], whyItMatters: "Portfolio case studies are 80% of the hiring decision for most design roles" },
        { name: "Design Challenge Interviews", description: "Timed design exercises, whiteboard design, product teardowns, design critique", difficulty: "advanced", estimatedHours: 4, keyConcepts: ["Problem clarification", "Thinking out loud", "Trade-off articulation", "Time boxing"], whyItMatters: "Most senior design interviews include a design challenge; preparation is essential" },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// MARKETING FALLBACK
// ─────────────────────────────────────────────────────────────────────────────
const MARKETING_FALLBACK = {
  meta: {
    label: "Digital Marketing & Growth",
    domain: "marketing",
    totalTopics: 6,
    totalSubtopics: 22,
    totalEstimatedHours: 70,
    targetAudience: "Marketing professionals targeting growth, digital marketing, or brand management roles",
    aiSummary: "Digital marketing is data-driven — learn analytics alongside channels. Build a personal project (blog, social account) to get real numbers for your portfolio.",
  },
  topics: [
    {
      topic: "Digital Marketing Fundamentals",
      description: "Core channels, funnel thinking, and measurement — the foundation of any marketing role.",
      estimatedHours: 12,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "Run a real $50 Google Ads or Meta Ads campaign — even a small budget teaches more than any course about channel mechanics.",
      resources: [
        { title: "Google Digital Garage (Free Certification)", url: "https://learndigital.withgoogle.com/digitalgarage", type: "course" },
        { title: "HubSpot Marketing Certification (Free)", url: "https://academy.hubspot.com", type: "course" },
        { title: "Marketing School Podcast (Neil Patel)", url: "https://www.marketingschool.io", type: "article" },
      ],
      subtopics: [
        { name: "Marketing Funnel & Customer Journey", description: "AIDA, TOFU/MOFU/BOFU, customer journey mapping, touchpoint analysis", difficulty: "foundational", estimatedHours: 3, keyConcepts: ["AIDA model", "Funnel stages", "Customer journey map", "Touchpoints"], whyItMatters: "Every marketing interview asks how you think about the full funnel" },
        { name: "Digital Channels Overview", description: "SEO, SEM, social media, email, content, affiliate — when to use each", difficulty: "foundational", estimatedHours: 3, keyConcepts: ["Owned vs paid vs earned", "Channel attribution", "CAC by channel", "Omnichannel strategy"], whyItMatters: "Channel strategy is the first question in any senior marketing interview" },
        { name: "Marketing Analytics & KPIs", description: "CTR, CPL, CAC, LTV, ROAS, MER — building dashboards and reporting", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["CAC calculation", "LTV:CAC ratio", "Attribution models", "ROAS vs ROI"], whyItMatters: "Data-driven marketing is the industry standard; weak analytics = weak candidacy" },
      ],
    },
    {
      topic: "SEO & Content Marketing",
      description: "Organic growth through search engine optimization and content strategy.",
      estimatedHours: 12,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Start a blog on any topic you know well. Real SEO experience from ranking even one article teaches keyword research, on-page SEO, and link building better than any course.",
      resources: [
        { title: "Ahrefs SEO Blog (Free)", url: "https://ahrefs.com/blog", type: "article" },
        { title: "Moz Beginner's Guide to SEO", url: "https://moz.com/beginners-guide-to-seo", type: "article" },
        { title: "Google Search Console Training", url: "https://search.google.com/search-console/about", type: "docs" },
      ],
      subtopics: [
        { name: "Keyword Research & On-Page SEO", description: "Search intent, keyword difficulty, title tags, meta descriptions, content optimization", difficulty: "foundational", estimatedHours: 3, keyConcepts: ["Search intent types", "Keyword difficulty", "Title tag optimization", "Internal linking"], whyItMatters: "SEO is the highest ROI channel for many businesses; content roles require deep SEO knowledge" },
        { name: "Technical SEO", description: "Site speed, Core Web Vitals, crawlability, schema markup, mobile optimization", difficulty: "intermediate", estimatedHours: 3, keyConcepts: ["Core Web Vitals", "Crawl budget", "Schema markup", "Mobile-first indexing"], whyItMatters: "Technical SEO differentiates content marketers from growth marketers" },
        { name: "Content Strategy", description: "Content calendar, pillar-cluster model, repurposing, editorial workflows", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["Pillar-cluster model", "Content calendar", "Repurposing strategy", "Editorial brief"], whyItMatters: "Content strategy is required for head of content and growth roles" },
      ],
    },
    {
      topic: "Paid Advertising (SEM & Social)",
      description: "Google Ads, Meta Ads, and performance marketing — the fastest growth lever.",
      estimatedHours: 12,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Get Google Ads and Meta Blueprint certifications — they're free, recognized by employers, and force you to learn the platforms systematically.",
      resources: [
        { title: "Google Ads Certification (Free)", url: "https://skillshop.withgoogle.com", type: "course" },
        { title: "Meta Blueprint (Free)", url: "https://www.facebook.com/business/learn", type: "course" },
        { title: "PPC Hero Blog", url: "https://www.ppchero.com", type: "article" },
      ],
      subtopics: [
        { name: "Google Ads (Search & Display)", description: "Campaign structure, Quality Score, bidding strategies, ad extensions, ROAS optimization", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["Quality Score", "Bidding strategies", "Ad extensions", "Campaign structure"], whyItMatters: "Google Ads drives majority of B2B and B2C paid traffic; core skill for performance marketers" },
        { name: "Meta Ads & Social Paid", description: "Audience targeting (custom/lookalike), creative testing, pixel setup, retargeting", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["Custom audiences", "Lookalike audiences", "Creative testing", "Meta Pixel"], whyItMatters: "Meta Ads is the primary channel for DTC and ecommerce growth" },
        { name: "Attribution & Budget Allocation", description: "First-touch, last-touch, data-driven attribution, budget allocation frameworks, incrementality", difficulty: "advanced", estimatedHours: 4, keyConcepts: ["Attribution models", "Incrementality testing", "Budget allocation", "Marketing mix modelling"], whyItMatters: "Attribution is where senior performance marketers prove their value to CFOs" },
      ],
    },
    {
      topic: "Brand Management",
      description: "Brand positioning, messaging, identity, and management across channels.",
      estimatedHours: 10,
      interviewFrequency: "medium",
      prerequisites: [],
      studyTip: "Do a brand audit of a company you admire — analyze their positioning, messaging hierarchy, and visual identity consistency. Present it as a portfolio piece.",
      resources: [
        { title: "Marty Neumeier — The Brand Gap (Free PDF)", url: "https://www.aiga.org/resources/the-brand-gap", type: "article" },
        { title: "Brand Strategy Insider", url: "https://www.brandingstrategyinsider.com", type: "article" },
        { title: "Coursera Brand Management Course", url: "https://www.coursera.org/learn/brand-management", type: "course" },
      ],
      subtopics: [
        { name: "Brand Strategy & Positioning", description: "Brand purpose, positioning statement, competitive differentiation, brand architecture", difficulty: "foundational", estimatedHours: 3, keyConcepts: ["Positioning statement", "Brand purpose", "Competitive differentiation", "Brand architecture"], whyItMatters: "Brand strategy is the foundation of all marketing communications" },
        { name: "Brand Identity & Voice", description: "Visual identity system, tone of voice guidelines, messaging hierarchy, brand guidelines", difficulty: "intermediate", estimatedHours: 3, keyConcepts: ["Brand guidelines", "Tone of voice", "Messaging hierarchy", "Visual identity"], whyItMatters: "Brand consistency drives trust; brand managers are responsible for this across all touchpoints" },
      ],
    },
    {
      topic: "Email & CRM Marketing",
      description: "Email campaigns, automation, customer lifecycle management, and retention.",
      estimatedHours: 8,
      interviewFrequency: "medium",
      prerequisites: [],
      studyTip: "Set up a real email automation flow (welcome series, abandonment, re-engagement) in Mailchimp or Klaviyo — even for a side project. Practical experience beats theory.",
      resources: [
        { title: "Klaviyo Email Marketing Blog", url: "https://www.klaviyo.com/blog", type: "article" },
        { title: "Really Good Emails (Examples)", url: "https://reallygoodemails.com", type: "article" },
        { title: "HubSpot Email Marketing Course", url: "https://academy.hubspot.com/courses/email-marketing", type: "course" },
      ],
      subtopics: [
        { name: "Email Campaign Strategy", description: "List segmentation, send time optimization, A/B testing, deliverability, unsubscribe management", difficulty: "foundational", estimatedHours: 3, keyConcepts: ["List segmentation", "Deliverability", "A/B testing emails", "Open rate optimization"], whyItMatters: "Email has highest ROI of all channels; every marketing role requires email proficiency" },
        { name: "Marketing Automation & Flows", description: "Welcome series, drip campaigns, triggered flows, lead nurturing, lifecycle emails", difficulty: "intermediate", estimatedHours: 3, keyConcepts: ["Trigger-based automation", "Drip campaign", "Lead scoring", "Lifecycle stages"], whyItMatters: "Automation is what scales email from a campaign tool to a revenue machine" },
      ],
    },
    {
      topic: "Growth Marketing & Experimentation",
      description: "Growth hacking, A/B testing, funnel optimization, and viral loops.",
      estimatedHours: 10,
      interviewFrequency: "high",
      prerequisites: ["Digital Marketing Fundamentals"],
      studyTip: "Document every growth experiment you run with a hypothesis, test design, result, and learnings. A portfolio of 10-15 real experiments is a powerful interview asset.",
      resources: [
        { title: "Reforge Growth Series", url: "https://www.reforge.com/growth-series", type: "course" },
        { title: "GrowthHackers Community", url: "https://growthhackers.com", type: "article" },
        { title: "Sean Ellis — Hacking Growth (Summary)", url: "https://www.amazon.com/Hacking-Growth-Fastest-Growing-Companies/dp/045149721X", type: "article" },
      ],
      subtopics: [
        { name: "A/B Testing & CRO", description: "Hypothesis formation, test design, statistical significance, conversion rate optimization", difficulty: "intermediate", estimatedHours: 3, keyConcepts: ["Hypothesis structure", "Statistical significance", "Sample size", "Test velocity"], whyItMatters: "Growth roles are defined by experimentation velocity and rigour" },
        { name: "Funnel Optimization", description: "Identifying drop-off points, friction reduction, landing page optimization, onboarding improvement", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["Funnel analysis", "Friction audit", "Onboarding optimization", "Activation metrics"], whyItMatters: "Funnel optimization has the highest leverage of any growth activity" },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// FINANCE FALLBACK
// ─────────────────────────────────────────────────────────────────────────────
const FINANCE_FALLBACK = {
  meta: {
    label: "Finance — Investment Banking / FP&A / CFA",
    domain: "finance",
    totalTopics: 6,
    totalSubtopics: 22,
    totalEstimatedHours: 90,
    targetAudience: "Finance professionals targeting IB, FP&A, corporate finance, or CFA roles",
    aiSummary: "Financial modelling and valuation are tested in every finance interview. Build 3-way models from scratch until you can do it without a template. Excel speed matters.",
  },
  topics: [
    {
      topic: "Financial Statements & Accounting",
      description: "Reading and analyzing income statements, balance sheets, and cash flow statements.",
      estimatedHours: 15,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "Take Apple's 10-K and rebuild all 3 statements in Excel from scratch. Real company statements teach nuances that textbook examples miss.",
      resources: [
        { title: "Accounting Coach (Free)", url: "https://www.accountingcoach.com", type: "article" },
        { title: "WSP Financial Modeling Fundamentals (Free)", url: "https://www.wallstreetprep.com/knowledge/", type: "article" },
        { title: "CFA Institute Learning Ecosystem", url: "https://www.cfainstitute.org", type: "course" },
      ],
      subtopics: [
        { name: "Income Statement Analysis", description: "Revenue recognition, COGS, gross margin, EBITDA, EPS, non-recurring items", difficulty: "foundational", estimatedHours: 3, keyConcepts: ["Revenue recognition", "EBITDA bridge", "Gross margin drivers", "Non-recurring items"], whyItMatters: "Every finance interview starts here; 3-statement understanding is baseline" },
        { name: "Balance Sheet & Working Capital", description: "Assets/liabilities, NWC calculation, days outstanding (DSO, DIO, DPO), debt structure", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["Working capital formula", "DSO/DIO/DPO", "Debt covenants", "Capital structure"], whyItMatters: "Working capital management is core to corporate finance and FP&A roles" },
        { name: "Cash Flow Statement", description: "Direct vs indirect method, FCF calculation, capex intensity, OCF vs FCF", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["Direct vs indirect method", "FCF formula", "Capex vs opex", "Cash conversion cycle"], whyItMatters: "Cash flow is the most important statement in IB valuation; heavily tested" },
      ],
    },
    {
      topic: "Valuation",
      description: "DCF, comparable company analysis, precedent transactions — the core of investment banking.",
      estimatedHours: 20,
      interviewFrequency: "very_high",
      prerequisites: ["Financial Statements & Accounting"],
      studyTip: "Value a real company using all 3 methods (DCF, comps, precedents) and explain why the values differ. This is the most common IB interview exercise.",
      resources: [
        { title: "Damodaran Online — Valuation", url: "https://pages.stern.nyu.edu/~adamodar/", type: "article" },
        { title: "Wall Street Oasis Valuation Guide", url: "https://www.wallstreetoasis.com/resources/skills/finance/valuation-methods", type: "article" },
        { title: "Macabacus Financial Modeling", url: "https://macabacus.com/learn", type: "course" },
      ],
      subtopics: [
        { name: "DCF Modelling", description: "WACC, terminal value (perpetuity vs exit multiple), sensitivity analysis, FCFF vs FCFE", difficulty: "intermediate", estimatedHours: 6, keyConcepts: ["WACC calculation", "Terminal value methods", "DCF sensitivity table", "FCFF vs FCFE"], whyItMatters: "DCF is the gold standard valuation; every IB, PE, and corporate finance interview tests it" },
        { name: "Comparable Company Analysis", description: "Selecting comps, EV/EBITDA, P/E, EV/Revenue multiples, spread and benchmarking", difficulty: "intermediate", estimatedHours: 5, keyConcepts: ["Comparable selection criteria", "EV vs Equity value", "EV/EBITDA", "Multiple expansion/compression"], whyItMatters: "Trading comps are the most commonly used valuation in real deals" },
        { name: "LBO Modelling", description: "Entry/exit assumptions, debt structuring, IRR calculation, returns waterfall", difficulty: "advanced", estimatedHours: 6, keyConcepts: ["Entry multiple", "Debt stack", "IRR calculation", "Returns waterfall"], whyItMatters: "LBO modelling is required for all PE interviews; differentiates candidates" },
      ],
    },
    {
      topic: "Financial Modelling in Excel",
      description: "3-statement integrated model, scenario analysis, and Excel best practices.",
      estimatedHours: 18,
      interviewFrequency: "very_high",
      prerequisites: ["Financial Statements & Accounting"],
      studyTip: "Never use a mouse for financial modelling. Learn every Excel shortcut until your fingers move automatically. Speed is directly evaluated in modelling tests.",
      resources: [
        { title: "CFI Financial Modeling Course (Free)", url: "https://corporatefinanceinstitute.com/course/free-excel-crash-course/", type: "course" },
        { title: "Breaking Into Wall Street", url: "https://breakingintowallstreet.com", type: "course" },
        { title: "Excel Campus Financial Modelling", url: "https://www.excelcampus.com", type: "article" },
      ],
      subtopics: [
        { name: "3-Statement Integration", description: "Linking IS, BS, CFS — circular references, balancing checks, revolver mechanics", difficulty: "intermediate", estimatedHours: 6, keyConcepts: ["IS-BS-CFS links", "Revolver mechanics", "Balancing check", "Circular reference handling"], whyItMatters: "3-statement model is the foundation of all financial models; tested in IB and PE" },
        { name: "Excel Efficiency for Finance", description: "Keyboard shortcuts, INDEX/MATCH, OFFSET, SUMIFS, dynamic ranges, model auditing", difficulty: "foundational", estimatedHours: 4, keyConcepts: ["INDEX/MATCH", "SUMIFS", "Model auditing shortcuts", "Dynamic named ranges"], whyItMatters: "Model tests in IB/PE interviews are timed; Excel speed directly determines pass/fail" },
        { name: "Scenario & Sensitivity Analysis", description: "Data tables, scenario manager, tornado charts, Monte Carlo basics", difficulty: "advanced", estimatedHours: 5, keyConcepts: ["2-way data table", "Scenario manager", "Tornado chart", "Key assumption sensitivity"], whyItMatters: "Scenario analysis is required for all real model deliverables and interview cases" },
      ],
    },
    {
      topic: "Corporate Finance Theory",
      description: "Capital structure, cost of capital, dividend policy, M&A fundamentals.",
      estimatedHours: 12,
      interviewFrequency: "high",
      prerequisites: ["Valuation"],
      studyTip: "For every theory (MM theorem, CAPM, APT), understand the real-world violation of its assumptions. That's where the interesting interview questions come from.",
      resources: [
        { title: "Brealey & Myers Principles of Corporate Finance (Key Chapters)", url: "https://www.amazon.in/s?k=brealey+myers+corporate+finance", type: "article" },
        { title: "Damodaran Corporate Finance (Free Lectures)", url: "https://www.youtube.com/@AswathDamodaran", type: "video" },
        { title: "Investopedia Corporate Finance", url: "https://www.investopedia.com/corporate-finance-4689819", type: "article" },
      ],
      subtopics: [
        { name: "Capital Structure & WACC", description: "Modigliani-Miller, optimal leverage, tax shield, financial distress costs, WACC drivers", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["MM theorem", "Tax shield", "Financial distress", "Optimal capital structure"], whyItMatters: "Capital structure questions are IB interview staples; every analyst must know MM" },
        { name: "CAPM & Cost of Equity", description: "Beta calculation, equity risk premium, risk-free rate selection, unlevering/relevering beta", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["Beta levering", "Equity risk premium", "Risk-free rate", "CAPM limitations"], whyItMatters: "Cost of equity is an input to every valuation; CAPM derivation is an interview classic" },
        { name: "M&A Deal Mechanics", description: "Accretion/dilution, synergies, deal structuring (stock vs cash), merger models", difficulty: "advanced", estimatedHours: 4, keyConcepts: ["Accretion/dilution test", "Synergy types", "Exchange ratio", "EPS impact"], whyItMatters: "M&A is core IB work; deal mechanics questions appear in every IB interview" },
      ],
    },
    {
      topic: "FP&A & Management Accounting",
      description: "Budgeting, forecasting, variance analysis, and management reporting for corporate finance roles.",
      estimatedHours: 12,
      interviewFrequency: "high",
      prerequisites: ["Financial Statements & Accounting"],
      studyTip: "Build a full annual budget model with monthly P&L, headcount plan, and variance analysis. FP&A roles test this directly in interviews.",
      resources: [
        { title: "CFI FP&A Course", url: "https://corporatefinanceinstitute.com/resources/fp-and-a/", type: "article" },
        { title: "FP&A Trends", url: "https://fpandatrends.com", type: "article" },
        { title: "Adaptive Insights FP&A Guide", url: "https://www.workday.com/en-us/applications/adaptive-planning.html", type: "article" },
      ],
      subtopics: [
        { name: "Budgeting & Forecasting", description: "Zero-based vs incremental budgeting, rolling forecasts, driver-based models", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["Zero-based budget", "Rolling forecast", "Driver-based model", "Budget vs actuals"], whyItMatters: "Budgeting is the core deliverable of FP&A; every FP&A interview tests this" },
        { name: "Variance Analysis", description: "Price vs volume variance, mix variance, actual vs budget bridges, waterfall charts", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["Price vs volume variance", "Mix variance", "Bridge analysis", "Waterfall chart"], whyItMatters: "Monthly variance analysis is a core FP&A deliverable and interview exercise" },
      ],
    },
    {
      topic: "CFA Level 1 Concepts",
      description: "Ethics, equity, fixed income, derivatives, and portfolio management — CFA Level 1 foundation.",
      estimatedHours: 20,
      interviewFrequency: "medium",
      prerequisites: [],
      studyTip: "CFA requires 300+ hours of study. Use the Kaplan or Bloomberg Prep practice question bank — the curriculum alone is not enough without extensive Q&A practice.",
      resources: [
        { title: "CFA Institute Official Curriculum", url: "https://www.cfainstitute.org/learning/products/publications/cfa", type: "docs" },
        { title: "Salt Solutions CFA Free Practice", url: "https://www.saltsolutions.com/cfa-level-1-practice-questions/", type: "course" },
        { title: "Mark Meldrum CFA (YouTube)", url: "https://www.youtube.com/@MarkMeldrum", type: "video" },
      ],
      subtopics: [
        { name: "Equity Valuation (CFA)", description: "DDM, Gordon Growth Model, P/E decomposition, residual income, industry analysis", difficulty: "intermediate", estimatedHours: 5, keyConcepts: ["Gordon Growth Model", "Justified P/E", "Residual income", "Industry life cycle"], whyItMatters: "Equity is 15% of CFA Level 1; directly applicable to buy-side and sell-side roles" },
        { name: "Fixed Income", description: "Bond pricing, yield measures, duration, convexity, term structure, credit analysis", difficulty: "intermediate", estimatedHours: 5, keyConcepts: ["Modified duration", "Convexity", "Yield to maturity", "Credit spread"], whyItMatters: "Fixed income is 12% of CFA; essential for asset management and treasury roles" },
        { name: "Portfolio Management & Ethics", description: "Modern Portfolio Theory, CAPM, efficient frontier, CFA ethics (Standards I-VII)", difficulty: "advanced", estimatedHours: 6, keyConcepts: ["Efficient frontier", "Sharpe ratio", "CFA Standards I-VII", "Fiduciary duty"], whyItMatters: "Ethics is 15% of CFA exam weight and tested with zero tolerance for wrong answers" },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// HR FALLBACK
// ─────────────────────────────────────────────────────────────────────────────
const HR_FALLBACK = {
  meta: {
    label: "Human Resources — HRBP & Talent Management",
    domain: "hr",
    totalTopics: 6,
    totalSubtopics: 20,
    totalEstimatedHours: 60,
    targetAudience: "HR professionals targeting HRBP, TA, L&D, or HR Operations roles",
    aiSummary: "HR is becoming more data-driven — People Analytics is the fastest growing skill gap. Pair your people skills with Excel/data fluency to stand out in competitive HR markets.",
  },
  topics: [
    {
      topic: "Talent Acquisition",
      description: "End-to-end recruitment — sourcing, assessment, candidate experience, and employer branding.",
      estimatedHours: 12,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "Track your own time-to-fill, offer acceptance rate, and quality of hire for every role you recruit. Data on your own recruiting performance is your best interview asset.",
      resources: [
        { title: "LinkedIn Talent Blog", url: "https://business.linkedin.com/talent-solutions/blog", type: "article" },
        { title: "SHRM Talent Acquisition Guide", url: "https://www.shrm.org/resourcesandtools/tools-and-samples/toolkits/pages/acquiringandretainingtalent.aspx", type: "article" },
        { title: "Greenhouse Recruiting Blog", url: "https://www.greenhouse.io/blog", type: "article" },
      ],
      subtopics: [
        { name: "Sourcing & Pipelining", description: "Boolean search, LinkedIn Recruiter, GitHub/Behance sourcing, passive candidate engagement", difficulty: "foundational", estimatedHours: 3, keyConcepts: ["Boolean operators", "LinkedIn InMail strategy", "Passive vs active", "Talent pipeline"], whyItMatters: "Sourcing is the highest-leverage TA skill; most companies have 70%+ passive talent" },
        { name: "Structured Interviews & Assessment", description: "Competency-based questions, scoring rubrics, panel calibration, assessment centres", difficulty: "intermediate", estimatedHours: 3, keyConcepts: ["STAR-based assessment", "Scoring rubric", "Panel calibration", "Adverse impact"], whyItMatters: "Structured interviews predict performance 2x better than unstructured; reducing bias is a business imperative" },
        { name: "Employer Branding & EVP", description: "Employee value proposition, candidate experience, Glassdoor management, careers page", difficulty: "intermediate", estimatedHours: 3, keyConcepts: ["EVP pillars", "Candidate NPS", "Glassdoor response strategy", "Careers page conversion"], whyItMatters: "Companies with strong employer brands hire at 50% lower CPH; TA leaders own this" },
      ],
    },
    {
      topic: "HR Business Partnering (HRBP)",
      description: "Strategic HR — aligning people strategy with business goals, org design, and change management.",
      estimatedHours: 12,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "For every HR initiative you've worked on, be able to articulate the business problem it solved and the metric it moved. HRBP interviews are business conversations, not HR policy conversations.",
      resources: [
        { title: "Dave Ulrich HR Model", url: "https://rbl.net/daveulrich", type: "article" },
        { title: "Chartered Institute of Personnel and Development (CIPD)", url: "https://www.cipd.org/uk/knowledge/", type: "article" },
        { title: "SHRM HRBP Content", url: "https://www.shrm.org/topics-tools/topics/hr-business-partner", type: "article" },
      ],
      subtopics: [
        { name: "Business Acumen for HRBPs", description: "Reading P&L, understanding business models, linking headcount to revenue, stakeholder influence", difficulty: "intermediate", estimatedHours: 3, keyConcepts: ["P&L reading", "Revenue per employee", "Cost centre vs profit centre", "Business model canvas"], whyItMatters: "HRBPs who speak finance language earn far more credibility with business leaders" },
        { name: "Organizational Design", description: "Spans and layers, team structures, RACI, role clarity, restructuring principles", difficulty: "advanced", estimatedHours: 4, keyConcepts: ["Span of control", "Hierarchical vs flat structure", "RACI matrix", "Role clarity frameworks"], whyItMatters: "Org design is the highest-impact HRBP intervention; directly affects execution speed" },
        { name: "Change Management", description: "ADKAR, Kotter 8-step, stakeholder mapping, communication planning, resistance management", difficulty: "intermediate", estimatedHours: 3, keyConcepts: ["ADKAR model", "Kotter 8-step", "Stakeholder heat map", "Change resistance types"], whyItMatters: "Every major business change requires HR change management; failure rate without it is 70%" },
      ],
    },
    {
      topic: "Compensation & Benefits",
      description: "Salary benchmarking, incentive design, benefits strategy, and total rewards.",
      estimatedHours: 10,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Run a compensation benchmarking exercise using Radford or Mercer survey data for one job family. Understanding how surveys work is a rare skill that immediately adds value.",
      resources: [
        { title: "WorldatWork Total Rewards", url: "https://worldatwork.org", type: "article" },
        { title: "Radford Compensation Surveys", url: "https://radford.aon.com", type: "article" },
        { title: "SHRM Compensation & Benefits", url: "https://www.shrm.org/topics-tools/topics/compensation", type: "article" },
      ],
      subtopics: [
        { name: "Salary Benchmarking", description: "Market survey methodology, job levelling, pay positioning (P50/P75), pay equity analysis", difficulty: "intermediate", estimatedHours: 3, keyConcepts: ["Market survey methodology", "Job levelling", "Pay percentile", "Pay equity analysis"], whyItMatters: "C&B is its own HR career track; pay equity is a board-level risk in every company" },
        { name: "Incentive & Bonus Design", description: "STI vs LTI, OKR-linked bonuses, sales incentive plans (SIP), ESOP structure", difficulty: "advanced", estimatedHours: 4, keyConcepts: ["STI vs LTI", "Target bonus %", "Sales incentive plan", "Cliff vs graded vesting"], whyItMatters: "Incentive design directly drives employee behaviour and business outcomes" },
      ],
    },
    {
      topic: "Learning & Development (L&D)",
      description: "Training needs analysis, program design, e-learning, and ROI measurement.",
      estimatedHours: 8,
      interviewFrequency: "medium",
      prerequisites: [],
      studyTip: "Apply the Kirkpatrick 4-level model to every training program you design. If you can't measure Level 3 (behaviour change) or Level 4 (results), the program won't get executive buy-in.",
      resources: [
        { title: "ATD (Association for Talent Development)", url: "https://www.td.org/talent-development-body-of-knowledge", type: "article" },
        { title: "Kirkpatrick Model Guide", url: "https://www.kirkpatrickpartners.com", type: "article" },
        { title: "LinkedIn Learning L&D Resources", url: "https://learning.linkedin.com/resources", type: "article" },
      ],
      subtopics: [
        { name: "Training Needs Analysis (TNA)", description: "Performance gap analysis, skill mapping, stakeholder interviews, prioritization", difficulty: "foundational", estimatedHours: 2, keyConcepts: ["Performance gap analysis", "Skill matrix", "70-20-10 model", "Business alignment"], whyItMatters: "TNA ensures L&D budget is spent on actual gaps, not perceived ones" },
        { name: "Learning Design & Delivery", description: "ADDIE model, blended learning, e-learning design (Articulate), facilitation skills", difficulty: "intermediate", estimatedHours: 3, keyConcepts: ["ADDIE model", "Blended learning", "Microlearning", "Spaced repetition"], whyItMatters: "L&D professionals must design learning that actually changes behaviour, not just awareness" },
      ],
    },
    {
      topic: "Employment Law & HR Compliance",
      description: "Labour law, disciplinary processes, grievance handling, and statutory compliance.",
      estimatedHours: 10,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Know the Industrial Disputes Act, POSH Act, and Shops & Establishments Act inside out for India. For global roles, know GDPR data implications for HR systems.",
      resources: [
        { title: "Ministry of Labour India — Acts", url: "https://labour.gov.in/acts", type: "docs" },
        { title: "POSH Act Compliance Guide", url: "https://www.poshatwork.com/blog", type: "article" },
        { title: "SHRM HR Legal Compliance", url: "https://www.shrm.org/topics-tools/topics/employment-law-compliance", type: "article" },
      ],
      subtopics: [
        { name: "Indian Labour Laws (Key Acts)", description: "Industrial Disputes Act, Factories Act, ESIC/PF compliance, Minimum Wages Act, POSH", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["Industrial Disputes Act", "POSH Act compliance", "PF/ESIC rates", "Retrenchment rules"], whyItMatters: "HR compliance failures create massive legal liability; every HR role requires this knowledge" },
        { name: "Disciplinary Process & Grievances", description: "Natural justice principles, show-cause notices, domestic enquiry, grievance redressal", difficulty: "intermediate", estimatedHours: 3, keyConcepts: ["Natural justice", "Show-cause notice", "Domestic enquiry procedure", "Grievance policy"], whyItMatters: "Disciplinary and grievance management is a core HRBP competency tested in interviews" },
      ],
    },
    {
      topic: "People Analytics",
      description: "HR metrics, dashboards, attrition modelling, and data-driven decision making in HR.",
      estimatedHours: 10,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Build an attrition prediction model using basic Excel or Python on any HR dataset (Kaggle has several). Even a simple model demonstrates analytical thinking that most HR professionals lack.",
      resources: [
        { title: "Visier People Analytics Blog", url: "https://www.visier.com/blog/", type: "article" },
        { title: "AIHR People Analytics Course (Free Trial)", url: "https://www.aihr.com/blog/people-analytics/", type: "course" },
        { title: "Predictive HR Analytics (Book)", url: "https://www.amazon.in/s?k=predictive+hr+analytics", type: "article" },
      ],
      subtopics: [
        { name: "HR Metrics & Dashboards", description: "Time-to-hire, attrition rate, engagement score, eNPS, absenteeism, revenue per employee", difficulty: "foundational", estimatedHours: 3, keyConcepts: ["Attrition rate formula", "eNPS calculation", "Time-to-hire", "Cost-per-hire"], whyItMatters: "HR leaders who present metrics to boards differentiate themselves from admin HR" },
        { name: "Attrition Analysis & Prediction", description: "Voluntary vs involuntary attrition, flight risk modelling, exit interview analytics, retention ROI", difficulty: "advanced", estimatedHours: 4, keyConcepts: ["Flight risk indicators", "Exit interview themes", "Survival analysis", "Retention intervention ROI"], whyItMatters: "Attrition costs 50-200% of salary; data-driven retention is the highest ROI HR project" },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSULTING FALLBACK
// ─────────────────────────────────────────────────────────────────────────────
const CONSULTING_FALLBACK = {
  meta: {
    label: "Management Consulting",
    domain: "consulting",
    totalTopics: 5,
    totalSubtopics: 18,
    totalEstimatedHours: 60,
    targetAudience: "MBA graduates and analysts targeting MBB or Big 4 consulting roles",
    aiSummary: "Case interview performance is binary — you either crack it or you don't. Practice 50+ cases with a partner before interviews. Structured thinking and clear communication are non-negotiable.",
  },
  topics: [
    {
      topic: "Case Interview Methodology",
      description: "Frameworks, case cracking, hypothesis-driven approach — the core consulting interview skill.",
      estimatedHours: 20,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "Do 2 live case practices with a partner every week. Solo prep is not sufficient — you need real-time feedback on your structure and communication.",
      resources: [
        { title: "Case In Point 11th Edition", url: "https://www.amazon.in/s?k=case+in+point+marc+cosentino", type: "article" },
        { title: "PrepLounge Case Interview Platform", url: "https://www.preplounge.com", type: "course" },
        { title: "Victor Cheng Case Interview (YouTube)", url: "https://www.youtube.com/@VictorChengCoach", type: "video" },
      ],
      subtopics: [
        { name: "Case Frameworks", description: "Profitability, market entry, M&A, pricing, org/ops — when and how to use frameworks", difficulty: "foundational", estimatedHours: 5, keyConcepts: ["Profitability framework", "Market sizing", "MECE structure", "Issue tree"], whyItMatters: "Frameworks are the scaffolding of every case; knowing when NOT to use them is equally important" },
        { name: "Hypothesis-Driven Problem Solving", description: "Forming and testing hypotheses, early hypothesis communication, synthesis", difficulty: "intermediate", estimatedHours: 5, keyConcepts: ["Initial hypothesis", "Hypothesis testing", "Early synthesis", "So what statement"], whyItMatters: "MBB specifically tests hypothesis-first thinking; descriptive analysis without hypothesis fails" },
        { name: "Math & Estimation in Cases", description: "Fermi estimation, mental math, market sizing from first principles, sanity checking", difficulty: "intermediate", estimatedHours: 5, keyConcepts: ["Fermi estimation", "Market sizing bottom-up", "Mental math shortcuts", "Order of magnitude sanity check"], whyItMatters: "Every case includes quantitative analysis; slow or inaccurate math is disqualifying" },
        { name: "Case Communication", description: "Structuring opening, signposting, asking clarifying questions, presenting recommendation", difficulty: "intermediate", estimatedHours: 5, keyConcepts: ["Clarifying questions", "Top-down communication", "Signposting", "Pyramid principle"], whyItMatters: "Communication is 50% of case scoring — a correct answer delivered poorly still fails" },
      ],
    },
    {
      topic: "Consulting Slide Communication",
      description: "Pyramid principle, SCR structure, MECE slide design, and executive communication.",
      estimatedHours: 12,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Rewrite 3 slides from any presentation you've made using the SCR (Situation-Complication-Resolution) structure. The improvement will be immediate and obvious.",
      resources: [
        { title: "The Pyramid Principle (Barbara Minto)", url: "https://www.amazon.in/s?k=pyramid+principle+minto", type: "article" },
        { title: "Slide:ology by Nancy Duarte", url: "https://www.duarte.com/books/slideology/", type: "article" },
        { title: "McKinsey Presentation Structure Guide", url: "https://www.mckinsey.com/business-functions/strategy-and-corporate-finance/our-insights", type: "article" },
      ],
      subtopics: [
        { name: "Pyramid Principle", description: "BLUF, top-down vs bottom-up, supporting arguments, SCR narrative", difficulty: "foundational", estimatedHours: 3, keyConcepts: ["BLUF structure", "SCR narrative", "Supporting arguments", "Horizontal vs vertical logic"], whyItMatters: "Pyramid principle is used in every MBB client deliverable; hired consultants must know it" },
        { name: "Slide Design for Consulting", description: "Ghost deck structure, executive summary slide, chart selection, annotation", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["Ghost deck", "Executive summary", "Chart selection rules", "Slide annotation"], whyItMatters: "Consulting slides communicate recommendations worth millions; quality signals judgment" },
      ],
    },
    {
      topic: "Financial Modelling for Consulting",
      description: "Business case development, financial modelling, and ROI calculations for client presentations.",
      estimatedHours: 12,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Build a business case model for a real scenario (new product launch, cost reduction programme). Present the NPV/IRR/payback in consulting slide format.",
      resources: [
        { title: "CFI Consulting Financial Modelling", url: "https://corporatefinanceinstitute.com/resources/financial-modeling/", type: "article" },
        { title: "McKinsey & Company Insights", url: "https://www.mckinsey.com/insights", type: "article" },
        { title: "Bain & Company Insights", url: "https://www.bain.com/insights/", type: "article" },
      ],
      subtopics: [
        { name: "Business Case Development", description: "Cost-benefit analysis, NPV calculation, sensitivity tables, payback period", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["Cost-benefit analysis", "NPV/IRR", "Payback period", "Sensitivity analysis"], whyItMatters: "Every consulting engagement requires a business case; clients fund recommendations, not ideas" },
        { name: "Benchmarking & Industry Analysis", description: "Competitor benchmarking, best-in-class comparisons, industry databases, KPI dashboards", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["Benchmarking methodology", "Best-in-class gap", "Industry databases", "KPI selection"], whyItMatters: "Consultants sell insights from benchmarking; it's a core analytical deliverable" },
      ],
    },
    {
      topic: "Industry Knowledge",
      description: "Key industries and business models — consumer, healthcare, financial services, technology.",
      estimatedHours: 8,
      interviewFrequency: "medium",
      prerequisites: [],
      studyTip: "Read 1 McKinsey, BCG, or Bain insight paper per day for 30 days. You'll rapidly develop cross-industry fluency that impresses interviewers.",
      resources: [
        { title: "McKinsey Insights", url: "https://www.mckinsey.com/insights", type: "article" },
        { title: "BCG Perspectives", url: "https://www.bcg.com/publications", type: "article" },
        { title: "HBR Case Studies", url: "https://hbr.org", type: "article" },
      ],
      subtopics: [
        { name: "Technology & Digital Transformation", description: "Cloud economics, AI adoption, digital operating models, platform business models", difficulty: "intermediate", estimatedHours: 3, keyConcepts: ["Cloud economics", "AI ROI", "Digital operating model", "Platform vs pipeline"], whyItMatters: "Technology transformation is the #1 consulting engagement type globally" },
        { name: "Consumer & Retail", description: "Consumer behaviour shifts, e-commerce, omnichannel strategy, private label, direct-to-consumer", difficulty: "intermediate", estimatedHours: 3, keyConcepts: ["Omnichannel strategy", "DTC economics", "Category management", "Consumer segmentation"], whyItMatters: "Consumer is the largest consulting practice at most firms" },
      ],
    },
    {
      topic: "Client & Stakeholder Management",
      description: "Managing client relationships, difficult conversations, and delivering recommendations.",
      estimatedHours: 8,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Read 'The Trusted Advisor' — the relationship model it describes is exactly what MBB partners use and expect juniors to learn quickly.",
      resources: [
        { title: "The Trusted Advisor (Book Summary)", url: "https://trustedadvisor.com/books/the-trusted-advisor", type: "article" },
        { title: "Consulting Case Interviews — Exponent", url: "https://www.tryexponent.com/consulting", type: "course" },
        { title: "MConsulting Prep Blog", url: "https://mconsultingprep.com/blog/", type: "article" },
      ],
      subtopics: [
        { name: "Stakeholder Communication & Buy-In", description: "Tailoring messages by audience level, managing resistance, pre-wiring recommendations", difficulty: "intermediate", estimatedHours: 3, keyConcepts: ["Pre-wiring", "Resistance management", "Executive communication", "Storyline testing"], whyItMatters: "Recommendations that don't get implemented deliver zero value; client buy-in is everything" },
        { name: "Project & Workstream Management", description: "Work planning, hypothesis tracking, team coordination, client update cadence", difficulty: "intermediate", estimatedHours: 3, keyConcepts: ["Work plan structure", "Hypothesis board", "Weekly status update", "Issue escalation"], whyItMatters: "Junior consultants are judged heavily on execution reliability and deadline management" },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SALES FALLBACK
// ─────────────────────────────────────────────────────────────────────────────
const SALES_FALLBACK = {
  meta: {
    label: "Sales — B2B Enterprise & SaaS Sales",
    domain: "sales",
    totalTopics: 5,
    totalSubtopics: 18,
    totalEstimatedHours: 50,
    targetAudience: "Sales professionals targeting AE, SDR, or sales leadership roles at B2B companies",
    aiSummary: "Prospecting and pipeline discipline are what separate top 10% performers from average. Focus on discovery skill — the best discovery automatically leads to a compelling pitch.",
  },
  topics: [
    {
      topic: "Prospecting & Outbound",
      description: "Building pipeline through targeted outbound — ICP definition, sequencing, multi-channel outreach.",
      estimatedHours: 10,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "Write 20 personalised cold emails for a product you're selling. Get feedback on response rate. Real outbound experience beats theory in every sales interview.",
      resources: [
        { title: "Predictable Revenue (Aaron Ross)", url: "https://www.amazon.in/s?k=predictable+revenue+aaron+ross", type: "article" },
        { title: "SalesHacker Blog", url: "https://www.saleshacker.com", type: "article" },
        { title: "Outreach.io Sales Engagement Guide", url: "https://www.outreach.io/blog", type: "article" },
      ],
      subtopics: [
        { name: "ICP Definition & Account Targeting", description: "Ideal Customer Profile, TAM segmentation, signal-based targeting, account prioritisation", difficulty: "foundational", estimatedHours: 2, keyConcepts: ["ICP attributes", "Account scoring", "Buying signals", "TAM segmentation"], whyItMatters: "Prospecting the wrong accounts wastes 80% of sales time; ICP precision directly drives win rate" },
        { name: "Cold Outreach & Sequencing", description: "Cold email frameworks, LinkedIn outreach, call scripts, multi-touch sequences, personalisation at scale", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["AIDA email structure", "LinkedIn connection strategy", "Multi-touch sequence", "Personalisation at scale"], whyItMatters: "Pipeline generation is the #1 SDR metric; outreach skill directly determines quota attainment" },
      ],
    },
    {
      topic: "Discovery & Qualification",
      description: "Asking the right questions to understand pain, quantify impact, and qualify opportunities.",
      estimatedHours: 10,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "Record your discovery calls and listen back. Identify every time you talked more than the prospect. In great discovery, the prospect talks 70% of the time.",
      resources: [
        { title: "SPIN Selling (Rackham)", url: "https://www.amazon.in/s?k=spin+selling+rackham", type: "article" },
        { title: "Gong.io Sales Insights Blog", url: "https://www.gong.io/blog/", type: "article" },
        { title: "Sandler Sales Training", url: "https://www.sandler.com/blog/", type: "article" },
      ],
      subtopics: [
        { name: "SPIN & MEDDIC Qualification", description: "Situation/Problem/Implication/Need questions, MEDDIC (Metrics, Economic Buyer, Decision Criteria)", difficulty: "foundational", estimatedHours: 3, keyConcepts: ["SPIN questions", "MEDDIC framework", "Economic buyer", "Decision criteria mapping"], whyItMatters: "Unqualified opportunities waste everyone's time; qualification frameworks are directly tested in sales interviews" },
        { name: "Pain Discovery & Quantification", description: "Uncovering root business pain, quantifying cost of inaction, building urgency", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["Problem vs symptom", "Cost of inaction", "Quantified pain", "Urgency creation"], whyItMatters: "Deals without quantified pain rarely close; discovery is where deals are won or lost" },
      ],
    },
    {
      topic: "Demos & Presentations",
      description: "Solution selling through tailored demos, storytelling, and executive presentations.",
      estimatedHours: 8,
      interviewFrequency: "high",
      prerequisites: ["Discovery & Qualification"],
      studyTip: "Prepare your 3-minute, 10-minute, and 30-minute demo versions of any product. Interviewers sometimes ask you to 'sell me this product' on the spot.",
      resources: [
        { title: "Great Demo! (Peter Cohan)", url: "https://www.amazon.in/s?k=great+demo+peter+cohan", type: "article" },
        { title: "Pitch Anything (Oren Klaff)", url: "https://www.amazon.in/s?k=pitch+anything+oren+klaff", type: "article" },
        { title: "SaaS Demo Best Practices — Winning by Design", url: "https://winningbydesign.com/resources/", type: "article" },
      ],
      subtopics: [
        { name: "Tailored Demo Design", description: "Do It Last (DIL) method, problem-first demo, handling objections during demo", difficulty: "intermediate", estimatedHours: 3, keyConcepts: ["Problem-first structure", "Tailored use cases", "Objection handling in demo", "Call to action"], whyItMatters: "Generic demos lose deals; tailored demos win; AE interviews test demo structure" },
      ],
    },
    {
      topic: "Negotiation & Closing",
      description: "Multi-stakeholder negotiation, pricing negotiation, and deal closing techniques.",
      estimatedHours: 10,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Read 'Never Split the Difference' — Chris Voss's FBI negotiation tactics are directly applicable to enterprise sales and differentiate AEs who use them.",
      resources: [
        { title: "Never Split the Difference (Chris Voss)", url: "https://www.blackswanltd.com", type: "article" },
        { title: "Challenger Sale Research", url: "https://www.challengerinc.com", type: "article" },
        { title: "Close.io Sales Blog", url: "https://close.com/blog", type: "article" },
      ],
      subtopics: [
        { name: "Multi-Stakeholder Consensus", description: "Champion development, building coalitions, managing blockers, procurement navigation", difficulty: "advanced", estimatedHours: 3, keyConcepts: ["Champion vs sponsor", "Coalition building", "Procurement process", "Legal red lines"], whyItMatters: "Enterprise deals rarely have a single buyer; multi-threading determines win rate" },
        { name: "Pricing Negotiation", description: "Anchoring, discounting discipline, value justification, concession strategy", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["Anchoring high", "Discounting framework", "Value ROI justification", "Concession sequencing"], whyItMatters: "Discounting discipline directly impacts gross margin; interviewers probe pricing judgment" },
      ],
    },
    {
      topic: "CRM & Sales Operations",
      description: "Pipeline management, Salesforce/CRM hygiene, forecasting, and sales process discipline.",
      estimatedHours: 8,
      interviewFrequency: "medium",
      prerequisites: [],
      studyTip: "Keep your CRM up-to-date with full close plans for every stage 3+ deal. Managers evaluate AEs heavily on CRM hygiene and forecast accuracy.",
      resources: [
        { title: "Salesforce Trailhead (Free)", url: "https://trailhead.salesforce.com", type: "course" },
        { title: "Clari Revenue Operations Blog", url: "https://www.clari.com/blog/", type: "article" },
        { title: "SalesHacker Sales Operations Guide", url: "https://www.saleshacker.com/sales-operations/", type: "article" },
      ],
      subtopics: [
        { name: "Pipeline Management & Forecasting", description: "Stage definitions, pipeline coverage ratios, forecast categories, CRM hygiene", difficulty: "intermediate", estimatedHours: 3, keyConcepts: ["Pipeline coverage ratio", "Forecast categories", "Stage exit criteria", "CRM hygiene"], whyItMatters: "Forecast accuracy builds manager trust; pipeline management determines whether you miss or hit quota" },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// OPERATIONS FALLBACK
// ─────────────────────────────────────────────────────────────────────────────
const OPERATIONS_FALLBACK = {
  meta: {
    label: "Operations & Supply Chain Management",
    domain: "operations",
    totalTopics: 5,
    totalSubtopics: 18,
    totalEstimatedHours: 70,
    targetAudience: "Operations professionals targeting supply chain, process improvement, or operations management roles",
    aiSummary: "Lean Six Sigma certifications signal process improvement credibility. Pair operational knowledge with data skills — Excel pivot tables and Power BI are now baseline expectations.",
  },
  topics: [
    {
      topic: "Supply Chain Management",
      description: "End-to-end supply chain — procurement, inventory, logistics, and supplier management.",
      estimatedHours: 18,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "Map the supply chain of a product you use daily from raw material to your hands. Understanding real supply chain complexity is what interviews test.",
      resources: [
        { title: "MIT OpenCourseWare Supply Chain", url: "https://ocw.mit.edu/courses/15-769-operations-strategy-fall-2010/", type: "course" },
        { title: "Supply Chain 24/7", url: "https://www.supplychain247.com", type: "article" },
        { title: "APICS CPIM Study Materials", url: "https://www.ascm.org/cpim", type: "course" },
      ],
      subtopics: [
        { name: "Procurement & Vendor Management", description: "RFP/RFQ process, vendor selection, SLA management, supplier risk, category management", difficulty: "foundational", estimatedHours: 4, keyConcepts: ["RFP process", "Total cost of ownership", "Vendor scorecard", "Category management"], whyItMatters: "Procurement decisions affect 50-80% of cost structure; every ops interview covers this" },
        { name: "Inventory Management", description: "EOQ, safety stock, ABC analysis, demand forecasting, inventory turnover", difficulty: "intermediate", estimatedHours: 5, keyConcepts: ["EOQ formula", "Safety stock calculation", "ABC analysis", "Inventory turnover ratio"], whyItMatters: "Inventory is working capital trapped in goods; optimization directly impacts cash flow" },
        { name: "Logistics & Distribution", description: "3PL/4PL models, last-mile delivery, warehouse management, freight modes", difficulty: "intermediate", estimatedHours: 5, keyConcepts: ["3PL vs 4PL", "Last-mile economics", "Warehouse slotting", "Freight mode selection"], whyItMatters: "Logistics is 10-15% of revenue for most companies; efficiency gains are highly visible" },
      ],
    },
    {
      topic: "Process Improvement (Lean & Six Sigma)",
      description: "DMAIC, value stream mapping, waste elimination, and statistical process control.",
      estimatedHours: 15,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "Get at least Lean Six Sigma Green Belt certified — it takes 2-3 months and signals serious process improvement commitment to employers.",
      resources: [
        { title: "ASQ Six Sigma Learning", url: "https://asq.org/cert/six-sigma-green-belt", type: "course" },
        { title: "iSixSigma Tools & Templates", url: "https://www.isixsigma.com/tools-templates/", type: "article" },
        { title: "Lean Enterprise Institute", url: "https://www.lean.org", type: "article" },
      ],
      subtopics: [
        { name: "DMAIC Methodology", description: "Define, Measure, Analyze, Improve, Control — applying to real process problems", difficulty: "foundational", estimatedHours: 4, keyConcepts: ["SIPOC diagram", "Process capability (Cpk)", "Fishbone diagram", "Control chart"], whyItMatters: "DMAIC is the structured problem-solving framework asked in every ops interview" },
        { name: "Lean & Waste Elimination", description: "7 wastes (TIMWOOD), value stream mapping, 5S, kaizen, poka-yoke", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["7 wastes (TIMWOOD)", "Value stream map", "5S methodology", "Poka-yoke"], whyItMatters: "Lean thinking is expected in manufacturing and service operations roles at senior levels" },
      ],
    },
    {
      topic: "Project Management",
      description: "PMP methodology, agile frameworks, and managing cross-functional operations projects.",
      estimatedHours: 12,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Get PMP or Prince2 certified if you manage projects regularly. For ops-adjacent agile teams, Scrum Master certification demonstrates delivery discipline.",
      resources: [
        { title: "PMI PMP Study Guide", url: "https://www.pmi.org/certifications/project-management-pmp", type: "course" },
        { title: "PM PrepCast", url: "https://www.project-management-prepcast.com", type: "course" },
        { title: "PMBOK Guide 7th Edition", url: "https://www.pmi.org/pmbok-guide-standards", type: "article" },
      ],
      subtopics: [
        { name: "Project Planning & Scheduling", description: "WBS, critical path method, Gantt charts, resource allocation, risk register", difficulty: "foundational", estimatedHours: 3, keyConcepts: ["WBS structure", "Critical path", "Resource levelling", "Risk register"], whyItMatters: "Project planning is the single most common ops management skill tested" },
        { name: "Stakeholder & Change Management", description: "RACI matrix, communication plan, change resistance, benefits realisation", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["RACI matrix", "Communication plan", "Change resistance", "Benefits tracker"], whyItMatters: "70% of projects fail due to people/change issues, not technical ones" },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// MECHANICAL ENGINEERING FALLBACK
// ─────────────────────────────────────────────────────────────────────────────
const MECHANICAL_FALLBACK = {
  meta: {
    label: "Mechanical Engineering",
    domain: "mechanical",
    totalTopics: 6,
    totalSubtopics: 24,
    totalEstimatedHours: 110,
    targetAudience: "Mechanical engineers targeting core engineering, manufacturing, or GATE/PSU roles",
    aiSummary: "Thermodynamics and Fluid Mechanics dominate GATE ME. For industry roles, AutoCAD/SolidWorks and manufacturing process knowledge are the most valued practical skills.",
  },
  topics: [
    {
      topic: "Thermodynamics",
      description: "Laws of thermodynamics, thermodynamic cycles, and heat transfer — GATE ME highest weightage.",
      estimatedHours: 25,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "Draw P-V and T-S diagrams for every thermodynamic cycle from memory. GATE repeatedly tests these with slight variations.",
      resources: [
        { title: "NPTEL Thermodynamics (IIT)", url: "https://nptel.ac.in/courses/101106047", type: "course" },
        { title: "Engineering Thermodynamics — Nag (Key Chapters)", url: "https://www.amazon.in/s?k=engineering+thermodynamics+nag", type: "article" },
        { title: "GATE ME Thermodynamics PYQs", url: "https://www.gatementor.com", type: "article" },
      ],
      subtopics: [
        { name: "Laws of Thermodynamics", description: "0th, 1st, 2nd, 3rd laws, entropy, enthalpy, availability/exergy", difficulty: "foundational", estimatedHours: 6, keyConcepts: ["First law statement", "Second law (Kelvin/Clausius)", "Entropy generation", "Exergy analysis"], whyItMatters: "Foundation for all thermodynamic analysis; GATE never skips this" },
        { name: "Thermodynamic Cycles", description: "Carnot, Rankine (steam power), Brayton (gas turbine), Otto (petrol), Diesel cycles", difficulty: "intermediate", estimatedHours: 8, keyConcepts: ["Rankine cycle efficiency", "Brayton regeneration", "Otto vs Diesel comparison", "Carnot COP"], whyItMatters: "8-12 GATE questions annually; entire power plant industry runs on these cycles" },
        { name: "Heat Transfer", description: "Conduction (Fourier), convection (Newton), radiation (Stefan-Boltzmann), heat exchangers", difficulty: "intermediate", estimatedHours: 8, keyConcepts: ["Thermal resistance", "Nusselt number", "LMTD method", "Stefan-Boltzmann law"], whyItMatters: "Heat transfer is GATE ME's 2nd highest weightage; applied in every thermal engineering role" },
      ],
    },
    {
      topic: "Fluid Mechanics",
      description: "Fluid statics, dynamics, boundary layer theory, and turbomachinery.",
      estimatedHours: 20,
      interviewFrequency: "very_high",
      prerequisites: ["Thermodynamics"],
      studyTip: "Solve fluid problems by drawing a clear control volume first. Most GATE errors come from poorly defined control volumes and sign convention mistakes.",
      resources: [
        { title: "NPTEL Fluid Mechanics (IIT Kharagpur)", url: "https://nptel.ac.in/courses/101105060", type: "course" },
        { title: "Fluid Mechanics — White (Indian Edition)", url: "https://www.amazon.in/s?k=fluid+mechanics+frank+white", type: "article" },
        { title: "GATE ME Fluid Mechanics PYQs", url: "https://www.gatementor.com/fluid-mechanics", type: "article" },
      ],
      subtopics: [
        { name: "Fluid Statics & Kinematics", description: "Pressure variation, buoyancy, metacentre, streamlines, stream function, potential flow", difficulty: "foundational", estimatedHours: 5, keyConcepts: ["Hydrostatic pressure", "Metacentric height", "Stream function", "Irrotational flow"], whyItMatters: "4-5 GATE questions annually; foundation for dynamic fluid analysis" },
        { name: "Bernoulli & Flow Measurement", description: "Bernoulli equation, venturimeter, orifice plate, pitot tube, flow through pipes", difficulty: "intermediate", estimatedHours: 5, keyConcepts: ["Bernoulli application", "Venturimeter Cd", "Reynolds number", "Moody chart"], whyItMatters: "6-8 GATE questions; pipe flow and measurement appear in every fluid mechanics interview" },
        { name: "Turbomachinery", description: "Pumps (centrifugal/reciprocating), compressors, turbines — velocity triangles, affinity laws", difficulty: "advanced", estimatedHours: 7, keyConcepts: ["Velocity triangles", "Specific speed", "Affinity laws", "Cavitation"], whyItMatters: "Turbomachinery is the most industry-relevant fluid topic; PSU roles heavily test this" },
      ],
    },
    {
      topic: "Manufacturing Technology",
      description: "Casting, welding, machining, metal forming — practical manufacturing knowledge for industry roles.",
      estimatedHours: 18,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Visit a manufacturing plant or watch factory tour videos on YouTube. Visual understanding of processes makes the theory stick and interview answers more credible.",
      resources: [
        { title: "Manufacturing Engineering & Technology — Kalpakjian", url: "https://www.amazon.in/s?k=kalpakjian+manufacturing", type: "article" },
        { title: "NPTEL Manufacturing Processes", url: "https://nptel.ac.in/courses/112105136", type: "course" },
        { title: "The Fabricator (Industry Resource)", url: "https://www.thefabricator.com", type: "article" },
      ],
      subtopics: [
        { name: "Casting & Welding", description: "Sand casting, die casting, SMAW/MIG/TIG welding, defects and inspection", difficulty: "foundational", estimatedHours: 5, keyConcepts: ["Casting defects (shrinkage, porosity)", "Riser design", "Welding heat affected zone", "NDT methods"], whyItMatters: "Casting and welding are everywhere in manufacturing; every mech interview asks about defects" },
        { name: "Machining Processes", description: "Turning, milling, drilling — cutting theory, tool geometry, cutting speed/feed/depth", difficulty: "intermediate", estimatedHours: 5, keyConcepts: ["Merchant's circle", "Tool life (Taylor's equation)", "Cutting forces", "Surface finish (Ra)"], whyItMatters: "Machining is core of job shop and production environments; GATE tests cutting theory" },
        { name: "Metal Forming & Sheet Metal", description: "Forging (open/closed die), rolling, extrusion, deep drawing, spring-back", difficulty: "intermediate", estimatedHours: 5, keyConcepts: ["Forging defects", "Rolling reduction ratio", "Extrusion types", "Deep drawing ratio"], whyItMatters: "Forming knowledge is essential for automotive and aerospace manufacturing roles" },
      ],
    },
    {
      topic: "Strength of Materials (SOM)",
      description: "Stress, strain, deflection, torsion, and failure theories — core design knowledge.",
      estimatedHours: 18,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Draw stress and deflection diagrams for every standard loading case before solving numerically. GATE questions test diagram interpretation as much as calculations.",
      resources: [
        { title: "Strength of Materials — Sadhu Singh", url: "https://www.amazon.in/s?k=strength+of+materials+sadhu+singh", type: "article" },
        { title: "NPTEL Strength of Materials", url: "https://nptel.ac.in/courses/105101014", type: "course" },
        { title: "Gradeup GATE ME SOM Notes", url: "https://gradeup.co/gate/mechanical-engineering/strength-of-materials-study-material", type: "article" },
      ],
      subtopics: [
        { name: "Stress, Strain & Elasticity", description: "Principal stresses, Mohr's circle, strain energy, elastic constants (E, G, K, μ)", difficulty: "foundational", estimatedHours: 5, keyConcepts: ["Principal stresses", "Mohr's circle", "Poisson's ratio", "Bulk modulus"], whyItMatters: "Mohr's circle and principal stresses appear in almost every GATE ME paper" },
        { name: "Beams & Columns", description: "Bending stress, shear stress in beams, deflection methods, Euler column buckling", difficulty: "intermediate", estimatedHours: 6, keyConcepts: ["Bending formula", "Macaulay's method", "Area moment method", "Euler buckling load"], whyItMatters: "Beam analysis is tested in 5-7 GATE questions annually; column buckling is a design essential" },
        { name: "Torsion & Failure Theories", description: "Circular shaft torsion, springs, Tresca and Von Mises criteria, fatigue basics", difficulty: "advanced", estimatedHours: 5, keyConcepts: ["Torsion formula", "Angle of twist", "Von Mises criterion", "S-N curve fatigue"], whyItMatters: "Failure theories determine material selection in design; asked in design and R&D interviews" },
      ],
    },
    {
      topic: "Machine Design",
      description: "Design of mechanical components — shafts, bearings, gears, fasteners, springs.",
      estimatedHours: 15,
      interviewFrequency: "high",
      prerequisites: ["Strength of Materials (SOM)"],
      studyTip: "Refer IS/AGMA/BIS standards during design problems. Interviewers in PSUs and manufacturing companies expect you to know applicable design codes.",
      resources: [
        { title: "Machine Design — VB Bhandari", url: "https://www.amazon.in/s?k=machine+design+vb+bhandari", type: "article" },
        { title: "NPTEL Machine Design (IIT KGP)", url: "https://nptel.ac.in/courses/112105124", type: "course" },
        { title: "MIT OCW Machine Design", url: "https://ocw.mit.edu/courses/2-72-elements-of-mechanical-design-spring-2009/", type: "course" },
      ],
      subtopics: [
        { name: "Shaft & Coupling Design", description: "Shaft design under combined loading, keys, keyways, couplings, critical speed", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["ASME shaft design equation", "Key design", "Flexible coupling", "Critical whirling speed"], whyItMatters: "Shaft design is a core mechanical design competency; directly tested in industry interviews" },
        { name: "Bearing & Gear Design", description: "Rolling vs sliding bearings, bearing life (L10), spur/helical gear design, Lewis equation", difficulty: "intermediate", estimatedHours: 5, keyConcepts: ["L10 bearing life", "Dynamic load rating", "Lewis equation", "Gear module"], whyItMatters: "Gears and bearings are in every rotating machine; design knowledge is industry-critical" },
      ],
    },
    {
      topic: "CAD/CAM & Industry 4.0",
      description: "SolidWorks/AutoCAD for mechanical design, CNC programming, and manufacturing automation.",
      estimatedHours: 14,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Model any mechanical component (bracket, shaft, gear housing) in SolidWorks from a 2D drawing. CAD proficiency is a minimum bar for most industry roles.",
      resources: [
        { title: "SolidWorks Official Tutorials", url: "https://www.solidworks.com/sw/support/SolidWorksTutorials.html", type: "docs" },
        { title: "GrabCAD Community & Tutorials", url: "https://grabcad.com/tutorials", type: "course" },
        { title: "Autodesk AutoCAD Mechanical", url: "https://www.autodesk.com/products/autocad/overview", type: "docs" },
      ],
      subtopics: [
        { name: "SolidWorks & 3D CAD", description: "Part modelling, assembly, motion study, FEA basics, GD&T annotation", difficulty: "foundational", estimatedHours: 5, keyConcepts: ["Parametric modelling", "Assembly constraints", "FEA mesh", "GD&T callouts"], whyItMatters: "SolidWorks proficiency is listed as mandatory in 85% of mechanical design job descriptions" },
        { name: "CNC & CAM Programming", description: "G-code/M-code basics, toolpath generation, CNC turning/milling operations", difficulty: "intermediate", estimatedHours: 5, keyConcepts: ["G-code structure", "Toolpath strategies", "CNC turning parameters", "CAM software workflow"], whyItMatters: "CNC programming is expected in production engineering and manufacturing roles" },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// CIVIL ENGINEERING FALLBACK
// ─────────────────────────────────────────────────────────────────────────────
const CIVIL_FALLBACK = {
  meta: {
    label: "Civil Engineering — GATE / PSU / Industry",
    domain: "civil",
    totalTopics: 6,
    totalSubtopics: 22,
    totalEstimatedHours: 110,
    targetAudience: "Civil engineers targeting GATE, PSUs (UPSC ESE), or infrastructure industry roles",
    aiSummary: "Structural Analysis and RCC Design have the highest GATE CE weightage. For industry roles, AutoCAD + estimation skills are what employers assess in the first interview.",
  },
  topics: [
    {
      topic: "Structural Analysis",
      description: "Trusses, beams, frames, influence lines — core GATE CE topic with highest weightage.",
      estimatedHours: 25,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "Solve influence line problems graphically before analytically. GATE repeatedly asks ILD-based questions that require visual understanding.",
      resources: [
        { title: "NPTEL Structural Analysis (IIT Kharagpur)", url: "https://nptel.ac.in/courses/105105163", type: "course" },
        { title: "Structural Analysis — Bhavikatti", url: "https://www.amazon.in/s?k=structural+analysis+bhavikatti", type: "article" },
        { title: "GATE Civil PYQs (Made Easy)", url: "https://www.madeeasy.in/GATE/civil-engineering", type: "article" },
      ],
      subtopics: [
        { name: "Determinate Structures", description: "Simply supported beams, cantilevers, trusses (method of joints/sections), arches", difficulty: "foundational", estimatedHours: 6, keyConcepts: ["Bending moment diagrams", "Shear force diagrams", "Method of sections", "Three-hinged arch"], whyItMatters: "Foundation for all structural analysis; 4-5 GATE questions annually" },
        { name: "Indeterminate Structures", description: "Degree of indeterminacy, slope-deflection method, moment distribution, matrix methods", difficulty: "intermediate", estimatedHours: 8, keyConcepts: ["Slope-deflection equations", "Moment distribution (Hardy Cross)", "Stiffness matrix", "Degree of indeterminacy"], whyItMatters: "6-8 GATE CE questions; real structures are all indeterminate" },
        { name: "Influence Lines & Moving Loads", description: "ILD for reactions, moments, shear; Muller-Breslau principle; moving load patterns", difficulty: "advanced", estimatedHours: 6, keyConcepts: ["Muller-Breslau principle", "ILD for trusses", "Maximum moment envelope", "Absolute maximum BM"], whyItMatters: "Bridge design depends on influence lines; GATE asks 2-3 ILD problems per year" },
      ],
    },
    {
      topic: "RCC & Steel Design",
      description: "Reinforced concrete and steel structure design — IS 456, IS 800 based.",
      estimatedHours: 20,
      interviewFrequency: "very_high",
      prerequisites: ["Structural Analysis"],
      studyTip: "Read IS 456:2000 alongside design problems. GATE and PSU interviews directly ask about code provisions — reference code clause numbers in your answers.",
      resources: [
        { title: "IS 456:2000 (Free BIS PDF)", url: "https://bis.gov.in/index.php/standards/", type: "docs" },
        { title: "RCC Design — Pillai & Menon", url: "https://www.amazon.in/s?k=rcc+design+pillai+menon", type: "article" },
        { title: "NPTEL Design of RC Structures", url: "https://nptel.ac.in/courses/105106114", type: "course" },
      ],
      subtopics: [
        { name: "Limit State Design of Beams & Slabs", description: "LSM philosophy, singly/doubly reinforced beams, one-way & two-way slab design", difficulty: "intermediate", estimatedHours: 6, keyConcepts: ["Limiting moment of resistance", "Singly reinforced beam", "Two-way slab coefficients", "Cover requirements IS 456"], whyItMatters: "RCC beam and slab design is the most-tested topic in GATE CE and PSU interviews" },
        { name: "Columns & Footings", description: "Axially loaded columns, eccentrically loaded columns, isolated footings, raft foundations", difficulty: "intermediate", estimatedHours: 6, keyConcepts: ["Effective length of columns", "Slenderness ratio", "Column interaction diagram", "Bearing capacity formula"], whyItMatters: "Foundation design is tested in PSU interviews and forms practical industry knowledge" },
        { name: "Pre-stressed Concrete & Steel Design", description: "Pre-tensioning vs post-tensioning, losses, IS 800 steel connections, bolted joints", difficulty: "advanced", estimatedHours: 6, keyConcepts: ["Pre-stress losses", "Load balancing concept", "IS 800 connection design", "Bolt capacity"], whyItMatters: "PSC is in GATE CE syllabus; steel design is required for industrial structure roles" },
      ],
    },
    {
      topic: "Geotechnical Engineering",
      description: "Soil mechanics, foundation design, slope stability — the most design-critical civil topic.",
      estimatedHours: 18,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Visualize soil samples and field conditions mentally for every problem. Geotechnical failures (landslides, settlement) make more sense when you picture the physical soil mass.",
      resources: [
        { title: "NPTEL Geotechnical Engineering", url: "https://nptel.ac.in/courses/105105144", type: "course" },
        { title: "Soil Mechanics — Arora", url: "https://www.amazon.in/s?k=soil+mechanics+arora+civil", type: "article" },
        { title: "GATE Geotechnical PYQs", url: "https://www.civilenggforall.com/gate-questions/geotechnical-engineering/", type: "article" },
      ],
      subtopics: [
        { name: "Soil Properties & Classification", description: "Atterberg limits, grain size distribution, IS classification system, permeability, seepage", difficulty: "foundational", estimatedHours: 5, keyConcepts: ["Atterberg limits", "IS 1498 classification", "Darcy's law", "Flow net"], whyItMatters: "Soil classification is the first step of any geotechnical investigation" },
        { name: "Shear Strength & Consolidation", description: "Mohr-Coulomb criterion, triaxial/direct shear tests, Terzaghi consolidation, settlement calculation", difficulty: "intermediate", estimatedHours: 6, keyConcepts: ["Mohr-Coulomb", "Undrained vs drained shear", "Cv (coefficient of consolidation)", "Settlement calculation"], whyItMatters: "Foundation settlement and bearing capacity questions dominate GATE and PSU interviews" },
        { name: "Foundation & Slope Analysis", description: "Bearing capacity (Terzaghi/Meyerhof), pile capacity, slope stability (Bishop method)", difficulty: "advanced", estimatedHours: 6, keyConcepts: ["Terzaghi bearing capacity", "Pile group efficiency", "Bishop simplified method", "Factor of safety slopes"], whyItMatters: "Foundation failures are catastrophic; every structural design role requires geotechnical fluency" },
      ],
    },
    {
      topic: "Fluid Mechanics & Hydraulics",
      description: "Open channel flow, pipe flow, hydraulic machines — critical for water resources roles.",
      estimatedHours: 16,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "For open channel problems, draw the hydraulic grade line and energy grade line before solving. Most errors come from misidentifying these two profiles.",
      resources: [
        { title: "NPTEL Fluid Mechanics for Civil", url: "https://nptel.ac.in/courses/105106114", type: "course" },
        { title: "Open Channel Flow — Chaudhry", url: "https://www.amazon.in/s?k=open+channel+flow+chaudhry", type: "article" },
        { title: "Irrigation Engineering — Michael", url: "https://www.amazon.in/s?k=irrigation+engineering+michael", type: "article" },
      ],
      subtopics: [
        { name: "Pipe Flow & Fluid Statics", description: "Bernoulli, Moody chart, pipe networks (Hardy Cross), pressure measurement", difficulty: "foundational", estimatedHours: 5, keyConcepts: ["Bernoulli equation", "Darcy-Weisbach", "Moody chart", "Hardy Cross pipe network"], whyItMatters: "Pipe network design is fundamental to water supply and sanitation engineering" },
        { name: "Open Channel Flow", description: "Manning's equation, specific energy, critical flow, hydraulic jump, gradually varied flow", difficulty: "intermediate", estimatedHours: 6, keyConcepts: ["Manning's n", "Critical depth", "Hydraulic jump energy loss", "GVF profiles"], whyItMatters: "Canal and drainage design relies entirely on open channel hydraulics" },
      ],
    },
    {
      topic: "Transportation & Highway Engineering",
      description: "Highway geometric design, pavement design, traffic engineering — PSU exam essentials.",
      estimatedHours: 14,
      interviewFrequency: "medium",
      prerequisites: [],
      studyTip: "Memorize IRC code values (stopping sight distance, super-elevation limits, CBR values) as GATE directly asks code-based numerical problems from IRC:73 and IRC:37.",
      resources: [
        { title: "IRC 37:2018 Flexible Pavement Design", url: "https://www.irc.nic.in/stds/list_of_standards.htm", type: "docs" },
        { title: "Highway Engineering — Kadiyali", url: "https://www.amazon.in/s?k=highway+engineering+kadiyali", type: "article" },
        { title: "NPTEL Transportation Engineering", url: "https://nptel.ac.in/courses/105104098", type: "course" },
      ],
      subtopics: [
        { name: "Highway Geometric Design", description: "Sight distance (SSD, OSD, ISD), horizontal/vertical curves, super-elevation, widening", difficulty: "foundational", estimatedHours: 4, keyConcepts: ["Stopping sight distance", "Super-elevation calculation", "Summit curve length", "Valley curve length"], whyItMatters: "Highway design is the most common civil engineering job function; 3-4 GATE CE questions yearly" },
        { name: "Pavement Design & Traffic", description: "Flexible vs rigid pavement, CBR method, traffic volume studies, PCU, LOS", difficulty: "intermediate", estimatedHours: 5, keyConcepts: ["CBR design method", "Cumulative standard axles", "Level of service", "PCU factors"], whyItMatters: "Road construction is the largest civil sector employer; pavement knowledge is essential" },
      ],
    },
    {
      topic: "Environmental & Water Resources Engineering",
      description: "Water treatment, wastewater, irrigation, hydrology — core for water utility and environment roles.",
      estimatedHours: 15,
      interviewFrequency: "medium",
      prerequisites: [],
      studyTip: "Learn the unit operations in a water treatment plant in sequence — this 'story' makes it easy to answer any water treatment question and impresses interviewers who expect compartmentalized knowledge.",
      resources: [
        { title: "Environmental Engineering — Peavy, Rowe & Tchobanoglous", url: "https://www.amazon.in/s?k=environmental+engineering+peavy", type: "article" },
        { title: "NPTEL Water Treatment Engineering", url: "https://nptel.ac.in/courses/105103022", type: "course" },
        { title: "CPCB Water Quality Standards", url: "https://cpcb.nic.in/water-quality-criteria/", type: "docs" },
      ],
      subtopics: [
        { name: "Water & Wastewater Treatment", description: "Coagulation, sedimentation, filtration, chlorination, BOD/COD, activated sludge", difficulty: "intermediate", estimatedHours: 6, keyConcepts: ["Jar test coagulation", "BOD vs COD", "Activated sludge SVI", "Chlorine demand"], whyItMatters: "Municipal water and sanitation roles — the largest public sector civil employer — require this knowledge" },
        { name: "Hydrology & Irrigation", description: "Runoff estimation (SCS-CN), flood routing, IDF curves, canal design, crop water requirement", difficulty: "intermediate", estimatedHours: 6, keyConcepts: ["SCS-CN method", "Muskingum routing", "IDF curve", "Duty and delta irrigation"], whyItMatters: "Irrigation is 30% of India's civil engineering projects; water resources roles demand this expertise" },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// CS STUDENT FALLBACK (BCA/MCA/B.Tech CS)
// ─────────────────────────────────────────────────────────────────────────────
const CS_STUDENT_FALLBACK = {
  meta: {
    label: "Computer Science — BCA/MCA/B.Tech CS",
    domain: "engineering",
    totalTopics: 6,
    totalSubtopics: 24,
    totalEstimatedHours: 200,
    targetAudience: "CS/IT students targeting software engineering roles and placement preparation",
    aiSummary: "DSA is the gateway to every tech placement — solve 150+ problems before your first interview. Build 2-3 real projects to demonstrate practical skills alongside theory.",
  },
  topics: [
    {
      topic: "Data Structures & Algorithms",
      description: "Core DSA — the #1 tested skill in every tech company placement and interview.",
      estimatedHours: 60,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "Solve problems daily on a timer. For every problem you can't solve in 30 minutes, study the solution, understand it fully, then code it again from scratch next day.",
      resources: [
        { title: "NeetCode 150 (Free)", url: "https://neetcode.io/practice", type: "course" },
        { title: "Love Babbar DSA Sheet (YouTube)", url: "https://www.youtube.com/@LoveBabbar", type: "video" },
        { title: "GeeksForGeeks DSA", url: "https://www.geeksforgeeks.org/data-structures/", type: "article" },
      ],
      subtopics: [
        { name: "Arrays, Strings & Hashing", description: "Two-pointer, sliding window, prefix sum, hash maps — placement round staples", difficulty: "foundational", estimatedHours: 12, keyConcepts: ["Two pointer", "Sliding window", "Prefix sum", "HashMap patterns"], whyItMatters: "50% of placement round problems are array/string patterns" },
        { name: "Linked Lists, Stacks & Queues", description: "Reversal, cycle detection, monotonic stack, queue variations", difficulty: "foundational", estimatedHours: 10, keyConcepts: ["Floyd's cycle detection", "Reversal in-place", "Monotonic stack", "Deque applications"], whyItMatters: "Linked list problems are in every company's easy/medium problem bank" },
        { name: "Trees & Graphs", description: "Binary trees, BST, BFS/DFS, topological sort, shortest path (Dijkstra)", difficulty: "intermediate", estimatedHours: 15, keyConcepts: ["Tree traversals", "BST operations", "BFS/DFS patterns", "Topological sort"], whyItMatters: "Graphs appear in 40% of SDE interviews; trees are asked in 60%" },
        { name: "Dynamic Programming", description: "1D/2D DP, memoization vs tabulation, classic DP problems", difficulty: "advanced", estimatedHours: 15, keyConcepts: ["Memoization", "Tabulation", "LCS/LIS patterns", "Knapsack variants"], whyItMatters: "DP differentiates candidates at FAANG and product companies; hard to shortcut" },
      ],
    },
    {
      topic: "Operating Systems",
      description: "Process management, memory, file systems — core CS theory asked in every tech interview.",
      estimatedHours: 25,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Implement a basic shell and a simple memory allocator in C. Building these makes OS concepts concrete and gives you real stories for interviews.",
      resources: [
        { title: "OSTEP (Free OS Textbook)", url: "https://pages.cs.wisc.edu/~remzi/OSTEP/", type: "article" },
        { title: "Gate Smashers OS (YouTube)", url: "https://www.youtube.com/@GateSmashers", type: "video" },
        { title: "GeeksForGeeks OS Articles", url: "https://www.geeksforgeeks.org/operating-systems/", type: "article" },
      ],
      subtopics: [
        { name: "Process & Thread Management", description: "Process lifecycle, threads vs processes, context switching, CPU scheduling algorithms", difficulty: "foundational", estimatedHours: 6, keyConcepts: ["Process states", "Thread vs process", "Round Robin", "Priority scheduling"], whyItMatters: "OS is 10-15% of GATE CS; process questions appear in placement technical rounds" },
        { name: "Memory Management", description: "Paging, segmentation, virtual memory, page replacement algorithms (LRU, FIFO, Optimal)", difficulty: "intermediate", estimatedHours: 7, keyConcepts: ["Paging", "Page table", "TLB", "LRU page replacement"], whyItMatters: "Memory management is heavily tested in GATE and SDE interviews for systems roles" },
        { name: "Deadlocks & Synchronisation", description: "Mutex, semaphore, Banker's algorithm, deadlock detection and prevention", difficulty: "intermediate", estimatedHours: 6, keyConcepts: ["Mutex vs semaphore", "Banker's algorithm", "Deadlock conditions", "Peterson's solution"], whyItMatters: "Concurrency and deadlock are asked in every systems interview and GATE" },
      ],
    },
    {
      topic: "Database Management Systems (DBMS)",
      description: "Relational databases, SQL, normalization, transactions — theory and practical.",
      estimatedHours: 25,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Build a real project with a relational database (MySQL/PostgreSQL). Design the schema, write complex queries, and optimize at least one slow query using EXPLAIN.",
      resources: [
        { title: "Mode SQL Tutorial (Free)", url: "https://mode.com/sql-tutorial/", type: "course" },
        { title: "DBMS Gate Smashers (YouTube)", url: "https://www.youtube.com/@GateSmashers", type: "video" },
        { title: "Use The Index, Luke (SQL Performance)", url: "https://use-the-index-luke.com", type: "article" },
      ],
      subtopics: [
        { name: "Relational Model & SQL", description: "Relational algebra, SQL DDL/DML/DCL, complex joins, subqueries, CTEs", difficulty: "foundational", estimatedHours: 7, keyConcepts: ["Relational algebra", "JOIN types", "Subqueries", "CTEs"], whyItMatters: "SQL is tested in 70% of placement interviews; relational algebra in GATE" },
        { name: "Normalization & ER Design", description: "1NF through BCNF normalization, ER diagrams, functional dependencies", difficulty: "intermediate", estimatedHours: 6, keyConcepts: ["Functional dependencies", "1NF to BCNF", "ER to relational", "Decomposition"], whyItMatters: "Normalization is a GATE staple with 4-6 questions; schema design is tested in SDE interviews" },
        { name: "Transactions & Concurrency", description: "ACID properties, isolation levels, 2-phase locking, serialisability", difficulty: "advanced", estimatedHours: 6, keyConcepts: ["ACID", "Serializability", "2PL protocol", "Isolation levels"], whyItMatters: "Concurrency control is GATE's most complex DBMS topic; systems SDE roles test this" },
      ],
    },
    {
      topic: "Computer Networks",
      description: "OSI/TCP-IP model, protocols, routing, and security fundamentals.",
      estimatedHours: 20,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Use Wireshark to capture and analyze your own HTTP/DNS/TCP traffic. Packet-level understanding makes network concepts intuitive.",
      resources: [
        { title: "Computer Networking: A Top-Down Approach (Kurose Ross)", url: "https://gaia.cs.umass.edu/kurose_ross/online_lectures.htm", type: "course" },
        { title: "NetworkChuck (YouTube)", url: "https://www.youtube.com/@NetworkChuck", type: "video" },
        { title: "GeeksForGeeks Computer Networks", url: "https://www.geeksforgeeks.org/computer-network-tutorials/", type: "article" },
      ],
      subtopics: [
        { name: "OSI/TCP-IP Model & Protocols", description: "7 OSI layers, TCP vs UDP, HTTP/HTTPS/FTP/DNS — how each works", difficulty: "foundational", estimatedHours: 5, keyConcepts: ["OSI layers", "TCP vs UDP", "HTTP methods", "DNS resolution"], whyItMatters: "Network fundamentals are asked in every backend/full-stack placement interview" },
        { name: "IP Addressing & Routing", description: "IPv4/IPv6, subnetting, CIDR, routing protocols (OSPF, BGP, RIP)", difficulty: "intermediate", estimatedHours: 6, keyConcepts: ["Subnetting", "CIDR notation", "Static vs dynamic routing", "BGP basics"], whyItMatters: "Networking is 10-12% of GATE CS; subnetting is asked in every network engineering interview" },
      ],
    },
    {
      topic: "Web Development",
      description: "Full-stack web development — HTML/CSS, JavaScript, React, Node.js, and REST APIs.",
      estimatedHours: 40,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "Build a full-stack project with auth (JWT), CRUD operations, and deployment (Vercel/Railway). Projects are the primary hiring signal for fresher web development roles.",
      resources: [
        { title: "The Odin Project (Free Full-Stack)", url: "https://www.theodinproject.com", type: "course" },
        { title: "Chai aur Code (YouTube — Hindi)", url: "https://www.youtube.com/@chaiaurcode", type: "video" },
        { title: "MDN Web Docs", url: "https://developer.mozilla.org", type: "docs" },
      ],
      subtopics: [
        { name: "HTML, CSS & Responsive Design", description: "Semantic HTML, CSS Flexbox/Grid, media queries, animations, accessibility basics", difficulty: "foundational", estimatedHours: 8, keyConcepts: ["Semantic HTML", "Flexbox", "CSS Grid", "Media queries"], whyItMatters: "Frontend basics are screened in every web development placement; UI test tasks are common" },
        { name: "JavaScript (Core & ES6+)", description: "DOM manipulation, events, closures, async/await, fetch API, ES6+ features", difficulty: "intermediate", estimatedHours: 10, keyConcepts: ["Closures", "Event loop", "Async/await", "Destructuring"], whyItMatters: "JavaScript is the language of the web; every frontend interview tests core JS deeply" },
        { name: "React Fundamentals", description: "Components, hooks (useState/useEffect), props, state, React Router, context", difficulty: "intermediate", estimatedHours: 10, keyConcepts: ["useState/useEffect", "Component lifecycle", "React Router", "Context API"], whyItMatters: "React is in 80% of frontend job descriptions; fresher React projects directly lead to interviews" },
        { name: "Node.js & REST APIs", description: "Express.js, REST API design, MongoDB/PostgreSQL integration, JWT auth, deployment", difficulty: "intermediate", estimatedHours: 10, keyConcepts: ["Express routing", "REST principles", "JWT auth", "Mongoose ODM"], whyItMatters: "Full-stack + backend roles require Node.js; projects with MERN or PERN stack are valued" },
      ],
    },
    {
      topic: "Core CS Theory (GATE Prep)",
      description: "Algorithms analysis, Theory of Computation, Compiler Design — for GATE and core CS roles.",
      estimatedHours: 25,
      interviewFrequency: "medium",
      prerequisites: [],
      studyTip: "For GATE, solve previous year questions topic-by-topic from the last 10 years. GATE CS repeats question patterns more than any other exam.",
      resources: [
        { title: "GATE Overflow (PYQ Discussion)", url: "https://gateoverflow.in", type: "article" },
        { title: "Knowledge Gate (YouTube)", url: "https://www.youtube.com/@KnowledgeGATE", type: "video" },
        { title: "Introduction to Algorithms (CLRS)", url: "https://mitpress.mit.edu/books/introduction-algorithms", type: "article" },
      ],
      subtopics: [
        { name: "Algorithm Complexity & Design", description: "Time/space complexity, recurrences (Master theorem), divide & conquer, greedy, graph algorithms", difficulty: "intermediate", estimatedHours: 8, keyConcepts: ["Big-O notation", "Master theorem", "Greedy correctness", "Minimum spanning tree"], whyItMatters: "Algorithm analysis is 15-20% of GATE CS; asked in every SDE technical interview" },
        { name: "Theory of Computation (TOC)", description: "DFA/NFA/PDA, regular languages (pumping lemma), context-free grammars, Turing machines", difficulty: "advanced", estimatedHours: 8, keyConcepts: ["DFA construction", "Pumping lemma", "CFG derivations", "Turing machine decidability"], whyItMatters: "TOC is 8-10% of GATE CS weight; one of the most concept-heavy sections" },
        { name: "Compiler Design", description: "Lexical analysis, parsing (LL/LR), semantic analysis, code generation, optimization", difficulty: "advanced", estimatedHours: 7, keyConcepts: ["FIRST/FOLLOW sets", "LL(1) vs LR parsing", "Three-address code", "Peephole optimization"], whyItMatters: "Compiler is 5-8% GATE weightage; complex but predictable question types" },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// BSc FALLBACK
// ─────────────────────────────────────────────────────────────────────────────
const BSC_FALLBACK = {
  meta: {
    label: "BSc Science — Foundation & Research Preparation",
    domain: "engineering",
    totalTopics: 5,
    totalSubtopics: 18,
    totalEstimatedHours: 300,
    targetAudience: "BSc students targeting MSc entrance, research, or science-based careers",
    aiSummary: "BSc is the foundation for MSc and PhD — conceptual depth matters more than breadth. Pick 2-3 core subjects and master them deeply for IIT JAM, CSIR NET, or JEST entrance exams.",
  },
  topics: [
    {
      topic: "Mathematics for Science",
      description: "Calculus, linear algebra, differential equations, and probability — the language of science.",
      estimatedHours: 70,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "Mathematics at BSc level must be understood, not memorized. Prove every theorem yourself at least once — the act of proving builds intuition faster than reading proofs.",
      resources: [
        { title: "MIT OpenCourseWare 18.01 Calculus (Free)", url: "https://ocw.mit.edu/courses/18-01-single-variable-calculus-fall-2006/", type: "course" },
        { title: "3Blue1Brown (YouTube — Visual Maths)", url: "https://www.youtube.com/@3blue1brown", type: "video" },
        { title: "Khan Academy College Mathematics", url: "https://www.khanacademy.org/math/calculus-1", type: "course" },
      ],
      subtopics: [
        { name: "Calculus (Single & Multivariable)", description: "Limits, differentiation, integration, partial derivatives, gradient, divergence, curl", difficulty: "foundational", estimatedHours: 20, keyConcepts: ["Taylor series", "Multiple integrals", "Vector calculus", "Stokes theorem"], whyItMatters: "Calculus is the language of physics and chemistry; IIT JAM Maths is 60% calculus" },
        { name: "Linear Algebra", description: "Matrices, eigenvalues, eigenvectors, vector spaces, transformations", difficulty: "intermediate", estimatedHours: 18, keyConcepts: ["Eigenvalues", "Diagonalization", "Vector spaces", "Gram-Schmidt"], whyItMatters: "Linear algebra underlies quantum mechanics, ML, and data science — a universal tool" },
        { name: "Differential Equations", description: "ODE (first/second order), PDE introduction, Laplace transforms, series solutions", difficulty: "intermediate", estimatedHours: 18, keyConcepts: ["Separation of variables", "Laplace transform", "Fourier series", "Heat equation"], whyItMatters: "DEs model every physical phenomenon; CSIR NET Physics/Chemistry tests this extensively" },
      ],
    },
    {
      topic: "Physics",
      description: "Classical mechanics, electromagnetism, quantum mechanics, and thermodynamics at BSc level.",
      estimatedHours: 80,
      interviewFrequency: "very_high",
      prerequisites: ["Mathematics for Science"],
      studyTip: "Work through Irodov problems for mechanics and electromagnetism. They're hard but solving even 50% develops physical intuition that transforms your exam performance.",
      resources: [
        { title: "Feynman Lectures on Physics (Free Online)", url: "https://www.feynmanlectures.caltech.edu", type: "article" },
        { title: "NPTEL BSc Physics Lectures", url: "https://nptel.ac.in/courses/115106090", type: "course" },
        { title: "IIT JAM Physics Previous Papers", url: "https://jam.iisc.ac.in", type: "docs" },
      ],
      subtopics: [
        { name: "Classical Mechanics", description: "Lagrangian/Hamiltonian mechanics, conservation laws, rigid body rotation, oscillations", difficulty: "intermediate", estimatedHours: 20, keyConcepts: ["Lagrangian", "Hamiltonian", "Conservation of angular momentum", "Normal modes"], whyItMatters: "Classical mechanics is 20-25% of IIT JAM Physics and JEST" },
        { name: "Electromagnetism", description: "Maxwell's equations, electromagnetic waves, boundary conditions, waveguides", difficulty: "intermediate", estimatedHours: 20, keyConcepts: ["Maxwell's equations", "Electromagnetic wave propagation", "Boundary conditions", "Poynting vector"], whyItMatters: "EM is the highest weightage topic in IIT JAM Physics" },
        { name: "Quantum Mechanics", description: "Schrödinger equation, operators, harmonic oscillator, hydrogen atom, perturbation theory", difficulty: "advanced", estimatedHours: 20, keyConcepts: ["Time-independent Schrödinger", "Uncertainty principle", "Harmonic oscillator", "Hydrogen wave functions"], whyItMatters: "QM is essential for all modern physics research; 20% of IIT JAM and CSIR NET" },
      ],
    },
    {
      topic: "Chemistry",
      description: "Physical, organic, and inorganic chemistry at BSc honours level.",
      estimatedHours: 70,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Physical chemistry is mathematical — treat it like applied maths. Organic chemistry requires mechanism understanding, not memorisation — ask 'why' for every reaction step.",
      resources: [
        { title: "Atkins' Physical Chemistry (Key Chapters Online)", url: "https://www.oup.com/uk/orc/bin/9780198807735/student/", type: "docs" },
        { title: "IIT JAM Chemistry Previous Papers (IISc)", url: "https://jam.iisc.ac.in/previous-papers.html", type: "docs" },
        { title: "Organic Chemistry Portal", url: "https://www.organic-chemistry.org/namedreactions/", type: "article" },
      ],
      subtopics: [
        { name: "Physical Chemistry", description: "Thermodynamics (Gibbs free energy, chemical potential), quantum chemistry, spectroscopy, kinetics", difficulty: "intermediate", estimatedHours: 25, keyConcepts: ["Gibbs free energy", "Partition function", "Spectroscopy selection rules", "Rate laws"], whyItMatters: "Physical chemistry is 30-35% of IIT JAM Chemistry and CSIR NET Chemical Sciences" },
        { name: "Organic Chemistry (Reaction Mechanisms)", description: "Stereochemistry, named reactions, retrosynthesis, spectral analysis (IR/NMR/MS)", difficulty: "advanced", estimatedHours: 25, keyConcepts: ["R/S configuration", "Retrosynthesis", "NMR interpretation", "Pericyclic reactions"], whyItMatters: "Organic is the most application-heavy section; MSc entrance tests mechanism depth" },
        { name: "Inorganic Chemistry", description: "Coordination chemistry (crystal field theory), organometallics, main group chemistry, bioinorganic", difficulty: "intermediate", estimatedHours: 20, keyConcepts: ["Crystal field splitting", "18-electron rule", "Hard-soft acid-base", "Bioinorganic cofactors"], whyItMatters: "Inorganic is 20-25% of CSIR NET; coordination chemistry is conceptually dense" },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// LAW STUDENT FALLBACK
// ─────────────────────────────────────────────────────────────────────────────
const LAW_STUDENT_FALLBACK = {
  meta: {
    label: "Law — LLB / CLAT Preparation",
    domain: "law",
    totalTopics: 6,
    totalSubtopics: 22,
    totalEstimatedHours: 300,
    targetAudience: "Law students targeting LLB exams, CLAT, or legal practice preparation",
    aiSummary: "Constitutional Law and Contract Law are the backbone of every law exam and practice area. Master case laws by understanding the legal principle, not just the case name.",
  },
  topics: [
    {
      topic: "Constitutional Law",
      description: "Indian Constitution — fundamental rights, constitutional structure, judicial review, amendments.",
      estimatedHours: 60,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "For every constitutional provision, know 1-2 landmark Supreme Court cases that interpreted it. CLAT and LLB exams test case application, not just text.",
      resources: [
        { title: "Constitution of India (Official Text)", url: "https://legislative.gov.in/constitution-of-india", type: "docs" },
        { title: "MP Jain Constitutional Law (Key Chapters)", url: "https://www.amazon.in/s?k=mp+jain+constitutional+law", type: "article" },
        { title: "LegalBites Constitutional Law Articles", url: "https://www.legalbites.in/constitutional-law/", type: "article" },
      ],
      subtopics: [
        { name: "Fundamental Rights (Part III)", description: "Articles 12-35, state action doctrine, horizontal application, limitations on FR", difficulty: "foundational", estimatedHours: 15, keyConcepts: ["State under Art.12", "Reasonable restrictions", "Right to privacy (Puttaswamy)", "Habeas corpus"], whyItMatters: "Part III is tested in every law exam and forms the basis for public interest litigation" },
        { name: "Directive Principles & Fundamental Duties", description: "DPSP classification, justiciability, relationship with FRs, 42nd amendment", difficulty: "intermediate", estimatedHours: 10, keyConcepts: ["Justiciable vs non-justiciable", "Art.21 expansion", "Harmonious construction", "Fundamental duties"], whyItMatters: "DPSP-FR conflict questions appear in every law exam and bar council paper" },
        { name: "Federal Structure & Parliament", description: "Centre-state relations, legislative lists, emergency provisions, parliamentary privileges", difficulty: "intermediate", estimatedHours: 15, keyConcepts: ["Union vs State List", "Concurrent List", "Article 356", "Anti-defection law"], whyItMatters: "Federalism and parliamentary law are staples of judicial services exams" },
        { name: "Judicial Review & PIL", description: "Marbury doctrine in India, writ jurisdiction, PIL expansion, contempt of court", difficulty: "advanced", estimatedHours: 12, keyConcepts: ["Basic structure doctrine", "Writ jurisdiction", "PIL locus standi", "Judicial activism vs restraint"], whyItMatters: "Judicial review questions are in every LLB, CLAT, and judicial services exam" },
      ],
    },
    {
      topic: "Law of Contract",
      description: "Indian Contract Act 1872 — offer, acceptance, consideration, breach, and remedies.",
      estimatedHours: 40,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "Every Contract Act concept should be linked to a real-world example you can explain. 'Explain consideration with an example' is the most common contract law question.",
      resources: [
        { title: "Indian Contract Act 1872 (Official Text)", url: "https://legislative.gov.in/acts/indian-contract-act-1872", type: "docs" },
        { title: "Avtar Singh Contract & Specific Relief", url: "https://www.amazon.in/s?k=avtar+singh+contract+law", type: "article" },
        { title: "LegalBites Contract Law Notes", url: "https://www.legalbites.in/law-of-contract/", type: "article" },
      ],
      subtopics: [
        { name: "Offer, Acceptance & Consideration", description: "Essentials of valid offer/acceptance, cross-offers, revocation, adequacy of consideration", difficulty: "foundational", estimatedHours: 10, keyConcepts: ["Communication of offer", "Postal rule", "Past consideration", "Privity of contract"], whyItMatters: "Offer-acceptance is the foundation of every contract; tested in every law exam globally" },
        { name: "Capacity, Consent & Void Contracts", description: "Minor's contracts, free consent (coercion/fraud/misrepresentation), void vs voidable", difficulty: "intermediate", estimatedHours: 10, keyConcepts: ["Minor's agreement void ab initio", "Coercion vs undue influence", "Mistake of fact", "Void agreement types"], whyItMatters: "Vitiating elements (fraud, misrepresentation) are the most tested contract topics" },
        { name: "Breach & Remedies", description: "Anticipatory breach, actual breach, damages (Hadley v Baxendale), specific performance", difficulty: "intermediate", estimatedHours: 10, keyConcepts: ["Anticipatory breach", "Remoteness of damages", "Specific performance conditions", "Injunction"], whyItMatters: "Remedies are the practical end of contract law; tested in LLB finals and bar exams" },
      ],
    },
    {
      topic: "Law of Torts",
      description: "Civil wrongs — negligence, nuisance, defamation, strict liability, and remedies.",
      estimatedHours: 35,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Study Donoghue v Stevenson for negligence and Rylands v Fletcher for strict liability thoroughly. These cases form the backbone of tort law questions globally.",
      resources: [
        { title: "Ratanlal & Dhirajlal Law of Torts", url: "https://www.amazon.in/s?k=ratanlal+dhirajlal+torts", type: "article" },
        { title: "LegalBites Tort Law Notes", url: "https://www.legalbites.in/law-of-torts/", type: "article" },
        { title: "Oxford Law Faculty Tort Resources", url: "https://www.law.ox.ac.uk/research-and-subject-groups/tort-law", type: "article" },
      ],
      subtopics: [
        { name: "Negligence", description: "Duty of care, breach, causation, remoteness — Donoghue v Stevenson to modern applications", difficulty: "foundational", estimatedHours: 10, keyConcepts: ["Neighbour principle", "Breach of duty", "But-for causation", "Remoteness (Wagon Mound)"], whyItMatters: "Negligence is 40% of tort law in every exam; basis for medical negligence, product liability" },
        { name: "Strict & Absolute Liability", description: "Rylands v Fletcher rule, its Indian modifications (Oleum Gas Leak), consumer protection torts", difficulty: "intermediate", estimatedHours: 8, keyConcepts: ["Non-natural use", "Escape requirement", "MC Mehta absolute liability", "Consumer protection overlap"], whyItMatters: "Environmental and industrial accident cases use strict liability; very current in practice" },
        { name: "Defamation & Privacy", description: "Libel vs slander, defences (justification, fair comment, privilege), right to privacy torts", difficulty: "intermediate", estimatedHours: 8, keyConcepts: ["Libel vs slander", "Justification defence", "Qualified privilege", "Privacy tort evolution"], whyItMatters: "Defamation is increasingly litigated in digital media; tested in CLAT and LLB" },
      ],
    },
    {
      topic: "Criminal Law (IPC)",
      description: "Indian Penal Code 1860 — general principles, offences against person and property.",
      estimatedHours: 40,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "For IPC offences, memorize section numbers for the top 30 most tested sections. CLAT and judicial services questions often directly ask 'under which IPC section'.",
      resources: [
        { title: "Indian Penal Code 1860 (Official)", url: "https://legislative.gov.in/acts/indian-penal-code", type: "docs" },
        { title: "Ratanlal & Dhirajlal Indian Penal Code", url: "https://www.amazon.in/s?k=ratanlal+ipc", type: "article" },
        { title: "LegalBites Criminal Law", url: "https://www.legalbites.in/criminal-law/", type: "article" },
      ],
      subtopics: [
        { name: "General Principles (Mens Rea & Actus Reus)", description: "Intention, knowledge, recklessness, strict liability offences, common intention (s.34), abetment", difficulty: "foundational", estimatedHours: 10, keyConcepts: ["Mens rea types", "Common intention (s.34)", "Abetment (s.107-109)", "General exceptions (s.76-106)"], whyItMatters: "Mens rea is the foundation of criminal liability; every criminal law exam starts here" },
        { name: "Offences Against Person", description: "Murder (s.300), culpable homicide, hurt/grievous hurt, rape, kidnapping", difficulty: "intermediate", estimatedHours: 12, keyConcepts: ["Murder vs culpable homicide", "Exceptions to s.300", "Sections 320-326 (grievous hurt)", "POCSO overlap"], whyItMatters: "Property and person offences form 60% of CLAT criminal law questions" },
        { name: "Property Offences & White Collar", description: "Theft (s.378), robbery, extortion, cheating (s.415), criminal breach of trust, PMLA", difficulty: "intermediate", estimatedHours: 10, keyConcepts: ["Theft elements", "Robbery vs dacoity", "Cheating vs fraud", "PMLA predicate offence"], whyItMatters: "Property offences are most common in practice; PMLA is increasingly tested in law exams" },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// LAW PROFESSIONAL FALLBACK
// ─────────────────────────────────────────────────────────────────────────────
const LAW_PROFESSIONAL_FALLBACK = {
  meta: {
    label: "Legal Practice — Corporate & Litigation",
    domain: "law",
    totalTopics: 5,
    totalSubtopics: 18,
    totalEstimatedHours: 80,
    targetAudience: "Lawyers targeting corporate law firms, in-house legal counsel, or litigation practice",
    aiSummary: "Transactional lawyers must master contract drafting and due diligence. Litigation lawyers must excel at legal research and argument structuring. Both need strong client communication.",
  },
  topics: [
    {
      topic: "Contract Drafting & Review",
      description: "Drafting commercial agreements — NDAs, service agreements, employment contracts, term sheets.",
      estimatedHours: 20,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "Redline (mark-up) 10 real contracts from a variety of types. Identifying risk clauses in someone else's draft is the fastest way to develop drafting instinct.",
      resources: [
        { title: "Drafting Commercial Agreements (Practical Law)", url: "https://uk.practicallaw.thomsonreuters.com", type: "article" },
        { title: "IACCM Contract Management Resources", url: "https://www.worldcc.com", type: "article" },
        { title: "OneCLE Contract Samples", url: "https://contracts.onecle.com", type: "article" },
      ],
      subtopics: [
        { name: "Key Clauses & Risk Allocation", description: "Liability caps, indemnification, warranty, IP ownership, governing law, dispute resolution", difficulty: "intermediate", estimatedHours: 6, keyConcepts: ["Liability cap", "Indemnification trigger", "IP assignment clause", "Arbitration clause"], whyItMatters: "Every corporate transaction depends on well-drafted contracts; clause risk is what clients pay for" },
        { name: "Employment & NDA Agreements", description: "Employment terms, non-compete enforceability, NDA scope, IP assignment, termination clauses", difficulty: "foundational", estimatedHours: 5, keyConcepts: ["Non-compete enforceability (India)", "Confidentiality scope", "IP ownership", "Termination for cause"], whyItMatters: "Employment and NDA agreements are the most frequently drafted documents in any legal practice" },
      ],
    },
    {
      topic: "Corporate Law & M&A",
      description: "Companies Act 2013, due diligence, M&A structuring, and corporate governance.",
      estimatedHours: 18,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "Read the Companies Act 2013 alongside real ROC filings on the MCA portal. Understanding how theory maps to actual filings is what separates junior associates from effective practitioners.",
      resources: [
        { title: "Companies Act 2013 (MCA)", url: "https://www.mca.gov.in/content/mca/global/en/acts-rules/ebooks/acts.html", type: "docs" },
        { title: "Nishith Desai M&A Practice Guides", url: "https://www.nishithdesai.com/knowledge/research-papers/", type: "article" },
        { title: "Bar & Bench Legal News", url: "https://www.barandbench.com", type: "article" },
      ],
      subtopics: [
        { name: "Companies Act 2013 (Key Provisions)", description: "Incorporation, board duties, related party transactions, audit, CSR, winding up", difficulty: "intermediate", estimatedHours: 6, keyConcepts: ["Director's fiduciary duty", "Related party transactions", "RPT approval process", "NCLT jurisdiction"], whyItMatters: "Companies Act governs every Indian company; mandatory knowledge for corporate practice" },
        { name: "M&A Due Diligence", description: "Legal due diligence process, red flags, warranties, indemnities, representation letters", difficulty: "advanced", estimatedHours: 6, keyConcepts: ["Due diligence scope", "Red flags in title", "Warranty vs representation", "Material adverse change"], whyItMatters: "M&A due diligence is a core revenue activity at every corporate law firm" },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// MBA STUDENT FALLBACK
// ─────────────────────────────────────────────────────────────────────────────
const MBA_FALLBACK = {
  meta: {
    label: "MBA — Management & Business Administration",
    domain: "general",
    totalTopics: 6,
    totalSubtopics: 22,
    totalEstimatedHours: 80,
    targetAudience: "MBA students targeting management, consulting, finance, or marketing roles",
    aiSummary: "MBA success in placement is 70% networking and 30% academics. Start case interview prep from semester 1 — the students who start early consistently outperform in final placements.",
  },
  topics: [
    {
      topic: "Financial Management",
      description: "Capital budgeting, working capital, cost of capital, and financial analysis.",
      estimatedHours: 15,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "Build every NPV/IRR calculation in Excel with sensitivity tables. MBA finance is application-first — theory without numerical fluency doesn't impress interviewers.",
      resources: [
        { title: "Brealey Myers Allen Corporate Finance", url: "https://www.amazon.in/s?k=brealey+myers+allen+corporate+finance", type: "article" },
        { title: "Damodaran Finance Lectures (Free YouTube)", url: "https://www.youtube.com/@AswathDamodaran", type: "video" },
        { title: "CFI Financial Modeling (Free)", url: "https://corporatefinanceinstitute.com", type: "course" },
      ],
      subtopics: [
        { name: "Capital Budgeting", description: "NPV, IRR, Payback period, MIRR, capital rationing — with inflation and risk adjustments", difficulty: "foundational", estimatedHours: 4, keyConcepts: ["NPV rule", "IRR pitfalls", "Mutually exclusive projects", "Risk-adjusted discount rate"], whyItMatters: "Capital budgeting decisions define company growth; every finance interview tests this" },
        { name: "Working Capital & Financing", description: "CCC, short-term vs long-term financing, dividend policy, optimal capital structure", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["Cash conversion cycle", "Trade credit", "Optimal capital structure", "Dividend irrelevance"], whyItMatters: "Working capital management is the most common FP&A interview topic" },
      ],
    },
    {
      topic: "Marketing Management",
      description: "STP, 4Ps, consumer behaviour, brand management, and digital marketing for MBA.",
      estimatedHours: 12,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Prepare 3 brand case studies you can discuss deeply — one B2B, one B2C, one digital brand. MBA marketing interviews almost always ask for real-world examples.",
      resources: [
        { title: "Philip Kotler Marketing Management (Key Chapters)", url: "https://www.amazon.in/s?k=kotler+marketing+management", type: "article" },
        { title: "HBR Marketing Articles", url: "https://hbr.org/topic/marketing", type: "article" },
        { title: "Coursera Marketing Analytics (Wharton)", url: "https://www.coursera.org/learn/wharton-marketing", type: "course" },
      ],
      subtopics: [
        { name: "STP & Consumer Behaviour", description: "Market segmentation, targeting, positioning, consumer decision process, cultural factors", difficulty: "foundational", estimatedHours: 4, keyConcepts: ["Market segmentation bases", "Perceptual mapping", "Consumer decision journey", "Involvement theory"], whyItMatters: "STP is the most tested marketing framework in MBA and marketing job interviews" },
        { name: "Brand Management & Pricing", description: "Brand equity (Keller), pricing strategies (value, penetration, skimming), brand extension", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["Brand equity dimensions", "Pricing strategy selection", "Brand extension risk", "Price elasticity"], whyItMatters: "Brand and pricing decisions define marketing strategy; case interviews always test these" },
      ],
    },
    {
      topic: "Operations Management",
      description: "Process design, supply chain, quality management, and project management for MBA.",
      estimatedHours: 10,
      interviewFrequency: "medium",
      prerequisites: [],
      studyTip: "Visit or virtually study a manufacturing plant's operations before operations interviews. Grounding abstract concepts in real processes impresses operations interviewers immediately.",
      resources: [
        { title: "Operations Management — Heizer & Render", url: "https://www.amazon.in/s?k=heizer+render+operations+management", type: "article" },
        { title: "MIT Sloan Operations Blog", url: "https://mitsloan.mit.edu/ideas-made-to-matter/operations", type: "article" },
        { title: "MIT OCW Operations Management", url: "https://ocw.mit.edu/courses/15-760a-introduction-to-operations-management-spring-2004/", type: "course" },
      ],
      subtopics: [
        { name: "Process Design & Capacity", description: "Process maps, bottleneck analysis, capacity planning, Little's Law, queuing theory", difficulty: "intermediate", estimatedHours: 3, keyConcepts: ["Little's Law", "Bottleneck identification", "Capacity utilisation", "Queuing theory"], whyItMatters: "Operations case studies test process thinking; required for consulting and ops roles" },
      ],
    },
    {
      topic: "Strategy & Competitive Analysis",
      description: "Porter's frameworks, competitive positioning, corporate strategy, and strategic cases.",
      estimatedHours: 12,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "Apply Porter's Five Forces and Value Chain to 5 different companies in different industries. Pattern recognition across industries is what distinguishes strong strategy candidates.",
      resources: [
        { title: "Competitive Strategy — Michael Porter", url: "https://www.amazon.in/s?k=competitive+strategy+porter", type: "article" },
        { title: "HBR Strategy Articles", url: "https://hbr.org/topic/strategy", type: "article" },
        { title: "Case Centre Strategy Cases", url: "https://www.thecasecentre.org/educators/products/view?id=1", type: "course" },
      ],
      subtopics: [
        { name: "Porter's Five Forces & Competitive Positioning", description: "Industry attractiveness analysis, generic strategies (cost leadership, differentiation, focus)", difficulty: "foundational", estimatedHours: 3, keyConcepts: ["Five forces analysis", "Cost leadership", "Differentiation strategy", "Focus strategy"], whyItMatters: "Porter's frameworks are used in every strategy case; MBA placement rounds test these heavily" },
        { name: "Corporate Strategy & Growth", description: "Ansoff matrix, BCG matrix, M&A rationale, diversification, international strategy", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["Ansoff matrix", "BCG portfolio", "Synergy types in M&A", "Entry mode selection"], whyItMatters: "Corporate strategy interviews at consulting firms and PE houses require this fluency" },
      ],
    },
    {
      topic: "Organisational Behaviour & HR",
      description: "Leadership, motivation, team dynamics, and HR fundamentals for management roles.",
      estimatedHours: 10,
      interviewFrequency: "medium",
      prerequisites: [],
      studyTip: "Connect every OB theory to a real experience from your own team or internship. 'Describe a time you motivated a team' requires OB theory applied to real stories.",
      resources: [
        { title: "Robbins & Judge Organisational Behaviour", url: "https://www.amazon.in/s?k=robbins+judge+organizational+behavior", type: "article" },
        { title: "Coursera Leading Teams (Michigan)", url: "https://www.coursera.org/learn/leading-teams", type: "course" },
        { title: "McKinsey Org Blog", url: "https://www.mckinsey.com/capabilities/people-and-organizational-performance/our-insights", type: "article" },
      ],
      subtopics: [
        { name: "Motivation & Leadership Theories", description: "Maslow, Herzberg, Vroom's expectancy, transformational vs transactional leadership, situational leadership", difficulty: "foundational", estimatedHours: 3, keyConcepts: ["Herzberg two-factor", "Expectancy theory", "Transformational leadership", "Situational leadership"], whyItMatters: "Leadership and motivation questions appear in every management job interview" },
        { name: "Team Dynamics & Conflict", description: "Tuckman's stages, group think, conflict resolution styles, cross-cultural teams", difficulty: "intermediate", estimatedHours: 3, keyConcepts: ["Tuckman stages", "Groupthink prevention", "Thomas-Kilmann conflict styles", "Cross-cultural teams"], whyItMatters: "Team leadership is assessed in every MBA placement; OB frameworks give structured answers" },
      ],
    },
    {
      topic: "CAT / GMAT Preparation",
      description: "Quantitative aptitude, verbal reasoning, and data interpretation for MBA entrance.",
      estimatedHours: 20,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "Take 1 full-length mock test per week from 3 months before the exam. Analyze every wrong answer immediately after. Mock quality > quantity.",
      resources: [
        { title: "CAT Official Website", url: "https://iimcat.ac.in", type: "docs" },
        { title: "Cracku CAT Preparation (Free)", url: "https://cracku.in/cat", type: "course" },
        { title: "IMS CAT Preparation Blog", url: "https://www.imsindia.com/blog/cat", type: "article" },
      ],
      subtopics: [
        { name: "Quantitative Aptitude", description: "Arithmetic (%, ratio, profit-loss), algebra, geometry, number theory, P&C, probability", difficulty: "intermediate", estimatedHours: 8, keyConcepts: ["Percentage shortcuts", "Geometry area formulas", "P&C formulae", "Remainder theorem"], whyItMatters: "QA is 34% of CAT; the section most amenable to improvement through practice" },
        { name: "Verbal & Reading Comprehension", description: "RC strategy, para-jumbles, critical reasoning, fill-in-the-blanks, grammar", difficulty: "intermediate", estimatedHours: 6, keyConcepts: ["RC skimming strategy", "Para-jumble technique", "Assumption vs inference", "Subject-verb agreement"], whyItMatters: "VARC is 34% of CAT; non-native English speakers must build reading habits early" },
        { name: "Data Interpretation & Logical Reasoning", description: "Tables, bar charts, pie charts, seating arrangements, blood relations, logical puzzles", difficulty: "intermediate", estimatedHours: 6, keyConcepts: ["DI calculation speed", "Approximation technique", "Seating arrangement approach", "Blood relation notation"], whyItMatters: "DILR is 32% of CAT and the most time-pressured section; speed comes only from practice" },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// MEDICAL PROFESSIONAL FALLBACK
// ─────────────────────────────────────────────────────────────────────────────
const MEDICAL_PROFESSIONAL_FALLBACK = {
  meta: {
    label: "Medical Practice & Clinical Skills",
    domain: "medical",
    totalTopics: 5,
    totalSubtopics: 18,
    totalEstimatedHours: 100,
    targetAudience: "Medical graduates and doctors preparing for USMLE, FMGE, or clinical interviews",
    aiSummary: "Clinical reasoning and history-taking are what differentiate good clinicians in interviews. Use case-based learning for every topic — always think diagnosis, investigation, management.",
  },
  topics: [
    {
      topic: "Internal Medicine Essentials",
      description: "Common presentations — chest pain, dyspnea, fever — diagnostic approach and management.",
      estimatedHours: 25,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "For every common presentation, build a 'differential diagnosis pyramid' — life-threatening at top, most common in middle, rare at bottom. This structure impresses clinical interviewers.",
      resources: [
        { title: "Harrison's Principles of Internal Medicine (Key Chapters)", url: "https://accessmedicine.mhmedical.com/book.aspx?bookid=3095", type: "article" },
        { title: "Geeky Medics Clinical Skills", url: "https://geekymedics.com", type: "article" },
        { title: "Amboss Medical Knowledge (Free Trial)", url: "https://www.amboss.com", type: "course" },
      ],
      subtopics: [
        { name: "Cardiovascular Medicine", description: "ACS, heart failure, arrhythmias, hypertension management, valvular disease", difficulty: "foundational", estimatedHours: 6, keyConcepts: ["STEMI vs NSTEMI", "Heart failure classification", "Atrial fibrillation management", "JNC hypertension guidelines"], whyItMatters: "CVD is the #1 cause of death; clinical interviews always include cardiac cases" },
        { name: "Respiratory Medicine", description: "COPD, asthma, pneumonia, pleural effusion, pulmonary embolism, TB management", difficulty: "intermediate", estimatedHours: 6, keyConcepts: ["COPD GOLD staging", "Asthma step therapy", "CAP vs HAP", "PE Wells score"], whyItMatters: "Respiratory presentations are the most common ward admissions and clinical interview cases" },
        { name: "Endocrinology", description: "DM management (type 1/2), thyroid disorders, adrenal insufficiency, DKA/HHS", difficulty: "intermediate", estimatedHours: 6, keyConcepts: ["DM type 2 algorithm", "HbA1c targets", "DKA management", "Thyroid function test interpretation"], whyItMatters: "Diabetes management is the #1 clinical interview topic; FMGE heavily tests endocrinology" },
      ],
    },
    {
      topic: "Surgery & Emergency Medicine",
      description: "Surgical principles, perioperative care, trauma, and emergency presentations.",
      estimatedHours: 20,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Learn ATLS protocols for trauma management. Structured trauma approach (ABCDE) should be automatic — interviewers assess whether your emergency responses are reflex.",
      resources: [
        { title: "Bailey & Love Short Practice of Surgery", url: "https://www.amazon.in/s?k=bailey+and+love+surgery", type: "article" },
        { title: "Surgical Recall App", url: "https://surgicalrecall.com", type: "article" },
        { title: "Life in the Fast Lane (Emergency Medicine)", url: "https://litfl.com", type: "article" },
      ],
      subtopics: [
        { name: "Acute Abdomen", description: "Appendicitis, bowel obstruction, perforation, peritonitis — diagnosis and management", difficulty: "foundational", estimatedHours: 5, keyConcepts: ["Alvarado score", "Rigler's sign", "Rebound tenderness", "Laparotomy indications"], whyItMatters: "Acute abdomen is the most common surgical emergency; always asked in clinical exams" },
        { name: "Trauma & Emergency Management", description: "ATLS primary survey (ABCDE), polytrauma, burns, head injury, shock types", difficulty: "intermediate", estimatedHours: 6, keyConcepts: ["Primary vs secondary survey", "Parkland formula (burns)", "GCS", "Hemorrhagic shock classes"], whyItMatters: "Trauma management is expected knowledge for all doctors; USMLE Step 2 CK heavily tests this" },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// EDUCATION FALLBACK
// ─────────────────────────────────────────────────────────────────────────────
const EDUCATION_FALLBACK = {
  meta: {
    label: "Education — Teaching & Ed-Tech",
    domain: "education",
    totalTopics: 4,
    totalSubtopics: 14,
    totalEstimatedHours: 50,
    targetAudience: "Teachers and educators targeting school, higher education, or ed-tech roles",
    aiSummary: "Effective teachers combine content knowledge with pedagogy. Build your teaching portfolio — record your best lessons and collect student outcome data to demonstrate impact.",
  },
  topics: [
    {
      topic: "Pedagogy & Learning Science",
      description: "How people learn — cognitive science, instructional design, and evidence-based teaching.",
      estimatedHours: 12,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "Read 'Make It Stick' — it summarises decades of learning science in practical principles you can apply in your classroom immediately.",
      resources: [
        { title: "Make It Stick — Brown, Roediger, McDaniel", url: "https://www.amazon.in/s?k=make+it+stick+book", type: "article" },
        { title: "Visible Learning (John Hattie Summary)", url: "https://visible-learning.org", type: "article" },
        { title: "Edutopia Teaching Strategies", url: "https://www.edutopia.org/learning-strategies", type: "article" },
      ],
      subtopics: [
        { name: "Learning Theories", description: "Behaviourism, constructivism (Piaget, Vygotsky), social learning, Bloom's taxonomy", difficulty: "foundational", estimatedHours: 3, keyConcepts: ["Bloom's taxonomy levels", "Zone of proximal development", "Scaffolding", "Active learning"], whyItMatters: "Teaching interview questions always reference learning theory; demonstrates professional grounding" },
        { name: "Instructional Design", description: "UDL, backward design (Wiggins & McTighe), differentiated instruction, assessment design", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["Universal Design for Learning", "Backward design", "Differentiated instruction", "Formative vs summative assessment"], whyItMatters: "Instructional design is the core teaching skill; ed-tech roles specifically test it" },
      ],
    },
    {
      topic: "Classroom Management & Assessment",
      description: "Creating effective learning environments, student engagement, and assessment strategies.",
      estimatedHours: 10,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Video-record yourself teaching and identify your top 3 classroom management strengths and 1 improvement area. This self-awareness is impressive in teaching interviews.",
      resources: [
        { title: "Fred Jones Positive Classroom Discipline", url: "https://www.fredjones.com", type: "article" },
        { title: "Dylan Wiliam Assessment for Learning", url: "https://www.dylanwiliam.org", type: "article" },
        { title: "TeachThought Assessment Strategies", url: "https://www.teachthought.com/pedagogy/formative-assessment/", type: "article" },
      ],
      subtopics: [
        { name: "Classroom Management", description: "Behaviour management frameworks, student engagement, inclusive classrooms, de-escalation", difficulty: "foundational", estimatedHours: 3, keyConcepts: ["Positive reinforcement", "Restorative practices", "SLANT engagement", "De-escalation strategies"], whyItMatters: "Classroom management is tested in every teaching interview with scenario questions" },
        { name: "Assessment & Feedback", description: "Formative assessment techniques, rubric design, peer assessment, data-driven instruction", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["Exit tickets", "Rubric levels", "Peer assessment protocols", "Using data to reteach"], whyItMatters: "Effective feedback is the highest-impact teacher behaviour according to Hattie's meta-analysis" },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// GENERAL STUDENT FALLBACK
// ─────────────────────────────────────────────────────────────────────────────
const GENERAL_STUDENT_FALLBACK = {
  meta: {
    label: "Student Study & Exam Preparation",
    domain: "general",
    totalTopics: 4,
    totalSubtopics: 14,
    totalEstimatedHours: 100,
    targetAudience: "Students building strong academic foundations and exam preparation skills",
    aiSummary: "Exam success is 80% strategy and 20% raw intelligence. Build effective study habits from Day 1 — spaced repetition and active recall beat re-reading every time.",
  },
  topics: [
    {
      topic: "Study Skills & Learning Techniques",
      description: "Evidence-based study methods that actually work — spaced repetition, active recall, and focus.",
      estimatedHours: 15,
      interviewFrequency: "very_high",
      prerequisites: [],
      studyTip: "Stop highlighting and re-reading. Use active recall (close the book and recall what you just read) and spaced repetition (Anki). These are proven to double retention.",
      resources: [
        { title: "Make It Stick (Free Chapter)", url: "https://www.amazon.in/s?k=make+it+stick+learning", type: "article" },
        { title: "Thomas Frank Study Tips (YouTube)", url: "https://www.youtube.com/@ThomasFrank", type: "video" },
        { title: "Anki Spaced Repetition (Free)", url: "https://apps.ankiweb.net", type: "course" },
      ],
      subtopics: [
        { name: "Active Recall & Spaced Repetition", description: "Retrieval practice, Anki flashcards, the Feynman technique, testing effect", difficulty: "foundational", estimatedHours: 4, keyConcepts: ["Retrieval practice", "Spaced repetition intervals", "Feynman technique", "Testing effect"], whyItMatters: "Students who use active recall consistently score 50%+ higher than passive re-readers" },
        { name: "Focus & Time Management", description: "Pomodoro technique, deep work, distraction management, study scheduling", difficulty: "foundational", estimatedHours: 3, keyConcepts: ["Pomodoro technique", "Deep work blocks", "Calendar blocking", "Eliminating distraction"], whyItMatters: "Study hours without focus produce poor results; focus technique multiplies study effectiveness" },
      ],
    },
    {
      topic: "Mathematics Fundamentals",
      description: "Core mathematical skills needed across all streams — arithmetic, algebra, and quantitative reasoning.",
      estimatedHours: 30,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Solve one page of maths problems daily without a calculator. Mental math fluency dramatically speeds up exam performance across all competitive exams.",
      resources: [
        { title: "Khan Academy Mathematics (Free)", url: "https://www.khanacademy.org/math", type: "course" },
        { title: "Maths Wallah (YouTube)", url: "https://www.youtube.com/@MathsWallahOfficial", type: "video" },
        { title: "NCERT Maths Class 11-12 (Free)", url: "https://ncert.nic.in/textbook.php", type: "docs" },
      ],
      subtopics: [
        { name: "Arithmetic & Quantitative Aptitude", description: "Percentages, profit-loss, ratio-proportion, time-work, time-distance", difficulty: "foundational", estimatedHours: 10, keyConcepts: ["Percentage change formula", "Profit-loss percentage", "Ratio partition", "Speed-distance-time"], whyItMatters: "Quantitative aptitude is tested in every competitive exam including placement rounds" },
        { name: "Algebra & Functions", description: "Equations, inequalities, quadratics, functions and graphs, progressions", difficulty: "intermediate", estimatedHours: 10, keyConcepts: ["Quadratic formula", "AM-GM inequality", "AP/GP formulae", "Function composition"], whyItMatters: "Algebra is the language of mathematics; foundation for science, engineering, and management" },
      ],
    },
    {
      topic: "English Communication",
      description: "Grammar, vocabulary, reading comprehension, and writing for exams and career.",
      estimatedHours: 25,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Read one English newspaper article (The Hindu or Times of India) every morning and note 3 new words with their usage. Vocabulary built in context sticks permanently.",
      resources: [
        { title: "BBC Learning English (Free)", url: "https://www.bbc.co.uk/learningenglish", type: "course" },
        { title: "Wren & Martin English Grammar (Classic)", url: "https://www.amazon.in/s?k=wren+and+martin+english+grammar", type: "article" },
        { title: "The Hindu Vocabulary Builder", url: "https://www.thehindu.com", type: "article" },
      ],
      subtopics: [
        { name: "Grammar & Usage", description: "Subject-verb agreement, tense consistency, prepositions, articles, common errors", difficulty: "foundational", estimatedHours: 8, keyConcepts: ["Subject-verb agreement", "Tense sequence", "Preposition usage", "Articles a/an/the"], whyItMatters: "Grammar is tested in every competitive exam verbal section; errors cost marks" },
        { name: "Reading Comprehension", description: "Inference, main idea, tone, vocabulary in context, skimming and scanning strategies", difficulty: "intermediate", estimatedHours: 8, keyConcepts: ["Main idea identification", "Author's tone", "Inference vs stated fact", "Skimming technique"], whyItMatters: "RC is 30-40% of verbal sections in CAT, CLAT, and placement tests" },
      ],
    },
    {
      topic: "General Knowledge & Current Affairs",
      description: "Indian and world affairs, science, sports, and static GK for competitive exams.",
      estimatedHours: 30,
      interviewFrequency: "high",
      prerequisites: [],
      studyTip: "Build a monthly current affairs PDF summary. After 6 months of monthly summaries, you'll have a powerful revision resource covering all major events.",
      resources: [
        { title: "Inshorts News App (5-minute summaries)", url: "https://inshorts.com", type: "article" },
        { title: "GKToday Current Affairs", url: "https://www.gktoday.in", type: "article" },
        { title: "Vajiram & Ravi Monthly Magazine", url: "https://www.vajiramandravi.com/monthly-magazine/", type: "article" },
      ],
      subtopics: [
        { name: "Current Affairs (Monthly)", description: "National events, international relations, economy, science, sports — monthly compilation", difficulty: "foundational", estimatedHours: 10, keyConcepts: ["Government schemes", "International summits", "Science achievements", "Sports results"], whyItMatters: "Current affairs are in every competitive exam; consistent daily reading compounds over months" },
        { name: "Static GK", description: "Indian geography, history highlights, polity basics, science facts, national symbols", difficulty: "foundational", estimatedHours: 10, keyConcepts: ["National capitals", "Constitutional articles", "Scientific discoveries", "Historical dates"], whyItMatters: "Static GK provides the context for current affairs questions in every exam" },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Keep existing fallbacks from original file
// ─────────────────────────────────────────────────────────────────────────────

const SOFTWARE_FALLBACK = {
  meta: { label: "Software Engineering", domain: "software", totalTopics: 6, totalSubtopics: 24, totalEstimatedHours: 120, targetAudience: "Software engineers targeting SDE-2/Senior roles", aiSummary: "Focus on DSA and System Design first — these form 80% of technical interviews. Strengthen JavaScript/Python fundamentals before tackling advanced patterns." },
  topics: [
    { topic: "Data Structures & Algorithms", description: "Core DSA patterns tested in every top tech company interview.", estimatedHours: 40, interviewFrequency: "very_high", prerequisites: [], studyTip: "Solve 2-3 problems daily on a timer. Focus on patterns, not solutions.", resources: [{ title: "NeetCode 150", url: "https://neetcode.io/practice", type: "course" }, { title: "CP-Algorithms", url: "https://cp-algorithms.com", type: "article" }, { title: "Back To Back SWE (YouTube)", url: "https://www.youtube.com/@BackToBackSWE", type: "video" }], subtopics: [{ name: "Arrays & Strings", description: "Two-pointer, sliding window, prefix sums, Kadane's algorithm", difficulty: "foundational", estimatedHours: 6, keyConcepts: ["Two pointer", "Sliding window", "Prefix sum", "Kadane's algorithm"], whyItMatters: "Asked in 90%+ of interviews" }, { name: "Trees & Graphs", description: "BFS, DFS, topological sort, shortest paths", difficulty: "intermediate", estimatedHours: 8, keyConcepts: ["BFS", "DFS", "Topological sort", "Dijkstra"], whyItMatters: "Graph problems dominate FAANG interviews" }, { name: "Dynamic Programming", description: "Memoization, tabulation, 1D/2D DP", difficulty: "advanced", estimatedHours: 10, keyConcepts: ["Memoization", "Tabulation", "State transition", "Optimal substructure"], whyItMatters: "Differentiates senior engineers" }, { name: "Heaps & Backtracking", description: "Priority queues, subsets, permutations", difficulty: "advanced", estimatedHours: 6, keyConcepts: ["Heap operations", "Pruning", "Combinations", "Constraint propagation"], whyItMatters: "Common in Google and Amazon interviews" }] },
    { topic: "System Design", description: "Design scalable distributed systems. Critical for senior roles.", estimatedHours: 25, interviewFrequency: "very_high", prerequisites: ["Data Structures & Algorithms"], studyTip: "For every system, ask: what breaks at 10x scale?", resources: [{ title: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer", type: "article" }, { title: "ByteByteGo Newsletter", url: "https://blog.bytebytego.com", type: "article" }, { title: "Gaurav Sen (YouTube)", url: "https://www.youtube.com/@gkcs", type: "video" }], subtopics: [{ name: "Scalability & Load Balancing", description: "Horizontal scaling, consistent hashing, stateless services", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["Horizontal scaling", "Load balancing", "Consistent hashing", "Stateless services"], whyItMatters: "First topic in every system design interview" }, { name: "Databases & Caching", description: "SQL vs NoSQL, indexing, sharding, Redis", difficulty: "advanced", estimatedHours: 8, keyConcepts: ["B-tree indexes", "Database sharding", "Cache-aside pattern", "CAP theorem"], whyItMatters: "Storage design mistakes cause most production outages" }, { name: "Message Queues & APIs", description: "Kafka, pub/sub, REST vs GraphQL, rate limiting", difficulty: "advanced", estimatedHours: 7, keyConcepts: ["Pub/sub pattern", "Kafka partitions", "REST principles", "Token bucket algorithm"], whyItMatters: "Modern distributed systems depend on async messaging" }] },
    { topic: "JavaScript & React", description: "Advanced JavaScript and React — core for frontend/full-stack roles.", estimatedHours: 20, interviewFrequency: "high", prerequisites: [], studyTip: "Build a production-like app with auth and real-time updates.", resources: [{ title: "JavaScript.info", url: "https://javascript.info", type: "docs" }, { title: "React Docs", url: "https://react.dev", type: "docs" }, { title: "Kent C. Dodds Blog", url: "https://kentcdodds.com/blog", type: "article" }], subtopics: [{ name: "JavaScript Core", description: "Event loop, closures, prototypes, async/await", difficulty: "intermediate", estimatedHours: 6, keyConcepts: ["Event loop", "Closures", "Promise execution", "Prototype chain"], whyItMatters: "Deep JS knowledge separates senior frontend engineers" }, { name: "React Hooks & Performance", description: "useState, useEffect, React.memo, useMemo, useCallback", difficulty: "intermediate", estimatedHours: 6, keyConcepts: ["useState batching", "useEffect cleanup", "React.memo", "React Profiler"], whyItMatters: "Performance is the most common senior React interview topic" }, { name: "State Management & SSR", description: "Context, Zustand, Redux Toolkit, Next.js SSR/SSG", difficulty: "advanced", estimatedHours: 6, keyConcepts: ["Redux Toolkit", "React Query", "SSR vs SSG", "Server Components"], whyItMatters: "State and rendering decisions define application architecture" }] },
  ],
};

const DATA_SCIENCE_FALLBACK = {
  meta: { label: "Data Science & Machine Learning", domain: "data_science", totalTopics: 5, totalSubtopics: 20, totalEstimatedHours: 100, targetAudience: "Data scientists targeting DS/MLE roles", aiSummary: "Statistics and ML fundamentals are tested at every DS interview. Build strong SQL skills alongside — most DS roles require heavy data manipulation before any modelling." },
  topics: [
    { topic: "Statistics & Probability", description: "The mathematical backbone of all ML.", estimatedHours: 20, interviewFrequency: "very_high", prerequisites: [], studyTip: "Implement distributions and tests from scratch in NumPy.", resources: [{ title: "StatQuest (YouTube)", url: "https://www.youtube.com/@statquest", type: "video" }, { title: "Think Stats (Free)", url: "https://greenteapress.com/wp/think-stats-2e/", type: "article" }, { title: "Seeing Theory", url: "https://seeing-theory.brown.edu", type: "article" }], subtopics: [{ name: "Probability Distributions", description: "Normal, Binomial, Poisson, CLT", difficulty: "foundational", estimatedHours: 4, keyConcepts: ["Normal distribution", "CLT", "PDF vs CDF", "Moment generating functions"], whyItMatters: "Every ML model makes distributional assumptions" }, { name: "Hypothesis Testing", description: "p-values, Type I/II errors, t-test, chi-square", difficulty: "intermediate", estimatedHours: 5, keyConcepts: ["p-value", "Type I/II errors", "Statistical power", "Multiple testing"], whyItMatters: "A/B testing is central to DS roles" }, { name: "Experimental Design", description: "A/B testing, power calculation, confounding", difficulty: "advanced", estimatedHours: 4, keyConcepts: ["Sample size", "Randomization", "Confounding control", "Sequential testing"], whyItMatters: "Designing valid experiments is the most business-critical DS skill" }] },
    { topic: "Machine Learning Core", description: "Supervised, unsupervised, and ensemble methods.", estimatedHours: 25, interviewFrequency: "very_high", prerequisites: ["Statistics & Probability"], studyTip: "For every algorithm, know the math, what breaks it, and a production failure mode.", resources: [{ title: "Hands-On ML (GitHub)", url: "https://github.com/ageron/handson-ml3", type: "article" }, { title: "fast.ai Practical DL", url: "https://course.fast.ai", type: "course" }, { title: "Andrej Karpathy (YouTube)", url: "https://www.youtube.com/@AndrejKarpathy", type: "video" }], subtopics: [{ name: "Supervised Learning", description: "Linear/logistic regression, decision trees, random forests, XGBoost", difficulty: "foundational", estimatedHours: 6, keyConcepts: ["Gradient descent", "Decision boundary", "Ensemble methods", "Bias-variance tradeoff"], whyItMatters: "Core of 80% of production ML" }, { name: "Model Evaluation", description: "Cross-validation, AUC-ROC, F1, learning curves", difficulty: "intermediate", estimatedHours: 5, keyConcepts: ["K-fold CV", "AUC-ROC", "Precision-recall tradeoff", "Learning curves"], whyItMatters: "Wrong metric costs business outcomes" }, { name: "Feature Engineering & Unsupervised", description: "Encoding, PCA, K-Means, anomaly detection", difficulty: "intermediate", estimatedHours: 6, keyConcepts: ["One-hot encoding", "PCA", "K-Means convergence", "Isolation Forest"], whyItMatters: "Features determine model ceiling" }] },
    { topic: "SQL for Analytics", description: "Advanced SQL for data manipulation at scale.", estimatedHours: 15, interviewFrequency: "very_high", prerequisites: [], studyTip: "Solve every LeetCode SQL medium before interviews.", resources: [{ title: "Mode SQL Tutorial", url: "https://mode.com/sql-tutorial/", type: "course" }, { title: "LeetCode SQL 50", url: "https://leetcode.com/studyplan/top-sql-50/", type: "course" }, { title: "Use The Index, Luke", url: "https://use-the-index-luke.com", type: "article" }], subtopics: [{ name: "Window Functions", description: "ROW_NUMBER, RANK, LAG/LEAD, running totals", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["PARTITION BY", "LAG/LEAD", "RANGE vs ROWS", "Cumulative sum"], whyItMatters: "Tested in 80% of DS SQL interviews" }, { name: "Query Optimization", description: "Execution plans, partition pruning, materializing subqueries", difficulty: "advanced", estimatedHours: 4, keyConcepts: ["EXPLAIN plan", "Partition pruning", "Index scan vs full scan", "CTE performance"], whyItMatters: "DS queries on billion-row tables must be optimized" }] },
  ],
};

const PRODUCT_FALLBACK = {
  meta: { label: "Product Management", domain: "product", totalTopics: 4, totalSubtopics: 16, totalEstimatedHours: 60, targetAudience: "PMs targeting product roles at tech companies", aiSummary: "Product sense and metrics questions are the core of PM interviews. Dissect every app you use with PM thinking." },
  topics: [
    { topic: "Product Sense & Strategy", description: "Designing products, identifying opportunities, strategic trade-offs.", estimatedHours: 15, interviewFrequency: "very_high", prerequisites: [], studyTip: "Do product teardowns weekly.", resources: [{ title: "Lenny's Newsletter", url: "https://www.lennysnewsletter.com", type: "article" }, { title: "Reforge Blog", url: "https://www.reforge.com/blog", type: "article" }, { title: "Exponent PM Course", url: "https://www.tryexponent.com", type: "course" }], subtopics: [{ name: "Product Frameworks", description: "CIRCLES, HEART, JTBD, opportunity trees", difficulty: "foundational", estimatedHours: 3, keyConcepts: ["JTBD framework", "North star metric", "Opportunity solution tree", "HEART framework"], whyItMatters: "All top PM interviews assess product sense" }, { name: "Prioritization & Market Sizing", description: "RICE, ICE, TAM/SAM/SOM, unit economics", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["RICE scoring", "TAM estimation", "Unit economics", "Bottoms-up sizing"], whyItMatters: "Every PM interview includes prioritization questions" }] },
    { topic: "Metrics & Analytics", description: "Define, measure, and analyze product metrics.", estimatedHours: 12, interviewFrequency: "very_high", prerequisites: [], studyTip: "For every product change, hypothesize what metric it moves.", resources: [{ title: "Amplitude Analytics Academy", url: "https://academy.amplitude.com", type: "course" }, { title: "GoPractice Simulator", url: "https://gopractice.io", type: "course" }, { title: "Mixpanel Blog", url: "https://mixpanel.com/blog/product-analytics/", type: "article" }], subtopics: [{ name: "Metric Trees & A/B Testing", description: "North star decomposition, A/B test design, statistical significance", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["Metric decomposition", "Statistical significance", "Sample size", "Guardrail metrics"], whyItMatters: "Metric definition is tested in 90%+ of PM interviews" }, { name: "Metric Diagnosis", description: "Debugging metric drops, segmentation, instrumentation", difficulty: "advanced", estimatedHours: 3, keyConcepts: ["Root cause analysis", "Segmentation", "External vs internal factors", "Instrumentation"], whyItMatters: "Metric dropped 20% is the most common PM case type" }] },
  ],
};

const DEVOPS_FALLBACK = {
  meta: { label: "DevOps & Cloud Engineering", domain: "devops", totalTopics: 4, totalSubtopics: 14, totalEstimatedHours: 80, targetAudience: "Engineers targeting DevOps, SRE, or Cloud roles", aiSummary: "Kubernetes and CI/CD are core. Cloud certifications are valued but hands-on experience differentiates candidates." },
  topics: [
    { topic: "Containers & Kubernetes", description: "Docker through K8s production patterns.", estimatedHours: 20, interviewFrequency: "very_high", prerequisites: [], studyTip: "Deploy a multi-service app on local K8s and debug 3 failure scenarios.", resources: [{ title: "Kubernetes Docs", url: "https://kubernetes.io/docs/home/", type: "docs" }, { title: "TechWorld with Nana (YouTube)", url: "https://www.youtube.com/@TechWorldwithNana", type: "video" }, { title: "Killer.sh K8s Practice", url: "https://killer.sh", type: "course" }], subtopics: [{ name: "Docker & Containerization", description: "Dockerfile best practices, multi-stage builds, networking", difficulty: "foundational", estimatedHours: 4, keyConcepts: ["Dockerfile layers", "Multi-stage builds", "Docker networking", "Volume management"], whyItMatters: "Containers are the deployment unit of every cloud-native app" }, { name: "Kubernetes Core & Networking", description: "Pods, Deployments, Services, Ingress, RBAC", difficulty: "intermediate", estimatedHours: 8, keyConcepts: ["Pod lifecycle", "ClusterIP vs NodePort", "Ingress controller", "RBAC"], whyItMatters: "K8s is the orchestration standard; all cloud platforms run on it" }] },
    { topic: "CI/CD & Cloud (AWS/GCP)", description: "Pipelines, IaC, and cloud platform essentials.", estimatedHours: 20, interviewFrequency: "very_high", prerequisites: [], studyTip: "Build complete pipeline from commit to production with automated rollback.", resources: [{ title: "GitHub Actions Docs", url: "https://docs.github.com/en/actions", type: "docs" }, { title: "AWS Well-Architected", url: "https://aws.amazon.com/architecture/well-architected/", type: "docs" }, { title: "Cloud Resume Challenge", url: "https://cloudresumechallenge.dev", type: "course" }], subtopics: [{ name: "CI/CD Pipelines & GitOps", description: "GitHub Actions, Argo CD, deployment strategies (blue/green, canary)", difficulty: "intermediate", estimatedHours: 6, keyConcepts: ["Pipeline stages", "Blue/green deployment", "Argo CD", "GitOps principles"], whyItMatters: "CI/CD quality determines deployment frequency" }, { name: "Infrastructure as Code", description: "Terraform, CloudFormation, state management", difficulty: "advanced", estimatedHours: 6, keyConcepts: ["Terraform state", "HCL modules", "CloudFormation stacks", "Drift detection"], whyItMatters: "Manual cloud infrastructure doesn't scale; IaC is standard" }] },
  ],
};

const CYBERSECURITY_FALLBACK = {
  meta: { label: "Cybersecurity", domain: "cybersecurity", totalTopics: 3, totalSubtopics: 10, totalEstimatedHours: 60, targetAudience: "Security engineers targeting AppSec or penetration testing roles", aiSummary: "Hands-on CTF practice separates security candidates. Build a home lab and understand the 'why' behind every attack vector." },
  topics: [
    { topic: "Web Application Security", description: "OWASP Top 10 and secure coding.", estimatedHours: 20, interviewFrequency: "very_high", prerequisites: [], studyTip: "Complete PortSwigger Web Security Academy modules hands-on.", resources: [{ title: "PortSwigger Web Security Academy", url: "https://portswigger.net/web-security", type: "course" }, { title: "OWASP Testing Guide", url: "https://owasp.org/www-project-web-security-testing-guide/", type: "docs" }, { title: "HackTheBox Academy", url: "https://academy.hackthebox.com", type: "course" }], subtopics: [{ name: "Injection & Auth Attacks", description: "SQL injection, XSS, CSRF, JWT vulnerabilities, session security", difficulty: "foundational", estimatedHours: 6, keyConcepts: ["SQL injection", "XSS types", "CSRF tokens", "JWT alg:none"], whyItMatters: "Injection is OWASP #1; every AppSec interview expects hands-on knowledge" }, { name: "API & Auth Security", description: "OAuth flaws, password storage, MFA, API security", difficulty: "intermediate", estimatedHours: 5, keyConcepts: ["OAuth misconfigurations", "bcrypt/Argon2", "API authentication", "Rate limiting"], whyItMatters: "Auth vulnerabilities cause the most damaging breaches" }] },
  ],
};

const NEET_FALLBACK = {
  meta: { label: "NEET 2025 Preparation (PCB)", domain: "medical", totalTopics: 4, totalSubtopics: 16, totalEstimatedHours: 700, targetAudience: "Class 11-12 students preparing for NEET UG", aiSummary: "Biology is 360/720 marks — prioritize it above all. NCERT is the Bible; read it multiple times. Solve 100+ MCQs daily." },
  topics: [
    { topic: "Biology — Botany & Zoology", description: "Plant and animal biology from NCERT — covers 360 marks in NEET.", estimatedHours: 250, interviewFrequency: "very_high", prerequisites: [], studyTip: "Draw every diagram from memory. NEET asks 5-8 diagram-based questions yearly.", resources: [{ title: "NCERT Biology Class 11 (Free)", url: "https://ncert.nic.in/textbook.php?kebo1=0-22", type: "docs" }, { title: "Vedantu NEET Biology", url: "https://www.vedantu.com/neet/biology", type: "video" }, { title: "NCERT Class 12 Biology (Free)", url: "https://ncert.nic.in/textbook.php?lebo1=0-16", type: "docs" }], subtopics: [{ name: "Cell Biology & Division", description: "Cell organelles, mitosis, meiosis, cell cycle", difficulty: "foundational", estimatedHours: 30, keyConcepts: ["Cell organelles", "Mitosis stages", "Meiosis stages", "Cell cycle checkpoints"], whyItMatters: "6-8 NEET questions every year" }, { name: "Human Physiology", description: "Digestion, circulation (cardiac cycle), respiration, excretion, nervous system", difficulty: "foundational", estimatedHours: 50, keyConcepts: ["Cardiac cycle", "Nephron filtration", "Nerve impulse", "Digestive enzymes"], whyItMatters: "15-18 NEET questions annually" }, { name: "Genetics & Biotechnology", description: "Mendelian genetics, DNA replication, PCR, rDNA technology", difficulty: "advanced", estimatedHours: 50, keyConcepts: ["Mendel's laws", "DNA replication enzymes", "Restriction enzymes", "PCR technique"], whyItMatters: "12-15 questions per year; frequently tricky" }, { name: "Ecology & Plant Physiology", description: "Ecosystems, photosynthesis, transpiration, plant hormones", difficulty: "intermediate", estimatedHours: 40, keyConcepts: ["Ecological pyramids", "Calvin cycle", "Light reactions", "Auxin effects"], whyItMatters: "18-20 questions annually" }] },
    { topic: "Chemistry (NEET)", description: "Organic, inorganic, and physical chemistry balanced across NEET.", estimatedHours: 200, interviewFrequency: "high", prerequisites: [], studyTip: "Named reactions need flash cards — NEET asks 10+ named reactions yearly.", resources: [{ title: "NCERT Chemistry Class 12 (Free)", url: "https://ncert.nic.in/textbook.php?lech1=0-16", type: "docs" }, { title: "Arvind Arora Chemistry (YouTube)", url: "https://www.youtube.com/@ArvindAroraOfficial", type: "video" }, { title: "NCERT Chemistry Class 11 (Free)", url: "https://ncert.nic.in/textbook.php?kech1=0-14", type: "docs" }], subtopics: [{ name: "Organic Chemistry", description: "IUPAC nomenclature, reaction mechanisms, named reactions, biomolecules", difficulty: "advanced", estimatedHours: 60, keyConcepts: ["SN1 vs SN2", "Aldol condensation", "Biomolecule structures", "Polymer types"], whyItMatters: "13-15 NEET questions" }, { name: "Inorganic & Physical Chemistry", description: "Periodic trends, bonding (VSEPR), equilibrium, electrochemistry, kinetics", difficulty: "intermediate", estimatedHours: 70, keyConcepts: ["VSEPR theory", "Le Chatelier", "Nernst equation", "Rate law"], whyItMatters: "18-22 NEET questions" }] },
    { topic: "Physics (NEET)", description: "Mechanics, electromagnetism, optics — 180 marks.", estimatedHours: 180, interviewFrequency: "high", prerequisites: [], studyTip: "NCERT derivations are directly asked. Solve NCERT exercises first.", resources: [{ title: "NCERT Physics Class 12 (Free)", url: "https://ncert.nic.in/textbook.php?leph1=0-15", type: "docs" }, { title: "Physics Wallah (YouTube)", url: "https://www.youtube.com/@PhysicsWallah", type: "video" }, { title: "DC Pandey NEET Physics", url: "https://www.arihantbooks.com", type: "article" }], subtopics: [{ name: "Mechanics & Electromagnetism", description: "Kinematics, Newton's laws, Gauss's law, Kirchhoff, Faraday", difficulty: "intermediate", estimatedHours: 70, keyConcepts: ["Equations of motion", "Work-energy theorem", "Gauss's law", "Faraday/Lenz"], whyItMatters: "20-25 NEET questions" }, { name: "Optics & Modern Physics", description: "Refraction, wave optics, photoelectric effect, nuclear physics", difficulty: "intermediate", estimatedHours: 50, keyConcepts: ["Snell's law", "Young's double slit", "Photoelectric effect", "Nuclear binding energy"], whyItMatters: "10-12 NEET questions" }] },
    { topic: "NEET Exam Strategy", description: "Mock tests, PYQ analysis, and revision tactics.", estimatedHours: 50, interviewFrequency: "very_high", prerequisites: ["Biology — Botany & Zoology", "Chemistry (NEET)", "Physics (NEET)"], studyTip: "Analyze every wrong answer — concept gap or calculation error? Keep an error log.", resources: [{ title: "NEET PYQs (NTA Official)", url: "https://nta.ac.in/neet", type: "docs" }, { title: "Allen Test Series", url: "https://www.allen.ac.in/online/national-test-series", type: "course" }, { title: "Unacademy NEET Mock Tests", url: "https://unacademy.com/goal/neet-ug/MDICAL/mock", type: "course" }], subtopics: [{ name: "PYQ Analysis & Mock Tests", description: "Last 10 years pattern, chapter-wise frequency, full-length mocks", difficulty: "foundational", estimatedHours: 25, keyConcepts: ["Chapter-wise frequency", "NCERT-direct questions", "Negative marking strategy", "Time allocation"], whyItMatters: "30-40% of NEET questions are near-identical to PYQs" }] },
  ],
};

const JEE_FALLBACK = {
  meta: { label: "JEE Main + Advanced Preparation (PCM)", domain: "engineering", totalTopics: 3, totalSubtopics: 12, totalEstimatedHours: 700, targetAudience: "Class 11-12 students targeting JEE Main and Advanced (IITs)", aiSummary: "JEE Advanced rewards deep conceptual understanding. Spend 70% on Maths and Physics — Chemistry is the fastest score booster. One topic at a time, done deeply." },
  topics: [
    { topic: "Mathematics", description: "Calculus, algebra, coordinate geometry, probability — highest JEE weightage.", estimatedHours: 200, interviewFrequency: "very_high", prerequisites: [], studyTip: "For every problem you can't solve, write why — concept gap or technique gap?", resources: [{ title: "3Blue1Brown Calculus (YouTube)", url: "https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr", type: "video" }, { title: "Cengage JEE Maths", url: "https://www.amazon.in/s?k=cengage+maths+jee", type: "article" }, { title: "JEE Mains Previous Papers (NTA)", url: "https://jeemain.nta.ac.in/", type: "docs" }], subtopics: [{ name: "Calculus & Algebra", description: "Limits, integration, complex numbers, matrices, sequences", difficulty: "intermediate", estimatedHours: 80, keyConcepts: ["L'Hopital's rule", "Integration by parts", "Complex number geometry", "Binomial theorem"], whyItMatters: "Calculus is 15-18% JEE weightage; algebra is 13-15%" }, { name: "Coordinate Geometry & Trigonometry", description: "Conics, straight lines, circles, trigonometric identities, vectors", difficulty: "intermediate", estimatedHours: 70, keyConcepts: ["Conic standard forms", "Compound angle formulas", "Dot and cross products", "Direction cosines"], whyItMatters: "10-12% JEE weightage; visual understanding required" }] },
    { topic: "Physics", description: "Mechanics, electromagnetism, waves, modern physics.", estimatedHours: 220, interviewFrequency: "very_high", prerequisites: [], studyTip: "Read theory, solve NCERT, then HC Verma. Derive every formula yourself.", resources: [{ title: "HC Verma Concepts of Physics", url: "https://www.amazon.in/s?k=HC+Verma+concepts+of+physics", type: "article" }, { title: "Aman Dhattarwal Physics JEE (YouTube)", url: "https://www.youtube.com/@AmanDhattarwal", type: "video" }, { title: "JEE Advanced Previous Papers (IIT)", url: "https://jeeadv.ac.in/", type: "docs" }], subtopics: [{ name: "Mechanics & Thermodynamics", description: "Kinematics, Newton's laws, SHM, rotational dynamics, thermodynamic cycles", difficulty: "intermediate", estimatedHours: 80, keyConcepts: ["Rotational dynamics", "SHM equations", "Carnot engine", "Bernoulli's theorem"], whyItMatters: "Mechanics is 25-28% JEE; thermodynamics 10%" }, { name: "Electromagnetism & Modern Physics", description: "Gauss's law, Faraday's law, wave optics, photoelectric, nuclear", difficulty: "intermediate", estimatedHours: 80, keyConcepts: ["Gauss's law", "Faraday/Lenz", "Young's double slit", "de Broglie wavelength"], whyItMatters: "EM is 22-25%; modern physics is entirely fact-based scoring" }] },
    { topic: "Chemistry", description: "Organic mechanisms, inorganic NCERT, physical numericals.", estimatedHours: 170, interviewFrequency: "high", prerequisites: [], studyTip: "Organic: mechanisms first, named reactions second. Inorganic: NCERT line-by-line.", resources: [{ title: "NCERT Chemistry Class 11 & 12 (Free)", url: "https://ncert.nic.in/textbook.php", type: "docs" }, { title: "Pahul Sir JEE Chemistry (YouTube)", url: "https://www.youtube.com/@PahulSirJEEChem", type: "video" }, { title: "VK Jaiswal Inorganic Chemistry", url: "https://www.amazon.in/s?k=VK+Jaiswal+inorganic+chemistry+jee", type: "article" }], subtopics: [{ name: "Organic Chemistry", description: "GOC, reaction mechanisms (SN1/SN2/E), named reactions, biomolecules", difficulty: "advanced", estimatedHours: 60, keyConcepts: ["Electronic effects", "SN1 vs SN2", "Named reactions", "Polymer classification"], whyItMatters: "Highest organic weightage; JEE Advanced tests multi-step conversions" }, { name: "Inorganic & Physical Chemistry", description: "Periodic trends, bonding, d-block, thermodynamics, electrochemistry, kinetics", difficulty: "intermediate", estimatedHours: 70, keyConcepts: ["VSEPR geometry", "Crystal field theory", "Hess's law", "Arrhenius equation"], whyItMatters: "Inorganic is NCERT-based; physical has numerical questions" }] },
  ],
};

const COMMERCE_FALLBACK = {
  meta: { label: "Commerce — CA Foundation / CUET", domain: "commerce", totalTopics: 4, totalSubtopics: 14, totalEstimatedHours: 300, targetAudience: "Class 11-12 Commerce students targeting CA Foundation or CUET", aiSummary: "Accountancy is the backbone — master double-entry and financial statements first. Maths/Stats is the easiest scoring subject with consistent numerical practice." },
  topics: [
    { topic: "Accountancy", description: "Journal entries to financial statements — the most important Commerce subject.", estimatedHours: 120, interviewFrequency: "very_high", prerequisites: [], studyTip: "Practice complete bookkeeping from scratch: journal → ledger → trial balance → final accounts.", resources: [{ title: "NCERT Accountancy Class 12 (Free)", url: "https://ncert.nic.in/textbook.php?lach1=0-10", type: "docs" }, { title: "CA Foundation Study Material (ICAI)", url: "https://www.icai.org/new_post.html?post_id=14868", type: "docs" }, { title: "T.S. Grewal Solutions (YouTube)", url: "https://www.youtube.com/@AccountancyClass12", type: "video" }], subtopics: [{ name: "Financial Statements & Adjustments", description: "Trading account, P&L, balance sheet, adjustments, ratio analysis", difficulty: "foundational", estimatedHours: 30, keyConcepts: ["Gross profit", "Net profit", "Current ratio", "Adjustment entries"], whyItMatters: "25-30% of Accountancy marks" }, { name: "Partnership & Company Accounts", description: "Admission, retirement, death, dissolution, share capital, debentures", difficulty: "advanced", estimatedHours: 40, keyConcepts: ["Goodwill methods", "Revaluation account", "Forfeiture of shares", "Cash flow statement"], whyItMatters: "Partnership is highest-marks Accountancy chapter" }] },
    { topic: "Business Studies & Economics", description: "Management theories, marketing, and Indian/world economics.", estimatedHours: 100, interviewFrequency: "high", prerequisites: [], studyTip: "Connect every management concept to a real-world company example.", resources: [{ title: "NCERT Business Studies Class 12 (Free)", url: "https://ncert.nic.in/textbook.php?lbst1=0-12", type: "docs" }, { title: "NCERT Economics Class 12 (Free)", url: "https://ncert.nic.in/textbook.php?liec1=0-9", type: "docs" }, { title: "Commerce Wallah (YouTube)", url: "https://www.youtube.com/@CommerceWallahbyPW", type: "video" }], subtopics: [{ name: "Management & Marketing", description: "Fayol's principles, STP, 4Ps, consumer behaviour", difficulty: "foundational", estimatedHours: 25, keyConcepts: ["Fayol's 14 principles", "Marketing mix", "Product lifecycle", "Consumer decision journey"], whyItMatters: "Foundation of Business Studies; 25-30% of marks" }, { name: "Micro & Macroeconomics", description: "Demand/supply, market structures, national income, monetary/fiscal policy", difficulty: "intermediate", estimatedHours: 35, keyConcepts: ["Price elasticity", "GDP measurement", "Fiscal deficit", "Monetary policy tools"], whyItMatters: "50% of Economics board exam" }] },
  ],
};

const GENERAL_FALLBACK = {
  meta: { label: "General Career Preparation", domain: "general", totalTopics: 4, totalSubtopics: 14, totalEstimatedHours: 40, targetAudience: "Professionals building foundational career skills", aiSummary: "Strong behavioural storytelling and clear communication differentiate you in any interview. Build 8-10 rich STAR stories adaptable to different questions." },
  topics: [
    { topic: "Behavioural Interview Mastery", description: "Structured storytelling using STAR for any company or role.", estimatedHours: 12, interviewFrequency: "very_high", prerequisites: [], studyTip: "Record yourself answering 5 questions on video and watch it back — your structure and pacing will be immediately obvious.", resources: [{ title: "Jeff H Sipe (YouTube)", url: "https://www.youtube.com/@JeffHSipe", type: "video" }, { title: "Amazon Leadership Principles", url: "https://www.amazon.jobs/en/principles", type: "article" }, { title: "Big Interview Practice", url: "https://biginterview.com", type: "course" }], subtopics: [{ name: "STAR Method & Storytelling", description: "Crafting stories with measurable outcomes and clear narrative", difficulty: "foundational", estimatedHours: 3, keyConcepts: ["Situation framing", "Specific actions", "Quantified results", "Lessons learned"], whyItMatters: "Every major company uses STAR; good structure alone moves candidates to offers" }, { name: "Leadership, Conflict & Failure", description: "Ownership, conflict resolution, failure and growth mindset stories", difficulty: "intermediate", estimatedHours: 5, keyConcepts: ["Ownership examples", "Conflict resolution", "Disagree and commit", "Root cause analysis"], whyItMatters: "These question types reveal emotional intelligence and professional maturity" }] },
    { topic: "Communication & Problem Solving", description: "Clear communication, structured thinking, and data-driven decisions.", estimatedHours: 10, interviewFrequency: "high", prerequisites: [], studyTip: "Apply a framework (MECE, issue tree, 5 Whys) to real problems you encounter at work.", resources: [{ title: "Pyramid Principle (Minto)", url: "https://www.amazon.in/s?k=pyramid+principle+minto", type: "article" }, { title: "TED Talks on Communication", url: "https://www.ted.com/topics/communication", type: "video" }, { title: "Toastmasters International", url: "https://www.toastmasters.org", type: "course" }], subtopics: [{ name: "Structured Problem Solving", description: "MECE, issue trees, root cause analysis, hypothesis-driven approaches", difficulty: "foundational", estimatedHours: 3, keyConcepts: ["MECE", "Issue tree", "5 Whys", "Hypothesis testing"], whyItMatters: "Consulting and product interviews directly test structured decomposition" }, { name: "Executive Communication", description: "BLUF writing, presentation structure, data storytelling", difficulty: "intermediate", estimatedHours: 4, keyConcepts: ["BLUF structure", "Pyramid principle", "Data labeling", "Audience adaptation"], whyItMatters: "Clear communication accelerates career growth at every level" }] },
  ],
};

export default router;