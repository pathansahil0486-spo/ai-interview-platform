import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['technical', 'behavioral', 'mixed'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  subcategory: {
    type: String,
    default: ''
  },
  domain: {
    type: String,
    enum: [
      'software', 'data_science', 'product', 'design',
      'marketing', 'finance', 'hr', 'operations',
      'consulting', 'sales', 'general', 'student'
    ],
    default: 'general'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  experienceLevel: {
    type: String,
    enum: ['entry', 'intermediate', 'senior', 'expert'],
    default: 'intermediate'
  },
  tags: [{ type: String }],
  syllabusTopics: [{ type: String }],

  // For real AI answer evaluation
  idealAnswer: { type: String, default: '' },
  keywords: [{ type: String }],       // key terms that should appear in answer
  keyConceptsRequired: [{ type: String }], // must-mention concepts
  commonMistakes: [{ type: String }],  // typical wrong answers to watch for

  scoringCriteria: {
    clarity: { type: Number, default: 25 },
    depth: { type: Number, default: 35 },
    relevance: { type: Number, default: 25 },
    structure: { type: Number, default: 15 }
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

questionSchema.index({ type: 1, difficulty: 1 });
questionSchema.index({ category: 1, experienceLevel: 1 });
questionSchema.index({ domain: 1, difficulty: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ isActive: 1 });

const Question = mongoose.model('Question', questionSchema);
export default Question;