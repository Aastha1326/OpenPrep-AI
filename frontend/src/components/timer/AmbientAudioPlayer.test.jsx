import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AmbientAudioPlayer from './AmbientAudioPlayer';

// Mock HTMLAudioElement
const mockPlay = vi.fn().mockResolvedValue(undefined);
const mockPause = vi.fn();

beforeEach(() => {
  mockPlay.mockClear();
  mockPause.mockClear();

  class MockAudio {
    constructor() {
      this._volume = 0;
    }
    play() { return mockPlay(); }
    pause() { mockPause(); }
    get volume() { return this._volume; }
    set volume(v) { this._volume = v; }
    get loop() { return false; }
    set loop(_v) {}
    get preload() { return ''; }
    set preload(_v) {}
    get src() { return ''; }
    set src(_v) {}
  }

  // @ts-ignore
  globalThis.Audio = MockAudio;
});

describe('AmbientAudioPlayer', () => {
  it('renders the sound selector button', () => {
    render(<AmbientAudioPlayer />);
    expect(screen.getByRole('button', { name: /select ambient sound/i })).toBeInTheDocument();
  });

  it('renders the mute button', () => {
    render(<AmbientAudioPlayer />);
    expect(screen.getByRole('button', { name: /mute ambient audio/i })).toBeInTheDocument();
  });

  it('renders the volume slider', () => {
    render(<AmbientAudioPlayer />);
    expect(screen.getByRole('slider', { name: /ambient audio volume/i })).toBeInTheDocument();
  });

  it('toggles mute', () => {
    render(<AmbientAudioPlayer />);
    const muteBtn = screen.getByRole('button', { name: /mute ambient audio/i });
    fireEvent.click(muteBtn);
    expect(screen.getByRole('button', { name: /unmute ambient audio/i })).toBeInTheDocument();
  });

  it('opens sound dropdown and shows all options', () => {
    render(<AmbientAudioPlayer />);
    fireEvent.click(screen.getByRole('button', { name: /select ambient sound/i }));
    expect(screen.getAllByText('Rain').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('White Noise').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Coffee Shop').length).toBeGreaterThanOrEqual(1);
  });
});
