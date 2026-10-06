import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteHeader, { navLink } from "@/components/brand/SiteHeader";
import SiteFooter from "@/components/brand/SiteFooter";
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
    <div className="min-h-screen flex flex-col">
      <SiteHeader>
        <Link to="/signup" className={navLink}>Sign up</Link>
      </SiteHeader>
      <main className="flex-1 grid place-items-center px-6 py-12">
      <form onSubmit={handleSubmit} className="w-full max-w-sm card p-6 sm:p-8">
        <h1 className="font-display text-3xl mb-1">Sign in</h1>
        <p className="font-mono text-xs text-muted mb-6">Edit your CV</p>

        <label className="block font-mono text-[11px] text-muted mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input mb-4"
        />

        <label className="block font-mono text-[11px] text-muted mb-1">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input mb-6"
        />

        {error && <p className="text-red-400 text-xs font-mono mb-4">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="btn-solid w-full"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="font-mono text-[11px] text-muted text-center mt-4">
          No CV yet? <Link to="/signup" className="text-gold-dim hover:text-gold">Build one</Link>
        </p>
      </form>
      </main>
      <SiteFooter />
    </div>
  );
}
