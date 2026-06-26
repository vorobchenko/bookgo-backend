import {
  DEFAULT_THEME_ATMOSPHERE,
  THEME_ATMOSPHERE_CARD_STYLES
} from '../services/page-defaults.js';

function parseUnitInterval(value, code) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 1) {
    return { ok: false, code };
  }
  return { ok: true, value: number };
}

export function normalizeThemeAtmosphere(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ...DEFAULT_THEME_ATMOSPHERE };
  }

  const grain = Boolean(input.grain);
  const intensityParsed = parseUnitInterval(
    input.grain_intensity ?? DEFAULT_THEME_ATMOSPHERE.grain_intensity,
    'ATMOSPHERE_GRAIN_INTENSITY_INVALID'
  );
  const intensity = intensityParsed.ok
    ? intensityParsed.value
    : DEFAULT_THEME_ATMOSPHERE.grain_intensity;

  const cardStyle = input.card_style ?? DEFAULT_THEME_ATMOSPHERE.card_style;
  const card_style = THEME_ATMOSPHERE_CARD_STYLES.includes(cardStyle)
    ? cardStyle
    : DEFAULT_THEME_ATMOSPHERE.card_style;

  return {
    grain,
    grain_intensity: grain ? intensity : DEFAULT_THEME_ATMOSPHERE.grain_intensity,
    card_style
  };
}

export function parseThemeAtmospherePatch(atmosphere) {
  if (atmosphere === undefined) {
    return { ok: false, code: 'ATMOSPHERE_INVALID' };
  }

  if (!atmosphere || typeof atmosphere !== 'object' || Array.isArray(atmosphere)) {
    return { ok: false, code: 'ATMOSPHERE_INVALID' };
  }

  const patch = {};

  if (Object.prototype.hasOwnProperty.call(atmosphere, 'grain')) {
    if (typeof atmosphere.grain !== 'boolean') {
      return { ok: false, code: 'ATMOSPHERE_INVALID' };
    }
    patch.grain = atmosphere.grain;
  }

  if (Object.prototype.hasOwnProperty.call(atmosphere, 'grain_intensity')) {
    const parsed = parseUnitInterval(
      atmosphere.grain_intensity,
      'ATMOSPHERE_GRAIN_INTENSITY_INVALID'
    );
    if (!parsed.ok) {
      return parsed;
    }
    patch.grain_intensity = parsed.value;
  }

  if (Object.prototype.hasOwnProperty.call(atmosphere, 'card_style')) {
    if (!THEME_ATMOSPHERE_CARD_STYLES.includes(atmosphere.card_style)) {
      return { ok: false, code: 'ATMOSPHERE_CARD_STYLE_INVALID' };
    }
    patch.card_style = atmosphere.card_style;
  }

  return { ok: true, value: patch };
}

export function mergeThemeAtmosphere(current, patch) {
  return normalizeThemeAtmosphere({ ...current, ...patch });
}
