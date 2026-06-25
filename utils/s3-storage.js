import { S3Client } from '@aws-sdk/client-s3';

let client;

export function isS3StorageConfigured() {
  return Boolean(
    process.env.SUPABASE_S3_ENDPOINT?.trim() &&
      process.env.SUPABASE_S3_ACCESS_KEY_ID?.trim() &&
      process.env.SUPABASE_S3_SECRET_ACCESS_KEY?.trim()
  );
}

export function getStorageBucket() {
  return (
    process.env.SUPABASE_STORAGE_BUCKET?.trim() ||
    process.env.SUPABASE_AVATARS_BUCKET?.trim() ||
    'files'
  );
}

export function getS3Client() {
  if (!client) {
    const endpoint = process.env.SUPABASE_S3_ENDPOINT?.trim();
    const accessKeyId = process.env.SUPABASE_S3_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.SUPABASE_S3_SECRET_ACCESS_KEY?.trim();

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error('Supabase S3 storage is not configured');
    }

    client = new S3Client({
      forcePathStyle: true,
      region: process.env.SUPABASE_S3_REGION?.trim() || 'eu-west-1',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
  }

  return client;
}
