/** Whitelist synced with bookgo-app packages/page-renderer/src/lib/font-presets.ts */
export const FONT_PRESET_IDS = [
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
];

export function isAllowedFontPreset(value) {
  return typeof value === 'string' && FONT_PRESET_IDS.includes(value.trim());
}
