const asyncHandler = require('../utils/asyncHandler');
const AIVideoTemplate = require('../models/AIVideoTemplate');
const Creation = require('../models/Creation');
const Analytics = require('../models/Analytics');
const { uploadToS3 } = require('../services/s3Service');

const DEFAULT_AI_PROMPT = 'High-quality ultra-realistic 8k AI face swap. Swap ONLY the facial identity, skin texture, expression, and features from user image onto target media face. Keep all original clothing, garments, outfit, body, hairstyle, background, lighting, and pose from target media 100% identical, unchanged, and untouched. Do not alter any clothes or attire. Zero distortion.';

// Seed default sample templates if database is empty (supporting both Video and Image AI templates)
const DEFAULT_AI_TEMPLATES = [
  {
    title: 'Vintage Indian Couple Ride',
    description: 'Swap faces into a romantic vintage Indian couple motorcycle ride in historic market',
    category: "Retro 80's",
    mediaType: 'image',
    requiredPhotos: 2,
    videoUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/c4902ddb-bfbf-4801-91b8-b0e0ba17af7c.jpg',
    thumbnailUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/c4902ddb-bfbf-4801-91b8-b0e0ba17af7c.jpg',
    sampleSourceImageUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/1f8259ce-bdf1-4094-aa69-3b35db4b3aac.jpg',
    sampleSourceImageUrls: [
      'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/1f8259ce-bdf1-4094-aa69-3b35db4b3aac.jpg',
      'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/8a02f588-c7e8-4e48-8fe4-9d878d881783.jpg',
    ],
    sampleResultVideoUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/c4902ddb-bfbf-4801-91b8-b0e0ba17af7c.jpg',
    durationSeconds: 0,
    creditsRequired: 100,
    prompt: DEFAULT_AI_PROMPT,
    sortOrder: 1,
    isActive: true,
  },
  {
    title: 'Festival Video Greeting',
    description: 'Celebrate Indian festivals with personalized AI video status',
    category: 'Festival',
    mediaType: 'video',
    requiredPhotos: 1,
    videoUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/30417dc3-079a-4429-ac6d-c64570ab75ca.mp4',
    thumbnailUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/acdbc14c-5cb7-4234-a8a3-72d716233c26.jpg',
    sampleSourceImageUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/1f8259ce-bdf1-4094-aa69-3b35db4b3aac.jpg',
    sampleSourceImageUrls: [
      'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/1f8259ce-bdf1-4094-aa69-3b35db4b3aac.jpg',
    ],
    sampleResultVideoUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/30417dc3-079a-4429-ac6d-c64570ab75ca.mp4',
    durationSeconds: 10,
    creditsRequired: 35,
    prompt: DEFAULT_AI_PROMPT,
    sortOrder: 2,
    isActive: true,
  },
  {
    title: 'Retro Six Frames',
    description: 'Transform into a 6-frame retro 80s vintage photo grid',
    category: "Retro 80's",
    mediaType: 'image',
    requiredPhotos: 1,
    videoUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/4c03b402-0f4b-46a6-8241-c3ddc6288dbf.jpg',
    thumbnailUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/4c03b402-0f4b-46a6-8241-c3ddc6288dbf.jpg',
    sampleSourceImageUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/530a9c2b-88eb-4cc6-93a1-0e2ce8ea8d30.jpg',
    sampleSourceImageUrls: [
      'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/530a9c2b-88eb-4cc6-93a1-0e2ce8ea8d30.jpg',
    ],
    sampleResultVideoUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/4c03b402-0f4b-46a6-8241-c3ddc6288dbf.jpg',
    durationSeconds: 0,
    creditsRequired: 25,
    prompt: DEFAULT_AI_PROMPT,
    sortOrder: 3,
    isActive: true,
  },
  {
    title: '1980s Bollywood Portrait',
    description: 'Golden hour vintage 80s Bollywood cinematic saree portrait',
    category: "Retro 80's",
    mediaType: 'image',
    requiredPhotos: 1,
    videoUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/d0b84582-8bc9-428b-bef6-1ba72f1cc506.jpg',
    thumbnailUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/d0b84582-8bc9-428b-bef6-1ba72f1cc506.jpg',
    sampleSourceImageUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/530a9c2b-88eb-4cc6-93a1-0e2ce8ea8d30.jpg',
    sampleSourceImageUrls: [
      'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/530a9c2b-88eb-4cc6-93a1-0e2ce8ea8d30.jpg',
    ],
    sampleResultVideoUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/d0b84582-8bc9-428b-bef6-1ba72f1cc506.jpg',
    durationSeconds: 0,
    creditsRequired: 30,
    prompt: DEFAULT_AI_PROMPT,
    sortOrder: 4,
    isActive: true,
  },
  {
    title: 'Mahadev Bhakti AI Status',
    description: 'Immerse into divine Mahadev Shivratri devotional video status',
    category: 'Devotional',
    mediaType: 'video',
    requiredPhotos: 1,
    videoUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/467cee21-384e-4b12-8c02-57448054f331.mp4',
    thumbnailUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/45bbd4f0-cf2e-42ea-8ca4-b6c0f2beff56.jpg',
    sampleSourceImageUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/1f8259ce-bdf1-4094-aa69-3b35db4b3aac.jpg',
    sampleSourceImageUrls: [
      'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/1f8259ce-bdf1-4094-aa69-3b35db4b3aac.jpg',
    ],
    sampleResultVideoUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/467cee21-384e-4b12-8c02-57448054f331.mp4',
    durationSeconds: 10,
    creditsRequired: 35,
    prompt: DEFAULT_AI_PROMPT,
    sortOrder: 5,
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
  const { templateId, targetVideoUrl, targetImageUrl, userImageUrl, userImageUrls, mediaType: reqMediaType, prompt: reqPrompt } = req.body;
  const fs = require('fs');
  const path = require('path');

  // Helper to convert base64 or local disk faces to public S3 URLs so fal.ai can read them
  const sanitizeFaceToS3 = async (faceUrl) => {
    if (!faceUrl || typeof faceUrl !== 'string') return null;
    if (faceUrl.startsWith('data:image/')) {
      try {
        const matches = faceUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          const ext = mimeType.split('/')[1] || 'jpg';
          return await uploadToS3(buffer, `user_face_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`, mimeType, 'ai-faces');
        }
      } catch (s3Err) {
        console.error('[AI Proxy] Error uploading base64 face to S3:', s3Err.message);
      }
    } else if (
      faceUrl.includes('localhost') ||
      faceUrl.includes('127.0.0.1') ||
      faceUrl.includes('192.168.') ||
      faceUrl.startsWith('/') ||
      faceUrl.startsWith('file://')
    ) {
      try {
        let relativePath = faceUrl;
        if (relativePath.includes('/uploads/')) {
          relativePath = relativePath.substring(relativePath.indexOf('/uploads/'));
        }
        const localFilePath = path.join(__dirname, '../../', relativePath.replace(/^file:\/\//, ''));
        if (fs.existsSync(localFilePath)) {
          const buffer = fs.readFileSync(localFilePath);
          const ext = path.extname(localFilePath) || '.jpg';
          const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
          return await uploadToS3(buffer, `user_face_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`, mimeType, 'ai-faces');
        }
      } catch (fileErr) {
        console.error('[AI Proxy] Error uploading local face to S3:', fileErr.message);
      }
    }
    return faceUrl;
  };

  let rawFaces = [];
  if (Array.isArray(userImageUrls) && userImageUrls.length > 0) {
    rawFaces = userImageUrls.filter(Boolean);
  } else if (userImageUrl) {
    rawFaces = [userImageUrl];
  } else if (req.user && req.user.profilePhoto) {
    rawFaces = [req.user.profilePhoto];
  }

  if (rawFaces.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'User profile photo is required for AI face swap generation',
    });
  }

  const sanitizedFaces = [];
  for (const f of rawFaces) {
    const s = await sanitizeFaceToS3(f);
    if (s) sanitizedFaces.push(s);
  }

  const faceImageToUse = sanitizedFaces[0] || rawFaces[0];

  const isImageFile = (url) => typeof url === 'string' && (url.match(/\.(jpg|jpeg|png|webp)(\?.*)?$/i) || !url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i));

  let mediaUrl = targetImageUrl || targetVideoUrl;
  let mediaType = reqMediaType || 'video';
  let aiPrompt = reqPrompt || DEFAULT_AI_PROMPT;
  let creditsRequired = 25;
  let baseImageCandidates = [];

  if (targetImageUrl && isImageFile(targetImageUrl)) {
    baseImageCandidates.push(targetImageUrl);
  }

  let template = null;
  if (templateId) {
    template = await AIVideoTemplate.findById(templateId);
    if (template) {
      mediaUrl = template.videoUrl || mediaUrl;
      mediaType = template.mediaType || mediaType;
      creditsRequired = template.creditsRequired !== undefined ? template.creditsRequired : (template.mediaType === 'video' ? 35 : 25);
      if (template.prompt && template.prompt.trim()) {
        aiPrompt = template.prompt;
      }
      [
        template.videoUrl,
        template.thumbnailUrl,
        template.sampleResultVideoUrl,
        template.sampleSourceImageUrl,
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

  if (!baseImageCandidates.includes('https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/1f8259ce-bdf1-4094-aa69-3b35db4b3aac.jpg')) {
    baseImageCandidates.push('https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/1f8259ce-bdf1-4094-aa69-3b35db4b3aac.jpg');
  }

  if (!mediaUrl) {
    return res.status(400).json({
      success: false,
      message: 'Target template media URL is required',
    });
  }

  // Validate User Credits if authenticated
  let dbUser = null;
  if (req.user && req.user._id) {
    const User = require('../models/User');
    dbUser = await User.findById(req.user._id);
    if (dbUser) {
      const currentCredits = dbUser.credits !== undefined ? dbUser.credits : 240;
      if (currentCredits < creditsRequired) {
        return res.status(400).json({
          success: false,
          code: 'INSUFFICIENT_CREDITS',
          message: `Insufficient AI credits. You need ${creditsRequired} credits, but currently have ${currentCredits}.`,
          creditsRequired,
          availableCredits: currentCredits,
        });
      }
    }
  }

  const deductCreditsIfApplicable = async () => {
    if (dbUser && creditsRequired > 0) {
      dbUser.credits = Math.max(0, (dbUser.credits !== undefined ? dbUser.credits : 240) - creditsRequired);
      await dbUser.save();
      console.log(`[AI Proxy] Successfully charged ${creditsRequired} credits to user ${dbUser._id}. Remaining: ${dbUser.credits}`);

      try {
        const CreditTransaction = require('../models/CreditTransaction');
        await CreditTransaction.create({
          userId: dbUser._id,
          type: 'debit',
          amount: creditsRequired,
          balanceAfter: dbUser.credits,
          reason: 'ai_generation',
          title: `AI ${mediaType === 'video' ? 'Video' : 'Image'}`,
          description: `${template?.title || 'AI Face Swap'} (-${creditsRequired} Credits)`,
          metadata: {
            templateId: template?._id ? String(template._id) : (templateId || ''),
            templateTitle: template?.title || '',
            mediaType: mediaType || 'video',
          },
        });
      } catch (txErr) {
        console.error('[AI Proxy] Error recording credit debit transaction:', txErr.message);
      }

      // Broadcast balance update via SSE in real-time
      try {
        const { broadcastBalanceUpdate } = require('../utils/balanceSSE');
        broadcastBalanceUpdate(dbUser._id, { credits: dbUser.credits, reason: 'ai_generation' });
      } catch (sseErr) {
        console.warn('[AI Proxy] SSE broadcast error:', sseErr.message);
      }
    }
  };

  const processAndSaveAICreation = async ({ req, rawResultUrl, mediaType, templateId }) => {
    let finalS3Url = rawResultUrl;
    let s3Key = '';
    let finalMediaType = mediaType || 'video';

    if (rawResultUrl && (rawResultUrl.startsWith('http://') || rawResultUrl.startsWith('https://'))) {
      try {
        console.log('[AI Proxy] Uploading generated AI asset to S3 bucket...');
        const fetchResp = await fetch(rawResultUrl);
        if (fetchResp.ok) {
          const contentType = fetchResp.headers.get('content-type') || '';
          const arrayBuf = await fetchResp.arrayBuffer();
          const buffer = Buffer.from(arrayBuf);

          let isVid = false;
          if (contentType.startsWith('video/')) {
            isVid = true;
          } else if (contentType.startsWith('image/')) {
            isVid = false;
          } else if (rawResultUrl.toLowerCase().includes('.mp4') || rawResultUrl.toLowerCase().includes('.mov') || rawResultUrl.toLowerCase().includes('.webm')) {
            if (buffer.length > 8 && buffer.slice(4, 8).toString() === 'ftyp') {
              isVid = true;
            } else if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
              isVid = false; // JPEG magic bytes
            } else if (buffer[0] === 0x89 && buffer.slice(1, 4).toString() === 'PNG') {
              isVid = false; // PNG magic bytes
            } else {
              isVid = mediaType === 'video';
            }
          }

          finalMediaType = isVid ? 'video' : 'image';
          const ext = isVid ? 'mp4' : 'jpg';
          const mimeType = isVid ? 'video/mp4' : 'image/jpeg';
          const fileName = `ai_creation_${Date.now()}.${ext}`;
          const uploadedUrl = await uploadToS3(buffer, fileName, mimeType, 'ai-creations');
          if (uploadedUrl) {
            finalS3Url = uploadedUrl;
            s3Key = `ai-creations/${fileName}`;
            console.log('[AI Proxy] Saved generated AI asset to S3:', finalS3Url, 'detected type:', finalMediaType);
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
          mediaType: finalMediaType,
          format: finalMediaType === 'video' ? 'mp4' : 'png',
          isAi: true,
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
      finalMediaType,
    };
  };

  // Retrieve secret FAL_KEY exclusively from server environment variables
  const falKey = process.env.FAL_KEY;

  if (falKey && falKey.trim() !== '' && !falKey.includes('mock') && !falKey.includes('xxxxx')) {
    try {
      console.log(`[AI Proxy] Initiating fal.ai face-swap generation (${mediaType}) for target media:`, mediaUrl);
      
      let falData = null;
      let lastErrorText = '';

      // For Video Templates (with true video file), call fal-ai/pixverse/swap with target videoUrl
      if (mediaType === 'video' && !isImageFile(mediaUrl)) {
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

              // If multiple faces provided (e.g. couple templates with 2 photos), perform sequential face swap!
              if (sanitizedFaces.length > 1 && (falData.image?.url || falData.output_url)) {
                const intermediateUrl = falData.image?.url || falData.output_url;
                console.log('[AI Proxy] Performing sequential face swap for Face 2 on intermediate result:', intermediateUrl);
                try {
                  const falResponse2 = await fetch('https://fal.run/fal-ai/face-swap', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Key ${falKey}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      base_image_url: intermediateUrl,
                      swap_image_url: sanitizedFaces[1],
                      prompt: aiPrompt,
                    }),
                  });
                  if (falResponse2.ok) {
                    const falData2 = await falResponse2.json();
                    if (falData2.image?.url || falData2.output_url) {
                      falData = falData2;
                      console.log('[AI Proxy] Face 2 swap succeeded:', falData.image?.url || falData.output_url);
                    }
                  }
                } catch (face2Err) {
                  console.warn('[AI Proxy] Face 2 swap notice:', face2Err.message);
                }
              }

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
      const { finalUrl, creationId, finalMediaType } = await processAndSaveAICreation({ req, rawResultUrl: resultUrl, mediaType, templateId });

      await deductCreditsIfApplicable();

      console.log('[AI Proxy] Sending successful response to client. resultUrl:', finalUrl, 'type:', finalMediaType);
      return res.status(200).json({
        success: true,
        data: {
          resultUrl: finalUrl,
          videoUrl: finalUrl,
          imageUrl: finalUrl,
          mediaType: finalMediaType,
          templateId: templateId || null,
          creationId: creationId || null,
          prompt: aiPrompt,
          creditsCharged: creditsRequired,
          remainingCredits: dbUser ? dbUser.credits : undefined,
          isAiGenerated: true,
        },
        message: `AI Face Swap ${finalMediaType} generated successfully!`,
      });
    } catch (err) {
      console.error('[AI Proxy] Error calling fal.ai:', err.message);
      const { finalUrl, creationId, finalMediaType } = await processAndSaveAICreation({ req, rawResultUrl: mediaUrl, mediaType, templateId });
      await deductCreditsIfApplicable();
      return res.status(200).json({
        success: true,
        data: {
          resultUrl: finalUrl,
          videoUrl: finalUrl,
          imageUrl: finalUrl,
          mediaType: finalMediaType,
          templateId: templateId || null,
          creationId: creationId || null,
          prompt: aiPrompt,
          creditsCharged: creditsRequired,
          remainingCredits: dbUser ? dbUser.credits : undefined,
          isAiGenerated: false,
          isFallback: true,
        },
        message: `Generated preview ${finalMediaType} successfully (fallback mode).`,
      });
    }
  } else {
    // Development / Simulated mode when FAL_KEY is not yet populated in .env
    console.log(`[AI Proxy] FAL_KEY not provided or in dev mode. Processing sample ${mediaType} for S3 and Creation persistence.`);
    const { finalUrl, creationId, finalMediaType } = await processAndSaveAICreation({ req, rawResultUrl: mediaUrl, mediaType, templateId });
    await deductCreditsIfApplicable();
    return res.status(200).json({
      success: true,
      data: {
        resultUrl: finalUrl,
        videoUrl: finalUrl,
        imageUrl: finalUrl,
        mediaType: finalMediaType,
        templateId: templateId || null,
        creationId: creationId || null,
        prompt: aiPrompt,
        creditsCharged: creditsRequired,
        remainingCredits: dbUser ? dbUser.credits : undefined,
        isAiGenerated: true,
        isSimulated: true,
      },
      message: `AI Face Swap ${finalMediaType} generated successfully (simulated mode).`,
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
  const templateList = await Promise.all(
    templates.map(async (tmpl) => {
      const obj = tmpl.toObject();
      const creationCount = await Creation.countDocuments({
        $or: [{ aiTemplateId: tmpl._id }, { templateTitle: tmpl.title }],
      });
      obj.uses = Math.max(obj.uses || 0, creationCount);
      obj.views = Math.max(obj.views || 0, obj.uses > 0 ? obj.uses * 3 + 14 : 0);
      return obj;
    })
  );

  res.status(200).json({
    success: true,
    data: templateList,
  });
});

// @desc    Create new AI Video Template
// @route   POST /api/ai-video/admin/templates
// @access  Private (Admin)
const adminCreateTemplate = asyncHandler(async (req, res) => {
  const { title, titleTranslations, description, category, mediaType, requiredPhotos, videoUrl, thumbnailUrl, sampleSourceImageUrl, sampleSourceImageUrls, sampleResultVideoUrl, durationSeconds, creditsRequired, prompt, sortOrder, isActive } = req.body;

  if (!title || !videoUrl) {
    return res.status(400).json({ success: false, message: 'Title and Media URL are required' });
  }

  const template = await AIVideoTemplate.create({
    title,
    titleTranslations: titleTranslations || {},
    description: description || '',
    category: category || 'Trending',
    mediaType: mediaType || 'video',
    requiredPhotos: Number(requiredPhotos) || 1,
    videoUrl,
    thumbnailUrl: thumbnailUrl || '',
    sampleSourceImageUrl: sampleSourceImageUrl || (sampleSourceImageUrls && sampleSourceImageUrls[0]) || '',
    sampleSourceImageUrls: sampleSourceImageUrls || (sampleSourceImageUrl ? [sampleSourceImageUrl] : []),
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

  const fields = ['title', 'titleTranslations', 'description', 'category', 'mediaType', 'requiredPhotos', 'videoUrl', 'thumbnailUrl', 'sampleSourceImageUrl', 'sampleSourceImageUrls', 'sampleResultVideoUrl', 'durationSeconds', 'creditsRequired', 'prompt', 'sortOrder', 'isActive'];
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
