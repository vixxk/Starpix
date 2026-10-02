const mongoose = require('mongoose');

const creditTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String,
      enum: ['purchase', 'ai_generation', 'bonus', 'refund', 'admin_adjustment'],
      default: 'purchase',
    },
    title: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    metadata: {
      templateId: { type: String, default: '' },
      templateTitle: { type: String, default: '' },
      mediaType: { type: String, default: '' },
      packId: { type: String, default: '' },
      pricePaid: { type: Number, default: 0 },
      transactionId: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

creditTransactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('CreditTransaction', creditTransactionSchema);
