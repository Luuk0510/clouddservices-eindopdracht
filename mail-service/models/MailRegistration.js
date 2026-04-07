var mongoose = require('mongoose');

var mailRegistrationSchema = new mongoose.Schema({
  targetId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  targetTitle: {
    type: String,
    default: ''
  },
  targetDescription: {
    type: String,
    default: ''
  },
  targetCity: {
    type: String,
    default: ''
  },
  targetLocationDescription: {
    type: String,
    default: ''
  },
  targetRadiusMeters: {
    type: Number,
    default: null
  },
  targetDeadline: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'cancelled'],
    default: 'active',
    index: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

mailRegistrationSchema.index({ targetId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('MailRegistration', mailRegistrationSchema);
