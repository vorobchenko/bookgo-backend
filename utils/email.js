const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

export function isValidEmail(email) {
  const normalized = normalizeEmail(email);
  return normalized.length > 0 && EMAIL_REGEX.test(normalized);
}

/** Allows empty string (optional contact email on a page). */
export function isValidEmailOrEmpty(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return true;
  }
  return EMAIL_REGEX.test(normalized);
}
