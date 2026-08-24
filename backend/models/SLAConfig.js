const mongoose = require('mongoose');

const slaConfigSchema = new mongoose.Schema(
  {
    severity: {
      type: String,
      enum: ['Blocker', 'Critical', 'Major', 'Minor', 'Trivial'],
      required: true,
      unique: true,
    },
    responseTargetHours: {
      type: Number,
      required: true,
      default: 4,
    },
    resolutionTargetHours: {
      type: Number,
      required: true,
      default: 24,
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SLAConfig', slaConfigSchema);
