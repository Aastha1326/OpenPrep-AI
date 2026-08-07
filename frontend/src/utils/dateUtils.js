const pad = (n) => String(n).padStart(2, '0');

/**
 * Returns a plain YYYY-MM-DD string from a Date-like value using LOCAL date
 * components. Avoids the UTC day-shift caused by `toISOString().split('T')[0]`
 * for users in non-UTC timezones (e.g. GMT+5:30 IST).
 */
export function toLocalDateString(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Parses a date-like value (plain YYYY-MM-DD or ISO timestamp) into a Date.
 * Plain YYYY-MM-DD strings are constructed at LOCAL midnight so formatting them
 * later never shifts the calendar day to the previous day in any timezone.
 */
export function parseDateOnly(value) {
  if (!value) return null;
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Normalizes a date-like value into a plain YYYY-MM-DD string. Already-plain
 * strings are returned untouched so stored schedule dates round-trip cleanly.
 */
export function toDateOnlyString(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return toLocalDateString(value);
}

/**
 * Formats a date-like value for display using the user's locale, interpreting
 * plain YYYY-MM-DD strings as local dates (no UTC interpretation).
 */
export function formatDateOnly(value, options = {}) {
  const d = parseDateOnly(value);
  if (!d) return '';
  return d.toLocaleDateString(undefined, options);
}
