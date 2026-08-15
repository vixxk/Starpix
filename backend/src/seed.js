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

const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to MongoDB');

    // Clear existing data
    await Admin.deleteMany({});
    await Category.deleteMany({});
    await Template.deleteMany({});
    await Frame.deleteMany({});
    await Effect.deleteMany({});
    await Campaign.deleteMany({});
    await User.deleteMany({});

    console.log('[Seed] Cleared existing collection data.');

    // 1. Create Default Admin from environment variables
    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@statuzzz.com';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';

    const admin = await Admin.create({
      email: adminEmail,
      passwordHash: adminPassword,
      role: 'super_admin',
      isActive: true,
    });
    console.log(`[Seed] Admin created: ${adminEmail} / ${adminPassword}`);

    // 2. Create 12+ Rich Categories
    const categoriesData = [
      { name: 'आपके लिए', slug: 'for-you', icon: '✨', featured: true, sortOrder: 1, description: 'Personalized recommendations tailored for you' },
      { name: 'Motivation', slug: 'motivation', icon: '🔥', featured: true, sortOrder: 2, description: 'Daily inspiring quotes & success frames' },
      { name: 'Love & Couples', slug: 'love', icon: '❤️', featured: true, sortOrder: 3, description: 'Romantic & couple status templates' },
      { name: 'धार्मिक (Devotional)', slug: 'devotional', icon: '🕉️', featured: true, sortOrder: 4, description: 'Mahadev, Krishna & morning prayer status' },
      { name: 'Good Morning', slug: 'good-morning', icon: '🌅', featured: true, sortOrder: 5, description: 'Fresh morning wishes with your photo' },
      { name: 'Birthday Wishes', slug: 'birthday', icon: '🎂', featured: true, sortOrder: 6, description: 'Birthday celebration templates with photo slot' },
      { name: 'Hindi Quotes', slug: 'quotes', icon: '💬', featured: false, sortOrder: 7, description: 'Wisdom, thoughts & life philosophy' },
      { name: 'Festivals', slug: 'festival', icon: '🎉', featured: true, sortOrder: 8, description: 'Diwali, Eid, Jayanti & Indian festivals' },
      { name: 'Attitude & Style', slug: 'attitude', icon: '😎', featured: false, sortOrder: 9, description: 'High energy royal & swagger cards' },
      { name: 'Video Status Reels', slug: 'reels', icon: '🎬', featured: true, sortOrder: 10, description: 'Motion video templates with music overlay' },
      { name: 'Business & Branding', slug: 'business', icon: '💼', featured: false, sortOrder: 11, description: 'Personal branding & professional cards' },
      { name: 'Good Night', slug: 'good-night', icon: '🌙', featured: false, sortOrder: 12, description: 'Peaceful night greetings and blessings' },
    ];

    const categories = await Category.insertMany(categoriesData);
    console.log(`[Seed] ${categories.length} categories inserted.`);

    const catMap = {};
    categories.forEach((cat) => {
      catMap[cat.slug] = cat._id;
    });

    // 3. Create 8+ Content-Specific Frames
    const framesData = [
      {
        name: 'Golden Emerald Royal Frame',
        thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
        asset: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
        category: catMap['for-you'],
        contentTag: 'general',
        placement: { x: 0.5, y: 0.42, width: 0.72, height: 0.48, zIndex: 10 },
        configuration: { aspectRatio: 0.5625, borderPadding: 12 },
        sortOrder: 1,
      },
      {
        name: 'Cyberpunk Neon Sparkle Border',
        thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&q=80',
        asset: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80',
        category: catMap['motivation'],
        contentTag: 'motivation',
        placement: { x: 0.5, y: 0.45, width: 0.68, height: 0.44, zIndex: 10 },
        configuration: { aspectRatio: 0.5625, borderPadding: 16 },
        sortOrder: 2,
      },
      {
        name: 'Romantic Floral Heart Ring',
        thumbnail: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&q=80',
        asset: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&q=80',
        category: catMap['love'],
        contentTag: 'love',
        placement: { x: 0.5, y: 0.4, width: 0.75, height: 0.5, zIndex: 10 },
        configuration: { aspectRatio: 0.5625, borderPadding: 20 },
        sortOrder: 3,
      },
      {
        name: 'Devotional Mahadev Gold Frame',
        thumbnail: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=400&q=80',
        asset: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&q=80',
        category: catMap['devotional'],
        contentTag: 'devotional',
        placement: { x: 0.5, y: 0.42, width: 0.7, height: 0.46, zIndex: 10 },
        configuration: { aspectRatio: 0.5625, borderPadding: 10 },
        sortOrder: 4,
      },
      {
        name: 'Festive Confetti Birthday Ring',
        thumbnail: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&q=80',
        asset: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&q=80',
        category: catMap['birthday'],
        contentTag: 'birthday',
        placement: { x: 0.5, y: 0.4, width: 0.7, height: 0.45, zIndex: 10 },
        configuration: { aspectRatio: 0.5625, borderPadding: 15 },
        sortOrder: 5,
      },
      {
        name: 'Good Morning Sunrise Oval Frame',
        thumbnail: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=400&q=80',
        asset: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=800&q=80',
        category: catMap['good-morning'],
        contentTag: 'morning',
        placement: { x: 0.5, y: 0.38, width: 0.65, height: 0.42, zIndex: 10 },
        configuration: { aspectRatio: 0.5625, borderPadding: 12 },
        sortOrder: 6,
      },
      {
        name: 'Bold Royal Attitude Frame',
        thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80',
        asset: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80',
        category: catMap['attitude'],
        contentTag: 'attitude',
        placement: { x: 0.5, y: 0.45, width: 0.7, height: 0.45, zIndex: 10 },
        configuration: { aspectRatio: 0.5625, borderPadding: 14 },
        sortOrder: 7,
      },
      {
        name: 'Professional Branding Badge Frame',
        thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80',
        asset: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
        category: catMap['business'],
        contentTag: 'business',
        placement: { x: 0.5, y: 0.4, width: 0.68, height: 0.42, zIndex: 10 },
        configuration: { aspectRatio: 0.5625, borderPadding: 18 },
        sortOrder: 8,
      },
    ];

    const frames = await Frame.insertMany(framesData);
    console.log(`[Seed] ${frames.length} frames inserted.`);

    // 4. Create 6+ Effects
    const effectsData = [
      {
        name: 'Emerald Glitter Sparkles',
        type: 'particle',
        asset: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80',
        duration: 5,
        loop: true,
        intensity: 1.2,
        configuration: { blendMode: 'screen', particleColor: '#6ED47F' },
      },
      {
        name: 'Golden Diya Lights',
        type: 'overlay',
        asset: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&q=80',
        duration: 6,
        loop: true,
        intensity: 1.0,
      },
      {
        name: 'Falling Rose Petals',
        type: 'overlay',
        asset: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80',
        duration: 8,
        loop: true,
        intensity: 0.9,
      },
      {
        name: 'Cyberpunk Green Glow',
        type: 'particle',
        asset: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&q=80',
        duration: 4,
        loop: true,
        intensity: 1.5,
      },
      {
        name: 'Fireworks Festival Splash',
        type: 'video',
        asset: SAMPLE_VIDEOS[0],
        thumbnail: 'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=400&q=80',
        duration: 5,
        loop: true,
        intensity: 1.0,
      },
      {
        name: 'Golden Dust Particles',
        type: 'particle',
        asset: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=80',
        duration: 6,
        loop: true,
        intensity: 1.1,
      },
    ];

    const effects = await Effect.insertMany(effectsData);
    console.log(`[Seed] ${effects.length} effects inserted.`);

    // 5. Create 18+ Comprehensive Templates (Image & Video)
    const templatesData = [
      {
        name: 'विजयी भव: Daily Motivation Status',
        description: 'Inspiring Hindi quote status card with your photo slot & custom signature',
        categoryId: catMap['motivation'],
        type: 'image',
        accessType: 'free',
        price: 0,
        thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&q=80',
        previewAsset: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80',
        mainMedia: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&q=80',
        canvasConfig: {
          aspectRatio: 0.5625,
          backgroundColor: '#07140B',
          backgroundImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80',
          layers: [
            { id: 'l1', type: 'photo', x: 0.5, y: 0.38, width: 0.65, height: 0.42, zIndex: 1 },
            { id: 'l2', type: 'text', x: 0.5, y: 0.72, width: 0.85, height: 0.1, defaultValue: 'सफलता का रहस्य लगातार प्रयास है! 🔥', fieldName: 'quote', fontSize: 20, fontColor: '#6ED47F', zIndex: 2 },
            { id: 'l3', type: 'text', x: 0.5, y: 0.84, width: 0.7, height: 0.08, defaultValue: 'Vivek Sharma', fieldName: 'name', fontSize: 24, fontColor: '#FFFFFF', zIndex: 3 },
          ],
        },
        tags: ['motivation', 'hindi', 'daily', 'success'],
        views: 3420,
        uses: 1280,
        favoritesCount: 490,
        trendingScore: 95,
        isPinned: true,
      },
      {
        name: 'Statuzzz Cyber Emerald VIP Reel',
        description: 'Dynamic video status template with glowing emerald neon particles and music',
        categoryId: catMap['reels'],
        type: 'video',
        accessType: 'premium',
        price: 49,
        thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&q=80',
        previewAsset: SAMPLE_VIDEOS[0],
        mainMedia: SAMPLE_VIDEOS[0],
        canvasConfig: {
          aspectRatio: 0.5625,
          backgroundColor: '#0F351B',
          layers: [
            { id: 'l1', type: 'photo', x: 0.5, y: 0.4, width: 0.7, height: 0.45, zIndex: 1 },
            { id: 'l2', type: 'text', x: 0.5, y: 0.78, width: 0.8, height: 0.08, defaultValue: 'STATUZZZ CREATOR STUDIO', fieldName: 'subtitle', fontSize: 16, fontColor: '#89E398', zIndex: 2 },
            { id: 'l3', type: 'text', x: 0.5, y: 0.86, width: 0.8, height: 0.08, defaultValue: 'Your Name Here', fieldName: 'name', fontSize: 26, fontColor: '#FFFFFF', zIndex: 3 },
          ],
        },
        tags: ['reels', 'video', 'emerald', 'vip', 'neon'],
        views: 5200,
        uses: 2100,
        purchasesCount: 850,
        trendingScore: 99,
        isPinned: true,
      },
      {
        name: 'शुभ प्रभात: Morning Sunrise Blessings',
        description: 'Start your morning with peaceful vibes and your custom photo greeting',
        categoryId: catMap['good-morning'],
        type: 'image',
        accessType: 'free',
        price: 0,
        thumbnail: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=600&q=80',
        previewAsset: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=800&q=80',
        mainMedia: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=1200&q=80',
        canvasConfig: {
          aspectRatio: 0.5625,
          backgroundColor: '#07140B',
          layers: [
            { id: 'l1', type: 'photo', x: 0.5, y: 0.35, width: 0.65, height: 0.4, zIndex: 1 },
            { id: 'l2', type: 'text', x: 0.5, y: 0.68, width: 0.8, height: 0.1, defaultValue: 'आपका दिन मंगलमय हो! 🌅', fieldName: 'greeting', fontSize: 22, fontColor: '#C8F3D0', zIndex: 2 },
            { id: 'l3', type: 'text', x: 0.5, y: 0.82, width: 0.8, height: 0.08, defaultValue: 'Aarav Mehta', fieldName: 'name', fontSize: 24, fontColor: '#FFFFFF', zIndex: 3 },
          ],
        },
        tags: ['good morning', 'hindi', 'wishes', 'sunrise'],
        views: 2890,
        uses: 1140,
        trendingScore: 88,
        isPinned: true,
      },
      {
        name: 'हर हर महादेव: Devotional Shiva Status',
        description: 'Lord Shiva devotional photo frame status with sacred mantras',
        categoryId: catMap['devotional'],
        type: 'image',
        accessType: 'free',
        price: 0,
        thumbnail: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=600&q=80',
        previewAsset: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&q=80',
        mainMedia: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1200&q=80',
        canvasConfig: {
          aspectRatio: 0.5625,
          backgroundColor: '#07140B',
          layers: [
            { id: 'l1', type: 'photo', x: 0.5, y: 0.4, width: 0.65, height: 0.42, zIndex: 1 },
            { id: 'l2', type: 'text', x: 0.5, y: 0.72, width: 0.8, height: 0.1, defaultValue: 'हर हर महादेव! 🕉️', fieldName: 'quote', fontSize: 24, fontColor: '#6ED47F', zIndex: 2 },
            { id: 'l3', type: 'text', x: 0.5, y: 0.84, width: 0.8, height: 0.08, defaultValue: 'Rohan Verma', fieldName: 'name', fontSize: 24, fontColor: '#FFFFFF', zIndex: 3 },
          ],
        },
        tags: ['devotional', 'shiva', 'mahadev', 'hindi'],
        views: 4100,
        uses: 1940,
        trendingScore: 92,
      },
      {
        name: 'Happy Birthday Celebration Video',
        description: 'Animated video template for birthday greetings with dynamic name and photo',
        categoryId: catMap['birthday'],
        type: 'video',
        accessType: 'premium',
        price: 49,
        thumbnail: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&q=80',
        previewAsset: SAMPLE_VIDEOS[1],
        mainMedia: SAMPLE_VIDEOS[1],
        canvasConfig: {
          aspectRatio: 0.5625,
          backgroundColor: '#0F351B',
          layers: [
            { id: 'l1', type: 'photo', x: 0.5, y: 0.38, width: 0.6, height: 0.4, zIndex: 1 },
            { id: 'l2', type: 'text', x: 0.5, y: 0.7, width: 0.8, height: 0.1, defaultValue: 'HAPPY BIRTHDAY! 🎉', fieldName: 'title', fontSize: 26, fontColor: '#89E398', zIndex: 2 },
            { id: 'l3', type: 'text', x: 0.5, y: 0.82, width: 0.8, height: 0.08, defaultValue: 'Birthday Star', fieldName: 'name', fontSize: 24, fontColor: '#FFFFFF', zIndex: 3 },
          ],
        },
        tags: ['birthday', 'video', 'party', 'premium'],
        views: 4900,
        uses: 1820,
        purchasesCount: 610,
        trendingScore: 96,
      },
      {
        name: 'Romantic Couple Floral Wish',
        description: 'Heartwarming love status template for lovers and couples',
        categoryId: catMap['love'],
        type: 'image',
        accessType: 'free',
        price: 0,
        thumbnail: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&q=80',
        previewAsset: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&q=80',
        mainMedia: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&q=80',
        canvasConfig: {
          aspectRatio: 0.5625,
          backgroundColor: '#1F0B12',
          layers: [
            { id: 'l1', type: 'photo', x: 0.5, y: 0.4, width: 0.7, height: 0.45, zIndex: 1 },
            { id: 'l2', type: 'text', x: 0.5, y: 0.75, width: 0.85, height: 0.1, defaultValue: 'तुम्हारे बिना हर खुशी अधूरी है ❤️', fieldName: 'quote', fontSize: 20, fontColor: '#FF85A1', zIndex: 2 },
            { id: 'l3', type: 'text', x: 0.5, y: 0.86, width: 0.8, height: 0.08, defaultValue: 'Forever Together', fieldName: 'subtitle', fontSize: 22, fontColor: '#FFFFFF', zIndex: 3 },
          ],
        },
        tags: ['love', 'couple', 'romantic', 'hindi'],
        views: 3100,
        uses: 1250,
        trendingScore: 91,
      },
      {
        name: 'Royal Attitude Swagger Card',
        description: 'High voltage attitude status card with golden typography',
        categoryId: catMap['attitude'],
        type: 'image',
        accessType: 'free',
        price: 0,
        thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
        previewAsset: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80',
        mainMedia: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&q=80',
        canvasConfig: {
          aspectRatio: 0.5625,
          backgroundColor: '#070F14',
          layers: [
            { id: 'l1', type: 'photo', x: 0.5, y: 0.42, width: 0.68, height: 0.45, zIndex: 1 },
            { id: 'l2', type: 'text', x: 0.5, y: 0.74, width: 0.85, height: 0.1, defaultValue: 'हमारा नाम ही हमारी पहचान है 😎🔥', fieldName: 'attitude', fontSize: 22, fontColor: '#F59E0B', zIndex: 2 },
            { id: 'l3', type: 'text', x: 0.5, y: 0.85, width: 0.8, height: 0.08, defaultValue: 'Karan Singh Rajput', fieldName: 'name', fontSize: 24, fontColor: '#FFFFFF', zIndex: 3 },
          ],
        },
        tags: ['attitude', 'swagger', 'royal', 'hindi'],
        views: 4500,
        uses: 2100,
        trendingScore: 94,
      },
      {
        name: 'Diwali Festive Lights Motion Video',
        description: 'Luminous festive celebration video template with glowing diyas',
        categoryId: catMap['festival'],
        type: 'video',
        accessType: 'premium',
        price: 49,
        thumbnail: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&q=80',
        previewAsset: SAMPLE_VIDEOS[2],
        mainMedia: SAMPLE_VIDEOS[2],
        canvasConfig: {
          aspectRatio: 0.5625,
          backgroundColor: '#1E1408',
          layers: [
            { id: 'l1', type: 'photo', x: 0.5, y: 0.38, width: 0.65, height: 0.4, zIndex: 1 },
            { id: 'l2', type: 'text', x: 0.5, y: 0.7, width: 0.85, height: 0.1, defaultValue: 'शुभ दीपावली की हार्दिक शुभकामनाएं 🪔', fieldName: 'wishes', fontSize: 22, fontColor: '#FBBF24', zIndex: 2 },
            { id: 'l3', type: 'text', x: 0.5, y: 0.82, width: 0.8, height: 0.08, defaultValue: 'Sharma Family', fieldName: 'family', fontSize: 24, fontColor: '#FFFFFF', zIndex: 3 },
          ],
        },
        tags: ['festival', 'diwali', 'video', 'festive'],
        views: 6200,
        uses: 2900,
        purchasesCount: 940,
        trendingScore: 98,
      },
      {
        name: 'Thought of the Day: Hindi Suvichar',
        description: 'Meaningful Hindi thoughts and wisdom quote frame',
        categoryId: catMap['quotes'],
        type: 'image',
        accessType: 'free',
        price: 0,
        thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80',
        previewAsset: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80',
        mainMedia: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80',
        canvasConfig: {
          aspectRatio: 0.5625,
          backgroundColor: '#0A121E',
          layers: [
            { id: 'l1', type: 'photo', x: 0.5, y: 0.36, width: 0.65, height: 0.4, zIndex: 1 },
            { id: 'l2', type: 'text', x: 0.5, y: 0.7, width: 0.85, height: 0.12, defaultValue: 'सत्य की राह कठिन हो सकती है पर मंजिल खूबसूरत होती है 📖', fieldName: 'thought', fontSize: 19, fontColor: '#60A5FA', zIndex: 2 },
            { id: 'l3', type: 'text', x: 0.5, y: 0.84, width: 0.8, height: 0.08, defaultValue: 'विचार क्रांति', fieldName: 'author', fontSize: 22, fontColor: '#FFFFFF', zIndex: 3 },
          ],
        },
        tags: ['quotes', 'suvichar', 'hindi', 'thoughts'],
        views: 1890,
        uses: 780,
        trendingScore: 78,
      },
      {
        name: 'Business Branding & Professional Status',
        description: 'Sleek corporate status frame for entrepreneurs & business leaders',
        categoryId: catMap['business'],
        type: 'image',
        accessType: 'free',
        price: 0,
        thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80',
        previewAsset: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
        mainMedia: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
        canvasConfig: {
          aspectRatio: 0.5625,
          backgroundColor: '#0B132B',
          layers: [
            { id: 'l1', type: 'photo', x: 0.5, y: 0.38, width: 0.68, height: 0.42, zIndex: 1 },
            { id: 'l2', type: 'text', x: 0.5, y: 0.72, width: 0.85, height: 0.08, defaultValue: 'Build your dream or someone will hire you to build theirs', fieldName: 'quote', fontSize: 18, fontColor: '#38BDF8', zIndex: 2 },
            { id: 'l3', type: 'text', x: 0.5, y: 0.83, width: 0.8, height: 0.08, defaultValue: 'CEO & Founder · Statuzzz', fieldName: 'title', fontSize: 22, fontColor: '#FFFFFF', zIndex: 3 },
          ],
        },
        tags: ['business', 'branding', 'professional', 'corporate'],
        views: 2400,
        uses: 990,
        trendingScore: 84,
      },
      {
        name: 'शुभ रात्रि: Peaceful Night Wishes',
        description: 'Calm moonlit status card for good night blessings',
        categoryId: catMap['good-night'],
        type: 'image',
        accessType: 'free',
        price: 0,
        thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80',
        previewAsset: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&q=80',
        mainMedia: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&q=80',
        canvasConfig: {
          aspectRatio: 0.5625,
          backgroundColor: '#080E1A',
          layers: [
            { id: 'l1', type: 'photo', x: 0.5, y: 0.38, width: 0.65, height: 0.4, zIndex: 1 },
            { id: 'l2', type: 'text', x: 0.5, y: 0.72, width: 0.8, height: 0.1, defaultValue: 'मीठे सपनों के साथ शुभ रात्रि 🌙✨', fieldName: 'nightText', fontSize: 22, fontColor: '#A7F3D0', zIndex: 2 },
            { id: 'l3', type: 'text', x: 0.5, y: 0.84, width: 0.8, height: 0.08, defaultValue: 'Good Night', fieldName: 'name', fontSize: 24, fontColor: '#FFFFFF', zIndex: 3 },
          ],
        },
        tags: ['good night', 'peaceful', 'hindi', 'moon'],
        views: 1650,
        uses: 620,
        trendingScore: 75,
      },
      {
        name: 'Cinematic Particles Motion Status',
        description: 'High definition motion video frame with customizable photo backdrop',
        categoryId: catMap['reels'],
        type: 'video',
        accessType: 'premium',
        price: 49,
        thumbnail: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80',
        previewAsset: SAMPLE_VIDEOS[3],
        mainMedia: SAMPLE_VIDEOS[3],
        canvasConfig: {
          aspectRatio: 0.5625,
          backgroundColor: '#0F172A',
          layers: [
            { id: 'l1', type: 'photo', x: 0.5, y: 0.4, width: 0.7, height: 0.45, zIndex: 1 },
            { id: 'l2', type: 'text', x: 0.5, y: 0.76, width: 0.8, height: 0.08, defaultValue: 'CINEMATIC CREATION', fieldName: 'title', fontSize: 22, fontColor: '#38BDF8', zIndex: 2 },
            { id: 'l3', type: 'text', x: 0.5, y: 0.86, width: 0.8, height: 0.08, defaultValue: 'Statuzzz Video Hub', fieldName: 'sub', fontSize: 20, fontColor: '#FFFFFF', zIndex: 3 },
          ],
        },
        tags: ['reels', 'cinematic', 'video', 'motion'],
        views: 3800,
        uses: 1450,
        purchasesCount: 520,
        trendingScore: 93,
      },
    ];

    const templates = await Template.insertMany(templatesData);
    console.log(`[Seed] ${templates.length} templates inserted.`);

    // 6. Create 3 Active Campaigns
    const campaignsData = [
      {
        name: '🎉 Statuzzz Festival Carnival 2026',
        description: 'Unlock 100+ exclusive HD festival status templates & video reels for free this week!',
        heroImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80',
        heroBackground: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80',
        featuredCategories: [catMap['festival'], catMap['reels']],
        featuredTemplates: [templates[7]._id, templates[1]._id],
        active: true,
        showOnAppOpening: true,
        priority: 10,
        ctaText: 'Explore Festival Statuses',
      },
      {
        name: '🔥 Daily Trending Creator Spotlight',
        description: 'Create status cards with your photo and get featured on Statuzzz Trending Feed.',
        heroImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&q=80',
        featuredTemplates: [templates[0]._id, templates[3]._id],
        active: true,
        showOnAppOpening: false,
        priority: 5,
        ctaText: 'Create Your Status',
      },
      {
        name: '🎬 Motion Video Status Reel Hub',
        description: 'Add music and particle effects to your personal photos with 1-tap HD export.',
        heroImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&q=80',
        featuredCategories: [catMap['reels']],
        featuredTemplates: [templates[1]._id, templates[4]._id, templates[11]._id],
        active: true,
        showOnAppOpening: false,
        priority: 8,
        ctaText: 'Browse Video Reels',
      },
    ];

    const campaigns = await Campaign.insertMany(campaignsData);
    console.log(`[Seed] ${campaigns.length} campaigns inserted.`);

    // 7. Create Sample Users & Entitlements
    const usersData = [
      {
        phoneNumber: '+919876543210',
        name: 'Rajesh Kumar',
        role: 'creator',
        isPremium: true,
        premiumExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year VIP
        unlockedTemplates: [templates[1]._id, templates[4]._id],
        savedFavorites: [templates[0]._id, templates[2]._id, templates[3]._id],
      },
      {
        phoneNumber: '+919123456789',
        name: 'Priya Sharma',
        role: 'user',
        isPremium: false,
        savedFavorites: [templates[0]._id, templates[1]._id],
      },
    ];

    const users = await User.insertMany(usersData);
    console.log(`[Seed] ${users.length} sample users created.`);

    // 8. Create Sample Purchase Transactions & Analytics Events
    const Purchase = require('./models/Purchase');
    const Analytics = require('./models/Analytics');

    await Purchase.deleteMany({});
    await Analytics.deleteMany({});

    const purchasesData = [
      {
        userId: users[0]._id,
        templateId: templates[1]._id,
        productId: 'statuzzz_single_unlock',
        amount: 49,
        currency: 'INR',
        status: 'successful',
        paymentProvider: 'UPI',
        transactionId: 'TXN_' + Date.now() + '_01',
        finalAssetUrl: templates[1].previewAsset,
      },
      {
        userId: users[0]._id,
        templateId: templates[4]._id,
        productId: 'statuzzz_single_unlock',
        amount: 49,
        currency: 'INR',
        status: 'successful',
        paymentProvider: 'Razorpay',
        transactionId: 'TXN_' + (Date.now() + 100) + '_02',
        finalAssetUrl: templates[4].previewAsset,
      },
      {
        userId: users[1]._id,
        templateId: templates[7]._id,
        productId: 'statuzzz_single_unlock',
        amount: 49,
        currency: 'INR',
        status: 'successful',
        paymentProvider: 'UPI',
        transactionId: 'TXN_' + (Date.now() + 200) + '_03',
        finalAssetUrl: templates[7].previewAsset,
      },
    ];

    const purchases = await Purchase.insertMany(purchasesData);
    console.log(`[Seed] ${purchases.length} purchase records created.`);

    const analyticsData = [
      { eventType: 'template_view', userId: users[0]._id, templateId: templates[0]._id },
      { eventType: 'template_download', userId: users[0]._id, templateId: templates[0]._id },
      { eventType: 'photo_upload', userId: users[0]._id, templateId: templates[0]._id },
      { eventType: 'template_view', userId: users[1]._id, templateId: templates[1]._id },
      { eventType: 'template_share', userId: users[1]._id, templateId: templates[1]._id },
    ];

    await Analytics.insertMany(analyticsData);
    console.log(`[Seed] Analytics events recorded.`);

    console.log('----------------------------------------------------');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log(`📊 Admin: ${adminEmail} / ${adminPassword}`);
    console.log(`📊 Categories: ${categories.length}`);
    console.log(`📊 Templates: ${templates.length}`);
    console.log(`📊 Frames: ${frames.length}`);
    console.log(`📊 Effects: ${effects.length}`);
    console.log(`📊 Campaigns: ${campaigns.length}`);
    console.log(`📊 Sample Users: ${users.length}`);
    console.log(`📊 Purchases: ${purchases.length}`);
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Database seeding failed:', error);
    process.exit(1);
  }
};

seedData();
