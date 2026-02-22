function pad(value) {
  return String(value).padStart(2, '0');
}

export function getDetectedTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export function isValidTimeZone(value) {
  if (!value) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: String(value) }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function normalizeTimeZone(value, fallback = getDetectedTimeZone()) {
  const candidate = String(value || '').trim();
  if (isValidTimeZone(candidate)) return candidate;
  if (isValidTimeZone(fallback)) return fallback;
  return 'UTC';
}

export function getSupportedTimeZones(preferredTimeZone = getDetectedTimeZone()) {
  const preferred = normalizeTimeZone(preferredTimeZone);
  const supported = typeof Intl.supportedValuesOf === 'function'
    ? Intl.supportedValuesOf('timeZone')
    : [];

  const commonFallback = [
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'America/Mexico_City',
    'America/Sao_Paulo',
    'Europe/London',
    'Europe/Madrid',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Singapore',
    'Australia/Sydney',
  ];

  const set = new Set([preferred, ...supported, ...commonFallback].filter(Boolean));
  return [...set];
}

function getDatePartsInTimeZone(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const byType = Object.fromEntries(parts.map((entry) => [entry.type, entry.value]));
  return {
    year: Number(byType.year),
    month: Number(byType.month),
    day: Number(byType.day),
    hour: Number(byType.hour) % 24,
    minute: Number(byType.minute),
    second: Number(byType.second),
  };
}

function parseWallDateTime(value) {
  const match = String(value || '').trim().match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4] || 0);
  const minute = Number(match[5] || 0);
  const second = Number(match[6] || 0);

  if (!year || !month || !day) return null;

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
  };
}

function wallDateTimeToDate(value, timeZone) {
  const parsed = parseWallDateTime(value);
  if (!parsed) return null;

  const safeTimeZone = normalizeTimeZone(timeZone);
  const targetUtcMs = Date.UTC(
    parsed.year,
    parsed.month - 1,
    parsed.day,
    parsed.hour,
    parsed.minute,
    parsed.second,
    0,
  );

  let guess = new Date(targetUtcMs);

  for (let iteration = 0; iteration < 2; iteration += 1) {
    const localParts = getDatePartsInTimeZone(guess, safeTimeZone);
    const localUtcMs = Date.UTC(
      localParts.year,
      localParts.month - 1,
      localParts.day,
      localParts.hour,
      localParts.minute,
      localParts.second,
      0,
    );
    const deltaMs = targetUtcMs - localUtcMs;
    if (deltaMs === 0) break;
    guess = new Date(guess.getTime() + deltaMs);
  }

  return guess;
}

export function parseInputDate(value, options = {}) {
  if (!value) return null;

  const timeZone = normalizeTimeZone(options.timeZone);
  const raw = String(value).trim();

  if (raw.includes('/')) {
    const [day, month, year] = raw.split('/').map(Number);
    if (!day || !month || !year) return null;
    const localDateLike = `${year}-${pad(month)}-${pad(day)}T00:00:00`;
    return wallDateTimeToDate(localDateLike, timeZone);
  }

  const hasExplicitOffset = /(?:Z|[+-]\d{2}:\d{2})$/i.test(raw);
  if (!hasExplicitOffset) {
    const wallDate = wallDateTimeToDate(raw, timeZone);
    if (wallDate) return wallDate;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toDateTimeInputInTimeZone(date, timeZone = getDetectedTimeZone()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const safeTimeZone = normalizeTimeZone(timeZone);
  const parts = getDatePartsInTimeZone(date, safeTimeZone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function toLocalDateTimeInput(date) {
  return toDateTimeInputInTimeZone(date, getDetectedTimeZone());
}

export function formatDateTime(date, options = {}) {
  const safeDate = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(safeDate.getTime())) return 'Invalid date';

  const timeZone = options.timeZone ? normalizeTimeZone(options.timeZone) : undefined;
  const formatter = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...(timeZone ? { timeZone } : {}),
  });

  const parts = formatter.formatToParts(safeDate);
  const hour = parts.find((p) => p.type === 'hour')?.value || '00';
  const minute = parts.find((p) => p.type === 'minute')?.value || '00';
  const day = parts.find((p) => p.type === 'day')?.value || '01';
  const month = parts.find((p) => p.type === 'month')?.value || '01';
  const year = parts.find((p) => p.type === 'year')?.value || '2026';

  const timeStr = `${hour}:${minute}, ${day}/${month}/${year}`;
  return timeZone && options.includeTimeZone ? `${timeStr}, ${timeZone}` : timeStr;
}

export function getDateKeyInTimeZone(date, timeZone = getDetectedTimeZone()) {
  const safeDate = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(safeDate.getTime())) return '';
  const safeTimeZone = normalizeTimeZone(timeZone);
  const parts = getDatePartsInTimeZone(safeDate, safeTimeZone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

export function endOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function startOfWeek(date) {
  const result = startOfDay(date);
  const day = result.getDay();
  const diff = (day + 6) % 7;
  result.setDate(result.getDate() - diff);
  return result;
}

export function endOfWeek(date) {
  const result = startOfWeek(date);
  result.setDate(result.getDate() + 6);
  return endOfDay(result);
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function startOfYear(date) {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
}

export function endOfYear(date) {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}
