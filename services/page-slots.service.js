import { mapAvailabilityRow } from './page-assembler.js';
import { DEFAULT_AVAILABILITY_SCALARS } from './page-defaults.js';
import { query } from '../utils/db.js';
import {
  addDaysToDateIso,
  dayMetaForDateIso,
  eachDateIsoInRange,
  formatTimeHm,
  isValidDateOnly,
  parseTimeHm,
  todayInTimeZone,
  weekdayIndexInTimeZone,
  zonedLocalToUtcMs
} from '../utils/zoned-time.js';

const DEFAULT_HORIZON_DAYS = 14;

function minDateIso(a, b) {
  return a <= b ? a : b;
}

function maxDateIso(a, b) {
  return a >= b ? a : b;
}

function resolveDateRange({ from, to, timeZone, maxDaysAhead }) {
  const today = todayInTimeZone(timeZone);
  const horizonEnd = addDaysToDateIso(today, maxDaysAhead);
  const defaultEnd = addDaysToDateIso(today, Math.min(DEFAULT_HORIZON_DAYS, maxDaysAhead));

  const resolvedFrom = from && isValidDateOnly(from) ? maxDateIso(from, today) : today;
  let resolvedTo = to && isValidDateOnly(to) ? minDateIso(to, horizonEnd) : defaultEnd;

  if (resolvedTo < resolvedFrom) {
    resolvedTo = resolvedFrom;
  }

  return { from: resolvedFrom, to: resolvedTo };
}

function scheduleForWeekday(availabilityDays, weekday) {
  return availabilityDays.find((day) => day.weekday === weekday) ?? null;
}

function slotTimesForRanges(ranges, slotIntervalMinutes, durationMinutes) {
  const times = new Set();

  for (const range of ranges) {
    const startMin = parseTimeHm(range.start);
    const endMin = parseTimeHm(range.end);
    if (startMin === null || endMin === null || startMin >= endMin) {
      continue;
    }

    for (let minute = startMin; minute + durationMinutes <= endMin; minute += slotIntervalMinutes) {
      times.add(formatTimeHm(minute));
    }
  }

  return [...times].sort();
}

function buildSlotItem(dateIso, timeHm, timeZone, earliestBookableMs) {
  const startMs = zonedLocalToUtcMs(dateIso, timeHm, timeZone);
  const available = startMs !== null && startMs >= earliestBookableMs;

  return {
    start: `${dateIso}T${timeHm}:00`,
    label: timeHm,
    available
  };
}

export function generatePageSlots({
  availability,
  serviceDurationMinutes,
  from,
  to
}) {
  const settings = mapAvailabilityRow(availability);
  const timeZone = settings.timezone || DEFAULT_AVAILABILITY_SCALARS.timezone;
  const slotIntervalMinutes = settings.slot_interval_minutes;
  const minNoticeHours = settings.min_notice_hours ?? 0;
  const maxDaysAhead = settings.max_days_ahead ?? DEFAULT_AVAILABILITY_SCALARS.max_days_ahead;
  const durationMinutes = Math.max(1, Number(serviceDurationMinutes) || 1);

  const range = resolveDateRange({ from, to, timeZone, maxDaysAhead });
  const earliestBookableMs = Date.now() + minNoticeHours * 60 * 60 * 1000;
  const days = [];

  eachDateIsoInRange(range.from, range.to, (dateIso) => {
    const anchor = new Date(`${dateIso}T12:00:00.000Z`);
    const weekday = weekdayIndexInTimeZone(anchor, timeZone);
    const schedule = scheduleForWeekday(settings.days, weekday);
    const meta = dayMetaForDateIso(dateIso, timeZone);

    if (!schedule?.working || !Array.isArray(schedule.ranges) || schedule.ranges.length === 0) {
      days.push({
        ...meta,
        has_free: false,
        times: [],
        slots: []
      });
      return;
    }

    const timeLabels = slotTimesForRanges(
      schedule.ranges,
      slotIntervalMinutes,
      durationMinutes
    );

    const slots = timeLabels.map((timeHm) =>
      buildSlotItem(dateIso, timeHm, timeZone, earliestBookableMs)
    );
    const availableTimes = slots.filter((slot) => slot.available).map((slot) => slot.label);

    days.push({
      ...meta,
      has_free: availableTimes.length > 0,
      times: availableTimes,
      slots
    });
  });

  return {
    timezone: timeZone,
    slot_interval_minutes: slotIntervalMinutes,
    duration_minutes: durationMinutes,
    min_notice_hours: minNoticeHours,
    max_days_ahead: maxDaysAhead,
    from: range.from,
    to: range.to,
    days
  };
}

async function loadAvailabilityRow(pageId) {
  const result = await query(`SELECT * FROM page_availability WHERE page_id = $1`, [pageId]);
  return result.rows[0] ?? null;
}

async function loadActiveService(pageId, serviceId) {
  const result = await query(
    `SELECT id, duration_minutes, is_active
     FROM page_service_items
     WHERE id = $1 AND page_id = $2`,
    [serviceId, pageId]
  );
  const row = result.rows[0];
  if (!row || !row.is_active) {
    return null;
  }
  return row;
}

export async function getPageSlots(pageId, { serviceId, from, to }) {
  const [availability, service] = await Promise.all([
    loadAvailabilityRow(pageId),
    loadActiveService(pageId, serviceId)
  ]);

  if (!service) {
    return { ok: false, code: 'SERVICE_NOT_FOUND' };
  }

  const slots = generatePageSlots({
    availability,
    serviceDurationMinutes: service.duration_minutes,
    from,
    to
  });

  return {
    ok: true,
    value: {
      service_id: service.id,
      ...slots
    }
  };
}
