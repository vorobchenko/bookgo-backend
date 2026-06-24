const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function isValidSlug(slug) {
  return typeof slug === 'string' && /^[a-z0-9-]{3,48}$/.test(slug);
}

export function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value);
}

export function coerceUuid(value) {
  return isUuid(value) ? value : crypto.randomUUID();
}
