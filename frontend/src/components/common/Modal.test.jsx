import { describe, test, expect, vi, afterEach } from 'vitest';
import { useState } from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';

const flushFocus = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const renderModal = (props = {}) =>
  render(
    <Modal isOpen onClose={() => {}} title="Create Note" {...props}>
      <button type="button" data-testid="body-button">
        Save
      </button>
    </Modal>
  );

describe('Modal', () => {
  afterEach(() => {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  });

  describe('rendering', () => {
    test('renders nothing when closed', () => {
      render(
        <Modal isOpen={false} onClose={() => {}} title="Hidden">
          <p>content</p>
        </Modal>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('renders its children when open', () => {
      renderModal();

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('body-button')).toBeInTheDocument();
    });

    test('applies the requested size', () => {
      const { rerender } = renderModal({ size: 'sm' });
      expect(screen.getByRole('dialog').className).toContain('max-w-sm');

      rerender(
        <Modal isOpen onClose={() => {}} title="Create Note" size="xl">
          <p>content</p>
        </Modal>
      );
      expect(screen.getByRole('dialog').className).toContain('max-w-4xl');
    });

    test('falls back to the default size for an unknown value', () => {
      renderModal({ size: 'gigantic' });

      expect(screen.getByRole('dialog').className).toContain('max-w-md');
    });
  });

  describe('ARIA wiring', () => {
    test('is a modal dialog named by its title', () => {
      renderModal();

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');

      const titleId = dialog.getAttribute('aria-labelledby');
      expect(titleId).toBeTruthy();
      expect(document.getElementById(titleId)).toHaveTextContent('Create Note');
    });

    test('wires up a description when one is supplied', () => {
      renderModal({ description: 'Notes are saved to your account.' });

      const dialog = screen.getByRole('dialog');
      const descriptionId = dialog.getAttribute('aria-describedby');
      expect(document.getElementById(descriptionId)).toHaveTextContent(
        'Notes are saved to your account.'
      );
    });

    test('omits aria-describedby when there is no description', () => {
      renderModal();

      expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby');
    });

    test('gives the close button a name that identifies the dialog', () => {
      renderModal();

      // "Close" alone is meaningless to a screen-reader user hearing the
      // control out of context.
      expect(screen.getByRole('button', { name: 'Close Create Note' })).toBeInTheDocument();
    });

    test('generates unique ids for concurrent dialogs', () => {
      render(
        <>
          <Modal isOpen onClose={() => {}} title="First">
            <p>a</p>
          </Modal>
          <Modal isOpen onClose={() => {}} title="Second">
            <p>b</p>
          </Modal>
        </>
      );

      const [first, second] = screen.getAllByRole('dialog');
      expect(first.getAttribute('aria-labelledby')).not.toBe(second.getAttribute('aria-labelledby'));
    });
  });

  describe('dismissal', () => {
    test('closes on the close button', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderModal({ onClose });

      await user.click(screen.getByRole('button', { name: 'Close Create Note' }));

      expect(onClose).toHaveBeenCalledOnce();
    });

    test('closes on Escape', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderModal({ onClose });
      await flushFocus();

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalledOnce();
    });

    test('closes on a backdrop click', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderModal({ onClose });

      await user.click(screen.getByTestId('modal-backdrop'));

      expect(onClose).toHaveBeenCalledOnce();
    });

    test('does not close when the click lands inside the dialog', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderModal({ onClose });

      await user.click(screen.getByTestId('body-button'));

      expect(onClose).not.toHaveBeenCalled();
    });

    test('respects closeOnEscape={false}', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderModal({ onClose, closeOnEscape: false });
      await flushFocus();

      await user.keyboard('{Escape}');

      expect(onClose).not.toHaveBeenCalled();
    });

    test('respects closeOnBackdrop={false}', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderModal({ onClose, closeOnBackdrop: false });

      await user.click(screen.getByTestId('modal-backdrop'));

      expect(onClose).not.toHaveBeenCalled();
    });

    test('closes when backdrop is tapped on touch devices', () => {
      const onClose = vi.fn();
      renderModal({ onClose });

      const backdrop = screen.getByTestId('modal-backdrop');
      fireEvent.touchStart(backdrop, { target: backdrop });
      fireEvent.touchEnd(backdrop, { target: backdrop });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('does not close when touch starts inside and ends on backdrop', () => {
      const onClose = vi.fn();
      renderModal({ onClose });

      const backdrop = screen.getByTestId('modal-backdrop');
      const innerButton = screen.getByTestId('body-button');
      
      fireEvent.touchStart(innerButton, { target: innerButton });
      fireEvent.touchEnd(backdrop, { target: backdrop });

      expect(onClose).not.toHaveBeenCalled();
    });

    test('does not close when touch starts on backdrop and ends inside', () => {
      const onClose = vi.fn();
      renderModal({ onClose });

      const backdrop = screen.getByTestId('modal-backdrop');
      const innerButton = screen.getByTestId('body-button');
      
      fireEvent.touchStart(backdrop, { target: backdrop });
      fireEvent.touchEnd(innerButton, { target: innerButton });

      expect(onClose).not.toHaveBeenCalled();
    });

    test('respects closeOnBackdrop={false} on touch devices', () => {
      const onClose = vi.fn();
      renderModal({ onClose, closeOnBackdrop: false });

      const backdrop = screen.getByTestId('modal-backdrop');
      fireEvent.touchStart(backdrop, { target: backdrop });
      fireEvent.touchEnd(backdrop, { target: backdrop });

      expect(onClose).not.toHaveBeenCalled();
    });

    test('can hide the close button for a dialog that must be answered', () => {
      renderModal({ showCloseButton: false });

      expect(screen.queryByRole('button', { name: /^Close/ })).not.toBeInTheDocument();
    });
  });

  describe('focus behaviour', () => {
    test('moves focus into the dialog on open', async () => {
      renderModal();
      await flushFocus();

      // The close button is the first focusable element in the shell.
      expect(screen.getByRole('button', { name: 'Close Create Note' })).toHaveFocus();
    });

    test('traps Tab inside the dialog', async () => {
      const user = userEvent.setup();
      renderModal();
      await flushFocus();

      screen.getByTestId('body-button').focus();
      await user.tab();

      expect(screen.getByRole('button', { name: 'Close Create Note' })).toHaveFocus();
    });

    test('returns focus to the trigger on close', async () => {
      const user = userEvent.setup();

      const Host = () => {
        const [open, setOpen] = useState(false);
        return (
          <>
            <button type="button" data-testid="trigger" onClick={() => setOpen(true)}>
              Open
            </button>
            <Modal isOpen={open} onClose={() => setOpen(false)} title="Create Note">
              <p>content</p>
            </Modal>
          </>
        );
      };

      render(<Host />);
      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);
      await flushFocus();
      await user.keyboard('{Escape}');
      await flushFocus();

      expect(trigger).toHaveFocus();
    });

    test('locks background scroll while open', async () => {
      renderModal();
      await flushFocus();

      expect(document.body.style.overflow).toBe('hidden');
    });
  });
});
