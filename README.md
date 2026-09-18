# CV Builder

A free, open-source, multi-tenant CV builder: anyone signs up, claims `/{their-name}`, fills in
one form, picks a theme, and gets a live CV site, a Linktree-style link-in-bio card, and a
downloadable ATS-friendly PDF.

- **`/`** — marketing landing page
- **`/signup`**, **`/login`** — account creation / sign-in (collects name + email)
- **`/{slug}`** — a user's full public CV, themed
- **`/card/{slug}`** — a compact link-in-bio card (Linktree-style) for the same person — good for a
  bio link on Instagram/TikTok/WhatsApp, customizable separately from the full CV (see "Card
  customization" below)
- **`/me`** and **`/card/me`** — a permanent, built-in demo. `me` is a reserved slug (nobody can
  sign up with it); these two routes render bundled example data
  (`src/data/profile.example.json`) directly, without touching Supabase, so the demo always works
  even on a fresh deploy with an empty database
- **`/{slug}/edit`** — that user's editor (only they can access it)
- **"Download CV"** everywhere — a real PDF, generated client-side, always ATS-plain regardless of
  the visual theme
- **Custom sections** — beyond the built-in fields, anyone can add their own sections (Projects,
  Recommendations, Publications, whatever) from the editor; they show up on the CV, the card, and
  the PDF automatically
- **Plans** — `free` today, with `basic`/`pro` tiers already modeled in the schema for when
  subscriptions are added

Backed entirely by **Supabase** (Postgres + Auth) — the browser talks to Supabase directly, so
there's no separate backend to deploy or a private database to tunnel to.

---

## 1. Clone & install

```bash
git clone https://github.com/Abudi-seid10/cv-portfolio-template.git my-cv-builder
cd my-cv-builder
npm install
```

## 2. Create a Supabase project

1. [supabase.com](https://supabase.com) → New project (free tier is enough).
2. Project → SQL Editor → paste the contents of `supabase/schema.sql` → Run.
   This creates `profiles`, its RLS policies, a trigger that auto-creates a profile row on signup,
   and a `slug_available` function the signup form uses for live availability checks.
3. Authentication → Settings → decide on **"Confirm email"**:
   - **ON** (default, recommended for a public deployment) — new users get a confirmation email
     before they can sign in; the signup form shows a "check your email" message and stops there.
   - **OFF** — signup logs them straight into `/edit`. Fine for a private/demo deployment.
4. Project Settings → API → copy the **Project URL** and the key labeled **"anon public"** or
   **"publishable"** (naming varies by when your project was created — either works).

## 3. Configure environment variables

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

`src/lib/supabase.ts` also accepts the older `VITE_SUPABASE_ANON_KEY` name as a fallback, so either
works depending on what your Supabase project's dashboard calls it.

## 4. Run it locally

```bash
npm run dev
```

**Developing in WSL:** if you see errors like `Cannot find module @rollup/rollup-linux-x64-gnu` or
`Cannot find native binding`, it almost always means `node_modules` has a mix of a Windows install
and a WSL install. Fix with a clean reinstall from inside WSL:

```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

Don't run `npm install` from Windows (PowerShell/cmd) and then `npm run dev` from WSL (or vice
versa) against the same `node_modules` — the native binaries are platform-specific.

## 5. Deploy

```bash
npm i -g vercel
vercel
```

Add the env vars you're using from `.env` in the Vercel dashboard (Project → Settings →
Environment Variables) — at minimum the two Supabase ones; add whichever AI provider keys you want
enabled (see "AI-powered CV import" below) — then redeploy. This is a plain static SPA — Cloudflare
Pages or Netlify work exactly the same way.

**Claim a short slug for yourself:** first signup gets first pick of any address (note that `me` is
reserved for the built-in demo and can't be claimed).

**Custom domain**, e.g. `cv.yourdomain.com`:
1. Vercel → Project → Settings → Domains → Add → enter your domain.
2. In your DNS provider, add the CNAME record Vercel shows you.
3. Wait for propagation — Vercel issues the SSL certificate automatically once it verifies.

## How auth & data access work

Everything goes through Supabase's client SDK and Postgres Row-Level Security — there's no custom
API layer:
- `supabase.auth.signUp()` creates the account; a `SECURITY DEFINER` trigger
  (`handle_new_user` in `supabase/schema.sql`) creates the matching `profiles` row, reading
  `name`/`slug` out of the signup metadata.
- Anyone can `select` a profile where `is_public = true`; only the owner (`auth.uid() = user_id`)
  can `select` a private one or `update` any profile — enforced by Postgres itself, not app code.
- The `slug_available` RPC lets the signup form check availability without exposing profile data.

## Themes

Themes are CSS-variable sets swapped via a `data-theme` attribute on `<html>` (`src/themes/index.ts`,
`src/index.css`) — components use the same Tailwind classes (`bg-ink`, `text-gold`, …) regardless of
theme. Ships with two: **Editorial Gold** (dark, gold accent) and **Minimal Mono** (light,
monochrome). Add a third by adding a `[data-theme="..."]` CSS block plus one entry in `THEMES`. The
downloaded PDF (`src/pdf/PrintLayout.tsx`) is intentionally theme-independent and always ATS-plain.

## Plans

`profiles.plan` (`free` / `basic` / `pro`, defaults to `free`) is in the schema and shown as a badge
in the editor, but nothing is gated on it yet — it's there so adding real billing tiers later is a
feature flag, not a migration.

## Custom sections vs. new built-in fields

End users don't need any code changes to add a "Projects" or "Recommendations" section — that's
what **Custom Sections** in the editor are for (`src/lib/types.ts` → `CustomSection`,
`src/components/edit/CustomSectionsEditor.tsx`, `src/components/CustomSections.tsx`). Each section
has entries of the form `{ heading, subheading?, meta?, body?, bullets? }`, which comfortably
covers most section types.

If you (the developer) want a genuinely new **built-in** field with its own bespoke layout instead:

1. Add the field + entry type to `CVData` in `src/lib/types.ts` (and `emptyCVData`).
2. Add an `<ArrayEditor />` block in `src/pages/Edit.tsx` — it's generic, just pass the field list.
3. Add a matching display component under `src/components/`, following `Awards.tsx`.
4. Add it to `src/pdf/PrintLayout.tsx` if it should also appear in the downloaded PDF.

## Card customization

Each user has a separate settings block (`CVData.card` in `src/lib/types.ts`) just for
`/card/{slug}`: a short tagline shown instead of their job title, toggles for which auto-derived
contact links appear (email/phone/LinkedIn/GitHub), and a list of extra custom links (portfolio
site, X/Twitter, Calendly — anything). Edited from the "Card" section in `/edit`, rendered in
`src/pages/CardView.tsx`. It never affects the full `/{slug}` CV or the PDF.

## AI-powered CV import ("Quick start")

The editor's "Quick start" panel (`src/lib/parseResume.ts` for text extraction,
`src/lib/gemini.ts` for the AI parsing itself — despite the filename, it now routes to four
different providers) lets someone upload a PDF or Word résumé and have every field on the CV
filled in automatically, instead of typing everything from scratch. **The person always sees
every field populated before saving — nothing is written to the database until they hit Save.**

Pick a provider from the dropdown next to the upload button:

| Provider | Env vars | Notes |
|---|---|---|
| **Google Gemini** (default) | `VITE_GEMINI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — free tier available |
| **OpenAI / ChatGPT** | `VITE_OPENAI_API_KEY`, `VITE_OPENAI_MODEL` (default `gpt-4o-mini`) | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **Ollama (local)** | `VITE_OLLAMA_BASE_URL` (default `http://localhost:11434`), `VITE_OLLAMA_MODEL` (default `llama3.2`) | Runs entirely on the visitor's machine — no API key, no cost, no data leaves their computer. Requires CORS to be enabled — see below. |
| **OpenRouter** | `VITE_OPENROUTER_API_KEY`, `VITE_OPENROUTER_MODEL` (default `openai/gpt-oss-20b:free`) | [openrouter.ai/keys](https://openrouter.ai/keys) — gateway to many open-source models, including free ones |

Any provider you don't configure just won't work if selected — the person sees a clear error
naming the missing env var, and the app automatically falls back to a basic, offline, regex-based
contact-info extraction (name/email/phone/LinkedIn/GitHub, plus the raw text dumped into Summary)
so the upload is never a dead end even with zero AI providers configured.

### ⚠️ These API keys are exposed in the browser

`VITE_*` variables are baked into the client-side JavaScript bundle at build time — **anyone can
open dev tools on your deployed site and read them out.** For a single-person deployment (just you
using your own keys) that's a manageable risk. For a **public multi-tenant deployment** — which is
the whole point of this template — a `VITE_OPENAI_API_KEY` here means any visitor can extract your
key and run up charges on your account, completely outside the app.

Reasonable options, roughly in order of effort:
1. **Ship it without AI keys configured** — the regex fallback still works, costs nothing, and
   leaks nothing. Fine for a genuinely free tier.
2. **Restrict the key** — most providers let you cap a key by usage quota, domain/referrer, or
   IP. Limits the blast radius; doesn't eliminate it.
3. **Use Ollama** — since it runs on the visitor's own machine, there's no shared key to leak at
   all. Only realistic for a technical audience who'll actually set up a local model.
4. **Add a server-side proxy** — a small serverless function that holds the real key and the app
   calls instead of the provider directly (this template deliberately has no backend right now —
   see "How auth & data access work" — so this is a real architecture addition, not a config
   change). The natural place to put this is behind a paid plan, tying into the `plan` field
   already in the schema (see "Plans").

### Ollama CORS

Ollama's local server blocks cross-origin requests by default, so a browser tab (this app) can't
call `localhost:11434` until you allow it:

```bash
OLLAMA_ORIGINS="http://localhost:5173,https://your-deployed-domain.com" ollama serve
```

### What the AI is asked to do

The prompt (`SYSTEM_PROMPT` in `src/lib/gemini.ts`) explicitly instructs the model to only use
information present in the uploaded text, never invent or embellish facts, and use empty
strings/arrays for anything not found — plus every response is defensively re-shaped
(`sanitizeParsed`) before it touches your CV data, so a malformed or partial AI response can't
crash the editor. Card settings (`CVData.card`) are never touched by the AI import.

## /me — the built-in demo

`me` is a reserved slug (`src/lib/reserved-slugs.ts`, and enforced again by the `slug_not_reserved`
check in `supabase/schema.sql`) — nobody can sign up with it. `/me` and `/card/me` instead render
`src/data/profile.example.json` directly in `useProfile()` (`src/hooks/useProfile.ts`), bypassing
Supabase entirely, so the demo works identically on every deployment, even before Supabase is
configured. Both pages show a small "This is a demo" banner linking to `/signup`.

## PDF generation

`src/pdf/generatePDF.ts` captures the off-screen `#pdf-export-root` node (rendered by
`PrintLayout`) with `html2canvas` and slices it into real A4 pages with `jsPDF`. A few details
that matter if you're touching this code:
- It `await`s `document.fonts.ready` (plus one animation frame) before capturing, so custom web
  fonts that are still loading don't get silently swapped for system fonts in the snapshot.
- The off-screen wrapper around `<PrintLayout />` in `PublicCV.tsx`/`CardView.tsx` uses
  `position: absolute` and a large negative `left` offset — **not** `display: none` and **not** a
  negative `z-index`. Both of those can stop `html2canvas` from capturing an element at all;
  absolute-positioned-off-screen keeps it painted and capturable while staying invisible to
  visitors.
- `generatePDF()` throws (rather than failing silently) if `#pdf-export-root` is missing or the
  captured canvas comes back empty, and `DownloadButton` catches and displays that error.

## Responsive

Every page — landing, signup/login, the public CV, the card, and the editor — is built mobile-first
with Tailwind breakpoints (`sm:`/`md:`); the editor's field grids and header collapse to a single
column below `sm`.

## Stack

React 18 + TypeScript + Vite 7 + Tailwind CSS + Supabase (Postgres + Auth + RLS) + react-router-dom
+ html2canvas/jsPDF for the PDF export + pdfjs-dist/mammoth (lazy-loaded) for résumé text
extraction + Gemini/OpenAI/Ollama/OpenRouter (all optional) for AI-powered CV import. Ships as a
static SPA — no server/API to deploy.

## License

MIT — fork it, run your own instance, credit is appreciated but not required.
#   M o t e c h - C V  
 