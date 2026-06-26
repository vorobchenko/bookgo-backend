import { isAllowedServicePhotoUrl } from '../utils/avatar.js';
import { jsonField } from './json-field.js';
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

  const durationMinutes = Number(jsonField(body, 'duration_minutes', 'durationMinutes'));
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    return { ok: false, code: 'DURATION_INVALID' };
  }

  const priceAmount = Number(jsonField(body, 'price_amount', 'priceAmount') ?? 0);
  if (!Number.isInteger(priceAmount) || priceAmount < 0) {
    return { ok: false, code: 'PRICE_INVALID' };
  }

  const currency = normalizeCurrency(body?.currency);
  if (!CURRENCY_RE.test(currency)) {
    return { ok: false, code: 'CURRENCY_INVALID' };
  }

  const categoryId = jsonField(body, 'category_id', 'categoryId') ?? null;
  if (categoryId !== null && categoryId !== undefined && categoryId !== '' && !isUuid(categoryId)) {
    return { ok: false, code: 'CATEGORY_INVALID' };
  }

  const photoUrl = trimString(jsonField(body, 'photo_url', 'photoUrl'));
  if (photoUrl && !isAllowedServicePhotoUrl(photoUrl)) {
    return { ok: false, code: 'PHOTO_URL_INVALID' };
  }

  const isActiveRaw = jsonField(body, 'is_active', 'isActive');
  const sortOrderRaw = jsonField(body, 'sort_order', 'sortOrder');

  return {
    ok: true,
    value: {
      id: body?.id,
      title,
      subtitle: trimString(body?.subtitle),
      duration_minutes: durationMinutes,
      price_amount: priceAmount,
      currency,
      price_hidden: Boolean(jsonField(body, 'price_hidden', 'priceHidden')),
      category_id: categoryId || null,
      is_active: isActiveRaw !== false,
      photo_url: photoUrl,
      sort_order: Number.isInteger(sortOrderRaw) ? sortOrderRaw : undefined
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
    'duration_minutes',
    'price_amount',
    'currency',
    'price_hidden',
    'category_id',
    'is_active',
    'photo_url',
    'sort_order'
  ];
  const patch = {};

  for (const key of allowed) {
    const legacyKey =
      key === 'duration_minutes'
        ? 'durationMinutes'
        : key === 'price_amount'
          ? 'priceAmount'
          : key === 'price_hidden'
            ? 'priceHidden'
            : key === 'category_id'
              ? 'categoryId'
              : key === 'is_active'
                ? 'isActive'
                : key === 'photo_url'
                  ? 'photoUrl'
                  : key === 'sort_order'
                    ? 'sortOrder'
                    : null;

    if (
      !Object.prototype.hasOwnProperty.call(body, key) &&
      !(legacyKey && Object.prototype.hasOwnProperty.call(body, legacyKey))
    ) {
      continue;
    }

    const raw = jsonField(body, key, legacyKey);

    switch (key) {
      case 'title': {
        const title = trimString(raw);
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
        patch.subtitle = trimString(raw);
        break;
      case 'duration_minutes': {
        const durationMinutes = Number(raw);
        if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
          return { ok: false, code: 'DURATION_INVALID' };
        }
        patch.duration_minutes = durationMinutes;
        break;
      }
      case 'price_amount': {
        const priceAmount = Number(raw);
        if (!Number.isInteger(priceAmount) || priceAmount < 0) {
          return { ok: false, code: 'PRICE_INVALID' };
        }
        patch.price_amount = priceAmount;
        break;
      }
      case 'currency': {
        const currency = normalizeCurrency(raw);
        if (!CURRENCY_RE.test(currency)) {
          return { ok: false, code: 'CURRENCY_INVALID' };
        }
        patch.currency = currency;
        break;
      }
      case 'price_hidden':
        patch.price_hidden = Boolean(raw);
        break;
      case 'category_id': {
        const categoryId = raw;
        if (categoryId === null || categoryId === '') {
          patch.category_id = null;
          break;
        }
        if (!isUuid(categoryId)) {
          return { ok: false, code: 'CATEGORY_INVALID' };
        }
        patch.category_id = categoryId;
        break;
      }
      case 'is_active':
        patch.is_active = Boolean(raw);
        break;
      case 'photo_url': {
        const photoUrl = trimString(raw);
        if (photoUrl && !isAllowedServicePhotoUrl(photoUrl)) {
          return { ok: false, code: 'PHOTO_URL_INVALID' };
        }
        patch.photo_url = photoUrl;
        break;
      }
      case 'sort_order': {
        const sortOrder = Number(raw);
        if (!Number.isInteger(sortOrder) || sortOrder < 0) {
          return { ok: false, code: 'SORT_ORDER_INVALID' };
        }
        patch.sort_order = sortOrder;
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

  const sortOrderRaw = jsonField(body, 'sort_order', 'sortOrder');

  return {
    ok: true,
    value: {
      id: body?.id,
      title,
      sort_order: Number.isInteger(sortOrderRaw) ? sortOrderRaw : undefined
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

  const sortOrderRaw = jsonField(body, 'sort_order', 'sortOrder');
  if (
    Object.prototype.hasOwnProperty.call(body, 'sort_order') ||
    Object.prototype.hasOwnProperty.call(body, 'sortOrder')
  ) {
    const sortOrder = Number(sortOrderRaw);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      return { ok: false, code: 'SORT_ORDER_INVALID' };
    }
    patch.sort_order = sortOrder;
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

  const useCategories = jsonField(body, 'use_categories', 'useCategories');
  if (useCategories === undefined) {
    return { ok: false, code: 'BODY_EMPTY' };
  }

  return {
    ok: true,
    value: {
      use_categories: Boolean(useCategories)
    }
  };
}

export function parseServicesOrderBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, code: 'BODY_INVALID' };
  }

  const order = body.order;
  if (!Array.isArray(order) || order.length === 0) {
    return { ok: false, code: 'ORDER_REQUIRED' };
  }

  if (!order.every((id) => isUuid(id))) {
    return { ok: false, code: 'ORDER_INVALID' };
  }

  if (new Set(order).size !== order.length) {
    return { ok: false, code: 'ORDER_DUPLICATE' };
  }

  return { ok: true, value: { order } };
}
