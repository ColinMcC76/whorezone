import { describe, expect, it } from 'vitest';
import { themeFromPreference } from './ThemeProvider';

describe('themeFromPreference', () => {
  it('turns dark mode on when the system prefers dark', () => {
    expect(themeFromPreference(null, true, false)).toBe('dark');
  });

  it('turns dark mode off when the system prefers light', () => {
    expect(themeFromPreference(null, false, true)).toBe('light');
  });

  it('defaults dark mode on when the system has no preference', () => {
    expect(themeFromPreference(null, false, false)).toBe('dark');
  });

  it('keeps an explicit choice over the system preference', () => {
    expect(themeFromPreference('light', true, false)).toBe('light');
    expect(themeFromPreference('dark', false, true)).toBe('dark');
  });
});
