import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

dotenv.config();

// ─────────────────────────────────────────────────────────────────────────────
// Terminal Colors & Logger
// ─────────────────────────────────────────────────────────────────────────────
const c = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  magenta: '\x1b[35m',
  cyan:    '\x1b[36m',
  white:   '\x1b[37m',
  gray:    '\x1b[90m',
  bRed:     '\x1b[91m',
  bGreen:   '\x1b[92m',
  bYellow:  '\x1b[93m',
  bBlue:    '\x1b[94m',
  bMagenta: '\x1b[95m',
  bCyan:    '\x1b[96m',
  bWhite:   '\x1b[97m',
  bgRed:     '\x1b[41m',
  bgGreen:   '\x1b[42m',
  bgYellow:  '\x1b[43m',
  bgBlue:    '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan:    '\x1b[46m',
};

const statusColor = (status) => {
  if (status >= 500) return `${c.bold}${c.bgRed}${c.white} ${status} ${c.reset}`;
  if (status >= 400) return `${c.bold}${c.bgYellow}${c.white} ${status} ${c.reset}`;
  if (status >= 300) return `${c.bold}${c.bgCyan}${c.white} ${status} ${c.reset}`;
  if (status >= 200) return `${c.bold}${c.bgGreen}${c.white} ${status} ${c.reset}`;
  return `${c.bold}${c.gray} ${status} ${c.reset}`;
};

const methodColor = (method) => {
  const map = {
    GET:    `${c.bold}${c.bGreen}`,
    POST:   `${c.bold}${c.bBlue}`,
    PUT:    `${c.bold}${c.bYellow}`,
    PATCH:  `${c.bold}${c.bMagenta}`,
    DELETE: `${c.bold}${c.bRed}`,
  };
  const col = map[method] || `${c.bold}${c.gray}`;
  return `${col}${method.padEnd(6)}${c.reset}`;
};

const timeColor = (ms) => {
  const n = parseFloat(ms);
  if (n > 500) return `${c.bRed}${ms}${c.reset}`;
  if (n > 200) return `${c.bYellow}${ms}${c.reset}`;
  return `${c.bGreen}${ms}${c.reset}`;
};

const routeBadge = (url) => {
  if (url.startsWith('/api/interviews'))  return `${c.bgMagenta}${c.white}${c.bold} INTERVIEWS ${c.reset}`;
  if (url.startsWith('/api/questions'))   return `${c.bgCyan}${c.white}${c.bold} QUESTIONS  ${c.reset}`;
  if (url.startsWith('/api/users'))       return `${c.bgBlue}${c.white}${c.bold} USERS      ${c.reset}`;
  if (url.startsWith('/api/analytics'))   return `${c.bgYellow}${c.white}${c.bold} ANALYTICS  ${c.reset}`;
  if (url.startsWith('/api/preparation')) return `${c.bgGreen}${c.white}${c.bold} PREP       ${c.reset}`;
  if (url.startsWith('/api/assessments')) return `${c.bgRed}${c.white}${c.bold} ASSESS     ${c.reset}`;
  if (url.startsWith('/api/syllabus'))    return `${c.bgMagenta}${c.white}${c.bold} SYLLABUS   ${c.reset}`;
  if (url.startsWith('/api/feedback'))    return `${c.bgCyan}${c.white}${c.bold} FEEDBACK   ${c.reset}`;
  if (url.startsWith('/api/about'))       return `${c.bgGreen}${c.white}${c.bold} ABOUT      ${c.reset}`;
  if (url.startsWith('/api/help-chat'))   return `${c.bgBlue}${c.white}${c.bold} HELP-CHAT  ${c.reset}`;
  if (url.startsWith('/api/health'))      return `${c.bgGreen}${c.white}${c.bold} HEALTH     ${c.reset}`;
  return `${c.gray}${c.bold} API        ${c.reset}`;
};

morgan.token('ms', (req) => {
  if (!req._startAt) return '0ms';
  const diff = process.hrtime(req._startAt);
  return `${(diff[0] * 1e3 + diff[1] * 1e-6).toFixed(1)}ms`;
});

const morganFormat = (tokens, req, res) => {
  const status = tokens.status(req, res) || '???';
  const method = tokens.method(req, res) || '';
  const url    = tokens.url(req, res) || '';
  const ms     = tokens['ms'](req, res) || '';
  const len    = tokens.res(req, res, 'content-length') || '-';
  const time   = new Date().toLocaleTimeString('en-IN', { hour12: false });

  return [
    `${c.dim}${time}${c.reset}`,
    routeBadge(url),
    methodColor(method),
    statusColor(parseInt(status)),
    `${c.bWhite}${url}${c.reset}`,
    `${c.dim}→${c.reset}`,
    timeColor(ms),
    `${c.dim}${len}b${c.reset}`,
  ].join('  ');
};

const socketLog = (label, color, msg) => {
  const time = new Date().toLocaleTimeString('en-IN', { hour12: false });
  console.log(`${c.dim}${time}${c.reset}  ${color}${c.white}${c.bold} SOCKET     ${c.reset}  ${msg}`);
};

const printBanner = (port) => {
  const line = `${c.dim}${'─'.repeat(54)}${c.reset}`;
  console.log(`
${c.bMagenta}${c.bold}  ███████╗███╗   ███╗ █████╗ ██████╗ ████████╗
  ██╔════╝████╗ ████║██╔══██╗██╔══██╗╚══██╔══╝
  ███████╗██╔████╔██║███████║██████╔╝   ██║   
  ╚════██║██║╚██╔╝██║██╔══██║██╔══██╗   ██║   
  ███████║██║ ╚═╝ ██║██║  ██║██║  ██║   ██║   
  ╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝${c.reset}
${c.bCyan}${c.bold}         InterviewAI  —  API Server v2.0.0${c.reset}
`);
  console.log(`  ${line}`);
  console.log(`  ${c.dim}│${c.reset}  ${c.bGreen}◉${c.reset}  ${c.bold}Server  ${c.reset}  ${c.bWhite}http://localhost:${port}${' '.repeat(20 - String(port).length)}${c.reset}${c.dim}│${c.reset}`);
  console.log(`  ${c.dim}│${c.reset}  ${c.bGreen}◉${c.reset}  ${c.bold}Health  ${c.reset}  ${c.bWhite}http://localhost:${port}/api/health${' '.repeat(8 - String(port).length)}${c.reset}${c.dim}│${c.reset}`);
  console.log(`  ${c.dim}│${c.reset}  ${c.bYellow}◉${c.reset}  ${c.bold}Gemini  ${c.reset}  ${process.env.GEMINI_API_KEY    ? `${c.bGreen}✔  Enabled${c.reset}` : `${c.bRed}✘  Missing GEMINI_API_KEY${c.reset}`}${' '.repeat(process.env.GEMINI_API_KEY ? 28 : 14)}${c.dim}│${c.reset}`);
  console.log(`  ${c.dim}│${c.reset}  ${c.bBlue}◉${c.reset}  ${c.bold}Claude  ${c.reset}  ${process.env.ANTHROPIC_API_KEY ? `${c.bGreen}✔  Enabled${c.reset}` : `${c.bRed}✘  Missing ANTHROPIC_API_KEY${c.reset}`}${' '.repeat(process.env.ANTHROPIC_API_KEY ? 28 : 11)}${c.dim}│${c.reset}`);
  console.log(`  ${c.dim}│${c.reset}  ${c.bMagenta}◉${c.reset}  ${c.bold}Mode    ${c.reset}  ${c.bWhite}${(process.env.NODE_ENV || 'development').padEnd(36)}${c.reset}${c.dim}│${c.reset}`);
  console.log(`  ${line}\n`);
};

// ─────────────────────────────────────────────────────────────────────────────

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(morganFormat));

// Import routes
import interviewRoutes from './routes/interviews.js';
import questionRoutes from './routes/questions.js';
import userRoutes from './routes/users.js';
import analyticsRoutes from './routes/analytics.js';
import preparationRoutes from './routes/preparation.js';
import assessmentRoutes from './routes/assessments.js';
import syllabusRoutes from './routes/syllabus.js'; 
import feedbackRoutes from './routes/feedback.js';
import aboutRoutes from './routes/about.js';

// Routes
app.use('/api/interviews', interviewRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/preparation', preparationRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/syllabus', syllabusRoutes); 
app.use('/api/feedback', feedbackRoutes);
app.use('/api/about', aboutRoutes);
          

// ── Help Chat (Anthropic) ────────────────────────────────────────────────────
const HELP_SYSTEM_CONTEXT = `You are a helpful support assistant for SMART InterviewAi — an AI-powered mock interview platform for students and job seekers in India.

The platform helps users with:
- Mock interview practice (text & AI-driven)
- Personalised syllabi for students (Class 10, 11, 12 — PCM/PCB/Commerce/Arts) and job seekers (Software, Data Science, Product, Design, Finance, HR, Sales, Consulting etc.)
- Preparation resources and pro tips
- Performance tracking with scores and session history
- Profile customisation (student class/stream or job domain/experience level)

Answer questions about using the platform, troubleshooting, interview tips, and preparation strategies. Be concise, friendly, and helpful. Format answers clearly. If unsure, suggest contacting support@smartinterviewai.com.`;

app.post('/api/help-chat', async (req, res) => {
  const { messages } = req.body;
  const userText = messages[messages.length - 1]?.text || messages[messages.length - 1]?.content || '';

  const FAQS = [
    { q: "how do i start a mock interview", a: "Click 'New Interview' from your Dashboard or the Interviews page. Choose a title, type, number of questions, and difficulty. The AI will begin the session immediately." },
    { q: "how is my interview score calculated", a: "Scores are based on answer relevance, structure, depth, and communication clarity. Each question is evaluated independently by our AI, and the session score is the weighted average." },
    { q: "which domains are supported for job seekers", a: "We support 10+ domains: Software, Data Science, Product Management, Design, Finance, HR, Sales, Consulting, and more. Set your domain in your Profile page." },
    { q: "can i practise jee preparation interviews", a: "Yes! We support JEE (Main & Advanced), NEET, KVPY, CLAT, CAT, XAT, BITSAT, CUET and more. Set your class and stream in your Profile." },
    { q: "how do i reset my profile settings", a: "Go to your Profile page and update your user type, domain, class, stream, or experience level anytime." },
    { q: "how do i set my class and stream", a: "Go to your Profile page and select your class (10th, 11th, 12th, UG, PG, PhD) and stream. The dashboard will personalise your prep accordingly." },
    { q: "which entrance exams does the platform support", a: "We support JEE, NEET, KVPY, CLAT, CAT, XAT, BITSAT, CUET, and more. Each syllabus is mapped to your class and stream automatically." },
    { q: "can i use this for board exam prep", a: "Absolutely! Beyond entrance exams, our mock interviews also cover board-style conceptual questions." },
    { q: "are technical dsa rounds supported", a: "Yes. We have dedicated DSA rounds with questions across arrays, trees, graphs, DP and more with AI-evaluated feedback." },
    { q: "can i practise behavioural hr rounds", a: "Yes. Select 'Behavioral Round' or 'HR Discussion' when creating an interview. The AI asks STAR-method questions." },
    { q: "where can i see my progress", a: "Your Dashboard shows average score, completed sessions, practice hours, and performance level. The Interviews page lists all sessions with individual scores." },
    { q: "why is my score lower than expected", a: "Common reasons: answers too brief, missing key concepts, or weak structure. Check the Results page for per-question feedback." },
    { q: "how do i update my profile", a: "Click your avatar in the top-right and select 'My Profile', or navigate to /profile." },
    { q: "is my interview data private", a: "Yes. Your sessions, responses, and scores are private to your account. We never share your data with third parties." },
    { q: "how do i delete my account", a: "Go to Profile → Manage Account. From there you can request account deletion. All your data will be permanently removed within 7 days." },
    { q: "can i resume an incomplete interview", a: "Yes! In-progress interviews appear on your Dashboard and Interviews page. Click 'Continue' to pick up where you left off." },
    { q: "how many questions can i set per session", a: "You can choose between 5 and 20 questions per session. We recommend 8–10 for a focused 20–30 minute practice session." },
    { q: "what is the prep hub page", a: "The Prep Hub offers curated resources, topic guides, and reading lists tailored to your profile, updated regularly." },
    { q: "what is the syllabus page", a: "The Syllabus page shows a structured breakdown of topics to cover based on your class/stream or job domain." },
    { q: "is the platform free", a: "Yes — core features including mock interviews, scoring, and prep resources are free. Premium features may be introduced in future." },
  ];

  const input = userText.toLowerCase().replace(/[^a-z0-9 ]/g, '');

  // Find best matching FAQ
  let bestMatch = null;
  let bestScore = 0;

  for (const faq of FAQS) {
    const words = faq.q.split(' ');
    const matches = words.filter(w => input.includes(w)).length;
    const score = matches / words.length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = faq;
    }
  }

  const reply = bestScore > 0.3
    ? bestMatch.a
    : "I'm not sure about that. Please check our FAQ section on the left, or contact us at support@smartinterviewai.com for help.";

  res.json({ content: [{ text: reply }] });
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SMART InterviewAI API running',
    timestamp: new Date().toISOString(),
    aiEnabled: !!process.env.GEMINI_API_KEY,
    uptime: process.uptime()
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'SMART InterviewAI API',
    version: '2.0.0',
    endpoints: {
      interviews: '/api/interviews',
      questions: '/api/questions',
      users: '/api/users',
      analytics: '/api/analytics',
      preparation: '/api/preparation',
      assessments: '/api/assessments',
      syllabus: '/api/syllabus'                      
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Socket.IO — Real-time Interview Engine
// ─────────────────────────────────────────────────────────────────────────────
import Interview from './models/Interview.js';
import InterviewResult from './models/InterviewResult.js';
import User from './models/User.js';
import { analyzeInterviewAnswer, generateInterviewSummary } from './services/aiService.js';

// Map of interviewId → Set of socket IDs
const activeInterviews = new Map();

// Map of socketId → anti-cheat metrics
const antiCheatLog = new Map();

io.on('connection', (socket) => {
  socketLog('CONNECT', c.bgGreen, `${c.bGreen}CONNECT${c.reset}     ${c.bWhite}${socket.id}${c.reset}`);

  // ── Join interview room ──────────────────────────────────────────────────
  socket.on('join_interview', async ({ interviewId, userId }) => {
    try {
      const interview = await Interview.findOne({ _id: interviewId, userId });
      if (!interview) {
        socket.emit('error', { message: 'Interview not found or access denied' });
        return;
      }

      socket.join(interviewId);

      if (!activeInterviews.has(interviewId)) activeInterviews.set(interviewId, new Set());
      activeInterviews.get(interviewId).add(socket.id);

      // Initialise anti-cheat log for this socket
      antiCheatLog.set(socket.id, {
        tabSwitches: 0,
        screenshotAttempts: 0,
        copyPasteAttempts: 0,
        flags: [],
        joinedAt: new Date()
      });

      socket.emit('ai_ready', {
        message: 'AI Interviewer is ready. Good luck!',
        interview: {
          id: interview._id,
          title: interview.title,
          jobPosition: interview.jobPosition,
          totalQuestions: interview.questions.length,
          estimatedDuration: `${interview.questions.length * 2}-${interview.questions.length * 3} minutes`
        }
      });

      socketLog('JOIN', c.bgMagenta, `${c.bMagenta}JOIN_ROOM${c.reset}   ${c.bWhite}interview:${interviewId}${c.reset}  ${c.dim}user:${userId}${c.reset}`);
    } catch (err) {
      console.error('join_interview error:', err);
      socket.emit('error', { message: 'Failed to join interview session' });
    }
  });

  // ── Start interview ──────────────────────────────────────────────────────
  socket.on('start_interview', async ({ interviewId, userId }) => {
    try {
      const interview = await Interview.findOne({ _id: interviewId, userId });
      if (!interview) {
        socket.emit('error', { message: 'Interview not found' });
        return;
      }

      await Interview.findByIdAndUpdate(interviewId, {
        status: 'in_progress',
        startedAt: new Date(),
        currentQuestionIndex: 0
      });

      // Store session data on socket
      socket.interviewData = {
        interviewId,
        userId,
        questions: interview.questions,
        currentQuestionIndex: 0,
        startTime: new Date(),
        answers: [],
        questionStartTimes: [new Date()],
        timePerQuestion: []
      };

      const first = interview.questions[0];

      io.to(interviewId).emit('interview_started', {
        question: {
          id: first._id,
          text: first.question,
          type: first.type,
          difficulty: first.difficulty,
          topic: first.topic || '',
          timeLimit: first.timeLimit || 120
        },
        totalQuestions: interview.questions.length,
        currentQuestion: 1,
        interviewType: interview.interviewType
      });

      socketLog('START', c.bgGreen, `${c.bGreen}STARTED${c.reset}     ${c.bWhite}interview:${interviewId}${c.reset}  ${c.dim}${interview.questions.length} questions${c.reset}`);
    } catch (err) {
      console.error('start_interview error:', err);
      socket.emit('error', { message: 'Failed to start interview' });
    }
  });

  // ── Process user response ────────────────────────────────────────────────
  socket.on('user_response', async ({ interviewId, message, transcript, gestures, postureScore }) => {
    try {
      if (!socket.interviewData) {
        socket.emit('error', { message: 'No active interview session found' });
        return;
      }

      const interview = await Interview.findById(interviewId);
      if (!interview) {
        socket.emit('error', { message: 'Interview not found' });
        return;
      }

      const idx = socket.interviewData.currentQuestionIndex;
      const currentQuestion = socket.interviewData.questions[idx];
      const userAnswer = (message || transcript || '').trim();

      // Record time spent on this question
      const qStart = socket.interviewData.questionStartTimes[idx] || socket.interviewData.startTime;
      const timeSpent = Math.floor((new Date() - new Date(qStart)) / 1000);
      socket.interviewData.timePerQuestion.push(timeSpent);

      // Emit "thinking" state so frontend can show loader
      socket.emit('ai_thinking', { message: 'Analysing your answer…' });

      // ── Gemini AI analysis ──
      let analysis = {
        score: 0,
        strengths: [],
        improvements: ['No answer was detected.'],
        detailedFeedback: 'Please provide a verbal or typed answer.',
        technicalScore: 0,
        communicationScore: 0
      };

      if (userAnswer.length > 5) {
        try {
          let uDomain = interview.jobPosition;
          try {
            const uDoc = await User.findOne({ clerkId: socket.interviewData.userId });
            if (uDoc) uDomain = uDoc.domain || uDoc.jobTitle || interview.jobPosition;
          } catch {}

          analysis = await analyzeInterviewAnswer({
            question: currentQuestion.question,
            idealAnswer: currentQuestion.idealAnswer || '',
            keywords: currentQuestion.keywords || [],
            userAnswer,
            questionType: currentQuestion.type,
            difficulty: currentQuestion.difficulty,
            jobPosition: interview.jobPosition,
            experienceLevel: interview.experienceLevel,
            userDomain: uDomain
          });
        } catch (aiErr) {
          console.error('Answer analysis error:', aiErr.message);
        }
      }

      // Save to DB
      interview.questions[idx].userAnswer = {
        text: userAnswer,
        timeSpent
      };
      interview.questions[idx].feedback = {
        score: analysis.score,
        strengths: analysis.strengths,
        improvements: analysis.improvements,
        detailedFeedback: analysis.detailedFeedback
      };

      socket.interviewData.answers.push({
        questionText: currentQuestion.question,
        userAnswer,
        score: analysis.score,
        feedback: analysis.detailedFeedback,
        strengths: analysis.strengths,
        improvements: analysis.improvements,
        timeSpent
      });

      socket.interviewData.currentQuestionIndex++;
      interview.currentQuestionIndex = socket.interviewData.currentQuestionIndex;
      await interview.save();

      // Send immediate feedback for this answer
      socket.emit('answer_feedback', {
        questionIndex: idx,
        score: analysis.score,
        strengths: analysis.strengths,
        improvements: analysis.improvements,
        detailedFeedback: analysis.detailedFeedback,
        timeSpent
      });

      // ── Check if interview is complete ──
      const isComplete = socket.interviewData.currentQuestionIndex >= socket.interviewData.questions.length;

      if (isComplete) {
        socket.emit('ai_thinking', { message: 'Generating your comprehensive report…' });

        const questionsAndAnswers = socket.interviewData.answers.map(a => ({
          question: a.questionText,
          answer: a.userAnswer
        }));
        const scores = socket.interviewData.answers.map(a => a.score);

        let summary = null;
        try {
          summary = await generateInterviewSummary({
            jobPosition: interview.jobPosition,
            experienceLevel: interview.experienceLevel,
            interviewType: interview.interviewType,
            questionsAndAnswers,
            questionScores: scores
          });
        } catch (e) {
          console.error('Summary generation error:', e.message);
        }

        const avgScore = scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;

        // Get anti-cheat metrics
        const cheatLog = antiCheatLog.get(socket.id) || {};
        const integrityScore = Math.max(0,
          100
          - (cheatLog.tabSwitches || 0) * 15
          - (cheatLog.screenshotAttempts || 0) * 10
          - (cheatLog.copyPasteAttempts || 0) * 5
        );

        // Update interview document
        interview.status = 'completed';
        interview.completedAt = new Date();
        interview.overallScore = summary?.overallScore || avgScore;
        interview.analysis = {
          technicalSkills: summary?.technicalSkills || avgScore,
          communication: summary?.communication || avgScore,
          problemSolving: summary?.problemSolving || avgScore,
          confidence: summary?.confidence || avgScore,
          overallFeedback: summary?.overallFeedback || 'Interview completed.',
          strengths: summary?.strengths || [],
          improvements: summary?.improvements || []
        };
        interview.results = {
          technicalScore: summary?.technicalSkills || avgScore,
          behavioralScore: summary?.culturalFit || avgScore,
          communicationScore: summary?.communication || avgScore,
          overallFeedback: summary?.overallFeedback || '',
          strengths: summary?.strengths || [],
          improvements: summary?.improvements || [],
          hiringRecommendation: summary?.hiringRecommendation || '',
          studyRecommendations: summary?.studyRecommendations || []
        };
        if (interview.startedAt) {
          interview.duration = Math.floor((new Date() - interview.startedAt) / 60000);
        }
        await interview.save();

        // Save InterviewResult document
        try {
          const answersAnalysis = socket.interviewData.answers.map((a, i) => ({
            questionId: socket.interviewData.questions[i]?._id,
            questionText: a.questionText,
            userAnswer: a.userAnswer,
            technicalAccuracy: a.score,
            communication: a.score,
            feedback: a.feedback,
            suggestions: a.improvements || []
          }));

          await new InterviewResult({
            interviewId: interview._id,
            userId: socket.interviewData.userId,
            overallScore: interview.overallScore,
            duration: interview.duration,
            answersAnalysis,
            metrics: {
              technical: summary?.technicalSkills || avgScore,
              communication: summary?.communication || avgScore,
              problemSolving: summary?.problemSolving || avgScore,
              confidence: summary?.confidence || avgScore,
              culturalFit: summary?.culturalFit || avgScore
            },
            feedback: {
              overall: summary?.overallFeedback || '',
              strengths: summary?.strengths || [],
              improvements: summary?.improvements || [],
              recommendation: summary?.hiringRecommendation || ''
            },
            aiInsights: {
              personalityTraits: [],
              communicationStyle: summary?.personalityInsights || '',
              technicalDepth: '',
              improvementAreas: summary?.studyRecommendations || []
            }
          }).save();

          // Update user stats
          await User.findOneAndUpdate(
            { clerkId: socket.interviewData.userId },
            {
              $inc: {
                'stats.completedInterviews': 1,
                'stats.totalPracticeTime': interview.duration || 0
              },
              $set: { 'stats.lastActiveDate': new Date() }
            }
          );
        } catch (saveErr) {
          console.error('InterviewResult save error:', saveErr.message);
        }

        io.to(interviewId).emit('interview_completed', {
          overallScore: interview.overallScore,
          feedback: interview.analysis.overallFeedback,
          metrics: {
            technical: interview.analysis.technicalSkills,
            communication: interview.analysis.communication,
            problemSolving: interview.analysis.problemSolving,
            confidence: interview.analysis.confidence
          },
          strengths: interview.analysis.strengths,
          improvements: interview.analysis.improvements,
          hiringRecommendation: summary?.hiringRecommendation || '',
          studyRecommendations: summary?.studyRecommendations || [],
          personalityInsights: summary?.personalityInsights || '',
          integrityScore,
          antiCheatFlags: cheatLog.flags || [],
          perQuestionScores: socket.interviewData.answers.map((a, i) => ({
            questionNumber: i + 1,
            score: a.score,
            timeSpent: a.timeSpent
          }))
        });

        socketLog('DONE', c.bgGreen, `${c.bGreen}COMPLETED${c.reset}   ${c.bWhite}interview:${interviewId}${c.reset}  ${c.bYellow}score:${interview.overallScore}${c.reset}`);
      } else {
        // Send next question
        const next = socket.interviewData.questions[socket.interviewData.currentQuestionIndex];
        socket.interviewData.questionStartTimes[socket.interviewData.currentQuestionIndex] = new Date();

        io.to(interviewId).emit('ai_message', {
          text: next.question,
          type: 'question',
          questionId: next._id,
          topic: next.topic || '',
          difficulty: next.difficulty,
          timeLimit: next.timeLimit || 120,
          questionNumber: socket.interviewData.currentQuestionIndex + 1,
          totalQuestions: socket.interviewData.questions.length
        });
      }
    } catch (err) {
      console.error('user_response error:', err);
      socket.emit('error', { message: 'Failed to process your response. Please try again.' });
    }
  });

  // ── Anti-cheat: tab switch reported from client ──────────────────────────
  socket.on('anti_cheat_event', ({ type, interviewId }) => {
    const log = antiCheatLog.get(socket.id);
    if (!log) return;

    if (type === 'tab_switch') {
      log.tabSwitches++;
      log.flags.push({ type: 'TAB_SWITCH', timestamp: new Date() });
      const remaining = Math.max(0, 3 - log.tabSwitches);
      const time = new Date().toLocaleTimeString('en-IN', { hour12: false });
      console.log(`${c.dim}${time}${c.reset}  ${c.bgYellow}${c.white}${c.bold} ANTICHEAT  ${c.reset}  ${c.bYellow}TAB_SWITCH${c.reset}  ${c.dim}warn:${log.tabSwitches}/3  socket:${socket.id}${c.reset}`);
      io.to(interviewId).emit('anti_cheat_warning', {
        type: 'TAB_SWITCH',
        count: log.tabSwitches,
        message: `Tab switch detected! Warning ${log.tabSwitches}/3.${remaining > 0 ? ` ${remaining} warning(s) remaining.` : ' Session will be flagged.'}`,
        flagged: log.tabSwitches >= 3
      });
    }

    if (type === 'screenshot') {
      log.screenshotAttempts++;
      log.flags.push({ type: 'SCREENSHOT', timestamp: new Date() });
      const time = new Date().toLocaleTimeString('en-IN', { hour12: false });
      console.log(`${c.dim}${time}${c.reset}  ${c.bgYellow}${c.white}${c.bold} ANTICHEAT  ${c.reset}  ${c.bYellow}SCREENSHOT${c.reset}  ${c.dim}socket:${socket.id}${c.reset}`);
      io.to(interviewId).emit('anti_cheat_warning', {
        type: 'SCREENSHOT',
        count: log.screenshotAttempts,
        message: `Screenshot attempt blocked. Warning recorded.`,
        flagged: false
      });
    }

    if (type === 'copy_paste') {
      log.copyPasteAttempts++;
      log.flags.push({ type: 'COPY_PASTE', timestamp: new Date() });
    }
  });

  // ── End interview early ──────────────────────────────────────────────────
  socket.on('end_interview', async ({ interviewId, userId }) => {
    try {
      const interview = await Interview.findById(interviewId);
      if (!interview) {
        socket.emit('error', { message: 'Interview not found' });
        return;
      }

      interview.status = 'completed';
      interview.completedAt = new Date();
      if (interview.startedAt) {
        interview.duration = Math.floor((new Date() - interview.startedAt) / 60000);
      }

      const answeredScores = interview.questions
        .filter(q => q.feedback?.score !== undefined)
        .map(q => q.feedback.score);
      const avg = answeredScores.length > 0
        ? Math.round(answeredScores.reduce((a, b) => a + b, 0) / answeredScores.length)
        : 0;

      interview.overallScore = avg;
      interview.analysis = {
        technicalSkills: avg, communication: avg, problemSolving: avg, confidence: avg,
        overallFeedback: 'Interview ended early. Review individual question feedback below.',
        strengths: [], improvements: ['Complete all questions for a full evaluation']
      };
      await interview.save();

      socketLog('END', c.bgRed, `${c.bRed}ENDED_EARLY${c.reset}  ${c.bWhite}interview:${interviewId}${c.reset}  ${c.bYellow}score:${avg}${c.reset}`);

      io.to(interviewId).emit('interview_completed', {
        overallScore: avg,
        feedback: 'Interview ended early. Some questions were not answered.',
        metrics: { technical: avg, communication: avg, problemSolving: avg, confidence: avg },
        strengths: [],
        improvements: ['Complete all questions for a comprehensive assessment'],
        hiringRecommendation: 'Incomplete',
        studyRecommendations: []
      });
    } catch (err) {
      console.error('end_interview error:', err);
      socket.emit('error', { message: 'Failed to end interview' });
    }
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    socketLog('DISCONNECT', c.bgRed, `${c.bRed}DISCONNECT${c.reset}  ${c.bWhite}${socket.id}${c.reset}  ${c.dim}(${reason})${c.reset}`);

    // Clean up anti-cheat log
    antiCheatLog.delete(socket.id);

    if (socket.interviewData) {
      const { interviewId } = socket.interviewData;
      if (activeInterviews.has(interviewId)) {
        activeInterviews.get(interviewId).delete(socket.id);
        if (activeInterviews.get(interviewId).size === 0) {
          activeInterviews.delete(interviewId);
        }
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Error handling
// ─────────────────────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─────────────────────────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────────────────────────
const connectDB = async () => {
  const conn = await mongoose.connect(
    process.env.MONGODB_URI || 'mongodb://localhost:27017/smartinterviewai'
  );
  console.log(`\n  ${c.bgGreen}${c.white}${c.bold} MONGODB ${c.reset}  ${c.bGreen}Connected${c.reset}  ${c.dim}${conn.connection.host}${c.reset}\n`);
};

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    printBanner(PORT);
  });
};

startServer().catch(err => {
  console.error(`\n  ${c.bgRed}${c.white}${c.bold} ERROR ${c.reset}  ${c.bRed}Startup failed:${c.reset}`, err);
  process.exit(1);
});