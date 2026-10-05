import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { applyTheme, DEFAULT_THEME } from "@/themes";
import CVPreview from "@/components/cv/CVPreview";

export default function PublicCV() {
  const { slug } = useParams<{ slug: string }>();
  const { data, theme, isOwner, isDemo, loading, notFound, error } = useProfile(slug);

  useEffect(() => {
    applyTheme(theme);
    return () => applyTheme(DEFAULT_THEME);
  }, [theme]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center font-mono text-sm text-muted">Loading…</div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center">
        <div>
          <h1 className="font-display text-4xl mb-3">No CV at /{slug}</h1>
          <p className="text-muted mb-6">That address hasn't been claimed yet.</p>
          <Link to="/signup" className="border border-gold/50 px-6 py-3 font-mono text-xs uppercase tracking-widest2 text-gold-soft hover:bg-gold hover:text-ink transition-colors">
            Claim /{slug}
          </Link>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen grid place-items-center font-mono text-sm text-red-400">
        {error ?? "Something went wrong."}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {isDemo && (
        <div className="bg-gold text-ink text-center text-xs font-mono py-2 px-4">
          This is a demo CV — <Link to="/signup" className="underline">build your own, free</Link>
        </div>
      )}
      {isOwner && (
        <div className="bg-gold text-ink text-center text-xs font-mono py-2 px-4">
          This is your CV — <Link to={`/${slug}/edit`} className="underline">edit it</Link>
        </div>
      )}

      <CVPreview data={data} filename={slug} />

      <footer className="border-t border-border py-10 text-center font-mono text-xs text-muted space-x-4">
        <Link to={`/card/${slug}`} className="text-gold-dim hover:text-gold">Link-in-bio card ↗</Link>
        <span>·</span>
        <Link to="/" className="text-gold-dim hover:text-gold">
          this open-source CV builder
        </Link>
        <span>·</span>
        <Link to="/signup" className="text-gold-dim hover:text-gold">build your own, free</Link>
      </footer>
    </div>
  );
}
