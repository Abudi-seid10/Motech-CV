import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { applyTheme, DEFAULT_THEME } from "@/themes";
import SiteHeader, { navLink } from "@/components/brand/SiteHeader";
import SiteFooter from "@/components/brand/SiteFooter";
import StatusScreen from "@/components/brand/StatusScreen";
import DownloadButton from "@/components/DownloadButton";
import ContactForm from "@/components/ContactForm";
import { downloadVCard } from "@/lib/vcard";

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
  const { data, row, theme, isDemo, loading, notFound, error } = useProfile(slug);

  useEffect(() => {
    applyTheme(theme);
    return () => applyTheme(DEFAULT_THEME);
  }, [theme]);

  if (loading) {
    return (
      <StatusScreen>
        <p className="font-mono text-sm text-muted">Loading…</p>
      </StatusScreen>
    );
  }

  if (notFound || error || !data) {
    return (
      <StatusScreen>
        <div>
          <h1 className="font-display text-3xl mb-3">No card at /card/{slug}</h1>
          <Link to="/signup" className="btn-solid">Claim /{slug} →</Link>
        </div>
      </StatusScreen>
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

  const helloHref = personal.email
    ? `mailto:${personal.email}?subject=${encodeURIComponent(`Hi ${personal.name || ""}!`)}&body=${encodeURIComponent(
        "Hi, I found your card and wanted to say hello —"
      )}`
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader title="Card">
        <Link to={`/${slug}`} className={navLink}>Full CV</Link>
        <Link to="/signup" className={navLink}>Make your own</Link>
      </SiteHeader>
      <main className="flex-1 flex flex-col items-center px-4 py-12 sm:py-16">
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

        <div className="space-y-3 mb-6">
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

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => downloadVCard(data, slug)}
            className="rounded-full border border-border px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest2 text-bone/90 hover:border-gold/60 hover:text-gold-soft transition-colors"
          >
            Save Contact
          </button>
          {helloHref ? (
            <a
              href={helloHref}
              className="rounded-full border border-border px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest2 text-bone/90 hover:border-gold/60 hover:text-gold-soft transition-colors text-center"
            >
              Say Hello 👋
            </a>
          ) : (
            <span className="rounded-full border border-border px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest2 text-muted/50 text-center cursor-not-allowed">
              Say Hello 👋
            </span>
          )}
        </div>

        <div className="space-y-3 mb-8">
          <Link
            to={`/${slug}`}
            className="btn-solid w-full"
          >
            View full CV
          </Link>
          <div className="flex justify-center">
            <DownloadButton data={data} filename={slug} />
          </div>
        </div>

        {isDemo || !row ? (
          <div className="card p-5 text-center mb-4">
            <p className="font-mono text-[11px] text-muted">
              Contact form (demo) — <Link to="/signup" className="text-gold-dim hover:text-gold underline">sign up</Link> to collect real contacts on your own card.
            </p>
          </div>
        ) : (
          <ContactForm ownerId={row.user_id} ownerEmail={row.email} ownerName={row.name} ownerSlug={slug} />
        )}

        <p className="font-mono text-[11px] text-muted mt-10">
          <Link to="/signup" className="text-gold-dim hover:text-gold">Make your own card →</Link>
        </p>
      </div>
      </main>
      <SiteFooter />
    </div>
  );
}
