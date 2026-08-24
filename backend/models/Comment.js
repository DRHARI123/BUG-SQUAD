const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ['Bug', 'TestCase', 'Requirement', 'TestRun', 'TestPlan'],
      default: 'Bug',
    },
    bug: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bug',
    },
    targetId: {
      type: String,
      default: '',
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      default: 'Tester',
    },
    comment: {
      type: String,
      required: [true, 'Comment body cannot be empty'],
      trim: true,
    },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ bug: 1 });
commentSchema.index({ targetId: 1 });

module.exports = mongoose.model('Comment', commentSchema);
