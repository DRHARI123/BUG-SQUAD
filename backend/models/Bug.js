const mongoose = require('mongoose');

const bugSchema = new mongoose.Schema(
  {
    bugId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Bug title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Bug description is required'],
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
    testCase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestCase',
    },
    environment: {
      type: String,
      enum: ['Development', 'QA', 'Staging', 'Production'],
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
    operatingSystem: {
      type: String,
      default: 'Windows 11',
    },
    version: {
      type: String,
      default: 'v1.0.0',
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    severity: {
      type: String,
      enum: ['Blocker', 'Critical', 'Major', 'Minor', 'Trivial'],
      default: 'Major',
    },
    priority: {
      type: String,
      enum: ['P1 - Highest', 'P2 - High', 'P3 - Medium', 'P4 - Low'],
      default: 'P3 - Medium',
    },
    status: {
      type: String,
      enum: [
        'New',
        'Assigned',
        'In Progress',
        'Fixed',
        'Retest',
        'Closed',
        'Reopened',
        'Rejected',
      ],
      default: 'New',
    },
    reproducibility: {
      type: String,
      enum: ['Always', 'Sometimes', 'Rarely', 'Not Reproducible'],
      default: 'Always',
    },
    preconditions: {
      type: String,
      default: '',
    },
    stepsToReproduce: {
      type: String,
      default: '',
    },
    testData: {
      type: String,
      default: '',
    },
    expectedResult: {
      type: String,
      default: '',
    },
    actualResult: {
      type: String,
      default: '',
    },
    attachments: [
      {
        name: String,
        url: String,
        fileType: String,
      },
    ],
    beforeScreenshot: {
      type: String,
      default: '',
    },
    afterScreenshot: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Bug', bugSchema);
