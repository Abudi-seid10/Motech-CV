import { CVData } from "@/lib/types";
import Section from "./layout/Section";

export default function Awards({ entries }: { entries: CVData["awards"] }) {
  if (!entries?.length) return null;
  return (
    <Section index="06" title="Awards" id="awards">
      <div className="space-y-6">
        {entries.map((a, i) => (
          <div key={i} className="card p-6">
            <div className="flex items-baseline justify-between gap-4 mb-1">
              <h3 className="font-display text-xl tracking-wide text-gold-soft">{a.name}</h3>
              {a.year && <span className="font-mono text-xs text-gold-dim">{a.year}</span>}
            </div>
            <p className="text-muted text-sm">{a.issuer}</p>
            {a.project && <p className="text-bone/70 text-sm mt-2">Project: {a.project}</p>}
          </div>
        ))}
      </div>
    </Section>
  );
}
