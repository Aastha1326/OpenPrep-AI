/**
 * IANA timezone-aware streak helpers.
 * Uses native Intl.DateTimeFormat (DST-aware) — no extra deps.
 * Falls back to offset-based math for backward compat when IANA invalid.
 */

function isValidTimezone(tz) {
  if (typeof tz !== 'string' || !tz) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function getLocalDateString(date, timeZone) {
  const tz = isValidTimezone(timeZone) ? timeZone : 'Asia/Kolkata';
  // en-CA → YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function getLocalHour(date, timeZone) {
  const tz = isValidTimezone(timeZone) ? timeZone : 'Asia/Kolkata';
  const hourStr = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(date);
  return Number(hourStr);
}

function toUtcDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function diffCalendarDays(todayStr, lastStr) {
  return Math.round((toUtcDate(todayStr) - toUtcDate(lastStr)) / (24 * 60 * 60 * 1000));
}

function resolveTimezone(headerTimezone, userTimezone) {
  if (isValidTimezone(headerTimezone)) return headerTimezone;
  if (isValidTimezone(userTimezone)) return userTimezone;
  return 'Asia/Kolkata';
}

// Backward compat: numeric offset → local date via offset math (legacy)
function getLocalDateStringFromOffset(date, offsetMinutes) {
  const localTime = new Date(date.getTime() - offsetMinutes * 60 * 1000);
  return localTime.toISOString().split('T')[0];
}

module.exports = {
  isValidTimezone,
  getLocalDateString,
  getLocalHour,
  diffCalendarDays,
  resolveTimezone,
  getLocalDateStringFromOffset,
};
