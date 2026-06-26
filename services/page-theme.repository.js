import { mapThemeRow } from './page-assembler.js';
import { DEFAULT_THEME } from './page-defaults.js';
import { query, withTransaction } from '../utils/db.js';

const THEME_COLUMNS = `
  page_id, accent_color, mode, font_preset, element_style, background
`;

function themeValues(fields) {
  return [
    fields.accent_color,
    fields.mode,
    fields.font_preset,
    fields.element_style,
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
    mode: patch.mode ?? current.mode,
    font_preset: patch.font_preset ?? current.font_preset,
    element_style: patch.element_style ?? current.element_style,
    background: patch.background ?? current.background
  };
}

async function saveTheme(client, pageId, fields) {
  await client.query(
    `INSERT INTO page_themes (${THEME_COLUMNS})
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     ON CONFLICT (page_id) DO UPDATE SET
       accent_color = EXCLUDED.accent_color,
       mode = EXCLUDED.mode,
       font_preset = EXCLUDED.font_preset,
       element_style = EXCLUDED.element_style,
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
