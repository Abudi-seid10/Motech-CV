import { CVData } from "./types";
import { makeId } from "./id";

export type AIProvider = "gemini" | "openai" | "ollama" | "openrouter";

export const AI_PROVIDERS: { id: AIProvider; label: string }[] = [
  { id: "gemini", label: "Google Gemini" },
  { id: "openai", label: "OpenAI / ChatGPT" },
  { id: "ollama", label: "Ollama (local)" },
  { id: "openrouter", label: "OpenRouter (open-source)" },
];

export const DEFAULT_AI_PROVIDER: AIProvider = "gemini";

interface ParseWithAIInput {
  provider: AIProvider;
  text: string;
  current: CVData;
}

const SYSTEM_PROMPT = `You are a resume/CV parser. Given raw text extracted from someone's CV or resume, output ONLY a single JSON object with this exact shape — no markdown code fences, no commentary before or after:

{
  "personal": { "name": "", "title": "", "location": "", "phone": "", "email": "", "linkedin": "", "github": "" },
  "summary": "",
  "competencies": [{ "category": "", "items": [""] }],
  "experience": [{ "company": "", "role": "", "dates": "", "location": "", "bullets": [""] }],
  "education": [{ "school": "", "degree": "", "dates": "", "details": "" }],
  "certifications": [{ "name": "", "issuer": "", "year": "" }],
  "awards": [{ "name": "", "issuer": "", "year": "", "project": "" }],
  "languages": [{ "name": "", "level": "" }],
  "strengths": [""],
  "customSections": [{ "title": "", "entries": [{ "heading": "", "subheading": "", "meta": "", "body": "", "bullets": [""] }] }]
}

Rules:
- Only use information present in the provided text. Never invent, embellish, guess, or infer facts, dates, numbers, or employers that are not stated in the text.
- If a field isn't present in the text, use an empty string "" or an empty array [] — never null, never omit the key.
- "customSections" is for anything in the text that doesn't fit the other fields — Projects, Publications, Volunteer work, Recommendations, etc. Only include it if the source text actually has such content.
- Output raw JSON only. No markdown fences, no explanation.`;

function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function asStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function asArr<T>(v: unknown): T[] {
  return Array.isArray(v) ? v : [];
}

/** Defensively coerces whatever JSON the model returned into a well-shaped Partial<CVData>. */
function sanitizeParsed(raw: unknown): Partial<CVData> {
  const p = (raw ?? {}) as Record<string, any>;
  const personal = p.personal ?? {};

  return {
    personal: {
      name: asStr(personal.name),
      title: asStr(personal.title),
      location: asStr(personal.location),
      phone: asStr(personal.phone),
      email: asStr(personal.email),
      linkedin: asStr(personal.linkedin),
      github: asStr(personal.github),
    },
    summary: asStr(p.summary),
    competencies: asArr<any>(p.competencies).map((c) => ({
      category: asStr(c?.category),
      items: asArr<string>(c?.items).filter((s) => typeof s === "string"),
    })),
    experience: asArr<any>(p.experience).map((e) => ({
      company: asStr(e?.company),
      role: asStr(e?.role),
      dates: asStr(e?.dates),
      location: asStr(e?.location),
      bullets: asArr<string>(e?.bullets).filter((s) => typeof s === "string"),
    })),
    education: asArr<any>(p.education).map((e) => ({
      school: asStr(e?.school),
      degree: asStr(e?.degree),
      dates: asStr(e?.dates),
      details: asStr(e?.details),
    })),
    certifications: asArr<any>(p.certifications).map((c) => ({
      name: asStr(c?.name),
      issuer: asStr(c?.issuer),
      year: asStr(c?.year),
    })),
    awards: asArr<any>(p.awards).map((a) => ({
      name: asStr(a?.name),
      issuer: asStr(a?.issuer),
      year: asStr(a?.year),
      project: asStr(a?.project),
    })),
    languages: asArr<any>(p.languages).map((l) => ({
      name: asStr(l?.name),
      level: asStr(l?.level),
    })),
    strengths: asArr<string>(p.strengths).filter((s) => typeof s === "string"),
    customSections: asArr<any>(p.customSections)
      .map((s) => ({
        id: makeId(),
        title: asStr(s?.title),
        entries: asArr<any>(s?.entries).map((e) => ({
          heading: asStr(e?.heading),
          subheading: asStr(e?.subheading),
          meta: asStr(e?.meta),
          body: asStr(e?.body),
          bullets: asArr<string>(e?.bullets).filter((b) => typeof b === "string"),
        })),
      }))
      .filter((s) => s.title && s.entries.length > 0),
  };
}

/** Merges parsed fields into the current CV, replacing an array only when the model returned something for it. Card settings are never touched. */
function mergeParsed(current: CVData, parsed: Partial<CVData>): CVData {
  return {
    ...current,
    personal: { ...current.personal, ...(parsed.personal ?? {}) },
    summary: parsed.summary || current.summary,
    competencies: parsed.competencies?.length ? parsed.competencies : current.competencies,
    experience: parsed.experience?.length ? parsed.experience : current.experience,
    education: parsed.education?.length ? parsed.education : current.education,
    certifications: parsed.certifications?.length ? parsed.certifications : current.certifications,
    awards: parsed.awards?.length ? parsed.awards : current.awards,
    languages: parsed.languages?.length ? parsed.languages : current.languages,
    strengths: parsed.strengths?.length ? parsed.strengths : current.strengths,
    customSections: parsed.customSections?.length ? parsed.customSections : current.customSections,
    card: current.card, // never overwritten by the AI parse
  };
}

async function callGemini(text: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY — add it to your .env file, or pick a different provider.");
  }
  const model = "gemini-2.0-flash";
  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\nCV TEXT:\n${text}` }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
        }),
      }
    );
  } catch {
    throw new Error("Couldn't reach Gemini's API — check your internet connection and try again.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(`Gemini API error (${res.status}): ${body?.error?.message || res.statusText}`);
  }
  const json = await res.json();
  const output = (json.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? "").join("");
  if (!output) throw new Error("Gemini returned an empty response — try again.");
  return output;
}

async function callOpenAI(text: string): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VITE_OPENAI_API_KEY — add it to your .env file, or pick a different provider.");
  }
  const model = import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini";
  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `CV TEXT:\n${text}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });
  } catch {
    throw new Error("Couldn't reach OpenAI's API — check your internet connection and try again.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(`OpenAI API error (${res.status}): ${body?.error?.message || res.statusText}`);
  }
  const json = await res.json();
  const output = json.choices?.[0]?.message?.content ?? "";
  if (!output) throw new Error("OpenAI returned an empty response — try again.");
  return output;
}

async function callOllama(text: string): Promise<string> {
  const baseUrl = (import.meta.env.VITE_OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/$/, "");
  const model = import.meta.env.VITE_OLLAMA_MODEL || "llama3.2";
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `CV TEXT:\n${text}` },
        ],
        format: "json",
        stream: false,
      }),
    });
  } catch {
    throw new Error(
      `Couldn't reach Ollama at ${baseUrl}. Is "ollama serve" running, and did you set OLLAMA_ORIGINS to allow this site? See README → Ollama setup.`
    );
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Ollama error (${res.status}): ${body || res.statusText}`);
  }
  const json = await res.json();
  const output = json.message?.content ?? "";
  if (!output) throw new Error("Ollama returned an empty response — try again, or try a larger model.");
  return output;
}

async function callOpenRouter(text: string): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VITE_OPENROUTER_API_KEY — add it to your .env file, or pick a different provider.");
  }
  const model = import.meta.env.VITE_OPENROUTER_MODEL || "openai/gpt-oss-20b:free";
  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://localhost",
        "X-Title": "CV Builder",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `CV TEXT:\n${text}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });
  } catch {
    throw new Error("Couldn't reach OpenRouter's API — check your internet connection and try again.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(`OpenRouter error (${res.status}): ${body?.error?.message || res.statusText}`);
  }
  const json = await res.json();
  const output = json.choices?.[0]?.message?.content ?? "";
  if (!output) throw new Error("OpenRouter returned an empty response — try a different model.");
  return output;
}

/**
 * Sends extracted CV text to the selected provider and returns the current
 * CVData with every structured field replaced by what the model found.
 * `card` settings are always preserved untouched. Throws a provider-specific,
 * user-facing error message on any failure (missing key, network, bad JSON).
 */
export async function parseResumeWithAI({ provider, text, current }: ParseWithAIInput): Promise<CVData> {
  let raw: string;
  switch (provider) {
    case "gemini":
      raw = await callGemini(text);
      break;
    case "openai":
      raw = await callOpenAI(text);
      break;
    case "ollama":
      raw = await callOllama(text);
      break;
    case "openrouter":
      raw = await callOpenRouter(text);
      break;
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }

  const cleaned = stripJsonFences(raw);
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(cleaned);
  } catch {
    throw new Error("The AI's response wasn't valid JSON — try again, or try a different provider.");
  }

  return mergeParsed(current, sanitizeParsed(parsedJson));
}
