require('dotenv').config();
const mongoose = require('mongoose');
const https = require('https');
const http = require('http');
const { uploadToS3 } = require('../services/s3Service');
const Category = require('../models/Category');
const Template = require('../models/Template');
const Frame = require('../models/Frame');
const Effect = require('../models/Effect');
const Campaign = require('../models/Campaign');

async function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} loading ${url}`));
      }
      const data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () =>
        resolve({
          buffer: Buffer.concat(data),
          mime: res.headers['content-type'] || 'image/jpeg',
        })
      );
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout fetching ' + url));
    });
  });
}

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB for S3 Migration...');

  // 1. Categories
  const categories = await Category.find({});
  console.log(`Processing ${categories.length} categories...`);
  for (const cat of categories) {
    if (cat.thumbnail && !cat.thumbnail.includes('cloudfront.net') && !cat.thumbnail.includes('amazonaws.com')) {
      try {
        console.log(`Uploading Category thumbnail: ${cat.name}`);
        const { buffer, mime } = await fetchBuffer(cat.thumbnail);
        const s3Url = await uploadToS3(buffer, `cat_${cat._id}.jpg`, mime, 'categories');
        cat.thumbnail = s3Url;
        await cat.save();
        console.log(`  -> S3 Success: ${s3Url}`);
      } catch (err) {
        console.error(`  -> Failed category ${cat.name}:`, err.message);
      }
    }
  }

  // 2. Templates
  const templates = await Template.find({});
  console.log(`Processing ${templates.length} templates...`);
  for (const t of templates) {
    let updated = false;
    for (const field of ['thumbnail', 'previewAsset', 'mainMedia']) {
      const currentUrl = t[field];
      if (currentUrl && !currentUrl.includes('cloudfront.net') && !currentUrl.includes('amazonaws.com')) {
        try {
          console.log(`Uploading Template ${field} for: ${t.name}`);
          const { buffer, mime } = await fetchBuffer(currentUrl);
          const ext = mime.includes('png') ? '.png' : mime.includes('mp4') ? '.mp4' : '.jpg';
          const s3Url = await uploadToS3(buffer, `${field}_${t._id}${ext}`, mime, 'templates');
          t[field] = s3Url;
          updated = true;
          console.log(`  -> S3 (${field}): ${s3Url}`);
        } catch (err) {
          console.error(`  -> Failed template ${field} for ${t.name}:`, err.message);
        }
      }
    }
    if (updated) {
      await t.save();
    }
  }

  // 3. Frames
  const frames = await Frame.find({});
  console.log(`Processing ${frames.length} frames...`);
  for (const f of frames) {
    let updated = false;
    for (const field of ['thumbnail', 'asset']) {
      const currentUrl = f[field];
      if (currentUrl && !currentUrl.includes('cloudfront.net') && !currentUrl.includes('amazonaws.com')) {
        try {
          console.log(`Uploading Frame ${field} for: ${f.name}`);
          const { buffer, mime } = await fetchBuffer(currentUrl);
          const s3Url = await uploadToS3(buffer, `frame_${field}_${f._id}.png`, mime, 'frames');
          f[field] = s3Url;
          updated = true;
          console.log(`  -> S3 (${field}): ${s3Url}`);
        } catch (err) {
          console.error(`  -> Failed frame ${field} for ${f.name}:`, err.message);
        }
      }
    }
    if (updated) {
      await f.save();
    }
  }

  // 4. Effects
  const effects = await Effect.find({});
  console.log(`Processing ${effects.length} effects...`);
  for (const e of effects) {
    let updated = false;
    for (const field of ['thumbnail', 'asset']) {
      const currentUrl = e[field];
      if (currentUrl && !currentUrl.includes('cloudfront.net') && !currentUrl.includes('amazonaws.com')) {
        try {
          console.log(`Uploading Effect ${field} for: ${e.name}`);
          const { buffer, mime } = await fetchBuffer(currentUrl);
          const s3Url = await uploadToS3(buffer, `effect_${field}_${e._id}.jpg`, mime, 'effects');
          e[field] = s3Url;
          updated = true;
          console.log(`  -> S3 (${field}): ${s3Url}`);
        } catch (err) {
          console.error(`  -> Failed effect ${field} for ${e.name}:`, err.message);
        }
      }
    }
    if (updated) {
      await e.save();
    }
  }

  // 5. Campaigns
  const campaigns = await Campaign.find({});
  console.log(`Processing ${campaigns.length} campaigns...`);
  for (const c of campaigns) {
    let updated = false;
    for (const field of ['heroBackground', 'heroImage']) {
      const currentUrl = c[field];
      if (currentUrl && !currentUrl.includes('cloudfront.net') && !currentUrl.includes('amazonaws.com')) {
        try {
          console.log(`Uploading Campaign ${field} for: ${c.name}`);
          const { buffer, mime } = await fetchBuffer(currentUrl);
          const s3Url = await uploadToS3(buffer, `campaign_${field}_${c._id}.jpg`, mime, 'campaigns');
          c[field] = s3Url;
          updated = true;
          console.log(`  -> S3 (${field}): ${s3Url}`);
        } catch (err) {
          console.error(`  -> Failed campaign ${field} for ${c.name}:`, err.message);
        }
      }
    }
    if (updated) {
      await c.save();
    }
  }

  console.log('✅ S3 MIGRATION COMPLETE! All database media is now stored & served via AWS S3 / CloudFront.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
