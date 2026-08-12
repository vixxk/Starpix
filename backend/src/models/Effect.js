const mongoose = require('mongoose');

const effectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['lottie', 'video', 'overlay', 'particle'],
      default: 'overlay',
    },
    asset: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      default: 5,
    },
    loop: {
      type: Boolean,
      default: true,
    },
    intensity: {
      type: Number,
      default: 1,
    },
    configuration: {
      blendMode: { type: String, default: 'screen' },
      particleColor: { type: String, default: '#89E398' },
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

effectSchema.index({ active: 1 });

module.exports = mongoose.model('Effect', effectSchema);
