const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    nameTranslations: {
      type: Map,
      of: String,
      default: {},
    },
    description: {
      type: String,
      default: '',
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    type: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    accessType: {
      // free = always unlocked · premium/paid = single unlock (or VIP) · vip = VIP subscription only
      type: String,
      enum: ['free', 'premium', 'vip', 'paid'],
      default: 'free',
    },
    price: {
      type: Number,
      default: 0,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    previewAsset: {
      type: String,
      required: true,
    },
    mainMedia: {
      type: String,
      required: true,
    },
    watermarkAsset: {
      type: String,
      default: '',
    },
    // Generic layout engine config using normalized coordinates (0 to 1)
    canvasConfig: {
      aspectRatio: { type: Number, default: 0.5625 }, // 9:16 = 9/16
      backgroundColor: { type: String, default: '#07140B' },
      backgroundImage: { type: String, default: '' },
      layers: [
        {
          id: { type: String },
          type: { type: String, enum: ['photo', 'text', 'frame', 'effect', 'overlay', 'logo'], default: 'photo' },
          x: { type: Number, default: 0.5 }, // normalized center X (0..1)
          y: { type: Number, default: 0.4 }, // normalized center Y (0..1)
          width: { type: Number, default: 0.6 }, // normalized width (0..1)
          height: { type: Number, default: 0.4 }, // normalized height (0..1)
          rotation: { type: Number, default: 0 },
          opacity: { type: Number, default: 1 },
          zIndex: { type: Number, default: 15 },
          // Text specific properties
          defaultValue: { type: String, default: 'User Name' },
          fieldName: { type: String, default: 'name' }, // dynamic field identifier (e.g. name, quote, greeting)
          fontSize: { type: Number, default: 22 },
          fontColor: { type: String, default: '#FFFFFF' },
          fontFamily: { type: String, default: 'Inter' },
          fontWeight: { type: String, default: '700' },
          textAlign: { type: String, default: 'center' },
          // Shape mask for photo layer (rectangle, circle, diamond, hexagon, star, heart, rounded)
          shape: { type: String, default: 'rectangle' },
          // Frame or Effect default assets
          assetUrl: { type: String, default: '' },
        },
      ],
    },
    footers: [
      {
        name: { type: String, default: 'Cloud Footer' },
        videoAsset: { type: String, required: true },
        thumbnail: { type: String, default: '' },
        heightPercent: { type: Number, default: 40 },
        objectFit: { type: String, default: 'contain' },
        x: { type: Number, default: 0.5 },
        y: { type: Number, default: 0.8 },
        width: { type: Number, default: 1.0 },
        height: { type: Number, default: 0.4 },
        zIndex: { type: Number, default: 10 },
        userNamePosition: {
          x: { type: Number },
          y: { type: Number },
          width: { type: Number },
          height: { type: Number },
          fontSize: { type: Number },
          fontColor: { type: String },
          fontWeight: { type: String },
          textAlign: { type: String },
        },
      },
    ],
    tags: [String],
    views: { type: Number, default: 0 },
    uses: { type: Number, default: 0 },
    favoritesCount: { type: Number, default: 0 },
    purchasesCount: { type: Number, default: 0 },
    trendingScore: { type: Number, default: 0 },
    sortOrder: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

templateSchema.index({ categoryId: 1, active: 1, accessType: 1, isPinned: -1, order: 1, sortOrder: 1, createdAt: -1 });
templateSchema.index({ trendingScore: -1 });
templateSchema.index({ views: -1, uses: -1 });

module.exports = mongoose.model('Template', templateSchema);
