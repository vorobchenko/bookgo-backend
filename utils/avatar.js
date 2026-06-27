import crypto from 'crypto';
import { getStorageBucket } from './s3-storage.js';

function resolveSupabaseUrl() {
  const explicit = process.env.SUPABASE_URL?.trim().replace(/\/$/, '');
  if (explicit) {
    return explicit;
  }

  const projectRef = process.env.SUPABASE_PROJECT_REF?.trim();
  if (projectRef) {
    return `https://${projectRef}.supabase.co`;
  }

  const dbUrl = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL ?? '';
  const match = dbUrl.match(/postgres\.([a-z0-9]+)/i);
  if (match) {
    return `https://${match[1]}.supabase.co`;
  }

  return null;
}

export function getAvatarsBucket() {
  return getStorageBucket();
}

export function getSupabasePublicUrl() {
  const url = resolveSupabaseUrl();
  if (!url) {
    throw new Error('SUPABASE_URL or SUPABASE_PROJECT_REF is not set');
  }
  return url;
}

export function buildAvatarPublicUrl(storagePath) {
  const baseUrl = getSupabasePublicUrl();
  const bucket = getAvatarsBucket();
  const encodedPath = storagePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${baseUrl}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

export function avatarStoragePathFromUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const bucket = getAvatarsBucket();
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) {
    return null;
  }

  return decodeURIComponent(url.slice(idx + marker.length));
}

export function isAllowedPageAvatarUrl(url) {
  if (!url || typeof url !== 'string') {
    return true;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    const expectedHost = new URL(getSupabasePublicUrl()).host;
    if (parsed.host !== expectedHost) {
      return false;
    }

    const path = avatarStoragePathFromUrl(trimmed);
    return path !== null && path.startsWith('pages/');
  } catch {
    return false;
  }
}

export function pageAvatarObjectPath(pageId, extension) {
  const safeExt = extension.replace(/^\./, '').toLowerCase();
  return `pages/${pageId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${safeExt}`;
}

export function pageBrandObjectPath(pageId, extension) {
  const safeExt = extension.replace(/^\./, '').toLowerCase();
  return `pages/${pageId}/brand/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${safeExt}`;
}

export function servicePhotoObjectPath(pageId, serviceId, extension) {
  const safeExt = extension.replace(/^\./, '').toLowerCase();
  return `pages/${pageId}/services/${serviceId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${safeExt}`;
}

export function isAllowedServicePhotoUrl(url) {
  if (!url || typeof url !== 'string') {
    return true;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    const expectedHost = new URL(getSupabasePublicUrl()).host;
    if (parsed.host !== expectedHost) {
      return false;
    }

    const path = avatarStoragePathFromUrl(trimmed);
    return path !== null && /^pages\/[^/]+\/services\/[^/]+\//.test(path);
  } catch {
    return false;
  }
}

export function extensionForMime(mimeType) {
  switch (mimeType) {
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    case 'image/svg+xml':
      return 'svg';
    default:
      return null;
  }
}
