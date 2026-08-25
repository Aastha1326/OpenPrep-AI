import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import interviewReducer from '../../store/slices/interviewSlice';
import { CollaborativeInterviewRoom } from './CollaborativeInterviewRoom';

// Mock Socket.io client
vi.mock('socket.io-client', () => ({
  io: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
  })),
}));

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: function MockMonacoEditor({ value, onChange, language }) {
    return (
      <div data-testid="monaco-editor-mock">
        <textarea
          data-testid="monaco-textarea"
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
        />
        <span data-testid="monaco-language">{language}</span>
      </div>
    );
  },
}));

function renderWithRedux(component, initialState = {}) {
  const store = configureStore({
    reducer: {
      interview: interviewReducer,
    },
    preloadedState: initialState,
  });

  return {
    ...render(<Provider store={store}>{component}</Provider>),
    store,
  };
}

describe('CollaborativeInterviewRoom Component', () => {
  const defaultProps = {
    roomId: 'test-interview-101',
    role: 'interviewer',
    user: { name: 'Dr. Jane Interviewer', id: 'interviewer-1' },
    onLeave: vi.fn(),
  };

  test('should render room header with room ID and interviewer role badge', () => {
    renderWithRedux(<CollaborativeInterviewRoom {...defaultProps} />);

    expect(screen.getByText('Collaborative Interview Space')).toBeInTheDocument();
    expect(screen.getByText('test-interview-101')).toBeInTheDocument();
    expect(screen.getByText('interviewer')).toBeInTheDocument();
  });

  test('should render Monaco editor pane with starter code', () => {
    renderWithRedux(<CollaborativeInterviewRoom {...defaultProps} />);

    const editorMock = screen.getByTestId('monaco-editor-mock');
    expect(editorMock).toBeInTheDocument();
    expect(screen.getByTestId('monaco-textarea').value).toContain('twoSum');
  });

  test('should switch tabs between Peers, Chat, and Video', () => {
    renderWithRedux(<CollaborativeInterviewRoom {...defaultProps} />);

    // Click Chat tab
    const chatTabButton = screen.getByRole('button', { name: /Chat/i });
    fireEvent.click(chatTabButton);
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();

    // Click Video tab
    const videoTabButton = screen.getByRole('button', { name: /Video/i });
    fireEvent.click(videoTabButton);
    expect(screen.getByText('Live Video Streams')).toBeInTheDocument();
  });

  test('should call onLeave when Leave Room button is clicked', () => {
    const handleLeave = vi.fn();
    renderWithRedux(<CollaborativeInterviewRoom {...defaultProps} onLeave={handleLeave} />);

    const leaveButton = screen.getByRole('button', { name: /Leave Room/i });
    fireEvent.click(leaveButton);
    expect(handleLeave).toHaveBeenCalledTimes(1);
  });
});
