import mongoose from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// Syllabus Progress — tracks per-subtopic performance as user completes tests
// ─────────────────────────────────────────────────────────────────────────────
const syllabusProgressSchema = new mongoose.Schema({
  domain:             String,
  topic:              String,
  subtopic:           String,
  questionsAttempted: { type: Number, default: 0 },
  questionsCorrect:   { type: Number, default: 0 },
  averageScore:       { type: Number, default: 0 },
  lastAttempted:      Date,
  masteryLevel: {
    type:    String,
    enum:    ['not_started', 'beginner', 'learning', 'practiced', 'mastered'],
    default: 'not_started'
  }
}, { _id: false });

// ─────────────────────────────────────────────────────────────────────────────
// Syllabus Cache — Gemini-generated curriculum stored on the user document.
// Regenerated every 7 days OR when the user updates their profile.
//
// Rich fields stored here (color/icon are cosmetic and added at response time,
// NOT persisted to the database):
//
//   meta
//     label               — "Senior Frontend Engineer" or "NEET 2025 (PCB)"
//     domain              — software | data_science | medical | engineering | …
//     totalTopics         — count of main topics
//     totalSubtopics      — total subtopic count
//     totalEstimatedHours — sum of all topic estimatedHours
//     targetAudience      — 1-line description of who this is for
//     aiSummary           — 2-sentence personalised study plan from Gemini
//
//   topics[]
//     topic               — topic name
//     description         — 2-line what this topic covers & why it matters
//     estimatedHours      — hours to complete this topic
//     interviewFrequency  — very_high | high | medium | low
//     prerequisites[]     — topic names to study first
//     studyTip            — one actionable expert tip
//     resources[]         — 3 free curated links (title, url, type)
//     subtopics[]
//       name              — subtopic name
//       description       — 1-2 line description of what will be tested
//       difficulty        — foundational | intermediate | advanced
//       estimatedHours    — hours to complete this subtopic
//       keyConcepts[]     — 4-6 precise, assessable concept strings
//       whyItMatters      — real-world application or interview context
// ─────────────────────────────────────────────────────────────────────────────

const syllabusResourceSchema = new mongoose.Schema({
  title: { type: String },
  url:   { type: String },
  type:  { type: String, enum: ['video', 'docs', 'article', 'course'] },
}, { _id: false });

const syllabusSubtopicSchema = new mongoose.Schema({
  name:           { type: String },
  description:    { type: String },
  difficulty:     { type: String, enum: ['foundational', 'intermediate', 'advanced'], default: 'intermediate' },
  estimatedHours: { type: Number },
  keyConcepts:    [{ type: String }],
  whyItMatters:   { type: String },
}, { _id: false });

const syllabusTopicSchema = new mongoose.Schema({
  topic:              { type: String },
  description:        { type: String },
  estimatedHours:     { type: Number },
  interviewFrequency: { type: String, enum: ['very_high', 'high', 'medium', 'low'], default: 'medium' },
  prerequisites:      [{ type: String }],
  studyTip:           { type: String },
  resources:          [syllabusResourceSchema],
  subtopics:          [syllabusSubtopicSchema],
}, { _id: false });

const syllabusCacheSchema = new mongoose.Schema({
  generatedAt:        { type: Date },
  profileFingerprint: { type: String, default: '' }, // fingerprint of profile fields used to generate this syllabus
  meta: {
    label:               { type: String },
    domain:              { type: String },
    totalTopics:         { type: Number },
    totalSubtopics:      { type: Number },
    totalEstimatedHours: { type: Number },
    targetAudience:      { type: String },
    aiSummary:           { type: String },
  },
  topics: [syllabusTopicSchema],
}, { _id: false });

// ─────────────────────────────────────────────────────────────────────────────
// User Schema
// ─────────────────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  clerkId:      { type: String, required: true, unique: true },
  email:        { type: String, required: true, unique: true },
  firstName:    { type: String, required: true },
  lastName:     { type: String, required: true },
  profileImage: { type: String },

  // ── Onboarding ──────────────────────────────────────────────────────────────
  onboarded: { type: Boolean, default: false },
  userType:  { type: String, enum: ['student', 'jobseeker'], default: 'jobseeker' },

  // ── Student-specific ────────────────────────────────────────────────────────
  studentClass: { type: String, default: '' },
  stream:       { type: String, default: '' },
  college:      { type: String, default: '' },

  // ── Job seeker fields ───────────────────────────────────────────────────────
  jobTitle:    { type: String, default: '' },
  company:     { type: String, default: '' },
  domain:      { type: String, default: '' },
  targetRoles: [{ type: String }],

  // ── Shared ──────────────────────────────────────────────────────────────────
  experienceLevel: {
    type:    String,
    enum:    ['entry', 'intermediate', 'senior', 'expert'],
    default: 'intermediate'
  },
  skills: [{ type: String }],
  goals:  [{ type: String }],
  bio:    { type: String, default: '' },

  // ── Syllabus Progress ───────────────────────────────────────────────────────
  // Updated every time a user completes an assessment subtopic.
  syllabusProgress: [syllabusProgressSchema],

  // ── Syllabus Cache ──────────────────────────────────────────────────────────
  // Gemini-generated curriculum. Cached for 7 days.
  // Auto-invalidated when profile is updated after last generatedAt.
  syllabusCache: { type: syllabusCacheSchema, default: null },

  // ── Learning Path ───────────────────────────────────────────────────────────
  learningPath: {
    currentDomain:   { type: String, default: '' },
    currentTopic:    { type: String, default: '' },
    recommendedNext: [String],
    weeklyGoal:      { type: Number, default: 5 },
    streak:          { type: Number, default: 0 },
    lastActiveDate:  Date,
  },

  // ── Stats ───────────────────────────────────────────────────────────────────
  stats: {
    totalInterviews:        { type: Number, default: 0 },
    completedInterviews:    { type: Number, default: 0 },
    averageScore:           { type: Number, default: 0 },
    totalPracticeTime:      { type: Number, default: 0 },
    totalQuestionsAnswered: { type: Number, default: 0 },
    assessmentsTaken:       { type: Number, default: 0 },
  },

  // ── Preferences ─────────────────────────────────────────────────────────────
  preferences: {
    emailNotifications: { type: Boolean, default: true  },
    pushNotifications:  { type: Boolean, default: false },
    weeklyReports:      { type: Boolean, default: true  },
  },

}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;