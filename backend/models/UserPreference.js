const mongoose = require('mongoose');

const userPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    visibleWidgets: [
      {
        type: String,
      },
    ],
    widgetOrder: [
      {
        type: String,
      },
    ],
    defaultProject: {
      type: String,
      default: '',
    },
    defaultDateRange: {
      type: String,
      default: 'Last 30 Days',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('UserPreference', userPreferenceSchema);
