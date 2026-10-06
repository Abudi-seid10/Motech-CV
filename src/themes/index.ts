import type { LayoutId } from "@/lib/types";

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

export interface LayoutOption {
  id: LayoutId;
  name: string;
  description: string;
  /** Whether the layout has a slot for a profile photo. */
  photo: boolean;
}

/** CV formats — the page structure, independent of the color theme above. */
export const LAYOUTS: LayoutOption[] = [
  { id: "editorial", name: "Editorial", description: "The original themed long-scroll page. PDF is plain and ATS-friendly.", photo: false },
  { id: "classic", name: "Classic", description: "Centered name, ruled sections, black on white.", photo: false },
  { id: "profile", name: "Profile", description: "Round photo and personal data on the left, content on the right.", photo: true },
  { id: "teal", name: "Teal Ribbon", description: "Dark teal sidebar, gold pill headings, photo header.", photo: true },
  { id: "navy", name: "Navy Timeline", description: "Navy sidebar with photo and a timeline for experience.", photo: true },
  { id: "modern", name: "Modern Band", description: "Indigo header band, accent headings, pill-style skills.", photo: false },
  { id: "executive", name: "Executive", description: "Serif type, centered header, ruled sections with a label column.", photo: false },
  { id: "creative", name: "Creative", description: "Dark photo header, coral accents, content plus a tinted sidebar.", photo: true },
];

export const DEFAULT_LAYOUT: LayoutId = "editorial";

export function layoutOf(data: { layout?: LayoutId }): LayoutId {
  return data.layout && LAYOUTS.some((l) => l.id === data.layout) ? data.layout : DEFAULT_LAYOUT;
}
