import { ReactNode } from "react";

interface SectionProps {
  index: string; // "01", "02", ...
  title: string;
  children: ReactNode;
  id?: string;
}

export default function Section({ index, title, children, id }: SectionProps) {
  return (
    <section id={id} className="relative py-16 md:py-24 border-t border-border">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex items-baseline gap-4 mb-10">
          <span className="section-number">{index}</span>
          <h2 className="font-display text-3xl md:text-4xl tracking-wide text-bone">
            {title}
          </h2>
        </div>
        {children}
      </div>
    </section>
  );
}
