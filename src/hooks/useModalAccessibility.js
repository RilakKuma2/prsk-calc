import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const getFocusableElements = (dialog) => (
  Array.from(dialog?.querySelectorAll(FOCUSABLE_SELECTOR) || [])
    .filter((element) => element.getAttribute('aria-hidden') !== 'true')
);

const openDialogs = [];
let originalBodyOverflow = '';

const registerDialog = (dialog) => {
  if (openDialogs.length === 0) {
    originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  openDialogs.push(dialog);
};

const unregisterDialog = (dialog) => {
  const index = openDialogs.lastIndexOf(dialog);
  if (index !== -1) openDialogs.splice(index, 1);
  if (openDialogs.length === 0) {
    document.body.style.overflow = originalBodyOverflow;
  }
};

const isTopmostDialog = (dialog) => openDialogs[openDialogs.length - 1] === dialog;

/**
 * Gives a conditionally rendered modal the expected keyboard and scroll behavior.
 * The returned ref belongs on the element with role="dialog".
 * @param {{
 *   isOpen: boolean,
 *   onClose?: () => void,
 *   initialFocusRef?: import('react').RefObject<HTMLElement>,
 * }} options
 * @returns {import('react').MutableRefObject<any>}
 */
export default function useModalAccessibility({ isOpen, onClose, initialFocusRef }) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const initialFocusRefRef = useRef(initialFocusRef);

  onCloseRef.current = onClose;
  initialFocusRefRef.current = initialFocusRef;

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return undefined;

    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    const opener = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    registerDialog(dialog);
    const focusFrame = window.requestAnimationFrame(() => {
      if (!isTopmostDialog(dialog)) return;
      const preferredTarget = initialFocusRefRef.current?.current;
      const focusTarget = preferredTarget || getFocusableElements(dialog)[0] || dialog;
      focusTarget.focus({ preventScroll: true });
    });

    const handleKeyDown = (event) => {
      if (!isTopmostDialog(dialog)) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements(dialog);
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;
      const focusIsOutside = !dialog.contains(activeElement);

      if (focusIsOutside || (event.shiftKey && activeElement === first)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      unregisterDialog(dialog);
      if (opener?.isConnected) {
        const openerDialog = opener.closest?.('[role="dialog"], [role="alertdialog"]');
        if (openDialogs.length === 0 || isTopmostDialog(openerDialog)) {
          opener.focus({ preventScroll: true });
        }
      }
    };
  }, [isOpen]);

  return dialogRef;
}
