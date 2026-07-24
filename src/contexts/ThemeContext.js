import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);
const THEME_STORAGE_KEY = 'sekai-theme';

const isThemePreference = (value) => (
  value === 'system' || value === 'light' || value === 'dark'
);

const getSystemTheme = () => (
  typeof window !== 'undefined'
  && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
);

export const ThemeProvider = ({ children }) => {
  const [themePreference, setThemePreference] = useState(() => {
    if (typeof window === 'undefined') return 'system';
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(savedTheme) ? savedTheme : 'system';
  });
  const [resolvedTheme, setResolvedTheme] = useState(() => (
    themePreference === 'system' ? getSystemTheme() : themePreference
  ));

  useEffect(() => {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const nextTheme = themePreference === 'system'
        ? (systemTheme.matches ? 'dark' : 'light')
        : themePreference;

      setResolvedTheme(nextTheme);
      document.documentElement.dataset.theme = nextTheme;
      document.documentElement.dataset.themePreference = themePreference;
      document.documentElement.style.colorScheme = nextTheme;
      window.localStorage.setItem(THEME_STORAGE_KEY, themePreference);

      const themeColor = document.querySelector('meta[name="theme-color"]');
      themeColor?.setAttribute('content', nextTheme === 'dark' ? '#25272c' : '#6366f1');
    };

    applyTheme();
    if (themePreference === 'system') {
      systemTheme.addEventListener('change', applyTheme);
    }

    return () => systemTheme.removeEventListener('change', applyTheme);
  }, [themePreference]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === THEME_STORAGE_KEY && isThemePreference(event.newValue)) {
        setThemePreference(event.newValue);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <ThemeContext.Provider value={{
      themePreference,
      setThemePreference,
      resolvedTheme,
    }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
