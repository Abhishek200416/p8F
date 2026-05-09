import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [mode, setModeState] = useState(() => localStorage.getItem('mode') || 'professional');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'casual-theme');
    root.classList.add(theme);
    if (mode === 'casual') root.classList.add('casual-theme');
    localStorage.setItem('theme', theme);
  }, [theme, mode]);

  const setMode = (m) => {
    setModeState(m);
    localStorage.setItem('mode', m);
    const root = document.documentElement;
    if (m === 'casual') root.classList.add('casual-theme');
    else root.classList.remove('casual-theme');
  };

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
};
