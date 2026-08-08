import React, { createContext, useState, useEffect, useContext } from 'react';

export const DarkModeContext = createContext();

export const DarkModeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // Load saved preference from localStorage
    const saved = localStorage.getItem('electrostore_theme');
    return saved === 'dark';
  });

  useEffect(() => {
    // Apply theme to the document root element
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    // Persist preference
    localStorage.setItem('electrostore_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleDarkMode = () => setIsDark(prev => !prev);

  return (
    <DarkModeContext.Provider value={{ isDark, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

// Convenience hook
export const useDarkMode = () => useContext(DarkModeContext);
