import { DEFAULT_THEME_ATMOSPHERE } from '../services/page-defaults.js';

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

  return {
    grain,
    grain_intensity: grain ? intensity : DEFAULT_THEME_ATMOSPHERE.grain_intensity
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

  return { ok: true, value: patch };
}

export function mergeThemeAtmosphere(current, patch) {
  return normalizeThemeAtmosphere({ ...current, ...patch });
}
