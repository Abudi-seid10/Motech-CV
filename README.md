# Motech CV

Motech CV is an open-source, self-hostable CV builder for publishing a polished portfolio, a compact link-in-bio card, and a real, text-based ATS-friendly PDF from the same profile — plus a built-in way to collect and manage the people who want to get in touch.

It is a client-side React application backed by Supabase. There is no custom server to deploy for the core app: authentication, profile storage, row-level security, and public/private access are all handled by Supabase. One optional Supabase Edge Function exists purely to send an email notification (see "Contact form, CRM, and the hello email" below) — everything else runs entirely in the browser.

## Features

- Claim a personal public address such as `/<your-slug>`.
- Side-by-side editor and live preview — edit on the left, see the real themed CV update on the right as you type (toggles to one pane at a time on small screens).
- Edit profile, summary, experience, education, certifications, awards, languages, strengths, and custom sections.
- Publish a separate link-in-bio card at `/card/<your-slug>`, with its own tagline, link visibility toggles, and extra custom links.
- Choose from five visual themes: Editorial Gold, Minimal Mono, Coastal Cyan, Forest Lime, and Terracotta Ink — previewed live while editing.
- Download a real, text-based (not a screenshot) A4 PDF designed for ATS readability, independent of the chosen theme.
- Save a visitor's contact to their phone with one tap (vCard) from the card page.
- A one-tap "Say Hello" email to the owner from the card page.
- A public "share your contact" form on the card page that feeds directly into a built-in CRM at `/<slug>/crm`, with an optional email notification.
- Import an existing CV (PDF, DOCX, or a PNG/JPG photo or scan) — OCR reads it in the browser and fills in the editor, no API keys needed.
- Use the built-in `/me` and `/card/me` demo without configuring a database.
- Deploy as a static SPA on Vercel, Netlify, Cloudflare Pages, or another Vite-compatible host.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/signup` | Create an account and claim a slug |
| `/login` | Sign in |
| `/<slug>` | Public CV |
| `/card/<slug>` | Public link-in-bio card, with vCard save, Say Hello, and the contact form |
| `/<slug>/edit` | Owner-only editor, side-by-side with a live preview |
| `/<slug>/crm` | Owner-only CRM — people who shared their contact on the card |
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

The schema creates:
- `profiles` — one row per user, RLS policies, the signup trigger that creates it, and the `slug_available` RPC used by the signup form.
- `contacts` — the built-in CRM. Anyone can insert (the public contact form); only the owner can read, update, or delete their own rows.

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

## CV Import (OCR)

The editor's **Quick start** panel accepts PDF, DOCX, and image files (PNG, JPG, WebP). Everything runs in the browser and no API key is required:

- PDFs with selectable text are read directly. PDFs without a text layer (scans) are rendered page by page and read with [tesseract.js](https://github.com/naptha/tesseract.js) OCR (first four pages).
- Images are upscaled if needed and run through OCR.
- The extracted text is parsed by rules in [`src/lib/parseResume.ts`](src/lib/parseResume.ts): it finds section headings (Summary, Experience, Education, Skills, Certifications, Awards, Languages, plus extras like Projects) and fills contact info, jobs, education, skills and more. Sections it doesn't find are left as they were.

Parsing is heuristic — layouts vary a lot — so review the live preview before saving. OCR is English-only, and the first scan downloads the OCR engine and language data from a CDN (cached afterwards).

## Themes

Themes are registered in [`src/themes/index.ts`](src/themes/index.ts) and implemented as CSS variables in [`src/index.css`](src/index.css). Components use the same semantic Tailwind classes across themes, so switching is just swapping which CSS variables are in scope.

Current themes:

- **Editorial Gold**: dark ink, gold accents, and editorial typography.
- **Minimal Mono**: light, monochrome, and restrained.
- **Coastal Cyan**: deep navy with bright cyan accents.
- **Forest Lime**: warm paper with evergreen tones.
- **Terracotta Ink**: charcoal and clay with a creative feel.

To add a theme, extend the `ThemeId` union, add an entry to `THEMES`, and add a matching `[data-theme="..."]` token block in `src/index.css`.

In the editor, the selected theme is scoped **only to the live preview pane** (via its own `data-theme` wrapper) — the editor chrome around it stays constant so you can compare themes without the controls themselves jumping. The public `/<slug>` and `/card/<slug>` pages apply the theme to the whole page.

The PDF intentionally ignores the visual theme and uses a light, plain layout for readability and ATS parsing.

## PDF Downloads

The PDF is generated with [`@react-pdf/renderer`](https://react-pdf.org/) directly from the profile's `CVData` — there is no DOM screenshot involved. `src/pdf/ResumeDocument.tsx` defines the layout declaratively; `src/pdf/generatePDF.ts` renders it to a `Blob` and triggers the download.

This matters for the "ATS-friendly" claim specifically: the output is a **real text layer** — selectable, copyable, and machine-parseable — not an image of text. An ATS that can't extract text from a PDF can't read it, no matter how plain the layout looks to a human. The renderer also handles pagination natively (real document flow, with `wrap={false}` on each entry so a single job or section is never split mid-entry across a page break), so there's no manual page-break math to get wrong.

`@react-pdf/renderer` is a large dependency and is dynamically `import()`-ed only when someone actually clicks a download button, so it doesn't add to any page's initial load.

## Contact form, CRM, and the hello email

On `/card/<slug>`, visitors get three ways to connect:

1. **Save Contact** — downloads a `.vcf` (vCard) file built from the profile's personal info, so one tap adds the person to the visitor's phone contacts.
2. **Say Hello** — a `mailto:` link pre-filled with a friendly greeting to the owner's email. No backend involved.
3. **Get in touch (the contact form)** — name, email, phone, and a message. Submitting it:
   - Always inserts a row into `public.contacts`, scoped to the profile owner by row-level security. This is the CRM data and never depends on email working.
   - Then **best-effort** invokes the `send-hello` Supabase Edge Function to email the owner a notification. If it's not deployed, or fails for any reason, the contact is still saved — the visitor never sees an error for this part.

The owner reviews everything collected at `/<slug>/crm`: filter by status (new/contacted/archived), update status inline, and delete entries.

### Deploying the hello-email Edge Function (optional)

The CRM works with zero extra setup. This step only enables the email notification:

```bash
npm install --global supabase
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy send-hello
supabase secrets set RESEND_API_KEY=re_your_key_here
```

The function uses [Resend](https://resend.com) (simple API, generous free tier) — swap the single `fetch` call in [`supabase/functions/send-hello/index.ts`](supabase/functions/send-hello/index.ts) for any other transactional email provider if you prefer. Optionally set `RESEND_FROM` as a secret too (defaults to a Resend sandbox address, which only delivers to your own verified email until you verify a sending domain).

### Known limitation: no spam protection

The contact form's insert policy is intentionally open (`with check (true)`) so anonymous visitors can submit it — but that also means it currently has no CAPTCHA or rate-limiting. Treat it as spammable by a determined bot. Adding something like Cloudflare Turnstile in front of the submit handler is the natural next step before relying on this at real scale.

## Data and Access Control

The browser uses the Supabase client directly. PostgreSQL row-level security controls access:

- Public visitors can read public profiles.
- Profile owners can read and update their own profile.
- Private profiles are not exposed to unauthenticated visitors.
- The signup trigger creates the profile row from signup metadata.
- The `slug_available` RPC checks whether an address is available without exposing profile data.
- Anyone can insert into `contacts` (the public form); only the owner can read, update, or delete their own contacts.

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
  components/
    cv/              Shared CV section stack (CVPreview) used by the public page and the editor's live preview
    edit/             ArrayEditor and CustomSectionsEditor — generic editor building blocks
  data/               Built-in demo profile
  hooks/              Supabase profile and session state
  lib/                API, types, CV parsing + OCR, vCard, contacts/CRM, and utilities
  pages/              Home, auth, editor, CRM, CV, and card routes
  pdf/                ResumeDocument (the PDF layout) and generatePDF
  themes/             Theme registry and theme IDs
supabase/
  schema.sql          Database tables, policies, triggers, and RPCs
  functions/
    send-hello/        Edge Function for the contact-form email notification
```

## License

MIT. See [`LICENSE`](LICENSE).
