const mongoose = require('mongoose');

const frameSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    asset: {
      type: String,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    contentTag: {
      type: String,
      enum: ['general', 'festival', 'morning', 'motivation', 'devotional', 'love', 'birthday', 'quotes', 'attitude', 'business', 'reels', 'night'],
      default: 'general',
    },
    placement: {
      x: { type: Number, default: 0.5 },
      y: { type: Number, default: 0.5 },
      width: { type: Number, default: 1.0 },
      height: { type: Number, default: 1.0 },
      zIndex: { type: Number, default: 10 },
    },
    configuration: {
      aspectRatio: { type: Number, default: 0.5625 },
      borderPadding: { type: Number, default: 0 },
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

frameSchema.index({ active: 1, sortOrder: 1, category: 1 });

module.exports = mongoose.model('Frame', frameSchema);
