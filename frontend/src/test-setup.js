import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
