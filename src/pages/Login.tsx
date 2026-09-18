import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, fetchOwnProfile } from "@/lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { data, error: loginError } = await login(email, password);
      if (loginError) throw loginError;
      const { data: profile, error: profileError } = await fetchOwnProfile(data.user.id);
      if (profileError) throw profileError;
      navigate(`/${profile?.slug ?? ""}/edit`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm card p-6 sm:p-8">
        <h1 className="font-display text-3xl mb-1">Sign in</h1>
        <p className="font-mono text-xs text-muted mb-6">Edit your CV</p>

        <label className="block font-mono text-[11px] text-muted mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-raised border border-border rounded-sm px-3 py-2 text-sm mb-4"
        />

        <label className="block font-mono text-[11px] text-muted mb-1">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-raised border border-border rounded-sm px-3 py-2 text-sm mb-6"
        />

        {error && <p className="text-red-400 text-xs font-mono mb-4">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full border border-gold/50 py-3 font-mono text-xs uppercase tracking-widest2 text-gold-soft hover:bg-gold hover:text-ink transition-colors disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="font-mono text-[11px] text-muted text-center mt-4">
          No CV yet? <Link to="/signup" className="text-gold-dim hover:text-gold">Build one</Link>
        </p>
      </form>
    </div>
  );
}
