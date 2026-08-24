const mongoose = require('mongoose');

const releaseSchema = new mongoose.Schema(
  {
    releaseId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a release name'],
      trim: true,
    },
    version: {
      type: String,
      required: [true, 'Please provide a release version'],
      trim: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Please associate with a project'],
    },
    description: {
      type: String,
      trim: true,
    },
    releaseDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Planned', 'In Development', 'Testing', 'Ready', 'Released', 'Cancelled'],
      default: 'Planned',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    qualityGateConfig: {
      maxCriticalBugs: { type: Number, default: 0 },
      maxBlockerBugs: { type: Number, default: 0 },
      minPassRate: { type: Number, default: 85 },
      minExecutionRate: { type: Number, default: 90 },
      minRequirementCoverage: { type: Number, default: 80 },
    },
    signOff: {
      status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
      },
      signedOffBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      signedOffAt: { type: Date },
      comments: { type: String, default: '' },
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

releaseSchema.index({ releaseId: 1 });
releaseSchema.index({ project: 1 });
releaseSchema.index({ status: 1 });

releaseSchema.pre('save', async function (next) {
  if (this.releaseId) return next();
  try {
    const count = await this.constructor.countDocuments();
    this.releaseId = `REL-${String(count + 1).padStart(4, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Release', releaseSchema);
