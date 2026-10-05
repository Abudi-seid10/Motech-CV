import { CVData } from "./types";

function escapeVCardText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Builds a vCard 3.0 payload (widely supported by iOS/Android/desktop contact apps) from a CV's personal info. */
export function generateVCard(data: CVData): string {
  const { personal, card } = data;
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];

  if (personal.name) lines.push(`FN:${escapeVCardText(personal.name)}`);
  if (personal.name) lines.push(`N:${escapeVCardText(personal.name)};;;;`);
  if (personal.title) lines.push(`TITLE:${escapeVCardText(card?.tagline || personal.title)}`);
  if (personal.email) lines.push(`EMAIL;TYPE=INTERNET:${personal.email}`);
  if (personal.phone) lines.push(`TEL;TYPE=CELL:${personal.phone}`);
  if (personal.location) lines.push(`ADR;TYPE=WORK:;;${escapeVCardText(personal.location)};;;;`);
  if (personal.linkedin) lines.push(`URL;TYPE=LinkedIn:https://${personal.linkedin.replace(/^https?:\/\//, "")}`);
  if (personal.github) lines.push(`URL;TYPE=GitHub:https://${personal.github.replace(/^https?:\/\//, "")}`);
  (card?.links ?? []).forEach((l) => {
    if (l.url) lines.push(`URL;TYPE=${escapeVCardText(l.label || "Link")}:${l.url}`);
  });

  lines.push("END:VCARD");
  return lines.join("\r\n");
}

export function downloadVCard(data: CVData, filename = "contact") {
  const vcard = generateVCard(data);
  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.vcf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
