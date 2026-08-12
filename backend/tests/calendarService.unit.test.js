
const { linkGoogleCalendar, syncToGoogleCalendar, getOAuthClient } = require('../services/calendarService');
const User = require('../models/User');
const { encryptToken, decryptToken } = require('../utils/encryption');
const { google } = require('googleapis');

// Mock User model
vi.mock('../models/User', () => ({
  default: {
    update: vi.fn(),
    findByPk: vi.fn()
  },
  update: vi.fn(),
  findByPk: vi.fn()
}));

// Mock googleapis
vi.mock('googleapis', () => {
  const mockOAuth2 = vi.fn().mockImplementation(() => ({
    setCredentials: vi.fn(),
    getToken: vi.fn().mockResolvedValue({
      tokens: { refresh_token: 'mock_refresh_token' }
    }),
  }));

  const mockCalendar = vi.fn().mockReturnValue({
    calendarList: {
      list: vi.fn().mockResolvedValue({ data: { items: [] } })
    },
    calendars: {
      insert: vi.fn().mockResolvedValue({ data: { id: 'new_cal_id', summary: 'OpenPrep AI' } })
    },
    events: {
      list: vi.fn().mockResolvedValue({ data: { items: [] } }),
      insert: vi.fn().mockResolvedValue({ data: { id: 'new_event_id' } }),
      delete: vi.fn()
    }
  });

  return {
    google: {
      auth: {
        OAuth2: mockOAuth2
      },
      calendar: mockCalendar
    }
  };
});

describe('Calendar Service', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('linkGoogleCalendar', () => {
    it('should exchange code for token and save encrypted token', async () => {
      await linkGoogleCalendar('mock_code', 'user-123');
      
      expect(User.update).toHaveBeenCalled();
      const updateArgs = User.update.mock.calls[0][0];
      
      expect(updateArgs.syncGoogleCalendar).toBe(true);
      expect(updateArgs.googleCalendarRefreshToken).toBeDefined();
      
      const decrypted = decryptToken(updateArgs.googleCalendarRefreshToken);
      expect(decrypted).toBe('mock_refresh_token');
    });
  });

  describe('syncToGoogleCalendar', () => {
    it('should throw if no refresh token', async () => {
      const mockUser = { googleCalendarRefreshToken: null };
      const plan = { dailyGoals: [] };
      
      await expect(syncToGoogleCalendar(plan, mockUser)).rejects.toThrow(/Google Calendar not linked/);
    });

    it('should create calendar and insert events', async () => {
      const mockUser = { googleCalendarRefreshToken: encryptToken('valid_refresh_token') };
      const plan = {
        id: 'plan-123',
        dailyGoals: [
          {
            date: '2024-05-01',
            tasks: [
              { title: 'Math', duration: 60 }
            ]
          }
        ]
      };
      
      await expect(syncToGoogleCalendar(plan, mockUser)).resolves.not.toThrow();
    });
  });
});
