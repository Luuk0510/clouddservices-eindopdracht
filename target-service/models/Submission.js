var mongoose = require('mongoose');

var submissionSchema = new mongoose.Schema({
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Target',
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userEmail: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    required: true
  },
  similarityScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

submissionSchema.index({ targetId: 1, userId: 1, createdAt: -1 });

module.exports = mongoose.model('Submission', submissionSchema);
