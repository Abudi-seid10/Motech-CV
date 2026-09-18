import { useEffect, useState, ChangeEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { fetchOwnProfile, saveProfile, logout, ProfileRow } from "@/lib/api";
import { CVData, emptyCVData, normalizeCVData } from "@/lib/types";
import { THEMES, ThemeId, DEFAULT_THEME, applyTheme } from "@/themes";
import { AI_PROVIDERS, DEFAULT_AI_PROVIDER, AIProvider, parseResumeWithAI } from "@/lib/gemini";
import ArrayEditor from "@/components/edit/ArrayEditor";
import CustomSectionsEditor from "@/components/edit/CustomSectionsEditor";

export default function Edit() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [data, setData] = useState<CVData>(emptyCVData);
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME);
  const [isPublic, setIsPublic] = useState(true);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [aiProvider, setAiProvider] = useState<AIProvider>(DEFAULT_AI_PROVIDER);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      navigate("/login");
      return;
    }
    fetchOwnProfile(session.user.id).then(({ data: row, error }) => {
      if (error) {
        setStatus("error");
        setStatusMsg(error.message);
        return;
      }
      if (!row) {
        setStatus("error");
        setStatusMsg("No profile found for this account yet.");
        return;
      }
      if (row.slug !== slug) {
        setStatus("error");
        setStatusMsg(`You're signed in as /${row.slug} — sign out to edit /${slug}.`);
        return;
      }
      setProfile(row as ProfileRow);
      setData(normalizeCVData((row as ProfileRow).data));
      setTheme((row as ProfileRow).theme);
      setIsPublic((row as ProfileRow).is_public);
    });
  }, [session, sessionLoading, slug, navigate]);

  useEffect(() => {
    applyTheme(theme);
    return () => applyTheme(DEFAULT_THEME);
  }, [theme]);

  async function save() {
    if (!session) return;
    setStatus("saving");
    const { error } = await saveProfile(session.user.id, { data, theme, is_public: isPublic });
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

  async function handleResumeUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-uploading the same file later
    if (!file) return;
    setImporting(true);
    setImportMsg(null);
    try {
      // Loaded on demand — pdfjs-dist/mammoth are ~1.5MB and shouldn't bloat
      // every page's initial load for a feature most visits never touch.
      const { extractTextFromFile, parseResumeText } = await import("@/lib/parseResume");
      const text = await extractTextFromFile(file);

      try {
        const parsed = await parseResumeWithAI({ provider: aiProvider, text, current: data });
        setData(parsed);
        setImportMsg({
          text: "AI filled in your CV below — review every section before hitting Save; nothing is saved automatically.",
          error: false,
        });
      } catch (aiErr) {
        // AI parsing failed (no key, offline, bad response, etc.) — fall back
        // to the offline regex extraction so the upload isn't a dead end.
        const fallback = parseResumeText(text);
        setData((prev) => ({
          ...prev,
          personal: { ...prev.personal, ...fallback.personal },
          summary: fallback.summary || prev.summary,
        }));
        setImportMsg({
          text: `${(aiErr as Error).message} Pulled your contact info instead — you'll need to fill in the rest manually.`,
          error: true,
        });
      }
    } catch (err) {
      setImportMsg({ text: (err as Error).message, error: true });
    } finally {
      setImporting(false);
    }
  }

  if (sessionLoading || (!profile && status !== "error")) {
    return <div className="min-h-screen grid place-items-center font-mono text-sm text-muted">Loading…</div>;
  }

  return (
    <div className="min-h-screen pb-32">
      <header className="sticky top-0 z-10 bg-ink/90 backdrop-blur border-b border-border px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl sm:text-2xl tracking-wide truncate">Editing /{slug}</h1>
          {profile && (
            <span className="font-mono text-[10px] uppercase tracking-widest2 text-gold-dim border border-gold/30 rounded-sm px-2 py-0.5">
              {profile.plan} plan
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 sm:gap-4 font-mono text-xs">
          <Link to={`/${slug}`} className="text-muted hover:text-gold">View ↗</Link>
          <Link to={`/card/${slug}`} className="text-muted hover:text-gold">Card ↗</Link>
          <button onClick={signOut} className="text-muted hover:text-gold">Sign out</button>
          <button
            onClick={save}
            disabled={status === "saving" || !profile}
            className="border border-gold/50 px-4 py-2 uppercase tracking-widest2 text-gold-soft hover:bg-gold hover:text-ink transition-colors disabled:opacity-50"
          >
            {status === "saving" ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      {statusMsg && (
        <p className={`px-4 sm:px-6 py-2 font-mono text-xs ${status === "error" ? "text-red-400" : "text-gold-soft"}`}>
          {statusMsg}
        </p>
      )}

      {profile && (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-14">
          <section className="card p-5">
            <h2 className="eyebrow mb-2">Quick start</h2>
            <p className="text-muted text-xs mb-3 leading-relaxed">
              Upload your existing CV (PDF or Word) and an AI provider will fill in the fields
              below — review everything before saving. If the provider isn't set up, we'll fall
              back to pulling out your contact info only.
            </p>
            <div className="mb-3">
              <label className="block font-mono text-[11px] text-muted mb-1">AI provider</label>
              <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value as AIProvider)}
                disabled={importing}
                className="w-full bg-raised border border-border rounded-sm px-3 py-2 text-sm"
              >
                {AI_PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleResumeUpload}
              disabled={importing}
              className="text-xs font-mono file:mr-3 file:border file:border-gold/50 file:bg-transparent file:px-3 file:py-1.5 file:text-gold-soft file:font-mono file:text-xs file:uppercase file:tracking-widest2 hover:file:bg-gold hover:file:text-ink file:transition-colors file:cursor-pointer"
            />
            {importing && <p className="font-mono text-xs text-muted mt-2">Reading file…</p>}
            {importMsg && (
              <p className={`font-mono text-xs mt-2 ${importMsg.error ? "text-red-400" : "text-gold-soft"}`}>
                {importMsg.text}
              </p>
            )}
          </section>

          <section>
            <h2 className="eyebrow mb-4">Appearance</h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              {THEMES.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`card p-4 text-left transition-colors ${theme === t.id ? "border-gold" : ""}`}
                >
                  <p className="font-display text-lg tracking-wide">{t.name}</p>
                  <p className="text-muted text-xs mt-1">{t.description}</p>
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 font-mono text-xs text-muted">
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
              Public — visible to anyone at /{slug}
            </label>
          </section>

          <section>
            <h2 className="eyebrow mb-1">Card (/card/{slug})</h2>
            <p className="text-muted text-xs mb-4">
              Your link-in-bio page — a compact version of your CV good for sharing in a social bio.
            </p>
            <div className="mb-4">
              <label className="block font-mono text-[11px] text-muted mb-1">
                Tagline (shown instead of your title, optional)
              </label>
              <input
                placeholder={data.personal.title || "e.g. Open to freelance work"}
                className="w-full bg-raised border border-border rounded-sm px-3 py-2 text-sm"
                value={data.card.tagline}
                onChange={(e) => setData({ ...data, card: { ...data.card, tagline: e.target.value } })}
              />
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6 font-mono text-xs text-muted">
              {(
                [
                  ["showEmail", "Show email"],
                  ["showPhone", "Show phone"],
                  ["showLinkedin", "Show LinkedIn"],
                  ["showGithub", "Show GitHub"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.card[key]}
                    onChange={(e) => setData({ ...data, card: { ...data.card, [key]: e.target.checked } })}
                  />
                  {label}
                </label>
              ))}
            </div>
            <ArrayEditor
              label="Extra links"
              items={data.card.links}
              onChange={(links) => setData({ ...data, card: { ...data.card, links } })}
              fields={[
                { key: "label", label: "Label (e.g. Portfolio, X/Twitter, Calendly)" },
                { key: "url", label: "URL" },
              ]}
              emptyItem={{ label: "", url: "" }}
            />
          </section>

          <section>
            <h2 className="eyebrow mb-4">Personal</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(["name", "title", "location", "phone", "email", "linkedin", "github"] as const).map((k) => (
                <div key={k} className={k === "title" ? "sm:col-span-2" : ""}>
                  <label className="block font-mono text-[11px] text-muted mb-1 capitalize">{k}</label>
                  <input
                    className="w-full bg-raised border border-border rounded-sm px-3 py-2 text-sm"
                    value={data.personal[k]}
                    onChange={(e) => setData({ ...data, personal: { ...data.personal, [k]: e.target.value } })}
                  />
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="eyebrow mb-4">Summary</h2>
            <textarea
              className="w-full bg-raised border border-border rounded-sm px-3 py-2 text-sm min-h-[120px]"
              value={data.summary}
              onChange={(e) => setData({ ...data, summary: e.target.value })}
            />
          </section>

          <ArrayEditor
            label="Competencies"
            items={data.competencies}
            onChange={(items) => setData({ ...data, competencies: items })}
            fields={[
              { key: "category", label: "Category" },
              { key: "items", label: "Items", type: "list" },
            ]}
            emptyItem={{ category: "", items: [] }}
          />

          <ArrayEditor
            label="Experience"
            items={data.experience}
            onChange={(items) => setData({ ...data, experience: items })}
            fields={[
              { key: "role", label: "Role" },
              { key: "company", label: "Company" },
              { key: "dates", label: "Dates" },
              { key: "location", label: "Location" },
              { key: "bullets", label: "Bullets", type: "list" },
            ]}
            emptyItem={{ role: "", company: "", dates: "", location: "", bullets: [] }}
          />

          <ArrayEditor
            label="Education"
            items={data.education}
            onChange={(items) => setData({ ...data, education: items })}
            fields={[
              { key: "school", label: "School" },
              { key: "degree", label: "Degree" },
              { key: "dates", label: "Dates" },
              { key: "details", label: "Details", type: "textarea" },
            ]}
            emptyItem={{ school: "", degree: "", dates: "", details: "" }}
          />

          <ArrayEditor
            label="Certifications"
            items={data.certifications}
            onChange={(items) => setData({ ...data, certifications: items })}
            fields={[
              { key: "name", label: "Name" },
              { key: "issuer", label: "Issuer" },
              { key: "year", label: "Year" },
            ]}
            emptyItem={{ name: "", issuer: "", year: "" }}
          />

          <ArrayEditor
            label="Awards"
            items={data.awards}
            onChange={(items) => setData({ ...data, awards: items })}
            fields={[
              { key: "name", label: "Name" },
              { key: "issuer", label: "Issuer" },
              { key: "year", label: "Year" },
              { key: "project", label: "Project" },
            ]}
            emptyItem={{ name: "", issuer: "", year: "", project: "" }}
          />

          <ArrayEditor
            label="Languages"
            items={data.languages}
            onChange={(items) => setData({ ...data, languages: items })}
            fields={[
              { key: "name", label: "Language" },
              { key: "level", label: "Level" },
            ]}
            emptyItem={{ name: "", level: "" }}
          />

          <section>
            <h2 className="eyebrow mb-4">Strengths (one per line)</h2>
            <textarea
              className="w-full bg-raised border border-border rounded-sm px-3 py-2 text-sm min-h-[100px]"
              value={data.strengths.join("\n")}
              onChange={(e) => setData({ ...data, strengths: e.target.value.split("\n") })}
            />
          </section>

          <CustomSectionsEditor
            sections={data.customSections}
            onChange={(customSections) => setData({ ...data, customSections })}
          />
        </div>
      )}
    </div>
  );
}
