import { useCallback, useEffect, useRef } from 'react';

/**
 * Selector for elements that can hold keyboard focus.
 *
 * `:not([disabled])` and the negative-tabindex exclusion matter: a disabled
 * submit button or a `tabindex="-1"` scroll container would otherwise become
 * a cycle stop that the browser itself skips, so Tab would appear to do
 * nothing when it lands there.
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Whether a layout engine actually ran.
 *
 * jsdom reports zero client rects for every element including <body>, so a
 * geometry-based visibility check would classify every control as hidden and
 * make the trap look empty. Probing <body> distinguishes "nothing is laid
 * out" from "this particular element is hidden".
 */
const layoutAvailable = () => {
  if (typeof document === 'undefined' || !document.body) return false;
  if (typeof document.body.getClientRects !== 'function') return false;
  return document.body.getClientRects().length > 0;
};

/** A focusable element still isn't reachable if it or an ancestor is hidden. */
const isVisible = (element) => {
  if (element.hidden) return false;
  if (element.getAttribute('aria-hidden') === 'true') return false;
  if (typeof element.closest === 'function' && element.closest('[aria-hidden="true"]')) return false;

  if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
  }

  // Catches the case computed style misses — an element whose *ancestor* is
  // display:none still reports its own display. Only meaningful where layout
  // ran; under jsdom we accept the style check alone.
  if (!layoutAvailable()) return true;
  return element.getClientRects().length > 0 || element.offsetParent !== null;
};

export const getFocusableElements = (container) => {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(isVisible);
};

/**
 * Lock body scroll without the page jumping.
 *
 * Hiding the scrollbar reclaims its width, so a fixed-position header shifts
 * sideways as the modal opens. Padding the body by the scrollbar width keeps
 * the layout still. Returns a function that restores the previous values.
 */
const lockBodyScroll = () => {
  const { body } = document;
  const previousOverflow = body.style.overflow;
  const previousPaddingRight = body.style.paddingRight;

  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

  body.style.overflow = 'hidden';
  if (scrollbarWidth > 0) {
    const currentPadding = parseInt(window.getComputedStyle(body).paddingRight, 10) || 0;
    body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
  }

  return () => {
    body.style.overflow = previousOverflow;
    body.style.paddingRight = previousPaddingRight;
  };
};

/**
 * Implements the WAI-ARIA dialog keyboard contract for a container element.
 *
 * Returns a ref to attach to the dialog. While `isOpen`:
 *
 * - focus moves into the dialog,
 * - Tab / Shift+Tab cycle within it instead of escaping to the page behind,
 * - Escape closes it (unless `closeOnEscape` is false),
 * - focus returns to whatever opened it,
 * - body scroll is locked (unless `lockScroll` is false).
 *
 * @param {boolean} isOpen
 * @param {() => void} onClose
 * @param {{closeOnEscape?: boolean, lockScroll?: boolean, initialFocusRef?: object}} options
 */
const useFocusTrap = (isOpen, onClose, options = {}) => {
  const { closeOnEscape = true, lockScroll = true, initialFocusRef } = options;

  const containerRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  // Held in a ref so changing the callback identity between renders doesn't
  // tear down and rebuild the trap (and steal focus) on every parent render.
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape' && closeOnEscape) {
        event.stopPropagation();
        if (onCloseRef.current) onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const container = containerRef.current;
      if (!container) return;

      // Queried on every Tab rather than cached on open: dialog content is
      // frequently async (a subject dropdown that populates after a fetch),
      // and a cached list would omit whatever arrived later.
      const focusable = getFocusableElements(container);

      if (focusable.length === 0) {
        // Nothing to move to — keep focus on the dialog rather than letting
        // it escape to the page underneath.
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !container.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last || !container.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    },
    [closeOnEscape]
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    previouslyFocusedRef.current = document.activeElement;

    // Deferred a frame so content rendered in the same commit (and any
    // animation wrapper) exists before we look for something to focus.
    const focusTimer = setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
        return;
      }

      const focusable = getFocusableElements(containerRef.current);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else if (containerRef.current) {
        // Empty dialog: make the container itself the focus target so the
        // screen reader announces it and Tab has somewhere to be trapped.
        containerRef.current.setAttribute('tabindex', '-1');
        containerRef.current.focus();
      }
    }, 0);

    document.addEventListener('keydown', handleKeyDown, true);
    const releaseScroll = lockScroll ? lockBodyScroll() : null;

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown, true);
      if (releaseScroll) releaseScroll();

      // Restore focus to the trigger so a keyboard user resumes where they
      // were instead of being dropped at the top of the document.
      const previous = previouslyFocusedRef.current;
      if (previous && typeof previous.focus === 'function' && document.contains(previous)) {
        previous.focus();
      }
    };
    // `container` is intentionally not a dependency: the ref object is stable
    // and re-running this effect would re-steal focus mid-interaction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, handleKeyDown, lockScroll]);

  return containerRef;
};

export default useFocusTrap;
export { FOCUSABLE_SELECTOR, lockBodyScroll };
