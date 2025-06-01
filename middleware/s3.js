const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Uploads a file to S3 using AWS SDK v3
 * @param {Object} file - The file object with `path` and `filename` (e.g. from Multer)
 */
async function uploadFile(file) {
  const fileStream = fs.createReadStream(file.path);

  const uploadParams = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: file.filename,
    Body: fileStream,
  };

  // Optionally make it public
  if (process.env.S3_MAKE_PUBLIC === 'true') {
    uploadParams.ACL = 'public-read';
  }

  const upload = new Upload({
    client: s3Client,
    params: uploadParams,
  });

  try {
    const result = await upload.done();

    let fileUrl;

    if (process.env.S3_MAKE_PUBLIC === 'true') {
      // Public file URL
      fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.filename}`;
    } else {
      // Generate presigned URL (valid for 1 hour)
      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: file.filename,
      });
      fileUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    }

    return {
      ...result,
      fileUrl,
    };
  } catch (error) {
    console.error('S3 upload failed:', error);
    throw error;
  }
}

const deleteFile = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  });

  try {
    await s3Client.send(command);
    console.log(`Deleted file from S3: ${key}`);
  } catch (err) {
    console.error('S3 delete failed:', err);
    throw err;
  }
};
module.exports = { uploadFile ,s3Client,deleteFile};
