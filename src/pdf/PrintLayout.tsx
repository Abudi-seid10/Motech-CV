import { CVData } from "@/lib/types";

/**
 * Rendered off-screen (see Public.tsx) and captured by generatePDF().
 * Deliberately plain/light — this is what gets printed or attached to
 * job applications, so it favors ATS-readability over the site's editorial
 * dark theme.
 */
export default function PrintLayout({ data }: { data: CVData }) {
  const { personal } = data;
  return (
    <div id="pdf-export-root" className="pdf-export-root p-12">
      <h1 className="text-3xl font-bold tracking-tight">{personal.name}</h1>
      <p className="text-sm text-[#5b5b63] mt-1">{personal.title}</p>
      <p className="text-xs text-[#7a7a82] mt-2">
        {[personal.location, personal.phone, personal.email, personal.linkedin, personal.github]
          .filter(Boolean)
          .join("  •  ")}
      </p>

      {data.summary && (
        <section className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#a6862a] border-b border-[#e4e1d8] pb-1 mb-2">
            Profile
          </h2>
          <p className="text-sm leading-relaxed">{data.summary}</p>
        </section>
      )}

      {data.competencies?.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#a6862a] border-b border-[#e4e1d8] pb-1 mb-2">
            Core Competencies
          </h2>
          {data.competencies.map((g) => (
            <p key={g.category} className="text-sm mb-1">
              <span className="font-semibold">{g.category}: </span>
              {g.items.join(" • ")}
            </p>
          ))}
        </section>
      )}

      {data.experience?.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#a6862a] border-b border-[#e4e1d8] pb-1 mb-2">
            Professional Experience
          </h2>
          {data.experience.map((e, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between items-baseline">
                <p className="text-sm font-bold">
                  {e.role} — {e.company}
                </p>
                <p className="text-xs text-[#7a7a82]">{e.dates}</p>
              </div>
              {e.location && <p className="text-xs text-[#7a7a82]">{e.location}</p>}
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                {e.bullets.map((b, bi) => (
                  <li key={bi} className="text-sm leading-snug">{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {data.education?.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#a6862a] border-b border-[#e4e1d8] pb-1 mb-2">
            Education
          </h2>
          {data.education.map((e, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline">
                <p className="text-sm font-bold">{e.school}</p>
                <p className="text-xs text-[#7a7a82]">{e.dates}</p>
              </div>
              <p className="text-sm">{e.degree}</p>
              {e.details && <p className="text-xs text-[#5b5b63] mt-1">{e.details}</p>}
            </div>
          ))}
        </section>
      )}

      {data.certifications?.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#a6862a] border-b border-[#e4e1d8] pb-1 mb-2">
            Certifications
          </h2>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-0.5">
            {data.certifications.map((c, i) => (
              <li key={i} className="text-sm">
                {c.name} — <span className="text-[#7a7a82]">{c.issuer}{c.year ? ` (${c.year})` : ""}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.awards?.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#a6862a] border-b border-[#e4e1d8] pb-1 mb-2">
            Awards
          </h2>
          {data.awards.map((a, i) => (
            <p key={i} className="text-sm">
              <span className="font-semibold">{a.name}</span> — {a.issuer}{a.year ? ` (${a.year})` : ""}
              {a.project ? ` — ${a.project}` : ""}
            </p>
          ))}
        </section>
      )}

      {(data.languages?.length > 0 || data.strengths?.length > 0) && (
        <section className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#a6862a] border-b border-[#e4e1d8] pb-1 mb-2">
            Languages & Strengths
          </h2>
          {data.languages?.length > 0 && (
            <p className="text-sm mb-1">
              {data.languages.map((l) => `${l.name} (${l.level})`).join(" • ")}
            </p>
          )}
          {data.strengths?.length > 0 && (
            <p className="text-sm text-[#5b5b63]">{data.strengths.join(" • ")}</p>
          )}
        </section>
      )}

      {data.customSections
        ?.filter((s) => s.entries.length > 0)
        .map((s) => (
          <section key={s.id} className="mt-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#a6862a] border-b border-[#e4e1d8] pb-1 mb-2">
              {s.title}
            </h2>
            {s.entries.map((e, i) => (
              <div key={i} className="mb-3">
                <div className="flex justify-between items-baseline">
                  <p className="text-sm font-bold">
                    {e.heading}
                    {e.subheading ? ` — ${e.subheading}` : ""}
                  </p>
                  {e.meta && <p className="text-xs text-[#7a7a82]">{e.meta}</p>}
                </div>
                {e.body && <p className="text-sm leading-snug mt-0.5">{e.body}</p>}
                {e.bullets && e.bullets.length > 0 && (
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    {e.bullets.map((b, bi) => (
                      <li key={bi} className="text-sm leading-snug">{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        ))}
    </div>
  );
}
