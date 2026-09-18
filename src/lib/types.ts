export interface Personal {
  name: string;
  title: string;
  location: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
}

export interface CompetencyGroup {
  category: string;
  items: string[];
}

export interface ExperienceEntry {
  company: string;
  role: string;
  dates: string;
  location: string;
  bullets: string[];
}

export interface EducationEntry {
  school: string;
  degree: string;
  dates: string;
  details?: string;
}

export interface CertificationEntry {
  name: string;
  issuer: string;
  year: string;
}

export interface AwardEntry {
  name: string;
  issuer: string;
  year: string;
  project?: string;
}

export interface LanguageEntry {
  name: string;
  level: string;
}

export interface CustomEntry {
  heading: string;
  subheading?: string;
  meta?: string;
  body?: string;
  bullets?: string[];
}

export interface CustomSection {
  id: string;
  title: string;
  entries: CustomEntry[];
}

export interface CardLink {
  label: string;
  url: string;
}

export interface CardSettings {
  /** Short one-liner shown on /card/{slug} instead of the full title, e.g. "Open to freelance work" */
  tagline: string;
  showEmail: boolean;
  showPhone: boolean;
  showLinkedin: boolean;
  showGithub: boolean;
  /** Extra Linktree-style links (portfolio site, X/Twitter, Calendly, etc.) */
  links: CardLink[];
}

export interface CVData {
  personal: Personal;
  summary: string;
  competencies: CompetencyGroup[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  certifications: CertificationEntry[];
  awards: AwardEntry[];
  languages: LanguageEntry[];
  strengths: string[];
  /** User-defined additional sections — Projects, Recommendations, Publications, etc. */
  customSections: CustomSection[];
  /** Customization for the /card/{slug} link-in-bio page */
  card: CardSettings;
}

export interface ProfileRow {
  id: string;
  owner_id: string;
  slug: string;
  is_public: boolean;
  data: CVData;
  updated_at: string;
}

/** A blank data object — used when creating a brand-new profile row. */
export const emptyCVData: CVData = {
  personal: { name: "", title: "", location: "", phone: "", email: "", linkedin: "", github: "" },
  summary: "",
  competencies: [],
  experience: [],
  education: [],
  certifications: [],
  awards: [],
  languages: [],
  strengths: [],
  customSections: [],
  card: { tagline: "", showEmail: true, showPhone: true, showLinkedin: true, showGithub: true, links: [] },
};

/**
 * Backfills any field missing from a stored row (e.g. `customSections` on a
 * profile saved before that field existed) with the empty default, so older
 * data never crashes a component expecting the full shape.
 */
export function normalizeCVData(partial: Partial<CVData> | null | undefined): CVData {
  return { ...emptyCVData, ...(partial ?? {}) };
}
