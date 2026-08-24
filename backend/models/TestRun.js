const mongoose = require('mongoose');

const testRunSchema = new mongoose.Schema(
  {
    testRunId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a test run name'],
      trim: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Please associate with a project'],
    },
    testPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestPlan',
    },
    testSuite: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestSuite',
    },
    version: {
      type: String,
      default: 'v1.0.0',
    },
    environment: {
      type: String,
      default: 'QA',
    },
    browser: {
      type: String,
      default: 'Chrome',
    },
    device: {
      type: String,
      default: 'Desktop',
    },
    buildVersion: {
      type: String,
      default: 'b1.0.0',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    assignedTesters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['Not Started', 'Running', 'Paused', 'Completed', 'Cancelled'],
      default: 'Not Started',
    },
    testCases: [
      {
        testCase: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'TestCase',
        },
        result: {
          type: String,
          enum: ['Not Run', 'Passed', 'Failed', 'Blocked', 'Skipped'],
          default: 'Not Run',
        },
        actualResult: { type: String, default: '' },
        executionNotes: { type: String, default: '' },
        linkedBug: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Bug',
        },
        executedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        executedAt: { type: Date },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

testRunSchema.index({ testRunId: 1 });
testRunSchema.index({ project: 1 });
testRunSchema.index({ status: 1 });

testRunSchema.pre('save', async function (next) {
  if (this.testRunId) return next();
  try {
    const count = await this.constructor.countDocuments();
    this.testRunId = `TR-${String(count + 1).padStart(4, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('TestRun', testRunSchema);
