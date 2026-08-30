/**
 * Unit Tests for Calendar Conflict Resolution Utilities
 */

import { describe, it, expect } from 'vitest';
import { resolveCalendarBlockConflict } from './calendarConflictResolutionUtils';

describe('CalendarConflictResolutionUtils', () => {
  it('should detect overlapping calendar block and shift start time with buffer', () => {
    const proposed = { startISO: '2026-08-26T09:00:00Z', endISO: '2026-08-26T10:30:00Z' };
    const existing = [{ startISO: '2026-08-26T08:30:00Z', endISO: '2026-08-26T09:30:00Z' }];

    const res = resolveCalendarBlockConflict(proposed, existing);
    expect(res.hasConflict).toBe(true);
    expect(new Date(res.resolvedSlot.startISO).getTime()).toBeGreaterThan(new Date(proposed.startISO).getTime());
  });
});
