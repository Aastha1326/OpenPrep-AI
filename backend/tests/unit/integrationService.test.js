import { describe, it, expect } from 'vitest';
import integrationService from '../../services/integrationService';
import iCalExportService from '../../services/iCalExportService';

describe('Integration Services Unit Tests', () => {
  it('should generate a valid Google OAuth consent URL containing required scopes', () => {
    const url = integrationService.getGoogleAuthUrl('user-123');
    expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(url).toContain('calendar.events');
    expect(url).toContain('state=user-123');
  });

  it('should generate valid RFC 5545 iCalendar stream', () => {
    const events = [
      {
        id: 'evt-1',
        title: 'Algorithms Sprint',
        description: 'Dynamic Programming & Graphs',
        startTime: new Date('2026-09-01T10:00:00Z').toISOString(),
        endTime: new Date('2026-09-01T12:00:00Z').toISOString(),
      },
    ];

    const ics = iCalExportService.generateICalendarFeed(events);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:📚 Algorithms Sprint');
    expect(ics).toContain('END:VCALENDAR');
  });
});
