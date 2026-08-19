/**
 * MVP Mock for Google Calendar Sync (Issue #1294)
 */

class CalendarSyncService {
  /**
   * Mock sync payload simulating bidirectional calendar event resolution.
   */
  async syncTimetable(userId, localEvents) {
    console.log(`[CalendarSync] Syncing ${localEvents.length} events for user ${userId} to external providers.`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    // For the MVP, we just echo back the successful sync.
    // In production, this would handle OAuth tokens, Google Calendar REST API, and conflict resolution.
    return {
      success: true,
      provider: 'Google Calendar (Mock)',
      syncedCount: localEvents.length,
      conflictsResolved: 0
    };
  }

  /**
   * Mock OAuth linking
   */
  async linkGoogleAccount(userId, authCode) {
    console.log(`[CalendarSync] Linking Google Account for ${userId} with code ${authCode}`);
    return { success: true, email: 'student@example.com' };
  }
}

module.exports = new CalendarSyncService();
