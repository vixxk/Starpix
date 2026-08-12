const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template',
      required: true,
    },
    productId: {
      type: String,
      default: 'statuzzz_single_unlock',
    },
    amount: {
      type: Number,
      default: 49,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['pending', 'successful', 'failed'],
      default: 'successful',
    },
    paymentProvider: {
      type: String,
      default: 'development',
    },
    transactionId: {
      type: String,
      required: true,
    },
    finalAssetUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

purchaseSchema.index({ userId: 1, templateId: 1, status: 1 });
purchaseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
