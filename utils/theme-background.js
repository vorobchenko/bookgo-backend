import crypto from 'crypto';
import { getSupabasePublicUrl, avatarStoragePathFromUrl } from './avatar.js';
import {
  DEFAULT_THEME_BACKGROUND,
  THEME_BACKGROUND_POSITIONS,
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

function parseHexColor(value, code = 'BACKGROUND_COLOR_INVALID') {
  const color = typeof value === 'string' ? value.trim() : '';
  if (!HEX_COLOR_RE.test(color)) {
    return { ok: false, code };
  }
  return { ok: true, value: color };
}

function parseOverlayFields(background, defaults = DEFAULT_THEME_BACKGROUND) {
  const overlayColorParsed = parseHexColor(
    background.overlay_color ?? defaults.overlay_color,
    'BACKGROUND_COLOR_INVALID'
  );
  if (!overlayColorParsed.ok) {
    return overlayColorParsed;
  }

  const opacityRaw = background.overlay_opacity ?? defaults.overlay_opacity ?? 0;
  const opacity = Number(opacityRaw);
  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) {
    return { ok: false, code: 'BACKGROUND_OVERLAY_OPACITY_INVALID' };
  }

  return {
    ok: true,
    value: {
      overlay_color: overlayColorParsed.value,
      overlay_opacity: opacity
    }
  };
}

function migrateLegacyBackgroundType(type) {
  return type === 'preset' ? 'solid' : type;
}

export function normalizeThemeBackground(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ...DEFAULT_THEME_BACKGROUND };
  }

  const type = migrateLegacyBackgroundType(input.type ?? DEFAULT_THEME_BACKGROUND.type);
  if (!THEME_BACKGROUND_TYPES.includes(type)) {
    return { ...DEFAULT_THEME_BACKGROUND };
  }

  const overlayParsed = parseOverlayFields(input);
  const overlay = overlayParsed.ok
    ? overlayParsed.value
    : {
        overlay_color: DEFAULT_THEME_BACKGROUND.overlay_color,
        overlay_opacity: DEFAULT_THEME_BACKGROUND.overlay_opacity
      };

  if (type === 'solid') {
    const color = input.color ?? input.solid_color ?? DEFAULT_THEME_BACKGROUND.color;
    if (typeof color === 'string' && HEX_COLOR_RE.test(color.trim())) {
      return { type: 'solid', color: color.trim(), ...overlay };
    }
    return { ...DEFAULT_THEME_BACKGROUND };
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
        gradient_angle: angle,
        ...overlay
      };
    }
    return { ...DEFAULT_THEME_BACKGROUND };
  }

  if (type === 'image') {
    const imageUrl = (input.image_url ?? input.imageUrl ?? '').trim();
    const position = THEME_BACKGROUND_POSITIONS.includes(input.position)
      ? input.position
      : 'center';
    if (imageUrl && isAllowedPageBackgroundUrl(imageUrl)) {
      return { type: 'image', image_url: imageUrl, position, ...overlay };
    }
    return { ...DEFAULT_THEME_BACKGROUND };
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

  const type = background.type ?? DEFAULT_THEME_BACKGROUND.type;
  if (type === 'preset') {
    return { ok: false, code: 'BACKGROUND_TYPE_INVALID' };
  }

  if (!THEME_BACKGROUND_TYPES.includes(type)) {
    return { ok: false, code: 'BACKGROUND_TYPE_INVALID' };
  }

  const overlayParsed = parseOverlayFields(background);
  if (!overlayParsed.ok) {
    return overlayParsed;
  }

  if (type === 'solid') {
    const parsed = parseHexColor(background.color);
    if (!parsed.ok) {
      return parsed;
    }
    return {
      ok: true,
      value: { type: 'solid', color: parsed.value, ...overlayParsed.value }
    };
  }

  if (type === 'gradient') {
    const fromParsed = parseHexColor(background.gradient_from ?? background.from);
    const toParsed = parseHexColor(background.gradient_to ?? background.to);
    if (!fromParsed.ok || !toParsed.ok) {
      return { ok: false, code: 'BACKGROUND_GRADIENT_INVALID' };
    }

    const angle = Number(background.gradient_angle ?? background.angle ?? 180);
    if (!Number.isInteger(angle) || angle < 0 || angle > 360) {
      return { ok: false, code: 'BACKGROUND_GRADIENT_INVALID' };
    }

    return {
      ok: true,
      value: {
        type: 'gradient',
        gradient_from: fromParsed.value,
        gradient_to: toParsed.value,
        gradient_angle: angle,
        ...overlayParsed.value
      }
    };
  }

  if (type === 'image') {
    const imageUrl = (background.image_url ?? background.imageUrl ?? '').trim();
    if (!imageUrl || !isAllowedPageBackgroundUrl(imageUrl)) {
      return { ok: false, code: 'BACKGROUND_IMAGE_URL_INVALID' };
    }

    const position = background.position ?? 'center';
    if (!THEME_BACKGROUND_POSITIONS.includes(position)) {
      return { ok: false, code: 'BACKGROUND_POSITION_INVALID' };
    }

    return {
      ok: true,
      value: {
        type: 'image',
        image_url: imageUrl,
        position,
        ...overlayParsed.value
      }
    };
  }

  return { ok: false, code: 'BACKGROUND_TYPE_INVALID' };
}

export function parseThemeBackgroundPatch(background, currentBackground) {
  if (background === undefined) {
    return { ok: false, code: 'BACKGROUND_INVALID' };
  }

  if (!background || typeof background !== 'object' || Array.isArray(background)) {
    return { ok: false, code: 'BACKGROUND_INVALID' };
  }

  const merged = {
    ...normalizeThemeBackground(currentBackground),
    ...background
  };

  return parseThemeBackgroundBody(merged);
}

export function backgroundImageUrlFromTheme(background) {
  const normalized = normalizeThemeBackground(background);
  return normalized.type === 'image' ? normalized.image_url : '';
}
