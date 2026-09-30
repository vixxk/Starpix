const Admin = require('./models/Admin');
const Category = require('./models/Category');
const Template = require('./models/Template');
const Frame = require('./models/Frame');
const { getOrInitAICreditSetting } = require('./controllers/aiCreditController');

const S3_BASE = 'https://starpix-media-production.s3.ap-south-1.amazonaws.com';

const autoSeedIfEmpty = async () => {
  try {
    // 1. Ensure Super Admin account exists
    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@starpix.com';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
    let admin = await Admin.findOne({ email: adminEmail.toLowerCase() });
    if (!admin) {
      admin = await Admin.create({
        email: adminEmail,
        passwordHash: adminPassword,
        role: 'super_admin',
        isActive: true,
      });
      console.log(`[AutoSeed] Default Admin ensured: ${adminEmail}`);
    }

    // 2. Seed All Categories (covering both User Home Page Top and Explore tabs)
    const categorySeeds = [
      { name: "Today's Special", slug: 'special', icon: '⭐', sortOrder: 1, featured: true },
      { name: 'Trending', slug: 'trending', icon: '🔥', sortOrder: 2, featured: true },
      { name: 'Durga Puja', slug: 'durga_puja', icon: '🪷', sortOrder: 3, featured: true },
      { name: 'Good Morning', slug: 'good-morning', icon: '☀️', sortOrder: 4, featured: true },
      { name: 'Bhakti', slug: 'bhakti', icon: '🕉️', sortOrder: 5, featured: true },
      { name: 'Dance Video', slug: 'dance-video', icon: '🎵', sortOrder: 6, featured: true },
      { name: "Retro 80's", slug: 'retro-80s', icon: '📻', sortOrder: 7, featured: true },
      { name: 'Tomorrow', slug: 'tomorrow', icon: '📅', sortOrder: 8, featured: true },
      { name: 'Festivals', slug: 'festivals', icon: '🎉', sortOrder: 9, featured: true },
      { name: 'Devotional', slug: 'devotional', icon: '🙏', sortOrder: 10, featured: true },
      { name: 'Love & Romance', slug: 'love', icon: '❤️', sortOrder: 11, featured: true },
      { name: 'Birthday Wishes', slug: 'birthday', icon: '🎂', sortOrder: 12, featured: true },
    ];

    const categoryMap = {};
    for (const cat of categorySeeds) {
      let existing = await Category.findOne({ slug: cat.slug });
      if (!existing) {
        existing = await Category.create({
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          sortOrder: cat.sortOrder,
          featured: cat.featured,
          active: true,
        });
      }
      categoryMap[cat.slug] = existing._id;
    }
    console.log('[AutoSeed] Categories ensured for app and admin sync.');

    // 3. Seed All Footers / Frames (matching home screen bottom footers)
    const frameSeeds = [
      {
        name: 'Durga Puja Golden Mandala',
        thumbnail: `${S3_BASE}/frames/durga_puja_thumb.jpg`,
        asset: `${S3_BASE}/frames/durga_puja_thumb.jpg`,
        contentTag: 'festival',
        sortOrder: 1,
      },
      {
        name: 'Moon Lake Serenade',
        thumbnail: `${S3_BASE}/frames/frame_moon_lake.jpg`,
        asset: `${S3_BASE}/frames/frame_moon_lake.jpg`,
        contentTag: 'night',
        sortOrder: 2,
      },
      {
        name: 'Moon Clouds Night',
        thumbnail: `${S3_BASE}/frames/moon_clouds_thumb.jpg`,
        asset: `${S3_BASE}/frames/moon_clouds_thumb.jpg`,
        contentTag: 'night',
        sortOrder: 3,
      },
      {
        name: 'Diya Mandala Ring',
        thumbnail: `${S3_BASE}/frames/diya_mandala_thumb.jpg`,
        asset: `${S3_BASE}/frames/diya_mandala_thumb.jpg`,
        contentTag: 'festival',
        sortOrder: 4,
      },
      {
        name: 'Sunrise Temple Diya',
        thumbnail: `${S3_BASE}/frames/sunrise_thumb.jpg`,
        asset: `${S3_BASE}/frames/sunrise_thumb.jpg`,
        contentTag: 'morning',
        sortOrder: 5,
      },
      {
        name: 'Romantic Couple Floral',
        thumbnail: `${S3_BASE}/frames/couple_thumb.jpg`,
        asset: `${S3_BASE}/frames/couple_thumb.jpg`,
        contentTag: 'love',
        sortOrder: 6,
      },
    ];

    for (const frameData of frameSeeds) {
      const existingFrame = await Frame.findOne({ name: frameData.name });
      if (!existingFrame) {
        await Frame.create({
          ...frameData,
          category: categoryMap['festivals'] || null,
          active: true,
        });
      }
    }
    console.log('[AutoSeed] Footers / Frames ensured for app and admin sync.');

    // 4. Seed All Templates (matching Home page and explore feeds)
    const templateSeeds = [
      {
        name: 'Happy Durga Puja',
        description: 'Traditional Durga Puja celebration reel with divine golden aura and rhythmic dhak music',
        categoryId: categoryMap['durga_puja'] || categoryMap['festivals'],
        type: 'video',
        accessType: 'free',
        price: 0,
        thumbnail: `${S3_BASE}/frames/durga_puja_thumb.jpg`,
        previewAsset: `${S3_BASE}/reels/durga_puja_reel.mp4`,
        mainMedia: `${S3_BASE}/reels/durga_puja_reel.mp4`,
        isPinned: true,
        sortOrder: 1,
        order: 1,
        active: true,
        footers: [
          {
            name: 'Durga Puja Mandala Footer',
            videoAsset: `${S3_BASE}/frames/durga_puja_thumb.jpg`,
            thumbnail: `${S3_BASE}/frames/durga_puja_thumb.jpg`,
            heightPercent: 40,
            objectFit: 'contain',
          },
          {
            name: 'Moon Lake Footer',
            videoAsset: `${S3_BASE}/frames/frame_moon_lake.jpg`,
            thumbnail: `${S3_BASE}/frames/frame_moon_lake.jpg`,
            heightPercent: 40,
            objectFit: 'contain',
          },
          {
            name: 'Diya Mandala Footer',
            videoAsset: `${S3_BASE}/frames/diya_mandala_thumb.jpg`,
            thumbnail: `${S3_BASE}/frames/diya_mandala_thumb.jpg`,
            heightPercent: 40,
            objectFit: 'contain',
          },
        ],
      },
      {
        name: 'Retro 80s Vintage Couple',
        description: 'Warm golden nostalgic film grain couple portrait with classic 80s music vibes',
        categoryId: categoryMap['retro-80s'] || categoryMap['trending'],
        type: 'image',
        accessType: 'free',
        price: 0,
        thumbnail: `${S3_BASE}/reels/retro_80s.jpg`,
        previewAsset: `${S3_BASE}/reels/retro_80s.jpg`,
        mainMedia: `${S3_BASE}/reels/retro_80s.jpg`,
        sortOrder: 2,
        order: 2,
        active: true,
        footers: [
          {
            name: 'Mandala Ring',
            videoAsset: `${S3_BASE}/frames/diya_mandala_thumb.jpg`,
            thumbnail: `${S3_BASE}/frames/diya_mandala_thumb.jpg`,
          },
        ],
      },
      {
        name: 'Vintage Indian Couple Ride',
        description: 'Classic motorcycle street ride through historic market with romantic mood',
        categoryId: categoryMap['dance-video'] || categoryMap['retro-80s'],
        type: 'image',
        accessType: 'free',
        price: 0,
        thumbnail: `${S3_BASE}/reels/vintage_couple.jpg`,
        previewAsset: `${S3_BASE}/reels/vintage_couple.jpg`,
        mainMedia: `${S3_BASE}/reels/vintage_couple.jpg`,
        sortOrder: 3,
        order: 3,
        active: true,
      },
      {
        name: 'Good Morning Sunrise',
        description: 'Bright dawn sunrise with peaceful birds chirp and inspirational morning thought',
        categoryId: categoryMap['good-morning'] || categoryMap['special'],
        type: 'image',
        accessType: 'free',
        price: 0,
        thumbnail: `${S3_BASE}/frames/sunrise_thumb.jpg`,
        previewAsset: `${S3_BASE}/frames/sunrise_thumb.jpg`,
        mainMedia: `${S3_BASE}/frames/sunrise_thumb.jpg`,
        sortOrder: 4,
        order: 4,
        active: true,
      },
      {
        name: 'Diwali Festive Lights',
        description: 'Illuminated earthen oil lamps and glowing rangoli for auspicious Diwali greetings',
        categoryId: categoryMap['festivals'] || categoryMap['trending'],
        type: 'image',
        accessType: 'free',
        price: 0,
        thumbnail: `${S3_BASE}/frames/diya_mandala_thumb.jpg`,
        previewAsset: `${S3_BASE}/frames/diya_mandala_thumb.jpg`,
        mainMedia: `${S3_BASE}/frames/diya_mandala_thumb.jpg`,
        sortOrder: 5,
        order: 5,
        active: true,
      },
      {
        name: 'Mahadev Divine Bhakti Status',
        description: 'Sacred chanting and mystical Himalayas ambience dedicated to Lord Shiva',
        categoryId: categoryMap['bhakti'] || categoryMap['devotional'],
        type: 'video',
        accessType: 'free',
        price: 0,
        thumbnail: `${S3_BASE}/frames/diya_mandala_thumb.jpg`,
        previewAsset: `${S3_BASE}/reels/durga_puja_reel.mp4`,
        mainMedia: `${S3_BASE}/reels/durga_puja_reel.mp4`,
        sortOrder: 6,
        order: 6,
        active: true,
      },
    ];

    for (const tData of templateSeeds) {
      const existingTmpl = await Template.findOne({ name: tData.name });
      if (!existingTmpl) {
        await Template.create(tData);
      }
    }
    console.log('[AutoSeed] Templates ensured for app and admin sync.');

    // 5. Ensure AI Credits setting document exists
    await getOrInitAICreditSetting();
    console.log('[AutoSeed] AI Credit Settings ensured for app and admin sync.');
  } catch (error) {
    console.error('[AutoSeed] Error during seeding:', error.message);
  }
};

module.exports = { autoSeedIfEmpty };
