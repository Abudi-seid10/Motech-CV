import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { applyTheme, DEFAULT_THEME, LAYOUTS, layoutOf } from "@/themes";
import type { LayoutId } from "@/lib/types";
import SiteHeader, { navLink, navButton } from "@/components/brand/SiteHeader";
import SiteFooter from "@/components/brand/SiteFooter";
import StatusScreen from "@/components/brand/StatusScreen";
import CVPreview from "@/components/cv/CVPreview";

export default function PublicCV() {
  const { slug } = useParams<{ slug: string }>();
  const { data, theme, isOwner, isDemo, loading, notFound, error } = useProfile(slug);

  const [demoLayout, setDemoLayout] = useState<LayoutId | null>(null);

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

  if (notFound) {
    return (
      <StatusScreen>
        <div>
          <h1 className="font-display text-4xl mb-3">No CV at /{slug}</h1>
          <p className="text-muted mb-6">That address hasn't been claimed yet.</p>
          <Link to="/signup" className="btn-solid">Claim /{slug}</Link>
        </div>
      </StatusScreen>
    );
  }

  if (error || !data) {
    return (
      <StatusScreen>
        <p className="font-mono text-sm text-red-400">{error ?? "Something went wrong."}</p>
      </StatusScreen>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader title={data.personal.name ? `${data.personal.name}'s CV` : "CV"}>
        <Link to={`/card/${slug}`} className={navLink}>Card</Link>
        {isOwner ? (
          <Link to={`/${slug}/edit`} className={navButton}>Edit</Link>
        ) : (
          <Link to="/signup" className={navButton}>Build yours</Link>
        )}
      </SiteHeader>
      {isDemo && (
        <div className="bg-gold text-ink text-center text-xs font-mono py-2 px-4">
          This is a demo CV — <Link to="/signup" className="underline">build your own, free</Link>
        </div>
      )}
      {isDemo && (
        <div className="flex flex-wrap items-center justify-center gap-2 border-b border-border bg-surface/60 px-4 py-3">
          <span className="eyebrow mr-2">Try a template</span>
          {LAYOUTS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setDemoLayout(l.id)}
              aria-pressed={layoutOf({ layout: demoLayout ?? data.layout }) === l.id}
              className={`rounded-full border px-3 py-1 font-mono text-[11px] transition-colors ${
                layoutOf({ layout: demoLayout ?? data.layout }) === l.id
                  ? "border-gold bg-gold text-ink"
                  : "border-border text-muted hover:border-gold/50 hover:text-gold"
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>
      )}
      {isOwner && (
        <div className="bg-gold text-ink text-center text-xs font-mono py-2 px-4">
          This is your CV — <Link to={`/${slug}/edit`} className="underline">edit it</Link>
        </div>
      )}

      <main className="flex-1">
        <CVPreview data={isDemo && demoLayout ? { ...data, layout: demoLayout } : data} filename={slug} />
      </main>

      <SiteFooter />
    </div>
  );
}
