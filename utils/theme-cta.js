import { DEFAULT_THEME_CTA, THEME_CTA_LABEL_CASES, THEME_CTA_SIZES, THEME_CTA_VARIANTS } from '../services/page-defaults.js';

export function normalizeThemeCta(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ...DEFAULT_THEME_CTA };
  }

  const variant = THEME_CTA_VARIANTS.includes(input.variant)
    ? input.variant
    : DEFAULT_THEME_CTA.variant;
  const size = THEME_CTA_SIZES.includes(input.size) ? input.size : DEFAULT_THEME_CTA.size;
  const label_case = THEME_CTA_LABEL_CASES.includes(input.label_case)
    ? input.label_case
    : DEFAULT_THEME_CTA.label_case;

  return { variant, size, label_case };
}

export function parseThemeCtaPatch(cta) {
  if (cta === undefined) {
    return { ok: false, code: 'CTA_INVALID' };
  }

  if (!cta || typeof cta !== 'object' || Array.isArray(cta)) {
    return { ok: false, code: 'CTA_INVALID' };
  }

  const patch = {};

  if (Object.prototype.hasOwnProperty.call(cta, 'variant')) {
    if (!THEME_CTA_VARIANTS.includes(cta.variant)) {
      return { ok: false, code: 'CTA_VARIANT_INVALID' };
    }
    patch.variant = cta.variant;
  }

  if (Object.prototype.hasOwnProperty.call(cta, 'size')) {
    if (!THEME_CTA_SIZES.includes(cta.size)) {
      return { ok: false, code: 'CTA_SIZE_INVALID' };
    }
    patch.size = cta.size;
  }

  if (Object.prototype.hasOwnProperty.call(cta, 'label_case')) {
    if (!THEME_CTA_LABEL_CASES.includes(cta.label_case)) {
      return { ok: false, code: 'CTA_LABEL_CASE_INVALID' };
    }
    patch.label_case = cta.label_case;
  }

  return { ok: true, value: patch };
}

export function mergeThemeCta(current, patch) {
  return normalizeThemeCta({ ...current, ...patch });
}
