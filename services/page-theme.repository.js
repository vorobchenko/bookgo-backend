import { mapThemeRow } from './page-assembler.js';
import { DEFAULT_THEME } from './page-defaults.js';
import { query, withTransaction } from '../utils/db.js';
import { mergeThemeAtmosphere } from '../utils/theme-atmosphere.js';
import { mergeThemeCta } from '../utils/theme-cta.js';

const THEME_COLUMNS = `
  page_id, accent_color, secondary_color, surface_color, text_color, text_muted_color,
  font_preset, element_style, cta, atmosphere, background
`;

function themeValues(fields) {
  return [
    fields.accent_color,
    fields.secondary_color,
    fields.surface_color,
    fields.text_color,
    fields.text_muted_color,
    fields.font_preset,
    fields.element_style,
    JSON.stringify(fields.cta ?? DEFAULT_THEME.cta),
    JSON.stringify(fields.atmosphere ?? DEFAULT_THEME.atmosphere),
    JSON.stringify(fields.background ?? DEFAULT_THEME.background)
  ];
}

async function touchPage(pageId, client) {
  await client.query(`UPDATE pages SET updated_at = now() WHERE id = $1`, [pageId]);
}

async function loadPageRow(client, pageId) {
  const result = await client.query(`SELECT id FROM pages WHERE id = $1`, [pageId]);
  return result.rows[0] ?? null;
}

async function getThemeRow(client, pageId) {
  const result = await client.query(`SELECT * FROM page_themes WHERE page_id = $1`, [pageId]);
  return result.rows[0] ?? null;
}

function mergeThemeFields(row, patch) {
  const current = mapThemeRow(row);
  return {
    accent_color: patch.accent_color ?? current.accent_color,
    secondary_color: patch.secondary_color ?? current.secondary_color,
    surface_color: patch.surface_color ?? current.surface_color,
    text_color: patch.text_color ?? current.text_color,
    text_muted_color: patch.text_muted_color ?? current.text_muted_color,
    font_preset: patch.font_preset ?? current.font_preset,
    element_style: patch.element_style ?? current.element_style,
    cta: patch.cta !== undefined ? mergeThemeCta(current.cta, patch.cta) : current.cta,
    atmosphere:
      patch.atmosphere !== undefined
        ? mergeThemeAtmosphere(current.atmosphere, patch.atmosphere)
        : current.atmosphere,
    background: patch.background ?? current.background
  };
}

async function saveTheme(client, pageId, fields) {
  await client.query(
    `INSERT INTO page_themes (${THEME_COLUMNS})
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb)
     ON CONFLICT (page_id) DO UPDATE SET
       accent_color = EXCLUDED.accent_color,
       secondary_color = EXCLUDED.secondary_color,
       surface_color = EXCLUDED.surface_color,
       text_color = EXCLUDED.text_color,
       text_muted_color = EXCLUDED.text_muted_color,
       font_preset = EXCLUDED.font_preset,
       element_style = EXCLUDED.element_style,
       cta = EXCLUDED.cta,
       atmosphere = EXCLUDED.atmosphere,
       background = EXCLUDED.background,
       updated_at = now()`,
    [pageId, ...themeValues(fields)]
  );
}

export async function getPageTheme(pageId) {
  const page = await loadPageRow({ query }, pageId);
  if (!page) {
    return null;
  }

  const row = await getThemeRow({ query }, pageId);
  return { theme: mapThemeRow(row) };
}

export async function updatePageTheme(pageId, patch) {
  return withTransaction(async (client) => {
    const page = await loadPageRow(client, pageId);
    if (!page) {
      return null;
    }

    const row = await getThemeRow(client, pageId);
    const merged = mergeThemeFields(row, patch);
    await saveTheme(client, pageId, merged);
    await touchPage(pageId, client);

    const saved = await getThemeRow(client, pageId);
    return { theme: mapThemeRow(saved) };
  });
}

export async function setPageThemeBackground(pageId, background) {
  return updatePageTheme(pageId, { background });
}
