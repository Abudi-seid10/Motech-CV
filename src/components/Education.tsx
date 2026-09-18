import { CVData } from "@/lib/types";
import Section from "./layout/Section";

export default function Education({ entries }: { entries: CVData["education"] }) {
  if (!entries?.length) return null;
  return (
    <Section index="04" title="Education" id="education">
      <div className="space-y-8">
        {entries.map((e, i) => (
          <div key={i} className="grid md:grid-cols-[220px_1fr] gap-4 md:gap-10">
            <p className="font-mono text-xs text-gold-dim uppercase tracking-widest2">{e.dates}</p>
            <div>
              <h3 className="font-display text-2xl tracking-wide text-bone">{e.school}</h3>
              <p className="font-body font-semibold text-gold-soft mb-2">{e.degree}</p>
              {e.details && <p className="text-bone/70 leading-relaxed max-w-2xl">{e.details}</p>}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
