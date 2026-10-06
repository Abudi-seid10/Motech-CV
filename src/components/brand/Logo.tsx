/** Motech mark — a rounded tile with a stylised "M", drawn in the active theme's accent. */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-gold" />
      <path
        d="M8 23V9.5l8 8.5 8-8.5V23"
        fill="none"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-ink"
      />
    </svg>
  );
}
