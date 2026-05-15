import mongoose from 'mongoose';

const assessmentQuestionSchema = new mongoose.Schema({
  question:      { type: String, required: true },
  type:          { type: String, enum: ['mcq', 'short_answer', 'scenario'], default: 'mcq' },
  options:       [{ type: String }],
  correctOption: { type: Number },
  correctAnswer: { type: String },
  explanation:   { type: String },
  keywords:      [{ type: String }],
  points:        { type: Number, default: 10 },
  difficulty:    { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  userAnswer:    { type: String, default: '' },
  isCorrect:     { type: Boolean },
  pointsEarned:  { type: Number, default: 0 },
  aiFeedback:    { type: String, default: '' }
}, { _id: true });

const violationEntrySchema = new mongoose.Schema({
  type: { type: String },
  time: { type: String }
}, { _id: false });

const assessmentSchema = new mongoose.Schema({
  userId:    { type: String, required: true, index: true },
  title:     { type: String, required: true },
  domain:    { type: String, required: true },
  topic:     { type: String, required: true },
  subtopic:  { type: String, default: '' },
  type:      { type: String, enum: ['mcq', 'mixed', 'scenario', 'coding_concepts'], default: 'mcq' },
  difficulty:{ type: String, enum: ['easy', 'medium', 'hard', 'mixed'], default: 'medium' },
  questions: [assessmentQuestionSchema],
  status:    { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  score:         { type: Number, default: 0 },
  maxScore:      { type: Number, default: 0 },
  percentage:    { type: Number, default: 0 },
  timeLimitMinutes:  { type: Number, default: 20 },
  timeSpentSeconds:  { type: Number, default: 0 },
  violations:        { type: Number, default: 0 },
  violationLog:      [violationEntrySchema],
  autoSubmitted:     { type: Boolean, default: false },
  startedAt:     Date,
  completedAt:   Date,
  aiFeedback: {
    overallAnalysis:   { type: String, default: '' },
    strongAreas:       [String],
    weakAreas:         [String],
    recommendations:   [String],
    nextTopicsToStudy: [String]
  },
  syllabusTopics: [String]
}, { timestamps: true });

assessmentSchema.index({ userId: 1, completedAt: -1 });
assessmentSchema.index({ userId: 1, domain: 1, topic: 1 });

const Assessment = mongoose.model('Assessment', assessmentSchema);
export default Assessment;