import { FormEvent, useState } from "react";
import { submitContact } from "@/lib/contacts";

export default function ContactForm({
  ownerId,
  ownerEmail,
  ownerName,
  ownerSlug,
}: {
  ownerId: string;
  ownerEmail?: string | null;
  ownerName?: string | null;
  ownerSlug?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await submitContact({
        ownerId,
        name,
        email,
        phone,
        message,
        source: "card",
        ownerEmail,
        ownerName,
        ownerSlug,
      });
      setSent(true);
    } catch (err) {
      setError((err as Error).message || "Couldn't send that — try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="card p-5 text-center">
        <p className="font-mono text-xs text-gold-soft">Thanks — your info's been shared.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 text-left space-y-3">
      <p className="eyebrow text-center mb-1">Get in touch</p>
      <input
        required
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-raised border border-border rounded-sm px-3 py-2 text-sm"
      />
      <input
        required
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full bg-raised border border-border rounded-sm px-3 py-2 text-sm"
      />
      <input
        type="tel"
        placeholder="Phone (optional)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full bg-raised border border-border rounded-sm px-3 py-2 text-sm"
      />
      <textarea
        placeholder="Message (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full bg-raised border border-border rounded-sm px-3 py-2 text-sm min-h-[70px]"
      />
      {error && <p className="font-mono text-xs text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full border border-gold/50 rounded-full py-2.5 font-mono text-xs uppercase tracking-widest2 text-gold-soft hover:bg-gold hover:text-ink transition-colors disabled:opacity-50"
      >
        {busy ? "Sending…" : "Share my contact"}
      </button>
    </form>
  );
}
