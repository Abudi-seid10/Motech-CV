export type ThemeId = "editorial-gold" | "minimal-mono";

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
}

export const THEMES: Theme[] = [
  {
    id: "editorial-gold",
    name: "Editorial Gold",
    description: "Dark background, gold accents, editorial-magazine type.",
  },
  {
    id: "minimal-mono",
    name: "Minimal Mono",
    description: "Light, clean, monochrome — reads closest to the downloaded PDF.",
  },
];

export const DEFAULT_THEME: ThemeId = "editorial-gold";

export function isThemeId(value: string): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

/** Applies a theme by setting data-theme on <html> — see CSS vars in src/index.css */
export function applyTheme(theme: ThemeId) {
  document.documentElement.dataset.theme = theme;
}
