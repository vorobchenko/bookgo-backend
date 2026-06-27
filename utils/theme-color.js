function hexToRgb(hex) {
  const normalized = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16)
  };
}

function rgbToHex(r, g, b) {
  const clamp = (value) => Math.max(0, Math.min(255, Math.round(value)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`;
}

/** ~90% accent mixed with light/dark partner — mirrors page-renderer secondaryFromAccent */
export function secondaryFromAccent(accent, similarity = 0.9) {
  const rgb = hexToRgb(accent);
  if (!rgb) {
    return accent;
  }

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  const partner = luminance > 0.45 ? { r: 16, g: 16, b: 16 } : { r: 255, g: 255, b: 255 };
  const accentWeight = similarity;
  const partnerWeight = 1 - similarity;

  return rgbToHex(
    rgb.r * accentWeight + partner.r * partnerWeight,
    rgb.g * accentWeight + partner.g * partnerWeight,
    rgb.b * accentWeight + partner.b * partnerWeight
  );
}
