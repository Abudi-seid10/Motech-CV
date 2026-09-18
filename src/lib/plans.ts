export interface PlanInfo {
  id: "free" | "basic" | "pro";
  name: string;
  price: string;
  tagline: string;
  features: string[];
  available: boolean;
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
    ],
    available: true,
  },
  {
    id: "basic",
    name: "Basic",
    price: "Coming soon",
    tagline: "A more personal address and look.",
    features: ["Custom domain", "More themes", "Remove built-with branding", "Priority support"],
    available: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "Coming soon",
    tagline: "For people actively job-hunting.",
    features: ["Everything in Basic", "Visitor analytics", "Multiple CV versions", "Cover-letter builder"],
    available: false,
  },
];
