/**
 * Unit Tests for WebRTC Call Quality Utilities
 */

import { describe, it, expect } from 'vitest';
import { assessWebrtcCallQuality } from './webrtcCallQualityUtils';

describe('WebrtcCallQualityUtils', () => {
  it('should assess WebRTC audio/video call stream quality correctly', () => {
    const res = assessWebrtcCallQuality(45, 0.2, 8);
    expect(res).toBeDefined();
    expect(res.callQualityCategory).toBe('EXCELLENT');
  });
});
