import { CVData } from "@/lib/types";
import Section from "./layout/Section";

export default function Experience({ entries }: { entries: CVData["experience"] }) {
  if (!entries?.length) return null;
  return (
    <Section index="03" title="Experience" id="experience">
      <div className="space-y-14">
        {entries.map((e, i) => (
          <div key={i} className="grid md:grid-cols-[220px_1fr] gap-4 md:gap-10">
            <div>
              <p className="font-mono text-xs text-gold-dim uppercase tracking-widest2">{e.dates}</p>
              {e.location && <p className="font-mono text-xs text-muted mt-1">{e.location}</p>}
            </div>
            <div>
              <h3 className="font-display text-2xl tracking-wide text-bone">{e.role}</h3>
              <p className="font-body font-semibold text-gold-soft mb-4">{e.company}</p>
              <ul className="space-y-2">
                {e.bullets.map((b, bi) => (
                  <li key={bi} className="flex gap-3 text-bone/80 leading-relaxed">
                    <span className="text-gold mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
