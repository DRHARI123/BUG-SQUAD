const mongoose = require('mongoose');

const aiUsageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dateKey: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    monthKey: {
      type: String, // YYYY-MM
      required: true,
    },
    dailyCount: {
      type: Number,
      default: 0,
    },
    monthlyCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

aiUsageSchema.index({ user: 1, dateKey: 1 });
aiUsageSchema.index({ user: 1, monthKey: 1 });

module.exports = mongoose.model('AIUsage', aiUsageSchema);
