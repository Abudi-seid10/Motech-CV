import { Link } from "react-router-dom";
import { LogoMark } from "./Logo";

/** Footer shown at the bottom of every page — credits Motech Solution. */
export default function SiteFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`border-t border-border bg-surface/40 print:hidden ${className}`}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-center sm:flex-row sm:px-6 sm:text-left">
        <div className="flex items-center gap-3">
          <LogoMark className="h-7 w-7" />
          <p className="font-body text-sm">
            <span className="text-muted">Powered by </span>
            <span className="font-semibold text-bone">Motech Solution</span>
          </p>
        </div>
        <p className="font-mono text-[11px] text-muted">
          <Link to="/" className="hover:text-gold">Motech CV</Link>
          <span className="mx-2">·</span>
          © {new Date().getFullYear()} Motech Solution. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
