/** Whitelist synced with bookgo-app packages/page-renderer/src/lib/font-presets.ts */
export const FONT_PRESET_CATALOG = [
  { id: 'neutral', desc: 'Clean sans-serif — universal, calm' },
  { id: 'sport', desc: 'Bold energetic sans — fitness, coaching, action' },
  { id: 'editorial', desc: 'Classic serif accents — luxury, editorial' },
  { id: 'poppins', desc: 'Modern geometric sans' },
  { id: 'montserrat', desc: 'Professional sleek sans' },
  { id: 'playfair', desc: 'Elegant serif — premium brands' },
  { id: 'nunito', desc: 'Soft friendly rounded sans' },
  { id: 'raleway', desc: 'Stylish sans-serif' },
  { id: 'lato', desc: 'Warm readable sans' },
  { id: 'roboto', desc: 'Versatile familiar sans' },
  { id: 'open-sans', desc: 'Friendly neutral sans' },
  { id: 'oswald', desc: 'Condensed athletic sans' },
  { id: 'inter', desc: 'UI-first clarity' },
  { id: 'dm-sans', desc: 'Low-contrast modern sans' },
  { id: 'work-sans', desc: 'Corporate clean sans' },
  { id: 'rubik', desc: 'Rounded approachable sans' },
  { id: 'merriweather', desc: 'Readable serif — editorial, law, finance' },
  { id: 'outfit', desc: 'Contemporary geometric sans' }
];

export const FONT_PRESET_IDS = FONT_PRESET_CATALOG.map((item) => item.id);

export function isAllowedFontPreset(value) {
  return typeof value === 'string' && FONT_PRESET_IDS.includes(value.trim());
}

export function formatFontPresetGuide() {
  return FONT_PRESET_CATALOG.map((item) => `- ${item.id}: ${item.desc}`).join('\n');
}
