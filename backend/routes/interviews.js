import express from 'express';
import Interview from '../models/Interview.js';
import User from '../models/User.js';
import InterviewResult from '../models/InterviewResult.js';
import {
  analyzeInterviewAnswer,
  generateInterviewSummary,
  generatePersonalizedInterviewQuestions
} from '../services/aiService.js';

const router = express.Router();

// ── GET all interviews for a user ────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { userId, limit = 10, page = 1, status } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' });

    const query = { userId };
    if (status && status !== 'all') query.status = status;

    const interviews = await Interview.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Interview.countDocuments(query);
    res.status(200).json({
      success: true, data: interviews,
      pagination: {
        page: parseInt(page), limit: parseInt(limit),
        total, pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch interviews', error: error.message });
  }
});

// ── GET stats ────────────────────────────────────────────────────────────────
router.get('/stats/:userId', async (req, res) => {
  try {
    const stats = await Interview.aggregate([
      { $match: { userId: req.params.userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          avgScore: { $avg: '$overallScore' },
          totalDuration: { $sum: '$duration' }
        }
      }
    ]);
    const result = stats.length > 0 ? stats[0] : { total: 0, completed: 0, inProgress: 0, avgScore: 0, totalDuration: 0 };
    delete result._id;
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats', error: error.message });
  }
});

// ── GET single interview ──────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { userId } = req.query;
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    if (userId && interview.userId !== userId)
      return res.status(403).json({ success: false, message: 'Access denied' });
    res.status(200).json({ success: true, data: interview });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch interview', error: error.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// POST create interview
// ══════════════════════════════════════════════════════════════════════════════
router.post('/', async (req, res) => {
  try {
    const {
      title,
      jobPosition,       // ← The EXACT position the user picked in the modal
      jobDescription,
      experienceLevel,
      interviewType,
      totalQuestions = 5,
      userId,
      userEmail,
      userName,
      domain,            // ← The resolved domain string sent from CreateInterviewModal
      categoryLabel,     // ← Human-readable category name e.g. "Medical & Health"
      userType: bodyUserType, // ← "student" | "jobseeker" from the modal's active tab
      studentClass: bodyStudentClass,
      stream: bodyStream,
    } = req.body;

    if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' });

    // ── Step 1: Load user profile from MongoDB ────────────────────────────
    let userProfile = null;
    try {
      userProfile = await User.findOne({ clerkId: userId });
    } catch (e) {
      console.warn('Profile fetch failed:', e.message);
    }

    // ── Step 2: Resolve identity fields ───────────────────────────────────
    // RULE: what the user chose in the modal ALWAYS wins over profile defaults.
    // Profile data supplements (skills, goals, etc.) but never overrides the
    // explicit category/position the user selected.

    const userType = bodyUserType || userProfile?.userType || 'jobseeker';
    const isStudent = userType === 'student';

    // Stream: prefer what the modal sent, then fall back to profile
    const stream = bodyStream || userProfile?.stream || '';
    const studentClass = bodyStudentClass || userProfile?.studentClass || '';

    // Domain: prefer what the modal sent (already resolved per category),
    // then fall back to profile domain
    const resolvedDomain = domain || userProfile?.domain || jobPosition || 'general';

    // Experience: prefer modal value, then profile
    const resolvedLevel = experienceLevel || userProfile?.experienceLevel || 'intermediate';

    // ── Step 3: Pull supplemental profile arrays ──────────────────────────
    // These enrich questions but do NOT override the chosen position/category
    const skills      = userProfile?.skills      || [];
    const targetRoles = userProfile?.targetRoles || [];
    const goals       = userProfile?.goals       || [];

    // ── Step 4: Weak areas from syllabus history ──────────────────────────
    const weakAreas = (userProfile?.syllabusProgress || [])
      .filter(p => p.averageScore < 60 && p.questionsAttempted > 0)
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 3)
      .map(p => p.subtopic || p.topic);

    // ── Step 5: Build the Gemini profile context ──────────────────────────
    // This is the most important block — it tells Gemini EXACTLY what to ask.
    // The chosen position and category are the PRIMARY drivers.
    // Profile data (skills, goals) is SECONDARY enrichment.
    let profileContext = '';

    if (isStudent) {
      // ── STUDENT context ─────────────────────────────────────────────────
      // Primary: the exact exam / topic / role the student selected
      // Secondary: their academic background from profile
      profileContext = `════ CANDIDATE: STUDENT ════
SELECTED EXAM / TOPIC / ROLE: "${jobPosition}"
${categoryLabel ? `CATEGORY: ${categoryLabel}` : ''}
CLASS / YEAR: ${studentClass || 'Not specified'}
STREAM / BRANCH: ${stream || 'Not specified'}
COLLEGE: ${userProfile?.college || 'Not specified'}
SKILLS / KNOWN SUBJECTS: ${skills.join(', ') || 'Not listed'}
GOALS: ${goals.join(', ') || 'Not listed'}
${jobDescription ? `SYLLABUS / EXTRA CONTEXT PROVIDED BY STUDENT:\n${jobDescription.slice(0, 600)}` : ''}

════ WHAT TO ASK ════
The student has SPECIFICALLY chosen to practise: "${jobPosition}".
ALL questions MUST be directly about this topic.

Examples of what this means:
• If "${jobPosition}" = "NEET UG Preparation" → ask Biology (Botany & Zoology), Physics, Chemistry at NEET level
• If "${jobPosition}" = "JEE Mains Preparation" → ask Maths, Physics, Chemistry at JEE level  
• If "${jobPosition}" = "UPSC Civil Services (IAS) Prep" → ask GS1/GS2/GS3 topics, current affairs, ethics
• If "${jobPosition}" = "CA Foundation Preparation" → ask Accounting, Business Law, Economics, Maths
• If "${jobPosition}" = "Campus Placement — Software Engineer" → ask DSA, coding, CS fundamentals
• If "${jobPosition}" = "GATE — Computer Science" → ask Algorithms, OS, DBMS, Networks, TOC
• If "${jobPosition}" = "MBA Entrance — CAT" → ask Verbal, Quant, DILR, GK
• If "${jobPosition}" = "Banking PO Interview (IBPS / SBI)" → ask Banking GK, Reasoning, English
• If "${jobPosition}" = "B.Tech — Computer Science Viva" → ask viva-style CS questions
• If it is a Viva → ask conceptual questions like a professor would in an oral exam
• If it is an Entrance Exam Prep → ask typical exam questions from that exam's syllabus
• If it is an Interview Prep → ask real interview questions for that specific role

DIFFICULTY LEVEL: ${resolvedLevel} (${resolvedLevel === 'entry' ? 'Beginner' : resolvedLevel === 'intermediate' ? 'Intermediate' : resolvedLevel === 'senior' ? 'Advanced' : 'Expert/Competitive'})
${weakAreas.length > 0 ? `WEAK AREAS TO TARGET: ${weakAreas.join(', ')}` : ''}`;

    } else {
      // ── PROFESSIONAL / JOBSEEKER context ────────────────────────────────
      // Primary: the exact job position the user selected
      // Secondary: their professional background from profile
      profileContext = `════ CANDIDATE: PROFESSIONAL / JOB SEEKER ════
SELECTED JOB POSITION: "${jobPosition}"
${categoryLabel ? `CATEGORY: ${categoryLabel}` : ''}
DOMAIN / FIELD: ${resolvedDomain}
EXPERIENCE LEVEL: ${resolvedLevel}
CURRENT JOB TITLE: ${userProfile?.jobTitle || 'Not specified'}
CURRENT COMPANY: ${userProfile?.company || 'Not specified'}
TARGET ROLES: ${targetRoles.join(', ') || jobPosition}

// ✅ NAYA
SKILLS TO TEST: Skills specifically required for ${jobPosition} role
${skills.length > 0 ? `CANDIDATE'S PROFILE SKILLS (secondary only — do NOT override position): ${skills.join(', ')}` : ''}
CAREER GOALS: ${goals.join(', ') || 'Career advancement'}
${jobDescription ? `JOB DESCRIPTION PROVIDED:\n${jobDescription.slice(0, 600)}` : ''}

════ WHAT TO ASK ════
The candidate has SPECIFICALLY chosen to practise for: "${jobPosition}".
ALL questions MUST be directly relevant to this role.

Examples of what this means:
• If "${jobPosition}" = "Frontend Developer" → ask HTML/CSS/JS/React/performance/accessibility
• If "${jobPosition}" = "Data Scientist" → ask ML algorithms, statistics, Python, SQL, model evaluation
• If "${jobPosition}" = "DevOps Engineer" → ask CI/CD, Docker, Kubernetes, AWS/GCP/Azure, IaC
• If "${jobPosition}" = "Product Manager" → ask product sense, prioritisation, metrics, case studies
• If "${jobPosition}" = "Management Consultant" → ask case study frameworks, business analysis, problem solving
• If "${jobPosition}" = "Financial Analyst" → ask valuation, financial modelling, DCF, accounting ratios
• If "${jobPosition}" = "UX Designer" → ask design process, user research, Figma, usability
• If "${jobPosition}" = "Security Engineer" → ask OWASP, threat modelling, penetration testing, cryptography
• If "${jobPosition}" = "HR Executive / Generalist" → ask HR policies, recruitment, employee relations, labour law
• If "${jobPosition}" = "Sales Executive" → ask sales methodology, objection handling, CRM, negotiation
• If the job description was provided, tailor ALL questions specifically to it

════ PRIORITY RULE ════
The SELECTED JOB POSITION "${jobPosition}" is the PRIMARY focus.
ALL questions MUST be about "${jobPosition}" specifically.
Profile skills above are SECONDARY background info only — ignore them if they conflict with the position.

${weakAreas.length > 0 ? `WEAK AREAS TO TARGET: ${weakAreas.join(', ')}` : ''}`;
    }

    console.log(`🎯 Creating interview: position="${jobPosition}" | category="${categoryLabel}" | type=${userType} | level=${resolvedLevel} | questions=${totalQuestions}`);

    // ── Step 6: Call Gemini with category-first context ───────────────────
    let geminiQuestions = [];
    try {
      geminiQuestions = await generatePersonalizedInterviewQuestions({
        jobPosition,
        experienceLevel:  resolvedLevel,
        interviewType:    interviewType || 'mixed',
        numQuestions:     parseInt(totalQuestions),
        userDomain:       resolvedDomain,
        weakAreas,
        userType,
        studentClass,
        stream,
        jobDescription:   jobDescription || '',
        profileContext,   // ← category-first rich context
        skills,
        targetRoles,
        goals,
      });
    } catch (aiErr) {
      console.error('Gemini failed:', aiErr.message);
    }

    // ── Step 7: Format questions or use position-aware fallback ──────────
    let formattedQuestions = [];
    if (geminiQuestions?.length > 0) {
      formattedQuestions = geminiQuestions.map(q => ({
        question:            q.question,
        type:                q.type || 'behavioral',
        difficulty:          q.difficulty || 'medium',
        idealAnswer:         q.idealAnswer || '',
        keywords:            Array.isArray(q.keywords) ? q.keywords : [],
        keyConceptsRequired: Array.isArray(q.keyConceptsRequired) ? q.keyConceptsRequired : [],
        timeLimit:           q.timeLimit || 120,
        topic:               q.topic || jobPosition
      }));
    } else {
      // Fallback uses the exact position + category to generate relevant stubs
      formattedQuestions = buildCategoryFallbackQuestions(
        jobPosition,
        resolvedLevel,
        interviewType || 'mixed',
        parseInt(totalQuestions),
        userType,
        studentClass,
        stream,
        skills,
        categoryLabel
      );
    }

    // ── Step 8: Save interview ────────────────────────────────────────────
    const resolvedTitle = title?.trim() || (isStudent
      ? `${jobPosition} — Practice Session`
      : `${jobPosition} Interview`);

    const interview = new Interview({
      userId,
      userEmail:       userEmail || userProfile?.email || '',
      userName:        userName  || `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim(),
      title:           resolvedTitle,
      jobPosition,
      jobDescription:  jobDescription || '',
      experienceLevel: resolvedLevel,
      interviewType:   interviewType || 'mixed',
      questions:       formattedQuestions,
      status:          'draft',
      startedAt:       new Date()
    });

    await interview.save();

    res.status(201).json({
      success: true,
      message: 'Interview created with AI-personalised questions',
      data: interview,
      meta: {
        questionsSource:  geminiQuestions.length > 0 ? 'gemini_ai' : 'fallback',
        userType,
        profileLoaded:    !!userProfile,
        positionUsed:     jobPosition,
        categoryUsed:     categoryLabel,
        domainUsed:       resolvedDomain,
        skillsUsed:       skills,
        weakAreasUsed:    weakAreas,
      }
    });
  } catch (error) {
    console.error('Create interview error:', error);
    res.status(500).json({ success: false, message: 'Failed to create interview', error: error.message });
  }
});

// ── POST complete interview ───────────────────────────────────────────────────
router.post('/:id/complete', async (req, res) => {
  try {
    const { results, analysis, userId, duration, behaviorMetrics } = req.body;

    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });

    if (interview.status !== 'completed') {
      interview.status = 'completed';
      interview.completedAt = new Date();
      interview.duration = duration || interview.duration || 0;
    }

    if (results) {
      interview.overallScore = results.overallScore || interview.overallScore || 0;
      interview.analysis = {
        technicalSkills: results.metrics?.technical || 0,
        communication:   results.metrics?.communication || 0,
        problemSolving:  results.metrics?.problemSolving || 0,
        confidence:      results.metrics?.confidence || 0,
        overallFeedback: results.feedback || '',
        strengths:       results.strengths || [],
        improvements:    results.improvements || []
      };
      interview.results = {
        technicalScore:        results.metrics?.technical || 0,
        behavioralScore:       results.metrics?.problemSolving || 0,
        communicationScore:    results.metrics?.communication || 0,
        overallFeedback:       results.feedback || '',
        strengths:             results.strengths || [],
        improvements:          results.improvements || [],
        hiringRecommendation:  results.hiringRecommendation || '',
        studyRecommendations:  results.studyRecommendations || []
      };
    }

    await interview.save();

    try {
      await User.findOneAndUpdate(
        { clerkId: userId },
        {
          $inc: {
            'stats.completedInterviews': 1,
            'stats.totalInterviews': 1,
            'stats.totalPracticeTime': duration || 0
          },
          $set: { 'stats.lastActiveDate': new Date() }
        }
      );
    } catch (e) { console.warn('Stats update failed:', e.message); }

    res.status(200).json({ success: true, message: 'Interview completed', data: interview });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to complete interview', error: error.message });
  }
});

// ── GET interview results ─────────────────────────────────────────────────────
router.get('/:id/results', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' });

    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    if (interview.userId !== userId)
      return res.status(403).json({ success: false, message: 'Access denied' });

    const result = await InterviewResult.findOne({ interviewId: req.params.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        interview: {
          _id:            interview._id,
          title:          interview.title,
          jobPosition:    interview.jobPosition,
          interviewType:  interview.interviewType,
          experienceLevel:interview.experienceLevel,
          createdAt:      interview.createdAt,
          completedAt:    interview.completedAt
        },
        overallScore: interview.overallScore || 0,
        duration:     interview.duration || 0,
        feedback:     interview.analysis?.overallFeedback || interview.results?.overallFeedback || '',
        metrics: {
          technical:      interview.analysis?.technicalSkills || result?.metrics?.technical || 0,
          communication:  interview.analysis?.communication   || result?.metrics?.communication || 0,
          problemSolving: interview.analysis?.problemSolving  || result?.metrics?.problemSolving || 0,
          confidence:     interview.analysis?.confidence      || result?.metrics?.confidence || 0
        },
        strengths:             interview.analysis?.strengths  || interview.results?.strengths  || [],
        improvements:          interview.analysis?.improvements || interview.results?.improvements || [],
        hiringRecommendation:  interview.results?.hiringRecommendation || result?.feedback?.recommendation || '',
        studyRecommendations:  interview.results?.studyRecommendations || result?.aiInsights?.improvementAreas || [],
        questions: interview.questions.map(q => ({
          question:    q.question,
          type:        q.type,
          difficulty:  q.difficulty,
          topic:       q.topic,
          userAnswer:  q.userAnswer,
          feedback:    q.feedback,
          idealAnswer: q.idealAnswer,
          keywords:    q.keywords
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch results', error: error.message });
  }
});

// ── PUT update interview progress ────────────────────────────────────────────
router.put('/:id/progress', async (req, res) => {
  try {
    const { questionIndex, answer, audioUrl, timeSpent } = req.body;
    const { userId } = req.query;

    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    if (interview.userId !== userId)
      return res.status(403).json({ success: false, message: 'Access denied' });
    if (questionIndex >= interview.questions.length)
      return res.status(400).json({ success: false, message: 'Invalid question index' });

    const q = interview.questions[questionIndex];
    q.userAnswer = { text: answer || '', audioUrl: audioUrl || '', timeSpent: timeSpent || 0 };

    let aiFeedback = null;
    if (answer?.trim().length > 5) {
      try {
        const user = await User.findOne({ clerkId: userId });
        aiFeedback = await analyzeInterviewAnswer({
          question:        q.question,
          idealAnswer:     q.idealAnswer || '',
          keywords:        q.keywords || [],
          userAnswer:      answer,
          questionType:    q.type,
          difficulty:      q.difficulty,
          jobPosition:     interview.jobPosition,
          experienceLevel: interview.experienceLevel,
          userDomain:      user?.domain || user?.jobTitle || interview.jobPosition
        });
        q.feedback = {
          score:            aiFeedback.score,
          strengths:        aiFeedback.strengths,
          improvements:     aiFeedback.improvements,
          detailedFeedback: aiFeedback.detailedFeedback
        };
      } catch (aiErr) { console.error('AI feedback error:', aiErr.message); }
    }

    if (questionIndex === interview.currentQuestionIndex)
      interview.currentQuestionIndex = Math.min(questionIndex + 1, interview.questions.length - 1);

    const answered = interview.questions.filter(q => q.userAnswer?.text || q.userAnswer?.audioUrl).length;
    if (answered === interview.questions.length) {
      interview.status = 'completed';
      interview.completedAt = new Date();
      if (interview.startedAt)
        interview.duration = Math.floor((new Date() - new Date(interview.startedAt)) / 60000);
    } else {
      interview.status = 'in_progress';
    }

    await interview.save();
    res.status(200).json({ success: true, message: 'Progress updated', data: interview, questionFeedback: aiFeedback });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update progress', error: error.message });
  }
});

// ── POST submit interview ─────────────────────────────────────────────────────
router.post('/:id/submit', async (req, res) => {
  try {
    const { userId } = req.query;
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    if (interview.userId !== userId)
      return res.status(403).json({ success: false, message: 'Access denied' });

    interview.status = 'completed';
    interview.completedAt = new Date();
    if (interview.startedAt)
      interview.duration = Math.floor((new Date() - new Date(interview.startedAt)) / 60000);

    const qna    = interview.questions.map(q => ({ question: q.question, answer: q.userAnswer?.text || '' }));
    const scores = interview.questions.map(q => q.feedback?.score).filter(s => s !== undefined);

    try {
      const summary = await generateInterviewSummary({
        jobPosition:         interview.jobPosition,
        experienceLevel:     interview.experienceLevel,
        interviewType:       interview.interviewType,
        questionsAndAnswers: qna,
        questionScores:      scores
      });
      interview.overallScore = summary.overallScore;
      interview.analysis = {
        technicalSkills: summary.technicalSkills,
        communication:   summary.communication,
        problemSolving:  summary.problemSolving,
        confidence:      summary.confidence,
        overallFeedback: summary.overallFeedback,
        strengths:       summary.strengths,
        improvements:    summary.improvements
      };
      interview.results = {
        technicalScore:       summary.technicalSkills,
        behavioralScore:      summary.culturalFit || summary.technicalSkills,
        communicationScore:   summary.communication,
        overallFeedback:      summary.overallFeedback,
        strengths:            summary.strengths,
        improvements:         summary.improvements,
        hiringRecommendation: summary.hiringRecommendation,
        studyRecommendations: summary.studyRecommendations
      };
    } catch (aiErr) {
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      interview.overallScore = avg;
      interview.analysis = {
        technicalSkills: avg, communication: avg, problemSolving: avg, confidence: avg,
        overallFeedback: 'Interview completed.', strengths: [], improvements: []
      };
    }

    await interview.save();

    try {
      await User.findOneAndUpdate(
        { clerkId: userId },
        { $inc: { 'stats.completedInterviews': 1, 'stats.totalInterviews': 1, 'stats.totalPracticeTime': interview.duration || 0 } }
      );
    } catch {}

    res.status(200).json({ success: true, message: 'Interview submitted', data: interview });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit interview', error: error.message });
  }
});

// ── DELETE interview ──────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' });
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    if (interview.userId !== userId)
      return res.status(403).json({ success: false, message: 'Access denied' });
    await Interview.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Interview deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete interview', error: error.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// Category-aware fallback question builder
// Only runs when Gemini is down. Uses the exact position + category to build
// relevant questions rather than generic ones.
// ══════════════════════════════════════════════════════════════════════════════
function buildCategoryFallbackQuestions(
  jobPosition, experienceLevel, interviewType, count,
  userType, studentClass, stream, skills = [], categoryLabel = ''
) {
  const isStudent  = userType === 'student';
  const pos        = jobPosition || 'this topic';
  const skillsText = skills.slice(0, 3).join(' and ') || pos;
  const level      = experienceLevel === 'entry' ? 'beginner' : experienceLevel === 'expert' ? 'expert' : experienceLevel;

  // ── Student question templates keyed to common positions ────────────────
  const studentTemplates = {
    'NEET': [
      { q: `Explain the mechanism of action of enzymes and give a real example from human digestion.`, topic: 'Biology — Biochemistry' },
      { q: `What is the difference between mitosis and meiosis? When does each occur in the human body?`, topic: 'Biology — Cell Division' },
      { q: `Describe Ohm's Law and solve: A circuit has resistance 20Ω and voltage 100V. Find current and power.`, topic: 'Physics — Electricity' },
      { q: `Explain the periodic trend in ionisation energy and why noble gases have the highest values.`, topic: 'Chemistry — Periodic Table' },
      { q: `What are the different blood groups in the ABO system? Explain how blood typing works.`, topic: 'Biology — Genetics' },
    ],
    'JEE': [
      { q: `Prove that the sum of angles in a triangle is 180° using parallel line properties.`, topic: 'Maths — Geometry' },
      { q: `A ball is thrown vertically upward at 20 m/s. Find maximum height reached and time of flight. (g = 10 m/s²)`, topic: 'Physics — Kinematics' },
      { q: `Explain the concept of chemical equilibrium and state Le Chatelier's principle with an example.`, topic: 'Chemistry — Equilibrium' },
      { q: `Differentiate between scalar and vector quantities. Give 3 examples of each.`, topic: 'Physics — Vectors' },
      { q: `What is the binomial theorem? Expand (x + y)³ using it.`, topic: 'Maths — Algebra' },
    ],
    'GATE': [
      { q: `Explain time complexity. What is the time complexity of quicksort in best, average, and worst case?`, topic: 'Algorithms' },
      { q: `What is a deadlock in operating systems? Explain the four necessary conditions.`, topic: 'Operating Systems' },
      { q: `Explain normalisation in databases. What problems does 3NF solve that 2NF does not?`, topic: 'Database Management' },
      { q: `What is the difference between process and thread? When would you prefer threads over processes?`, topic: 'Operating Systems' },
      { q: `Explain TCP vs UDP. In which scenarios would you use each?`, topic: 'Computer Networks' },
    ],
    'UPSC': [
      { q: `Explain the significance of Article 32 of the Indian Constitution. Why did Dr Ambedkar call it the "heart and soul" of the Constitution?`, topic: 'Polity' },
      { q: `What are the major causes of soil erosion in India? Suggest measures to control it.`, topic: 'Geography — Environment' },
      { q: `Discuss the significance of the Non-Cooperation Movement of 1920-22 in India's freedom struggle.`, topic: 'Modern History' },
      { q: `What is GST? How has it changed India's indirect tax structure?`, topic: 'Economy' },
      { q: `What are sustainable development goals (SDGs)? Discuss India's progress on any 3 SDGs.`, topic: 'Current Affairs — Environment' },
    ],
    'CA': [
      { q: `What is the difference between capital expenditure and revenue expenditure? Give 3 examples of each.`, topic: 'Accounting' },
      { q: `Explain the concept of double-entry bookkeeping with a practical journal entry example.`, topic: 'Accounting — Bookkeeping' },
      { q: `What is a trial balance? What errors does it detect and what errors does it not detect?`, topic: 'Accounting' },
      { q: `Explain the concept of depreciation. Compare straight-line and written-down value methods.`, topic: 'Accounting — Assets' },
      { q: `What is GST? Explain CGST, SGST, and IGST with an example transaction.`, topic: 'Taxation' },
    ],
    'Banking': [
      { q: `What is the difference between repo rate and reverse repo rate? How do they affect inflation?`, topic: 'Banking — Monetary Policy' },
      { q: `Explain the difference between NEFT, RTGS, and IMPS. What are the transaction limits?`, topic: 'Banking — Products' },
      { q: `What is a Non-Performing Asset (NPA)? How do banks classify and manage NPAs?`, topic: 'Banking — Credit' },
      { q: `What are the RBI's roles as a regulator and supervisor of banks in India?`, topic: 'Banking — Regulation' },
      { q: `Tell me about yourself and why you want to pursue a career in banking.`, topic: 'HR / Personal' },
    ],
    'Campus Placement': [
      { q: `Given an array of integers, find the two elements whose sum equals a target value. Write the code.`, topic: 'Data Structures — Arrays' },
      { q: `Explain the difference between stack and queue. Implement a queue using two stacks.`, topic: 'Data Structures' },
      { q: `What is object-oriented programming? Explain the 4 pillars with examples.`, topic: 'OOP Concepts' },
      { q: `What is the difference between SQL JOIN types? Write a query using INNER JOIN and LEFT JOIN.`, topic: 'Database — SQL' },
      { q: `Tell me about yourself, your projects, and why you want to join this company.`, topic: 'HR Round' },
    ],
    'MBA': [
      { q: `You are launching a new product in a saturated market. Walk me through your Go-To-Market strategy.`, topic: 'Marketing Strategy' },
      { q: `What is SWOT analysis? Conduct a SWOT for a company of your choice.`, topic: 'Strategic Management' },
      { q: `Explain Porter's Five Forces with an example industry.`, topic: 'Business Strategy' },
      { q: `What is NPV? If a project costs ₹10 lakh today and returns ₹3 lakh/year for 5 years at 10% discount, is it viable?`, topic: 'Finance — Valuation' },
      { q: `Tell me about yourself. Why MBA? Why this college?`, topic: 'Personal Interview' },
    ],
    'CLAT': [
      { q: `What is the difference between cognizable and non-cognizable offences under the CrPC?`, topic: 'Criminal Law' },
      { q: `Explain the principle of "audi alteram partem" with a relevant case.`, topic: 'Administrative Law' },
      { q: `What is the doctrine of basic structure as established in Kesavananda Bharati v. State of Kerala?`, topic: 'Constitutional Law' },
      { q: `Solve this logical reasoning: All dogs are animals. Some animals are cats. Can we conclude some dogs are cats?`, topic: 'Logical Reasoning' },
      { q: `Analyse the following legal passage and answer: [Passage about contract formation and consideration]`, topic: 'Legal Aptitude' },
    ],
  };

  // ── Professional question templates keyed to common positions ────────────
  const professionalTemplates = {
    'Frontend': [
      { q: `Explain the concept of virtual DOM in React. Why is it more performant than direct DOM manipulation?`, topic: 'React — Core Concepts' },
      { q: `What are React hooks? Explain useState, useEffect, and useCallback with use cases.`, topic: 'React — Hooks' },
      { q: `What is CSS specificity? Resolve a conflict between an ID selector and a class selector.`, topic: 'CSS' },
      { q: `Explain the difference between synchronous and asynchronous JavaScript. Give an example using Promises and async/await.`, topic: 'JavaScript — Async' },
      { q: `How would you optimise the performance of a slow React application? List at least 5 techniques.`, topic: 'Performance Optimisation' },
    ],
    'Backend': [
      { q: `What is REST? What are the key principles of a RESTful API? Design a REST API for a blog application.`, topic: 'API Design' },
      { q: `Explain the differences between SQL and NoSQL databases. When would you choose MongoDB over PostgreSQL?`, topic: 'Databases' },
      { q: `What is middleware in Express.js? Write a custom authentication middleware.`, topic: 'Node.js — Express' },
      { q: `Explain indexing in databases. How would you optimise a slow SQL query?`, topic: 'Database Optimisation' },
      { q: `What is JWT? Explain how token-based authentication works end to end.`, topic: 'Security — Authentication' },
    ],
    'Data': [
      { q: `Explain the bias-variance tradeoff. How do you balance it in a machine learning model?`, topic: 'ML — Model Evaluation' },
      { q: `Write a SQL query to find the second highest salary in an employees table.`, topic: 'SQL — Analytics' },
      { q: `What is the difference between supervised, unsupervised, and reinforcement learning? Give one example of each.`, topic: 'ML — Fundamentals' },
      { q: `Explain how a Random Forest works. What are its advantages over a single decision tree?`, topic: 'ML — Algorithms' },
      { q: `You have a dataset with 30% missing values. Walk me through your data cleaning strategy.`, topic: 'Data Cleaning' },
    ],
    'DevOps': [
      { q: `Explain the CI/CD pipeline. What tools have you used, and what happens at each stage?`, topic: 'CI/CD' },
      { q: `What is Docker? Explain the difference between a Docker image and a container.`, topic: 'Containerisation' },
      { q: `Explain Kubernetes architecture. What are Pods, Deployments, and Services?`, topic: 'Kubernetes' },
      { q: `What is Infrastructure as Code? Compare Terraform and Ansible.`, topic: 'IaC' },
      { q: `Describe how you would set up monitoring and alerting for a production service.`, topic: 'Observability' },
    ],
    'Product': [
      { q: `How would you prioritise features for a product backlog? Walk me through your framework.`, topic: 'Prioritisation' },
      { q: `A key metric (DAU) has dropped 20% overnight. How do you diagnose and respond?`, topic: 'Metrics & Analytics' },
      { q: `Design a product roadmap for a new fintech app targeting college students.`, topic: 'Product Strategy' },
      { q: `What is an A/B test? Design an A/B test to improve the sign-up conversion rate.`, topic: 'Experimentation' },
      { q: `Tell me about a product you use daily. What is one thing you would improve and why?`, topic: 'Product Sense' },
    ],
    'Finance': [
      { q: `Walk me through a DCF valuation. What are the key assumptions you need to make?`, topic: 'Valuation — DCF' },
      { q: `Explain the three financial statements and how they connect to each other.`, topic: 'Financial Statements' },
      { q: `What is WACC? How would you calculate it for a company?`, topic: 'Corporate Finance' },
      { q: `Explain the difference between P/E ratio and EV/EBITDA. When would you use each?`, topic: 'Valuation Multiples' },
      { q: `Walk me through an LBO model at a high level.`, topic: 'Investment Banking' },
    ],
    'Consulting': [
      { q: `A retail client's profitability has declined 15% over the last year. How would you structure your analysis?`, topic: 'Profitability Case' },
      { q: `Estimate the number of petrol stations in India. Walk me through your reasoning.`, topic: 'Market Sizing' },
      { q: `Your client wants to enter the electric vehicle market. How would you advise them?`, topic: 'Market Entry Case' },
      { q: `What are the key elements of a good hypothesis-driven consulting approach?`, topic: 'Consulting Methodology' },
      { q: `Tell me about a time you had to influence someone without direct authority.`, topic: 'Behavioural' },
    ],
    'HR': [
      { q: `Describe your process for conducting a structured behavioural interview. What frameworks do you use?`, topic: 'Talent Acquisition' },
      { q: `How would you handle a situation where a high-performing employee is violating company policies?`, topic: 'Employee Relations' },
      { q: `What is the difference between performance management and performance appraisal?`, topic: 'Performance Management' },
      { q: `How do you calculate employee turnover rate? What are common causes and how do you reduce it?`, topic: 'HR Metrics' },
      { q: `Explain the key provisions of the Industrial Disputes Act relevant to an HR manager.`, topic: 'Labour Law' },
    ],
    'Sales': [
      { q: `Walk me through your sales process from prospecting to closing a deal.`, topic: 'Sales Methodology' },
      { q: `A prospect says "Your pricing is too high." How do you respond?`, topic: 'Objection Handling' },
      { q: `How do you qualify leads? Explain the BANT or MEDDIC framework.`, topic: 'Lead Qualification' },
      { q: `Describe a deal you closed that required multiple stakeholders. How did you manage it?`, topic: 'Complex Sales' },
      { q: `What CRM tools have you used? How do you manage your sales pipeline?`, topic: 'CRM & Process' },
    ],
  };

  // Find the best template match
  let templateQuestions = null;

  const posLower = pos.toLowerCase();
  const catLower = (categoryLabel || '').toLowerCase();

  // Student matching
  if (isStudent) {
    if (posLower.includes('neet'))               templateQuestions = studentTemplates['NEET'];
    else if (posLower.includes('jee'))           templateQuestions = studentTemplates['JEE'];
    else if (posLower.includes('gate'))          templateQuestions = studentTemplates['GATE'];
    else if (posLower.includes('upsc') || posLower.includes('ias') || posLower.includes('psc')) templateQuestions = studentTemplates['UPSC'];
    else if (posLower.includes('ca ') || posLower.includes('chartered') || posLower.includes('cma')) templateQuestions = studentTemplates['CA'];
    else if (posLower.includes('bank') || posLower.includes('ibps') || posLower.includes('rbi')) templateQuestions = studentTemplates['Banking'];
    else if (posLower.includes('campus') || posLower.includes('placement') || posLower.includes('internship')) templateQuestions = studentTemplates['Campus Placement'];
    else if (posLower.includes('mba') || posLower.includes('iim') || posLower.includes('cat ')) templateQuestions = studentTemplates['MBA'];
    else if (posLower.includes('clat') || posLower.includes('law')) templateQuestions = studentTemplates['CLAT'];
  } else {
    // Professional matching
    if (posLower.includes('frontend') || posLower.includes('react') || posLower.includes('angular') || posLower.includes('vue')) templateQuestions = professionalTemplates['Frontend'];
    else if (posLower.includes('backend') || posLower.includes('node') || posLower.includes('python developer') || posLower.includes('java developer')) templateQuestions = professionalTemplates['Backend'];
    else if (posLower.includes('full stack')) templateQuestions = [...professionalTemplates['Frontend'].slice(0,2), ...professionalTemplates['Backend'].slice(0,3)];
    else if (posLower.includes('data') || posLower.includes('ml') || posLower.includes('machine learning') || posLower.includes('ai ')) templateQuestions = professionalTemplates['Data'];
    else if (posLower.includes('devops') || posLower.includes('sre') || posLower.includes('cloud') || posLower.includes('infrastructure')) templateQuestions = professionalTemplates['DevOps'];
    else if (posLower.includes('product manager') || posLower.includes('product management') || posLower.includes(' pm')) templateQuestions = professionalTemplates['Product'];
    else if (posLower.includes('financial') || posLower.includes('investment') || posLower.includes('analyst') || catLower.includes('finance')) templateQuestions = professionalTemplates['Finance'];
    else if (posLower.includes('consult') || posLower.includes('strategy') || posLower.includes('mckinsey') || posLower.includes('bcg')) templateQuestions = professionalTemplates['Consulting'];
    else if (posLower.includes('hr ') || posLower.includes('human resource') || posLower.includes('people ops') || posLower.includes('talent')) templateQuestions = professionalTemplates['HR'];
    else if (posLower.includes('sales') || posLower.includes('business development') || posLower.includes('account executive')) templateQuestions = professionalTemplates['Sales'];
  }

  // Build question objects from templates
  if (templateQuestions) {
    return templateQuestions.slice(0, count).map((t, i) => ({
      question:            t.q,
      type:                i % 3 === 2 ? 'behavioral' : 'technical',
      difficulty:          i === 0 ? 'easy' : i === count - 1 ? 'hard' : 'medium',
      idealAnswer:         `A strong answer should demonstrate solid knowledge of ${t.topic} with specific examples and clear reasoning.`,
      keywords:            t.topic.split(' — ').concat([pos.split(' ')[0]]),
      keyConceptsRequired: [t.topic],
      timeLimit:           i === 0 ? 90 : i === count - 1 ? 180 : 120,
      topic:               t.topic
    }));
  }

  // Final generic fallback — still position-specific
  const genericFallback = isStudent ? [
    {
      question:    `Tell me about yourself and why you chose to prepare for "${pos}".`,
      type:        'behavioral', difficulty: 'easy', timeLimit: 120,
      idealAnswer: 'Background, motivation, preparation strategy, and goals.',
      keywords:    ['motivation', 'preparation', 'goals'],
      topic:       'Introduction'
    },
    {
      question:    `What is the most challenging concept in "${pos}" and how do you approach understanding it?`,
      type:        'technical', difficulty: 'medium', timeLimit: 120,
      idealAnswer: 'Shows depth of understanding and learning methodology.',
      keywords:    ['concept', 'understanding', 'approach'],
      topic:       pos
    },
    {
      question:    `Describe your preparation strategy for "${pos}". What resources and schedule do you follow?`,
      type:        'behavioral', difficulty: 'easy', timeLimit: 90,
      idealAnswer: 'Structured plan, consistent practice, resource selection.',
      keywords:    ['strategy', 'resources', 'schedule'],
      topic:       'Preparation'
    },
    {
      question:    `What specific topics within "${pos}" do you find most important, and why?`,
      type:        'technical', difficulty: 'medium', timeLimit: 120,
      idealAnswer: 'Demonstrates topic prioritisation and conceptual clarity.',
      keywords:    ['topics', 'importance', 'priority'],
      topic:       pos
    },
    {
      question:    `Where do you see yourself 2 years after succeeding in "${pos}"?`,
      type:        'behavioral', difficulty: 'easy', timeLimit: 90,
      idealAnswer: 'Clear vision, realistic goal-setting, alignment with effort.',
      keywords:    ['goals', 'vision', 'future'],
      topic:       'Goals'
    },
  ] : [
    {
      question:    `Walk me through your background and what makes you a strong fit for a "${pos}" role.`,
      type:        'behavioral', difficulty: 'easy', timeLimit: 120,
      idealAnswer: 'Connects past experience to role requirements with specific examples.',
      keywords:    ['experience', 'fit', 'background'],
      topic:       'Experience'
    },
    {
      question:    `Describe a technically challenging problem you solved in your "${pos}" work. What was your approach?`,
      type:        'technical', difficulty: 'medium', timeLimit: 150,
      idealAnswer: 'Problem definition, approach, technical implementation, measurable outcome.',
      keywords:    ['technical', 'problem', 'solution', 'outcome'],
      topic:       pos
    },
    {
      question:    `How do you stay current with the latest trends and tools relevant to "${pos}"?`,
      type:        'behavioral', difficulty: 'easy', timeLimit: 90,
      idealAnswer: 'Learning habits, specific resources, recent examples of applying new knowledge.',
      keywords:    ['learning', 'trends', 'tools'],
      topic:       'Continuous Learning'
    },
    {
      question:    `Design a solution for a common problem in the "${pos}" domain. Explain your design decisions.`,
      type:        'technical', difficulty: 'hard', timeLimit: 180,
      idealAnswer: 'Requirements gathering, design decisions, tradeoffs, scalability considerations.',
      keywords:    ['design', 'scalability', 'tradeoffs', 'architecture'],
      topic:       'System Design'
    },
    {
      question:    `Tell me about a time you disagreed with a team decision in your "${pos}" role. How did you handle it?`,
      type:        'behavioral', difficulty: 'medium', timeLimit: 120,
      idealAnswer: 'STAR format: situation, your reasoning, communication approach, outcome.',
      keywords:    ['disagreement', 'communication', 'teamwork', 'resolution'],
      topic:       'Teamwork'
    },
  ];

  return genericFallback.slice(0, count);
}

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/interviews/resume-text
// Resume text extracted in browser → plain JSON → Gemini → interview
// NO multer, NO pdf-parse, NO pdfjs-dist — nothing to install
// ══════════════════════════════════════════════════════════════════════════════
router.post('/resume-text', async (req, res) => {
  try {
    const {
      userId,
      userEmail       = '',
      userName        = '',
      resumeText,
      jobPosition     = 'Software Engineer',
      jobDescription  = '',
      experienceLevel = 'intermediate',
      interviewType   = 'mixed',
      totalQuestions  = 8,
    } = req.body;

    if (!userId)
      return res.status(400).json({ success: false, message: 'User ID is required' });
    if (!resumeText || resumeText.trim().length < 50)
      return res.status(400).json({ success: false, message: 'Resume text is too short or empty' });

    console.log(`📄 Resume-text: user=${userId} | position=${jobPosition} | chars=${resumeText.length}`);

    // Load user profile for supplemental data
    let userProfile = null;
    try { userProfile = await User.findOne({ clerkId: userId }); } catch {}

    const skills      = userProfile?.skills      || [];
    const targetRoles = userProfile?.targetRoles || [];
    const goals       = userProfile?.goals       || [];

    // Build resume-first context for Gemini
    const jdBlock = jobDescription.trim()
      ? `════ JOB DESCRIPTION ════\n${jobDescription.slice(0, 800)}\n\nMatch resume skills to this JD — probe the intersection deeply.`
      : '';

    const profileContext = `════ CANDIDATE PROFILE: FROM RESUME ════
TARGET POSITION: "${jobPosition}"
EXPERIENCE LEVEL: ${experienceLevel}

════ RESUME CONTENT ════
${resumeText.slice(0, 3000)}

${jdBlock}

════ WHAT TO ASK ════
You have READ this candidate's actual resume above.
- Ask about SPECIFIC projects and experiences mentioned in the resume
- If a project is listed → ask "Tell me about [project] — your role, challenges, what you'd do differently"
- If a technology is listed → probe how deeply they know it with scenario-based questions
- If JD is provided → find resume skills matching JD requirements and probe those
- Mix: technical depth checks + behavioral from their actual experience + situational
- Every question must be anchored to something in THEIR resume — no generic questions
${skills.length > 0 ? `\nAdditional skills from profile: ${skills.join(', ')}` : ''}
${goals.length > 0   ? `\nCareer goals: ${goals.join(', ')}` : ''}`;

    // Call existing Gemini function — no new service
    let geminiQuestions = [];
    try {
      geminiQuestions = await generatePersonalizedInterviewQuestions({
        jobPosition,
        experienceLevel,
        interviewType,
        numQuestions:   parseInt(totalQuestions),
        userDomain:     jobPosition,
        profileContext,
        skills,
        targetRoles,
        goals,
        jobDescription,
        weakAreas: [],
        userType: 'jobseeker',
      });
    } catch (aiErr) {
      console.error('Gemini failed for resume interview:', aiErr.message);
      return res.status(500).json({ success: false, message: 'AI question generation failed. Check your Gemini API key.' });
    }

    // Format questions — same shape as existing interviews
    const formattedQuestions = geminiQuestions.map(q => ({
      question:            q.question,
      type:                q.type                                       || 'technical',
      difficulty:          q.difficulty                                 || 'medium',
      idealAnswer:         q.idealAnswer                                || '',
      keywords:            Array.isArray(q.keywords)            ? q.keywords            : [],
      keyConceptsRequired: Array.isArray(q.keyConceptsRequired) ? q.keyConceptsRequired : [],
      timeLimit:           q.timeLimit                                  || 120,
      topic:               q.topic                                      || jobPosition,
    }));

    // Save — same Interview model, same structure
    const interview = new Interview({
      userId,
      userEmail:       userEmail || userProfile?.email || '',
      userName:        userName  || `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim(),
      title:           `${jobPosition} — Resume Interview`,
      jobPosition,
      jobDescription:  jobDescription || `Resume-based interview for ${jobPosition}`,
      experienceLevel,
      interviewType,
      questions:       formattedQuestions,
      status:          'draft',
      startedAt:       new Date(),
    });

    await interview.save();

    res.status(201).json({
      success: true,
      message: 'Resume interview created successfully',
      data:    interview,
    });

  } catch (error) {
    console.error('Resume-text route error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create resume interview' });
  }
});

export default router;

