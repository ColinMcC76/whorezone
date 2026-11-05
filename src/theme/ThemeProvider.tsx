import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type SiteTheme = 'light' | 'dark';

const storageKey = 'personal-site-theme';

type ThemeContextValue = {
  theme: SiteTheme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Dark mode starts on, unless the system explicitly prefers light or the visitor already chose. */
export function themeFromPreference(stored: string | null, prefersDark: boolean, prefersLight: boolean): SiteTheme {
  if (stored === 'dark' || stored === 'light') return stored;
  if (prefersDark || !prefersLight) return 'dark';
  return 'light';
}

function storedChoice(): SiteTheme | null {
  const stored = localStorage.getItem(storageKey);
  return stored === 'light' || stored === 'dark' ? stored : null;
}

function systemTheme(): SiteTheme {
  return themeFromPreference(
    null,
    window.matchMedia('(prefers-color-scheme: dark)').matches,
    window.matchMedia('(prefers-color-scheme: light)').matches,
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [choice, setChoice] = useState<SiteTheme | null>(storedChoice);
  const [system, setSystem] = useState<SiteTheme>(systemTheme);
  const theme = choice ?? system;

  useEffect(() => {
    const darkMedia = window.matchMedia('(prefers-color-scheme: dark)');
    const lightMedia = window.matchMedia('(prefers-color-scheme: light)');
    const sync = () => setSystem(themeFromPreference(null, darkMedia.matches, lightMedia.matches));
    darkMedia.addEventListener('change', sync);
    lightMedia.addEventListener('change', sync);
    return () => {
      darkMedia.removeEventListener('change', sync);
      lightMedia.removeEventListener('change', sync);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (choice) localStorage.setItem(storageKey, choice);
  }, [theme, choice]);

  const toggleTheme = useCallback(() => {
    setChoice(theme === 'dark' ? 'light' : 'dark');
  }, [theme]);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used within ThemeProvider');
  return value;
}
