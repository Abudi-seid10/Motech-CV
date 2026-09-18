import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup, checkSlugAvailable } from "@/lib/api";
import { slugifyClient } from "@/lib/slug";
import { isValidSlugFormat, RESERVED_SLUGS } from "@/lib/reserved-slugs";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "unavailable">("idle");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!slugTouched) setSlug(slugifyClient(name));
  }, [name, slugTouched]);

  useEffect(() => {
    if (!slug) {
      setSlugStatus("idle");
      return;
    }
    if (!isValidSlugFormat(slug) || RESERVED_SLUGS.has(slug)) {
      setSlugStatus("unavailable");
      return;
    }
    setSlugStatus("checking");
    const t = setTimeout(() => {
      checkSlugAvailable(slug)
        .then((available) => setSlugStatus(available ? "available" : "unavailable"))
        .catch(() => setSlugStatus("idle"));
    }, 350);
    return () => clearTimeout(t);
  }, [slug]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { data, error: signupError } = await signup({ name, email, password, slug });
      if (signupError) throw signupError;
      if (data.session) {
        navigate(`/${slug}/edit`);
      } else {
        // Email confirmation is required by this Supabase project's auth settings.
        setCheckEmail(true);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (checkEmail) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center">
        <div className="max-w-sm">
          <h1 className="font-display text-3xl mb-3">Check your email</h1>
          <p className="text-muted text-sm">
            We sent a confirmation link to <span className="text-bone">{email}</span>. Click it, then{" "}
            <a href="/login" className="text-gold-dim hover:text-gold">sign in</a> to start editing /{slug}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center px-6 py-16">
      <form onSubmit={handleSubmit} className="w-full max-w-sm card p-6 sm:p-8">
        <h1 className="font-display text-3xl mb-1">Build your CV</h1>
        <p className="font-mono text-xs text-muted mb-6">Free, editable, downloadable</p>

        <label className="block font-mono text-[11px] text-muted mb-1">Full name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-raised border border-border rounded-sm px-3 py-2 text-sm mb-4"
        />

        <label className="block font-mono text-[11px] text-muted mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-raised border border-border rounded-sm px-3 py-2 text-sm mb-4"
        />

        <label className="block font-mono text-[11px] text-muted mb-1">Password (min. 8 characters)</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-raised border border-border rounded-sm px-3 py-2 text-sm mb-4"
        />

        <label className="block font-mono text-[11px] text-muted mb-1">Your address</label>
        <div className="flex items-center mb-1">
          <span className="font-mono text-sm text-muted mr-1">/</span>
          <input
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugifyClient(e.target.value));
            }}
            className="w-full bg-raised border border-border rounded-sm px-3 py-2 text-sm"
          />
        </div>
        <p className="font-mono text-[11px] mb-6 h-4">
          {slugStatus === "checking" && <span className="text-muted">checking…</span>}
          {slugStatus === "available" && <span className="text-gold-soft">available</span>}
          {slugStatus === "unavailable" && <span className="text-red-400">taken or reserved</span>}
        </p>

        {error && <p className="text-red-400 text-xs font-mono mb-4">{error}</p>}

        <button
          type="submit"
          disabled={busy || slugStatus === "unavailable"}
          className="w-full border border-gold/50 py-3 font-mono text-xs uppercase tracking-widest2 text-gold-soft hover:bg-gold hover:text-ink transition-colors disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create my CV"}
        </button>
      </form>
    </div>
  );
}
