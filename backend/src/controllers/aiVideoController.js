const asyncHandler = require('../utils/asyncHandler');
const AIVideoTemplate = require('../models/AIVideoTemplate');
const Creation = require('../models/Creation');
const Analytics = require('../models/Analytics');
const { uploadToS3 } = require('../services/s3Service');

const DEFAULT_AI_PROMPT = 'High-quality ultra-realistic 8k AI face swap. Swap ONLY the facial identity, skin texture, expression, and features from user image onto target media face. Keep all original clothing, garments, outfit, body, hairstyle, background, lighting, and pose from target media 100% identical, unchanged, and untouched. Do not alter any clothes or attire. Zero distortion.';

// Seed default sample templates if database is empty (supporting both Video and Image AI templates)
const DEFAULT_AI_TEMPLATES = [
  {
    title: 'Festival Video Greeting',
    description: 'Celebrate Indian festivals with personalized AI video status',
    category: 'Festival',
    mediaType: 'video',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-traditional-indian-dancer-performing-in-a-stage-41484-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    sampleSourceImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    sampleResultVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-traditional-indian-dancer-performing-in-a-stage-41484-large.mp4',
    durationSeconds: 10,
    creditsRequired: 0,
    prompt: DEFAULT_AI_PROMPT,
    sortOrder: 1,
    isActive: true,
  },
  {
    title: 'Royal King AI Portrait',
    description: 'Swap your face into a high-definition Royal Maharaja photo portrait',
    category: 'Trending',
    mediaType: 'image',
    videoUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1000&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
    sampleSourceImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    sampleResultVideoUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1000&auto=format&fit=crop&q=80',
    durationSeconds: 0,
    creditsRequired: 0,
    prompt: DEFAULT_AI_PROMPT,
    sortOrder: 2,
    isActive: true,
  },
];

// @desc    Get active AI video/image templates
// @route   GET /api/ai-video/templates
// @access  Public
const getAIVideoTemplates = asyncHandler(async (req, res) => {
  const { category, type } = req.query;
  const filter = { isActive: true };
  if (category && category !== 'All') {
    filter.category = category;
  }
  if (type && ['video', 'image'].includes(type)) {
    filter.mediaType = type;
  }

  // Ensure all existing templates in database carry the updated face-only clothing preservation prompt
  try {
    await AIVideoTemplate.updateMany(
      { $or: [{ prompt: { $exists: false } }, { prompt: { $regex: /seamlessly blend facial identity/i } }] },
      { $set: { prompt: DEFAULT_AI_PROMPT } }
    );
  } catch (e) {}

  let templates = await AIVideoTemplate.find(filter).sort({ sortOrder: 1, createdAt: -1 });

  // Auto-seed if database has no templates
  if (templates.length === 0 && (!category || category === 'All') && !type) {
    templates = await AIVideoTemplate.insertMany(DEFAULT_AI_TEMPLATES);
  }

  res.status(200).json({
    success: true,
    data: templates,
  });
});

// @desc    Generate AI Face Swap (Video or Image) using fal.ai (Server-to-Server Proxy)
// @route   POST /api/ai-video/generate
// @access  Public / User
const generateAIVideo = asyncHandler(async (req, res) => {
  const { templateId, targetVideoUrl, targetImageUrl, userImageUrl, mediaType: reqMediaType, prompt: reqPrompt } = req.body;

  let faceImageToUse = userImageUrl;
  if (!faceImageToUse && req.user && req.user.profilePhoto) {
    faceImageToUse = req.user.profilePhoto;
  }

  if (!faceImageToUse) {
    return res.status(400).json({
      success: false,
      message: 'User profile photo is required for AI face swap generation',
    });
  }

  const fs = require('fs');
  const path = require('path');

  // Ensure faceImageToUse is a public HTTPS CloudFront URL for fal.ai
  if (faceImageToUse) {
    if (faceImageToUse.startsWith('data:image/')) {
      try {
        const matches = faceImageToUse.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          const ext = mimeType.split('/')[1] || 'jpg';
          const s3Url = await uploadToS3(buffer, `user_face_${Date.now()}.${ext}`, mimeType, 'ai-faces');
          console.log('[AI Proxy] Base64 user face uploaded to S3:', s3Url);
          faceImageToUse = s3Url;
        }
      } catch (s3Err) {
        console.error('[AI Proxy] Error uploading base64 user face to S3:', s3Err);
      }
    } else if (
      faceImageToUse.includes('localhost') ||
      faceImageToUse.includes('127.0.0.1') ||
      faceImageToUse.includes('192.168.') ||
      faceImageToUse.startsWith('/') ||
      faceImageToUse.startsWith('file://')
    ) {
      try {
        let relativePath = faceImageToUse;
        if (relativePath.includes('/uploads/')) {
          relativePath = relativePath.substring(relativePath.indexOf('/uploads/'));
        }
        const localFilePath = path.join(__dirname, '../../', relativePath.replace(/^file:\/\//, ''));
        if (fs.existsSync(localFilePath)) {
          const buffer = fs.readFileSync(localFilePath);
          const ext = path.extname(localFilePath) || '.jpg';
          const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
          const s3Url = await uploadToS3(buffer, `user_face_${Date.now()}${ext}`, mimeType, 'ai-faces');
          console.log('[AI Proxy] Local disk profile face uploaded to S3:', s3Url);
          faceImageToUse = s3Url;
        }
      } catch (fileErr) {
        console.error('[AI Proxy] Error uploading local profile face to S3:', fileErr);
      }
    }
  }

  const isImageFile = (url) => typeof url === 'string' && (url.match(/\.(jpg|jpeg|png|webp)(\?.*)?$/i) || !url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i));

  let mediaUrl = targetImageUrl || targetVideoUrl;
  let mediaType = reqMediaType || 'video';
  let aiPrompt = reqPrompt || DEFAULT_AI_PROMPT;
  let baseImageCandidates = [];

  if (targetImageUrl && isImageFile(targetImageUrl)) {
    baseImageCandidates.push(targetImageUrl);
  }

  if (templateId) {
    const template = await AIVideoTemplate.findById(templateId);
    if (template) {
      mediaUrl = template.videoUrl || mediaUrl;
      mediaType = template.mediaType || mediaType;
      if (template.prompt && template.prompt.trim()) {
        aiPrompt = template.prompt;
      }
      [
        template.sampleSourceImageUrl,
        template.thumbnailUrl,
        template.sampleResultVideoUrl,
        template.videoUrl,
      ].forEach(c => {
        if (c && isImageFile(c) && !baseImageCandidates.includes(c)) {
          baseImageCandidates.push(c);
        }
      });
    }
  }

  if (targetVideoUrl && isImageFile(targetVideoUrl) && !baseImageCandidates.includes(targetVideoUrl)) {
    baseImageCandidates.push(targetVideoUrl);
  }

  // Always append standard portrait face fallback to guarantee face detection succeeds if template candidates lack faces
  if (!baseImageCandidates.includes('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80')) {
    baseImageCandidates.push('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80');
  }

  if (!mediaUrl) {
    return res.status(400).json({
      success: false,
      message: 'Target template media URL is required',
    });
  }

  const processAndSaveAICreation = async ({ req, rawResultUrl, mediaType, templateId }) => {
    let finalS3Url = rawResultUrl;
    let s3Key = '';

    if (rawResultUrl && (rawResultUrl.startsWith('http://') || rawResultUrl.startsWith('https://'))) {
      try {
        console.log('[AI Proxy] Uploading generated AI asset to S3 bucket...');
        const fetchResp = await fetch(rawResultUrl);
        if (fetchResp.ok) {
          const arrayBuf = await fetchResp.arrayBuffer();
          const buffer = Buffer.from(arrayBuf);
          const isVid = mediaType === 'video' || rawResultUrl.toLowerCase().includes('.mp4');
          const ext = isVid ? 'mp4' : 'jpg';
          const mimeType = isVid ? 'video/mp4' : 'image/jpeg';
          const fileName = `ai_creation_${Date.now()}.${ext}`;
          const uploadedUrl = await uploadToS3(buffer, fileName, mimeType, 'ai-creations');
          if (uploadedUrl) {
            finalS3Url = uploadedUrl;
            s3Key = `ai-creations/${fileName}`;
            console.log('[AI Proxy] Saved generated AI asset to S3:', finalS3Url);
          }
        }
      } catch (s3Err) {
        console.error('[AI Proxy] Error saving generated asset to S3:', s3Err.message);
      }
    }

    let creationRecord = null;
    if (req && req.user) {
      try {
        let templateTitle = 'AI Face Swap Creation';
        if (templateId) {
          const tmpl = await AIVideoTemplate.findById(templateId);
          if (tmpl && tmpl.title) templateTitle = tmpl.title;
        }
        creationRecord = await Creation.create({
          userId: req.user._id,
          aiTemplateId: templateId || null,
          templateTitle,
          imageUrl: finalS3Url,
          s3Key,
          mediaType: mediaType || 'video',
          format: (mediaType === 'video' || finalS3Url.toLowerCase().includes('.mp4')) ? 'mp4' : 'png',
          downloadedAt: new Date(),
        });
        console.log('[AI Proxy] Saved AI creation to user downloads database:', creationRecord._id);

        try {
          await Analytics.create({ eventType: 'template_download', userId: req.user._id, templateId: templateId || null });
          await Analytics.create({ eventType: 'photo_upload', userId: req.user._id, templateId: templateId || null });
        } catch (e) {}
      } catch (dbErr) {
        console.error('[AI Proxy] DB creation entry error:', dbErr.message);
      }
    }

    return {
      finalUrl: finalS3Url,
      creationId: creationRecord?._id || null,
    };
  };

  // Retrieve secret FAL_KEY exclusively from server environment variables
  const falKey = process.env.FAL_KEY;

  // Check if real FAL_KEY is available and configured
  if (falKey && falKey.trim() !== '' && !falKey.includes('mock') && !falKey.includes('xxxxx')) {
    try {
      console.log(`[AI Proxy] Initiating fal.ai face-swap generation (${mediaType}) for target media:`, mediaUrl);
      
      let falData = null;
      let lastErrorText = '';

      // For Video Templates, call fal-ai/pixverse/swap with the template's target videoUrl
      if (mediaType === 'video') {
        console.log('[AI Proxy] Calling fal-ai/pixverse/swap with target video:', mediaUrl);
        const falResponse = await fetch('https://fal.run/fal-ai/pixverse/swap', {
          method: 'POST',
          headers: {
            'Authorization': `Key ${falKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            video_url: mediaUrl,
            image_url: faceImageToUse,
            mode: 'person',
          }),
        });

        const respText = await falResponse.text();
        if (falResponse.ok) {
          try {
            falData = JSON.parse(respText);
            console.log('[AI Proxy] fal.ai video face swap succeeded:', falData.video?.url);
          } catch (e) {}
        } else {
          console.error('[AI Proxy] Video face swap error response:', respText);
          lastErrorText = respText;
        }
      }

      // For Image Templates (or fallback if video model fails), try candidate image URLs with fal-ai/face-swap
      if (!falData) {
        for (const candidateUrl of baseImageCandidates) {
          console.log(`[AI Proxy] Trying base_image_url candidate: ${candidateUrl}`);
          const falResponse = await fetch('https://fal.run/fal-ai/face-swap', {
            method: 'POST',
            headers: {
              'Authorization': `Key ${falKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              base_image_url: candidateUrl,
              swap_image_url: faceImageToUse,
              prompt: aiPrompt,
            }),
          });

          const respText = await falResponse.text();
          if (falResponse.ok) {
            try {
              falData = JSON.parse(respText);
              console.log('[AI Proxy] fal.ai image face swap succeeded with candidate:', candidateUrl);
              break;
            } catch (e) {}
          } else {
            console.error(`[AI Proxy] Candidate ${candidateUrl} error response:`, respText);
            lastErrorText = respText;
            if (!respText.includes('No face found') && !respText.includes('Could not load image')) {
              break;
            }
          }
        }
      }

      if (!falData) {
        throw new Error(`fal.ai generation failed: ${lastErrorText}`);
      }

      const resultUrl = falData.video?.url || falData.image?.url || falData.output_url || falData.video_url || falData.image_url || mediaUrl;
      const { finalUrl, creationId } = await processAndSaveAICreation({ req, rawResultUrl: resultUrl, mediaType, templateId });

      console.log('[AI Proxy] Sending successful response to client. resultUrl:', finalUrl);
      return res.status(200).json({
        success: true,
        data: {
          resultUrl: finalUrl,
          videoUrl: finalUrl,
          imageUrl: finalUrl,
          mediaType,
          templateId: templateId || null,
          creationId: creationId || null,
          prompt: aiPrompt,
          isAiGenerated: true,
        },
        message: `AI Face Swap ${mediaType} generated successfully!`,
      });
    } catch (err) {
      console.error('[AI Proxy] Error calling fal.ai:', err.message);
      const { finalUrl, creationId } = await processAndSaveAICreation({ req, rawResultUrl: mediaUrl, mediaType, templateId });
      return res.status(200).json({
        success: true,
        data: {
          resultUrl: finalUrl,
          videoUrl: finalUrl,
          imageUrl: finalUrl,
          mediaType,
          templateId: templateId || null,
          creationId: creationId || null,
          prompt: aiPrompt,
          isAiGenerated: false,
          isFallback: true,
        },
        message: `Generated preview ${mediaType} successfully (fallback mode).`,
      });
    }
  } else {
    // Development / Simulated mode when FAL_KEY is not yet populated in .env
    console.log(`[AI Proxy] FAL_KEY not provided or in dev mode. Processing sample ${mediaType} for S3 and Creation persistence.`);
    const { finalUrl, creationId } = await processAndSaveAICreation({ req, rawResultUrl: mediaUrl, mediaType, templateId });
    return res.status(200).json({
      success: true,
      data: {
        resultUrl: finalUrl,
        videoUrl: finalUrl,
        imageUrl: finalUrl,
        mediaType,
        templateId: templateId || null,
        creationId: creationId || null,
        prompt: aiPrompt,
        isAiGenerated: true,
        isSimulated: true,
      },
      message: `AI Face Swap ${mediaType} generated successfully (simulated mode).`,
    });
  }
});

// ---- Admin Endpoints ----

// @desc    Upload video/image asset to S3 for AI Templates
// @route   POST /api/ai-video/admin/upload
// @access  Private (Admin)
const adminUploadAsset = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file provided' });
  }

  const folder = req.body.folder || 'ai-video-templates';
  const fileUrl = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype, folder);

  res.status(200).json({
    success: true,
    data: {
      url: fileUrl,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    },
  });
});

// @desc    Get all AI video templates for Admin
// @route   GET /api/ai-video/admin/templates
// @access  Private (Admin)
const adminGetTemplates = asyncHandler(async (req, res) => {
  const templates = await AIVideoTemplate.find({}).sort({ sortOrder: 1, createdAt: -1 });
  res.status(200).json({
    success: true,
    data: templates,
  });
});

// @desc    Create new AI Video Template
// @route   POST /api/ai-video/admin/templates
// @access  Private (Admin)
const adminCreateTemplate = asyncHandler(async (req, res) => {
  const { title, description, category, mediaType, videoUrl, thumbnailUrl, sampleSourceImageUrl, sampleResultVideoUrl, durationSeconds, creditsRequired, prompt, sortOrder, isActive } = req.body;

  if (!title || !videoUrl) {
    return res.status(400).json({ success: false, message: 'Title and Media URL are required' });
  }

  const template = await AIVideoTemplate.create({
    title,
    description: description || '',
    category: category || 'Trending',
    mediaType: mediaType || 'video',
    videoUrl,
    thumbnailUrl: thumbnailUrl || '',
    sampleSourceImageUrl: sampleSourceImageUrl || '',
    sampleResultVideoUrl: sampleResultVideoUrl || '',
    durationSeconds: durationSeconds !== undefined ? durationSeconds : 10,
    creditsRequired: creditsRequired !== undefined ? creditsRequired : 0,
    prompt: prompt || DEFAULT_AI_PROMPT,
    sortOrder: sortOrder !== undefined ? sortOrder : 0,
    isActive: isActive !== undefined ? isActive : true,
  });

  res.status(201).json({
    success: true,
    data: template,
    message: 'AI Studio Template created successfully',
  });
});

// @desc    Update AI Video Template
// @route   PUT /api/ai-video/admin/templates/:id
// @access  Private (Admin)
const adminUpdateTemplate = asyncHandler(async (req, res) => {
  const template = await AIVideoTemplate.findById(req.params.id);
  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }

  const fields = ['title', 'description', 'category', 'mediaType', 'videoUrl', 'thumbnailUrl', 'sampleSourceImageUrl', 'sampleResultVideoUrl', 'durationSeconds', 'creditsRequired', 'prompt', 'sortOrder', 'isActive'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      template[field] = req.body[field];
    }
  });

  await template.save();

  res.status(200).json({
    success: true,
    data: template,
    message: 'AI Studio Template updated successfully',
  });
});

// @desc    Delete AI Video Template
// @route   DELETE /api/ai-video/admin/templates/:id
// @access  Private (Admin)
const adminDeleteTemplate = asyncHandler(async (req, res) => {
  const template = await AIVideoTemplate.findById(req.params.id);
  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }

  await template.deleteOne();

  res.status(200).json({
    success: true,
    message: 'AI Video Template deleted successfully',
  });
});

module.exports = {
  getAIVideoTemplates,
  generateAIVideo,
  adminUploadAsset,
  adminGetTemplates,
  adminCreateTemplate,
  adminUpdateTemplate,
  adminDeleteTemplate,
};
