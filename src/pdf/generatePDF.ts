import { createElement } from "react";
import { CVData } from "@/lib/types";

/**
 * Builds a real, text-based A4 PDF straight from CVData (no DOM capture,
 * no screenshot) and downloads it. @react-pdf/renderer is dynamically
 * imported here — it's a large library, and loading it eagerly would add
 * its full weight to every page's initial load for a feature most visits
 * never touch. Throws on failure; callers (DownloadButton) surface the
 * message to the user.
 */
export async function generatePDF(data: CVData, filename = "cv") {
  if (!data?.personal) {
    throw new Error("No CV data to export yet.");
  }

  // `react` itself is always already loaded by the app, so only the two
  // actually-heavy pieces (the renderer and the document definition) need
  // to be dynamic imports here.
  const [{ pdf }, { default: ResumeDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./ResumeDocument"),
  ]);

  let blob: Blob;
  try {
    // @react-pdf/renderer's types want a ReactElement<DocumentProps>
    // specifically (i.e. literally a <Document>), not a component that
    // renders one — a well-known type-defs mismatch in this library. The
    // runtime behavior is correct; the cast just satisfies the compiler.
    blob = await pdf(createElement(ResumeDocument, { data }) as Parameters<typeof pdf>[0]).toBlob();
  } catch (err) {
    throw new Error(`Couldn't generate the PDF: ${(err as Error).message}`);
  }

  if (!blob || blob.size === 0) {
    throw new Error("The generated PDF came back empty — try again.");
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
