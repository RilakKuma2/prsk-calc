import React, { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import useModalAccessibility from './useModalAccessibility';

const TestModal = ({ label, isOpen, onClose, children }) => {
  const dialogRef = useModalAccessibility({ isOpen, onClose });
  if (!isOpen) return null;
  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
      <button type="button" onClick={onClose}>{`close-${label}`}</button>
      {children}
    </div>
  );
};

const NestedModalHarness = () => {
  const [parentOpen, setParentOpen] = useState(false);
  const [childOpen, setChildOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setParentOpen(true)}>open-parent</button>
      <TestModal label="parent" isOpen={parentOpen} onClose={() => setParentOpen(false)}>
        <button type="button" onClick={() => setChildOpen(true)}>open-child</button>
        <TestModal label="child" isOpen={childOpen} onClose={() => setChildOpen(false)} />
      </TestModal>
    </>
  );
};

describe('useModalAccessibility', () => {
  let originalRequestAnimationFrame;
  let originalCancelAnimationFrame;

  beforeEach(() => {
    jest.useFakeTimers();
    originalRequestAnimationFrame = window.requestAnimationFrame;
    originalCancelAnimationFrame = window.cancelAnimationFrame;
    window.requestAnimationFrame = callback => window.setTimeout(callback, 0);
    window.cancelAnimationFrame = id => window.clearTimeout(id);
    document.body.style.overflow = '';
  });

  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
    document.body.style.overflow = '';
  });

  test('only closes the top modal and keeps the body locked for its parent', () => {
    render(<NestedModalHarness />);
    const opener = screen.getByText('open-parent');

    opener.focus();
    fireEvent.click(opener);
    act(() => jest.runOnlyPendingTimers());
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.click(screen.getByText('open-child'));
    act(() => jest.runOnlyPendingTimers());
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByLabelText('child')).toBeNull();
    expect(screen.queryByLabelText('parent')).not.toBeNull();
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByLabelText('parent')).toBeNull();
    expect(document.body.style.overflow).toBe('');
    expect(document.activeElement).toBe(opener);
  });
});
