const mongoose = require('mongoose');

const aiHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      default: '',
    },
    feature: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      default: 'General',
    },
    entityId: {
      type: String,
      default: '',
    },
    action: {
      type: String,
      default: 'AI_ASSIST',
    },
    resultSummary: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

aiHistorySchema.index({ user: 1 });
aiHistorySchema.index({ createdAt: -1 });

module.exports = mongoose.model('AIHistory', aiHistorySchema);
