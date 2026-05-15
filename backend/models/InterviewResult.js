import mongoose from 'mongoose';

const gestureAnalysisSchema = new mongoose.Schema({
  postureScore: Number,
  eyeContact: Number,
  handGestures: String,
  facialExpressions: String,
  confidence: Number
});

const speechAnalysisSchema = new mongoose.Schema({
  speakingRate: Number,
  clarity: Number,
  fillerWords: Number,
  confidence: Number,
  coherence: Number
});

const answerAnalysisSchema = new mongoose.Schema({
  questionId: mongoose.Schema.Types.ObjectId,
  questionText: String,
  userAnswer: String,
  relevance: Number,
  technicalAccuracy: Number,
  communication: Number,
  feedback: String,
  suggestions: [String]
});

const interviewResultSchema = new mongoose.Schema({
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  overallScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  duration: Number,
  completedAt: {
    type: Date,
    default: Date.now
  },
  gestureAnalysis: gestureAnalysisSchema,
  speechAnalysis: speechAnalysisSchema,
  answersAnalysis: [answerAnalysisSchema],
  metrics: {
    technical: Number,
    communication: Number,
    problemSolving: Number,
    confidence: Number,
    culturalFit: Number
  },
  feedback: {
    overall: String,
    strengths: [String],
    improvements: [String],
    recommendation: String
  },
  recordingUrl: String,
  transcript: String,
  aiInsights: {
    personalityTraits: [String],
    communicationStyle: String,
    technicalDepth: String,
    improvementAreas: [String]
  }
}, {
  timestamps: true
});

// Indexes
interviewResultSchema.index({ userId: 1, completedAt: -1 });
interviewResultSchema.index({ interviewId: 1 });

export default mongoose.model('InterviewResult', interviewResultSchema);