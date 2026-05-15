// backend/routes/assessments.js
// Assessments now use Gemini AI to generate questions for ANY domain/student type
// Works for: PCM/PCB/Commerce students AND software/data_science/product/finance jobseekers
import express from 'express';
import Assessment from '../models/Assessment.js';
import User from '../models/User.js';
import { evaluateAssessmentAnswer, generateAssessmentFeedback, generateAssessmentQuestions } from '../services/aiService.js';

const router = express.Router();

// ── GET all assessments for user ──────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { userId, domain, topic, status, limit = 20, page = 1 } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });
    const query = { userId };
    if (domain) query.domain = domain;
    if (topic)  query.topic  = topic;
    if (status) query.status = status;
    const assessments = await Assessment.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-questions.explanation -questions.correctAnswer -questions.correctOption');
    const total = await Assessment.countDocuments(query);
    res.json({ success: true, data: assessments, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed to fetch', error: e.message }); }
});

// ── GET single assessment ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { userId } = req.query;
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, message: 'Not found' });
    if (assessment.userId !== userId) return res.status(403).json({ success: false, message: 'Access denied' });
    const safe = assessment.toObject();
    if (assessment.status !== 'completed') {
      safe.questions = safe.questions.map(q => ({ ...q, correctOption: undefined, correctAnswer: undefined, explanation: undefined }));
    }
    res.json({ success: true, data: safe });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed to fetch', error: e.message }); }
});

// ── GET available topics for a domain ────────────────────────────────────────
router.get('/topics/:domain', async (req, res) => {
  try {
    res.json({ success: true, data: getDomainTopics(req.params.domain) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── POST create assessment — Gemini generates questions for ANY user/domain ───
router.post('/create', async (req, res) => {
  try {
    const { userId, domain, topic, subtopic, difficulty = 'medium', numQuestions = 15 } = req.body;
    if (!userId || !domain || !topic) {
      return res.status(400).json({ success: false, message: 'userId, domain, topic required' });
    }

    // Fetch user profile to personalize
    let userProfile = { userType: 'jobseeker', experienceLevel: 'intermediate', studentClass: '', stream: '' };
    try {
      const user = await User.findOne({ clerkId: userId });
      if (user) {
        userProfile = {
          userType:        user.userType        || 'jobseeker',
          experienceLevel: user.experienceLevel || 'intermediate',
          studentClass:    user.studentClass    || '',
          stream:          user.stream          || '',
          domain:          user.domain          || domain
        };
        // Auto-adjust difficulty based on experience
        if (!req.body.difficulty) {
          if (user.experienceLevel === 'entry')                               userProfile.difficulty = 'easy';
          else if (user.experienceLevel === 'senior' || user.experienceLevel === 'expert') userProfile.difficulty = 'hard';
        }
      }
    } catch (e) { console.warn('Could not fetch user profile:', e.message); }

    // ★ Generate questions via Gemini — works for ALL user types
    console.log(`[Assessment] Generating ${numQuestions} questions via Gemini for ${userProfile.userType} — ${domain} > ${topic}${subtopic ? ' > ' + subtopic : ''}`);
    const questions = await generateAssessmentQuestions({
      domain,
      topic,
      subtopic,
      difficulty:    difficulty || userProfile.difficulty || 'medium',
      numQuestions:  Math.min(parseInt(numQuestions) || 15, 20),
      userType:      userProfile.userType,
      studentClass:  userProfile.studentClass,
      stream:        userProfile.stream,
      experienceLevel: userProfile.experienceLevel
    });

    if (!questions || questions.length === 0) {
      return res.status(500).json({ success: false, message: 'Could not generate questions. Check GEMINI_API_KEY.' });
    }

    const maxScore = questions.reduce((acc, q) => acc + (q.points || 10), 0);

    const assessment = new Assessment({
      userId,
      title:            `${topic} Assessment${subtopic ? ' — ' + subtopic : ''}`,
      domain,
      topic,
      subtopic:         subtopic || '',
      type:             questions.every(q => q.type === 'mcq') ? 'mcq' : 'mixed',
      difficulty:       difficulty || 'medium',
      questions,
      maxScore,
      timeLimitMinutes: Math.max(15, Math.ceil(questions.length * 1.5)),
      status:           'pending',
      syllabusTopics:   [topic, subtopic].filter(Boolean),
      meta: {
        generatedBy:  'gemini_ai',
        userType:     userProfile.userType,
        studentClass: userProfile.studentClass,
        stream:       userProfile.stream
      }
    });

    await assessment.save();
    console.log(`[Assessment] Created ${assessment._id} with ${questions.length} Gemini questions`);

    // Return without answers so user can't cheat
    const safe = assessment.toObject();
    safe.questions = safe.questions.map(q => ({ ...q, correctOption: undefined, correctAnswer: undefined, explanation: undefined }));
    res.status(201).json({ success: true, data: safe });

  } catch (e) {
    console.error('Create assessment error:', e);
    res.status(500).json({ success: false, message: 'Failed to create assessment', error: e.message });
  }
});

// ── PUT start assessment ──────────────────────────────────────────────────────
router.put('/:id/start', async (req, res) => {
  try {
    const { userId } = req.query;
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, message: 'Not found' });
    if (assessment.userId !== userId) return res.status(403).json({ success: false, message: 'Access denied' });
    assessment.status    = 'in_progress';
    assessment.startedAt = new Date();
    await assessment.save();
    const safe = assessment.toObject();
    safe.questions = safe.questions.map(q => ({ ...q, correctOption: undefined, correctAnswer: undefined, explanation: undefined }));
    res.json({ success: true, data: safe });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed to start', error: e.message }); }
});

// ── POST submit assessment ────────────────────────────────────────────────────
router.post('/:id/submit', async (req, res) => {
  try {
    const { userId } = req.query;
    const { answers, timeSpentSeconds, violations = 0, violationLog = [], autoSubmitted = false } = req.body;

    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, message: 'Not found' });
    if (assessment.userId !== userId) return res.status(403).json({ success: false, message: 'Access denied' });
    if (assessment.status === 'completed') return res.status(400).json({ success: false, message: 'Already submitted' });

    // Build answer map
    const answerMap = {};
    if (Array.isArray(answers)) answers.forEach(a => { answerMap[a.questionId] = a.answer; });

    // Fetch user profile for context-aware AI feedback
    let userProfile = { userType: 'jobseeker', experienceLevel: 'intermediate' };
    try {
      const u = await User.findOne({ clerkId: userId });
      if (u) userProfile = { userType: u.userType, experienceLevel: u.experienceLevel, studentClass: u.studentClass, stream: u.stream, domain: u.domain || assessment.domain };
    } catch {}

    let totalScore = 0;
    for (const q of assessment.questions) {
      const userAnswer = answerMap[q._id?.toString()] ?? answerMap[q._id] ?? '';
      q.userAnswer = userAnswer;
      const evaluation = await evaluateAssessmentAnswer({
        question: q.question, correctAnswer: q.correctAnswer,
        correctOption: q.correctOption, options: q.options || [],
        userAnswer, type: q.type, keywords: q.keywords || [],
        explanation: q.explanation || '',
        domain: assessment.domain, topic: assessment.topic,
        experienceLevel: userProfile.experienceLevel
      });
      q.isCorrect    = evaluation.isCorrect;
      q.pointsEarned = evaluation.pointsEarned;
      q.aiFeedback   = evaluation.aiFeedback;
      totalScore    += evaluation.pointsEarned;
    }

    assessment.score            = totalScore;
    assessment.percentage       = Math.round((totalScore / assessment.maxScore) * 100);
    assessment.timeSpentSeconds = timeSpentSeconds || 0;
    assessment.violations       = violations;
    assessment.violationLog     = violationLog;
    assessment.autoSubmitted    = autoSubmitted;
    assessment.status           = 'completed';
    assessment.completedAt      = new Date();

    // Generate overall AI feedback
    try {
      const feedback = await generateAssessmentFeedback({
        domain: assessment.domain, topic: assessment.topic,
        questions: assessment.questions,
        score: totalScore, maxScore: assessment.maxScore, percentage: assessment.percentage,
        userType: userProfile.userType, experienceLevel: userProfile.experienceLevel,
        studentClass: userProfile.studentClass, stream: userProfile.stream
      });
      assessment.aiFeedback = feedback;
    } catch (e) {
      console.warn('Assessment feedback error:', e.message);
      assessment.aiFeedback = {
        overallAnalysis: `You scored ${assessment.percentage}% on the ${assessment.topic} assessment.`,
        strongAreas: [], weakAreas: [], recommendations: [], nextTopicsToStudy: []
      };
    }

    await assessment.save();

    // Update user progress + stats
    try {
      const user = await User.findOne({ clerkId: userId });
      if (user) {
        user.stats.assessmentsTaken       = (user.stats.assessmentsTaken || 0) + 1;
        user.stats.totalQuestionsAnswered = (user.stats.totalQuestionsAnswered || 0) + assessment.questions.length;

        const allAssessments = await Assessment.find({ userId, status: 'completed' });
        if (allAssessments.length > 0) {
          user.stats.averageScore = Math.round(allAssessments.reduce((s, a) => s + (a.percentage || 0), 0) / allAssessments.length);
        }

        const correctCount = assessment.questions.filter(q => q.isCorrect).length;
        const existing = user.syllabusProgress.find(p =>
          p.domain === assessment.domain && p.topic === assessment.topic &&
          (!assessment.subtopic || p.subtopic === assessment.subtopic)
        );
        if (existing) {
          existing.questionsAttempted = (existing.questionsAttempted || 0) + assessment.questions.length;
          existing.questionsCorrect   = (existing.questionsCorrect   || 0) + correctCount;
          existing.averageScore       = Math.round(((existing.averageScore || 0) + assessment.percentage) / 2);
          existing.lastAttempted      = new Date();
          const acc = existing.questionsAttempted > 0 ? (existing.questionsCorrect / existing.questionsAttempted) * 100 : 0;
          existing.masteryLevel = existing.questionsAttempted >= 20 && acc >= 85 ? 'mastered'
            : existing.questionsAttempted >= 10 && acc >= 70 ? 'practiced'
            : existing.questionsAttempted >= 3 ? 'learning' : 'beginner';
        } else {
          user.syllabusProgress.push({
            domain: assessment.domain, topic: assessment.topic, subtopic: assessment.subtopic || '',
            questionsAttempted: assessment.questions.length,
            questionsCorrect:   correctCount,
            averageScore:       assessment.percentage,
            lastAttempted:      new Date(),
            masteryLevel:       'beginner'
          });
        }

        // Update recommended next topics from AI feedback
        if (assessment.aiFeedback?.nextTopicsToStudy?.length > 0) {
          const existing = user.learningPath?.recommendedNext || [];
          if (!user.learningPath) user.learningPath = {};
          user.learningPath.recommendedNext = [...new Set([...assessment.aiFeedback.nextTopicsToStudy, ...existing])].slice(0, 6);
        }

        // Update streak
        const today = new Date().toDateString();
        const lastActive = user.learningPath?.lastActiveDate ? new Date(user.learningPath.lastActiveDate).toDateString() : null;
        if (lastActive !== today) {
          if (!user.learningPath) user.learningPath = {};
          const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
          user.learningPath.streak = lastActive === yesterday.toDateString() ? (user.learningPath.streak || 0) + 1 : 1;
          user.learningPath.lastActiveDate = new Date();
        }

        await user.save();
      }
    } catch (e) { console.warn('User progress update error:', e.message); }

    res.json({ success: true, data: assessment });
  } catch (e) {
    console.error('Submit error:', e);
    res.status(500).json({ success: false, message: 'Failed to submit', error: e.message });
  }
});

// ─── Domain → Topics map (used for topic picker UI) ──────────────────────────
function getDomainTopics(domain) {
  const map = {
    // ── Job seeker domains ──
    software: [
      { topic: 'Data Structures',  subtopics: ['Arrays & Strings', 'Linked Lists', 'Trees & Graphs', 'Hashing', 'Stacks & Queues'] },
      { topic: 'Algorithms',       subtopics: ['Sorting', 'Searching', 'Dynamic Programming', 'Recursion', 'Greedy'] },
      { topic: 'System Design',    subtopics: ['Scalability', 'Databases', 'Caching', 'Load Balancing', 'Microservices'] },
      { topic: 'JavaScript',       subtopics: ['ES6+', 'Async/Await', 'Closures', 'Prototypes', 'Event Loop'] },
      { topic: 'React',            subtopics: ['Hooks', 'State Management', 'Performance', 'Component Patterns'] },
      { topic: 'Node.js',          subtopics: ['Event Loop', 'Streams', 'Express', 'Authentication'] },
      { topic: 'Databases',        subtopics: ['SQL Fundamentals', 'NoSQL', 'Indexing', 'Transactions'] },
      { topic: 'Operating Systems',subtopics: ['Processes & Threads', 'Memory Management', 'File Systems', 'Deadlocks'] },
      { topic: 'Computer Networks',subtopics: ['TCP/IP', 'HTTP/HTTPS', 'DNS', 'REST APIs'] },
    ],
    data_science: [
      { topic: 'Statistics & Probability', subtopics: ['Distributions', 'Hypothesis Testing', 'Bayesian Stats'] },
      { topic: 'Machine Learning',         subtopics: ['Supervised Learning', 'Unsupervised Learning', 'Model Evaluation', 'Feature Engineering'] },
      { topic: 'Deep Learning',            subtopics: ['Neural Networks', 'CNNs', 'RNNs', 'Transformers'] },
      { topic: 'Python for Data Science',  subtopics: ['Pandas', 'NumPy', 'Scikit-learn', 'Visualization'] },
      { topic: 'SQL for Analytics',        subtopics: ['Aggregations', 'Window Functions', 'Query Optimization'] },
    ],
    product: [
      { topic: 'Product Strategy',    subtopics: ['Market Analysis', 'Roadmapping', 'Prioritization Frameworks'] },
      { topic: 'Metrics & Analytics', subtopics: ['KPIs', 'A/B Testing', 'Funnel Analysis'] },
      { topic: 'Agile & Scrum',       subtopics: ['Sprint Planning', 'Backlog Grooming', 'Stakeholder Management'] },
      { topic: 'User Research',        subtopics: ['User Interviews', 'Surveys', 'Usability Testing'] },
    ],
    finance: [
      { topic: 'Financial Analysis',  subtopics: ['DCF Valuation', 'Financial Statements', 'Ratios'] },
      { topic: 'Investment Banking',   subtopics: ['M&A', 'Capital Markets', 'LBO Modeling'] },
      { topic: 'Accounting',           subtopics: ['P&L', 'Balance Sheet', 'Cash Flow'] },
      { topic: 'Risk Management',      subtopics: ['Credit Risk', 'Market Risk', 'Operational Risk'] },
    ],
    marketing: [
      { topic: 'Digital Marketing',    subtopics: ['SEO', 'SEM', 'Social Media', 'Email Marketing'] },
      { topic: 'Brand Strategy',       subtopics: ['Brand Positioning', 'Brand Identity', 'Market Segmentation'] },
      { topic: 'Marketing Analytics',  subtopics: ['Campaign Metrics', 'Attribution', 'Customer LTV'] },
    ],
    hr: [
      { topic: 'Recruitment & Talent', subtopics: ['Job Analysis', 'Sourcing', 'Interview Techniques'] },
      { topic: 'Employee Relations',   subtopics: ['Conflict Resolution', 'Performance Management', 'Engagement'] },
      { topic: 'HR Compliance',        subtopics: ['Labour Law', 'Policies', 'GDPR & Data Privacy'] },
    ],
    general: [
      { topic: 'Behavioral Skills',    subtopics: ['STAR Method', 'Leadership', 'Conflict Resolution', 'Teamwork'] },
      { topic: 'Problem Solving',      subtopics: ['Analytical Thinking', 'Decision Making', 'Critical Thinking'] },
      { topic: 'Communication',        subtopics: ['Presentation Skills', 'Email Writing', 'Active Listening'] },
    ],
    // ── Student domains ──
    'PCM (Physics, Chemistry, Maths)': [
      { topic: 'Physics',     subtopics: ['Mechanics', 'Electromagnetism', 'Thermodynamics', 'Optics', 'Modern Physics'] },
      { topic: 'Chemistry',   subtopics: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Chemical Bonding'] },
      { topic: 'Mathematics', subtopics: ['Calculus', 'Algebra', 'Trigonometry', 'Vectors', 'Probability & Statistics'] },
    ],
    'PCB (Physics, Chemistry, Biology)': [
      { topic: 'Physics',   subtopics: ['Mechanics', 'Electromagnetism', 'Thermodynamics', 'Optics'] },
      { topic: 'Chemistry', subtopics: ['Organic Chemistry', 'Inorganic Chemistry', 'Biochemistry'] },
      { topic: 'Biology',   subtopics: ['Cell Biology', 'Genetics', 'Human Physiology', 'Ecology', 'Evolution'] },
    ],
    Commerce: [
      { topic: 'Accountancy',         subtopics: ['Financial Statements', 'Partnership Accounts', 'Company Accounts', 'Cash Flow'] },
      { topic: 'Business Studies',    subtopics: ['Management Functions', 'Marketing', 'Finance', 'Human Resources', 'Business Environment'] },
      { topic: 'Economics',           subtopics: ['Microeconomics', 'Macroeconomics', 'Indian Economy', 'Money & Banking'] },
    ],
    'Computer Science': [
      { topic: 'Programming Fundamentals', subtopics: ['OOP Concepts', 'Data Types', 'Control Flow', 'Functions & Recursion'] },
      { topic: 'Data Structures',          subtopics: ['Arrays', 'Linked Lists', 'Stacks & Queues', 'Trees', 'Graphs'] },
      { topic: 'Databases',                subtopics: ['SQL Basics', 'Normalization', 'ER Diagrams', 'Transactions'] },
      { topic: 'Operating Systems',        subtopics: ['Process Management', 'Memory Management', 'File Systems'] },
      { topic: 'Computer Networks',        subtopics: ['OSI Model', 'TCP/IP', 'Network Security', 'HTTP & DNS'] },
    ],
    'Arts / Humanities': [
      { topic: 'History',            subtopics: ['Ancient History', 'Medieval History', 'Modern History', 'World Wars'] },
      { topic: 'Political Science',  subtopics: ['Indian Constitution', 'Political Theory', 'International Relations'] },
      { topic: 'Geography',          subtopics: ['Physical Geography', 'Human Geography', 'Economic Geography'] },
      { topic: 'Psychology',         subtopics: ['Biological Basis', 'Sensation & Perception', 'Learning & Memory', 'Social Psychology'] },
    ],
  };
  return map[domain] || map.general;
}

export default router;