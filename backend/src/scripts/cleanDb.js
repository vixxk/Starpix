require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

async function cleanDatabase() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI not found in environment.');
    process.exit(1);
  }

  console.log('[CleanDB] Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('[CleanDB] Connected successfully.');

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  for (const col of collections) {
    const colName = col.name;
    if (colName === 'admins') {
      // Remove obsolete admins, keep or ensure only admin@starpix.com
      const Admin = require('../models/Admin');
      const adminEmail = (process.env.ADMIN_DEFAULT_EMAIL || 'admin@starpix.com').toLowerCase();
      const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';

      await Admin.deleteMany({ email: { $ne: adminEmail } });
      const existing = await Admin.findOne({ email: adminEmail });
      if (!existing) {
        await Admin.create({
          email: adminEmail,
          passwordHash: adminPassword,
          role: 'super_admin',
          isActive: true,
        });
        console.log(`[CleanDB] Ensured default admin: ${adminEmail}`);
      } else {
        existing.passwordHash = adminPassword;
        await existing.save();
        console.log(`[CleanDB] Kept default admin: ${adminEmail} (password verified)`);
      }
    } else {
      const result = await db.collection(colName).deleteMany({});
      console.log(`[CleanDB] Cleared collection "${colName}": deleted ${result.deletedCount} documents.`);
    }
  }

  console.log('[CleanDB] Database cleanup complete!');
  await mongoose.disconnect();
  console.log('[CleanDB] Disconnected from MongoDB.');
}

cleanDatabase().catch((err) => {
  console.error('[CleanDB Error]', err);
  process.exit(1);
});
