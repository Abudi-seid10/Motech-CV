import { CVData } from "@/lib/types";
import DownloadButton from "./DownloadButton";

export default function Hero({
  personal,
  filename,
}: {
  personal: CVData["personal"];
  filename?: string;
}) {
  return (
    <header className="relative overflow-hidden">
      <div className="mx-auto max-w-5xl px-6 pt-28 pb-16 md:pt-36 md:pb-24">
        <p className="eyebrow mb-6">{personal.location}</p>
        <h1 className="font-serifDisplay italic font-light text-5xl md:text-7xl leading-[1.05] text-bone mb-6">
          {personal.name || "Your Name"}
        </h1>
        <p className="font-body font-semibold text-lg md:text-2xl text-gold-soft max-w-2xl mb-10">
          {personal.title || "Your title / role"}
        </p>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 font-mono text-sm text-muted mb-10">
          {personal.email && <a href={`mailto:${personal.email}`} className="hover:text-gold transition-colors">{personal.email}</a>}
          {personal.phone && <span>{personal.phone}</span>}
          {personal.linkedin && (
            <a href={`https://${personal.linkedin.replace(/^https?:\/\//, "")}`} target="_blank" rel="noreferrer" className="hover:text-gold transition-colors">
              {personal.linkedin.replace(/^https?:\/\//, "")}
            </a>
          )}
          {personal.github && (
            <a href={`https://${personal.github.replace(/^https?:\/\//, "")}`} target="_blank" rel="noreferrer" className="hover:text-gold transition-colors">
              {personal.github.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>

        <DownloadButton filename={filename} />
      </div>
    </header>
  );
}
