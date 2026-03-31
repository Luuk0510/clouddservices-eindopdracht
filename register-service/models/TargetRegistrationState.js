var mongoose = require('mongoose');

var targetRegistrationStateSchema = new mongoose.Schema({
  targetId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  isRegistrationOpen: {
    type: Boolean,
    required: true,
    default: true
  },
  closedReason: {
    type: String,
    enum: ['deadline-reached', 'clock-event', 'manual-close'],
    default: null
  },
  closedAt: {
    type: Date,
    default: null
  },
  deadlineSnapshot: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TargetRegistrationState', targetRegistrationStateSchema);
