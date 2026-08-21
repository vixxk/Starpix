require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Category = require('./models/Category');
const Template = require('./models/Template');
const Frame = require('./models/Frame');
const Effect = require('./models/Effect');
const Campaign = require('./models/Campaign');
const User = require('./models/User');

const connectDB = require('./config/db');

// High-quality sample videos for Video Status Templates
const SAMPLE_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoylines.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdown.mp4',
];

const SAMPLE_FOOTERS = [
  {
    name: 'Mahadev Trishul Parchment',
    videoAsset: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&q=80',
    blendMode: 'normal',
    heightPercent: 35,
    objectFit: 'contain',
  },
  {
    name: 'Golden Smoke Clouds',
    videoAsset: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    blendMode: 'screen',
    heightPercent: 40,
    objectFit: 'cover',
  },
  {
    name: 'Festive Sparkle Waves',
    videoAsset: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    blendMode: 'screen',
    heightPercent: 38,
    objectFit: 'contain',
  },
];

const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to MongoDB');

    // Create Default Admin from environment variables if not present
    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@statuzzz.com';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';

    let admin = await Admin.findOne({ email: adminEmail.toLowerCase() });
    if (!admin) {
      admin = await Admin.create({
        email: adminEmail,
        passwordHash: adminPassword,
        role: 'super_admin',
        isActive: true,
      });
      console.log(`[Seed] Super Admin created: ${adminEmail}`);
    } else {
      console.log(`[Seed] Super Admin already exists: ${adminEmail}`);
    }

    console.log('----------------------------------------------------');
    console.log('✅ DATABASE INITIALIZATION COMPLETED!');
    console.log(`📊 Admin: ${adminEmail}`);
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Database initialization failed:', error);
    process.exit(1);
  }
};

seedData();
