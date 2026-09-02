const mongoose = require('mongoose');

const deletionLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userName: {
      type: String,
      default: 'Starpix User',
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      default: 'No longer using the app',
    },
    details: {
      type: String,
      default: '',
    },
    deletedVia: {
      type: String,
      enum: ['web_app_token', 'web_otp', 'mobile_app_api'],
      default: 'web_otp',
    },
    ipAddress: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DeletionLog', deletionLogSchema);
