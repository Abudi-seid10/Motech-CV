import { CVData } from "@/lib/types";
import Section from "./layout/Section";

export default function Competencies({ groups }: { groups: CVData["competencies"] }) {
  if (!groups?.length) return null;
  return (
    <Section index="02" title="Core Competencies" id="competencies">
      <div className="grid md:grid-cols-2 gap-8">
        {groups.map((g) => (
          <div key={g.category} className="card p-6">
            <h3 className="eyebrow mb-4">{g.category}</h3>
            <div className="flex flex-wrap gap-2">
              {g.items.map((item) => (
                <span
                  key={item}
                  className="font-mono text-xs px-3 py-1.5 border border-border text-muted rounded-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
