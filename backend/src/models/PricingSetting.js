const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    durationDays: {
      type: Number,
      required: true,
      default: 30,
    },
    periodKey: {
      type: String,
      default: '',
    },
    ctaKey: {
      type: String,
      default: '',
    },
    badgeText: {
      type: String,
      default: '',
    },
    badgeType: {
      type: String,
      enum: ['', 'popular', 'best_value', 'custom'],
      default: '',
    },
    badgeKey: {
      type: String,
      default: '',
    },
    features: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 1,
    },
  },
  { _id: false }
);

const pricingSettingSchema = new mongoose.Schema(
  {
    currency: {
      type: String,
      default: 'INR',
    },
    plans: {
      type: [subscriptionPlanSchema],
      default: [],
    },
    freeTemplateLimit: {
      type: Number,
      default: 0,
    },
    previewProtectionEnabled: {
      type: Boolean,
      default: true,
    },
    posters: {
      type: [String],
      default: [],
    },
    checklist: {
      type: [
        {
          id: { type: String, default: '' },
          text: { type: String, default: '' },
          textKey: { type: String, default: '' },
          iconType: { type: String, default: 'checkmark' },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PricingSetting', pricingSettingSchema);
