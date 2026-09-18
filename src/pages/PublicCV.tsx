import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { applyTheme, DEFAULT_THEME } from "@/themes";
import Hero from "@/components/Hero";
import Summary from "@/components/Summary";
import Competencies from "@/components/Competencies";
import Experience from "@/components/Experience";
import Education from "@/components/Education";
import Certifications from "@/components/Certifications";
import Awards from "@/components/Awards";
import Languages from "@/components/Languages";
import CustomSections from "@/components/CustomSections";
import PrintLayout from "@/pdf/PrintLayout";

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

      <Hero personal={data.personal} filename={slug} />
      <Summary summary={data.summary} />
      <Competencies groups={data.competencies} />
      <Experience entries={data.experience} />
      <Education entries={data.education} />
      <Certifications entries={data.certifications} />
      <Awards entries={data.awards} />
      <Languages languages={data.languages} strengths={data.strengths} />
      <CustomSections sections={data.customSections} startIndex={8} />

      <footer className="border-t border-border py-10 text-center font-mono text-xs text-muted space-x-4">
        <Link to={`/card/${slug}`} className="text-gold-dim hover:text-gold">Link-in-bio card ↗</Link>
        <span>·</span>
        <Link to="/" className="text-gold-dim hover:text-gold">
          this open-source CV builder
        </Link>
        <span>·</span>
        <Link to="/signup" className="text-gold-dim hover:text-gold">build your own, free</Link>
      </footer>

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
  );
}
