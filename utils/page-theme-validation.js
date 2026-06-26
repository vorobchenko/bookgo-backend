import { jsonField } from './json-field.js';
import { THEME_ELEMENT_STYLES, THEME_MODES } from '../services/page-defaults.js';
import { parseThemeAtmospherePatch } from './theme-atmosphere.js';
import { parseThemeBackgroundPatch } from './theme-background.js';
import { parseThemeCtaPatch } from './theme-cta.js';

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
const FONT_PRESET_MAX = 64;

const THEME_PATCH_KEYS = new Set([
  'accent_color',
  'accentColor',
  'secondary_color',
  'secondaryColor',
  'surface_color',
  'surfaceColor',
  'text_color',
  'textColor',
  'text_muted_color',
  'textMutedColor',
  'mode',
  'font_preset',
  'fontPreset',
  'element_style',
  'elementStyle',
  'cta',
  'atmosphere',
  'background'
]);

function parseHexColor(value, code) {
  const color = typeof value === 'string' ? value.trim() : '';
  if (!HEX_COLOR_RE.test(color)) {
    return { ok: false, code };
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

function hasUnknownThemeKeys(body) {
  return Object.keys(body).some((key) => !THEME_PATCH_KEYS.has(key));
}

export function parseThemePatchBody(body, currentTheme = null) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, code: 'BODY_INVALID' };
  }

  if (hasUnknownThemeKeys(body)) {
    return { ok: false, code: 'BODY_INVALID' };
  }

  const patch = {};
  const colorFields = [
    ['accent_color', 'accentColor', 'ACCENT_COLOR_INVALID'],
    ['secondary_color', 'secondaryColor', 'SECONDARY_COLOR_INVALID'],
    ['surface_color', 'surfaceColor', 'SURFACE_COLOR_INVALID'],
    ['text_color', 'textColor', 'TEXT_COLOR_INVALID'],
    ['text_muted_color', 'textMutedColor', 'TEXT_MUTED_COLOR_INVALID']
  ];

  for (const [key, legacyKey, code] of colorFields) {
    if (
      !Object.prototype.hasOwnProperty.call(body, key) &&
      !(legacyKey && Object.prototype.hasOwnProperty.call(body, legacyKey))
    ) {
      continue;
    }

    const parsed = parseHexColor(jsonField(body, key, legacyKey), code);
    if (!parsed.ok) {
      return parsed;
    }
    patch[key] = parsed.value;
  }

  const enumFields = [
    ['mode', null, 'MODE_INVALID', THEME_MODES],
    ['element_style', 'elementStyle', 'ELEMENT_STYLE_INVALID', THEME_ELEMENT_STYLES]
  ];

  for (const [key, legacyKey, code, allowed] of enumFields) {
    if (
      !Object.prototype.hasOwnProperty.call(body, key) &&
      !(legacyKey && Object.prototype.hasOwnProperty.call(body, legacyKey))
    ) {
      continue;
    }

    const raw = jsonField(body, key, legacyKey);
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

  if (Object.prototype.hasOwnProperty.call(body, 'cta')) {
    const parsedCta = parseThemeCtaPatch(body.cta);
    if (!parsedCta.ok) {
      return parsedCta;
    }
    if (Object.keys(parsedCta.value).length === 0 && Object.keys(body.cta).length > 0) {
      return { ok: false, code: 'CTA_INVALID' };
    }
    patch.cta = parsedCta.value;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'atmosphere')) {
    const parsedAtmosphere = parseThemeAtmospherePatch(body.atmosphere);
    if (!parsedAtmosphere.ok) {
      return parsedAtmosphere;
    }
    if (
      Object.keys(parsedAtmosphere.value).length === 0 &&
      Object.keys(body.atmosphere).length > 0
    ) {
      return { ok: false, code: 'ATMOSPHERE_INVALID' };
    }
    patch.atmosphere = parsedAtmosphere.value;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'background')) {
    const parsedBackground = parseThemeBackgroundPatch(
      body.background,
      currentTheme?.background
    );
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
