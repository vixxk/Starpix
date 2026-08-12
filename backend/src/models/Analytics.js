const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template',
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

analyticsSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
