const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function pad2(value) {
  return String(value).padStart(2, '0');
}

function partsMap(date, timeZone, options) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, ...options }).formatToParts(date);
  const map = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  }
  return map;
}

export function isValidDateOnly(value) {
  if (typeof value !== 'string' || !DATE_ONLY_RE.test(value)) {
    return false;
  }

  const [, y, m, d] = value.match(DATE_ONLY_RE);
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return (
    date.getUTCFullYear() === Number(y) &&
    date.getUTCMonth() === Number(m) - 1 &&
    date.getUTCDate() === Number(d)
  );
}

export function parseTimeHm(value) {
  if (typeof value !== 'string' || !TIME_RE.test(value)) {
    return null;
  }

  const [, hh, mm] = value.match(TIME_RE);
  return Number(hh) * 60 + Number(mm);
}

export function formatTimeHm(totalMinutes) {
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  return `${pad2(hh)}:${pad2(mm)}`;
}

export function formatDateInTimeZone(date, timeZone) {
  const parts = partsMap(date, timeZone, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function todayInTimeZone(timeZone) {
  return formatDateInTimeZone(new Date(), timeZone);
}

export function weekdayIndexInTimeZone(date, timeZone) {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date);
  return WEEKDAY_SHORT.indexOf(weekday);
}

export function dayMetaForDateIso(dateIso, timeZone) {
  const [y, m, d] = dateIso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const weekdayIndex = weekdayIndexInTimeZone(date, timeZone);

  return {
    date: dateIso,
    weekday: WEEKDAY_SHORT[weekdayIndex] ?? 'Sun',
    day_num: Number(
      new Intl.DateTimeFormat('en-US', { timeZone, day: 'numeric' }).format(date)
    ),
    month: MONTH_SHORT[Number(m) - 1] ?? MONTH_SHORT[date.getUTCMonth()]
  };
}

function timezoneOffsetMs(timeZone, date) {
  const parts = partsMap(date, timeZone, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  return asUtc - date.getTime();
}

export function zonedLocalToUtcMs(dateIso, timeHm, timeZone) {
  const minutes = parseTimeHm(timeHm);
  if (minutes === null || !isValidDateOnly(dateIso)) {
    return null;
  }

  const [y, m, d] = dateIso.split('-').map(Number);
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  const utcGuess = Date.UTC(y, m - 1, d, hh, mm, 0);
  const offset = timezoneOffsetMs(timeZone, new Date(utcGuess));
  return utcGuess - offset;
}

export function addDaysToDateIso(dateIso, days) {
  const [y, m, d] = dateIso.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  return `${next.getUTCFullYear()}-${pad2(next.getUTCMonth() + 1)}-${pad2(next.getUTCDate())}`;
}

export function eachDateIsoInRange(fromIso, toIso, callback) {
  if (!isValidDateOnly(fromIso) || !isValidDateOnly(toIso) || fromIso > toIso) {
    return;
  }

  let current = fromIso;
  while (current <= toIso) {
    callback(current);
    current = addDaysToDateIso(current, 1);
  }
}
