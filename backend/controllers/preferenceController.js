const UserPreference = require('../models/UserPreference');
const mongoose = require('mongoose');

const getUserPreferences = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      let pref = await UserPreference.findOne({ user: req.user._id });
      if (!pref) {
        pref = await UserPreference.create({
          user: req.user._id,
          visibleWidgets: ['bugTrend', 'bugSeverity', 'bugAging', 'testPassRate', 'reqCoverage', 'slaCompliance', 'teamWorkload'],
          widgetOrder: ['bugTrend', 'bugSeverity', 'bugAging', 'testPassRate', 'reqCoverage', 'slaCompliance', 'teamWorkload'],
        });
      }
      return res.json(pref);
    }

    return res.json({ visibleWidgets: ['bugTrend', 'bugSeverity', 'bugAging', 'testPassRate'], defaultDateRange: 'Last 30 Days' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch user preferences.' });
  }
};

const updateUserPreferences = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      let pref = await UserPreference.findOneAndUpdate({ user: req.user._id }, req.body, { upsert: true, new: true });
      return res.json({ message: 'Dashboard preferences saved.', preferences: pref });
    }

    return res.json({ message: 'Dashboard preferences saved.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to save user preferences.' });
  }
};

module.exports = {
  getUserPreferences,
  updateUserPreferences,
};
