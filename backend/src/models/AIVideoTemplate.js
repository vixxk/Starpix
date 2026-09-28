const mongoose = require('mongoose');

const aiVideoTemplateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    titleTranslations: {
      type: Map,
      of: String,
      default: {},
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      default: 'Trending',
      index: true,
    },
    mediaType: {
      type: String,
      enum: ['video', 'image'],
      default: 'video',
      index: true,
    },
    requiredPhotos: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },
    videoUrl: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
      default: '',
    },
    sampleSourceImageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    sampleSourceImageUrls: {
      type: [String],
      default: [],
    },
    sampleResultVideoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    durationSeconds: {
      type: Number,
      default: 10,
    },
    creditsRequired: {
      type: Number,
      default: 0,
    },
    prompt: {
      type: String,
      default: 'High-quality ultra-realistic 8k AI face swap. Swap ONLY the facial identity, skin texture, expression, and features from user image onto target media face. Keep all original clothing, garments, outfit, body, hairstyle, background, lighting, and pose from target media 100% identical, unchanged, and untouched. Do not alter any clothes or attire. Zero distortion.',
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AIVideoTemplate', aiVideoTemplateSchema);
