import crypto from 'crypto';
import { getSupabasePublicUrl, avatarStoragePathFromUrl } from './avatar.js';
import {
  DEFAULT_THEME_BACKGROUND,
  THEME_BACKGROUND_TYPES
} from '../services/page-defaults.js';

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

export function isAllowedPageBackgroundUrl(url) {
  if (!url || typeof url !== 'string') {
    return true;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    const expectedHost = new URL(getSupabasePublicUrl()).host;
    if (parsed.host !== expectedHost) {
      return false;
    }

    const path = avatarStoragePathFromUrl(trimmed);
    return path !== null && /^pages\/[^/]+\/background\//.test(path);
  } catch {
    return false;
  }
}

export function pageBackgroundObjectPath(pageId, extension) {
  const safeExt = extension.replace(/^\./, '').toLowerCase();
  return `pages/${pageId}/background/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${safeExt}`;
}

function parseHexColor(value) {
  const color = typeof value === 'string' ? value.trim() : '';
  if (!HEX_COLOR_RE.test(color)) {
    return { ok: false, code: 'BACKGROUND_COLOR_INVALID' };
  }
  return { ok: true, value: color };
}

export function normalizeThemeBackground(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ...DEFAULT_THEME_BACKGROUND };
  }

  const type = input.type ?? 'preset';
  if (!THEME_BACKGROUND_TYPES.includes(type)) {
    return { ...DEFAULT_THEME_BACKGROUND };
  }

  if (type === 'preset') {
    return { type: 'preset' };
  }

  if (type === 'solid') {
    const color = input.color ?? input.solid_color;
    if (typeof color === 'string' && HEX_COLOR_RE.test(color.trim())) {
      return { type: 'solid', color: color.trim() };
    }
    return { type: 'preset' };
  }

  if (type === 'gradient') {
    const from = input.gradient_from ?? input.from;
    const to = input.gradient_to ?? input.to;
    const angleRaw = input.gradient_angle ?? input.angle ?? 180;
    const angle = Number(angleRaw);

    if (
      typeof from === 'string' &&
      HEX_COLOR_RE.test(from.trim()) &&
      typeof to === 'string' &&
      HEX_COLOR_RE.test(to.trim()) &&
      Number.isInteger(angle) &&
      angle >= 0 &&
      angle <= 360
    ) {
      return {
        type: 'gradient',
        gradient_from: from.trim(),
        gradient_to: to.trim(),
        gradient_angle: angle
      };
    }
    return { type: 'preset' };
  }

  if (type === 'image') {
    const imageUrl = (input.image_url ?? input.imageUrl ?? '').trim();
    if (imageUrl && isAllowedPageBackgroundUrl(imageUrl)) {
      return { type: 'image', image_url: imageUrl };
    }
    return { type: 'preset' };
  }

  return { ...DEFAULT_THEME_BACKGROUND };
}

export function parseThemeBackgroundBody(background) {
  if (background === undefined) {
    return { ok: false, code: 'BACKGROUND_REQUIRED' };
  }

  if (!background || typeof background !== 'object' || Array.isArray(background)) {
    return { ok: false, code: 'BACKGROUND_INVALID' };
  }

  const type = background.type ?? 'preset';
  if (!THEME_BACKGROUND_TYPES.includes(type)) {
    return { ok: false, code: 'BACKGROUND_TYPE_INVALID' };
  }

  if (type === 'preset') {
    return { ok: true, value: { type: 'preset' } };
  }

  if (type === 'solid') {
    const parsed = parseHexColor(background.color);
    if (!parsed.ok) {
      return parsed;
    }
    return { ok: true, value: { type: 'solid', color: parsed.value } };
  }

  if (type === 'gradient') {
    const fromParsed = parseHexColor(background.gradient_from ?? background.from);
    if (!fromParsed.ok) {
      return { ok: false, code: 'BACKGROUND_GRADIENT_FROM_INVALID' };
    }

    const toParsed = parseHexColor(background.gradient_to ?? background.to);
    if (!toParsed.ok) {
      return { ok: false, code: 'BACKGROUND_GRADIENT_TO_INVALID' };
    }

    const angle = Number(background.gradient_angle ?? background.angle ?? 180);
    if (!Number.isInteger(angle) || angle < 0 || angle > 360) {
      return { ok: false, code: 'BACKGROUND_GRADIENT_ANGLE_INVALID' };
    }

    return {
      ok: true,
      value: {
        type: 'gradient',
        gradient_from: fromParsed.value,
        gradient_to: toParsed.value,
        gradient_angle: angle
      }
    };
  }

  if (type === 'image') {
    const imageUrl = (background.image_url ?? background.imageUrl ?? '').trim();
    if (!imageUrl) {
      return { ok: false, code: 'BACKGROUND_IMAGE_URL_REQUIRED' };
    }
    if (!isAllowedPageBackgroundUrl(imageUrl)) {
      return { ok: false, code: 'BACKGROUND_IMAGE_URL_INVALID' };
    }
    return { ok: true, value: { type: 'image', image_url: imageUrl } };
  }

  return { ok: false, code: 'BACKGROUND_TYPE_INVALID' };
}
