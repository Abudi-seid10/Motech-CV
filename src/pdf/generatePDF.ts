import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const PAGE_MARGIN_CSS_PX = 48;
const UNSUPPORTED_COLOR_FUNCTION = /oklch\([^)]*\)|oklab\([^)]*\)/gi;
const BREAK_SELECTOR = ".pdf-section, .pdf-entry";

function removeUnsupportedColorRules(document: Document) {
  // NOTE: we deliberately do NOT remove cross-origin <link rel="stylesheet">
  // tags here. An earlier version stripped them to dodge oklch()/oklab()
  // colors html2canvas can't parse — but that also strips the Google Fonts
  // stylesheet from the cloned document, silently falling back to system
  // fonts for the capture. Break points are measured from the *live* DOM
  // (real fonts, real metrics), so a font swap in the clone makes the
  // measured break points land in the wrong place in the actual image —
  // pages get cut mid-line or with a large stray gap. The styleSheets loop
  // below already skips cross-origin sheets safely via try/catch, so
  // removing the link achieved nothing except breaking fonts.
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
      // Cross-origin stylesheet (e.g. Google Fonts) — can't read its rules,
      // and don't need to: it's @font-face declarations, not colors.
    }
  });
}

function getPageHeightCssPx(node: HTMLElement, canvas: HTMLCanvasElement) {
  const scale = canvas.width / node.getBoundingClientRect().width;
  const pageHeightPx = Math.floor((canvas.width * A4_HEIGHT_PT) / A4_WIDTH_PT);
  const pageHeightCssPx = pageHeightPx / scale;

  return { scale, pageHeightPx, pageHeightCssPx };
}

function getBreakPoints(node: HTMLElement) {
  const nodeTop = node.getBoundingClientRect().top;
  return Array.from(node.querySelectorAll<HTMLElement>(BREAK_SELECTOR))
    .map((block) => block.getBoundingClientRect().top - nodeTop)
    .filter((top) => top > 0)
    .sort((a, b) => a - b);
}

function getPageContentHeightCssPx(pageHeightCssPx: number, pageIndex: number) {
  return pageHeightCssPx - (pageIndex === 0 ? PAGE_MARGIN_CSS_PX : PAGE_MARGIN_CSS_PX * 2);
}

function getPageEnd(
  start: number,
  pageHeightCssPx: number,
  pageIndex: number,
  documentHeightCssPx: number,
  breakPoints: number[]
) {
  const contentHeightCssPx = getPageContentHeightCssPx(pageHeightCssPx, pageIndex);
  const idealEnd = Math.min(start + contentHeightCssPx, documentHeightCssPx);
  if (idealEnd >= documentHeightCssPx) return documentHeightCssPx;

  // Accepting a break too early leaves a large, inconsistent blank gap at
  // the bottom of the page — e.g. 0.55 could leave up to 45% of a page
  // empty just to avoid splitting one entry. 0.78 trades a bit more
  // (rare, minor) mid-entry splitting for pages that are actually full.
  const minBreak = start + contentHeightCssPx * 0.78;
  for (let index = breakPoints.length - 1; index >= 0; index -= 1) {
    const point = breakPoints[index];
    if (point > minBreak && point < idealEnd) {
      return point;
    }
  }

  return idealEnd;
}

function getPageBoundaries(node: HTMLElement, canvas: HTMLCanvasElement) {
  const { pageHeightCssPx } = getPageHeightCssPx(node, canvas);
  const documentHeightCssPx = node.getBoundingClientRect().height;
  const breakPoints = getBreakPoints(node);
  const boundaries: number[] = [];
  let start = 0;
  let pageIndex = 0;

  while (start < documentHeightCssPx) {
    const end = getPageEnd(start, pageHeightCssPx, pageIndex, documentHeightCssPx, breakPoints);
    if (end <= start) break;
    boundaries.push(end);
    start = end;
    pageIndex += 1;
  }

  return boundaries;
}

async function waitForPrintableLayout() {
  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready;
  }

  await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
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

  await waitForPrintableLayout();

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
  const { scale, pageHeightPx } = getPageHeightCssPx(node, canvas);
  const boundaries = getPageBoundaries(node, canvas);
  const marginPx = Math.round(PAGE_MARGIN_CSS_PX * scale);

  for (let page = 0, sourceStart = 0; page < boundaries.length; page += 1) {
    const sourceY = Math.round(sourceStart * scale);
    const sourceHeight = Math.min(
      Math.round((boundaries[page] - sourceStart) * scale),
      canvas.height - sourceY
    );
    if (sourceHeight <= 0) break;

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = pageHeightPx;
    const pageContext = pageCanvas.getContext("2d");

    if (!pageContext) {
      throw new Error("Couldn't prepare a PDF page — try again, or reload the page first.");
    }

    // A freshly created canvas is fully *transparent*, not white. Left
    // unfilled, the margin areas (and any short final page) are transparent
    // pixels embedded in the PDF's PNG image — most viewers show the page's
    // own white background through them, but not all of them do, and some
    // print pipelines/PDF-to-image converters render untouched alpha=0
    // regions as black. Filling white first makes every page's margins
    // genuinely opaque white, not "probably looks white in this viewer."
    pageContext.fillStyle = "#ffffff";
    pageContext.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

    const outputY = page === 0 ? 0 : marginPx;
    pageContext.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, outputY, canvas.width, sourceHeight);
    if (page > 0) pdf.addPage();
    pdf.addImage(pageCanvas, "PNG", 0, 0, A4_WIDTH_PT, A4_HEIGHT_PT);
    sourceStart = boundaries[page];
  }

  pdf.save(`${filename}.pdf`);
}
