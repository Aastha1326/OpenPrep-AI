import { useId, useRef } from 'react';
import { X } from 'lucide-react';
import useFocusTrap from '../../hooks/useFocusTrap';

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw]',
};

/**
 * Accessible dialog shell.
 *
 * Every modal in the app was hand-rolled as a `fixed inset-0` overlay, and
 * none of them implemented the dialog keyboard contract — Tab walked out of
 * the dialog into the page behind it, Escape mostly did nothing, and focus
 * was never restored. Building on one primitive means future dialogs get
 * that behaviour by construction rather than by remembering to add it.
 *
 * @param {boolean} isOpen
 * @param {() => void} onClose
 * @param {string} title            Accessible name; rendered in the header
 * @param {string} [description]    Optional supporting text, wired to aria-describedby
 * @param {'sm'|'md'|'lg'|'xl'|'full'} [size]
 * @param {boolean} [closeOnEscape] Set false for a dialog that must be answered
 * @param {boolean} [closeOnBackdrop]
 * @param {boolean} [showCloseButton]
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  closeOnEscape = true,
  closeOnBackdrop = true,
  showCloseButton = true,
  initialFocusRef,
  className = '',
  children,
}) => {
  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const descriptionId = `${generatedId}-description`;
  const touchStartTarget = useRef(null);

  const containerRef = useFocusTrap(isOpen, onClose, { closeOnEscape, initialFocusRef });

  if (!isOpen) return null;

  const handleBackdropClick = (event) => {
    // Only a click that both started and ended on the backdrop closes the
    // dialog — otherwise a text selection that begins inside and drags out
    // dismisses the user's work.
    if (closeOnBackdrop && event.target === event.currentTarget) {
      onClose?.();
    }
  };

  const handleTouchStart = (event) => {
    touchStartTarget.current = event.target;
  };

  const handleTouchEnd = (event) => {
    if (
      closeOnBackdrop &&
      event.target === event.currentTarget &&
      touchStartTarget.current === event.currentTarget
    ) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={handleBackdropClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-testid="modal-backdrop"
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full ${
          SIZE_CLASSES[size] || SIZE_CLASSES.md
        } max-h-[90vh] flex flex-col overflow-hidden ${className}`}
      >
        <div className="flex justify-between items-start gap-4 p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>

          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              // Named for the dialog it closes, so a screen reader user
              // hearing it out of context knows what it dismisses.
              aria-label={`Close ${title}`}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrolls inside the dialog so the page behind never scroll-chains. */}
        <div className="p-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
