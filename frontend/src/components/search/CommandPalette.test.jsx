import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockGet = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../services/api', () => ({
  default: { get: (...args) => mockGet(...args) },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const { default: CommandPalette } = await import('./CommandPalette');

/**
 * The full payload /api/search returns. `results` is the hybrid-search array,
 * which only ever holds questions, flashcards and notes; the other four groups
 * come from the SQL half of the controller and are the ones the rewrite lost.
 */
const FULL_PAYLOAD = {
  data: {
    data: {
      results: [
        { id: 'n1', type: 'note', title: 'Thermo notes', subject: 'Physics', url: '/notes/n1' },
        { id: 'f1', type: 'flashcard', title: 'Thermo card', subject: 'Physics', url: '/flashcards/f1' },
      ],
      topics: [{ id: 't1', name: 'Thermodynamics', subject: 'Physics' }],
      decks: [{ id: 'd1', name: 'Thermodynamics deck', subject: 'Physics' }],
      quizzes: [{ id: 'q1', title: 'Thermodynamics quiz', subject: 'Physics' }],
      tasks: [{ id: 'p1-task-0', title: 'Revise thermodynamics', planId: 'p1' }],
    },
  },
};

const EMPTY_PAYLOAD = {
  data: { data: { results: [], topics: [], decks: [], quizzes: [], tasks: [] } },
};

function renderPalette(props = {}) {
  const onClose = vi.fn();
  const utils = render(<CommandPalette isOpen onClose={onClose} {...props} />);
  return { ...utils, onClose };
}

/** Type into the box and let the 150ms debounce elapse. */
async function typeAndSettle(user, text) {
  await user.type(screen.getByRole('combobox'), text);
  await act(async () => {
    vi.advanceTimersByTime(200);
  });
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  mockGet.mockReset();
  mockNavigate.mockReset();
  mockGet.mockResolvedValue(FULL_PAYLOAD);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('CommandPalette — rendering', () => {
  it('renders nothing when closed', () => {
    render(<CommandPalette isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('prompts for a query before anything is typed', () => {
    renderPalette();

    expect(screen.getByText(/type a keyword/i)).toBeInTheDocument();
    expect(mockGet).not.toHaveBeenCalled();
  });
});

describe('CommandPalette — result groups', () => {
  it('shows every group the API returns, not just the hybrid results', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPalette();

    await typeAndSettle(user, 'thermo');

    // The regression: the rewrite read only data.results, so the four SQL
    // groups vanished from the UI while still being in the payload.
    await waitFor(() => expect(screen.getByText('Thermo notes')).toBeInTheDocument());
    expect(screen.getByText('Thermodynamics')).toBeInTheDocument();
    expect(screen.getByText('Thermodynamics deck')).toBeInTheDocument();
    expect(screen.getByText('Thermodynamics quiz')).toBeInTheDocument();
    expect(screen.getByText('Revise thermodynamics')).toBeInTheDocument();
  });

  it('labels each group', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPalette();

    await typeAndSettle(user, 'thermo');

    await waitFor(() => expect(screen.getByText('Topics')).toBeInTheDocument());
    expect(screen.getByText('Decks')).toBeInTheDocument();
    expect(screen.getByText('Quizzes')).toBeInTheDocument();
    expect(screen.getByText('Study plan')).toBeInTheDocument();
  });

  it('reports a genuine no-match', async () => {
    mockGet.mockResolvedValue(EMPTY_PAYLOAD);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPalette();

    await typeAndSettle(user, 'nothingmatches');

    await waitFor(() => expect(screen.getByText(/no results found/i)).toBeInTheDocument());
  });
});

describe('CommandPalette — clearing the query', () => {
  it('empties the list when the input is cleared', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPalette();

    await typeAndSettle(user, 'thermo');
    await waitFor(() => expect(screen.getByText('Thermo notes')).toBeInTheDocument());

    await user.clear(screen.getByRole('combobox'));
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    // The old build returned early without touching state, so the previous
    // query's hits stayed on screen under an empty box.
    expect(screen.queryByText('Thermo notes')).not.toBeInTheDocument();
    expect(screen.getByText(/type a keyword/i)).toBeInTheDocument();
  });
});

describe('CommandPalette — pending state', () => {
  it('shows a pending indicator from the keystroke, not the end of the debounce', async () => {
    let resolveRequest;
    mockGet.mockImplementation(
      () => new Promise((resolve) => { resolveRequest = resolve; })
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPalette();

    await user.type(screen.getByRole('combobox'), 'thermo');

    // Still inside the debounce window: the old build rendered the previous
    // state here with no indication that anything was happening.
    expect(screen.getByRole('status')).toHaveTextContent(/searching/i);

    await act(async () => {
      vi.advanceTimersByTime(200);
      resolveRequest(FULL_PAYLOAD);
    });
  });
});

describe('CommandPalette — errors', () => {
  it('says the search failed instead of showing no results', async () => {
    mockGet.mockRejectedValue({ response: { data: { error: 'Search index unavailable' } } });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPalette();

    await typeAndSettle(user, 'thermo');

    // A 500 is not the same as a genuine no-match, and /api/search can still
    // fail on a cold index.
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Search index unavailable'));
    expect(screen.queryByText(/no results found/i)).not.toBeInTheDocument();
  });

  it('falls back to a generic message when the server sends none', async () => {
    mockGet.mockRejectedValue(new Error('Network Error'));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPalette();

    await typeAndSettle(user, 'thermo');

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/unavailable/i));
  });
});

describe('CommandPalette — filters', () => {
  it('sends the selected type to the API', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPalette();

    await typeAndSettle(user, 'thermo');
    await waitFor(() => expect(screen.getByText('Thermo notes')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Notes' }));
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    await waitFor(() =>
      expect(mockGet).toHaveBeenLastCalledWith('/search?q=thermo&type=note')
    );
  });

  it('drops the previous filter’s results immediately', async () => {
    let resolveRequest;
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPalette();

    await typeAndSettle(user, 'thermo');
    await waitFor(() => expect(screen.getByText('Thermo notes')).toBeInTheDocument());

    mockGet.mockImplementation(() => new Promise((resolve) => { resolveRequest = resolve; }));
    await user.click(screen.getByRole('button', { name: 'Notes' }));

    // Stale hits used to linger for the whole debounce plus round trip, with
    // the keyboard cursor still pointing into them.
    expect(screen.queryByText('Thermo notes')).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(200);
      resolveRequest(EMPTY_PAYLOAD);
    });
  });

  it('hides the untyped SQL groups when a type filter is active', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPalette();

    await typeAndSettle(user, 'thermo');
    await waitFor(() => expect(screen.getByText('Thermodynamics deck')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Notes' }));
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    // Topics, decks, quizzes and tasks carry no type, so narrowing to one
    // type cannot honestly include them.
    await waitFor(() => expect(screen.queryByText('Thermodynamics deck')).not.toBeInTheDocument());
    expect(screen.getByText('Thermo notes')).toBeInTheDocument();
  });
});

describe('CommandPalette — keyboard navigation', () => {
  it('walks the whole flattened list across group boundaries', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPalette();

    await typeAndSettle(user, 'thermo');
    await waitFor(() => expect(screen.getByText('Thermo notes')).toBeInTheDocument());

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(6);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    // Two down-arrows from the second hybrid result lands in the Topics group.
    await user.keyboard('{ArrowDown}{ArrowDown}');

    expect(screen.getAllByRole('option')[2]).toHaveAttribute('aria-selected', 'true');
  });

  it('wraps around at the end of the list', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPalette();

    await typeAndSettle(user, 'thermo');
    await waitFor(() => expect(screen.getByText('Thermo notes')).toBeInTheDocument());

    await user.keyboard('{ArrowUp}');

    expect(screen.getAllByRole('option')[5]).toHaveAttribute('aria-selected', 'true');
  });

  it('navigates to a hybrid result on Enter', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPalette();

    await typeAndSettle(user, 'thermo');
    await waitFor(() => expect(screen.getByText('Thermo notes')).toBeInTheDocument());

    await user.keyboard('{Enter}');

    expect(mockNavigate).toHaveBeenCalledWith('/notes/n1');
  });

  it('builds the right url for each restored group', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPalette();

    await typeAndSettle(user, 'thermo');
    await waitFor(() => expect(screen.getByText('Thermodynamics deck')).toBeInTheDocument());

    await user.click(screen.getByText('Thermodynamics deck'));

    expect(mockNavigate).toHaveBeenCalledWith('/flashcards?deckId=d1');
  });

  it('routes a topic to the flashcards view', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPalette();

    await typeAndSettle(user, 'thermo');
    await waitFor(() => expect(screen.getByText('Thermodynamics')).toBeInTheDocument());

    await user.click(screen.getByText('Thermodynamics'));

    expect(mockNavigate).toHaveBeenCalledWith('/flashcards?topicId=t1');
  });

  it('routes a quiz and a task', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { unmount } = renderPalette();

    await typeAndSettle(user, 'thermo');
    await waitFor(() => expect(screen.getByText('Thermodynamics quiz')).toBeInTheDocument());
    await user.click(screen.getByText('Thermodynamics quiz'));
    expect(mockNavigate).toHaveBeenCalledWith('/quiz/q1');

    unmount();
    mockNavigate.mockReset();

    renderPalette();
    await typeAndSettle(user, 'thermo');
    await waitFor(() => expect(screen.getByText('Revise thermodynamics')).toBeInTheDocument());
    await user.click(screen.getByText('Revise thermodynamics'));
    expect(mockNavigate).toHaveBeenCalledWith('/study-planner');
  });

  it('does nothing on Enter with an empty list', async () => {
    mockGet.mockResolvedValue(EMPTY_PAYLOAD);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPalette();

    await typeAndSettle(user, 'nothing');
    await waitFor(() => expect(screen.getByText(/no results found/i)).toBeInTheDocument());

    await user.keyboard('{Enter}');

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe('CommandPalette — closing', () => {
  it('closes on Escape', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { onClose } = renderPalette();

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  it('closes on the close button', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { onClose } = renderPalette();

    await user.click(screen.getByRole('button', { name: /close search/i }));

    expect(onClose).toHaveBeenCalled();
  });

  it('closes after selecting a result', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { onClose } = renderPalette();

    await typeAndSettle(user, 'thermo');
    await waitFor(() => expect(screen.getByText('Thermo notes')).toBeInTheDocument());

    await user.click(screen.getByText('Thermo notes'));

    expect(onClose).toHaveBeenCalled();
  });
});
