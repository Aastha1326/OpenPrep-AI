import { render, screen, fireEvent } from '@testing-library/react';
import API from '../../services/api';
import NotesWidget from './NotesWidget';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockNotes = [
  { id: 'n1', title: 'Data Structures', subject: { name: 'Computer Science' }, content: 'linked lists' },
  { id: 'n2', title: 'Calculus', subject: { name: 'Mathematics' }, content: 'integrals' },
];

const mockSummary = {
  summary: 'A concise revision summary of the uploaded lecture notes.',
  keyConcepts: ['Arrays: contiguous memory', 'Recursion: base case'],
  examTips: ['Practice time complexity analysis', 'Revise recursion trees'],
};

const setupSpeech = () => {
  global.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text;
      this.rate = 1;
      this.onboundary = null;
      this.onend = null;
      this.onerror = null;
    }
  };
  Object.defineProperty(window, 'speechSynthesis', {
    writable: true,
    configurable: true,
    value: { speak: vi.fn(), cancel: vi.fn() },
  });
};

afterEach(() => {
  delete window.speechSynthesis;
  delete global.SpeechSynthesisUtterance;
  vi.clearAllMocks();
});

describe('NotesWidget', () => {
  it('shows an empty state when there are no notes', async () => {
    API.get.mockResolvedValue({ data: { data: [] } });
    render(<NotesWidget />);
    expect(await screen.findByText(/No notes yet/)).toBeInTheDocument();
  });

  it('renders the list of notes with summarize buttons', async () => {
    API.get.mockResolvedValue({ data: { data: mockNotes } });
    render(<NotesWidget />);

    expect(await screen.findByText('Data Structures')).toBeInTheDocument();
    expect(screen.getByText('Calculus')).toBeInTheDocument();
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    expect(screen.getAllByText('Summarize')).toHaveLength(2);
  });

  it('generates a summary on demand and shows the audio reader', async () => {
    API.get.mockResolvedValue({ data: { data: mockNotes } });
    API.post.mockResolvedValue({ data: { data: mockSummary } });
    setupSpeech();
    render(<NotesWidget />);

    fireEvent.click((await screen.findAllByText('Summarize'))[0]);

    expect(API.post).toHaveBeenCalledWith('/notes/n1/summarize');
    expect(await screen.findByText(/A concise revision summary/)).toBeInTheDocument();
    expect(screen.getByText('Arrays: contiguous memory')).toBeInTheDocument();
    expect(screen.getByText('Practice time complexity analysis')).toBeInTheDocument();
    expect(screen.getByLabelText('Listen to text')).toBeInTheDocument();
  });

  it('shows an error when loading notes fails and can retry', async () => {
    API.get.mockRejectedValue({ response: { data: { error: 'Server error' } } });
    render(<NotesWidget />);

    expect(await screen.findByText('Server error')).toBeInTheDocument();

    API.get.mockResolvedValue({ data: { data: mockNotes } });
    fireEvent.click(screen.getByText('Retry'));
    expect(await screen.findByText('Data Structures')).toBeInTheDocument();
  });
});
