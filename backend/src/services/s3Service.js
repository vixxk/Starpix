const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const isMockS3 = !process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID.includes('mock');

// Resolve bucket from the documented env vars (AWS_S3_BUCKET is the canonical
// one; AWS_S3_BUCKET_NAME is kept for legacy configs).
const getBucketName = () =>
  process.env.AWS_S3_BUCKET ||
  process.env.AWS_S3_BUCKET_NAME ||
  'starpix-media-bucket';

let s3Client = null;
if (!isMockS3) {
  const s3Config = {
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  };
  // Support custom endpoints (S3-compatible providers / region-pinned URLs)
  if (process.env.AWS_S3_ENDPOINT) {
    s3Config.endpoint = process.env.AWS_S3_ENDPOINT;
    s3Config.forcePathStyle = true;
  }
  s3Client = new S3Client(s3Config);
}

// Upload buffer/file to S3 or mock local uploads
const uploadToS3 = async (fileBuffer, fileName, mimeType, folder = 'general') => {
  const fileExtension = path.extname(fileName) || '.png';
  const objectKey = `${folder}/${uuidv4()}${fileExtension}`;

  if (isMockS3) {
    // Save to local uploads directory for development fallback
    const uploadsDir = path.join(__dirname, '../../uploads', folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const filePath = path.join(uploadsDir, path.basename(objectKey));
    fs.writeFileSync(filePath, fileBuffer);
    const host = process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:5000';
    return `${host}/uploads/${folder}/${path.basename(objectKey)}`;
  }

  const bucketName = getBucketName();
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);

  if (process.env.AWS_CLOUDFRONT_URL) {
    return `${process.env.AWS_CLOUDFRONT_URL.replace(/\/$/, '')}/${objectKey}`;
  }
  return `https://${bucketName}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${objectKey}`;
};

// Generate short-lived signed URL for paid downloads
const getSignedDownloadUrl = async (objectKeyOrUrl, expiresInSeconds = 300) => {
  if (isMockS3 || objectKeyOrUrl.startsWith('http')) {
    // Return direct URL or simulated signed URL with token parameter
    const separator = objectKeyOrUrl.includes('?') ? '&' : '?';
    return `${objectKeyOrUrl}${separator}token=starpix_signed_dev_${Date.now()}&expiresIn=${expiresInSeconds}`;
  }

  const bucketName = getBucketName();
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKeyOrUrl,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
};

module.exports = {
  uploadToS3,
  getSignedDownloadUrl,
};
