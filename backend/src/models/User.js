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
      default: 'Statuzzz User',
      trim: true,
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    subscriptionStatus: {
      type: String,
      enum: ['none', 'active', 'expired', 'cancelled'],
      default: 'none',
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template',
      },
    ],
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
