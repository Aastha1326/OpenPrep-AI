const pad = (n) => String(n).padStart(2, '0');

/**
 * Returns a plain YYYY-MM-DD string from a Date-like value using LOCAL date
 * components. Unlike `date.toISOString().split('T')[0]`, this never shifts the
 * calendar day for users in non-UTC timezones (e.g. GMT+5:30 IST where local
 * midnight Oct 10 becomes Oct 09T18:30Z in UTC).
 */
function toLocalDateString(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Normalizes any date-like value (Date, ISO timestamp, or an already-plain
 * YYYY-MM-DD string) into a plain YYYY-MM-DD string using local components.
 * Already-plain strings are returned untouched so study schedule dates stored as
 * YYYY-MM-DD round-trip through the database without any timezone conversion.
 */
function toDateOnlyString(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return toLocalDateString(value);
}

module.exports = { toLocalDateString, toDateOnlyString };
