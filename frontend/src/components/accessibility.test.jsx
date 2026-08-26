import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import { GlassCard } from './GlassCard';
import FlashcardWidget from './dashboard/FlashcardWidget';
import PomodoroTimer from './dashboard/PomodoroTimer';

vi.mock('../services/api.js', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { data: {} } })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

// ── Helpers ──

const renderWithAuth = (ui) => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        token: null,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      },
    },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>
  );
};

// ── Login Form A11Y ──

describe('Login form accessibility', () => {
  test('email label is connected to input via htmlFor/id', async () => {
    const { default: Login } = await import('../pages/Login');
    renderWithAuth(<Login />);
    const label = screen.getByText('Email', { selector: 'label' });
    const input = document.getElementById('login-email');
    expect(label).toHaveAttribute('for', 'login-email');
    expect(input).toBeInTheDocument();
    expect(label).toHaveAttribute('for', input.id);
  });

  test('password label is connected to input via htmlFor/id', async () => {
    const { default: Login } = await import('../pages/Login');
    renderWithAuth(<Login />);
    const label = screen.getByText('Password', { selector: 'label' });
    const input = document.getElementById('login-password');
    expect(label).toHaveAttribute('for', 'login-password');
    expect(input).toBeInTheDocument();
  });

  test('password toggle has aria-label', async () => {
    const { default: Login } = await import('../pages/Login');
    renderWithAuth(<Login />);
    const toggle = screen.getByRole('button', { name: /show password/i });
    expect(toggle).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();
  });

  test('submit button has aria-busy attribute', async () => {
    const { default: Login } = await import('../pages/Login');
    renderWithAuth(<Login />);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    expect(submitBtn).toHaveAttribute('aria-busy', 'false');
  });
});

// ── Register Form A11Y ──

describe('Register form accessibility', () => {
  test('all labels are connected to inputs', async () => {
    const { default: Register } = await import('../pages/Register');
    renderWithAuth(<Register />);

    const nameLabel = screen.getByText('Full Name', { selector: 'label' });
    const emailLabel = screen.getByText('Email', { selector: 'label' });
    const passwordLabel = screen.getByText('Password', { selector: 'label' });

    expect(nameLabel).toHaveAttribute('for', 'register-name');
    expect(emailLabel).toHaveAttribute('for', 'register-email');
    expect(passwordLabel).toHaveAttribute('for', 'register-password');

    expect(document.getElementById('register-name')).toBeInTheDocument();
    expect(document.getElementById('register-email')).toBeInTheDocument();
    expect(document.getElementById('register-password')).toBeInTheDocument();
  });

  test('password toggle has aria-label', async () => {
    const { default: Register } = await import('../pages/Register');
    renderWithAuth(<Register />);
    const toggle = screen.getByRole('button', { name: /show password/i });
    expect(toggle).toBeInTheDocument();
  });

  test('submit button has aria-busy', async () => {
    const { default: Register } = await import('../pages/Register');
    renderWithAuth(<Register />);
    const submitBtn = screen.getByRole('button', { name: /create account/i });
    expect(submitBtn).toHaveAttribute('aria-busy', 'false');
  });
});

// ── ForgotPassword Form A11Y ──

describe('ForgotPassword form accessibility', () => {
  test('email label is connected to input', async () => {
    const { default: ForgotPassword } = await import('../pages/ForgotPassword');
    renderWithAuth(<ForgotPassword />);
    const label = screen.getByText('Email', { selector: 'label' });
    const input = document.getElementById('forgot-email');
    expect(label).toHaveAttribute('for', 'forgot-email');
    expect(input).toBeInTheDocument();
  });

  test('submit button has aria-busy', async () => {
    const { default: ForgotPassword } = await import('../pages/ForgotPassword');
    renderWithAuth(<ForgotPassword />);
    const submitBtn = screen.getByRole('button', { name: /send reset link/i });
    expect(submitBtn).toHaveAttribute('aria-busy', 'false');
  });
});

// ── GlassCard A11Y ──

describe('GlassCard accessibility', () => {
  test('has role=button and tabIndex when onClick is provided', () => {
    const onClick = vi.fn();
    render(<GlassCard onClick={onClick}>Click me</GlassCard>);
    const card = screen.getByRole('button', { name: /click me/i });
    expect(card).toHaveAttribute('tabindex', '0');
  });

  test('does not have role when onClick is not provided', () => {
    render(<GlassCard>Static content</GlassCard>);
    const card = screen.getByText('Static content');
    expect(card).not.toHaveAttribute('role');
    expect(card).not.toHaveAttribute('tabindex');
  });

  test('activates on Enter key', () => {
    const onClick = vi.fn();
    render(<GlassCard onClick={onClick}>Click me</GlassCard>);
    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('activates on Space key', () => {
    const onClick = vi.fn();
    render(<GlassCard onClick={onClick}>Click me</GlassCard>);
    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

// ── FlashcardWidget A11Y ──

describe('FlashcardWidget accessibility', () => {
  const sampleCard = { front: 'What is A11Y?', back: 'Accessibility' };

  test('flip container has role=button and tabIndex', () => {
    render(<MemoryRouter><FlashcardWidget flashcard={sampleCard} /></MemoryRouter>);
    const flipBtn = screen.getByRole('button', { name: /flip to back/i });
    expect(flipBtn).toHaveAttribute('tabindex', '0');
  });

  test('Enter key flips the card', () => {
    render(<MemoryRouter><FlashcardWidget flashcard={sampleCard} /></MemoryRouter>);
    const flipBtn = screen.getByRole('button', { name: /flip to back/i });
    fireEvent.keyDown(flipBtn, { key: 'Enter' });
    expect(screen.getByText('Accessibility')).toBeInTheDocument();
  });

  test('aria-label updates after flip', () => {
    render(<MemoryRouter><FlashcardWidget flashcard={sampleCard} /></MemoryRouter>);
    const flipBtn = screen.getByRole('button', { name: /flip to back/i });
    fireEvent.click(flipBtn);
    expect(screen.getByRole('button', { name: /flip to front/i })).toBeInTheDocument();
  });
});

// ── PomodoroTimer A11Y ──

// ── Modal Dialogs A11Y ──

describe('Modal Dialogs accessibility and ARIA roles', () => {
  test('PYQUploadModal has role="dialog", aria-modal="true", and aria-labelledby', async () => {
    const { default: PYQUploadModal } = await import('./pyq/PYQUploadModal');
    render(<PYQUploadModal isOpen={true} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'pyq-upload-modal-title');
    expect(document.getElementById('pyq-upload-modal-title')).toBeInTheDocument();
  });

  test('ForgotPasswordModal has role="dialog", aria-modal="true", and aria-labelledby', async () => {
    const { default: ForgotPasswordModal } = await import('./auth/ForgotPasswordModal');
    renderWithAuth(<ForgotPasswordModal isOpen={true} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'forgot-password-modal-title');
    expect(document.getElementById('forgot-password-modal-title')).toBeInTheDocument();
  });

  test('GenerateFlashcardsFromYouTubeModal has role="dialog", aria-modal="true", and aria-labelledby', async () => {
    const { default: GenerateFlashcardsFromYouTubeModal } = await import('./dashboard/GenerateFlashcardsFromYouTubeModal');
    render(<GenerateFlashcardsFromYouTubeModal onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'generate-youtube-modal-title');
    expect(document.getElementById('generate-youtube-modal-title')).toBeInTheDocument();
  });

  test('KeyboardShortcutsModal has role="dialog", aria-modal="true", and aria-labelledby', async () => {
    const { default: KeyboardShortcutsModal } = await import('./flashcards/KeyboardShortcutsModal');
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'keyboard-shortcuts-modal-title');
    expect(document.getElementById('keyboard-shortcuts-modal-title')).toBeInTheDocument();
  });

  test('GenerateQuizModal has role="dialog", aria-modal="true", and aria-labelledby', async () => {
    const { default: GenerateQuizModal } = await import('./dashboard/GenerateQuizModal');
    render(<GenerateQuizModal isOpen={true} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'generate-quiz-modal-title');
    expect(document.getElementById('generate-quiz-modal-title')).toBeInTheDocument();
  });

  test('ConfirmDeleteModal has role="dialog", aria-modal="true", and aria-labelledby', async () => {
    const { default: ConfirmDeleteModal } = await import('./common/ConfirmDeleteModal');
    render(<ConfirmDeleteModal isOpen={true} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-delete-modal-title');
    expect(document.getElementById('confirm-delete-modal-title')).toBeInTheDocument();
  });
});


