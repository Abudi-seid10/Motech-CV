import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LogoMark } from "./Logo";

interface SiteHeaderProps {
  /** Page name shown next to the brand, e.g. "Editing /jane". */
  title?: string;
  /** Right-aligned links/buttons. Defaults to nothing. */
  children?: ReactNode;
  /** Small chip beside the title (e.g. the plan name). */
  badge?: ReactNode;
}

/** The one header used on every page: brand on the left, page title, actions on the right. */
export default function SiteHeader({ title, badge, children }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="Motech CV home">
            <LogoMark />
            <span className="hidden font-display text-lg uppercase tracking-widest2 sm:inline">Motech CV</span>
          </Link>
          {title && (
            <>
              <span className="h-5 w-px bg-border" aria-hidden />
              <h1 className="truncate font-body text-sm font-semibold sm:text-base">{title}</h1>
            </>
          )}
          {badge}
        </div>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs sm:gap-x-5">{children}</nav>
      </div>
    </header>
  );
}

export const navLink = "text-muted transition-colors hover:text-gold";
export const navButton =
  "rounded-full border border-gold/60 px-4 py-2 uppercase tracking-widest2 text-gold-soft transition-colors hover:bg-gold hover:text-ink disabled:opacity-50";
