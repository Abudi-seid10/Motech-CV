export type ThemeId = "editorial-gold" | "minimal-mono" | "coastal-cyan" | "forest-lime" | "terracotta-ink";

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
  {
    id: "coastal-cyan",
    name: "Coastal Cyan",
    description: "Deep navy, bright cyan accents, and a crisp modern rhythm.",
  },
  {
    id: "forest-lime",
    name: "Forest Lime",
    description: "Warm paper, evergreen surfaces, and lively lime highlights.",
  },
  {
    id: "terracotta-ink",
    name: "Terracotta Ink",
    description: "Soft clay, charcoal ink, and a confident creative feel.",
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
