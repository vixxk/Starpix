const mongoose = require('mongoose');
require('dotenv').config({ path: '/home/vixx/Documents/Starpix/backend/.env' });
const Template = require('../src/models/Template');

const STANDARDIZED_FOOTERS = [
  {
    name: 'Footer 1',
    asset: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/footers/f50c13f2-a856-4cd4-a739-37a1275d1d88.png',
    videoAsset: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/footers/f50c13f2-a856-4cd4-a739-37a1275d1d88.png',
    thumbnail: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/footer-thumbnails/9c9c512e-c2e9-43c5-a8db-399127fbdefb.png',
    heightPercent: 100,
    objectFit: 'cover',
    x: 0.5,
    y: 0.5,
    width: 1.0,
    height: 1.0,
    zIndex: 10,
    userPhotoPosition: {
      x: 0.787,
      y: 0.825,
      width: 0.35,
      height: 0.197,
      shape: 'circle',
      zIndex: 25,
    },
    userPhotoShape: 'circle',
    userNamePosition: {
      x: 0.36,
      y: 0.825,
      width: 0.44,
      height: 0.08,
      fontSize: 24,
      fontColor: '#FFFFFF',
      fontWeight: '700',
      textAlign: 'center',
      zIndex: 30,
    },
  },
  {
    name: 'Footer 2',
    asset: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/footers/b1d366ef-881f-4c9e-a8ca-bd4bd7cabf2a.png',
    videoAsset: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/footers/b1d366ef-881f-4c9e-a8ca-bd4bd7cabf2a.png',
    thumbnail: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/footer-thumbnails/ee2069d7-633e-4d36-9725-284029d03d17.png',
    heightPercent: 100,
    objectFit: 'cover',
    x: 0.5,
    y: 0.5,
    width: 1.0,
    height: 1.0,
    zIndex: 10,
    userPhotoPosition: {
      x: 0.787,
      y: 0.822,
      width: 0.35,
      height: 0.197,
      shape: 'circle',
      zIndex: 25,
    },
    userPhotoShape: 'circle',
    userNamePosition: {
      x: 0.36,
      y: 0.822,
      width: 0.44,
      height: 0.08,
      fontSize: 24,
      fontColor: '#FFFFFF',
      fontWeight: '700',
      textAlign: 'center',
      zIndex: 30,
    },
  },
  {
    name: 'Footer 3',
    asset: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/footers/468ce1c5-74f3-447e-bfbf-bfaa0ed7bd22.png',
    videoAsset: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/footers/468ce1c5-74f3-447e-bfbf-bfaa0ed7bd22.png',
    thumbnail: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/footer-thumbnails/28917a8d-fab1-488b-9f26-348d5032465f.png',
    heightPercent: 100,
    objectFit: 'cover',
    x: 0.5,
    y: 0.5,
    width: 1.0,
    height: 1.0,
    zIndex: 10,
    userPhotoPosition: {
      x: 0.794,
      y: 0.842,
      width: 0.35,
      height: 0.197,
      shape: 'circle',
      zIndex: 25,
    },
    userPhotoShape: 'circle',
    userNamePosition: {
      x: 0.36,
      y: 0.842,
      width: 0.44,
      height: 0.08,
      fontSize: 24,
      fontColor: '#FFFFFF',
      fontWeight: '700',
      textAlign: 'center',
      zIndex: 30,
    },
  },
  {
    name: 'Footer 4',
    asset: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/footers/78b34780-ae11-4cca-8f60-d4a2dcb73a43.png',
    videoAsset: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/footers/78b34780-ae11-4cca-8f60-d4a2dcb73a43.png',
    thumbnail: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/footer-thumbnails/b7ec4eef-ad54-4bbe-9e3d-c9c1ac46118d.png',
    heightPercent: 100,
    objectFit: 'cover',
    x: 0.5,
    y: 0.5,
    width: 1.0,
    height: 1.0,
    zIndex: 10,
    userPhotoPosition: {
      x: 0.777,
      y: 0.815,
      width: 0.35,
      height: 0.197,
      shape: 'circle',
      zIndex: 25,
    },
    userPhotoShape: 'circle',
    userNamePosition: {
      x: 0.36,
      y: 0.815,
      width: 0.44,
      height: 0.08,
      fontSize: 24,
      fontColor: '#FFFFFF',
      fontWeight: '700',
      textAlign: 'center',
      zIndex: 30,
    },
  },
];

const DEFAULT_CANVAS_LAYERS = [
  {
    id: 'l1',
    type: 'photo',
    x: 0.787,
    y: 0.825,
    width: 0.35,
    height: 0.197,
    shape: 'circle',
    zIndex: 15,
  },
  {
    id: 'l2',
    type: 'text',
    x: 0.36,
    y: 0.825,
    width: 0.44,
    height: 0.08,
    defaultValue: 'User Name',
    fieldName: 'name',
    fontSize: 24,
    fontColor: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    zIndex: 20,
  },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const templates = await Template.find({});
  console.log(`Updating ${templates.length} templates...`);

  for (const t of templates) {
    t.footers = STANDARDIZED_FOOTERS;
    if (!t.canvasConfig) {
      t.canvasConfig = {
        aspectRatio: 0.5625,
        backgroundColor: '#07140B',
        backgroundImage: t.mainMedia || t.previewAsset || '',
        layers: DEFAULT_CANVAS_LAYERS,
      };
    } else {
      t.canvasConfig.layers = DEFAULT_CANVAS_LAYERS;
    }
    await t.save();
    console.log(`Updated template: ${t.name} (${t._id})`);
  }

  console.log('Migration completed successfully!');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
