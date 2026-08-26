import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AiAssistant from './AiAssistant';
import API from '../services/api';

// Mock the API client
vi.mock('../services/api.js', () => ({
  default: {
    post: vi.fn(),
  },
}));

// Mock canvas draw context
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
}));

describe('AiAssistant Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock SpeechRecognition
    window.SpeechRecognition = vi.fn().mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    window.webkitSpeechRecognition = window.SpeechRecognition;

    // Mock SpeechSynthesis
    window.speechSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: vi.fn(() => []),
    };

    // Mock getUserMedia
    navigator.mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: vi.fn(() => [{ stop: vi.fn() }]),
      }),
    };

    // Mock AudioContext
    window.AudioContext = vi.fn().mockImplementation(() => ({
      createAnalyser: vi.fn(() => ({
        frequencyBinCount: 32,
        getByteFrequencyData: vi.fn(),
      })),
      createMediaStreamSource: vi.fn(() => ({
        connect: vi.fn(),
      })),
      close: vi.fn().mockResolvedValue(undefined),
    }));
    window.webkitAudioContext = window.AudioContext;
  });

  afterEach(() => {
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;
    delete window.speechSynthesis;
    delete window.AudioContext;
    delete window.webkitAudioContext;
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AiAssistant />
      </BrowserRouter>
    );
  };

  test('renders welcome message and components correctly', () => {
    renderComponent();

    expect(screen.getByText('AI Study Mentor')).toBeInTheDocument();
    expect(
      screen.getByText(/Hello! I am your AI Study Mentor. You can ask me any academic question/i)
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Speak or type your concept question here.../i)).toBeInTheDocument();
  });

  test('allows typing a query and submitting to Gemini pipeline', async () => {
    API.post.mockResolvedValueOnce({
      data: {
        success: true,
        text: 'Dynamic explanation of Photosynthesis.',
      },
    });

    renderComponent();

    const input = screen.getByPlaceholderText(/Speak or type your concept question here.../i);
    const sendBtn = screen.getByRole('button', { name: '' }); // the send icon button

    fireEvent.change(input, { target: { value: 'Explain Photosynthesis' } });
    fireEvent.click(sendBtn);

    // Verify user message appears in list
    expect(screen.getByText('Explain Photosynthesis')).toBeInTheDocument();

    // Verify loading indicator is displayed
    expect(screen.getByText((content, element) => element.className.includes('animate-bounce'))).toBeInTheDocument();

    // Wait for AI reply
    await waitFor(() => {
      expect(screen.getByText('Dynamic explanation of Photosynthesis.')).toBeInTheDocument();
    });

    expect(API.post).toHaveBeenCalledWith('/ai/chat', {
      message: 'Explain Photosynthesis',
      history: [],
    });
  });

  test('toggles speech synthesis when read aloud button is clicked', () => {
    renderComponent();

    const ttsBtn = screen.getByTitle('Enable AI read-aloud');
    expect(ttsBtn).toBeInTheDocument();

    // Toggle on
    fireEvent.click(ttsBtn);
    expect(screen.getByTitle('Mute AI read-aloud')).toBeInTheDocument();

    // Toggle off
    fireEvent.click(screen.getByTitle('Mute AI read-aloud'));
    expect(screen.getByTitle('Enable AI read-aloud')).toBeInTheDocument();
  });
});

