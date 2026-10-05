import { ContactRow } from "./contacts";

function download(content: string, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Contact fields come from anonymous visitors, so a cell like `=HYPERLINK(...)`
 * would run as a formula when the CSV is opened in Excel/Sheets. Prefixing a
 * quote defuses it.
 */
function csvCell(value: string | null | undefined): string {
  let v = value ?? "";
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return `"${v.replace(/"/g, '""')}"`;
}

const stamp = () => new Date().toISOString().slice(0, 10);

export function exportContactsCSV(contacts: ContactRow[], slug: string) {
  const header = ["Name", "Email", "Phone", "Message", "Source", "Status", "Notes", "Received"];
  const rows = contacts.map((c) =>
    [c.name, c.email, c.phone, c.message, c.source, c.status, c.notes, c.created_at].map(csvCell).join(",")
  );
  // BOM so Excel reads the file as UTF-8.
  download("\ufeff" + [header.map(csvCell).join(","), ...rows].join("\r\n"), "text/csv;charset=utf-8", `${slug}-contacts-${stamp()}.csv`);
}

const vEscape = (v: string) =>
  v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** One vCard 3.0 file holding every contact, importable into phone/desktop address books. */
export function exportContactsVCard(contacts: ContactRow[], slug: string) {
  const cards = contacts.map((c) => {
    const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${vEscape(c.name)}`, `N:${vEscape(c.name)};;;;`];
    if (c.email) lines.push(`EMAIL;TYPE=INTERNET:${vEscape(c.email)}`);
    if (c.phone) lines.push(`TEL;TYPE=CELL:${vEscape(c.phone)}`);
    const note = [c.message, c.notes && `Notes: ${c.notes}`].filter(Boolean).join("\n");
    if (note) lines.push(`NOTE:${vEscape(note)}`);
    lines.push("END:VCARD");
    return lines.join("\r\n");
  });
  download(cards.join("\r\n"), "text/vcard;charset=utf-8", `${slug}-contacts-${stamp()}.vcf`);
}
