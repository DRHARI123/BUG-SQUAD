const mongoose = require('mongoose');

const testPlanSchema = new mongoose.Schema(
  {
    testPlanId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a test plan name'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Please associate with a project'],
    },
    release: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Release',
    },
    version: {
      type: String,
      default: 'v1.0.0',
    },
    objective: {
      type: String,
      default: '',
    },
    scope: {
      type: String,
      default: '',
    },
    outOfScope: {
      type: String,
      default: '',
    },
    assumptions: {
      type: String,
      default: '',
    },
    risks: {
      type: String,
      default: '',
    },
    entryCriteria: {
      type: String,
      default: '',
    },
    exitCriteria: {
      type: String,
      default: '',
    },
    environment: {
      type: String,
      default: 'QA Staging',
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    testers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    testCases: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TestCase',
      },
    ],
    status: {
      type: String,
      enum: ['Draft', 'Active', 'On Hold', 'Completed', 'Archived'],
      default: 'Draft',
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

testPlanSchema.index({ testPlanId: 1 });
testPlanSchema.index({ project: 1 });
testPlanSchema.index({ status: 1 });

// Auto-increment testPlanId
testPlanSchema.pre('save', async function (next) {
  if (this.testPlanId) return next();
  try {
    const count = await this.constructor.countDocuments();
    this.testPlanId = `TP-${String(count + 1).padStart(4, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('TestPlan', testPlanSchema);
