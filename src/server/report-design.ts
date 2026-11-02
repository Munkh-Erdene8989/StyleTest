import { readFileSync } from "node:fs";
import path from "node:path";

type DesignFile = {
  colors: { ink: string; muted: string; rule: string; background: string; accent_change: string; accent_base: string };
  fonts: {
    title: string;
    callout_title: { size: number; line_height: number };
    callout_text: { size: number; line_height: number };
    thumbnail_label: { size: number };
  };
  header: {
    logo: { height: number; x: number; bottom: number };
    title: { gap_after_logo: number };
    rule: { y: number };
  };
  photo: { size: number; top: number; center_x: number; source_px: number };
  thumbnail: { label: string; size: number; x: number; bottom_offset_from_photo: number; border: { width: number } };
  callouts: {
    zoom_circle: { diameter: number; center_x: { L: number; R: number }; ring_width: number };
    leader_line: { width: number; end_dot_radius: number };
    caption: { gap_from_circle: number; max_width: number };
    vertical_placement: { slot: number };
  };
};

const FILE = path.join(process.cwd(), "Open Ai өгөх", "naruka_report_design.json");

let cached: DesignFile | null = null;

export function reportDesign() {
  if (cached) return cached;
  const raw = JSON.parse(readFileSync(FILE, "utf8")) as DesignFile & { pages?: unknown };
  const colors = raw.colors;
  if (!colors?.ink || !colors.accent_base || !colors.accent_change || !colors.background) throw new Error("report_design_incomplete");
  if (!raw.photo?.size || !raw.header?.logo?.height || !raw.callouts?.zoom_circle?.diameter) throw new Error("report_design_incomplete");
  const { zoom_circle, leader_line, caption, vertical_placement } = raw.callouts;
  cached = {
    colors,
    fonts: {
      title: raw.fonts.title,
      callout_title: raw.fonts.callout_title,
      callout_text: raw.fonts.callout_text,
      thumbnail_label: raw.fonts.thumbnail_label,
    },
    header: raw.header,
    photo: raw.photo,
    thumbnail: raw.thumbnail,
    callouts: {
      zoom_circle,
      leader_line,
      caption: { gap_from_circle: caption.gap_from_circle, max_width: caption.max_width },
      vertical_placement,
    },
  };
  return cached;
}

export function ptToMm(pt: number) {
  return (pt * 25.4) / 72;
}

function mm(pt: number) {
  return `${ptToMm(pt).toFixed(2)}mm`;
}

function titleSize(design: DesignFile) {
  const match = String(design.fonts.title).match(/(\d+(?:\.\d+)?)pt/);
  return match ? Number(match[1]) : 16;
}

export function reportCss() {
  const design = reportDesign();
  const { colors, header, photo, thumbnail, callouts, fonts } = design;
  const photoLeft = photo.center_x - photo.size / 2;
  const photoBottom = photo.top + photo.size;
  const logoTop = header.logo.bottom - header.logo.height;
  const thumbTop = photoBottom - thumbnail.bottom_offset_from_photo - thumbnail.size;
  const zoom = callouts.zoom_circle.diameter;
  return `@page { size: A4 landscape; margin: 0; }
html, body { margin: 0; padding: 0; background: ${colors.background}; color: ${colors.ink}; }
.report-page { width: 297mm; height: 210mm; box-sizing: border-box; break-after: page; break-inside: avoid; page-break-inside: avoid; position: relative; overflow: hidden; background: ${colors.background}; }
.frame-change { --accent: ${colors.accent_change}; }
.frame-base { --accent: ${colors.accent_base}; }
.report-page:last-child { break-after: auto; }
.mast { position: absolute; left: ${mm(header.logo.x)}; right: 14mm; top: ${mm(logoTop)}; height: ${mm(header.logo.height)}; display: flex; align-items: flex-end; gap: ${mm(header.title.gap_after_logo)}; }
.mast::after { content: ""; position: absolute; left: 0; right: 0; top: ${mm(header.rule.y - logoTop)}; border-top: 0.6pt solid ${colors.rule}; }
.logo { height: ${mm(header.logo.height)}; width: auto; }
h1 { margin: 0 0 1.2mm; font: 600 ${titleSize(design)}pt/1.15 "Noto Serif", serif; color: ${colors.ink}; }
.hero { position: absolute; left: ${mm(photoLeft)}; top: ${mm(photo.top)}; width: ${mm(photo.size)}; height: ${mm(photo.size)}; margin: 0; }
.hero img { width: ${mm(photo.size)}; height: ${mm(photo.size)}; object-fit: contain; object-position: center; background: ${colors.background}; }
.thumb { position: absolute; left: ${mm(thumbnail.x)}; top: ${mm(thumbTop)}; width: ${mm(thumbnail.size)}; margin: 0; }
.thumb img { width: ${mm(thumbnail.size)}; height: ${mm(thumbnail.size)}; object-fit: cover; border: ${thumbnail.border.width}pt solid ${colors.rule}; background: ${colors.background}; }
.thumb figcaption { margin-top: 0.8mm; text-align: center; font: 400 ${fonts.thumbnail_label.size}pt/1.2 Inter, "Noto Sans", sans-serif; color: ${colors.muted}; }
.callout { position: absolute; width: ${mm(zoom)}; height: ${mm(zoom)}; }
.zoom { width: ${mm(zoom)}; height: ${mm(zoom)}; border-radius: 50%; border: ${callouts.zoom_circle.ring_width}pt solid var(--accent); background-repeat: no-repeat; background-color: ${colors.background}; box-sizing: border-box; }
.cap { position: absolute; top: 50%; width: ${mm(callouts.caption.max_width)}; margin: 0; transform: translateY(-50%); }
.L .cap { right: calc(100% + ${mm(callouts.caption.gap_from_circle)}); text-align: right; }
.R .cap { left: calc(100% + ${mm(callouts.caption.gap_from_circle)}); text-align: left; }
.cap strong { display: block; font: 600 ${fonts.callout_title.size}pt/${fonts.callout_title.line_height}pt Inter, "Noto Sans", sans-serif; color: ${colors.ink}; }
.cap span { display: block; font: 400 ${fonts.callout_text.size}pt/${fonts.callout_text.line_height}pt Inter, "Noto Sans", sans-serif; color: ${colors.muted}; }
.leader { position: absolute; top: 50%; height: 0; border-top: ${callouts.leader_line.width}pt solid var(--accent); }
.L .leader { left: 100%; width: 6mm; }
.R .leader { right: 100%; width: 6mm; }
.leader::after { content: ""; position: absolute; top: -${callouts.leader_line.end_dot_radius}pt; width: ${callouts.leader_line.end_dot_radius * 2}pt; height: ${callouts.leader_line.end_dot_radius * 2}pt; border-radius: 50%; background: var(--accent); }
.L .leader::after { right: -1.6pt; }
.R .leader::after { left: -1.6pt; }
.notice { position: absolute; left: ${mm(photoLeft)}; width: ${mm(photo.size)}; top: ${mm(photoBottom + 4)}; margin: 0; text-align: center; font: 8pt/1.3 "Noto Sans", sans-serif; color: ${colors.muted}; }
.lead { position: absolute; left: 70mm; width: 157mm; top: ${mm(photoBottom + 16)}; margin: 0; text-align: center; font: 600 12pt/1.35 "Noto Serif", serif; color: ${colors.ink}; }
.step { position: absolute; left: 70mm; width: 157mm; top: ${mm(photoBottom + 58)}; margin: 0; text-align: center; font: 600 9pt/1.3 Inter, "Noto Sans", sans-serif; color: var(--accent); }
footer { position: absolute; left: ${mm(header.logo.x)}; right: 14mm; bottom: 4mm; display: flex; justify-content: space-between; border-top: 0.2mm solid ${colors.rule}; padding-top: 1.2mm; font: 8pt "Noto Sans", sans-serif; color: ${colors.muted}; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }`;
}

export function calloutAnchor(side: "L" | "R") {
  const design = reportDesign();
  const radius = ptToMm(design.callouts.zoom_circle.diameter) / 2;
  const center = ptToMm(design.callouts.zoom_circle.center_x[side]);
  return { radius, left: center - radius };
}

export function stackCalloutYs(cys: number[]) {
  const design = reportDesign();
  const photoTop = ptToMm(design.photo.top);
  const photoSize = ptToMm(design.photo.size);
  const radius = ptToMm(design.callouts.zoom_circle.diameter) / 2;
  const gap = ptToMm(design.callouts.vertical_placement.slot);
  const min = photoTop + radius;
  const max = photoTop + photoSize - radius;
  const ys = cys.map((cy) => photoTop + (cy / design.photo.source_px) * photoSize);
  for (let index = 1; index < ys.length; index += 1) ys[index] = Math.max(ys[index], ys[index - 1] + gap);
  for (let index = ys.length - 1; index >= 0; index -= 1) ys[index] = Math.min(ys[index], max - (ys.length - 1 - index) * gap);
  return ys.map((y) => Math.max(min, y));
}
