import { unzipSync, strFromU8 } from "fflate";
import { CVData } from "./types";
import { makeId } from "./id";

/**
 * Imports LinkedIn's own "Get a copy of your data" export (a ZIP of CSV files,
 * or the individual CSVs). LinkedIn has no public profile API and scraping
 * profiles breaks its terms, so the member exports their own data and we read
 * it locally in the browser — nothing is uploaded anywhere.
 */

export const LINKEDIN_ACCEPT = ".zip,.csv";

type Row = Record<string, string>;

/** RFC-4180-ish CSV parser (quoted fields, escaped quotes, newlines inside quotes, BOM). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

/** CSV → objects keyed by lower-cased header. Skips any "Notes:" preamble LinkedIn adds above the header. */
function toRows(text: string): Row[] {
  const all = parseCsv(text);
  if (!all.length) return [];
  // Single-column files (Skills.csv) have no preamble problem; otherwise the header is the first multi-column row.
  const multi = all.findIndex((r) => r.length > 1);
  const start = multi < 0 ? 0 : multi;
  const header = all[start].map((h) => h.trim().toLowerCase());
  return all.slice(start + 1).map((r) => {
    const o: Row = {};
    header.forEach((h, i) => (o[h] = (r[i] ?? "").trim()));
    return o;
  });
}

const get = (r: Row, ...keys: string[]) => keys.map((k) => r[k]).find(Boolean) ?? "";

const range = (start: string, end: string) => {
  if (!start && !end) return "";
  return `${start || ""} – ${end || "Present"}`.trim();
};

const bulletsOf = (text: string): string[] =>
  text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[•\-*–·]\s*/, "").trim())
    .filter(Boolean);

/** Reads each CSV out of a ZIP, or takes loose CSVs, into a lower-cased-basename → text map. */
async function collect(files: File[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const f of files) {
    if (/\.zip$/i.test(f.name)) {
      const entries = unzipSync(new Uint8Array(await f.arrayBuffer()));
      for (const [path, bytes] of Object.entries(entries)) {
        if (/\.csv$/i.test(path)) out[path.split("/").pop()!.toLowerCase()] = strFromU8(bytes);
      }
    } else if (/\.csv$/i.test(f.name)) {
      out[f.name.toLowerCase()] = await f.text();
    }
  }
  return out;
}

export async function parseLinkedInExport(files: File[]): Promise<Partial<CVData>> {
  const csv = await collect(files);
  const rows = (name: string) => (csv[name] ? toRows(csv[name]) : []);
  if (!Object.keys(csv).length) throw new Error("No CSV files found — upload the ZIP from LinkedIn's data export.");

  const parsed: Partial<CVData> = {};

  const profile = rows("profile.csv")[0];
  const email = rows("email addresses.csv").find((r) => /^yes$/i.test(r["primary"] ?? ""))?.["email address"] ?? rows("email addresses.csv")[0]?.["email address"];
  const phone = rows("phonenumbers.csv")[0]?.["number"];
  const websites = profile?.["websites"] ?? "";
  const github = websites.match(/github\.com\/[^\]\s,]+/i)?.[0];
  parsed.personal = {
    name: profile ? `${get(profile, "first name")} ${get(profile, "last name")}`.trim() : "",
    title: profile ? get(profile, "headline") : "",
    location: profile ? get(profile, "geo location", "address") : "",
    phone: phone ?? "",
    email: email ?? "",
    linkedin: "",
    github: github ?? "",
  };
  if (profile?.["summary"]) parsed.summary = profile["summary"];

  const positions = rows("positions.csv");
  if (positions.length)
    parsed.experience = positions.map((r) => ({
      company: get(r, "company name"),
      role: get(r, "title"),
      dates: range(get(r, "started on"), get(r, "finished on")),
      location: get(r, "location"),
      bullets: bulletsOf(get(r, "description")),
    }));

  const education = rows("education.csv");
  if (education.length)
    parsed.education = education.map((r) => ({
      school: get(r, "school name"),
      degree: get(r, "degree name"),
      dates: range(get(r, "start date"), get(r, "end date")),
      details: get(r, "notes", "activities") || undefined,
    }));

  const skills = rows("skills.csv").map((r) => get(r, "name")).filter(Boolean);
  if (skills.length) parsed.competencies = [{ category: "Skills", items: skills }];

  const certs = rows("certifications.csv");
  if (certs.length)
    parsed.certifications = certs.map((r) => ({
      name: get(r, "name"),
      issuer: get(r, "authority"),
      year: (get(r, "started on").match(/\d{4}/) ?? [""])[0],
    }));

  const honors = rows("honors.csv");
  if (honors.length)
    parsed.awards = honors.map((r) => ({
      name: get(r, "title"),
      issuer: "",
      year: (get(r, "issued on").match(/\d{4}/) ?? [""])[0],
      project: get(r, "description") || undefined,
    }));

  const langs = rows("languages.csv");
  if (langs.length) parsed.languages = langs.map((r) => ({ name: get(r, "name"), level: get(r, "proficiency") }));

  const projects = rows("projects.csv");
  if (projects.length)
    parsed.customSections = [
      {
        id: makeId(),
        title: "Projects",
        entries: projects.map((r) => ({
          heading: get(r, "title"),
          meta: range(get(r, "started on"), get(r, "finished on")) || undefined,
          body: get(r, "description") || undefined,
        })),
      },
    ];

  return parsed;
}
