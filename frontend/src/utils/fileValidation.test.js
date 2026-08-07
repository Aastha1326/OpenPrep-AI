import { describe, it, expect } from 'vitest';
import { validateAvatarFile } from './fileValidation';

describe('validateAvatarFile', () => {
  it('should return error if no file is provided', () => {
    const result = validateAvatarFile(null);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('No file selected');
  });

  it('should pass for valid MIME types under 5MB', () => {
    const validMimes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

    validMimes.forEach((mime) => {
      const file = new File(['mock content'], 'avatar.png', { type: mime });
      const result = validateAvatarFile(file);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  it('should fail for unsupported MIME types', () => {
    const file = new File(['mock content'], 'notes.txt', { type: 'text/plain' });
    const result = validateAvatarFile(file);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Invalid file format');
  });

  it('should fail if file size exceeds 5MB limit', () => {
    const hugeFile = {
      name: 'avatar.png',
      type: 'image/png',
      size: 6 * 1024 * 1024, // 6MB
    };

    const result = validateAvatarFile(hugeFile);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('File size too large');
  });
});
