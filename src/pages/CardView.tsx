import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { applyTheme, DEFAULT_THEME } from "@/themes";
import DownloadButton from "@/components/DownloadButton";
import PrintLayout from "@/pdf/PrintLayout";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

interface LinkRow {
  label: string;
  href: string;
}

export default function CardView() {
  const { slug } = useParams<{ slug: string }>();
  const { data, theme, isDemo, loading, notFound, error } = useProfile(slug);

  useEffect(() => {
    applyTheme(theme);
    return () => applyTheme(DEFAULT_THEME);
  }, [theme]);

  if (loading) {
    return <div className="min-h-screen grid place-items-center font-mono text-sm text-muted">Loading…</div>;
  }

  if (notFound || error || !data) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center">
        <div>
          <h1 className="font-display text-3xl mb-3">No card at /card/{slug}</h1>
          <Link to="/signup" className="text-gold-dim hover:text-gold font-mono text-xs">
            Claim /{slug} →
          </Link>
        </div>
      </div>
    );
  }

  const { personal, card } = data;

  const autoLinks: (LinkRow | false)[] = [
    card.showEmail && Boolean(personal.email) && { label: personal.email, href: `mailto:${personal.email}` },
    card.showPhone && Boolean(personal.phone) && {
      label: personal.phone,
      href: `tel:${personal.phone.replace(/\s+/g, "")}`,
    },
    card.showLinkedin && Boolean(personal.linkedin) && {
      label: "LinkedIn",
      href: `https://${personal.linkedin.replace(/^https?:\/\//, "")}`,
    },
    card.showGithub && Boolean(personal.github) && {
      label: "GitHub",
      href: `https://${personal.github.replace(/^https?:\/\//, "")}`,
    },
  ];

  const customLinks: LinkRow[] = (card.links ?? [])
    .filter((l) => l.label && l.url)
    .map((l) => ({ label: l.label, href: l.url.startsWith("http") ? l.url : `https://${l.url}` }));

  const links: LinkRow[] = [...autoLinks.filter(Boolean), ...customLinks] as LinkRow[];

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 sm:py-20">
      {isDemo && (
        <p className="font-mono text-[11px] text-gold-dim mb-6 border border-gold/30 rounded-full px-3 py-1">
          Demo card — <Link to="/signup" className="underline">build your own</Link>
        </p>
      )}
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 h-20 w-20 rounded-full border border-gold/40 grid place-items-center font-display text-2xl text-gold-soft">
          {initials(personal.name)}
        </div>
        <h1 className="font-display text-3xl tracking-wide mb-1">{personal.name || "Your Name"}</h1>
        <p className="font-body text-gold-soft mb-1">{card.tagline || personal.title}</p>
        {personal.location && <p className="font-mono text-xs text-muted mb-8">{personal.location}</p>}

        <div className="space-y-3 mb-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target={l.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="block w-full border border-border rounded-full px-5 py-3 text-sm text-bone/90 hover:border-gold/60 hover:text-gold-soft transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="space-y-3">
          <Link
            to={`/${slug}`}
            className="block w-full border border-gold/50 rounded-full px-5 py-3 font-mono text-xs uppercase tracking-widest2 text-gold-soft hover:bg-gold hover:text-ink transition-colors"
          >
            View full CV
          </Link>
          <div className="flex justify-center">
            <DownloadButton filename={slug} />
          </div>
        </div>

        <p className="font-mono text-[11px] text-muted mt-10">
          <Link to="/signup" className="text-gold-dim hover:text-gold">Make your own card →</Link>
        </p>

        {/* Off-screen — captured by the PDF export button. Absolute + a large
            negative offset keeps it out of view without display:none or a
            negative z-index, both of which can stop html2canvas from capturing it. */}
        <div
          aria-hidden="true"
          style={{ position: "absolute", top: 0, left: "-9999px", width: "794px", pointerEvents: "none" }}
        >
          <PrintLayout data={data} />
        </div>
      </div>
    </div>
  );
}
