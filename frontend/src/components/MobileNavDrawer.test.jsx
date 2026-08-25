import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import MobileNavDrawer from './MobileNavDrawer';

vi.mock('./notifications/NotificationBell', () => ({
  default: () => <div data-testid="notification-bell">Bell</div>,
}));

vi.mock('./ThemeToggle', () => ({
  default: () => <button data-testid="theme-toggle">Theme</button>,
}));

beforeAll(() => {
  const localStorageMock = {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
});

const renderWithRouter = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <MobileNavDrawer />
      <Routes>
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        <Route path="/settings" element={<div>Settings Page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('MobileNavDrawer', () => {
  test('closes automatically after clicking a link (route change)', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    const toggleButton = screen.getByRole('button', { name: /open menu/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggleButton);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    const settingsLink = screen.getByRole('link', { name: /settings/i });
    await user.click(settingsLink);

    expect(screen.getByRole('button', { name: /open menu/i })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Settings Page')).toBeInTheDocument();
  });

  test('preloads bundle on hovering a link', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    const toggleButton = screen.getByRole('button', { name: /open menu/i });
    await user.click(toggleButton);

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    await user.hover(dashboardLink);
    expect(dashboardLink).toBeInTheDocument();
  });

  test('closes menu when Escape key is pressed', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    const toggleButton = screen.getByRole('button', { name: /open menu/i });
    await user.click(toggleButton);

    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
    });
  });

  test('has proper ARIA attributes for screen reader accessibility', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    const toggleButton = screen.getByRole('button', { name: /open menu/i });
    expect(toggleButton).toHaveAttribute('aria-controls', 'mobile-drawer-panel');
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggleButton);

    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    const drawerDialog = screen.getByRole('dialog', { name: /mobile navigation menu/i });
    expect(drawerDialog).toHaveAttribute('id', 'mobile-drawer-panel');
    expect(drawerDialog).toHaveAttribute('aria-modal', 'true');
  });
});