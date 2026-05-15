import mongoose from 'mongoose';

const preparationResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: false
  },
  externalUrl: {
    type: String,
    required: false,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+\..+/.test(v);
      },
      message: 'Please provide a valid URL'
    }
  },
  type: {
    type: String,
    enum: ['guide', 'video', 'article'],
    required: true
  },
  category: {
    type: String,
    enum: ['technical', 'behavioral', 'career'],
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  shareCount: {
    type: Number,
    default: 0
  },
  savedByUsers: [{
    type: String // user IDs
  }],
  viewedByUsers: [{
    type: String // user IDs
  }],
  downloadedByUsers: [{
    type: String // user IDs
  }],
  sharedByUsers: [{
    type: String // user IDs
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
preparationResourceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const PreparationResource = mongoose.model('PreparationResource', preparationResourceSchema);

export default PreparationResource;