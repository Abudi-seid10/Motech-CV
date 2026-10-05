import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";
import { CVData } from "./types";
import { makeId } from "./id";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

/* ------------------------------------------------------------------ */
/* Text extraction: text layer first, OCR when there isn't one          */
/* ------------------------------------------------------------------ */

export type Progress = (message: string) => void;

const IMAGE_EXTS = ["png", "jpg", "jpeg", "webp", "bmp"];
/** A PDF whose text layer has fewer characters than this is treated as a scan. */
const MIN_TEXT_CHARS = 80;
const MAX_OCR_PAGES = 4;

export const SUPPORTED_ACCEPT = ".pdf,.docx,.png,.jpg,.jpeg,.webp,.bmp";

/** Rebuilds real lines from a PDF text layer by grouping items on their baseline. */
async function extractPdfLayerText(pdf: pdfjsLib.PDFDocumentProxy): Promise<string> {
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let lastY: number | null = null;
    let line = "";
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = item.transform[5] as number;
      if (lastY !== null && Math.abs(y - lastY) > 3) {
        text += line.trim() + "\n";
        line = "";
      }
      line += item.str + (item.hasEOL ? "\n" : " ");
      lastY = y;
    }
    text += line.trim() + "\n\n";
  }
  return text;
}

let workerPromise: Promise<import("tesseract.js").Worker> | null = null;
let onOcrProgress: Progress | undefined;

/** Lazily creates one shared OCR worker. tesseract.js is a big dependency, so it's only loaded when OCR is actually needed. */
async function getOcrWorker(progress?: Progress) {
  onOcrProgress = progress;
  if (!workerPromise) {
    workerPromise = import("tesseract.js")
      .then(({ createWorker }) =>
        createWorker("eng", 1, {
          logger: (m: { status: string; progress: number }) => {
            if (m.status === "recognizing text") onOcrProgress?.(`Reading text… ${Math.round(m.progress * 100)}%`);
            else if (m.status.includes("loading")) onOcrProgress?.("Loading OCR engine (first time only)…");
          },
        })
      )
      .catch((err) => {
        workerPromise = null;
        throw new Error(`Couldn't start the OCR engine (${(err as Error).message}). Check your connection and try again.`);
      });
  }
  return workerPromise;
}

async function ocrCanvas(canvas: HTMLCanvasElement, progress?: Progress): Promise<string> {
  const worker = await getOcrWorker(progress);
  const { data } = await worker.recognize(canvas);
  return data.text;
}

async function ocrImageFile(file: File, progress?: Progress): Promise<string> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Couldn't read that image — try a PNG or JPG.");
  }
  // OCR accuracy drops on small text; upscale low-resolution images.
  const scale = bitmap.width < 1400 ? 1400 / bitmap.width : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image processing isn't available in this browser.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return ocrCanvas(canvas, progress);
}

async function ocrPdf(pdf: pdfjsLib.PDFDocumentProxy, progress?: Progress): Promise<string> {
  const pages = Math.min(pdf.numPages, MAX_OCR_PAGES);
  let text = "";
  for (let i = 1; i <= pages; i++) {
    progress?.(`Scanning page ${i} of ${pages}…`);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.2 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
    text += (await ocrCanvas(canvas, (m) => progress?.(`Page ${i}/${pages}: ${m}`))) + "\n\n";
  }
  return text;
}

export async function extractTextFromFile(file: File, progress?: Progress): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (IMAGE_EXTS.includes(ext) || file.type.startsWith("image/")) {
    progress?.("Reading image…");
    return ocrImageFile(file, progress);
  }

  if (ext === "pdf") {
    progress?.("Reading PDF…");
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const layer = await extractPdfLayerText(pdf);
    if (layer.replace(/\s/g, "").length >= MIN_TEXT_CHARS) return layer;
    progress?.("No selectable text found — scanning with OCR…");
    return ocrPdf(pdf, progress);
  }

  if (ext === "docx") {
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value;
  }

  throw new Error("Please upload a PDF, Word (.docx) file, or an image (PNG/JPG) of your CV.");
}

/* ------------------------------------------------------------------ */
/* Rule-based parsing into CVData                                       */
/* ------------------------------------------------------------------ */

type SectionKind =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "certifications"
  | "awards"
  | "languages"
  | "strengths"
  | "custom";

const SECTION_ALIASES: Record<Exclude<SectionKind, "custom">, string[]> = {
  summary: ["summary", "profile", "about me", "about", "objective", "career objective", "professional summary", "personal statement", "personal profile", "professional profile", "career summary"],
  experience: ["experience", "work experience", "professional experience", "employment", "employment history", "work history", "career history", "relevant experience", "professional background"],
  education: ["education", "academic background", "academic qualifications", "qualifications", "education and training", "academics", "educational background"],
  skills: ["skills", "core competencies", "competencies", "technical skills", "key skills", "skills and expertise", "areas of expertise", "expertise", "core skills", "skills and tools", "tools and technologies"],
  certifications: ["certifications", "certificates", "licenses", "licences", "licenses and certifications", "training", "courses", "training and certifications"],
  awards: ["awards", "honors", "honours", "achievements", "awards and honors", "awards and achievements", "accomplishments"],
  languages: ["languages", "language", "language skills"],
  strengths: ["strengths", "interests", "hobbies", "hobbies and interests", "personal strengths", "soft skills"],
};

/** Headings that don't map to a built-in section but should still become their own custom section. */
const CUSTOM_HEADINGS = ["projects", "personal projects", "selected projects", "publications", "volunteering", "volunteer experience", "volunteer work", "references", "referees", "recommendations", "leadership", "activities", "extracurricular activities", "memberships", "affiliations", "conferences", "research", "portfolio", "additional information"];

const normHeading = (line: string) =>
  line
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function headingKind(line: string): { kind: SectionKind; title: string } | null {
  if (line.length > 45 || /[@\d]/.test(line)) return null;
  const n = normHeading(line);
  if (!n) return null;
  for (const [kind, aliases] of Object.entries(SECTION_ALIASES)) {
    if (aliases.includes(n)) return { kind: kind as SectionKind, title: line };
  }
  if (CUSTOM_HEADINGS.includes(n)) return { kind: "custom", title: toTitleCase(line.replace(/[:\s]+$/, "")) };
  return null;
}

function toTitleCase(s: string) {
  return s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

const MONTH = "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const DATE_PART = `(?:${MONTH}\\.?,?\\s+)?(?:19|20)\\d{2}|\\d{1,2}[/.]\\d{4}`;
const END_PART = `(?:${DATE_PART}|present|current|now|ongoing|today|date)`;
const DATE_RANGE_RE = new RegExp(`(${DATE_PART})\\s*(?:-|–|—|‑|to|until)\\s*(${END_PART})`, "i");
const SINGLE_YEAR_RE = /\b(?:19|20)\d{2}\b/;
const BULLET_RE = /^\s*[•●◦▪■□‣∙·*➢➤►▶✓✔-]\s*|^\s*[–—]\s+/;

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const URL_RE = /(?:https?:\/\/|www\.)\S+|\b\w[\w.-]*\.(?:com|org|net|io|dev|co|me)\b\S*/i;
const LINKEDIN_RE = /linkedin\.com\/(?:in|pub)\/[a-zA-Z0-9\-_%]+/i;
const GITHUB_RE = /github\.com\/[a-zA-Z0-9\-_]+/i;

const ROLE_WORDS = /\b(manager|engineer|developer|designer|analyst|accountant|director|lead|officer|consultant|specialist|assistant|intern|head|coordinator|administrator|architect|executive|associate|supervisor|teacher|lecturer|nurse|technician|president|founder|owner|clerk|auditor|scientist|researcher|representative|advisor|adviser|strategist|editor|writer|programmer|tester|trainer|agent|controller|partner|vp)\b/i;
const SCHOOL_WORDS = /\b(university|college|institute|school|academy|polytechnic|universit[ée]|faculty)\b/i;
const DEGREE_WORDS = /\b(bachelor|master|b\.?\s?sc|m\.?\s?sc|b\.?\s?a\b|m\.?\s?a\b|b\.?\s?eng|m\.?\s?eng|mba|ph\.?d|doctorate|diploma|certificate|degree|associate|bsc|msc|b\.?\s?tech|m\.?\s?tech|high school|a-levels?|gcse|hnd)\b/i;

const isBullet = (l: string) => BULLET_RE.test(l);
const stripBullet = (l: string) => l.replace(BULLET_RE, "").trim();

function looksLikePhone(s: string): string | null {
  const m = s.match(/(\+?\(?\d[\d\s().-]{7,}\d)/);
  if (!m) return null;
  const digits = m[1].replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return null;
  if (DATE_RANGE_RE.test(m[1])) return null;
  return m[1].trim();
}

const isContactish = (l: string) => EMAIL_RE.test(l) || URL_RE.test(l) || !!looksLikePhone(l) || LINKEDIN_RE.test(l);

interface RawEntry {
  header: string[];
  dates: string;
  bullets: string[];
}

/**
 * Splits a section's lines into entries. A line carrying a date range anchors an
 * entry; unbulleted lines just before it (company / role) and directly after it
 * are its header; bulleted lines — and long descriptive lines — are its bullets.
 */
function parseEntries(lines: string[], anchorRe: RegExp = DATE_RANGE_RE): RawEntry[] {
  const entries: RawEntry[] = [];
  let pending: string[] = [];
  let cur = null as RawEntry | null;

  const flush = () => {
    if (cur) entries.push(cur);
    cur = null;
  };
  const start = (header: string[], dates: string) => {
    flush();
    cur = { header, dates, bullets: [] };
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (isBullet(line)) {
      if (!cur) start(pending.splice(0), "");
      cur!.bullets.push(stripBullet(line));
      continue;
    }

    const m = line.match(anchorRe);
    if (m) {
      const rest = line.replace(m[0], " ").replace(/[|•·,()–—-]+\s*$/, "").replace(/^\s*[|•·,()–—-]+/, "").trim();
      const header = [...pending.splice(0)];
      if (rest) header.push(rest);
      start(header, m[0].replace(/\s+/g, " ").trim());
      continue;
    }

    if (cur) {
      const last = cur.bullets[cur.bullets.length - 1];
      // Wrapped continuation of the previous bullet.
      if (last !== undefined && (/^[a-z(]/.test(line) || !/[.!?:;]$/.test(last))) {
        if (line.length > 25 || /^[a-z]/.test(line)) {
          cur.bullets[cur.bullets.length - 1] = `${last} ${line}`;
          continue;
        }
      }
      // Header continuation directly after the anchor (e.g. the role on its own line).
      if (!cur.bullets.length && cur.header.length < 3 && line.length < 80) {
        cur.header.push(line);
        continue;
      }
      if (!cur.bullets.length) {
        cur.bullets.push(line); // descriptive paragraph
        continue;
      }
      // Otherwise it's the header of the next entry.
      flush();
    }
    pending.push(line);
  }
  flush();
  // Header lines with no anchor at all (e.g. entries without dates).
  if (pending.length) entries.push({ header: pending, dates: "", bullets: [] });
  return entries;
}

const splitPieces = (s: string, splitAt = true) =>
  s
    .split(splitAt ? /\s+[|•·@–—-]\s+|\s*\|\s*|\s+at\s+/i : /\s+[|•·@–—-]\s+|\s*\|\s*/)
    .map((p) => p.trim())
    .filter(Boolean);

const LOCATION_RE = /^[A-Z][\p{L} .'-]+,\s*[A-Z][\p{L} .'-]+$/u;

function parseExperience(lines: string[]): CVData["experience"] {
  return parseEntries(lines)
    .filter((e) => e.header.length || e.bullets.length)
    .map((e) => {
      const pieces = e.header
        .flatMap((h) => (h.includes(",") && LOCATION_RE.test(h) && !ROLE_WORDS.test(h) ? [h] : splitPieces(h)))
        // "Product Designer, Fieldstone" — a comma between a role and a company.
        .flatMap((p) => (p.includes(", ") && ROLE_WORDS.test(p) ? p.split(/,\s+/) : [p]));
      let role = "";
      let company = "";
      let location = "";
      for (const p of pieces) {
        if (!location && LOCATION_RE.test(p) && p.length <= 40 && !ROLE_WORDS.test(p)) location = p;
        else if (!role && ROLE_WORDS.test(p)) role = p;
        else if (!company) company = p;
      }
      if (!role && company && pieces.length > 1) {
        role = company;
        company = pieces.find((p) => p !== role && p !== location) ?? "";
      }
      return { company, role, dates: e.dates, location, bullets: e.bullets };
    });
}

function parseEducation(lines: string[]): CVData["education"] {
  const yearAnchor = new RegExp(`${DATE_RANGE_RE.source}|\\b(?:19|20)\\d{2}\\b`, "i");
  return parseEntries(lines, yearAnchor)
    .filter((e) => e.header.length || e.bullets.length)
    .map((e) => {
      const pieces = e.header.flatMap((h) => splitPieces(h, false));
      const school = pieces.find((p) => SCHOOL_WORDS.test(p)) ?? "";
      const degree = pieces.find((p) => p !== school && DEGREE_WORDS.test(p)) ?? "";
      const others = pieces.filter((p) => p !== school && p !== degree);
      return {
        school: school || (!degree ? others.shift() ?? "" : ""),
        degree: degree || others.shift() || "",
        dates: e.dates,
        details: [...others, ...e.bullets].join(" ").trim() || undefined,
      };
    });
}

const splitItems = (lines: string[]) =>
  lines
    .map(stripBullet)
    .flatMap((l) => l.split(/[,;•|·]|\s{3,}/))
    .map((s) => s.trim().replace(/[.:]$/, ""))
    .filter((s) => s.length > 1 && s.length <= 48);

function parseSkills(lines: string[]): CVData["competencies"] {
  const groups: CVData["competencies"] = [];
  const loose: string[] = [];
  for (const raw of lines) {
    const line = stripBullet(raw);
    const m = line.match(/^([A-Za-z][\w &/+-]{1,32}):\s*(.+)$/);
    if (m) {
      const items = splitItems([m[2]]);
      if (items.length) groups.push({ category: m[1].trim(), items });
    } else loose.push(line);
  }
  const items = [...new Set(splitItems(loose))];
  if (items.length) groups.push({ category: "Skills", items });
  return groups;
}

function parseCredentials(lines: string[]): { name: string; issuer: string; year: string }[] {
  return lines
    .map(stripBullet)
    .filter((l) => l.length > 2)
    .map((l) => {
      const year = l.match(SINGLE_YEAR_RE)?.[0] ?? "";
      const text = l.replace(/\(?\b(?:19|20)\d{2}\b\)?/, "").replace(/[\s,|–—-]+$/, "").trim();
      const [name, ...rest] = text.split(/\s+[–—|-]\s+|\s*\|\s*|,\s+(?=[A-Z])/);
      return { name: name.trim(), issuer: rest.join(", ").trim(), year };
    })
    .filter((c) => c.name);
}

function parseLanguages(lines: string[]): CVData["languages"] {
  return splitItems(lines).map((item) => {
    const m = item.match(/^(.+?)\s*(?:[(:–—-]\s*)(.+?)\)?$/);
    return m ? { name: m[1].trim(), level: m[2].trim() } : { name: item, level: "" };
  });
}

function parseCustom(title: string, lines: string[]): CVData["customSections"][number] | null {
  const entries = parseEntries(lines, new RegExp(`${DATE_RANGE_RE.source}|\\b(?:19|20)\\d{2}\\b`, "i"))
    .map((e) => {
      const header = [...e.header];
      const bullets = [...e.bullets];
      if (!header.length && bullets.length) header.push(bullets.shift()!);
      return {
        heading: header[0] ?? "",
        subheading: header[1] || undefined,
        meta: e.dates || undefined,
        bullets: bullets.length ? bullets : undefined,
      };
    })
    .filter((e) => e.heading);
  return entries.length ? { id: makeId(), title, entries } : null;
}

/** Turns "JANE DOE" into "Jane Doe", leaves mixed-case names alone. */
function tidyName(s: string) {
  return s === s.toUpperCase() ? toTitleCase(s) : s;
}

/**
 * Rule-based CV parser: finds the section headings, then fills contact info,
 * summary, experience, education, skills, certifications, awards, languages
 * and any extra sections. It's heuristic — layouts vary wildly — so the
 * editor always asks the user to review the result.
 */
export function parseResumeText(text: string): Partial<CVData> {
  const lines = text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Split into a header block and sections.
  const header: string[] = [];
  const sections: { kind: SectionKind; title: string; lines: string[] }[] = [];
  let current: (typeof sections)[number] | null = null;
  for (const line of lines) {
    const h = headingKind(line.replace(/[:\s]+$/, ""));
    if (h) {
      current = { kind: h.kind, title: h.title, lines: [] };
      sections.push(current);
    } else if (current) current.lines.push(line);
    else header.push(line);
  }

  // --- Personal ---
  const headZone = header.length ? header : lines.slice(0, 10);
  const whole = lines.join("\n");
  const email = whole.match(EMAIL_RE)?.[0] ?? "";
  const phone = headZone.map(looksLikePhone).find(Boolean) ?? lines.slice(0, 25).map(looksLikePhone).find(Boolean) ?? "";
  const linkedin = whole.match(LINKEDIN_RE)?.[0] ?? "";
  const github = whole.match(GITHUB_RE)?.[0] ?? "";

  const textual = headZone.filter((l) => !isContactish(l));
  const nameLine = textual.find((l) => l.length <= 60 && l.split(/\s+/).length <= 5 && !/\d/.test(l)) ?? "";
  const afterName = textual.slice(textual.indexOf(nameLine) + 1);
  const title = afterName.find((l) => l.length <= 70 && !/\d/.test(l) && !LOCATION_RE.test(l)) ?? "";
  let location = "";
  for (const l of headZone) {
    for (const p of l.split(/\s*[|•·]\s*/)) {
      if (LOCATION_RE.test(p.trim()) && p.length <= 45) {
        location = p.trim();
        break;
      }
    }
    if (location) break;
  }

  const result: Partial<CVData> = {
    personal: {
      name: tidyName(nameLine),
      title,
      location,
      phone,
      email,
      linkedin,
      github,
    },
  };

  // --- Sections ---
  const gather = (kind: SectionKind) => sections.filter((s) => s.kind === kind).flatMap((s) => s.lines);

  const summaryLines = gather("summary");
  let summary = summaryLines.map(stripBullet).join(" ").trim();
  if (!summary) {
    // No labelled summary: use any long paragraph from the header block.
    summary = headZone.filter((l) => l.length > 90 && !isContactish(l)).join(" ");
  }
  if (summary) result.summary = summary;

  const experience = parseExperience(gather("experience"));
  if (experience.length) result.experience = experience;

  const education = parseEducation(gather("education"));
  if (education.length) result.education = education;

  const skills = parseSkills(gather("skills"));
  if (skills.length) result.competencies = skills;

  const certs = parseCredentials(gather("certifications"));
  if (certs.length) result.certifications = certs;

  const awards = parseCredentials(gather("awards")).map((a) => ({ ...a, project: undefined }));
  if (awards.length) result.awards = awards;

  const languages = parseLanguages(gather("languages"));
  if (languages.length) result.languages = languages;

  const strengths = splitItems(gather("strengths"));
  if (strengths.length) result.strengths = strengths;

  const custom = sections
    .filter((s) => s.kind === "custom")
    .map((s) => parseCustom(s.title, s.lines))
    .filter((s): s is NonNullable<typeof s> => !!s);
  if (custom.length) result.customSections = custom;

  return result;
}

/**
 * Merges parsed fields into the current CV: a section is replaced only when
 * the parser actually found something for it, so a partial parse never wipes
 * out what's already there. Card settings, layout and photo are untouched.
 */
export function applyParsed(current: CVData, parsed: Partial<CVData>): CVData {
  const pick = <K extends keyof CVData>(k: K): CVData[K] => {
    const v = parsed[k] as CVData[K] | undefined;
    return Array.isArray(v) ? (v.length ? v : current[k]) : (v ?? current[k]);
  };
  const personal = { ...current.personal };
  for (const [k, v] of Object.entries(parsed.personal ?? {})) {
    if (v) (personal as Record<string, unknown>)[k] = v;
  }
  return {
    ...current,
    personal,
    summary: parsed.summary || current.summary,
    competencies: pick("competencies"),
    experience: pick("experience"),
    education: pick("education"),
    certifications: pick("certifications"),
    awards: pick("awards"),
    languages: pick("languages"),
    strengths: pick("strengths"),
    customSections: pick("customSections"),
  };
}

/** One-line description of what the parser found, for the editor's status message. */
export function summarizeParsed(parsed: Partial<CVData>): string {
  const bits = [
    parsed.personal?.name && "name",
    (parsed.personal?.email || parsed.personal?.phone) && "contact info",
    parsed.summary && "summary",
    parsed.experience?.length && `${parsed.experience.length} job${parsed.experience.length > 1 ? "s" : ""}`,
    parsed.education?.length && `${parsed.education.length} education entr${parsed.education.length > 1 ? "ies" : "y"}`,
    parsed.competencies?.length && "skills",
    parsed.certifications?.length && "certifications",
    parsed.awards?.length && "awards",
    parsed.languages?.length && "languages",
    parsed.customSections?.length && "extra sections",
  ].filter(Boolean);
  return bits.length ? `Filled in: ${bits.join(", ")}.` : "";
}
