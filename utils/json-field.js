/** Read JSON field accepting legacy camelCase in stored JSONB. */
export function jsonField(obj, snakeKey, legacyCamelKey) {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }
  if (Object.prototype.hasOwnProperty.call(obj, snakeKey)) {
    return obj[snakeKey];
  }
  if (legacyCamelKey && Object.prototype.hasOwnProperty.call(obj, legacyCamelKey)) {
    return obj[legacyCamelKey];
  }
  return undefined;
}
