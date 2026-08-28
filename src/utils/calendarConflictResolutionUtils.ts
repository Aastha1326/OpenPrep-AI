/**
 * Study Time Allocation & Calendar Conflict Resolution Utilities
 */

export interface CalendarTimeSlot {
  startISO: string;
  endISO: string;
}

export interface ConflictResolutionResult {
  hasConflict: boolean;
  resolvedSlot: CalendarTimeSlot;
}

/**
 * Detects and resolves overlapping study block calendar conflicts by shifting start time.
 */
export function resolveCalendarBlockConflict(
  proposedSlot: CalendarTimeSlot,
  existingSlots: CalendarTimeSlot[]
): ConflictResolutionResult {
  let hasConflict = false;
  let currentStart = new Date(proposedSlot.startISO).getTime();
  let currentEnd = new Date(proposedSlot.endISO).getTime();
  const durationMs = currentEnd - currentStart;

  for (const slot of existingSlots) {
    const sStart = new Date(slot.startISO).getTime();
    const sEnd = new Date(slot.endISO).getTime();

    if (currentStart < sEnd && currentEnd > sStart) {
      hasConflict = true;
      currentStart = sEnd + 15 * 60 * 1000; // Shift 15 minutes buffer
      currentEnd = currentStart + durationMs;
    }
  }

  return {
    hasConflict,
    resolvedSlot: {
      startISO: new Date(currentStart).toISOString(),
      endISO: new Date(currentEnd).toISOString(),
    },
  };
}
