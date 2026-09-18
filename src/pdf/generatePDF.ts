import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const PAGE_MARGIN_CSS_PX = 48;
const UNSUPPORTED_COLOR_FUNCTION = /oklch\([^)]*\)|oklab\([^)]*\)/gi;
const BREAK_SELECTOR = ".pdf-section, .pdf-entry";

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

  const minBreak = start + contentHeightCssPx * 0.55;
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

    const outputY = page === 0 ? 0 : marginPx;
    pageContext.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, outputY, canvas.width, sourceHeight);
    if (page > 0) pdf.addPage();
    pdf.addImage(pageCanvas, "PNG", 0, 0, A4_WIDTH_PT, A4_HEIGHT_PT);
    sourceStart = boundaries[page];
  }

  pdf.save(`${filename}.pdf`);
}
