/**
 * Unit Tests for Kiosk Lockdown Utilities
 */

import { describe, it, expect } from 'vitest';
import { verifyKioskLockdownEnvironment } from './kioskLockdownUtils';

describe('KioskLockdownUtils', () => {
  it('should verify compliant secure browser kiosk mode', () => {
    const res = verifyKioskLockdownEnvironment(true, false, false);
    expect(res.isKioskEnvironmentCompliant).toBe(true);
  });

  it('should flag non-compliant environment when virtual machine or devtools detected', () => {
    const res = verifyKioskLockdownEnvironment(true, true, false);
    expect(res.isKioskEnvironmentCompliant).toBe(false);
  });
});
