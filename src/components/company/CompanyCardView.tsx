import { CSSProperties } from "react";
import { CompanyCardData, CardBackground, ButtonShape, buttonHref } from "@/lib/companyCard";

const BACKGROUNDS: Record<CardBackground, { bg: (accent: string) => string; fg: string; muted: string }> = {
  dark: { bg: () => "#0e0e10", fg: "#f2efe8", muted: "#9a978f" },
  light: { bg: () => "#f7f5f0", fg: "#1a1a1a", muted: "#6b6860" },
  gradient: { bg: (a) => `linear-gradient(160deg, ${a}33 0%, #0e0e10 65%)`, fg: "#f2efe8", muted: "#b5b1a8" },
};

const RADIUS: Record<ButtonShape, string> = { pill: "9999px", rounded: "14px", square: "2px" };

function readableOn(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "#fff";
  const n = parseInt(m[1], 16);
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? "#111" : "#fff";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** The company card itself — shared by the public page and the editor's live preview, so they can't drift. */
export default function CompanyCardView({ card, className = "" }: { card: CompanyCardData; className?: string }) {
  const theme = BACKGROUNDS[card.background] ?? BACKGROUNDS.dark;
  const radius = RADIUS[card.buttonShape] ?? RADIUS.pill;
  const onAccent = readableOn(card.accent);

  const buttonStyle = (variant: "solid" | "outline"): CSSProperties =>
    variant === "solid"
      ? { background: card.accent, color: onAccent, border: `1px solid ${card.accent}`, borderRadius: radius }
      : { background: "transparent", color: theme.fg, border: `1px solid ${card.accent}`, borderRadius: radius };

  const buttons = card.buttons
    .map((b) => ({ b, href: buttonHref(b) }))
    .filter((x) => x.b.label.trim() && x.href);

  const details = [
    card.website && { label: card.website, href: buttonHref({ kind: "link", value: card.website }) },
    card.email && { label: card.email, href: buttonHref({ kind: "email", value: card.email }) },
    card.phone && { label: card.phone, href: buttonHref({ kind: "phone", value: card.phone }) },
    card.address && { label: card.address, href: null },
  ].filter(Boolean) as { label: string; href: string | null }[];

  return (
    <div
      className={`flex flex-col items-center px-4 py-12 sm:py-16 ${className}`}
      style={{ background: theme.bg(card.accent), color: theme.fg }}
    >
      <div className="w-full max-w-sm text-center">
        {card.logo ? (
          <img
            src={card.logo}
            alt={card.companyName ? `${card.companyName} logo` : "Company logo"}
            className="mx-auto mb-6 h-24 w-24 object-cover"
            style={{ borderRadius: radius === "9999px" ? "9999px" : "18px", border: `2px solid ${card.accent}` }}
          />
        ) : (
          <div
            className="mx-auto mb-6 grid h-24 w-24 place-items-center text-3xl font-semibold"
            style={{ borderRadius: radius === "9999px" ? "9999px" : "18px", border: `2px solid ${card.accent}`, color: card.accent }}
          >
            {initials(card.companyName)}
          </div>
        )}
        <h1 className="text-3xl font-semibold mb-1">{card.companyName || "Your Company"}</h1>
        {card.tagline && (
          <p className="mb-4" style={{ color: card.accent }}>
            {card.tagline}
          </p>
        )}
        {card.about && (
          <p className="text-sm leading-relaxed mb-8 whitespace-pre-line" style={{ color: theme.muted }}>
            {card.about}
          </p>
        )}

        <div className="space-y-3 mb-8">
          {buttons.map(({ b, href }) => (
            <a
              key={b.id}
              href={href!}
              target={href!.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="block w-full px-5 py-3 text-sm font-medium transition-opacity hover:opacity-80"
              style={buttonStyle(b.variant)}
            >
              {b.label}
            </a>
          ))}
          {buttons.length === 0 && (
            <p className="text-xs" style={{ color: theme.muted }}>
              No buttons yet.
            </p>
          )}
        </div>

        {details.length > 0 && (
          <ul className="space-y-1.5 text-xs" style={{ color: theme.muted }}>
            {details.map((d) => (
              <li key={d.label}>
                {d.href ? (
                  <a href={d.href} target={d.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="hover:underline">
                    {d.label}
                  </a>
                ) : (
                  d.label
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
