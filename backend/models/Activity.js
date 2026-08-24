const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userName: {
      type: String,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    entityType: {
      type: String,
      enum: ['Project', 'Module', 'Bug', 'TestCase', 'User', 'System'],
      default: 'System',
    },
  },
  {
    timestamps: true,
  }
);

const Activity = mongoose.model('Activity', activitySchema);

// In-memory fallback for activity logs
const memoryActivities = [];

const logActivity = async ({ action, message, userId, userName, projectId, entityType }) => {
  try {
    if (mongoose.connection.readyState === 1) {
      await Activity.create({
        action,
        message,
        user: mongoose.Types.ObjectId.isValid(userId) ? userId : null,
        userName: userName || 'System User',
        project: mongoose.Types.ObjectId.isValid(projectId) ? projectId : null,
        entityType: entityType || 'System',
      });
    } else {
      memoryActivities.unshift({
        _id: 'act_' + Date.now(),
        action,
        message,
        userName: userName || 'System User',
        entityType: entityType || 'System',
        createdAt: new Date().toISOString(),
      });
      if (memoryActivities.length > 50) memoryActivities.pop();
    }
  } catch (err) {
    console.error('[ACTIVITY LOG ERROR]:', err.message);
  }
};

module.exports = {
  Activity,
  logActivity,
  memoryActivities,
};
