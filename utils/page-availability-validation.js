import { jsonField } from './json-field.js';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const TIMEZONE_MAX = 64;

function isWeekday(value) {
  return Number.isInteger(value) && value >= 0 && value <= 6;
}

function parseTimeRange(range) {
  if (!range || typeof range !== 'object') {
    return { ok: false, code: 'RANGE_INVALID' };
  }

  const start = typeof range.start === 'string' ? range.start.trim() : '';
  const end = typeof range.end === 'string' ? range.end.trim() : '';

  if (!TIME_RE.test(start) || !TIME_RE.test(end)) {
    return { ok: false, code: 'RANGE_TIME_INVALID' };
  }

  if (start >= end) {
    return { ok: false, code: 'RANGE_ORDER_INVALID' };
  }

  const id = typeof range.id === 'string' ? range.id.trim() : '';
  return {
    ok: true,
    value: {
      id: id || `rng-${start.replace(':', '')}-${end.replace(':', '')}`,
      start,
      end
    }
  };
}

function parseDayPatch(day, allowedKeys) {
  if (!day || typeof day !== 'object' || Array.isArray(day)) {
    return { ok: false, code: 'DAY_INVALID' };
  }

  const weekday = Number(day.weekday);
  if (!isWeekday(weekday)) {
    return { ok: false, code: 'WEEKDAY_INVALID' };
  }

  const parsed = { weekday };

  if (allowedKeys.includes('working') && day.working !== undefined) {
    parsed.working = Boolean(day.working);
  }

  if (allowedKeys.includes('bookable') && day.bookable !== undefined) {
    parsed.bookable = Boolean(day.bookable);
  }

  if (allowedKeys.includes('ranges') && day.ranges !== undefined) {
    if (!Array.isArray(day.ranges)) {
      return { ok: false, code: 'RANGES_INVALID' };
    }

    const ranges = [];
    for (const range of day.ranges) {
      const parsedRange = parseTimeRange(range);
      if (!parsedRange.ok) {
        return parsedRange;
      }
      ranges.push(parsedRange.value);
    }
    parsed.ranges = ranges;
  }

  return { ok: true, value: parsed };
}

function parseDaysArray(body, allowedKeys) {
  const days = body?.days;
  if (!Array.isArray(days) || days.length === 0) {
    return { ok: false, code: 'DAYS_REQUIRED' };
  }

  const parsedDays = [];
  for (const day of days) {
    const parsed = parseDayPatch(day, allowedKeys);
    if (!parsed.ok) {
      return parsed;
    }
    parsedDays.push(parsed.value);
  }

  return { ok: true, value: parsedDays };
}

function parseNonNegativeInt(value, code) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    return { ok: false, code };
  }
  return { ok: true, value: number };
}

function parseTimezone(value) {
  const timezone = typeof value === 'string' ? value.trim() : '';
  if (!timezone || timezone.length > TIMEZONE_MAX) {
    return { ok: false, code: 'TIMEZONE_INVALID' };
  }
  return { ok: true, value: timezone };
}

export function parseAvailabilityPatchBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, code: 'BODY_INVALID' };
  }

  const patch = {};
  const allowed = [
    'timezone',
    'buffer_before_minutes',
    'buffer_after_minutes',
    'min_notice_hours',
    'max_days_ahead',
    'days'
  ];

  for (const key of allowed) {
    const legacyKey =
      key === 'buffer_before_minutes'
        ? 'bufferBeforeMinutes'
        : key === 'buffer_after_minutes'
          ? 'bufferAfterMinutes'
          : key === 'min_notice_hours'
            ? 'minNoticeHours'
            : key === 'max_days_ahead'
              ? 'maxDaysAhead'
              : null;

    if (
      !Object.prototype.hasOwnProperty.call(body, key) &&
      !(legacyKey && Object.prototype.hasOwnProperty.call(body, legacyKey))
    ) {
      continue;
    }

    const raw = jsonField(body, key, legacyKey);

    switch (key) {
      case 'timezone': {
        const parsed = parseTimezone(raw);
        if (!parsed.ok) return parsed;
        patch.timezone = parsed.value;
        break;
      }
      case 'buffer_before_minutes': {
        const parsed = parseNonNegativeInt(raw, 'BUFFER_BEFORE_INVALID');
        if (!parsed.ok) return parsed;
        patch.buffer_before_minutes = parsed.value;
        break;
      }
      case 'buffer_after_minutes': {
        const parsed = parseNonNegativeInt(raw, 'BUFFER_AFTER_INVALID');
        if (!parsed.ok) return parsed;
        patch.buffer_after_minutes = parsed.value;
        break;
      }
      case 'min_notice_hours': {
        const parsed = parseNonNegativeInt(raw, 'MIN_NOTICE_INVALID');
        if (!parsed.ok) return parsed;
        patch.min_notice_hours = parsed.value;
        break;
      }
      case 'max_days_ahead': {
        const parsed = parseNonNegativeInt(raw, 'MAX_DAYS_AHEAD_INVALID');
        if (!parsed.ok) return parsed;
        patch.max_days_ahead = parsed.value;
        break;
      }
      case 'days': {
        const parsed = parseDaysArray(body, ['working', 'bookable', 'ranges']);
        if (!parsed.ok) return parsed;
        patch.days = parsed.value;
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

export function parseWeeklyHoursPatchBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, code: 'BODY_INVALID' };
  }

  const patch = {};

  if (
    Object.prototype.hasOwnProperty.call(body, 'timezone')
  ) {
    const parsed = parseTimezone(body.timezone);
    if (!parsed.ok) return parsed;
    patch.timezone = parsed.value;
  }

  const parsedDays = parseDaysArray(body, ['working', 'ranges']);
  if (!parsedDays.ok) {
    return parsedDays;
  }
  patch.days = parsedDays.value;

  return { ok: true, value: patch };
}

export function parseBookingDaysPatchBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, code: 'BODY_INVALID' };
  }

  const parsedDays = parseDaysArray(body, ['bookable']);
  if (!parsedDays.ok) {
    return parsedDays;
  }

  return { ok: true, value: { days: parsedDays.value } };
}

export function parseBookingRulesPatchBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, code: 'BODY_INVALID' };
  }

  const patch = {};
  const fields = [
    ['buffer_before_minutes', 'bufferBeforeMinutes', 'BUFFER_BEFORE_INVALID'],
    ['buffer_after_minutes', 'bufferAfterMinutes', 'BUFFER_AFTER_INVALID'],
    ['min_notice_hours', 'minNoticeHours', 'MIN_NOTICE_INVALID'],
    ['max_days_ahead', 'maxDaysAhead', 'MAX_DAYS_AHEAD_INVALID']
  ];

  for (const [key, legacyKey, code] of fields) {
    if (
      !Object.prototype.hasOwnProperty.call(body, key) &&
      !Object.prototype.hasOwnProperty.call(body, legacyKey)
    ) {
      continue;
    }

    const parsed = parseNonNegativeInt(jsonField(body, key, legacyKey), code);
    if (!parsed.ok) {
      return parsed;
    }
    patch[key] = parsed.value;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, code: 'BODY_EMPTY' };
  }

  return { ok: true, value: patch };
}
