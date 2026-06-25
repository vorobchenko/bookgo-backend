import { deleteAvatarByUrl } from './avatar-storage.js';
import { query, withTransaction } from '../utils/db.js';
import { coerceUuid } from '../utils/slug.js';
import { assembleServicesSettings, mapServiceItemRow } from './page-assembler.js';

async function touchPage(pageId, client) {
  await client.query(`UPDATE pages SET updated_at = now() WHERE id = $1`, [pageId]);
}

async function loadPageRow(client, pageId) {
  const result = await client.query(`SELECT * FROM pages WHERE id = $1`, [pageId]);
  return result.rows[0] ?? null;
}

async function loadServicesContext(client, pageId) {
  const page = await loadPageRow(client, pageId);
  if (!page) return null;

  const [categories, serviceItems] = await Promise.all([
    client.query(
      `SELECT * FROM page_service_categories WHERE page_id = $1 ORDER BY sort_order ASC, created_at ASC`,
      [pageId]
    ),
    client.query(
      `SELECT * FROM page_service_items WHERE page_id = $1 ORDER BY sort_order ASC, created_at ASC`,
      [pageId]
    )
  ]);

  return {
    page,
    categories: categories.rows,
    serviceItems: serviceItems.rows
  };
}

async function buildServicesResponse(client, pageId, itemRow = null) {
  const context = await loadServicesContext(client, pageId);
  if (!context) {
    return null;
  }

  return {
    service: itemRow ? mapServiceItemRow(itemRow) : undefined,
    category: undefined,
    services: assembleServicesSettings(context.page, context.categories, context.serviceItems)
  };
}

async function getNextSortOrder(client, table, pageId) {
  const result = await client.query(
    `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM ${table} WHERE page_id = $1`,
    [pageId]
  );
  return result.rows[0].next;
}

async function categoryExistsOnPage(client, pageId, categoryId) {
  const result = await client.query(
    `SELECT 1 FROM page_service_categories WHERE id = $1 AND page_id = $2`,
    [categoryId, pageId]
  );
  return result.rowCount > 0;
}

async function getServiceItemRow(client, pageId, serviceId) {
  const result = await client.query(
    `SELECT * FROM page_service_items WHERE id = $1 AND page_id = $2`,
    [serviceId, pageId]
  );
  return result.rows[0] ?? null;
}

async function getCategoryRow(client, pageId, categoryId) {
  const result = await client.query(
    `SELECT * FROM page_service_categories WHERE id = $1 AND page_id = $2`,
    [categoryId, pageId]
  );
  return result.rows[0] ?? null;
}

function mapCategoryRow(row) {
  return {
    id: row.id,
    title: row.title
  };
}

export async function getPageServicesSettings(pageId) {
  const context = await loadServicesContext({ query }, pageId);
  if (!context) {
    return null;
  }

  return assembleServicesSettings(context.page, context.categories, context.serviceItems);
}

export async function createPageServiceItem(pageId, input) {
  return withTransaction(async (client) => {
    const page = await loadPageRow(client, pageId);
    if (!page) {
      return null;
    }

    if (input.categoryId && !(await categoryExistsOnPage(client, pageId, input.categoryId))) {
      const error = new Error('Category not found');
      error.code = 'CATEGORY_NOT_FOUND';
      throw error;
    }

    const id = coerceUuid(input.id);
    const sortOrder =
      input.sortOrder ?? (await getNextSortOrder(client, 'page_service_items', pageId));

    await client.query(
      `INSERT INTO page_service_items (
         id, page_id, category_id, title, subtitle, duration_minutes, price_amount,
         currency, price_hidden, photo_url, is_active, sort_order
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id,
        pageId,
        input.categoryId,
        input.title,
        input.subtitle,
        input.durationMinutes,
        input.priceAmount,
        input.currency,
        input.priceHidden,
        input.photoUrl,
        input.isActive,
        sortOrder
      ]
    );

    await touchPage(pageId, client);
    const itemRow = await getServiceItemRow(client, pageId, id);
    const response = await buildServicesResponse(client, pageId, itemRow);
    return response;
  });
}

export async function updatePageServiceItem(pageId, serviceId, patch) {
  return withTransaction(async (client) => {
    const existing = await getServiceItemRow(client, pageId, serviceId);
    if (!existing) {
      return { notFound: true };
    }

    if (
      Object.prototype.hasOwnProperty.call(patch, 'categoryId') &&
      patch.categoryId &&
      !(await categoryExistsOnPage(client, pageId, patch.categoryId))
    ) {
      const error = new Error('Category not found');
      error.code = 'CATEGORY_NOT_FOUND';
      throw error;
    }

    const columns = [];
    const values = [];
    let index = 1;

    const fieldMap = {
      title: 'title',
      subtitle: 'subtitle',
      durationMinutes: 'duration_minutes',
      priceAmount: 'price_amount',
      currency: 'currency',
      priceHidden: 'price_hidden',
      categoryId: 'category_id',
      isActive: 'is_active',
      photoUrl: 'photo_url',
      sortOrder: 'sort_order'
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      if (Object.prototype.hasOwnProperty.call(patch, key)) {
        columns.push(`${column} = $${index}`);
        values.push(patch[key]);
        index += 1;
      }
    }

    if (columns.length === 0) {
      return { notFound: false, ...(await buildServicesResponse(client, pageId, existing)) };
    }

    columns.push('updated_at = now()');
    values.push(serviceId, pageId);

    await client.query(
      `UPDATE page_service_items
       SET ${columns.join(', ')}
       WHERE id = $${index} AND page_id = $${index + 1}`,
      values
    );

    await touchPage(pageId, client);
    const itemRow = await getServiceItemRow(client, pageId, serviceId);
    return buildServicesResponse(client, pageId, itemRow);
  });
}

export async function deletePageServiceItem(pageId, serviceId) {
  return withTransaction(async (client) => {
    const existing = await getServiceItemRow(client, pageId, serviceId);
    if (!existing) {
      return { notFound: true };
    }

    if (existing.photo_url) {
      await deleteAvatarByUrl(existing.photo_url);
    }

    await client.query(`DELETE FROM page_service_items WHERE id = $1 AND page_id = $2`, [
      serviceId,
      pageId
    ]);
    await touchPage(pageId, client);
    return buildServicesResponse(client, pageId);
  });
}

export async function setPageServiceActive(pageId, serviceId, isActive) {
  return updatePageServiceItem(pageId, serviceId, { isActive });
}

export async function updatePageServicesSettings(pageId, settings) {
  return withTransaction(async (client) => {
    const page = await loadPageRow(client, pageId);
    if (!page) {
      return null;
    }

    await client.query(
      `UPDATE pages
       SET services_use_categories = $2, updated_at = now()
       WHERE id = $1`,
      [pageId, settings.useCategories]
    );

    return buildServicesResponse(client, pageId);
  });
}

export async function createPageServiceCategory(pageId, input) {
  return withTransaction(async (client) => {
    const page = await loadPageRow(client, pageId);
    if (!page) {
      return null;
    }

    const id = coerceUuid(input.id);
    const sortOrder =
      input.sortOrder ?? (await getNextSortOrder(client, 'page_service_categories', pageId));

    await client.query(
      `INSERT INTO page_service_categories (id, page_id, title, sort_order)
       VALUES ($1, $2, $3, $4)`,
      [id, pageId, input.title, sortOrder]
    );

    await touchPage(pageId, client);
    const categoryRow = await getCategoryRow(client, pageId, id);
    const response = await buildServicesResponse(client, pageId);
    return {
      ...response,
      category: mapCategoryRow(categoryRow)
    };
  });
}

export async function updatePageServiceCategory(pageId, categoryId, patch) {
  return withTransaction(async (client) => {
    const existing = await getCategoryRow(client, pageId, categoryId);
    if (!existing) {
      return { notFound: true };
    }

    const columns = [];
    const values = [];
    let index = 1;

    if (Object.prototype.hasOwnProperty.call(patch, 'title')) {
      columns.push(`title = $${index}`);
      values.push(patch.title);
      index += 1;
    }

    if (Object.prototype.hasOwnProperty.call(patch, 'sortOrder')) {
      columns.push(`sort_order = $${index}`);
      values.push(patch.sortOrder);
      index += 1;
    }

    if (columns.length > 0) {
      columns.push('updated_at = now()');
      values.push(categoryId, pageId);

      await client.query(
        `UPDATE page_service_categories
         SET ${columns.join(', ')}
         WHERE id = $${index} AND page_id = $${index + 1}`,
        values
      );
      await touchPage(pageId, client);
    }

    const categoryRow = await getCategoryRow(client, pageId, categoryId);
    const response = await buildServicesResponse(client, pageId);
    return {
      ...response,
      category: mapCategoryRow(categoryRow)
    };
  });
}

export async function deletePageServiceCategory(pageId, categoryId) {
  return withTransaction(async (client) => {
    const existing = await getCategoryRow(client, pageId, categoryId);
    if (!existing) {
      return { notFound: true };
    }

    await client.query(`DELETE FROM page_service_categories WHERE id = $1 AND page_id = $2`, [
      categoryId,
      pageId
    ]);
    await touchPage(pageId, client);
    return buildServicesResponse(client, pageId);
  });
}
