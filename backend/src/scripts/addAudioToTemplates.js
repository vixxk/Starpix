require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const Template = require('../models/Template');
const { uploadToS3 } = require('../services/s3Service');

// Music source tracks
const AUDIO_SOURCES = [
  { path: '/tmp/sample2.mp3', offset: 0 },   // upbeat acoustic melody 1
  { path: '/tmp/sample.mp3', offset: 0 },    // classical strings & piano 1
  { path: '/tmp/sample.mp3', offset: 35 },   // classical strings & piano 2 (devotional/serene feel)
  { path: '/tmp/sample2.mp3', offset: 25 },  // rhythm melody 2
  { path: '/tmp/sample.mp3', offset: 70 },   // gentle ambient melody
  { path: '/tmp/sample.mp3', offset: 110 },  // peaceful morning melody
  { path: '/tmp/sample2.mp3', offset: 50 },  // viral upbeat beat
  { path: '/tmp/sample.mp3', offset: 20 },   // devotional melody
  { path: '/tmp/sample2.mp3', offset: 75 },  // celebration dance beat
  { path: '/tmp/sample2.mp3', offset: 10 },  // trial melodic track
];

function hasAudio(filePath) {
  try {
    const out = execSync(
      `ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      { timeout: 10000 }
    ).toString().trim();
    return Boolean(out && out.length > 0);
  } catch (e) {
    return false;
  }
}

function getDuration(filePath) {
  try {
    const out = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      { timeout: 10000 }
    ).toString().trim();
    const d = parseFloat(out);
    return isNaN(d) ? 10 : d;
  } catch (e) {
    return 10;
  }
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[Audio Script] Connected to MongoDB');

  // Verify audio source files exist
  if (!fs.existsSync('/tmp/sample.mp3') || !fs.existsSync('/tmp/sample2.mp3')) {
    console.log('[Audio Script] Downloading sample audio sources...');
    execSync('curl -sL "https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.mp3" -o /tmp/sample.mp3');
    execSync('curl -sL "https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample2.mp3" -o /tmp/sample2.mp3');
  }

  const templates = await Template.find({ type: 'video' });
  console.log(`[Audio Script] Found ${templates.length} video templates`);

  for (let i = 0; i < templates.length; i++) {
    const t = templates[i];
    console.log(`\n--- Processing [${i + 1}/${templates.length}]: "${t.name}" (${t._id}) ---`);

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'template_audio_'));
    const inputVid = path.join(tempDir, 'input.mp4');
    const outputVid = path.join(tempDir, 'output_with_audio.mp4');

    try {
      console.log(`Downloading original video: ${t.mainMedia}`);
      const res = await fetch(t.mainMedia);
      if (!res.ok) {
        console.error(`Failed to download ${t.mainMedia}: status ${res.status}`);
        continue;
      }
      const arrayBuf = await res.arrayBuffer();
      fs.writeFileSync(inputVid, Buffer.from(arrayBuf));

      if (hasAudio(inputVid)) {
        console.log(`Template "${t.name}" already has audio. Skipping re-encode.`);
        continue;
      }

      const dur = getDuration(inputVid);
      const audioConfig = AUDIO_SOURCES[i % AUDIO_SOURCES.length];
      const fadeStart = Math.max(0, dur - 0.5);

      console.log(`Muxing audio (${path.basename(audioConfig.path)} offset ${audioConfig.offset}s, duration ${dur}s, fade at ${fadeStart}s)...`);

      // Mux audio into video with fade-in and fade-out
      const muxCmd = `ffmpeg -y -i "${inputVid}" -ss ${audioConfig.offset} -i "${audioConfig.path}" -map 0:v:0 -map 1:a:0 -c:v copy -filter:a "afade=t=in:ss=0:d=0.3,afade=t=out:st=${fadeStart}:d=0.5" -c:a aac -b:a 192k -shortest -movflags +faststart "${outputVid}"`;
      execSync(muxCmd, { stdio: 'pipe' });

      if (!fs.existsSync(outputVid) || fs.statSync(outputVid).size === 0) {
        throw new Error('FFmpeg failed to produce output video with audio');
      }

      if (!hasAudio(outputVid)) {
        throw new Error('Produced video still lacks audio stream');
      }

      console.log(`Uploading enhanced video to S3...`);
      const newBuf = fs.readFileSync(outputVid);
      const newUrl = await uploadToS3(newBuf, `template_${Date.now()}.mp4`, 'video/mp4', 'templates');
      console.log(`New S3 URL: ${newUrl}`);

      // Update template in MongoDB
      const oldMedia = t.mainMedia;
      t.mainMedia = newUrl;
      t.previewAsset = newUrl;
      if (t.canvasConfig && (t.canvasConfig.backgroundImage === oldMedia || !t.canvasConfig.backgroundImage || t.canvasConfig.backgroundImage.includes('.mp4'))) {
        t.canvasConfig.backgroundImage = newUrl;
      }
      await t.save();
      console.log(`✓ Template "${t.name}" updated successfully with sound in DB!`);
    } catch (err) {
      console.error(`Error processing template "${t.name}":`, err.message);
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {}
    }
  }

  console.log('\n[Audio Script] All video templates processed successfully!');
  process.exit(0);
}

run().catch((e) => {
  console.error('[Audio Script] Fatal error:', e);
  process.exit(1);
});
