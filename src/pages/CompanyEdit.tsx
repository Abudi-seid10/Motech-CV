import { useEffect, useState, ChangeEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { fetchOwnProfile, logout } from "@/lib/api";
import {
  ACCENT_PRESETS,
  ButtonKind,
  CardBackground,
  ButtonShape,
  CompanyButton,
  CompanyCardData,
  createCompanyCard,
  emptyCompanyCard,
  fetchOwnCompanyCard,
  normalizeCompanyCard,
  saveCompanyCard,
} from "@/lib/companyCard";
import { isValidSlugFormat, RESERVED_SLUGS } from "@/lib/reserved-slugs";
import { slugifyClient } from "@/lib/slug";
import { makeId } from "@/lib/id";
import { fileToPhotoDataUrl } from "@/lib/photo";
import SiteHeader, { navLink, navButton } from "@/components/brand/SiteHeader";
import SiteFooter from "@/components/brand/SiteFooter";
import StatusScreen from "@/components/brand/StatusScreen";
import CompanyCardView from "@/components/company/CompanyCardView";

const BACKGROUNDS: { id: CardBackground; label: string }[] = [
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
  { id: "gradient", label: "Gradient" },
];
const SHAPES: { id: ButtonShape; label: string }[] = [
  { id: "pill", label: "Pill" },
  { id: "rounded", label: "Rounded" },
  { id: "square", label: "Square" },
];
const KINDS: { id: ButtonKind; label: string; placeholder: string }[] = [
  { id: "link", label: "Link", placeholder: "https://example.com/book" },
  { id: "email", label: "Email", placeholder: "hello@company.com" },
  { id: "phone", label: "Call", placeholder: "+1 555 123 4567" },
  { id: "whatsapp", label: "WhatsApp", placeholder: "15551234567" },
];

const pillOn = "border-gold text-gold-soft";
const pillOff = "border-border text-muted hover:text-bone";

export default function CompanyEdit() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession();

  const [ready, setReady] = useState(false);
  const [exists, setExists] = useState(false);
  const [cardSlug, setCardSlug] = useState("");
  const [data, setData] = useState<CompanyCardData>(emptyCompanyCard);
  const [isPublic, setIsPublic] = useState(true);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      navigate("/login");
      return;
    }
    (async () => {
      const { data: profile, error } = await fetchOwnProfile(session.user.id);
      if (error || !profile) {
        setStatus("error");
        setStatusMsg(error?.message ?? "No profile found for this account yet.");
        return;
      }
      if (profile.slug !== slug) {
        setStatus("error");
        setStatusMsg(`You're signed in as /${profile.slug} — sign out to edit /${slug}.`);
        return;
      }
      const { data: row, error: cardError } = await fetchOwnCompanyCard(session.user.id);
      if (cardError) {
        setStatus("error");
        setStatusMsg(cardError.message);
        return;
      }
      if (row) {
        setExists(true);
        setCardSlug(row.slug);
        setData(normalizeCompanyCard(row.data));
        setIsPublic(row.is_public);
      }
      setReady(true);
    })();
  }, [session, sessionLoading, slug, navigate]);

  const set = <K extends keyof CompanyCardData>(key: K, value: CompanyCardData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  function updateButton(id: string, patch: Partial<CompanyButton>) {
    set("buttons", data.buttons.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function moveButton(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= data.buttons.length) return;
    const next = data.buttons.slice();
    [next[index], next[target]] = [next[target], next[index]];
    set("buttons", next);
  }

  async function handleLogo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      set("logo", await fileToPhotoDataUrl(file, 320));
    } catch (err) {
      setStatus("error");
      setStatusMsg((err as Error).message);
    }
  }

  async function create() {
    if (!session) return;
    const clean = slugifyClient(cardSlug);
    if (!isValidSlugFormat(clean) || RESERVED_SLUGS.has(clean)) {
      setStatus("error");
      setStatusMsg("Pick an address of 3–32 letters, numbers or dashes (not a reserved word).");
      return;
    }
    setStatus("saving");
    const { error } = await createCompanyCard(session.user.id, clean, data);
    if (error) {
      setStatus("error");
      setStatusMsg(error.code === "23505" ? `/company/${clean} is already taken.` : error.message);
      return;
    }
    setCardSlug(clean);
    setExists(true);
    setStatus("saved");
    setStatusMsg("Company card created — live now.");
    setTimeout(() => setStatus("idle"), 2500);
  }

  async function save() {
    if (!session) return;
    setStatus("saving");
    const { error } = await saveCompanyCard(session.user.id, { data, is_public: isPublic });
    if (error) {
      setStatus("error");
      setStatusMsg(error.message);
      return;
    }
    setStatus("saved");
    setStatusMsg("Saved — live now.");
    setTimeout(() => setStatus("idle"), 2500);
  }

  async function signOut() {
    await logout();
    navigate("/login");
  }

  if (sessionLoading || (!ready && status !== "error")) {
    return (
      <StatusScreen>
        <p className="font-mono text-sm text-muted">Loading…</p>
      </StatusScreen>
    );
  }

  if (!ready) {
    return (
      <StatusScreen>
        <div>
          <p className="text-red-400 font-mono text-sm mb-4">{statusMsg}</p>
          <button onClick={signOut} className="btn-solid">Sign out</button>
        </div>
      </StatusScreen>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader title="Company card">
        <Link to={`/${slug}/edit`} className={navLink}>← CV editor</Link>
        {exists && <Link to={`/company/${cardSlug}`} className={navLink}>View ↗</Link>}
        <button onClick={signOut} className={navLink}>Sign out</button>
        <button
          onClick={exists ? save : create}
          disabled={status === "saving"}
          className={navButton}
        >
          {status === "saving" ? "Saving…" : exists ? "Save" : "Create"}
        </button>
      </SiteHeader>

      {statusMsg && (
        <p className={`px-4 sm:px-6 py-2 font-mono text-xs ${status === "error" ? "text-red-400" : "text-gold-soft"}`}>
          {statusMsg}
        </p>
      )}

      <div className="lg:hidden flex border-b border-border font-mono text-xs uppercase tracking-widest2">
        {(["edit", "preview"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setMobileView(v)}
            className={`flex-1 py-3 text-center ${mobileView === v ? "text-gold-soft border-b-2 border-gold" : "text-muted"}`}
          >
            {v === "edit" ? "Edit" : "Preview"}
          </button>
        ))}
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:items-start flex-1">
        <div className={`${mobileView === "preview" ? "hidden" : "block"} lg:block mx-auto max-w-3xl w-full px-4 sm:px-6 py-10 space-y-10`}>
          {!exists && (
            <section className="card p-5">
              <h2 className="eyebrow mb-2">Create your company card</h2>
              <p className="text-muted text-xs mb-3 leading-relaxed">
                Choose its web address, then customise everything below. Nothing is public until you click Create.
              </p>
              <label className="block font-mono text-[11px] text-muted mb-1">Address</label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted">/company/</span>
                <input
                  className="input text-bone"
                  value={cardSlug}
                  onChange={(e) => setCardSlug(slugifyClient(e.target.value))}
                  placeholder="acme"
                />
              </div>
            </section>
          )}

          <section className="space-y-4">
            <h2 className="eyebrow">Company</h2>
            <div>
              <label className="block font-mono text-[11px] text-muted mb-1">Company name</label>
              <input className="input text-bone" value={data.companyName} onChange={(e) => set("companyName", e.target.value)} />
            </div>
            <div>
              <label className="block font-mono text-[11px] text-muted mb-1">Tagline</label>
              <input className="input text-bone" value={data.tagline} onChange={(e) => set("tagline", e.target.value)} />
            </div>
            <div>
              <label className="block font-mono text-[11px] text-muted mb-1">About</label>
              <textarea className="input text-bone min-h-[90px]" value={data.about} onChange={(e) => set("about", e.target.value)} />
            </div>
            <div>
              <label className="block font-mono text-[11px] text-muted mb-1">Logo</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogo}
                  className="text-xs font-mono file:mr-3 file:border file:border-gold/50 file:bg-transparent file:px-3 file:py-1.5 file:text-gold-soft file:font-mono file:text-xs file:uppercase file:tracking-widest2 hover:file:bg-gold hover:file:text-ink file:transition-colors file:cursor-pointer"
                />
                {data.logo && (
                  <button type="button" onClick={() => set("logo", undefined)} className="font-mono text-[11px] text-muted hover:text-red-400">
                    remove
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="eyebrow">Contact details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {(["website", "email", "phone", "address"] as const).map((k) => (
                <div key={k}>
                  <label className="block font-mono text-[11px] text-muted mb-1 capitalize">{k}</label>
                  <input className="input text-bone" value={data[k]} onChange={(e) => set(k, e.target.value)} />
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="eyebrow">Look &amp; feel</h2>
            <div>
              <label className="block font-mono text-[11px] text-muted mb-2">Accent colour</label>
              <div className="flex flex-wrap items-center gap-2">
                {ACCENT_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Accent ${c}`}
                    onClick={() => set("accent", c)}
                    className={`h-7 w-7 rounded-full border-2 ${data.accent === c ? "border-bone" : "border-transparent"}`}
                    style={{ background: c }}
                  />
                ))}
                <input
                  type="color"
                  aria-label="Custom accent colour"
                  value={data.accent}
                  onChange={(e) => set("accent", e.target.value)}
                  className="h-7 w-9 bg-transparent cursor-pointer"
                />
              </div>
            </div>
            <div>
              <label className="block font-mono text-[11px] text-muted mb-2">Background</label>
              <div className="flex gap-2">
                {BACKGROUNDS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => set("background", b.id)}
                    className={`rounded-full border px-4 py-1.5 font-mono text-xs ${data.background === b.id ? pillOn : pillOff}`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block font-mono text-[11px] text-muted mb-2">Button shape</label>
              <div className="flex gap-2">
                {SHAPES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => set("buttonShape", s.id)}
                    className={`rounded-full border px-4 py-1.5 font-mono text-xs ${data.buttonShape === s.id ? pillOn : pillOff}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="eyebrow">Buttons</h2>
              <button
                type="button"
                onClick={() =>
                  set("buttons", [...data.buttons, { id: makeId(), label: "", value: "", kind: "link", variant: "solid" }])
                }
                className="font-mono text-xs text-gold-dim hover:text-gold"
              >
                + Add button
              </button>
            </div>
            <div className="space-y-4">
              {data.buttons.map((b, i) => {
                const kind = KINDS.find((k) => k.id === b.kind) ?? KINDS[0];
                return (
                  <div key={b.id} className="card p-4 space-y-3">
                    <div className="flex justify-end gap-3 font-mono text-[11px] text-muted">
                      <button type="button" onClick={() => moveButton(i, -1)} className="hover:text-gold">↑</button>
                      <button type="button" onClick={() => moveButton(i, 1)} className="hover:text-gold">↓</button>
                      <button
                        type="button"
                        onClick={() => set("buttons", data.buttons.filter((x) => x.id !== b.id))}
                        className="hover:text-red-400"
                      >
                        remove
                      </button>
                    </div>
                    <div>
                      <label className="block font-mono text-[11px] text-muted mb-1">Label</label>
                      <input className="input text-bone" value={b.label} onChange={(e) => updateButton(b.id, { label: e.target.value })} placeholder="Book a call" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-mono text-[11px] text-muted mb-1">Type</label>
                        <select
                          className="input text-bone"
                          value={b.kind}
                          onChange={(e) => updateButton(b.id, { kind: e.target.value as ButtonKind })}
                        >
                          {KINDS.map((k) => (
                            <option key={k.id} value={k.id}>{k.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-mono text-[11px] text-muted mb-1">Style</label>
                        <select
                          className="input text-bone"
                          value={b.variant}
                          onChange={(e) => updateButton(b.id, { variant: e.target.value as CompanyButton["variant"] })}
                        >
                          <option value="solid">Filled</option>
                          <option value="outline">Outline</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block font-mono text-[11px] text-muted mb-1">{kind.label === "Link" ? "URL" : kind.label}</label>
                      <input className="input text-bone" value={b.value} onChange={(e) => updateButton(b.id, { value: e.target.value })} placeholder={kind.placeholder} />
                    </div>
                  </div>
                );
              })}
              {data.buttons.length === 0 && <p className="text-muted text-sm">No buttons yet — click + Add button.</p>}
            </div>
          </section>

          {exists && (
            <label className="flex items-center gap-2 font-mono text-xs text-muted">
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
              Publicly visible at /company/{cardSlug}
            </label>
          )}
        </div>

        <div className={`${mobileView === "edit" ? "hidden" : "block"} lg:block lg:self-stretch border-l border-border`}>
          <div className="lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] overflow-y-auto">
            <CompanyCardView card={data} className="min-h-full" />
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
