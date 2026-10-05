export interface PlanInfo {
  id: "free" | "basic" | "pro";
  name: string;
  price: string;
  tagline: string;
  features: string[];
  available: boolean;
  /** Max stored CRM contacts; null = unlimited. Enforced in the database (see supabase/schema.sql). */
  contactLimit: number | null;
  /** CRM export (CSV / vCard). Gated in the UI only — owners can already read their own rows. */
  canExport: boolean;
}

export const PLANS: PlanInfo[] = [
  {
    id: "free",
    name: "Starter",
    price: "Free",
    tagline: "Everything you need to publish a real CV today.",
    features: [
      "Your own /yourname address",
      "Link-in-bio card at /card/yourname",
      "Unlimited edits, unlimited sections",
      "ATS-friendly PDF download",
      "Custom sections — Projects, Recommendations, anything",
      "Both built-in themes",
      "CRM for up to 10 contacts",
    ],
    available: true,
    contactLimit: 10,
    canExport: false,
  },
  {
    id: "basic",
    name: "Basic",
    price: "Coming soon",
    tagline: "A more personal address and look.",
    features: ["CRM for up to 100 contacts", "Export contacts (CSV & vCard)", "Custom domain", "More themes", "Remove built-with branding", "Priority support"],
    available: false,
    contactLimit: 100,
    canExport: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "Coming soon",
    tagline: "For people actively job-hunting.",
    features: ["Everything in Basic", "Unlimited CRM contacts + export", "Visitor analytics", "Multiple CV versions", "Cover-letter builder"],
    available: false,
    contactLimit: null,
    canExport: true,
  },
];

export function contactLimitFor(plan: PlanInfo["id"] | undefined): number | null {
  return (PLANS.find((p) => p.id === plan) ?? PLANS[0]).contactLimit;
}

export function canExportContacts(plan: PlanInfo["id"] | undefined): boolean {
  return (PLANS.find((p) => p.id === plan) ?? PLANS[0]).canExport;
}
