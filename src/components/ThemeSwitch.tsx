import { useTheme } from '../theme/ThemeProvider';

export default function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';

  return (
    <label className="theme-switch">
      <span className="theme-switch-text">Dark mode</span>
      <input
        type="checkbox"
        role="switch"
        checked={dark}
        onChange={toggleTheme}
      />
      <span className="theme-switch-track" aria-hidden="true" />
    </label>
  );
}
