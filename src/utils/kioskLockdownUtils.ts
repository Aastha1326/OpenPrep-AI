/**
 * Secure Exam Environment Lockdown & Kiosk Mode Verification Utilities
 */

export interface KioskLockdownStatus {
  isFullScreenActive: boolean;
  isVirtualMachineDetected: boolean;
  isDevToolsOpen: boolean;
  isKioskEnvironmentCompliant: boolean;
}

/**
 * Verifies lockdown kiosk compliance parameters for candidate browser environment.
 */
export function verifyKioskLockdownEnvironment(
  isFullScreen: boolean,
  isVm: boolean,
  isDevTools: boolean
): KioskLockdownStatus {
  const compliant = isFullScreen && !isVm && !isDevTools;

  return {
    isFullScreenActive: isFullScreen,
    isVirtualMachineDetected: isVm,
    isDevToolsOpen: isDevTools,
    isKioskEnvironmentCompliant: compliant,
  };
}
