import { Link } from "react-router-dom";
import { THEMES, LAYOUTS } from "@/themes";
import SiteHeader, { navLink, navButton } from "@/components/brand/SiteHeader";
import SiteFooter from "@/components/brand/SiteFooter";
import { PLANS } from "@/lib/plans";

export default function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader>
        <a href="#templates" className={`hidden sm:inline ${navLink}`}>Templates</a>
        <a href="#themes" className={`hidden sm:inline ${navLink}`}>Themes</a>
        <a href="#pricing" className={`hidden sm:inline ${navLink}`}>Pricing</a>
        <Link to="/login" className={navLink}>Log in</Link>
        <Link to="/signup" className={navButton}>Get started</Link>
      </SiteHeader>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-20 md:pt-24 md:pb-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="eyebrow mb-6 inline-block rounded-full border border-gold/30 px-3 py-1">
              Free to start · No design skills required
            </p>
            <h1 className="font-serifDisplay italic font-light text-5xl md:text-7xl leading-[1.02] mb-6">
              Your CV,
              <br />
              as a website.
            </h1>
            <p className="font-body text-lg text-bone/80 max-w-md mb-10">
              Pick an address, fill in your experience, choose from {LAYOUTS.length} CV templates and {THEMES.length} themes,
              and get a live CV site, a link-in-bio card, and an ATS-friendly PDF. Editable any time.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/signup" className="btn-solid">Build your CV →</Link>
              <Link to="/me" className="btn-ghost">Live demo</Link>
            </div>
            <p className="font-mono text-[11px] text-muted mt-5">
              Or the link-in-bio version → <Link to="/card/me" className="text-gold-dim hover:text-gold">/card/me</Link>
            </p>
          </div>

          {/* CSS-only browser mockup — no image assets */}
          <div className="card overflow-hidden shadow-2xl shadow-black/40">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-raised">
              <span className="h-2.5 w-2.5 rounded-full bg-bone/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-bone/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-bone/20" />
              <span className="ml-3 font-mono text-[11px] text-muted truncate">yoursite.com/yourname</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="h-4 w-2/3 rounded-sm bg-bone/15" />
              <div className="h-3 w-1/2 rounded-sm bg-gold/40" />
              <div className="space-y-2 pt-2">
                <div className="h-2.5 w-full rounded-sm bg-bone/10" />
                <div className="h-2.5 w-11/12 rounded-sm bg-bone/10" />
                <div className="h-2.5 w-4/5 rounded-sm bg-bone/10" />
              </div>
              <div className="pt-4 grid grid-cols-3 gap-3">
                <div className="h-14 rounded-lg border border-border" />
                <div className="h-14 rounded-lg border border-border" />
                <div className="h-14 rounded-lg border border-border" />
              </div>
              <div className="pt-2">
                <div className="inline-block h-8 w-32 rounded-full border border-gold/40" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-border py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex items-baseline gap-4 mb-10">
            <span className="section-number">01</span>
            <h2 className="font-display text-3xl md:text-4xl tracking-wide">How it works</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { n: "1", t: "Claim your address", d: "Sign up and pick yoursite.com/yourname — that's your permanent CV link." },
              { n: "2", t: "Fill it in", d: "Experience, education, certifications, awards — plus custom sections for anything else, like Projects or Recommendations." },
              { n: "3", t: "Pick a theme, download", d: "Switch themes any time. Download a clean, ATS-friendly PDF whenever you need it." },
            ].map((s) => (
              <div key={s.n} className="card p-6">
                <p className="font-mono text-xs text-gold-dim mb-2">{s.n}</p>
                <h3 className="font-display text-xl tracking-wide mb-2">{s.t}</h3>
                <p className="text-muted text-sm leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex items-baseline gap-4 mb-10">
            <span className="section-number">02</span>
            <h2 className="font-display text-3xl md:text-4xl tracking-wide">What you get</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { t: "A real CV website", d: "Not a PDF stapled to an email — a proper, shareable page at your own address." },
              { t: "A link-in-bio card", d: "A compact version of the same profile, built for Instagram/TikTok/WhatsApp bio links." },
              { t: "Custom sections", d: "Projects, Recommendations, Publications — add whatever your field actually needs." },
              { t: "ATS-friendly PDF", d: "One tap, always plain and parseable — regardless of which visual theme you're using." },
              { t: "Switchable themes", d: "Change your site's whole look without touching your content." },
              { t: "Edit any time", d: "Update once, live everywhere — the site, the card, and the next PDF you download." },
            ].map((f) => (
              <div key={f.t} className="card p-6">
                <h3 className="font-display text-lg tracking-wide text-gold-soft mb-2">{f.t}</h3>
                <p className="text-muted text-sm leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates */}
      <section id="templates" className="border-t border-border py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex items-baseline gap-4 mb-10">
            <span className="section-number">03</span>
            <h2 className="font-display text-3xl md:text-4xl tracking-wide">CV templates</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {LAYOUTS.map((l) => (
              <div key={l.id} className="card p-5">
                <h3 className="font-display text-lg tracking-wide text-gold-soft mb-2">{l.name}</h3>
                <p className="text-muted text-sm leading-relaxed">{l.description}</p>
                {l.photo && <p className="font-mono text-[10px] text-gold-dim mt-3">Photo slot</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Themes */}
      <section id="themes" className="border-t border-border py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex items-baseline gap-4 mb-10">
            <span className="section-number">04</span>
            <h2 className="font-display text-3xl md:text-4xl tracking-wide">Themes</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {THEMES.map((t) => (
              <div key={t.id} className="card p-6">
                <h3 className="font-display text-xl tracking-wide text-gold-soft mb-2">{t.name}</h3>
                <p className="text-muted text-sm">{t.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex items-baseline gap-4 mb-10">
            <span className="section-number">05</span>
            <h2 className="font-display text-3xl md:text-4xl tracking-wide">Pricing</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {PLANS.map((p) => (
              <div key={p.id} className={`card p-6 flex flex-col ${p.available ? "border-gold/50" : ""}`}>
                <h3 className="font-display text-xl tracking-wide mb-1">{p.name}</h3>
                <p className="font-mono text-sm text-gold-soft mb-3">{p.price}</p>
                <p className="text-muted text-sm mb-4">{p.tagline}</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="text-sm text-bone/80 flex gap-2">
                      <span className="text-gold">·</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {p.available ? (
                  <Link
                    to="/signup"
                    className="btn"
                  >
                    Get started
                  </Link>
                ) : (
                  <span className="btn-ghost cursor-default hover:border-border hover:text-muted">
                    Coming soon
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
