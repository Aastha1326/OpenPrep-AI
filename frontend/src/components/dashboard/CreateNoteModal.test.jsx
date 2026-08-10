import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateNoteModal from './CreateNoteModal';

const mockPost = vi.fn();

vi.mock('../../services/api', () => ({
  default: {
    post: (...args) => mockPost(...args),
    put: vi.fn(() => Promise.resolve({ data: { success: true } })),
    get: vi.fn(() => Promise.resolve({ data: { success: true, data: [{ id: 'sub-123', name: 'Chemistry' }] } })),
  },
}));

vi.mock('react-quill', () => {
  const ReactQuill = ({ value, onChange, placeholder }) => (
    <div data-testid="quill-editor">
      <input
        data-testid="quill-input"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
  return { default: ReactQuill };
});

const renderModal = (overrides = {}) => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onNoteCreated: vi.fn(),
    ...overrides,
  };
  return { ...render(<CreateNoteModal {...defaultProps} />), ...defaultProps };
};

describe('CreateNoteModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('does not render when isOpen is false', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText('Create Note')).not.toBeInTheDocument();
  });

  test('renders the modal when isOpen is true', () => {
    renderModal();
    expect(screen.getByText('Create Note')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter note title...')).toBeInTheDocument();
  });

  test('shows error when title is empty', async () => {
    renderModal();
    fireEvent.click(screen.getByText('Save Note'));
    expect(await screen.findByText('Title is required')).toBeInTheDocument();
  });

  test('shows error when content is empty', async () => {
    renderModal();
    fireEvent.change(screen.getByPlaceholderText('Enter note title...'), {
      target: { value: 'My Note' },
    });
    fireEvent.click(screen.getByText('Save Note'));
    expect(await screen.findByText('Content is required')).toBeInTheDocument();
  });

  test('does not send Content-Type header, letting axios auto-detect boundary', async () => {
    mockPost.mockResolvedValueOnce({ data: { success: true } });
    const { onClose, onNoteCreated } = renderModal();

    fireEvent.change(screen.getByPlaceholderText('Enter note title...'), {
      target: { value: 'Test Note' },
    });
    fireEvent.change(screen.getByTestId('quill-input'), {
      target: { value: 'Some content' },
    });
    fireEvent.click(screen.getByText('Save Note'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    const [, , config] = mockPost.mock.calls[0];
    expect(config.headers['Content-Type']).toBeUndefined();
  });

  test('calls onNoteCreated and onClose on success', async () => {
    mockPost.mockResolvedValueOnce({ data: { success: true, data: { id: '1' } } });
    const { onClose, onNoteCreated } = renderModal();

    fireEvent.change(screen.getByPlaceholderText('Enter note title...'), {
      target: { value: 'Test Note' },
    });
    fireEvent.change(screen.getByTestId('quill-input'), {
      target: { value: 'Some content' },
    });
    fireEvent.click(screen.getByText('Save Note'));

    await waitFor(() => {
      expect(onNoteCreated).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  test('shows error on API failure', async () => {
    mockPost.mockRejectedValueOnce({
      response: { data: { error: 'Server error' } },
    });
    renderModal();

    fireEvent.change(screen.getByPlaceholderText('Enter note title...'), {
      target: { value: 'Test Note' },
    });
    fireEvent.change(screen.getByTestId('quill-input'), {
      target: { value: 'Some content' },
    });
    fireEvent.click(screen.getByText('Save Note'));

    expect(await screen.findByText('Server error')).toBeInTheDocument();
  });

  test('closes modal when Cancel is clicked', () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  test('closes modal when X button is clicked', () => {
    const { onClose } = renderModal();
    const headerButtons = document.querySelectorAll('.flex.items-center.justify-between button');
    fireEvent.click(headerButtons[0]);
    expect(onClose).toHaveBeenCalled();
  });
});
