const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    heroBackground: {
      type: String,
      default: '',
    },
    heroImage: {
      type: String,
      default: '',
    },
    heroVideo: {
      type: String,
      default: '',
    },
    logo: {
      type: String,
      default: '',
    },
    music: {
      type: String,
      default: '',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    priority: {
      type: Number,
      default: 1,
    },
    featuredTemplates: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template',
      },
    ],
    featuredCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    ctaText: {
      type: String,
      default: 'Explore Campaign',
    },
    ctaDestination: {
      type: String,
      default: 'campaign_detail',
    },
    showOnAppOpening: {
      type: Boolean,
      default: false,
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

campaignSchema.index({ active: 1, showOnAppOpening: 1, priority: -1 });

module.exports = mongoose.model('Campaign', campaignSchema);
