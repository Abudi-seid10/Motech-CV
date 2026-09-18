import { useState } from "react";
import { generatePDF } from "@/pdf/generatePDF";

export default function DownloadButton({ filename = "cv" }: { filename?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      await generatePDF(filename);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={busy}
        className="group inline-flex items-center gap-3 border border-gold/50 px-6 py-3 font-mono text-xs uppercase tracking-widest2 text-gold-soft hover:bg-gold hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-wait"
      >
        {busy ? "Preparing PDF…" : "Download CV — PDF"}
        <span className="transition-transform group-hover:translate-y-0.5">↓</span>
      </button>
      {error && <p className="font-mono text-xs text-red-400 mt-2 max-w-xs">{error}</p>}
    </div>
  );
}
