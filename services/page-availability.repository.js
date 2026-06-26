import {
  enrichAvailabilityDays,
  mapAvailabilityRow,
  stripDayLabels
} from './page-assembler.js';
import { DEFAULT_AVAILABILITY_SCALARS } from './page-defaults.js';
import { query, withTransaction } from '../utils/db.js';

const AVAILABILITY_COLUMNS = `
  page_id, timezone, buffer_after_minutes, min_notice_hours, max_days_ahead,
  slot_interval_minutes, max_bookings_per_day, days
`;

async function touchPage(pageId, client) {
  await client.query(`UPDATE pages SET updated_at = now() WHERE id = $1`, [pageId]);
}

async function loadPageRow(client, pageId) {
  const result = await client.query(`SELECT id FROM pages WHERE id = $1`, [pageId]);
  return result.rows[0] ?? null;
}

async function getAvailabilityRow(client, pageId) {
  const result = await client.query(`SELECT * FROM page_availability WHERE page_id = $1`, [pageId]);
  return result.rows[0] ?? null;
}

function storedDaysArray(row) {
  return Array.isArray(row?.days) ? row.days : [];
}

function mergeDaysByWeekday(storedDays, patchDays, keys) {
  const byWeekday = new Map(
    storedDays.map((day) => [
      day.weekday,
      {
        weekday: day.weekday,
        working: Boolean(day.working),
        ranges: Array.isArray(day.ranges) ? day.ranges : []
      }
    ])
  );

  for (const day of patchDays) {
    const existing = byWeekday.get(day.weekday) ?? {
      weekday: day.weekday,
      working: false,
      ranges: []
    };

    for (const key of keys) {
      if (day[key] !== undefined) {
        existing[key] = day[key];
      }
    }

    byWeekday.set(day.weekday, existing);
  }

  return Array.from(byWeekday.values()).sort((a, b) => a.weekday - b.weekday);
}

function availabilityMeta(availability) {
  const days = availability?.days ?? [];
  const workingDaysCount = days.filter((day) => day.working).length;
  const hasWorkingHours = days.some(
    (day) => day.working && Array.isArray(day.ranges) && day.ranges.length > 0
  );

  return {
    working_days_count: workingDaysCount,
    has_working_hours: hasWorkingHours
  };
}

function buildAvailabilityResponse(row) {
  const availability = mapAvailabilityRow(row);
  return {
    availability,
    meta: availabilityMeta(availability)
  };
}

function availabilityValues(fields) {
  return [
    fields.timezone,
    fields.buffer_after_minutes,
    fields.min_notice_hours,
    fields.max_days_ahead,
    fields.slot_interval_minutes,
    fields.max_bookings_per_day,
    JSON.stringify(fields.days ?? [])
  ];
}

async function saveAvailability(client, pageId, fields) {
  await client.query(
    `INSERT INTO page_availability (${AVAILABILITY_COLUMNS})
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
     ON CONFLICT (page_id) DO UPDATE SET
       timezone = EXCLUDED.timezone,
       buffer_after_minutes = EXCLUDED.buffer_after_minutes,
       min_notice_hours = EXCLUDED.min_notice_hours,
       max_days_ahead = EXCLUDED.max_days_ahead,
       slot_interval_minutes = EXCLUDED.slot_interval_minutes,
       max_bookings_per_day = EXCLUDED.max_bookings_per_day,
       days = EXCLUDED.days,
       updated_at = now()`,
    [pageId, ...availabilityValues(fields)]
  );
}

function defaultStoredFields(row) {
  return {
    timezone: row?.timezone ?? DEFAULT_AVAILABILITY_SCALARS.timezone,
    buffer_after_minutes:
      row?.buffer_after_minutes ?? DEFAULT_AVAILABILITY_SCALARS.buffer_after_minutes,
    min_notice_hours: row?.min_notice_hours ?? DEFAULT_AVAILABILITY_SCALARS.min_notice_hours,
    max_days_ahead: row?.max_days_ahead ?? DEFAULT_AVAILABILITY_SCALARS.max_days_ahead,
    slot_interval_minutes:
      row?.slot_interval_minutes ?? DEFAULT_AVAILABILITY_SCALARS.slot_interval_minutes,
    max_bookings_per_day:
      row?.max_bookings_per_day ?? DEFAULT_AVAILABILITY_SCALARS.max_bookings_per_day,
    days: storedDaysArray(row)
  };
}

function mergePatchFields(row, patch, dayMergeKeys) {
  const current = defaultStoredFields(row);
  const next = { ...current };

  if (patch.timezone !== undefined) {
    next.timezone = patch.timezone;
  }
  if (patch.buffer_after_minutes !== undefined) {
    next.buffer_after_minutes = patch.buffer_after_minutes;
  }
  if (patch.min_notice_hours !== undefined) {
    next.min_notice_hours = patch.min_notice_hours;
  }
  if (patch.max_days_ahead !== undefined) {
    next.max_days_ahead = patch.max_days_ahead;
  }
  if (patch.slot_interval_minutes !== undefined) {
    next.slot_interval_minutes = patch.slot_interval_minutes;
  }
  if (patch.max_bookings_per_day !== undefined) {
    next.max_bookings_per_day = patch.max_bookings_per_day;
  }

  if (patch.days !== undefined) {
    if (dayMergeKeys) {
      next.days = stripDayLabels(
        mergeDaysByWeekday(current.days, patch.days, dayMergeKeys)
      );
    } else {
      next.days = stripDayLabels(patch.days);
    }
  }

  return next;
}

async function updateAvailability(pageId, patch, dayMergeKeys = null) {
  return withTransaction(async (client) => {
    const page = await loadPageRow(client, pageId);
    if (!page) {
      return null;
    }

    const row = await getAvailabilityRow(client, pageId);
    const merged = mergePatchFields(row, patch, dayMergeKeys);
    await saveAvailability(client, pageId, merged);
    await touchPage(pageId, client);

    const saved = await getAvailabilityRow(client, pageId);
    return buildAvailabilityResponse(saved);
  });
}

export async function getPageAvailability(pageId) {
  const page = await loadPageRow({ query }, pageId);
  if (!page) {
    return null;
  }

  const row = await getAvailabilityRow({ query }, pageId);
  return buildAvailabilityResponse(row);
}

export async function updatePageAvailability(pageId, patch) {
  return updateAvailability(pageId, patch);
}

export async function updatePageWeeklyHours(pageId, patch) {
  return updateAvailability(pageId, patch, ['working', 'ranges']);
}

export async function updatePageBookingRules(pageId, patch) {
  return updateAvailability(pageId, patch);
}

export { enrichAvailabilityDays, availabilityMeta };
