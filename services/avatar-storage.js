import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import {
  avatarObjectPath,
  avatarStoragePathFromUrl,
  buildAvatarPublicUrl,
  extensionForMime
} from '../utils/avatar.js';
import { getS3Client, getStorageBucket } from '../utils/s3-storage.js';

export async function uploadUserAvatar(userId, file) {
  const extension = extensionForMime(file.mimetype);
  if (!extension) {
    const error = new Error('INVALID_FILE_TYPE');
    error.code = 'INVALID_FILE_TYPE';
    throw error;
  }

  const bucket = getStorageBucket();
  const objectPath = avatarObjectPath(userId, extension);
  const client = getS3Client();

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectPath,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'public, max-age=3600'
      })
    );
  } catch (error) {
    const uploadError = new Error(error.message);
    uploadError.code = 'UPLOAD_FAILED';
    throw uploadError;
  }

  return {
    path: objectPath,
    url: buildAvatarPublicUrl(objectPath)
  };
}

export async function deleteAvatarByUrl(url) {
  const objectPath = avatarStoragePathFromUrl(url);
  if (!objectPath) {
    return;
  }

  const bucket = getStorageBucket();
  const client = getS3Client();

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: objectPath
      })
    );
  } catch (error) {
    console.warn('Failed to delete avatar object:', objectPath, error.message);
  }
}
