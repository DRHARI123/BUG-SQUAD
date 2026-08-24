const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema(
  {
    testCaseId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Test Case title is required'],
      trim: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: [true, 'Module is required'],
    },
    scenario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scenario',
    },
    description: {
      type: String,
      trim: true,
    },
    preconditions: {
      type: String,
      default: '',
    },
    testSteps: [
      {
        stepNumber: { type: Number, required: true },
        action: { type: String, required: true },
      },
    ],
    testData: {
      type: String,
      default: '',
    },
    expectedResult: {
      type: String,
      required: [true, 'Expected Result is required'],
    },
    actualResult: {
      type: String,
      default: '',
    },
    priority: {
      type: String,
      enum: ['P1 - Highest', 'P2 - High', 'P3 - Medium', 'P4 - Low'],
      default: 'P3 - Medium',
    },
    severity: {
      type: String,
      enum: ['Blocker', 'Critical', 'Major', 'Minor', 'Trivial'],
      default: 'Major',
    },
    status: {
      type: String,
      enum: ['Not Run', 'Passed', 'Failed', 'Blocked', 'Retest'],
      default: 'Not Run',
    },
    tester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tester assignment is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TestCase', testCaseSchema);
