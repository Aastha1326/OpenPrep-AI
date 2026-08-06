import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import MobileNavDrawer from './MobileNavDrawer';

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
    await user.click(toggleButton);

    // Drawer should now be open
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();

    const settingsLink = screen.getByRole('link', { name: /settings/i });
    await user.click(settingsLink);

    // Drawer should have closed automatically after navigation
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
    expect(screen.getByText('Settings Page')).toBeInTheDocument();
  });
});