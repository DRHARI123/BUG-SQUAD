const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'BUG_ASSIGNED',
        'BUG_STATUS_CHANGED',
        'BUG_REOPENED',
        'BUG_FIXED',
        'COMMENT_ADDED',
        'SYSTEM',
      ],
      default: 'SYSTEM',
    },
    relatedBug: {
      type: String,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

// In-memory notifications fallback
const memoryNotifications = [];

const createNotification = async ({ recipient, sender, message, type, relatedBug }) => {
  try {
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(recipient)) {
      await Notification.create({
        recipient,
        sender: mongoose.Types.ObjectId.isValid(sender) ? sender : null,
        message,
        type: type || 'SYSTEM',
        relatedBug: relatedBug || '',
      });
    } else {
      memoryNotifications.unshift({
        _id: 'notif_' + Date.now(),
        recipient: recipient || 'all',
        message,
        type: type || 'SYSTEM',
        relatedBug: relatedBug || '',
        read: false,
        createdAt: new Date().toISOString(),
      });
      if (memoryNotifications.length > 50) memoryNotifications.pop();
    }
  } catch (err) {
    console.error('[NOTIFICATION CREATE ERROR]:', err.message);
  }
};

module.exports = {
  Notification,
  createNotification,
  memoryNotifications,
};
