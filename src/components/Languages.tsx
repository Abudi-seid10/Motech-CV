import { CVData } from "@/lib/types";
import Section from "./layout/Section";

export default function Languages({
  languages,
  strengths,
}: {
  languages: CVData["languages"];
  strengths: CVData["strengths"];
}) {
  if (!languages?.length && !strengths?.length) return null;
  return (
    <Section index="07" title="Languages & Strengths" id="languages">
      <div className="grid md:grid-cols-2 gap-10">
        {languages?.length > 0 && (
          <div>
            <h3 className="eyebrow mb-4">Languages</h3>
            <div className="space-y-2">
              {languages.map((l) => (
                <div key={l.name} className="flex justify-between border-b border-border py-2">
                  <span className="text-bone/90">{l.name}</span>
                  <span className="font-mono text-xs text-muted">{l.level}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {strengths?.length > 0 && (
          <div>
            <h3 className="eyebrow mb-4">Professional Strengths</h3>
            <div className="flex flex-wrap gap-2">
              {strengths.map((s) => (
                <span key={s} className="font-mono text-xs px-3 py-1.5 border border-border text-muted rounded-sm">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
