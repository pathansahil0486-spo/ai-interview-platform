import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    userId:      { type: String, default: 'anonymous' },
    userName:    { type: String, default: 'Anonymous' },
    userEmail:   { type: String, default: '' },
    mood:        { type: String, default: 'not selected' },
    type:        { type: String, default: 'general' },
    stars:       { type: Number, default: 0, min: 0, max: 5 },
    message:     { type: String, required: true, trim: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('Feedback', feedbackSchema);