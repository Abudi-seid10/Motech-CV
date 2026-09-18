import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;

/**
 * Captures the off-screen #pdf-export-root node (rendered by PrintLayout)
 * and paginates it into a real, downloadable A4 PDF.
 * Throws on failure — callers (DownloadButton) surface the message to the user.
 */
export async function generatePDF(filename = "cv") {
  const node = document.getElementById("pdf-export-root");
  if (!node) {
    throw new Error(
      "Couldn't find the printable CV on this page (#pdf-export-root is missing) — try refreshing and downloading again."
    );
  }

  // Custom web fonts (Bebas Neue, Fraunces, Syne, DM Sans, DM Mono) may still
  // be loading when the button is clicked right after page load — without
  // this, html2canvas can snapshot the page using fallback system fonts.
  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready;
  }
  // Let the browser finish one layout/paint pass after the font swap settles.
  await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    windowWidth: node.scrollWidth,
  });

  if (canvas.width === 0 || canvas.height === 0) {
    throw new Error("The printable CV rendered empty — try again, or reload the page first.");
  }

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageHeightPx = Math.floor((canvas.width * A4_HEIGHT_PT) / A4_WIDTH_PT);
  const pageCount = Math.ceil(canvas.height / pageHeightPx);

  for (let page = 0; page < pageCount; page += 1) {
    const sourceY = page * pageHeightPx;
    const sourceHeight = Math.min(pageHeightPx, canvas.height - sourceY);
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sourceHeight;
    const pageContext = pageCanvas.getContext("2d");

    if (!pageContext) {
      throw new Error("Couldn't prepare a PDF page — try again, or reload the page first.");
    }

    pageContext.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
    if (page > 0) pdf.addPage();
    pdf.addImage(pageCanvas, "PNG", 0, 0, A4_WIDTH_PT, (sourceHeight * A4_WIDTH_PT) / canvas.width);
  }

  pdf.save(`${filename}.pdf`);
}
