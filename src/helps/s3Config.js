


const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
require("dotenv").config();

const s3ClientConfig = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESSKEY,
    secretAccessKey: process.env.S3_SECRET_ACCESSKEY
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

const uploadFileToS3 = async (dirname, file) => {
  try {
    const fileKey = `${dirname}/${Date.now()}-${file.originalname}`;

    // Upload to S3
    await s3ClientConfig.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype
      })
    );

    // Generate pre-signed URL
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey
    });
    // const signedUrl = await getSignedUrl(s3ClientConfig, command, { expiresIn: 3600 }); // 1 hour expiration

    // console.log(`Uploaded ${dirname} URL:`, signedUrl); // Debug log
    return fileKey; // Return the pre-signed URL
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw new Error("Failed to upload file to S3");
  }
};

const getObjectURL = async (file) => {
  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: file });
  const signedUrl = await getSignedUrl(s3ClientConfig, command, { expiresIn: 3600 });
  // console.log("Generated Object URL:", signedUrl); // Debug log
  return signedUrl;
};

module.exports = { uploadFileToS3, getObjectURL };