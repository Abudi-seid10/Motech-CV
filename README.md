# Motech CV

Motech CV is an open-source, self-hostable CV builder for publishing a polished portfolio, a compact link-in-bio card, and an ATS-friendly PDF from the same profile.

It is a client-side React application backed by Supabase. There is no custom server to deploy: authentication, profile storage, row-level security, and public/private access are handled by Supabase.

## Features

- Claim a personal public address such as `/<your-slug>`.
- Edit profile, summary, experience, education, certifications, awards, languages, strengths, and custom sections.
- Publish a separate link-in-bio card at `/card/<your-slug>`.
- Choose from five visual themes: Editorial Gold, Minimal Mono, Coastal Cyan, Forest Lime, and Terracotta Ink.
- Download a theme-independent A4 PDF designed for ATS readability.
- Import a PDF or DOCX résumé with optional AI assistance, with an offline contact-information fallback.
- Use the built-in `/me` and `/card/me` demo without configuring a database.
- Deploy as a static SPA on Vercel, Netlify, Cloudflare Pages, or another Vite-compatible host.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/signup` | Create an account and claim a slug |
| `/login` | Sign in |
| `/<slug>` | Public CV |
| `/card/<slug>` | Public link-in-bio card |
| `/<slug>/edit` | Owner-only editor |
| `/me` | Built-in demo CV |
| `/card/me` | Built-in demo card |

The `me` slug is reserved and cannot be claimed.

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/Abudi-seid10/Motech-CV.git
cd Motech-CV
npm install
```

### 2. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** in the Supabase dashboard.
3. Run the complete contents of [`supabase/schema.sql`](supabase/schema.sql).
4. In **Project Settings > API**, copy the Project URL and the publishable/anon key.
5. In **Authentication > Settings**, choose whether email confirmation is required.

The schema creates the `profiles` table, row-level security policies, the signup trigger that creates a profile, and the `slug_available` function used by the signup form.

### 3. Configure environment variables

Copy the example file:

```bash
cp .env.example .env
```

Set the Supabase values in `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

The legacy `VITE_SUPABASE_ANON_KEY` name is also supported.

### 4. Run locally

```bash
npm run dev
```

Open the local URL printed by Vite, then visit `/me` to preview the demo or `/signup` to create a profile.

### 5. Build for production

```bash
npm run build
npm run preview
```

The build runs TypeScript checking followed by the Vite production build.

## AI Resume Import

The editor's **Quick start** panel accepts PDF and DOCX files. AI parsing is optional and runs directly from the browser using the provider selected in the editor.

| Provider | Environment variables | Notes |
| --- | --- | --- |
| Google Gemini | `VITE_GEMINI_API_KEY` | Default provider; free tier available |
| OpenAI | `VITE_OPENAI_API_KEY`, optional `VITE_OPENAI_MODEL` | Defaults to `gpt-4o-mini` |
| Ollama | Optional `VITE_OLLAMA_BASE_URL`, `VITE_OLLAMA_MODEL` | Local model; defaults to `http://localhost:11434` and `llama3.2` |
| OpenRouter | `VITE_OPENROUTER_API_KEY`, optional `VITE_OPENROUTER_MODEL` | Defaults to `openai/gpt-oss-20b:free` |

If no provider is configured, the app falls back to extracting contact details and placing the source text in the summary so importing a résumé is still useful.

### Important key security note

Any `VITE_*` variable is bundled into browser JavaScript. Visitors can inspect these values. Do not use personal or production API keys in a public multi-user deployment. For a public deployment, leave AI keys unset, use strict provider quotas, use Ollama locally, or move provider calls behind a server-side function.

For Ollama, allow the app origin when starting the server:

```bash
OLLAMA_ORIGINS="http://localhost:5173,https://your-domain.com" ollama serve
```

## Themes

Themes are registered in [`src/themes/index.ts`](src/themes/index.ts) and implemented as CSS variables in [`src/index.css`](src/index.css). Components use the same semantic Tailwind classes across themes.

Current themes:

- **Editorial Gold**: dark ink, gold accents, and editorial typography.
- **Minimal Mono**: light, monochrome, and restrained.
- **Coastal Cyan**: deep navy with bright cyan accents.
- **Forest Lime**: warm paper with evergreen tones.
- **Terracotta Ink**: charcoal and clay with a creative feel.

To add a theme, extend the `ThemeId` union, add an entry to `THEMES`, and add a matching `[data-theme="..."]` token block in `src/index.css`.

The PDF intentionally ignores the visual theme and uses a light, plain layout for readability and parsing.

## PDF Downloads

The download flow renders the off-screen `#pdf-export-root` from [`src/pdf/PrintLayout.tsx`](src/pdf/PrintLayout.tsx), captures it with `html2canvas`, and creates A4 pages with `jsPDF`.

The capture waits for web fonts, keeps the printable layout painted off-screen, slices long documents into separate page canvases, and removes unsupported `oklch`/`oklab` color functions from the cloned document for browser compatibility.

## Data and Access Control

The browser uses the Supabase client directly. PostgreSQL row-level security controls access:

- Public visitors can read public profiles.
- Profile owners can read and update their own profile.
- Private profiles are not exposed to unauthenticated visitors.
- The signup trigger creates the profile row from signup metadata.
- The `slug_available` RPC checks whether an address is available without exposing profile data.

Review [`supabase/schema.sql`](supabase/schema.sql) before deploying to a new Supabase project.

## Deployment

This is a Vite single-page application. Build it with `npm run build`, then deploy the generated `dist` directory through your preferred static hosting provider.

For Vercel:

```bash
npm install --global vercel
vercel
```

Add the Supabase environment variables in the host's project settings and configure SPA fallback routing if the provider does not detect it automatically. The included [`vercel.json`](vercel.json) provides the Vercel rewrite.

## Project Structure

```text
src/
  components/       Public CV, editor, and download UI
  data/             Built-in demo profile
  hooks/            Supabase profile and session state
  lib/              API, types, parsing, AI providers, and utilities
  pages/            Home, auth, editor, CV, and card routes
  pdf/              Printable layout and PDF generation
  themes/           Theme registry and theme IDs
supabase/
  schema.sql        Database tables, policies, trigger, and RPC
```

## License

MIT. See [`LICENSE`](LICENSE).
