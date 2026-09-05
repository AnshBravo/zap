import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION || "us-east-1";
const bucketName = process.env.AWS_S3_BUCKET_NAME;

export const allowedMediaTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
]);

export const s3Client = new S3Client({
  region,
});

interface PresignedUrlResponse {
  uploadUrl: string;
  mediaUrl: string;
  mediaKey: string;
}

export const generatePresignedUploadUrl = async (
  userId: string,
  fileType: string,
): Promise<PresignedUrlResponse> => {
  if (!bucketName) {
    throw new Error("AWS_S3_BUCKET_NAME is not configured");
  }

  const normalizedFileType = fileType.toLowerCase();
  const extension = normalizedFileType.split("/")[1];

  const mediaKey = `uploads/${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: mediaKey,
    ContentType: normalizedFileType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  const mediaUrl = getMediaUrl(mediaKey);

  return { uploadUrl, mediaUrl, mediaKey };
};

export const getMediaUrl = (mediaKey: string): string => {
  if (!bucketName) {
    throw new Error("AWS_S3_BUCKET_NAME is not configured");
  }

  return `https://${bucketName}.s3.${region}.amazonaws.com/${mediaKey}`;
};

// Delete a file from S3 when a post is deleted

export const deleteFileFromS3 = async (mediaKey: string): Promise<void> => {
  if (!mediaKey) return;

  if (!bucketName) {
    throw new Error("AWS_S3_BUCKET_NAME is not configured");
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: mediaKey,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error(`Failed to delete S3 object key "${mediaKey}":`, error);
    throw error;
  }
};
