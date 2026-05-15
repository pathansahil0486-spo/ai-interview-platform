import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['technical', 'behavioral', 'mixed'],
    default: 'technical'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  timeLimit: {
    type: Number,
    default: 120
  },
  idealAnswer: String,
  keywords: [String],
  keyConceptsRequired: [String],
  userAnswer: {
    text: String,
    audioUrl: String,
    timeSpent: Number
  },
  feedback: {
    score: Number,
    strengths: [String],
    improvements: [String],
    detailedFeedback: String
  }
}, { _id: true });

const analysisSchema = new mongoose.Schema({
  technicalSkills: { type: Number, default: 0 },
  communication: { type: Number, default: 0 },
  problemSolving: { type: Number, default: 0 },
  confidence: { type: Number, default: 0 },
  overallFeedback: String,
  strengths: [String],
  improvements: [String]
});

const interviewSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  jobPosition: {
    type: String,
    required: true,
    trim: true
  },
  jobDescription: String,
  experienceLevel: {
    type: String,
    enum: ['entry', 'intermediate', 'senior', 'expert'],
    default: 'intermediate'
  },
  interviewType: {
    type: String,
    enum: ['technical', 'behavioral', 'mixed'],
    default: 'mixed'
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userEmail: String,
  userName: String,
  questions: [questionSchema],
  status: {
    type: String,
    enum: ['draft', 'in_progress', 'completed', 'abandoned'],
    default: 'draft'
  },
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100
  },
  startedAt: Date,
  completedAt: Date,
  duration: Number,
  analysis: analysisSchema,
  results: {
    technicalScore: Number,
    behavioralScore: Number,
    communicationScore: Number,
    overallFeedback: String,
    strengths: [String],
    improvements: [String]
  }
}, {
  timestamps: true
});

// Indexes
interviewSchema.index({ userId: 1, status: 1 });
interviewSchema.index({ createdAt: -1 });
interviewSchema.index({ userId: 1, createdAt: -1 });

// Calculate completion percentage before save
interviewSchema.pre('save', function(next) {
  if (this.questions && this.questions.length > 0) {
    const answeredCount = this.questions.filter(q =>
      q.userAnswer && (q.userAnswer.text || q.userAnswer.audioUrl)
    ).length;
    this.completionPercentage = Math.round((answeredCount / this.questions.length) * 100);
  }
  next();
});

export default mongoose.model('Interview', interviewSchema);