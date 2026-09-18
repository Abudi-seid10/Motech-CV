import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";
import { CVData } from "./types";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

async function extractPdfText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => ("str" in item ? item.str : "")).join(" ") + "\n";
  }
  return text;
}

async function extractDocxText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return result.value;
}

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return extractPdfText(file);
  if (ext === "docx") return extractDocxText(file);
  throw new Error("Please upload a PDF or Word (.docx) file.");
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;
const LINKEDIN_RE = /linkedin\.com\/in\/[a-zA-Z0-9-_]+/i;
const GITHUB_RE = /github\.com\/[a-zA-Z0-9-_]+/i;

/**
 * Best-effort only: pulls contact details out with regex and puts the rest
 * of the raw text into `summary` so the person can copy pieces into the
 * right sections themselves. Does NOT attempt to split the text into
 * structured experience/education entries — that needs real parsing
 * (an LLM or a paid resume-parsing API), which this template doesn't wire
 * up by default. See README "Resume upload" section.
 */
export function parseResumeText(text: string): Partial<CVData> {
  const cleaned = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
  const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);

  const email = cleaned.match(EMAIL_RE)?.[0] ?? "";
  const phone = cleaned.match(PHONE_RE)?.[0]?.trim() ?? "";
  const linkedin = cleaned.match(LINKEDIN_RE)?.[0] ?? "";
  const github = cleaned.match(GITHUB_RE)?.[0] ?? "";
  // Heuristic: the first line of a resume is very often the person's name.
  const name = (lines[0] ?? "").slice(0, 80);

  return {
    personal: { name, title: "", location: "", phone, email, linkedin, github },
    summary: cleaned,
  };
}
