import { readFile } from "node:fs/promises";
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import {
  GroundError,
  reportSnapshotSchema,
  type ReportSnapshot,
} from "@ground/contracts";
function baseOrigin(value: string) {
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new GroundError("VALIDATION_ERROR", "Invalid report origin");
  return url.origin;
}
export function reportBlocks(input: ReportSnapshot, origin: string) {
  const report = reportSnapshotSchema.parse(input);
  const base = baseOrigin(origin);
  const generated = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Bogota",
    dateStyle: "medium",
    timeStyle: "short",
    hourCycle: "h23",
  }).format(new Date(report.generated_at));
  return [
    {
      title: "Ground site report",
      text: `Date: ${report.date}\nProject version: ${report.version}\nGenerated: ${generated} (Bogotá)\nReport ID: ${report.id}`,
    },
    ...report.sections,
    {
      title: "Evidence references",
      text: report.evidence_ids.length
        ? report.evidence_ids
            .map((id) => `${base}/projects/${report.project_id}/evidence/${id}`)
            .join("\n")
        : "No source evidence is linked to this snapshot.",
    },
    {
      title: "Source and request references",
      text: `Sources: ${report.source_ids.join(", ") || "None"}\nRequests: ${report.request_ids.join(", ") || "None"}`,
    },
  ];
}
const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ] ?? character,
  );
export function renderReportHtml(report: ReportSnapshot, origin: string) {
  const blocks = reportBlocks(report, origin);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ground report ${escapeHtml(report.date)} v${report.version}</title><style>body{font:16px/1.6 system-ui,sans-serif;color:#17211b;background:#f4f5f1;margin:0;padding:32px}main{max-width:850px;margin:auto;background:white;padding:48px;border:1px solid #d5dcd4;border-radius:12px}h1{font-size:30px;color:#245c3b}h2{font-size:20px;margin:32px 0 12px}p{white-space:pre-wrap;overflow-wrap:anywhere}a{color:#245c3b}@media(max-width:600px){body{padding:12px}main{padding:24px}}@media print{body{padding:0;background:white}main{border:0;padding:0}}</style></head><body><main>${blocks.map((block, index) => `<section><${index === 0 ? "h1" : "h2"}>${escapeHtml(block.title)}</${index === 0 ? "h1" : "h2"}><p>${escapeHtml(block.text)}</p></section>`).join("")}<p><a href="/api/projects/${report.project_id}/reports/${report.date}.pdf?version=${report.version}">Download this exact PDF version</a></p></main></body></html>`;
}
function wrap(
  text: string,
  font: PDFFont,
  size: number,
  width: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        line = candidate;
        continue;
      }
      if (line) {
        lines.push(line);
        line = "";
      }
      if (font.widthOfTextAtSize(word, size) <= width) {
        line = word;
        continue;
      }
      for (const character of word) {
        if (font.widthOfTextAtSize(line + character, size) > width) {
          lines.push(line);
          line = "";
        }
        line += character;
      }
    }
    lines.push(line);
  }
  return lines;
}
export async function renderReportPdf(
  report: ReportSnapshot,
  origin: string,
): Promise<Uint8Array> {
  const blocks = reportBlocks(report, origin);
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(
    await readFile(
      new URL("./fonts/LiberationSans-Regular.ttf", import.meta.url),
    ),
    { subset: true },
  );
  const supported = new Set(font.getCharacterSet());
  for (const block of blocks)
    for (const character of block.title + block.text)
      if (
        character !== "\n" &&
        character !== "\r" &&
        character !== "\t" &&
        !supported.has(character.codePointAt(0) ?? 0)
      )
        throw new GroundError(
          "NOT_READY",
          "This report contains characters unsupported by the PDF font. Use the HTML report; source text has not been changed.",
        );
  pdf.setTitle(`Ground report ${report.date} v${report.version}`);
  pdf.setSubject(`Report ${report.id}`);
  pdf.setCreator("Ground");
  pdf.setCreationDate(new Date(report.generated_at));
  const margin = 48,
    width = 595.28,
    height = 841.89;
  let page = pdf.addPage([width, height]);
  let y = height - margin;
  const nextPage = () => {
    page = pdf.addPage([width, height]);
    y = height - margin;
  };
  blocks.forEach((block, index) => {
    const size = index === 0 ? 24 : 15;
    const titleLines = wrap(block.title, font, size, width - 2 * margin);
    if (y < margin + 80) nextPage();
    for (const title of titleLines) {
      page.drawText(title, {
        x: margin,
        y: y - size,
        size,
        font,
        color: rgb(0.14, 0.36, 0.23),
      });
      y -= size + 5;
    }
    y -= 8;
    for (const line of wrap(block.text, font, 11, width - 2 * margin)) {
      if (y < margin + 38) nextPage();
      page.drawText(line, {
        x: margin,
        y: y - 11,
        size: 11,
        font,
        color: rgb(0.09, 0.13, 0.11),
      });
      y -= 16;
    }
    y -= 24;
  });
  const pages = pdf.getPages();
  pages.forEach((item, index) => {
    item.drawLine({
      start: { x: margin, y: 38 },
      end: { x: width - margin, y: 38 },
      thickness: 0.5,
      color: rgb(0.83, 0.86, 0.83),
    });
    item.drawText(
      `Ground · ${report.date} · Version ${report.version} · Page ${index + 1} / ${pages.length}`,
      { x: margin, y: 23, size: 9, font, color: rgb(0.32, 0.38, 0.34) },
    );
  });
  return pdf.save();
}
