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

/** Neutral gray — no visible hue cast (blocks burgundy/brown page backgrounds) */
function isNeutralColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return false;
  }

  const avg = (rgb.r + rgb.g + rgb.b) / 3;
  const maxDev = Math.max(
    Math.abs(rgb.r - avg),
    Math.abs(rgb.g - avg),
    Math.abs(rgb.b - avg)
  );

  return maxDev <= 10;
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

function clampNeutralDark(hex, fallback = '#101010') {
  if (isNeutralColor(hex) && luminance(hexToRgb(hex)) < 0.22) {
    return hex;
  }
  return fallback;
}

function clampNeutralLight(hex, fallback = '#f7f7f5') {
  if (isNeutralColor(hex) && luminance(hexToRgb(hex)) > 0.88) {
    return hex;
  }
  return fallback;
}

const OVERLAY = { overlay_color: '#000000', overlay_opacity: 0 };

export function harmonizePageBackground(background, tone) {
  const input = background && typeof background === 'object' ? background : {};

  if (tone === 'dark') {
    if (input.type === 'gradient') {
      const from = clampNeutralDark(input.gradient_from, '#0c0c0c');
      const to = clampNeutralDark(input.gradient_to, '#121212');

      if (!isNeutralColor(from) || !isNeutralColor(to) || colorDistance(from, to) > 20) {
        return { type: 'solid', color: '#101010', ...OVERLAY };
      }

      const lumFrom = luminance(hexToRgb(from));
      const lumTo = luminance(hexToRgb(to));
      if (Math.abs(lumFrom - lumTo) > 0.06) {
        return { type: 'solid', color: from, ...OVERLAY };
      }

      return {
        type: 'gradient',
        gradient_from: from,
        gradient_to: to,
        gradient_angle: Number.isInteger(Number(input.gradient_angle))
          ? Number(input.gradient_angle)
          : 180,
        ...OVERLAY
      };
    }

    return {
      type: 'solid',
      color: clampNeutralDark(input.color, '#101010'),
      ...OVERLAY
    };
  }

  if (input.type === 'gradient') {
    const from = clampNeutralLight(input.gradient_from, '#f7f7f5');
    const to = clampNeutralLight(input.gradient_to, '#ffffff');

    if (colorDistance(from, to) > 16) {
      return { type: 'solid', color: '#f7f7f5', ...OVERLAY };
    }

    return {
      type: 'gradient',
      gradient_from: from,
      gradient_to: to,
      gradient_angle: 180,
      ...OVERLAY
    };
  }

  return {
    type: 'solid',
    color: clampNeutralLight(input.color, '#f7f7f5'),
    ...OVERLAY
  };
}

export function harmonizeSurfaceColor(surfaceColor, background, tone) {
  const bg =
    background.type === 'solid'
      ? background.color
      : background.gradient_from ?? (tone === 'light' ? '#f7f7f5' : '#101010');

  const bgRgb = hexToRgb(bg);
  const surfaceRgb = hexToRgb(surfaceColor);

  if (!bgRgb) {
    return tone === 'light' ? '#ffffff' : '#1a1a1a';
  }

  if (!surfaceRgb || !isNeutralColor(surfaceColor)) {
    return tone === 'light' ? '#ffffff' : '#1a1a1a';
  }

  const bgLum = luminance(bgRgb);
  const surfaceLum = luminance(surfaceRgb);

  if (tone === 'dark') {
    if (surfaceLum <= bgLum || surfaceLum > 0.28) {
      return rgbToHex(
        Math.min(bgRgb.r + 18, 42),
        Math.min(bgRgb.g + 18, 42),
        Math.min(bgRgb.b + 18, 42)
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
