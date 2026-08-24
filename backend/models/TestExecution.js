const mongoose = require('mongoose');

const testExecutionSchema = new mongoose.Schema(
  {
    executionId: {
      type: String,
      required: true,
      trim: true,
    },
    testCase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestCase',
      required: true,
    },
    tester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    testerName: {
      type: String,
    },
    result: {
      type: String,
      enum: ['Passed', 'Failed', 'Blocked', 'Not Run'],
      required: true,
    },
    actualResult: {
      type: String,
      default: '',
    },
    executionNotes: {
      type: String,
      default: '',
    },
    executedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TestExecution', testExecutionSchema);
