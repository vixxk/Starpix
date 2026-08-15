const Admin = require('./models/Admin');
const Category = require('./models/Category');
const Template = require('./models/Template');
const Frame = require('./models/Frame');
const Effect = require('./models/Effect');
const Campaign = require('./models/Campaign');
const User = require('./models/User');
const Purchase = require('./models/Purchase');
const Analytics = require('./models/Analytics');

const SAMPLE_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
];

const autoSeedIfEmpty = async () => {
  try {
    const templateCount = await Template.countDocuments();
    if (templateCount > 0) {
      console.log(`[AutoSeed] DB already has ${templateCount} templates — skipping seed.`);
      return;
    }

    console.log('[AutoSeed] Empty database detected — seeding...');

    // 1. Admin
    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@statuzzz.com';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await Admin.create({ email: adminEmail, passwordHash: adminPassword, role: 'super_admin', isActive: true });
      console.log(`[AutoSeed] Admin created: ${adminEmail}`);
    }

    // 2. Categories
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
    const catMap = {};
    categories.forEach((c) => { catMap[c.slug] = c._id; });
    console.log(`[AutoSeed] ${categories.length} categories created.`);

    // 3. Frames
    await Frame.insertMany([
      { name: 'Golden Emerald Royal Frame', thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80', asset: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80', category: catMap['for-you'], contentTag: 'general', placement: { x: 0.5, y: 0.42, width: 0.72, height: 0.48, zIndex: 10 }, configuration: { aspectRatio: 0.5625, borderPadding: 12 }, sortOrder: 1 },
      { name: 'Cyberpunk Neon Sparkle Border', thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&q=80', asset: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80', category: catMap['motivation'], contentTag: 'motivation', placement: { x: 0.5, y: 0.45, width: 0.68, height: 0.44, zIndex: 10 }, configuration: { aspectRatio: 0.5625, borderPadding: 16 }, sortOrder: 2 },
      { name: 'Romantic Floral Heart Ring', thumbnail: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&q=80', asset: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&q=80', category: catMap['love'], contentTag: 'love', placement: { x: 0.5, y: 0.4, width: 0.75, height: 0.5, zIndex: 10 }, configuration: { aspectRatio: 0.5625, borderPadding: 20 }, sortOrder: 3 },
    ]);

    // 4. Effects
    await Effect.insertMany([
      { name: 'Emerald Glitter Sparkles', type: 'particle', asset: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80', duration: 5, loop: true, intensity: 1.2 },
      { name: 'Golden Diya Lights', type: 'overlay', asset: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&q=80', duration: 6, loop: true, intensity: 1.0 },
      { name: 'Falling Rose Petals', type: 'overlay', asset: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80', duration: 8, loop: true, intensity: 0.9 },
    ]);

    // 5. Templates
    const mkLayers = (photo, text1, text2) => [
      { id: 'l1', type: 'photo', x: 0.5, y: photo.y || 0.38, width: photo.w || 0.65, height: photo.h || 0.42, zIndex: 1 },
      { id: 'l2', type: 'text', x: 0.5, y: text1.y || 0.72, width: 0.85, height: 0.1, defaultValue: text1.text, fieldName: text1.field || 'quote', fontSize: text1.size || 20, fontColor: text1.color || '#6ED47F', zIndex: 2 },
      { id: 'l3', type: 'text', x: 0.5, y: text2.y || 0.84, width: 0.8, height: 0.08, defaultValue: text2.text, fieldName: text2.field || 'name', fontSize: text2.size || 24, fontColor: text2.color || '#FFFFFF', zIndex: 3 },
    ];

    const templatesData = [
      { name: 'विजयी भव: Daily Motivation Status', description: 'Inspiring Hindi quote status card with your photo slot', categoryId: catMap['motivation'], type: 'image', accessType: 'free', price: 0, thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&q=80', previewAsset: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80', mainMedia: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&q=80', canvasConfig: { aspectRatio: 0.5625, backgroundColor: '#07140B', layers: mkLayers({ y: 0.38 }, { text: 'सफलता का रहस्य लगातार प्रयास है! 🔥', color: '#6ED47F' }, { text: 'Vivek Sharma' }) }, tags: ['motivation', 'hindi', 'daily'], views: 3420, uses: 1280, favoritesCount: 490, trendingScore: 95, isPinned: true },
      { name: 'Statuzzz Cyber Emerald VIP Reel', description: 'Dynamic video status with glowing neon particles', categoryId: catMap['reels'], type: 'video', accessType: 'premium', price: 49, thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&q=80', previewAsset: SAMPLE_VIDEOS[0], mainMedia: SAMPLE_VIDEOS[0], canvasConfig: { aspectRatio: 0.5625, backgroundColor: '#0F351B', layers: mkLayers({ y: 0.4 }, { text: 'STATUZZZ CREATOR STUDIO', color: '#89E398', field: 'subtitle', size: 16 }, { text: 'Your Name Here', size: 26 }) }, tags: ['reels', 'video', 'vip'], views: 5200, uses: 2100, purchasesCount: 850, trendingScore: 99, isPinned: true },
      { name: 'शुभ प्रभात: Morning Sunrise Blessings', description: 'Start your morning with peaceful vibes', categoryId: catMap['good-morning'], type: 'image', accessType: 'free', price: 0, thumbnail: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=600&q=80', previewAsset: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=800&q=80', mainMedia: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=1200&q=80', canvasConfig: { aspectRatio: 0.5625, backgroundColor: '#07140B', layers: mkLayers({ y: 0.35 }, { text: 'आपका दिन मंगलमय हो! 🌅', color: '#C8F3D0', field: 'greeting', size: 22 }, { text: 'Aarav Mehta' }) }, tags: ['good morning', 'hindi', 'wishes'], views: 2890, uses: 1140, trendingScore: 88, isPinned: true },
      { name: 'हर हर महादेव: Devotional Shiva Status', description: 'Lord Shiva devotional photo frame status', categoryId: catMap['devotional'], type: 'image', accessType: 'free', price: 0, thumbnail: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=600&q=80', previewAsset: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&q=80', mainMedia: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1200&q=80', canvasConfig: { aspectRatio: 0.5625, backgroundColor: '#07140B', layers: mkLayers({ y: 0.4 }, { text: 'हर हर महादेव! 🕉️', size: 24 }, { text: 'Rohan Verma' }) }, tags: ['devotional', 'shiva', 'mahadev'], views: 4100, uses: 1940, trendingScore: 92 },
      { name: 'Happy Birthday Celebration Video', description: 'Animated video template for birthday greetings', categoryId: catMap['birthday'], type: 'video', accessType: 'premium', price: 49, thumbnail: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&q=80', previewAsset: SAMPLE_VIDEOS[1], mainMedia: SAMPLE_VIDEOS[1], canvasConfig: { aspectRatio: 0.5625, backgroundColor: '#0F351B', layers: mkLayers({ y: 0.38, w: 0.6, h: 0.4 }, { text: 'HAPPY BIRTHDAY! 🎉', color: '#89E398', field: 'title', size: 26, y: 0.7 }, { text: 'Birthday Star', y: 0.82 }) }, tags: ['birthday', 'video', 'party'], views: 4900, uses: 1820, purchasesCount: 610, trendingScore: 96 },
      { name: 'Romantic Couple Floral Wish', description: 'Heartwarming love status template', categoryId: catMap['love'], type: 'image', accessType: 'free', price: 0, thumbnail: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&q=80', previewAsset: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&q=80', mainMedia: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&q=80', canvasConfig: { aspectRatio: 0.5625, backgroundColor: '#1F0B12', layers: mkLayers({ y: 0.4, w: 0.7, h: 0.45 }, { text: 'तुम्हारे बिना हर खुशी अधूरी है ❤️', color: '#FF85A1' }, { text: 'Forever Together', field: 'subtitle', size: 22 }) }, tags: ['love', 'couple', 'romantic'], views: 3100, uses: 1250, trendingScore: 91 },
      { name: 'Royal Attitude Swagger Card', description: 'High voltage attitude status card', categoryId: catMap['attitude'], type: 'image', accessType: 'free', price: 0, thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80', previewAsset: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80', mainMedia: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&q=80', canvasConfig: { aspectRatio: 0.5625, backgroundColor: '#070F14', layers: mkLayers({ y: 0.42, w: 0.68, h: 0.45 }, { text: 'हमारा नाम ही हमारी पहचान है 😎🔥', color: '#F59E0B', field: 'attitude', size: 22 }, { text: 'Karan Singh Rajput' }) }, tags: ['attitude', 'swagger', 'royal'], views: 4500, uses: 2100, trendingScore: 94 },
      { name: 'Diwali Festive Lights Motion Video', description: 'Luminous festive celebration video template', categoryId: catMap['festival'], type: 'video', accessType: 'premium', price: 49, thumbnail: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&q=80', previewAsset: SAMPLE_VIDEOS[2], mainMedia: SAMPLE_VIDEOS[2], canvasConfig: { aspectRatio: 0.5625, backgroundColor: '#1E1408', layers: mkLayers({ y: 0.38 }, { text: 'शुभ दीपावली की हार्दिक शुभकामनाएं 🪔', color: '#FBBF24', field: 'wishes', size: 22, y: 0.7 }, { text: 'Sharma Family', field: 'family', y: 0.82 }) }, tags: ['festival', 'diwali', 'video'], views: 6200, uses: 2900, purchasesCount: 940, trendingScore: 98 },
      { name: 'Thought of the Day: Hindi Suvichar', description: 'Meaningful Hindi thoughts and wisdom', categoryId: catMap['quotes'], type: 'image', accessType: 'free', price: 0, thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80', previewAsset: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80', mainMedia: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80', canvasConfig: { aspectRatio: 0.5625, backgroundColor: '#0A121E', layers: mkLayers({ y: 0.36 }, { text: 'सत्य की राह कठिन हो सकती है पर मंजिल खूबसूरत होती है 📖', color: '#60A5FA', field: 'thought', size: 19 }, { text: 'विचार क्रांति', field: 'author', size: 22 }) }, tags: ['quotes', 'suvichar', 'hindi'], views: 1890, uses: 780, trendingScore: 78 },
      { name: 'Business Branding & Professional Status', description: 'Sleek corporate status frame', categoryId: catMap['business'], type: 'image', accessType: 'free', price: 0, thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80', previewAsset: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80', mainMedia: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80', canvasConfig: { aspectRatio: 0.5625, backgroundColor: '#0B132B', layers: mkLayers({ y: 0.38, w: 0.68, h: 0.42 }, { text: 'Build your dream or someone will hire you to build theirs', color: '#38BDF8', size: 18 }, { text: 'CEO & Founder · Statuzzz', field: 'title', size: 22 }) }, tags: ['business', 'branding', 'professional'], views: 2400, uses: 990, trendingScore: 84 },
      { name: 'शुभ रात्रि: Peaceful Night Wishes', description: 'Calm moonlit status for good night', categoryId: catMap['good-night'], type: 'image', accessType: 'free', price: 0, thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80', previewAsset: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&q=80', mainMedia: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&q=80', canvasConfig: { aspectRatio: 0.5625, backgroundColor: '#080E1A', layers: mkLayers({ y: 0.38 }, { text: 'मीठे सपनों के साथ शुभ रात्रि 🌙✨', color: '#A7F3D0', field: 'nightText', size: 22 }, { text: 'Good Night' }) }, tags: ['good night', 'peaceful', 'hindi'], views: 1650, uses: 620, trendingScore: 75 },
      { name: 'Cinematic Particles Motion Status', description: 'HD motion video frame with photo backdrop', categoryId: catMap['reels'], type: 'video', accessType: 'premium', price: 49, thumbnail: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80', previewAsset: SAMPLE_VIDEOS[3], mainMedia: SAMPLE_VIDEOS[3], canvasConfig: { aspectRatio: 0.5625, backgroundColor: '#0F172A', layers: mkLayers({ y: 0.4, w: 0.7, h: 0.45 }, { text: 'CINEMATIC CREATION', color: '#38BDF8', field: 'title', size: 22, y: 0.76 }, { text: 'Statuzzz Video Hub', field: 'sub', size: 20, y: 0.86 }) }, tags: ['reels', 'cinematic', 'video'], views: 3800, uses: 1450, purchasesCount: 520, trendingScore: 93 },
    ];

    const templates = await Template.insertMany(templatesData);
    console.log(`[AutoSeed] ${templates.length} templates created.`);

    // 6. Campaigns
    await Campaign.insertMany([
      { name: '🎉 Statuzzz Festival Carnival 2026', description: 'Unlock 100+ exclusive HD festival status templates & video reels for free this week!', heroImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80', heroBackground: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80', featuredCategories: [catMap['festival'], catMap['reels']], featuredTemplates: [templates[7]._id, templates[1]._id], active: true, showOnAppOpening: true, priority: 10, ctaText: 'Explore Festival Statuses' },
      { name: '🔥 Daily Trending Creator Spotlight', description: 'Create status cards with your photo and get featured.', heroImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&q=80', featuredTemplates: [templates[0]._id, templates[3]._id], active: true, showOnAppOpening: false, priority: 5, ctaText: 'Create Your Status' },
    ]);

    // 7. Sample users
    const users = await User.insertMany([
      { phoneNumber: '+919876543210', name: 'Rajesh Kumar', role: 'creator', isPremium: true, premiumExpiresAt: new Date(Date.now() + 365 * 86400000), unlockedTemplates: [templates[1]._id, templates[4]._id], savedFavorites: [templates[0]._id, templates[2]._id] },
      { phoneNumber: '+919123456789', name: 'Priya Sharma', role: 'user', isPremium: false, savedFavorites: [templates[0]._id] },
    ]);

    console.log('[AutoSeed] ✅ Database seeded successfully!');
  } catch (error) {
    console.error('[AutoSeed] Seed failed:', error.message);
  }
};

module.exports = { autoSeedIfEmpty };
