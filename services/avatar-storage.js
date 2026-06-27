import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import {
  avatarStoragePathFromUrl,
  buildAvatarPublicUrl,
  extensionForMime,
  pageAvatarObjectPath,
  servicePhotoObjectPath
} from '../utils/avatar.js';
import { pageBackgroundObjectPath } from '../utils/theme-background.js';
import { pageBrandObjectPath } from '../utils/avatar.js';
import { getS3Client, getStorageBucket } from '../utils/s3-storage.js';

const BACKGROUND_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const BRAND_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml'
]);

function extensionForBackgroundMime(mimetype) {
  if (!BACKGROUND_MIME_TYPES.has(mimetype)) {
    return null;
  }
  return extensionForMime(mimetype);
}

function extensionForBrandMime(mimetype) {
  if (!BRAND_MIME_TYPES.has(mimetype)) {
    return null;
  }
  return extensionForMime(mimetype);
}

async function uploadObject(objectPath, file) {
  const bucket = getStorageBucket();
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

export async function uploadPageAvatar(pageId, file) {
  const extension = extensionForMime(file.mimetype);
  if (!extension) {
    const error = new Error('INVALID_FILE_TYPE');
    error.code = 'INVALID_FILE_TYPE';
    throw error;
  }

  return uploadObject(pageAvatarObjectPath(pageId, extension), file);
}

export async function uploadPageBackground(pageId, file) {
  const extension = extensionForBackgroundMime(file.mimetype);
  if (!extension) {
    const error = new Error('INVALID_FILE_TYPE');
    error.code = 'INVALID_FILE_TYPE';
    throw error;
  }

  return uploadObject(pageBackgroundObjectPath(pageId, extension), file);
}

export async function uploadPageBrand(pageId, file) {
  const extension = extensionForBrandMime(file.mimetype);
  if (!extension) {
    const error = new Error('INVALID_FILE_TYPE');
    error.code = 'INVALID_FILE_TYPE';
    throw error;
  }

  return uploadObject(pageBrandObjectPath(pageId, extension), file);
}

export async function uploadServicePhoto(pageId, serviceId, file) {
  const extension = extensionForMime(file.mimetype);
  if (!extension) {
    const error = new Error('INVALID_FILE_TYPE');
    error.code = 'INVALID_FILE_TYPE';
    throw error;
  }

  return uploadObject(servicePhotoObjectPath(pageId, serviceId, extension), file);
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
