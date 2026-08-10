import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeName = 'light' | 'dark';

export interface Theme {
  name: ThemeName;
  label: string;
  emoji: string;
  bgFrom: string;
  bgVia: string;
  bgTo: string;
  accent: string;
  accentHover: string;
  accentShadow: string;
  accentRing: string;
  accentText: string;
  accentSubtext: string;
  cardBg: string;
  cardBorder: string;
  cardHoverBg: string;
  cardHoverBorder: string;
  headerBg: string;
  progressBar: string;
  sectionLabel: string;
  linkColor: string;
  linkHover: string;
  textMain: string;
  textSub: string;
  borderLight: string;
  inputBg: string;
  inputBorder: string;
  inputPlaceholder: string;
  btnText: string;
  dropdownBg: string;
  dropdownHover: string;
}

export const THEMES: Record<ThemeName, Theme> = {
  light: {
    name: 'light',
    label: 'Light',
    emoji: '☀️',
    bgFrom: '#f8fafc',
    bgVia: '#f1f5f9',
    bgTo: '#e2e8f0',
    accent: '#0f172a',
    accentHover: '#1e293b',
    accentShadow: 'rgba(15,23,42,0.15)',
    accentRing: '#0f172a',
    accentText: '#1e293b',
    accentSubtext: '#334155',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    cardHoverBg: '#ffffff',
    cardHoverBorder: '#cbd5e1',
    headerBg: 'rgba(255,255,255,0.85)',
    progressBar: 'linear-gradient(90deg,#0f172a,#334155)',
    sectionLabel: '#475569',
    linkColor: '#2563eb',
    linkHover: '#1d4ed8',
    textMain: '#0f172a',
    textSub: '#64748b',
    borderLight: '#cbd5e1',
    inputBg: '#ffffff',
    inputBorder: '#cbd5e1',
    inputPlaceholder: '#94a3b8',
    btnText: '#ffffff',
    dropdownBg: '#ffffff',
    dropdownHover: '#f1f5f9',
  },
  dark: {
    name: 'dark',
    label: 'Dark',
    emoji: '🌙',
    bgFrom: '#020617',
    bgVia: '#0f172a',
    bgTo: '#020617',
    accent: '#3b82f6',
    accentHover: '#60a5fa',
    accentShadow: 'rgba(59,130,246,0.3)',
    accentRing: '#3b82f6',
    accentText: '#93c5fd',
    accentSubtext: '#60a5fa',
    cardBg: 'rgba(255,255,255,0.03)',
    cardBorder: 'rgba(255,255,255,0.06)',
    cardHoverBg: 'rgba(255,255,255,0.05)',
    cardHoverBorder: 'rgba(255,255,255,0.12)',
    headerBg: 'rgba(2,6,23,0.7)',
    progressBar: 'linear-gradient(90deg,#3b82f6,#60a5fa)',
    sectionLabel: '#94a3b8',
    linkColor: '#60a5fa',
    linkHover: '#93c5fd',
    textMain: '#ffffff',
    textSub: '#94a3b8',
    borderLight: 'rgba(255,255,255,0.1)',
    inputBg: 'rgba(255,255,255,0.03)',
    inputBorder: 'rgba(255,255,255,0.1)',
    inputPlaceholder: 'rgba(255,255,255,0.3)',
    btnText: '#ffffff',
    dropdownBg: '#0f172a',
    dropdownHover: 'rgba(255,255,255,0.05)',
  }
};

interface ThemeContextValue {
  theme: Theme;
  setTheme: (name: ThemeName) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: THEMES.dark,
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('app_theme') as ThemeName | null;
    return saved && THEMES[saved] ? saved : 'dark';
  });

  const theme = THEMES[themeName];

  useEffect(() => {
    const root = document.documentElement;
    root.style.backgroundColor = theme.bgFrom;
    
    // Apply dark color-scheme for scrollbars/native UI if dark theme
    root.style.colorScheme = themeName === 'dark' ? 'dark' : 'light';

    root.style.setProperty('--bg-from', theme.bgFrom);
    root.style.setProperty('--bg-via', theme.bgVia);
    root.style.setProperty('--bg-to', theme.bgTo);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--accent-hover', theme.accentHover);
    root.style.setProperty('--accent-shadow', theme.accentShadow);
    root.style.setProperty('--accent-ring', theme.accentRing);
    root.style.setProperty('--accent-text', theme.accentText);
    root.style.setProperty('--accent-subtext', theme.accentSubtext);
    root.style.setProperty('--card-bg', theme.cardBg);
    root.style.setProperty('--card-border', theme.cardBorder);
    root.style.setProperty('--card-hover-bg', theme.cardHoverBg);
    root.style.setProperty('--card-hover-border', theme.cardHoverBorder);
    root.style.setProperty('--header-bg', theme.headerBg);
    root.style.setProperty('--progress-bar', theme.progressBar);
    root.style.setProperty('--section-label', theme.sectionLabel);
    root.style.setProperty('--link-color', theme.linkColor);
    root.style.setProperty('--link-hover', theme.linkHover);
    root.style.setProperty('--text-main', theme.textMain);
    root.style.setProperty('--text-sub', theme.textSub);
    root.style.setProperty('--border-light', theme.borderLight);
    root.style.setProperty('--input-bg', theme.inputBg);
    root.style.setProperty('--input-border', theme.inputBorder);
    root.style.setProperty('--input-placeholder', theme.inputPlaceholder);
    root.style.setProperty('--btn-text', theme.btnText);
    root.style.setProperty('--dropdown-bg', theme.dropdownBg);
    root.style.setProperty('--dropdown-hover', theme.dropdownHover);
  }, [theme, themeName]);

  function setTheme(name: ThemeName) {
    setThemeName(name);
    localStorage.setItem('app_theme', name);
  }

  function toggleTheme() {
    setTheme(themeName === 'dark' ? 'light' : 'dark');
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
