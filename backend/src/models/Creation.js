const mongoose = require('mongoose');

const creationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template',
      required: false,
    },
    aiTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIVideoTemplate',
      required: false,
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    templateTitle: {
      type: String,
      default: 'Status Creation',
    },
    editedText: {
      type: String,
      default: '',
    },
    editedPhoto: {
      type: String,
      default: '',
    },
    customizationState: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    imageUrl: {
      type: String,
      required: true,
    },
    s3Key: {
      type: String,
      default: '',
    },
    format: {
      type: String,
      enum: ['png', 'jpg', 'jpeg', 'mp4'],
      default: 'png',
    },
    downloadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

creationSchema.index({ userId: 1, downloadedAt: -1 });

module.exports = mongoose.model('Creation', creationSchema);
