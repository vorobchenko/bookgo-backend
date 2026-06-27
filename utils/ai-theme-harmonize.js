const OVERLAY = { overlay_color: '#000000', overlay_opacity: 0 };

/** Max luminance gap between gradient stops (subtle, not dramatic) */
const MAX_GRADIENT_LUM_DIFF = 0.16;
/** Max RGB distance between stops — allows visible but calm gradients */
const MAX_GRADIENT_COLOR_DIST = 48;
/** Background colors above this chroma get softened (not flattened) */
const MAX_BACKGROUND_CHROMA = 28;

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

function luminance({ r, g, b }) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function colorChroma(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return Infinity;
  }

  const max = Math.max(rgb.r, rgb.g, rgb.b);
  const min = Math.min(rgb.r, rgb.g, rgb.b);
  return max - min;
}

function colorDistance(a, b) {
  const rgbA = hexToRgb(a);
  const rgbB = hexToRgb(b);
  if (!rgbA || !rgbB) {
    return Infinity;
  }

  return Math.sqrt(
    (rgbA.r - rgbB.r) ** 2 + (rgbA.g - rgbB.g) ** 2 + (rgbA.b - rgbB.b) ** 2
  );
}

function mixHex(a, b, weightB) {
  const rgbA = hexToRgb(a);
  const rgbB = hexToRgb(b);
  if (!rgbA || !rgbB) {
    return a;
  }

  const w = Math.max(0, Math.min(1, weightB));
  return rgbToHex(
    rgbA.r * (1 - w) + rgbB.r * w,
    rgbA.g * (1 - w) + rgbB.g * w,
    rgbA.b * (1 - w) + rgbB.b * w
  );
}

function grayAtLuminance(targetLum) {
  const channel = Math.round(Math.max(0, Math.min(255, targetLum * 255)));
  return rgbToHex(channel, channel, channel);
}

function softenBackgroundColor(hex, tone, fallback, accent = null) {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return accent ? tintFromAccent(accent, tone, 'mid') : fallback;
  }

  let lum = luminance(rgb);
  const chroma = colorChroma(hex);

  if (tone === 'dark') {
    lum = Math.max(0.02, Math.min(0.24, lum));
  } else {
    lum = Math.max(0.86, Math.min(0.995, lum));
  }

  const neutral = grayAtLuminance(lum);
  let softened;

  if (chroma <= MAX_BACKGROUND_CHROMA) {
    const mix =
      chroma <= 8 ? 0.62 : chroma <= 16 ? 0.48 : chroma <= 22 ? 0.32 : 0.2;
    softened = mixHex(neutral, hex, mix);
  } else {
    softened = mixHex(neutral, hex, 0.14);
  }

  if (accent && colorChroma(softened) < 8) {
    softened = mixHex(softened, tintFromAccent(accent, tone, 'whisper'), 0.35);
  }

  return softened;
}

function tintFromAccent(accent, tone, strength = 'mid') {
  const accentRgb = hexToRgb(accent);
  if (!accentRgb) {
    return tone === 'dark' ? '#101010' : '#f7f7f5';
  }

  const weights = {
    dark: { whisper: 0.06, mid: 0.1, lift: 0.14 },
    light: { whisper: 0.04, mid: 0.07, lift: 0.1 }
  };
  const w = weights[tone][strength] ?? weights[tone].mid;
  const baseLum = tone === 'dark' ? 0.06 : 0.94;
  const base = grayAtLuminance(baseLum);
  const liftLum = tone === 'dark' ? 0.11 : 0.98;
  const target = strength === 'lift' ? grayAtLuminance(liftLum) : base;

  return mixHex(target, accent, w);
}

function normalizeAngle(angle) {
  const value = Number(angle);
  if (!Number.isFinite(value)) {
    return 180;
  }
  return Math.round(((value % 360) + 360) % 360);
}

function buildSubtleGradient(fromInput, toInput, angle, tone, accent = null) {
  const fallbackFrom =
    accent != null ? tintFromAccent(accent, tone, 'mid') : tone === 'dark' ? '#0c0c0c' : '#f5f5f2';
  const fallbackTo =
    accent != null ? tintFromAccent(accent, tone, 'lift') : tone === 'dark' ? '#181818' : '#fafafa';

  let from = softenBackgroundColor(fromInput, tone, fallbackFrom, accent);
  let to = softenBackgroundColor(toInput, tone, fallbackTo, accent);

  const lumFrom = luminance(hexToRgb(from));
  let lumTo = luminance(hexToRgb(to));
  const lumDiff = Math.abs(lumFrom - lumTo);

  if (lumDiff > MAX_GRADIENT_LUM_DIFF) {
    const targetLum =
      lumTo > lumFrom
        ? Math.min(lumFrom + MAX_GRADIENT_LUM_DIFF, tone === 'dark' ? 0.2 : 0.995)
        : Math.max(lumFrom - MAX_GRADIENT_LUM_DIFF, tone === 'dark' ? 0.03 : 0.88);
    const anchor = grayAtLuminance(targetLum);
    to = mixHex(to, anchor, 0.65);
  }

  const dist = colorDistance(from, to);
  if (dist > MAX_GRADIENT_COLOR_DIST) {
    to = mixHex(from, to, MAX_GRADIENT_COLOR_DIST / dist);
  }

  if (colorDistance(from, to) < 10) {
    to =
      tone === 'dark'
        ? mixHex(from, '#1a1a1a', 0.55)
        : mixHex(from, '#ffffff', 0.45);
  }

  return {
    type: 'gradient',
    gradient_from: from,
    gradient_to: to,
    gradient_angle: normalizeAngle(angle),
    ...OVERLAY
  };
}

export function harmonizePageBackground(background, tone, accent = null) {
  const input = background && typeof background === 'object' ? background : {};

  if (input.type === 'gradient') {
    return buildSubtleGradient(
      input.gradient_from ?? input.color,
      input.gradient_to ?? input.gradient_from,
      input.gradient_angle,
      tone,
      accent
    );
  }

  const fallback = accent
    ? tintFromAccent(accent, tone, 'mid')
    : tone === 'dark'
      ? '#101010'
      : '#f7f7f5';

  return {
    type: 'solid',
    color: softenBackgroundColor(input.color, tone, fallback, accent),
    ...OVERLAY
  };
}

export function harmonizeSurfaceColor(surfaceColor, background, tone, accent = null) {
  const bg =
    background.type === 'solid'
      ? background.color
      : background.gradient_from ?? (tone === 'light' ? '#f7f7f5' : '#101010');

  const bgRgb = hexToRgb(bg);
  const surfaceRgb = hexToRgb(surfaceColor);

  if (!bgRgb) {
    return tone === 'light' ? '#ffffff' : '#1a1a1a';
  }

  if (!surfaceRgb || colorChroma(surfaceColor) > MAX_BACKGROUND_CHROMA + 10) {
    surfaceColor = accent ? mixHex(bg, tintFromAccent(accent, tone, 'whisper'), 0.12) : bg;
    const derived = hexToRgb(surfaceColor);
    if (tone === 'dark' && derived) {
      return rgbToHex(
        Math.min(derived.r + 24, 52),
        Math.min(derived.g + 24, 52),
        Math.min(derived.b + 24, 52)
      );
    }
    return tone === 'light' ? '#ffffff' : '#1e1e1e';
  }

  const bgLum = luminance(bgRgb);
  const surfaceLum = luminance(surfaceRgb);

  if (tone === 'dark') {
    if (surfaceLum <= bgLum || surfaceLum > 0.3) {
      return rgbToHex(
        Math.min(bgRgb.r + 24, 52),
        Math.min(bgRgb.g + 24, 52),
        Math.min(bgRgb.b + 24, 52)
      );
    }
    return surfaceColor;
  }

  if (surfaceLum < 0.9) {
    return '#ffffff';
  }

  return surfaceColor;
}

export function harmonizeAtmosphere(atmosphere, tone) {
  const grain = Boolean(atmosphere?.grain);
  if (!grain) {
    return { grain: false, grain_intensity: 0.12 };
  }

  const intensity = Number(atmosphere.grain_intensity);
  return {
    grain: true,
    grain_intensity:
      Number.isFinite(intensity) && intensity >= 0.05 && intensity <= 0.18
        ? intensity
        : tone === 'dark'
          ? 0.1
          : 0.08
  };
}
