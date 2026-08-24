const mongoose = require('mongoose');

const testSuiteSchema = new mongoose.Schema(
  {
    suiteId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a test suite name'],
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
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
    },
    testPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestPlan',
    },
    testCases: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TestCase',
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

testSuiteSchema.index({ suiteId: 1 });
testSuiteSchema.index({ project: 1 });

testSuiteSchema.pre('save', async function (next) {
  if (this.suiteId) return next();
  try {
    const count = await this.constructor.countDocuments();
    this.suiteId = `SUITE-${String(count + 1).padStart(4, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('TestSuite', testSuiteSchema);
