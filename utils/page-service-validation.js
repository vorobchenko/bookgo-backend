import { isUuid } from './slug.js';

const TITLE_MAX = 200;
const CURRENCY_RE = /^[A-Z]{3}$/;

function trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeCurrency(value, fallback = 'PLN') {
  const currency = trimString(value).toUpperCase().slice(0, 3);
  return currency || fallback;
}

export function parseServiceCreateBody(body) {
  const title = trimString(body?.title);
  if (!title) {
    return { ok: false, code: 'TITLE_REQUIRED' };
  }
  if (title.length > TITLE_MAX) {
    return { ok: false, code: 'TITLE_TOO_LONG' };
  }

  const durationMinutes = Number(body?.durationMinutes);
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    return { ok: false, code: 'DURATION_INVALID' };
  }

  const priceAmount = Number(body?.priceAmount ?? 0);
  if (!Number.isInteger(priceAmount) || priceAmount < 0) {
    return { ok: false, code: 'PRICE_INVALID' };
  }

  const currency = normalizeCurrency(body?.currency);
  if (!CURRENCY_RE.test(currency)) {
    return { ok: false, code: 'CURRENCY_INVALID' };
  }

  const categoryId = body?.categoryId ?? null;
  if (categoryId !== null && categoryId !== undefined && categoryId !== '' && !isUuid(categoryId)) {
    return { ok: false, code: 'CATEGORY_INVALID' };
  }

  return {
    ok: true,
    value: {
      id: body?.id,
      title,
      subtitle: trimString(body?.subtitle),
      durationMinutes,
      priceAmount,
      currency,
      priceHidden: Boolean(body?.priceHidden),
      categoryId: categoryId || null,
      isActive: body?.isActive !== false,
      photoUrl: trimString(body?.photoUrl),
      sortOrder: Number.isInteger(body?.sortOrder) ? body.sortOrder : undefined
    }
  };
}

export function parseServicePatchBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, code: 'BODY_INVALID' };
  }

  const allowed = [
    'title',
    'subtitle',
    'durationMinutes',
    'priceAmount',
    'currency',
    'priceHidden',
    'categoryId',
    'isActive',
    'photoUrl',
    'sortOrder'
  ];
  const patch = {};

  for (const key of allowed) {
    if (!Object.prototype.hasOwnProperty.call(body, key)) {
      continue;
    }

    switch (key) {
      case 'title': {
        const title = trimString(body.title);
        if (!title) {
          return { ok: false, code: 'TITLE_REQUIRED' };
        }
        if (title.length > TITLE_MAX) {
          return { ok: false, code: 'TITLE_TOO_LONG' };
        }
        patch.title = title;
        break;
      }
      case 'subtitle':
        patch.subtitle = trimString(body.subtitle);
        break;
      case 'durationMinutes': {
        const durationMinutes = Number(body.durationMinutes);
        if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
          return { ok: false, code: 'DURATION_INVALID' };
        }
        patch.durationMinutes = durationMinutes;
        break;
      }
      case 'priceAmount': {
        const priceAmount = Number(body.priceAmount);
        if (!Number.isInteger(priceAmount) || priceAmount < 0) {
          return { ok: false, code: 'PRICE_INVALID' };
        }
        patch.priceAmount = priceAmount;
        break;
      }
      case 'currency': {
        const currency = normalizeCurrency(body.currency);
        if (!CURRENCY_RE.test(currency)) {
          return { ok: false, code: 'CURRENCY_INVALID' };
        }
        patch.currency = currency;
        break;
      }
      case 'priceHidden':
        patch.priceHidden = Boolean(body.priceHidden);
        break;
      case 'categoryId': {
        const categoryId = body.categoryId;
        if (categoryId === null || categoryId === '') {
          patch.categoryId = null;
          break;
        }
        if (!isUuid(categoryId)) {
          return { ok: false, code: 'CATEGORY_INVALID' };
        }
        patch.categoryId = categoryId;
        break;
      }
      case 'isActive':
        patch.isActive = Boolean(body.isActive);
        break;
      case 'photoUrl':
        patch.photoUrl = trimString(body.photoUrl);
        break;
      case 'sortOrder': {
        const sortOrder = Number(body.sortOrder);
        if (!Number.isInteger(sortOrder) || sortOrder < 0) {
          return { ok: false, code: 'SORT_ORDER_INVALID' };
        }
        patch.sortOrder = sortOrder;
        break;
      }
      default:
        break;
    }
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, code: 'BODY_EMPTY' };
  }

  return { ok: true, value: patch };
}

export function parseCategoryCreateBody(body) {
  const title = trimString(body?.title);
  if (!title) {
    return { ok: false, code: 'TITLE_REQUIRED' };
  }
  if (title.length > TITLE_MAX) {
    return { ok: false, code: 'TITLE_TOO_LONG' };
  }

  return {
    ok: true,
    value: {
      id: body?.id,
      title,
      sortOrder: Number.isInteger(body?.sortOrder) ? body.sortOrder : undefined
    }
  };
}

export function parseCategoryPatchBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, code: 'BODY_INVALID' };
  }

  const patch = {};
  if (Object.prototype.hasOwnProperty.call(body, 'title')) {
    const title = trimString(body.title);
    if (!title) {
      return { ok: false, code: 'TITLE_REQUIRED' };
    }
    if (title.length > TITLE_MAX) {
      return { ok: false, code: 'TITLE_TOO_LONG' };
    }
    patch.title = title;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'sortOrder')) {
    const sortOrder = Number(body.sortOrder);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      return { ok: false, code: 'SORT_ORDER_INVALID' };
    }
    patch.sortOrder = sortOrder;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, code: 'BODY_EMPTY' };
  }

  return { ok: true, value: patch };
}

export function parseServicesSettingsPatch(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, code: 'BODY_INVALID' };
  }

  if (!Object.prototype.hasOwnProperty.call(body, 'useCategories')) {
    return { ok: false, code: 'BODY_EMPTY' };
  }

  return {
    ok: true,
    value: {
      useCategories: Boolean(body.useCategories)
    }
  };
}
