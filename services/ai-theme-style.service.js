import sharp from 'sharp';
import { DEFAULT_THEME, DEFAULT_THEME_CTA, DEFAULT_THEME_ATMOSPHERE } from './page-defaults.js';
import { isAllowedFontPreset } from '../utils/font-presets.js';
import { secondaryFromAccent } from '../utils/theme-color.js';
import { validateThemeSnapshot } from '../utils/page-theme-validation.js';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-6';
const REQUEST_TIMEOUT_MS = 60_000;

const FONT_PRESET_LIST = [
  'neutral',
  'sport',
  'editorial',
  'poppins',
  'montserrat',
  'playfair',
  'nunito',
  'raleway',
  'lato',
  'roboto',
  'open-sans',
  'oswald',
  'inter',
  'dm-sans',
  'work-sans',
  'rubik',
  'merriweather',
  'outfit'
].join(', ');

function getAnthropicApiKey() {
  return process.env.ANTHROPIC_API_KEY?.trim() ?? '';
}

function getAnthropicModel() {
  return process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
}

function clampConfidence(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return 0.85;
  }
  return Math.max(0, Math.min(1, num));
}

function normalizeHex(value, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }
  const color = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return color;
  }
  return fallback;
}

function normalizeElementStyle(value) {
  if (['rounded', 'sharp', 'pill'].includes(value)) {
    return value;
  }
  return DEFAULT_THEME.element_style;
}

function normalizeCta(value) {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_THEME_CTA };
  }

  return {
    variant: ['solid', 'outline', 'ghost'].includes(value.variant)
      ? value.variant
      : DEFAULT_THEME_CTA.variant,
    size: ['compact', 'default', 'large'].includes(value.size)
      ? value.size
      : DEFAULT_THEME_CTA.size,
    label_case: ['uppercase', 'capitalize', 'none'].includes(value.label_case)
      ? value.label_case
      : DEFAULT_THEME_CTA.label_case
  };
}

function normalizeAtmosphere(value) {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_THEME_ATMOSPHERE };
  }

  const intensity = Number(value.grain_intensity);
  return {
    grain: Boolean(value.grain),
    grain_intensity:
      Number.isFinite(intensity) && intensity >= 0 && intensity <= 1
        ? intensity
        : DEFAULT_THEME_ATMOSPHERE.grain_intensity
  };
}

function normalizeBackground(value, tone) {
  const fallback =
    tone === 'light'
      ? {
          type: 'solid',
          color: '#f5f5f5',
          overlay_color: '#000000',
          overlay_opacity: 0
        }
      : {
          type: 'gradient',
          gradient_from: '#0a0a0a',
          gradient_to: '#141820',
          gradient_angle: 160,
          overlay_color: '#000000',
          overlay_opacity: 0
        };

  if (!value || typeof value !== 'object') {
    return fallback;
  }

  const type = value.type === 'gradient' ? 'gradient' : 'solid';

  if (type === 'gradient') {
    return {
      type: 'gradient',
      gradient_from: normalizeHex(value.gradient_from, fallback.gradient_from),
      gradient_to: normalizeHex(value.gradient_to, fallback.gradient_to),
      gradient_angle: Number.isInteger(Number(value.gradient_angle))
        ? Number(value.gradient_angle)
        : fallback.gradient_angle,
      overlay_color: normalizeHex(value.overlay_color, '#000000'),
      overlay_opacity: 0
    };
  }

  return {
    type: 'solid',
    color: normalizeHex(value.color, fallback.color ?? '#0a0a0a'),
    overlay_color: normalizeHex(value.overlay_color, '#000000'),
    overlay_opacity: 0
  };
}

function buildThemeSnapshot(shared, toneVariant, tone) {
  const accent = normalizeHex(shared.accent_color, DEFAULT_THEME.accent_color);

  const theme = {
    accent_color: accent,
    secondary_color: secondaryFromAccent(accent),
    surface_color: normalizeHex(
      toneVariant.surface_color,
      tone === 'light' ? '#ffffff' : '#161616'
    ),
    text_color: normalizeHex(toneVariant.text_color, tone === 'light' ? '#111111' : '#ffffff'),
    text_muted_color: normalizeHex(
      toneVariant.text_muted_color,
      tone === 'light' ? '#6b7280' : '#8a8a8a'
    ),
    font_preset: isAllowedFontPreset(shared.font_preset) ? shared.font_preset.trim() : 'sport',
    element_style: normalizeElementStyle(shared.element_style),
    cta: normalizeCta(toneVariant.cta),
    atmosphere: normalizeAtmosphere(toneVariant.atmosphere),
    background: normalizeBackground(toneVariant.background, tone)
  };

  const validated = validateThemeSnapshot(theme);
  if (!validated.ok) {
    const error = new Error(validated.code);
    error.code = 'AI_STYLE_FAILED';
    throw error;
  }

  return validated.value;
}

function extractJsonFromText(text) {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end === -1) {
      return null;
    }
    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function buildSystemPrompt() {
  return `You are a brand design assistant for booking pages.
Analyze the uploaded logo and return ONLY valid JSON (no markdown prose) with this shape:
{
  "accent_color": "#RRGGBB",
  "font_preset": "one of: ${FONT_PRESET_LIST}",
  "element_style": "rounded" | "sharp" | "pill",
  "dark": {
    "label": "short title max 80 chars",
    "description": "max 200 chars",
    "confidence": 0.0-1.0,
    "surface_color": "#RRGGBB",
    "text_color": "#RRGGBB",
    "text_muted_color": "#RRGGBB",
    "cta": { "variant": "solid"|"outline"|"ghost", "size": "compact"|"default"|"large", "label_case": "uppercase"|"capitalize"|"none" },
    "atmosphere": { "grain": boolean, "grain_intensity": 0.0-1.0 },
    "background": { "type": "solid"|"gradient", "color": "#RRGGBB", "gradient_from": "#RRGGBB", "gradient_to": "#RRGGBB", "gradient_angle": 0-360 }
  },
  "light": { same fields as dark }
}
Rules:
- accent_color must come from the logo palette.
- dark and light share accent_color, font_preset, element_style; differ in surface/background/text.
- Ensure readable contrast between text and surface for each tone.
- Prefer gradient backgrounds for dark and solid light backgrounds for light tone.
- confidence reflects how well the logo informed the palette.`;
}

export async function prepareVisionImage(file) {
  if (file.mimetype === 'image/svg+xml') {
    const buffer = await sharp(file.buffer, { density: 300 })
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();

    return { buffer, mediaType: 'image/png' };
  }

  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
  if (!allowed.has(file.mimetype)) {
    const error = new Error('INVALID_FILE_TYPE');
    error.code = 'INVALID_FILE_TYPE';
    throw error;
  }

  return { buffer: file.buffer, mediaType: file.mimetype };
}

async function callAnthropicVision({ buffer, mediaType }, hint) {
  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    const error = new Error('ANTHROPIC_API_KEY is not set');
    error.code = 'AI_PROVIDER_UNAVAILABLE';
    throw error;
  }

  const userParts = [
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: mediaType,
        data: buffer.toString('base64')
      }
    },
    {
      type: 'text',
      text: hint?.trim()
        ? `Brand hint from user: ${hint.trim()}\n\nGenerate the JSON theme pair.`
        : 'Generate the JSON theme pair from this logo.'
    }
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: getAnthropicModel(),
        max_tokens: 2048,
        system: buildSystemPrompt(),
        messages: [{ role: 'user', content: userParts }]
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const body = await response.text();
      console.error('Anthropic API error:', response.status, body);
      const error = new Error(`Anthropic HTTP ${response.status}`);
      error.code =
        response.status === 429 ? 'AI_STYLE_RATE_LIMIT' : 'AI_PROVIDER_UNAVAILABLE';
      throw error;
    }

    const payload = await response.json();
    const textBlock = (payload.content ?? []).find((block) => block.type === 'text');
    if (!textBlock?.text) {
      const error = new Error('Empty AI response');
      error.code = 'AI_STYLE_FAILED';
      throw error;
    }

    const parsed = extractJsonFromText(textBlock.text);
    if (!parsed?.dark || !parsed?.light) {
      const error = new Error('Invalid AI JSON');
      error.code = 'AI_STYLE_FAILED';
      throw error;
    }

    return parsed;
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Anthropic request timeout');
      timeoutError.code = 'AI_PROVIDER_UNAVAILABLE';
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateAiThemeStyles(file, hint) {
  const visionImage = await prepareVisionImage(file);
  const aiPayload = await callAnthropicVision(visionImage, hint);

  const styles = [
    {
      tone: 'dark',
      label: String(aiPayload.dark.label ?? 'Night brand').slice(0, 80),
      description: String(aiPayload.dark.description ?? 'Dark theme from your brand').slice(0, 200),
      confidence: clampConfidence(aiPayload.dark.confidence),
      theme: buildThemeSnapshot(aiPayload, aiPayload.dark, 'dark')
    },
    {
      tone: 'light',
      label: String(aiPayload.light.label ?? 'Day brand').slice(0, 80),
      description: String(aiPayload.light.description ?? 'Light theme from your brand').slice(0, 200),
      confidence: clampConfidence(aiPayload.light.confidence),
      theme: buildThemeSnapshot(aiPayload, aiPayload.light, 'light')
    }
  ];

  return styles;
}
