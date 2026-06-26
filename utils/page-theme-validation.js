import { jsonField } from './json-field.js';
import {
  THEME_ELEMENT_STYLES,
  THEME_MODES,
  THEME_PRESETS
} from '../services/page-defaults.js';
import { parseThemeBackgroundBody } from './theme-background.js';

const ACCENT_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
const FONT_PRESET_MAX = 64;

function parseAccentColor(value) {
  const color = typeof value === 'string' ? value.trim() : '';
  if (!ACCENT_COLOR_RE.test(color)) {
    return { ok: false, code: 'ACCENT_COLOR_INVALID' };
  }
  return { ok: true, value: color };
}

function parseFontPreset(value) {
  const preset = typeof value === 'string' ? value.trim() : '';
  if (!preset || preset.length > FONT_PRESET_MAX) {
    return { ok: false, code: 'FONT_PRESET_INVALID' };
  }
  return { ok: true, value: preset };
}

export function parseThemePatchBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, code: 'BODY_INVALID' };
  }

  const patch = {};
  const fields = [
    ['preset', null, 'PRESET_INVALID', THEME_PRESETS],
    ['accent_color', 'accentColor', 'ACCENT_COLOR_INVALID', null],
    ['mode', null, 'MODE_INVALID', THEME_MODES],
    ['element_style', 'elementStyle', 'ELEMENT_STYLE_INVALID', THEME_ELEMENT_STYLES]
  ];

  for (const [key, legacyKey, code, allowed] of fields) {
    if (
      !Object.prototype.hasOwnProperty.call(body, key) &&
      !(legacyKey && Object.prototype.hasOwnProperty.call(body, legacyKey))
    ) {
      continue;
    }

    const raw = jsonField(body, key, legacyKey);

    if (key === 'accent_color') {
      const parsed = parseAccentColor(raw);
      if (!parsed.ok) {
        return parsed;
      }
      patch.accent_color = parsed.value;
      continue;
    }

    if (!allowed.includes(raw)) {
      return { ok: false, code };
    }
    patch[key] = raw;
  }

  if (
    Object.prototype.hasOwnProperty.call(body, 'font_preset') ||
    Object.prototype.hasOwnProperty.call(body, 'fontPreset')
  ) {
    const parsedFontPreset = parseFontPreset(jsonField(body, 'font_preset', 'fontPreset'));
    if (!parsedFontPreset.ok) {
      return parsedFontPreset;
    }
    patch.font_preset = parsedFontPreset.value;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'background')) {
    const parsedBackground = parseThemeBackgroundBody(body.background);
    if (!parsedBackground.ok) {
      return parsedBackground;
    }
    patch.background = parsedBackground.value;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, code: 'BODY_EMPTY' };
  }

  return { ok: true, value: patch };
}
