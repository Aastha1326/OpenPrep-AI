const { extractVideoId, YOUTUBE_REGEX } = require('../../services/youtubeService');

describe('YouTube URL Parser and Security Validator (SSRF Shield)', () => {
  test('correctly extracts 11-char video IDs from standard youtube urls', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('http://youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  test('rejects malicious SSRF url strings pointing to internal IPs or local domains', () => {
    // Should fail validation checks completely
    expect(extractVideoId('https://127.0.0.1/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(extractVideoId('https://localhost/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(extractVideoId('https://malicious-server.com/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(extractVideoId('https://youtube.com.attacker.com/watch?v=dQw4w9WgXcQ')).toBeNull();
  });
});
