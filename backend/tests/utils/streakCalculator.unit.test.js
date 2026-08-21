const {
  isValidTimezone,
  getLocalDateString,
  getLocalHour,
  diffCalendarDays,
  resolveTimezone,
  getLocalDateStringFromOffset,
} = require('../../utils/streakCalculator');

describe('streakCalculator — IANA timezone aware', () => {
  test('isValidTimezone validates IANA strings', () => {
    expect(isValidTimezone('Asia/Kolkata')).toBe(true);
    expect(isValidTimezone('America/New_York')).toBe(true);
    expect(isValidTimezone('UTC')).toBe(true);
    expect(isValidTimezone('Pacific/Kiritimati')).toBe(true); // UTC+14
    expect(isValidTimezone('Etc/GMT+12')).toBe(true); // UTC-12
    expect(isValidTimezone('Invalid/Zone')).toBe(false);
    expect(isValidTimezone('')).toBe(false);
    expect(isValidTimezone(null)).toBe(false);
  });

  test('resolveTimezone prefers header, then user, then default', () => {
    expect(resolveTimezone('Asia/Kolkata', 'America/New_York')).toBe('Asia/Kolkata');
    expect(resolveTimezone('Invalid/Zone', 'America/New_York')).toBe('America/New_York');
    expect(resolveTimezone(null, 'America/New_York')).toBe('America/New_York');
    expect(resolveTimezone(null, null)).toBe('Asia/Kolkata');
    expect(resolveTimezone('Invalid/Zone', null)).toBe('Asia/Kolkata');
  });

  // 15 distinct global timezones — local calendar day correctness
  const zones = [
    'Pacific/Kiritimati', // UTC+14
    'Pacific/Auckland', // UTC+12/13
    'Asia/Tokyo', // UTC+9
    'Asia/Shanghai', // UTC+8
    'Asia/Kolkata', // UTC+5:30
    'Asia/Kathmandu', // UTC+5:45
    'Asia/Dubai', // UTC+4
    'Europe/Moscow', // UTC+3
    'Europe/Berlin', // UTC+1/2
    'UTC', // UTC+0
    'America/New_York', // UTC-5/-4
    'America/Chicago', // UTC-6/-5
    'America/Denver', // UTC-7/-6
    'America/Los_Angeles', // UTC-8/-7
    'Pacific/Honolulu', // UTC-10
    'Etc/GMT+12', // UTC-12
  ];

  test.each(zones)('getLocalDateString returns YYYY-MM-DD for %s', (tz) => {
    const d = new Date('2026-03-15T12:00:00.000Z');
    const str = getLocalDateString(d, tz);
    expect(str).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('IST midnight edge: 00:01 local is correct calendar day', () => {
    // 2026-03-15 18:31 UTC = 2026-03-16 00:01 Asia/Kolkata (UTC+5:30)
    const utc = new Date('2026-03-15T18:31:00.000Z');
    expect(getLocalDateString(utc, 'Asia/Kolkata')).toBe('2026-03-16');
    // Same instant in UTC should be previous day
    expect(getLocalDateString(utc, 'UTC')).toBe('2026-03-15');
  });

  test('UTC+14 (Kiribati) and UTC-12 edge', () => {
    const utc = new Date('2026-01-01T10:00:00.000Z');
    // 10:00 UTC = 00:00 next day in UTC+14 (2026-01-02)
    expect(getLocalDateString(utc, 'Pacific/Kiritimati')).toBe('2026-01-02');
    // 10:00 UTC = 22:00 previous day in UTC-12 (2025-12-31 for Etc/GMT+12 which is UTC-12)
    expect(getLocalDateString(utc, 'Etc/GMT+12')).toBe('2025-12-31');
  });

  test('DST forward: America/New_York spring forward 2026-03-08', () => {
    // DST starts 2026-03-08 02:00 -> 03:00 local (07:00 UTC)
    // 06:59 UTC = 01:59 EST (before jump)
    const before = new Date('2026-03-08T06:59:00.000Z');
    expect(getLocalDateString(before, 'America/New_York')).toBe('2026-03-08');
    expect(getLocalHour(before, 'America/New_York')).toBe(1);
    // 07:00 UTC = 03:00 EDT (after jump, 2am skipped)
    const after = new Date('2026-03-08T07:00:00.000Z');
    expect(getLocalDateString(after, 'America/New_York')).toBe('2026-03-08');
    expect(getLocalHour(after, 'America/New_York')).toBe(3);
    // Same calendar day, so diff should be 0
    expect(diffCalendarDays(getLocalDateString(after, 'America/New_York'), getLocalDateString(before, 'America/New_York'))).toBe(0);
  });

  test('DST backward: America/New_York fall back 2026-11-01', () => {
    // DST ends 2026-11-01 02:00 -> 01:00 (06:00 UTC)
    // 05:00 UTC = 01:00 EDT (first 1am)
    const first = new Date('2026-11-01T05:00:00.000Z');
    expect(getLocalHour(first, 'America/New_York')).toBe(1);
    // 06:00 UTC = 01:00 EST (second 1am after fall back)
    const second = new Date('2026-11-01T06:00:00.000Z');
    expect(getLocalHour(second, 'America/New_York')).toBe(1);
    expect(getLocalDateString(first, 'America/New_York')).toBe('2026-11-01');
    expect(getLocalDateString(second, 'America/New_York')).toBe('2026-11-01');
  });

  test('diffCalendarDays consecutive days across timezones', () => {
    // User in IST completing at 00:01 next day should be +1
    const last = '2026-03-15';
    const todayIST = getLocalDateString(new Date('2026-03-15T18:31:00.000Z'), 'Asia/Kolkata'); // 2026-03-16
    expect(todayIST).toBe('2026-03-16');
    expect(diffCalendarDays(todayIST, last)).toBe(1);
    // Same UTC instant for PST user (UTC-8) is still 2026-03-15
    const todayPST = getLocalDateString(new Date('2026-03-15T18:31:00.000Z'), 'America/Los_Angeles');
    expect(todayPST).toBe('2026-03-15');
    expect(diffCalendarDays(todayPST, last)).toBe(0);
  });

  test('getLocalHour Night Owl boundaries', () => {
    // 03:00 IST = 21:30 UTC previous day
    const threeAmIST = new Date('2026-03-15T21:30:00.000Z'); // 03:00 Asia/Kolkata on 16th
    expect(getLocalHour(threeAmIST, 'Asia/Kolkata')).toBe(3);
    expect(getLocalHour(threeAmIST, 'UTC')).toBe(21);
  });

  test('legacy offset fallback', () => {
    const d = new Date('2026-03-15T18:31:00.000Z');
    // -330 for IST
    expect(getLocalDateStringFromOffset(d, -330)).toBe('2026-03-16');
    // 0 for UTC
    expect(getLocalDateStringFromOffset(d, 0)).toBe('2026-03-15');
  });

  test('completing task 12:01 AM to 11:59 PM local marks same calendar day', () => {
    // IST day 2026-03-16 runs from 2026-03-15T18:30Z to 2026-03-16T18:29:59Z
    const start = new Date('2026-03-15T18:31:00.000Z'); // 00:01 IST 16th
    const end = new Date('2026-03-16T18:29:00.000Z'); // 23:59 IST 16th
    expect(getLocalDateString(start, 'Asia/Kolkata')).toBe('2026-03-16');
    expect(getLocalDateString(end, 'Asia/Kolkata')).toBe('2026-03-16');
    expect(diffCalendarDays(getLocalDateString(end, 'Asia/Kolkata'), getLocalDateString(start, 'Asia/Kolkata'))).toBe(0);
  });
});
