import Section from "./layout/Section";

export default function Summary({ summary }: { summary: string }) {
  if (!summary) return null;
  return (
    <Section index="01" title="Profile" id="summary">
      <p className="font-serifDisplay text-xl md:text-2xl leading-relaxed text-bone/90 max-w-3xl">
        {summary}
      </p>
    </Section>
  );
}
