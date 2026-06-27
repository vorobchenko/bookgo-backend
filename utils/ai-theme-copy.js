export const AI_STYLE_LABEL_MIN = 8;
export const AI_STYLE_LABEL_MAX = 48;
export const AI_STYLE_DESCRIPTION_MIN = 50;
export const AI_STYLE_DESCRIPTION_MAX = 140;

function cleanCopy(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/\s+/g, ' ')
    .replace(/^["'`]+|["'`]+$/g, '')
    .trim();
}

function truncateAtWord(text, max) {
  if (text.length <= max) {
    return text;
  }

  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace >= Math.floor(max * 0.55)) {
    return cut.slice(0, lastSpace).trim();
  }

  return cut.trim();
}

function primaryTitlePart(text) {
  const parts = text.split(/\s[—–-]\s/);
  const head = parts[0]?.trim() ?? text;
  return head.length >= AI_STYLE_LABEL_MIN ? head : text;
}

export function normalizeAiStyleLabel(raw, tone) {
  let text = cleanCopy(raw);

  if (!text) {
    return tone === 'dark' ? 'Night brand' : 'Day brand';
  }

  text = primaryTitlePart(text);

  if (text.length > AI_STYLE_LABEL_MAX) {
    text = truncateAtWord(text, AI_STYLE_LABEL_MAX);
  }

  if (text.length < AI_STYLE_LABEL_MIN) {
    const suffix = tone === 'dark' ? ' Dark' : ' Light';
    text = truncateAtWord(`${text}${suffix}`, AI_STYLE_LABEL_MAX);
  }

  if (text.length < AI_STYLE_LABEL_MIN) {
    return tone === 'dark' ? 'Night brand' : 'Day brand';
  }

  return text;
}

export function normalizeAiStyleDescription(raw, tone) {
  let text = cleanCopy(raw);

  if (!text) {
    return tone === 'dark'
      ? 'A dark theme with your brand accent on buttons and highlights.'
      : 'A light theme with your brand accent on buttons and highlights.';
  }

  if (text.length > AI_STYLE_DESCRIPTION_MAX) {
    text = truncateAtWord(text, AI_STYLE_DESCRIPTION_MAX);
    if (!/[.!?]$/.test(text)) {
      text = `${text}.`;
    }
  }

  if (text.length < AI_STYLE_DESCRIPTION_MIN) {
    const pad =
      tone === 'dark'
        ? ' Built for booking pages with calm neutrals and a clear accent.'
        : ' Built for booking pages with a clean light layout and accent highlights.';
    text = truncateAtWord(`${text}${pad}`, AI_STYLE_DESCRIPTION_MAX);
  }

  if (text.length < AI_STYLE_DESCRIPTION_MIN) {
    return tone === 'dark'
      ? 'A dark theme with neutral backgrounds and your brand accent on CTAs.'
      : 'A light theme with soft surfaces and your brand accent on CTAs.';
  }

  return text;
}
