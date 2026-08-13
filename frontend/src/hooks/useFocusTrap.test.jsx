import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRef, useState } from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useFocusTrap, { getFocusableElements } from './useFocusTrap';

/**
 * Harness that mirrors real usage: a trigger button outside the dialog (so
 * focus restoration can be observed) and a trapped container beside it.
 */
const Harness = ({ options = {}, onClose = () => {}, children, startOpen = false }) => {
  const [open, setOpen] = useState(startOpen);
  const handleClose = () => {
    setOpen(false);
    onClose();
  };
  const ref = useFocusTrap(open, handleClose, options);

  return (
    <div>
      <button type="button" data-testid="trigger" onClick={() => setOpen(true)}>
        Open
      </button>
      <button type="button" data-testid="outside">
        Outside
      </button>
      {open && (
        <div ref={ref} data-testid="dialog">
          {children || (
            <>
              <button type="button" data-testid="first">
                First
              </button>
              <input data-testid="middle" />
              <button type="button" data-testid="last">
                Last
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const flushFocus = async () => {
  // The hook defers its initial focus by a tick so late-rendered content is
  // present before it looks for a target.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

describe('getFocusableElements', () => {
  test('finds the standard focusable controls', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <a href="#x">link</a>
      <button>button</button>
      <input />
      <select></select>
      <textarea></textarea>
      <div tabindex="0">tabbable div</div>
    `;

    expect(getFocusableElements(container)).toHaveLength(6);
  });

  test('skips controls the browser itself would skip', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <button>keep</button>
      <button disabled>disabled</button>
      <input disabled />
      <input type="hidden" />
      <div tabindex="-1">programmatic only</div>
      <a>anchor without href</a>
    `;

    // A disabled control or tabindex="-1" element would otherwise become a
    // cycle stop where Tab appears to do nothing.
    expect(getFocusableElements(container)).toHaveLength(1);
  });

  test('skips hidden content', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <button>visible</button>
      <button hidden>hidden attr</button>
      <button aria-hidden="true">aria hidden</button>
    `;

    expect(getFocusableElements(container)).toHaveLength(1);
  });

  test('returns an empty list for a missing container', () => {
    expect(getFocusableElements(null)).toEqual([]);
    expect(getFocusableElements(undefined)).toEqual([]);
  });
});

describe('useFocusTrap', () => {
  afterEach(() => {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    vi.restoreAllMocks();
  });

  describe('initial focus', () => {
    test('moves focus into the dialog on open', async () => {
      render(<Harness startOpen />);
      await flushFocus();

      // Previously focus stayed on the trigger, so a screen reader kept
      // announcing the old context.
      expect(screen.getByTestId('first')).toHaveFocus();
    });

    test('honours an explicit initial focus target', async () => {
      const Custom = () => {
        const inputRef = useRef(null);
        const ref = useFocusTrap(true, () => {}, { initialFocusRef: inputRef });
        return (
          <div ref={ref}>
            <button type="button">First</button>
            <input ref={inputRef} data-testid="preferred" />
          </div>
        );
      };

      render(<Custom />);
      await flushFocus();

      expect(screen.getByTestId('preferred')).toHaveFocus();
    });

    test('focuses the container itself when the dialog has no controls', async () => {
      render(
        <Harness startOpen>
          <p>Nothing focusable here</p>
        </Harness>
      );
      await flushFocus();

      const dialog = screen.getByTestId('dialog');
      expect(dialog).toHaveFocus();
      expect(dialog).toHaveAttribute('tabindex', '-1');
    });
  });

  describe('tab cycling', () => {
    test('wraps forward from the last element to the first', async () => {
      const user = userEvent.setup();
      render(<Harness startOpen />);
      await flushFocus();

      screen.getByTestId('last').focus();
      await user.tab();

      // Without the trap this landed on the page behind the overlay.
      expect(screen.getByTestId('first')).toHaveFocus();
    });

    test('wraps backward from the first element to the last', async () => {
      const user = userEvent.setup();
      render(<Harness startOpen />);
      await flushFocus();

      screen.getByTestId('first').focus();
      await user.tab({ shift: true });

      expect(screen.getByTestId('last')).toHaveFocus();
    });

    test('does not interfere with tabbing between interior elements', async () => {
      const user = userEvent.setup();
      render(<Harness startOpen />);
      await flushFocus();

      screen.getByTestId('first').focus();
      await user.tab();

      expect(screen.getByTestId('middle')).toHaveFocus();
    });

    test('pulls focus back in when it starts outside the dialog', async () => {
      const user = userEvent.setup();
      render(<Harness startOpen />);
      await flushFocus();

      screen.getByTestId('outside').focus();
      await user.tab();

      expect(screen.getByTestId('first')).toHaveFocus();
    });

    test('picks up controls added after the dialog opened', async () => {
      const user = userEvent.setup();

      const Async = () => {
        const [loaded, setLoaded] = useState(false);
        const ref = useFocusTrap(true, () => {});
        return (
          <div ref={ref}>
            <button type="button" data-testid="first" onClick={() => setLoaded(true)}>
              Load
            </button>
            {loaded && (
              <button type="button" data-testid="late">
                Late
              </button>
            )}
          </div>
        );
      };

      render(<Async />);
      await flushFocus();

      // Dialog content is often async (a subject dropdown that populates
      // after a fetch); a list cached on open would miss it.
      await user.click(screen.getByTestId('first'));
      screen.getByTestId('late').focus();
      await user.tab();

      expect(screen.getByTestId('first')).toHaveFocus();
    });

    test('keeps focus inside a dialog with nothing focusable', async () => {
      const user = userEvent.setup();
      render(
        <Harness startOpen>
          <p>Read only</p>
        </Harness>
      );
      await flushFocus();

      await user.tab();

      expect(screen.getByTestId('dialog')).toHaveFocus();
    });
  });

  describe('escape', () => {
    test('closes the dialog', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<Harness startOpen onClose={onClose} />);
      await flushFocus();

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalledOnce();
    });

    test('is ignored when the dialog opts out', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<Harness startOpen onClose={onClose} options={{ closeOnEscape: false }} />);
      await flushFocus();

      await user.keyboard('{Escape}');

      // A blocking prompt (session timeout) must be answered, not dismissed.
      expect(onClose).not.toHaveBeenCalled();
    });

    test('does nothing while the dialog is closed', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<Harness onClose={onClose} />);

      await user.keyboard('{Escape}');

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('focus restoration', () => {
    test('returns focus to the element that opened the dialog', async () => {
      const user = userEvent.setup();
      render(<Harness />);

      const trigger = screen.getByTestId('trigger');
      await user.click(trigger);
      await flushFocus();
      expect(screen.getByTestId('first')).toHaveFocus();

      await user.keyboard('{Escape}');
      await flushFocus();

      // Previously focus fell back to <body>, dumping the user at the top of
      // a long dashboard.
      expect(trigger).toHaveFocus();
    });

    test('does not throw when the trigger was removed while open', async () => {
      const Vanishing = () => {
        const [open, setOpen] = useState(true);
        const ref = useFocusTrap(open, () => setOpen(false));
        return (
          <div>
            {open && (
              <div ref={ref}>
                <button type="button" data-testid="close" onClick={() => setOpen(false)}>
                  Close
                </button>
              </div>
            )}
          </div>
        );
      };

      const user = userEvent.setup();
      render(<Vanishing />);
      await flushFocus();

      await expect(user.keyboard('{Escape}')).resolves.not.toThrow();
    });
  });

  describe('scroll lock', () => {
    test('locks body scroll while open and restores it on close', async () => {
      const user = userEvent.setup();
      render(<Harness startOpen />);
      await flushFocus();

      expect(document.body.style.overflow).toBe('hidden');

      await user.keyboard('{Escape}');
      await flushFocus();

      // Scroll-chaining to the page underneath is what this prevents; leaving
      // the lock in place after close would freeze the whole app.
      expect(document.body.style.overflow).toBe('');
    });

    test('compensates for the reclaimed scrollbar width', async () => {
      // Hiding the scrollbar reclaims its width, which shifts a fixed header
      // sideways unless the body is padded to match.
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1015);
      vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1000);

      render(<Harness startOpen />);
      await flushFocus();

      expect(document.body.style.paddingRight).toBe('15px');
    });

    test('leaves scrolling alone when the dialog opts out', async () => {
      render(<Harness startOpen options={{ lockScroll: false }} />);
      await flushFocus();

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('cleanup', () => {
    test('removes its key listener on unmount', async () => {
      const removeSpy = vi.spyOn(document, 'removeEventListener');
      const { unmount } = render(<Harness startOpen />);
      await flushFocus();

      unmount();

      expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true);
    });

    test('restores body styles on unmount', async () => {
      const { unmount } = render(<Harness startOpen />);
      await flushFocus();

      unmount();

      expect(document.body.style.overflow).toBe('');
    });
  });
});
