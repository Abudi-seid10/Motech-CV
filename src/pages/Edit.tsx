import { useEffect, useState, ChangeEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { fetchOwnProfile, saveProfile, logout, ProfileRow } from "@/lib/api";
import { CVData, emptyCVData, normalizeCVData } from "@/lib/types";
import { THEMES, ThemeId, DEFAULT_THEME, LAYOUTS, layoutOf } from "@/themes";
import { fileToPhotoDataUrl } from "@/lib/photo";
import { SUPPORTED_ACCEPT } from "@/lib/parseResume";
import ArrayEditor from "@/components/edit/ArrayEditor";
import CustomSectionsEditor from "@/components/edit/CustomSectionsEditor";
import CVPreview from "@/components/cv/CVPreview";

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
  const [importProgress, setImportProgress] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<{ text: string; error: boolean } | null>(null);
  // Side-by-side editor+preview is a lg+ layout; below that it's one pane at
  // a time via this toggle, since there isn't room to show both usefully.
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");

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

  // Note: unlike the public pages, selecting a theme here does NOT re-theme
  // the whole editor — only the preview pane (scoped via its own
  // data-theme attribute below). The editor chrome stays consistent so you
  // can compare themes without the controls around it jumping too.

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
      // Loaded on demand — pdfjs-dist, mammoth and the OCR engine are large
      // and shouldn't bloat every page's initial load.
      const { extractTextFromFile, parseResumeText, applyParsed, summarizeParsed } = await import("@/lib/parseResume");
      const text = await extractTextFromFile(file, (m) => setImportProgress(m));
      if (text.replace(/\s/g, "").length < 20) {
        throw new Error("Couldn't find any text in that file. Try a sharper scan or photo.");
      }
      const parsed = parseResumeText(text);
      const found = summarizeParsed(parsed);
      if (!found) throw new Error("Read the file but couldn't recognise any CV sections in it.");
      setData((prev) => applyParsed(prev, parsed));
      setImportMsg({
        text: `${found} Check the preview and fix anything that's off before saving.`,
        error: false,
      });
    } catch (err) {
      setImportMsg({ text: (err as Error).message, error: true });
    } finally {
      setImporting(false);
      setImportProgress(null);
    }
  }

  if (sessionLoading || (!profile && status !== "error")) {
    return <div className="min-h-screen grid place-items-center font-mono text-sm text-muted">Loading…</div>;
  }

  return (
    <div className="min-h-screen pb-32">
      <header className="sticky top-0 z-20 bg-ink/90 backdrop-blur border-b border-border px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
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
          <Link to={`/${slug}/crm`} className="text-muted hover:text-gold">CRM ↗</Link>
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

      {/* Mobile-only pane switch — side-by-side only makes sense at lg+ */}
      <div className="lg:hidden flex border-b border-border font-mono text-xs uppercase tracking-widest2">
        <button
          onClick={() => setMobileView("edit")}
          className={`flex-1 py-3 text-center ${mobileView === "edit" ? "text-gold-soft border-b-2 border-gold" : "text-muted"}`}
        >
          Edit
        </button>
        <button
          onClick={() => setMobileView("preview")}
          className={`flex-1 py-3 text-center ${mobileView === "preview" ? "text-gold-soft border-b-2 border-gold" : "text-muted"}`}
        >
          Preview
        </button>
      </div>

      {profile && (
        <div className="lg:grid lg:grid-cols-2 lg:items-start">
          {/* Editor pane */}
          <div className={`${mobileView === "preview" ? "hidden" : "block"} lg:block mx-auto max-w-3xl w-full px-4 sm:px-6 py-10 space-y-14`}>
            <section className="card p-5">
              <h2 className="eyebrow mb-2">Quick start</h2>
              <p className="text-muted text-xs mb-3 leading-relaxed">
                Upload your existing CV — a PDF, Word file, or a photo/scan (PNG, JPG) — and we'll
                read it with OCR and fill in the fields below. Everything runs in your browser;
                the file never leaves your device. Review the preview before saving.
              </p>
              <input
                type="file"
                accept={SUPPORTED_ACCEPT}
                onChange={handleResumeUpload}
                disabled={importing}
                className="text-xs font-mono file:mr-3 file:border file:border-gold/50 file:bg-transparent file:px-3 file:py-1.5 file:text-gold-soft file:font-mono file:text-xs file:uppercase file:tracking-widest2 hover:file:bg-gold hover:file:text-ink file:transition-colors file:cursor-pointer"
              />
              {importing && <p className="font-mono text-xs text-muted mt-2">{importProgress ?? "Reading file…"}</p>}
              {importMsg && (
                <p className={`font-mono text-xs mt-2 ${importMsg.error ? "text-red-400" : "text-gold-soft"}`}>
                  {importMsg.text}
                </p>
              )}
            </section>

            <section>
              <h2 className="eyebrow mb-4">CV format</h2>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {LAYOUTS.map((l) => (
                  <button
                    type="button"
                    key={l.id}
                    onClick={() => setData({ ...data, layout: l.id })}
                    className={`card p-4 text-left transition-colors ${layoutOf(data) === l.id ? "border-gold" : ""}`}
                  >
                    <p className="font-display text-lg tracking-wide">{l.name}</p>
                    <p className="text-muted text-xs mt-1">{l.description}</p>
                    {l.photo && <p className="font-mono text-[10px] text-gold-dim mt-2">Uses your photo</p>}
                  </button>
                ))}
              </div>
              <h2 className="eyebrow mb-4">Color theme (Editorial format)</h2>
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
              <div className="flex items-center gap-4 mb-4">
                {data.personal.photo ? (
                  <img src={data.personal.photo} alt="" className="w-16 h-16 rounded-full object-cover border border-border" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-raised border border-border" />
                )}
                <div>
                  <label className="block font-mono text-[11px] text-muted mb-1">Photo (used by Profile, Teal Ribbon and Navy Timeline)</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="text-xs font-mono file:mr-3 file:border file:border-gold/50 file:bg-transparent file:px-3 file:py-1.5 file:text-gold-soft file:font-mono file:text-xs file:uppercase file:tracking-widest2 hover:file:bg-gold hover:file:text-ink file:transition-colors file:cursor-pointer"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      try {
                        const photo = await fileToPhotoDataUrl(file);
                        setData((prev) => ({ ...prev, personal: { ...prev.personal, photo } }));
                      } catch (err) {
                        setImportMsg({ text: (err as Error).message, error: true });
                      }
                    }}
                  />
                  {data.personal.photo && (
                    <button
                      type="button"
                      className="font-mono text-[11px] text-muted hover:text-gold mt-1 block"
                      onClick={() => setData({ ...data, personal: { ...data.personal, photo: "" } })}
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>
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

          {/* Live preview pane — themed locally via data-theme, independent
              of the editor chrome around it. Sticky on desktop so it stays
              in view while the (usually much longer) form scrolls. */}
          <div className={`${mobileView === "edit" ? "hidden" : "block"} lg:block border-l border-border`}>
            <div className="lg:sticky lg:top-[73px] lg:h-[calc(100vh-73px)] overflow-y-auto">
              <div data-theme={theme} className="bg-ink min-h-full">
                <CVPreview data={data} filename={slug} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
