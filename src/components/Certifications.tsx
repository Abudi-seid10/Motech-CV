import { CVData } from "@/lib/types";
import Section from "./layout/Section";

export default function Certifications({ entries }: { entries: CVData["certifications"] }) {
  if (!entries?.length) return null;
  return (
    <Section index="05" title="Certifications" id="certifications">
      <div className="grid md:grid-cols-2 gap-4">
        {entries.map((c, i) => (
          <div key={i} className="card p-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-bone/90 font-medium">{c.name}</p>
              <p className="font-mono text-xs text-muted mt-1">{c.issuer}</p>
            </div>
            {c.year && <span className="font-mono text-xs text-gold-dim shrink-0">{c.year}</span>}
          </div>
        ))}
      </div>
    </Section>
  );
}
