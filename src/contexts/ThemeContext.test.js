import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';

const ThemeProbe = () => {
  const { themePreference, resolvedTheme, setThemePreference } = useTheme();
  return (
    <>
      <output data-testid="preference">{themePreference}</output>
      <output data-testid="resolved">{resolvedTheme}</output>
      <button type="button" onClick={() => setThemePreference('dark')}>dark</button>
    </>
  );
};

describe('ThemeProvider', () => {
  let mediaQuery;

  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-theme-preference');
    document.documentElement.style.removeProperty('color-scheme');
    mediaQuery = {
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    window.matchMedia = jest.fn(() => mediaQuery);
  });

  test('uses the saved preference and updates the document theme', async () => {
    window.localStorage.setItem('sekai-theme', 'light');
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('preference').textContent).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');

    fireEvent.click(screen.getByRole('button', { name: 'dark' }));

    await waitFor(() => {
      expect(screen.getByTestId('preference').textContent).toBe('dark');
      expect(screen.getByTestId('resolved').textContent).toBe('dark');
      expect(document.documentElement.dataset.theme).toBe('dark');
      expect(window.localStorage.getItem('sekai-theme')).toBe('dark');
    });
  });

  test('follows system changes only while the system preference is selected', async () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('preference').textContent).toBe('system');
    expect(mediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    const systemChange = mediaQuery.addEventListener.mock.calls[0][1];
    act(() => {
      mediaQuery.matches = true;
      systemChange();
    });

    await waitFor(() => {
      expect(screen.getByTestId('resolved').textContent).toBe('dark');
      expect(document.documentElement.dataset.theme).toBe('dark');
    });
  });
});
