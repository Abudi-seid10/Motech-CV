import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const PAGE_MARGIN_CSS_PX = 48;
const UNSUPPORTED_COLOR_FUNCTION = /oklch\([^)]*\)|oklab\([^)]*\)/gi;

function removeUnsupportedColorRules(document: Document) {
  document.querySelectorAll("link[rel='stylesheet']").forEach((link) => {
    const href = link.getAttribute("href");
    if (href && new URL(href, document.baseURI).origin !== document.location.origin) {
      link.remove();
    }
  });

  document.querySelectorAll("style").forEach((style) => {
    style.textContent = style.textContent?.replace(UNSUPPORTED_COLOR_FUNCTION, "transparent") ?? "";
  });

  document.querySelectorAll<HTMLElement>("[style]").forEach((element) => {
    element.setAttribute(
      "style",
      element.getAttribute("style")?.replace(UNSUPPORTED_COLOR_FUNCTION, "transparent") ?? ""
    );
  });

  Array.from(document.styleSheets).forEach((styleSheet) => {
    try {
      const rules = styleSheet.cssRules;
      for (let index = rules.length - 1; index >= 0; index -= 1) {
        if (rules[index].cssText.match(UNSUPPORTED_COLOR_FUNCTION)) {
          styleSheet.deleteRule(index);
        }
      }
    } catch {
      // Cross-origin stylesheets are removed above when html2canvas clones the document.
    }
  });
}

function getNextPageEnd(
  node: HTMLElement,
  start: number,
  pageHeight: number,
  pageIndex: number,
  documentHeight: number
) {
  const pageContentHeight = pageHeight - (pageIndex === 0 ? PAGE_MARGIN_CSS_PX : PAGE_MARGIN_CSS_PX * 2);
  const idealEnd = Math.min(start + pageContentHeight, documentHeight);
  const nodeTop = node.getBoundingClientRect().top;
  const blocks = Array.from(node.querySelectorAll<HTMLElement>(".pdf-section, .pdf-entry"));
  const blockToMove = blocks.find((block) => {
    const rect = block.getBoundingClientRect();
    const top = rect.top - nodeTop;
    const bottom = rect.bottom - nodeTop;
    return top > start + 1 && top < idealEnd && bottom > idealEnd && bottom - top <= pageContentHeight;
  });

  return blockToMove ? blockToMove.getBoundingClientRect().top - nodeTop : idealEnd;
}

function getPageBoundaries(node: HTMLElement, canvas: HTMLCanvasElement, pageHeightPx: number) {
  const scale = canvas.width / node.getBoundingClientRect().width;
  const pageHeight = pageHeightPx / scale;
  const documentHeight = node.getBoundingClientRect().height;
  const boundaries: number[] = [];
  let start = 0;
  let pageIndex = 0;

  while (start < documentHeight) {
    const end = getNextPageEnd(node, start, pageHeight, pageIndex, documentHeight);

    boundaries.push(end);
    if (end <= start) break;
    start = end;
    pageIndex += 1;
  }

  return boundaries;
}

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
    onclone: removeUnsupportedColorRules,
  });

  if (canvas.width === 0 || canvas.height === 0) {
    throw new Error("The printable CV rendered empty — try again, or reload the page first.");
  }

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageHeightPx = Math.floor((canvas.width * A4_HEIGHT_PT) / A4_WIDTH_PT);
  const scale = canvas.width / node.getBoundingClientRect().width;
  const boundaries = getPageBoundaries(node, canvas, pageHeightPx);

  for (let page = 0, sourceStart = 0; page < boundaries.length; page += 1) {
    const sourceY = Math.round(sourceStart * scale);
    const sourceHeight = Math.min(
      Math.round((boundaries[page] - sourceStart) * scale),
      canvas.height - sourceY
    );
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = pageHeightPx;
    const pageContext = pageCanvas.getContext("2d");

    if (!pageContext) {
      throw new Error("Couldn't prepare a PDF page — try again, or reload the page first.");
    }

    const outputY = page === 0 ? 0 : Math.round(PAGE_MARGIN_CSS_PX * scale);
    pageContext.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, outputY, canvas.width, sourceHeight);
    if (page > 0) pdf.addPage();
    pdf.addImage(pageCanvas, "PNG", 0, 0, A4_WIDTH_PT, A4_HEIGHT_PT);
    sourceStart = boundaries[page];
  }

  pdf.save(`${filename}.pdf`);
}
