const mongoose = require('mongoose');

const requirementSchema = new mongoose.Schema(
  {
    requirementId: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a requirement title'],
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
    type: {
      type: String,
      enum: ['Functional', 'Non-Functional', 'Business', 'Technical', 'Security', 'Performance', 'Usability'],
      default: 'Functional',
    },
    priority: {
      type: String,
      enum: ['P1 - Highest', 'P2 - High', 'P3 - Medium', 'P4 - Low'],
      default: 'P3 - Medium',
    },
    status: {
      type: String,
      enum: ['Draft', 'Approved', 'In Development', 'Ready for Testing', 'Completed', 'Rejected'],
      default: 'Draft',
    },
    acceptanceCriteria: {
      type: String,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

requirementSchema.index({ requirementId: 1 });
requirementSchema.index({ project: 1 });
requirementSchema.index({ status: 1 });

requirementSchema.pre('save', async function (next) {
  if (this.requirementId) return next();
  try {
    const count = await this.constructor.countDocuments();
    this.requirementId = `REQ-${String(count + 1).padStart(4, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Requirement', requirementSchema);
