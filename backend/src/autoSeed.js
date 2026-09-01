const Admin = require('./models/Admin');
const Category = require('./models/Category');
const Template = require('./models/Template');
const Frame = require('./models/Frame');
const Effect = require('./models/Effect');
const Campaign = require('./models/Campaign');
const User = require('./models/User');
const Purchase = require('./models/Purchase');
const Analytics = require('./models/Analytics');

const autoSeedIfEmpty = async () => {
  try {
    // 1. Ensure Super Admin account exists
    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@starpix.com';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
    const existingAdmin = await Admin.findOne({ email: adminEmail.toLowerCase() });
    if (!existingAdmin) {
      await Admin.create({
        email: adminEmail,
        passwordHash: adminPassword,
        role: 'super_admin',
        isActive: true,
      });
      console.log(`[AutoSeed] Default Admin ensured: ${adminEmail}`);
    }

    // 2. Remove seeded mock data from database
    const seededUserPhoneNumbers = ['+919876543210', '+919123456789'];
    await User.deleteMany({ phoneNumber: { $in: seededUserPhoneNumbers } });


    await Frame.deleteMany({
      name: {
        $in: [
          'Golden Emerald Royal Frame',
          'Cyberpunk Neon Sparkle Border',
          'Romantic Floral Heart Ring',
          'Devotional Mahadev Gold Frame',
          'Festive Confetti Birthday Ring',
          'Good Morning Sunrise Oval Frame',
          'Bold Royal Attitude Frame',
          'Professional Branding Badge Frame',
        ],
      },
    });

    await Effect.deleteMany({
      name: {
        $in: [
          'Emerald Glitter Sparkles',
          'Golden Diya Lights',
          'Falling Rose Petals',
          'Cyberpunk Green Glow',
          'Fireworks Festival Splash',
          'Golden Dust Particles',
        ],
      },
    });

    await Campaign.deleteMany({
      name: {
        $in: [
          '🎉 Starpix Festival Carnival 2026',
          '🔥 Daily Trending Creator Spotlight',
          '🎬 Motion Video Status Reel Hub',
        ],
      },
    });

    await Template.deleteMany({
      name: {
        $in: [
          'विजयी भव: Daily Motivation Status',
          'Starpix Cyber Emerald VIP Reel',
          'शुभ प्रभात: Morning Sunrise Blessings',
          'हर हर महादेव: Devotional Shiva Status',
          'Happy Birthday Celebration Video',
          'Romantic Couple Floral Wish',
          'Royal Attitude Swagger Card',
          'Diwali Festive Lights Motion Video',
          'Thought of the Day: Hindi Suvichar',
          'Business Branding & Professional Status',
          'शुभ रात्रि: Peaceful Night Wishes',
          'Cinematic Particles Motion Status',
        ],
      },
    });

    // Remove any sample purchases or analytics attached to deleted mock items
    const remainingTemplateIds = (await Template.find().select('_id')).map((t) => t._id);
    await Purchase.deleteMany({ templateId: { $nin: remainingTemplateIds } });
    await Analytics.deleteMany({ templateId: { $nin: remainingTemplateIds } });

    console.log('[AutoSeed] Production mode active — seeded mock data removed.');
  } catch (error) {
    console.error('[AutoSeed] Error during cleanup:', error.message);
  }
};

module.exports = { autoSeedIfEmpty };

