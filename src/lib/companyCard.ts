import { supabase } from "@/lib/supabase";

export type ButtonKind = "link" | "email" | "phone" | "whatsapp";
export type ButtonVariant = "solid" | "outline";
export type ButtonShape = "pill" | "rounded" | "square";
export type CardBackground = "dark" | "light" | "gradient";

export interface CompanyButton {
  id: string;
  label: string;
  /** URL for "link"; email address, phone number or WhatsApp number for the others. */
  value: string;
  kind: ButtonKind;
  variant: ButtonVariant;
}

export interface CompanyCardData {
  companyName: string;
  tagline: string;
  about: string;
  /** Square JPEG data URL (see lib/photo.ts). */
  logo?: string;
  accent: string;
  background: CardBackground;
  buttonShape: ButtonShape;
  website: string;
  email: string;
  phone: string;
  address: string;
  buttons: CompanyButton[];
}

export interface CompanyCardRow {
  id: string;
  owner_id: string;
  slug: string;
  is_public: boolean;
  data: CompanyCardData;
  updated_at: string;
}

export const emptyCompanyCard: CompanyCardData = {
  companyName: "",
  tagline: "",
  about: "",
  accent: "#c9a24b",
  background: "dark",
  buttonShape: "pill",
  website: "",
  email: "",
  phone: "",
  address: "",
  buttons: [],
};

export const ACCENT_PRESETS = ["#c9a24b", "#2f80ed", "#16a34a", "#e11d48", "#7c3aed", "#f97316", "#0d9488", "#111827"];

export function normalizeCompanyCard(partial: Partial<CompanyCardData> | null | undefined): CompanyCardData {
  return { ...emptyCompanyCard, ...(partial ?? {}), buttons: partial?.buttons ?? [] };
}

const withProtocol = (url: string) => (/^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`);

/** Resolves a button to a safe href; returns null when the value is empty or uses a non-web scheme. */
export function buttonHref(b: Pick<CompanyButton, "kind" | "value">): string | null {
  const v = b.value.trim();
  if (!v) return null;
  switch (b.kind) {
    case "email":
      return `mailto:${v}`;
    case "phone":
      return `tel:${v.replace(/\s+/g, "")}`;
    case "whatsapp":
      return `https://wa.me/${v.replace(/\D+/g, "")}`;
    default: {
      const href = withProtocol(v);
      return /^https?:/i.test(href) ? href : null;
    }
  }
}

export function fetchCompanyCardBySlug(slug: string) {
  return supabase.from("company_cards").select("*").eq("slug", slug).maybeSingle();
}

export function fetchOwnCompanyCard(ownerId: string) {
  return supabase.from("company_cards").select("*").eq("owner_id", ownerId).maybeSingle();
}

export function createCompanyCard(ownerId: string, slug: string, data: CompanyCardData) {
  return supabase.from("company_cards").insert({ owner_id: ownerId, slug, data }).select().single();
}

export function saveCompanyCard(ownerId: string, updates: Partial<Pick<CompanyCardRow, "data" | "is_public">>) {
  return supabase.from("company_cards").update(updates).eq("owner_id", ownerId).select().single();
}
