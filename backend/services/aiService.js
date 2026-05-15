import { GoogleGenerativeAI } from '@google/generative-ai';

import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Safely parse JSON from Gemini response (strips markdown fences)
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

// ── 1. Generate personalised interview questions ─────────────────────────────
export async function generatePersonalizedInterviewQuestions({
  jobPosition,
  experienceLevel,
  interviewType = 'mixed',
  numQuestions = 5,
  userDomain,
  weakAreas = [],
  userType = 'jobseeker',
  studentClass = '',
  stream = '',
  jobDescription = '',
  profileContext = '',  // ← NEW: pre-built rich context from interviews.js
  skills = [],          // ← NEW: ['React', 'Node.js', 'Python']
  targetRoles = [],     // ← NEW: ['Senior Frontend Dev', 'Tech Lead']
  goals = []            // ← NEW: ['Get first job', 'Crack FAANG']
}) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const contextBlock = profileContext || (
    userType === 'student'
      ? `The candidate is a student in class/level "${studentClass}", studying "${stream}".
         Focus on subject-specific conceptual knowledge and academic problem-solving.`
      : `The candidate is a professional applying for: "${jobPosition}" (${experienceLevel} level).
         Domain: ${userDomain}. Skills: ${skills.join(', ') || 'not listed'}.
         Target roles: ${targetRoles.join(', ') || jobPosition}.
         ${jobDescription ? `Job description: ${jobDescription.slice(0, 400)}` : ''}`
  );

 const skillsDirective = !profileContext && skills.length > 0
  ? `\nCRITICAL: The candidate listed these specific skills: ${skills.join(', ')}.
At least ${Math.ceil(numQuestions * 0.5)} questions MUST directly test these specific technologies.
Do NOT ask generic questions. React listed → ask about React. Python listed → ask Python questions.`
  : '';

  const rolesDirective = targetRoles.length > 0
    ? `\nTarget roles: ${targetRoles.join(', ')}. Frame questions around what these roles require.` : '';

  const weakBlock = weakAreas.length > 0
    ? `\nIMPORTANT: Include at least 2 questions targeting these weak areas: ${weakAreas.join(', ')}.` : '';

  const goalsDirective = goals.length > 0
    ? `\nCandidate's goals: ${goals.join(', ')}. Tailor behavioural questions to these.` : '';

  // ✅ FIX 1: 'situational' removed from mixed description
  const typeGuide = {
    technical: 'All questions test technical knowledge, coding, or domain expertise specific to their listed skills.',
    behavioral: 'All questions use real STAR-format scenarios relevant to their experience and domain.',
    mixed: `Mix: ~${Math.ceil(numQuestions * 0.5)} technical (testing their specific skills), ~${Math.floor(numQuestions * 0.3)} behavioral, ~${Math.floor(numQuestions * 0.2)} mixed context/scenario based.`
  }[interviewType] || '';

  const prompt = `You are an expert senior interviewer conducting a REAL personalised interview.
Generate exactly ${numQuestions} highly specific questions tailored to THIS candidate's profile.

════ CANDIDATE PROFILE ════
${contextBlock}
${skillsDirective}
${rolesDirective}
${goalsDirective}
${weakBlock}

════ INTERVIEW CONFIGURATION ════
INTERVIEW TYPE: ${interviewType}
${typeGuide}

════ STRICT QUALITY RULES ════
- Questions MUST be specific to THIS candidate — NOT generic questions
- If they listed React → ask about React hooks/state/performance optimisation
- If they study PCM → ask about Physics/Maths/Chemistry specific to their class
- If they listed Python → ask Python-specific patterns, libraries, or debug scenarios
- If they listed SQL → ask SQL query writing or query optimisation questions
- For students: ask about their specific stream concepts and academic projects
- Vary difficulty: ~30% easy (warm-up), ~50% medium (core), ~20% hard (stretch)
- Every question must have a clear ideal answer and relevant evaluation keywords
- Time limits: easy=90s, medium=120s, hard=180s
- CRITICAL: "type" field MUST be exactly one of: "technical", "behavioral", "mixed" — NOTHING ELSE. Do NOT use "situational".

Respond ONLY with a valid JSON array. No markdown, no preamble:
[
  {
    "question": "full specific question text",
    "type": "technical|behavioral|mixed",
    "difficulty": "easy|medium|hard",
    "idealAnswer": "3-5 sentence comprehensive model answer",
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "keyConceptsRequired": ["concept1", "concept2"],
    "timeLimit": 120,
    "topic": "specific topic e.g. React Hooks, SQL Joins, Thermodynamics, Leadership"
  }
]`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = safeParseJSON(text);

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Gemini returned invalid question data');
  }

  return parsed.slice(0, numQuestions);
}

// ── 2. Analyse a single answer with Gemini ───────────────────────────────────
export async function analyzeInterviewAnswer({
  question,
  idealAnswer,
  keywords = [],
  userAnswer,
  questionType = 'technical',
  difficulty = 'medium',
  jobPosition,
  experienceLevel,
  userDomain
}) {
  if (!userAnswer || userAnswer.trim().length < 5) {
    return {
      score: 0,
      strengths: [],
      improvements: ['No answer was provided.'],
      detailedFeedback: 'No answer was detected. Please speak clearly into the microphone or type your response.',
      keywordsCovered: [],
      communicationScore: 0,
      technicalScore: 0
    };
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are an expert interviewer evaluating a candidate's interview answer.

ROLE/POSITION: ${jobPosition || userDomain} (${experienceLevel} level)
QUESTION TYPE: ${questionType} | DIFFICULTY: ${difficulty}

QUESTION:
"${question}"

IDEAL ANSWER REFERENCE:
"${idealAnswer || 'Not provided — use your expertise to evaluate.'}"

KEY CONCEPTS EXPECTED: ${keywords.length > 0 ? keywords.join(', ') : 'General competency'}

CANDIDATE'S ANSWER:
"${userAnswer}"

Evaluate the answer on these dimensions. Be realistic and strict — a mediocre answer should score 40-60, good answer 65-80, excellent 85-100.

Respond ONLY with a valid JSON object:
{
  "score": <integer 0-100>,
  "technicalScore": <integer 0-100>,
  "communicationScore": <integer 0-100>,
  "keywordsCovered": ["keywords from the expected list that were addressed"],
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["specific improvement 1", "specific improvement 2", "specific improvement 3"],
  "detailedFeedback": "3-4 sentences of actionable, specific feedback mentioning what was good and what was missing",
  "missingConcepts": ["concept1", "concept2"]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = safeParseJSON(text);

    if (!parsed || typeof parsed.score !== 'number') throw new Error('Invalid analysis response');

    return {
      score: Math.max(0, Math.min(100, parsed.score)),
      technicalScore: parsed.technicalScore || parsed.score,
      communicationScore: parsed.communicationScore || parsed.score,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      detailedFeedback: parsed.detailedFeedback || '',
      keywordsCovered: Array.isArray(parsed.keywordsCovered) ? parsed.keywordsCovered : [],
      missingConcepts: Array.isArray(parsed.missingConcepts) ? parsed.missingConcepts : []
    };
  } catch (err) {
    console.error('analyzeInterviewAnswer error:', err.message);
    const wordCount = userAnswer.trim().split(/\s+/).length;
    const baseScore = Math.min(60, Math.max(20, wordCount * 1.5));
    return {
      score: Math.round(baseScore),
      technicalScore: Math.round(baseScore),
      communicationScore: Math.round(baseScore),
      strengths: ['Answer was provided'],
      improvements: ['Could not perform detailed AI analysis. Please check your API key.'],
      detailedFeedback: 'AI analysis temporarily unavailable. Your answer has been recorded.',
      keywordsCovered: [],
      missingConcepts: []
    };
  }
}

// ── 3. Generate final interview summary ──────────────────────────────────────
export async function generateInterviewSummary({
  jobPosition,
  experienceLevel,
  interviewType,
  questionsAndAnswers = [],
  questionScores = []
}) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const avgScore = questionScores.length > 0
    ? Math.round(questionScores.reduce((a, b) => a + b, 0) / questionScores.length)
    : 0;

  const qaText = questionsAndAnswers
    .slice(0, 8)
    .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer || '(No answer)'}`)
    .join('\n\n');

  const prompt = `You are a senior HR manager writing a post-interview evaluation report.

POSITION: ${jobPosition} (${experienceLevel})
INTERVIEW TYPE: ${interviewType}
AVERAGE QUESTION SCORE: ${avgScore}/100

INTERVIEW TRANSCRIPT:
${qaText}

Write a comprehensive evaluation. Be honest and constructive — don't inflate scores.

Respond ONLY with valid JSON:
{
  "overallScore": <integer 0-100, weighted considering transcript quality>,
  "technicalSkills": <integer 0-100>,
  "communication": <integer 0-100>,
  "problemSolving": <integer 0-100>,
  "confidence": <integer 0-100>,
  "culturalFit": <integer 0-100>,
  "overallFeedback": "3-4 sentences summarising overall performance",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["area 1", "area 2", "area 3"],
  "hiringRecommendation": "Strong Hire|Hire|Maybe|No Hire",
  "studyRecommendations": ["specific topic/resource to study 1", "specific topic 2", "specific topic 3"],
  "personalityInsights": "1-2 sentences about communication style and approach"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = safeParseJSON(text);
    if (!parsed || typeof parsed.overallScore !== 'number') throw new Error('Invalid summary');
    return parsed;
  } catch (err) {
    console.error('generateInterviewSummary error:', err.message);
    return {
      overallScore: avgScore,
      technicalSkills: avgScore,
      communication: avgScore,
      problemSolving: avgScore,
      confidence: avgScore,
      culturalFit: avgScore,
      overallFeedback: 'Interview completed successfully.',
      strengths: [],
      improvements: [],
      hiringRecommendation: avgScore >= 70 ? 'Hire' : avgScore >= 50 ? 'Maybe' : 'No Hire',
      studyRecommendations: [],
      personalityInsights: ''
    };
  }
}

// ── 4. Generate preparation content ──────────────────────────────────────────
export async function generatePreparationContent({
  topic,
  userType,
  experienceLevel,
  domain
}) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are a world-class interview coach. Create a focused preparation guide.

TOPIC: "${topic}"
USER TYPE: ${userType} | LEVEL: ${experienceLevel} | DOMAIN: ${domain}

Respond ONLY with valid JSON:
{
  "overview": "2-3 sentence topic overview",
  "keyConceptsToKnow": ["concept1", "concept2", "concept3", "concept4", "concept5"],
  "commonInterviewQuestions": [
    {"question": "question text", "hint": "what to focus on"}
  ],
  "studyTips": ["tip1", "tip2", "tip3"],
  "resources": ["resource/book/website 1", "resource 2"],
  "estimatedPrepTime": "X hours"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return safeParseJSON(text) || {};
}

// ── 5. Generate assessment questions ─────────────────────────────────────────
export async function generateAssessmentQuestions({
  topic,
  subject,
  difficulty = 'medium',
  numQuestions = 10,
  userType = 'jobseeker',
  experienceLevel = 'intermediate',
  questionTypes = ['mcq', 'short_answer']
}) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are an expert assessment designer. Create a ${difficulty}-difficulty assessment.

TOPIC: "${topic}"
SUBJECT: "${subject || topic}"
USER TYPE: ${userType} | LEVEL: ${experienceLevel}
NUMBER OF QUESTIONS: ${numQuestions}
QUESTION TYPES REQUESTED: ${questionTypes.join(', ')}

Generate exactly ${numQuestions} questions mixing the requested types.

Respond ONLY with a valid JSON array:
[
  {
    "question": "question text",
    "type": "mcq|short_answer|true_false|coding",
    "difficulty": "easy|medium|hard",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
    "correctAnswer": "A) option1",
    "explanation": "why this is correct",
    "points": 10,
    "topic": "sub-topic",
    "hint": ""
  }
]

Rules:
- For short_answer/coding: set options to [] and correctAnswer to the model answer text
- For true_false: set options to ["True", "False"]
- For mcq: always provide exactly 4 options`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = safeParseJSON(text);
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Invalid assessment questions');
    return parsed.slice(0, numQuestions);
  } catch (err) {
    console.error('generateAssessmentQuestions error:', err.message);
    return Array.from({ length: Math.min(numQuestions, 5) }, (_, i) => ({
      question: `Question ${i + 1}: Explain a key concept related to ${topic}.`,
      type: 'short_answer',
      difficulty,
      options: [],
      correctAnswer: 'A thorough explanation demonstrating understanding of the concept.',
      explanation: 'Tests conceptual understanding.',
      points: 10,
      topic,
      hint: ''
    }));
  }
}

// ── 6. Evaluate a single assessment answer ────────────────────────────────────
export async function evaluateAssessmentAnswer({
  question,
  correctAnswer,
  userAnswer,
  questionType = 'short_answer',
  points = 10,
  topic,
  explanation
}) {
  if (!userAnswer || userAnswer.trim().length < 1) {
    return {
      pointsEarned: 0,
      isCorrect: false,
      feedback: 'No answer provided.',
      partialCredit: false,
      correctnessPercent: 0
    };
  }

  // MCQ / true_false: direct match
  if (questionType === 'mcq' || questionType === 'true_false') {
    const normalize = (s) => (s || '').toString().trim().toLowerCase();
    const ua = normalize(userAnswer);
    const ca = normalize(correctAnswer);
    // Match full string OR just the leading letter (e.g. "a" vs "a) option text")
    const isCorrect = ua === ca || ua.charAt(0) === ca.charAt(0);
    return {
      pointsEarned: isCorrect ? points : 0,
      isCorrect,
      partialCredit: false,
      feedback: isCorrect
        ? `Correct! ${explanation || ''}`
        : `Incorrect. The correct answer is: ${correctAnswer}. ${explanation || ''}`,
      correctnessPercent: isCorrect ? 100 : 0
    };
  }

  // Short answer / coding: Gemini grading
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are evaluating a student's assessment answer.

TOPIC: ${topic || 'General'}
QUESTION TYPE: ${questionType}
QUESTION: "${question}"
MODEL ANSWER: "${correctAnswer}"
STUDENT ANSWER: "${userAnswer}"
MAX POINTS: ${points}

Grade fairly. Partial credit is allowed for partially correct answers.

Respond ONLY with valid JSON:
{
  "pointsEarned": <number 0-${points}>,
  "isCorrect": <true if full marks>,
  "partialCredit": <true if partial marks awarded>,
  "feedback": "1-2 sentences of specific feedback",
  "correctnessPercent": <0-100>
}`;

  try {
    const result = await model.generateContent(prompt);
    const parsed = safeParseJSON(result.response.text());
    if (!parsed || typeof parsed.pointsEarned !== 'number') throw new Error('Invalid evaluation');
    return {
      pointsEarned: Math.max(0, Math.min(points, parsed.pointsEarned)),
      isCorrect: parsed.isCorrect || false,
      partialCredit: parsed.partialCredit || false,
      feedback: parsed.feedback || '',
      correctnessPercent: parsed.correctnessPercent || 0
    };
  } catch (err) {
    console.error('evaluateAssessmentAnswer error:', err.message);
    // Keyword-match fallback
    const aWords = userAnswer.toLowerCase().split(/\s+/);
    const cWords = correctAnswer.toLowerCase().split(/\s+/);
    const matches = aWords.filter(w => cWords.includes(w) && w.length > 3).length;
    const ratio = Math.min(1, matches / Math.max(cWords.length * 0.3, 1));
    return {
      pointsEarned: Math.round(points * ratio),
      isCorrect: ratio >= 0.8,
      partialCredit: ratio > 0.2 && ratio < 0.8,
      feedback: 'Auto-graded via keyword matching. Manual review recommended.',
      correctnessPercent: Math.round(ratio * 100)
    };
  }
}

// ── 7. Generate assessment feedback report ────────────────────────────────────
export async function generateAssessmentFeedback({
  topic,
  userType,
  experienceLevel,
  totalScore,
  maxScore,
  answeredQuestions = [],
  weakTopics = []
}) {
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const summaryLines = answeredQuestions
    .slice(0, 10)
    .map((q, i) => `Q${i + 1} [${q.topic || topic}]: ${q.isCorrect ? 'Correct' : 'Wrong'} (${q.pointsEarned}/${q.points}pts)`)
    .join('\n');

  const prompt = `You are writing a student assessment feedback report.

TOPIC: ${topic}
USER TYPE: ${userType} | LEVEL: ${experienceLevel}
SCORE: ${totalScore}/${maxScore} (${percentage}%)
WEAK AREAS: ${weakTopics.length > 0 ? weakTopics.join(', ') : 'None identified'}

QUESTION SUMMARY:
${summaryLines}

Write constructive, encouraging feedback. Be specific and actionable.

Respond ONLY with valid JSON:
{
  "overallFeedback": "2-3 sentence summary of performance",
  "grade": "A|B|C|D|F",
  "strengths": ["specific strength 1", "strength 2"],
  "weaknesses": ["specific weakness 1", "weakness 2"],
  "studyRecommendations": ["actionable recommendation 1", "recommendation 2", "recommendation 3"],
  "nextSteps": "1-2 sentences on what to do next",
  "readinessLevel": "Beginner|Developing|Proficient|Advanced|Expert"
}`;

  try {
    const result = await model.generateContent(prompt);
    const parsed = safeParseJSON(result.response.text());
    if (!parsed) throw new Error('Invalid feedback');
    return parsed;
  } catch (err) {
    console.error('generateAssessmentFeedback error:', err.message);
    const grade = percentage >= 90 ? 'A' : percentage >= 75 ? 'B' : percentage >= 60 ? 'C' : percentage >= 40 ? 'D' : 'F';
    return {
      overallFeedback: `You scored ${percentage}% on this ${topic} assessment.`,
      grade,
      strengths: percentage >= 60 ? ['Demonstrated understanding of core concepts'] : [],
      weaknesses: weakTopics.length > 0
        ? weakTopics.map(t => `Needs improvement in ${t}`)
        : ['Review all topics thoroughly'],
      studyRecommendations: [
        `Review ${topic} fundamentals`,
        'Practice more questions',
        'Focus on identified weak areas'
      ],
      nextSteps: 'Review incorrect answers and retake the assessment after studying.',
      readinessLevel: percentage >= 85 ? 'Proficient' : percentage >= 60 ? 'Developing' : 'Beginner'
    };
  }
}

// ── 8. Anti-cheat behavior analysis ──────────────────────────────────────────
export async function analyzeInterviewBehavior({
  tabSwitches,
  copyPasteAttempts,
  timePerQuestion = [],
  answerLengths,
  unusualPatterns
}) {
  let integrityScore = 100;
  const flags = [];

  if (tabSwitches > 0) {
    integrityScore -= tabSwitches * 15;
    flags.push(`Tab switched ${tabSwitches} time(s) during interview`);
  }
  if (copyPasteAttempts > 0) {
    integrityScore -= copyPasteAttempts * 10;
    flags.push(`${copyPasteAttempts} copy/paste attempt(s) detected`);
  }

  const fastAnswers = timePerQuestion.filter(t => t < 10).length;
  if (fastAnswers > 0) {
    integrityScore -= fastAnswers * 5;
    flags.push(`${fastAnswers} answer(s) submitted unusually fast`);
  }

  return {
    integrityScore: Math.max(0, integrityScore),
    flags,
    passed: integrityScore >= 70
  };
}