const passport = require('../../config/passport');
const User = require('../../models/User');

describe('Passport OAuth 2.0 Strategy Callbacks', () => {
  let googleCallback;
  let githubCallback;

  beforeAll(() => {
    // Extract the strategy callback functions registered to passport
    const googleStrategy = passport._strategies.google;
    const githubStrategy = passport._strategies.github;
    
    googleCallback = googleStrategy._verify;
    githubCallback = githubStrategy._verify;
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Google Strategy Callback', () => {
    it('should successfully link existing local user with matching email', async () => {
      const mockProfile = {
        id: 'google-999',
        displayName: 'Google Linker',
        emails: [{ value: 'linker@example.com', verified: true }],
        photos: [{ value: 'http://avatar.com/google.png' }],
      };

      const mockUser = {
        id: 'user-1',
        email: 'linker@example.com',
        googleId: null,
        authProvider: 'local',
        avatarUrl: null,
        save: vi.fn().mockResolvedValue(true),
      };

      // Mock User.findOne to not find by googleId, but find by email
      const findOneSpy = vi.spyOn(User, 'findOne')
        .mockResolvedValueOnce(null) // googleId check
        .mockResolvedValueOnce(mockUser); // email check

      const done = vi.fn();
      await googleCallback('access_token', 'refresh_token', mockProfile, done);

      expect(mockUser.googleId).toBe('google-999');
      expect(mockUser.authProvider).toBe('google');
      expect(mockUser.avatarUrl).toBe('http://avatar.com/google.png');
      expect(mockUser.save).toHaveBeenCalled();
      expect(done).toHaveBeenCalledWith(null, mockUser);
    });

    it('should create a new user profile if no matching user is found', async () => {
      const mockProfile = {
        id: 'google-777',
        displayName: 'New Google User',
        emails: [{ value: 'newgoogle@example.com', verified: true }],
        photos: [{ value: 'http://avatar.com/newgoogle.png' }],
      };

      const mockCreatedUser = {
        id: 'user-2',
        email: 'newgoogle@example.com',
        googleId: 'google-777',
        authProvider: 'google',
        save: vi.fn(),
      };

      vi.spyOn(User, 'findOne')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      const createSpy = vi.spyOn(User, 'create').mockResolvedValueOnce(mockCreatedUser);

      const done = vi.fn();
      await googleCallback('access_token', 'refresh_token', mockProfile, done);

      expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
        email: 'newgoogle@example.com',
        googleId: 'google-777',
        authProvider: 'google',
        password: null,
      }));
      expect(done).toHaveBeenCalledWith(null, mockCreatedUser);
    });

    it('should return error if email is missing in Google profile', async () => {
      const mockProfile = {
        id: 'google-888',
        displayName: 'No Email User',
        emails: [], // Empty emails list
      };

      const done = vi.fn();
      await googleCallback('access_token', 'refresh_token', mockProfile, done);

      expect(done).toHaveBeenCalledWith(expect.any(Error), null);
    });
  });

  describe('GitHub Strategy Callback', () => {
    it('should successfully link existing user with matching email', async () => {
      const mockProfile = {
        id: 'github-123',
        username: 'gitlink',
        emails: [{ value: 'gitlink@example.com', primary: true, verified: true }],
        photos: [{ value: 'http://avatar.com/git.png' }],
      };

      const mockUser = {
        id: 'user-3',
        email: 'gitlink@example.com',
        githubId: null,
        authProvider: 'local',
        avatarUrl: null,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(User, 'findOne')
        .mockResolvedValueOnce(null) // githubId check
        .mockResolvedValueOnce(mockUser); // email check

      const done = vi.fn();
      await githubCallback('access_token', 'refresh_token', mockProfile, done);

      expect(mockUser.githubId).toBe('github-123');
      expect(mockUser.authProvider).toBe('github');
      expect(mockUser.save).toHaveBeenCalled();
      expect(done).toHaveBeenCalledWith(null, mockUser);
    });

    it('should return temporary user payload if email is missing or private in GitHub profile', async () => {
      const mockProfile = {
        id: 'github-priv',
        username: 'privategit',
        emails: null, // missing email list
        photos: [{ value: 'http://avatar.com/priv.png' }],
      };

      vi.spyOn(User, 'findOne').mockResolvedValueOnce(null); // githubId check

      const done = vi.fn();
      await githubCallback('access_token', 'refresh_token', mockProfile, done);

      expect(done).toHaveBeenCalledWith(null, expect.objectContaining({
        isTemp: true,
        githubId: 'github-priv',
        name: 'privategit',
        avatarUrl: 'http://avatar.com/priv.png',
      }));
    });
  });
});
