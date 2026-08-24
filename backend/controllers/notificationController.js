const { Notification, memoryNotifications } = require('../models/Notification');
const mongoose = require('mongoose');

/**
 * @desc    Get user notifications with pagination & filters
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(userId)) {
      let query = { recipient: userId };
      if (unreadOnly === 'true') query.read = false;

      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.countDocuments({ recipient: userId, read: false });
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      return res.json({
        notifications,
        unreadCount,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        total,
      });
    }

    let filtered = [...memoryNotifications];
    if (unreadOnly === 'true') filtered = filtered.filter((n) => !n.read);

    const total = filtered.length;
    const unreadCount = memoryNotifications.filter((n) => !n.read).length;
    const paginated = filtered.slice(skip, skip + limitNum);

    return res.json({
      notifications: paginated,
      unreadCount,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      total,
    });
  } catch (error) {
    console.error('[GET NOTIFICATIONS ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch notifications.' });
  }
};

/**
 * @desc    Mark single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      await Notification.findByIdAndUpdate(id, { read: true });
      return res.json({ message: 'Notification marked as read.' });
    }

    const n = memoryNotifications.find((item) => item._id === id);
    if (n) n.read = true;

    return res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update notification.' });
  }
};

/**
 * @desc    Mark all notifications as read for current user
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(userId)) {
      await Notification.updateMany({ recipient: userId, read: false }, { read: true });
      return res.json({ message: 'All notifications marked as read.' });
    }

    memoryNotifications.forEach((n) => { n.read = true; });
    return res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to mark notifications read.' });
  }
};

/**
 * @desc    Delete single notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      await Notification.findByIdAndDelete(id);
      return res.json({ message: 'Notification deleted.' });
    }

    const idx = memoryNotifications.findIndex((item) => item._id === id);
    if (idx !== -1) memoryNotifications.splice(idx, 1);

    return res.json({ message: 'Notification deleted.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete notification.' });
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
};
