const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    countryCode: {
      type: String,
      default: '+91',
    },
    name: {
      type: String,
      default: 'Starpix User',
      trim: true,
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    credits: {
      type: Number,
      default: 240,
    },
    subscriptionStatus: {
      type: String,
      enum: ['none', 'active', 'expired', 'cancelled'],
      default: 'none',
    },
    subscriptionPlan: {
      type: String,
      default: '',
    },
    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },
    subscriptionDurationDays: {
      type: Number,
      default: 0,
    },
    vipGrantedBy: {
      type: String,
      enum: ['none', 'admin', 'purchase'],
      default: 'none',
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template',
      },
    ],
    purchasedTemplates: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template',
      },
    ],
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletionReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
