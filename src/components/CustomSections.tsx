import { CVData } from "@/lib/types";
import Section from "./layout/Section";

export default function CustomSections({
  sections,
  startIndex,
}: {
  sections: CVData["customSections"];
  startIndex: number;
}) {
  const visible = (sections ?? []).filter((s) => s.entries.length > 0);
  if (!visible.length) return null;

  return (
    <>
      {visible.map((s, i) => (
        <Section key={s.id} index={String(startIndex + i).padStart(2, "0")} title={s.title}>
          <div className="space-y-6">
            {s.entries.map((e, ei) => (
              <div key={ei} className="card p-6">
                <div className="flex items-baseline justify-between gap-4 mb-1">
                  <h3 className="font-display text-xl tracking-wide text-gold-soft">{e.heading}</h3>
                  {e.meta && <span className="font-mono text-xs text-gold-dim shrink-0">{e.meta}</span>}
                </div>
                {e.subheading && <p className="text-muted text-sm mb-2">{e.subheading}</p>}
                {e.body && <p className="text-bone/80 leading-relaxed">{e.body}</p>}
                {e.bullets && e.bullets.length > 0 && (
                  <ul className="space-y-1 mt-2">
                    {e.bullets.map((b, bi) => (
                      <li key={bi} className="flex gap-3 text-bone/80 text-sm">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      ))}
    </>
  );
}
