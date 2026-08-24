const mongoose = require('mongoose');

const aiSettingsSchema = new mongoose.Schema(
  {
    aiEnabled: {
      type: Boolean,
      default: true,
    },
    aiProvider: {
      type: String,
      default: 'Google Gemini AI Engine',
    },
    model: {
      type: String,
      default: 'gemini-1.5-pro',
    },
    dailyUserLimit: {
      type: Number,
      default: 50,
    },
    monthlyUserLimit: {
      type: Number,
      default: 1000,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AISettings', aiSettingsSchema);
