import crypto from 'crypto';
import { query, withTransaction } from '../utils/db.js';
import { coerceUuid } from '../utils/slug.js';
import {
  DEFAULT_AVAILABILITY_SCALARS,
  DEFAULT_SECTION_LAYOUT,
  DEFAULT_STARTER_SERVICE,
  DEFAULT_THEME,
  defaultAvailabilityDaysStored,
  profileFromUser
} from './page-defaults.js';

export async function listPagesByUser(userId) {
  const result = await query(
    `SELECT
       p.id,
       p.slug,
       p.published,
       p.published_at,
       p.is_default,
       p.settings_version,
       p.created_at,
       p.updated_at,
       pp.name AS profile_name,
       pp.role AS profile_role,
       pp.avatar_url AS profile_avatar_url
     FROM pages p
     LEFT JOIN page_profiles pp ON pp.page_id = p.id
     WHERE p.user_id = $1
     ORDER BY p.is_default DESC, p.created_at ASC`,
    [userId]
  );
  return result.rows;
}

export async function getPageOwnedByUser(pageId, userId) {
  const result = await query(
    `SELECT *
     FROM pages
     WHERE id = $1 AND user_id = $2`,
    [pageId, userId]
  );
  return result.rows[0] ?? null;
}

export async function getPublishedPageBySlug(slug) {
  const result = await query(
    `SELECT *
     FROM pages
     WHERE slug = $1 AND published = true`,
    [slug]
  );
  return result.rows[0] ?? null;
}

export async function slugExists(slug, excludePageId = null) {
  const result = excludePageId
    ? await query(`SELECT 1 FROM pages WHERE slug = $1 AND id <> $2 LIMIT 1`, [
        slug,
        excludePageId
      ])
    : await query(`SELECT 1 FROM pages WHERE slug = $1 LIMIT 1`, [slug]);
  return result.rowCount > 0;
}

export async function loadPageRelations(pageId) {
  const [profile, theme, availability, categories, serviceItems, blocks] = await Promise.all([
    query(`SELECT * FROM page_profiles WHERE page_id = $1`, [pageId]),
    query(`SELECT * FROM page_themes WHERE page_id = $1`, [pageId]),
    query(`SELECT * FROM page_availability WHERE page_id = $1`, [pageId]),
    query(
      `SELECT * FROM page_service_categories WHERE page_id = $1 ORDER BY sort_order ASC, created_at ASC`,
      [pageId]
    ),
    query(
      `SELECT * FROM page_service_items WHERE page_id = $1 ORDER BY sort_order ASC, created_at ASC`,
      [pageId]
    ),
    query(`SELECT * FROM page_blocks WHERE page_id = $1`, [pageId])
  ]);

  return {
    profile: profile.rows[0] ?? null,
    theme: theme.rows[0] ?? null,
    availability: availability.rows[0] ?? null,
    categories: categories.rows,
    serviceItems: serviceItems.rows,
    blocks: blocks.rows
  };
}

export async function countUserPages(userId) {
  const result = await query(`SELECT COUNT(*)::int AS count FROM pages WHERE user_id = $1`, [
    userId
  ]);
  return result.rows[0].count;
}

export async function createPageForUser(user, { slug, isDefault = false }) {
  return withTransaction(async (client) => {
    if (isDefault) {
      await clearDefaultForUser(user.id, client);
    }

    const pageResult = await client.query(
      `INSERT INTO pages (user_id, slug, is_default, section_layout)
       VALUES ($1, $2, $3, $4::jsonb)
       RETURNING *`,
      [user.id, slug, isDefault, JSON.stringify(DEFAULT_SECTION_LAYOUT)]
    );
    const page = pageResult.rows[0];
    const profile = profileFromUser(user);

    await client.query(
      `INSERT INTO page_profiles (
         page_id, name, role, bio, city, timezone, avatar_url, email, phone
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        page.id,
        profile.name,
        profile.role,
        profile.bio,
        profile.city,
        profile.timezone,
        profile.avatarUrl,
        profile.email,
        profile.phone
      ]
    );

    await client.query(
      `INSERT INTO page_themes (page_id, preset, accent_color, mode)
       VALUES ($1, $2, $3, $4)`,
      [page.id, DEFAULT_THEME.preset, DEFAULT_THEME.accentColor, DEFAULT_THEME.mode]
    );

    const availabilityTimezone = profile.timezone || DEFAULT_AVAILABILITY_SCALARS.timezone;

    await client.query(
      `INSERT INTO page_availability (
         page_id, timezone, buffer_before_minutes, buffer_after_minutes,
         min_notice_hours, max_days_ahead, days
       ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
      [
        page.id,
        availabilityTimezone,
        DEFAULT_AVAILABILITY_SCALARS.bufferBeforeMinutes,
        DEFAULT_AVAILABILITY_SCALARS.bufferAfterMinutes,
        DEFAULT_AVAILABILITY_SCALARS.minNoticeHours,
        DEFAULT_AVAILABILITY_SCALARS.maxDaysAhead,
        JSON.stringify(defaultAvailabilityDaysStored())
      ]
    );

    const serviceId = crypto.randomUUID();
    await client.query(
      `INSERT INTO page_service_items (
         id, page_id, category_id, title, subtitle, duration_minutes, price_amount,
         currency, price_hidden, photo_url, is_active, sort_order
       ) VALUES ($1, $2, NULL, $3, $4, $5, $6, $7, $8, $9, $10, 0)`,
      [
        serviceId,
        page.id,
        DEFAULT_STARTER_SERVICE.title,
        DEFAULT_STARTER_SERVICE.subtitle,
        DEFAULT_STARTER_SERVICE.durationMinutes,
        DEFAULT_STARTER_SERVICE.priceAmount,
        DEFAULT_STARTER_SERVICE.currency,
        DEFAULT_STARTER_SERVICE.priceHidden,
        DEFAULT_STARTER_SERVICE.photoUrl,
        DEFAULT_STARTER_SERVICE.isActive
      ]
    );

    return page;
  });
}

export async function clearDefaultForUser(userId, client = null) {
  const runner = client ?? { query };
  await runner.query(
    `UPDATE pages SET is_default = false, updated_at = now() WHERE user_id = $1 AND is_default = true`,
    [userId]
  );
}

export async function setPageDefault(pageId, userId) {
  return withTransaction(async (client) => {
    await clearDefaultForUser(userId, client);
    const result = await client.query(
      `UPDATE pages
       SET is_default = true, updated_at = now()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [pageId, userId]
    );
    return result.rows[0] ?? null;
  });
}

async function updatePageRow(client, pageId, pageFields) {
  const allowed = ['slug', 'published', 'published_at', 'services_use_categories', 'section_layout'];
  const updates = [];
  const values = [];
  let index = 1;

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(pageFields, key)) {
      if (key === 'section_layout') {
        updates.push(`section_layout = $${index}::jsonb`);
        values.push(JSON.stringify(pageFields[key]));
      } else {
        updates.push(`${key} = $${index}`);
        values.push(pageFields[key]);
      }
      index += 1;
    }
  }

  if (updates.length === 0) return null;

  updates.push('updated_at = now()');
  values.push(pageId);

  const result = await client.query(
    `UPDATE pages SET ${updates.join(', ')} WHERE id = $${index} RETURNING *`,
    values
  );
  return result.rows[0];
}

async function upsertProfile(client, pageId, fields) {
  if (!fields) return;
  await client.query(
    `INSERT INTO page_profiles (
       page_id, name, role, bio, city, timezone, avatar_url, email, phone
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (page_id) DO UPDATE SET
       name = EXCLUDED.name,
       role = EXCLUDED.role,
       bio = EXCLUDED.bio,
       city = EXCLUDED.city,
       timezone = EXCLUDED.timezone,
       avatar_url = EXCLUDED.avatar_url,
       email = EXCLUDED.email,
       phone = EXCLUDED.phone,
       updated_at = now()`,
    [
      pageId,
      fields.name,
      fields.role,
      fields.bio,
      fields.city,
      fields.timezone,
      fields.avatar_url,
      fields.email,
      fields.phone
    ]
  );
}

async function upsertTheme(client, pageId, fields) {
  if (!fields) return;
  await client.query(
    `INSERT INTO page_themes (page_id, preset, accent_color, mode)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (page_id) DO UPDATE SET
       preset = EXCLUDED.preset,
       accent_color = EXCLUDED.accent_color,
       mode = EXCLUDED.mode,
       updated_at = now()`,
    [pageId, fields.preset, fields.accent_color, fields.mode]
  );
}

async function upsertAvailability(client, pageId, fields) {
  if (!fields) return;
  await client.query(
    `INSERT INTO page_availability (
       page_id, timezone, buffer_before_minutes, buffer_after_minutes,
       min_notice_hours, max_days_ahead, days
     ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
     ON CONFLICT (page_id) DO UPDATE SET
       timezone = EXCLUDED.timezone,
       buffer_before_minutes = EXCLUDED.buffer_before_minutes,
       buffer_after_minutes = EXCLUDED.buffer_after_minutes,
       min_notice_hours = EXCLUDED.min_notice_hours,
       max_days_ahead = EXCLUDED.max_days_ahead,
       days = EXCLUDED.days,
       updated_at = now()`,
    [
      pageId,
      fields.timezone,
      fields.buffer_before_minutes,
      fields.buffer_after_minutes,
      fields.min_notice_hours,
      fields.max_days_ahead,
      JSON.stringify(fields.days ?? [])
    ]
  );
}

async function replaceServices(client, pageId, services) {
  if (!services) return;

  await client.query(`DELETE FROM page_service_items WHERE page_id = $1`, [pageId]);
  await client.query(`DELETE FROM page_service_categories WHERE page_id = $1`, [pageId]);

  const categoryIdMap = new Map();
  const categories = Array.isArray(services.categories) ? services.categories : [];

  for (let i = 0; i < categories.length; i += 1) {
    const cat = categories[i];
    const id = coerceUuid(cat.id);
    categoryIdMap.set(cat.id, id);
    categoryIdMap.set(id, id);
    await client.query(
      `INSERT INTO page_service_categories (id, page_id, title, sort_order)
       VALUES ($1, $2, $3, $4)`,
      [id, pageId, cat.title ?? '', i]
    );
  }

  const items = Array.isArray(services.services) ? services.services : [];
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const id = coerceUuid(item.id);
    const categoryId = item.categoryId
      ? categoryIdMap.get(item.categoryId) ?? null
      : null;

    await client.query(
      `INSERT INTO page_service_items (
         id, page_id, category_id, title, subtitle, duration_minutes, price_amount,
         currency, price_hidden, photo_url, is_active, sort_order
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id,
        pageId,
        categoryId,
        item.title ?? '',
        item.subtitle ?? '',
        Number(item.durationMinutes) || 0,
        Number(item.priceAmount) || 0,
        (item.currency ?? 'PLN').toString().slice(0, 3),
        Boolean(item.priceHidden),
        item.photoUrl ?? '',
        item.isActive !== false,
        i
      ]
    );
  }
}

async function upsertBlocks(client, pageId, blockUpdates) {
  for (const block of blockUpdates) {
    await client.query(
      `INSERT INTO page_blocks (page_id, type, data)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (page_id, type) DO UPDATE SET
         data = EXCLUDED.data,
         updated_at = now()`,
      [pageId, block.type, JSON.stringify(block.data ?? {})]
    );
  }
}

export async function applyPagePatch(pageId, patch) {
  return withTransaction(async (client) => {
    await updatePageRow(client, pageId, patch.pageFields);
    await upsertProfile(client, pageId, patch.profileFields);
    await upsertTheme(client, pageId, patch.themeFields);
    await upsertAvailability(client, pageId, patch.availabilityFields);
    await replaceServices(client, pageId, patch.services);
    await upsertBlocks(client, pageId, patch.blockUpdates);

    const pageResult = await client.query(`SELECT * FROM pages WHERE id = $1`, [pageId]);
    return pageResult.rows[0];
  });
}

export async function publishPage(pageId, published) {
  const result = await query(
    `UPDATE pages
     SET published = $2,
         published_at = CASE WHEN $2 THEN now() ELSE NULL END,
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [pageId, published]
  );
  return result.rows[0] ?? null;
}

export async function deletePage(pageId, userId) {
  const result = await query(`DELETE FROM pages WHERE id = $1 AND user_id = $2 RETURNING id`, [
    pageId,
    userId
  ]);
  return result.rows[0] ?? null;
}
