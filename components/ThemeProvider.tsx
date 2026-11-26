"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeId = "obsidian" | "circuit" | "sora" | "amber" | "paper";

export interface ThemeSpec {
  id: ThemeId;
  name: string;
  short: string;
  description: string;
  isLight: boolean;
  accent: string;
  accentSoft: string;
  palette: [string, string, string, string];
}

export const PORTFOLIO_THEMES: ThemeSpec[] = [
  {
    id: "obsidian",
    name: "Gold Obsidian",
    short: "Obsidian",
    description: "Noir profond & or champagne (Défaut)",
    isLight: false,
    accent: "#D9A441",
    accentSoft: "#F3C669",
    palette: ["#0e0c0b", "#D9A441", "#10B981", "#f2ece4"],
  },
  {
    id: "circuit",
    name: "Circuit Emerald",
    short: "Circuit",
    description: "Vert phosphore Spring / Matrix sur verre noir",
    isLight: false,
    accent: "#3DDC84",
    accentSoft: "#6EE7B7",
    palette: ["#07110c", "#3DDC84", "#FFD166", "#d3f0dd"],
  },
  {
    id: "sora",
    name: "Cyber Sora",
    short: "Sora",
    description: "Acier froid, cyan électrique & indigo",
    isLight: false,
    accent: "#4CC9F0",
    accentSoft: "#9FB4FF",
    palette: ["#0b1015", "#4CC9F0", "#6EE7B7", "#d9e4ee"],
  },
  {
    id: "amber",
    name: "Amber Terminal",
    short: "Amber",
    description: "Ambre CRT chaleureux façon console rétro",
    isLight: false,
    accent: "#F7931A",
    accentSoft: "#FFCF6B",
    palette: ["#0e0c08", "#F7931A", "#FFCF6B", "#f1e6cc"],
  },
  {
    id: "paper",
    name: "Paper Studio",
    short: "Paper",
    description: "Mode clair givré — vidéo visible sous verre crème",
    isLight: true,
    accent: "#B4532A",
    accentSoft: "#D97706",
    palette: ["#f6f2e9", "#B4532A", "#2f6f4f", "#1d1c1a"],
  },
];

interface ThemeContextType {
  theme: ThemeId;
  activeTheme: ThemeSpec;
  setTheme: (id: ThemeId) => void;
  cycleTheme: () => ThemeSpec;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "obsidian",
  activeTheme: PORTFOLIO_THEMES[0],
  setTheme: () => {},
  cycleTheme: () => PORTFOLIO_THEMES[0],
});

const STORAGE_KEY = "portfolio.theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("obsidian");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
      if (saved && PORTFOLIO_THEMES.some((t) => t.id === saved)) {
        setThemeState(saved);
        applyDomTheme(saved);
      } else {
        applyDomTheme("obsidian");
      }
    } catch {
      applyDomTheme("obsidian");
    }
  }, []);

  const applyDomTheme = (id: ThemeId) => {
    const spec = PORTFOLIO_THEMES.find((t) => t.id === id) || PORTFOLIO_THEMES[0];
    const root = document.documentElement;
    root.dataset.theme = spec.id;
    root.style.colorScheme = spec.isLight ? "light" : "dark";
  };

  const setTheme = (id: ThemeId) => {
    setThemeState(id);
    applyDomTheme(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {}
  };

  const cycleTheme = () => {
    const idx = PORTFOLIO_THEMES.findIndex((t) => t.id === theme);
    const next = PORTFOLIO_THEMES[(idx + 1) % PORTFOLIO_THEMES.length];
    setTheme(next.id);
    return next;
  };

  const activeTheme = PORTFOLIO_THEMES.find((t) => t.id === theme) || PORTFOLIO_THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, activeTheme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
