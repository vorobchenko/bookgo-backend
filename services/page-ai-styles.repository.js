import crypto from 'crypto';
import { mapThemeRow } from './page-assembler.js';
import { query, withTransaction } from '../utils/db.js';
import { validateThemeSnapshot } from '../utils/page-theme-validation.js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidStyleId(value) {
  return typeof value === 'string' && UUID_RE.test(value.trim());
}

function themeFromJson(theme) {
  const data = typeof theme === 'string' ? JSON.parse(theme) : theme;
  return mapThemeRow(data);
}

function mapAiStyleRow(row) {
  return {
    style_id: row.id,
    batch_id: row.batch_id,
    tone: row.tone,
    label: row.label,
    description: row.description,
    confidence: row.confidence ?? null,
    is_active: Boolean(row.is_active),
    source_image_url: row.source_image_url,
    created_at: row.created_at?.toISOString?.() ?? row.created_at,
    theme: themeFromJson(row.theme)
  };
}

function mapGeneratedStyleRow(row) {
  const mapped = mapAiStyleRow(row);
  return {
    style_id: mapped.style_id,
    tone: mapped.tone,
    label: mapped.label,
    description: mapped.description,
    confidence: mapped.confidence,
    is_active: mapped.is_active,
    theme: mapped.theme
  };
}

export async function countRecentAiStyleBatches(pageId, hours = 1) {
  const result = await query(
    `SELECT COUNT(DISTINCT batch_id)::int AS count
     FROM page_ai_styles
     WHERE page_id = $1
       AND created_at > now() - ($2::text || ' hours')::interval`,
    [pageId, String(hours)]
  );
  return result.rows[0]?.count ?? 0;
}

export async function insertAiStyleBatch(pageId, { batchId, sourceImageUrl, hint, styles }) {
  return withTransaction(async (client) => {
    const inserted = [];

    for (const style of styles) {
      const result = await client.query(
        `INSERT INTO page_ai_styles (
           page_id, batch_id, tone, label, description, confidence,
           source_image_url, hint, theme, is_active
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, false)
         RETURNING *`,
        [
          pageId,
          batchId,
          style.tone,
          style.label,
          style.description,
          style.confidence ?? null,
          sourceImageUrl,
          hint ?? null,
          JSON.stringify(style.theme)
        ]
      );
      inserted.push(result.rows[0]);
    }

    return {
      batch_id: batchId,
      styles: inserted.map(mapGeneratedStyleRow)
    };
  });
}

export async function listPageAiStyles(pageId) {
  const result = await query(
    `SELECT *
     FROM page_ai_styles
     WHERE page_id = $1
     ORDER BY created_at DESC`,
    [pageId]
  );

  return result.rows.map((row) => {
    const theme = typeof row.theme === 'string' ? JSON.parse(row.theme) : row.theme;
    return mapAiStyleRow({ ...row, theme });
  });
}

export async function getPageAiStyle(pageId, styleId) {
  const result = await query(
    `SELECT *
     FROM page_ai_styles
     WHERE id = $1 AND page_id = $2`,
    [styleId, pageId]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const theme = typeof row.theme === 'string' ? JSON.parse(row.theme) : row.theme;
  return mapAiStyleRow({ ...row, theme });
}

export async function applyPageAiStyle(pageId, styleId) {
  return withTransaction(async (client) => {
    const styleResult = await client.query(
      `SELECT *
       FROM page_ai_styles
       WHERE id = $1 AND page_id = $2
       FOR UPDATE`,
      [styleId, pageId]
    );

    const styleRow = styleResult.rows[0];
    if (!styleRow) {
      return null;
    }

    const rawTheme =
      typeof styleRow.theme === 'string' ? JSON.parse(styleRow.theme) : styleRow.theme;
    const validated = validateThemeSnapshot(rawTheme);
    if (!validated.ok) {
      const error = new Error(validated.code);
      error.code = validated.code;
      throw error;
    }

    const theme = validated.value;

    await client.query(
      `INSERT INTO page_themes (
         page_id, accent_color, secondary_color, surface_color, text_color, text_muted_color,
         font_preset, element_style, cta, atmosphere, background
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb)
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
      [
        pageId,
        theme.accent_color,
        theme.secondary_color,
        theme.surface_color,
        theme.text_color,
        theme.text_muted_color,
        theme.font_preset,
        theme.element_style,
        JSON.stringify(theme.cta),
        JSON.stringify(theme.atmosphere),
        JSON.stringify(theme.background)
      ]
    );

    await client.query(
      `UPDATE page_ai_styles
       SET is_active = false, applied_at = NULL
       WHERE page_id = $1 AND is_active = true`,
      [pageId]
    );

    await client.query(
      `UPDATE page_ai_styles
       SET is_active = true, applied_at = now()
       WHERE id = $1`,
      [styleId]
    );

    await client.query(`UPDATE pages SET updated_at = now() WHERE id = $1`, [pageId]);

    return {
      style_id: styleRow.id,
      theme: mapThemeRow(theme)
    };
  });
}

export async function deletePageAiStyle(pageId, styleId) {
  const result = await query(
    `DELETE FROM page_ai_styles
     WHERE id = $1 AND page_id = $2
     RETURNING id`,
    [styleId, pageId]
  );

  return result.rows[0]?.id ?? null;
}

export function newBatchId() {
  return crypto.randomUUID();
}
