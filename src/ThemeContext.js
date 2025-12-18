import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // Check localStorage first
        const saved = localStorage.getItem('theme-mode');
        if (saved) {
            return saved === 'dark';
        }

        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return true;
        }

        return false;
    });

    useEffect(() => {
        localStorage.setItem('theme-mode', isDarkMode ? 'dark' : 'light');
        
        // Apply theme to document
        if (isDarkMode) {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
            document.body.style.backgroundColor = '#1a1a1a';
            document.body.style.color = '#e0e0e0';
        } else {
            document.documentElement.setAttribute('data-bs-theme', 'light');
            document.body.style.backgroundColor = 'white';
            document.body.style.color = '#000';
        }
    }, [isDarkMode]);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
