import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { jewelryStill, lineFace, outfit, portrait, silhouette } from "@/content/larson/art";
import { larsonSheet } from "@/content/larson/catalog";
import { imageFormatOk } from "@/domain/images";
import { tapBodyLabel, type CropBox, type LarsonReading, type LarsonType, type TapBodyShape } from "@/domain/tap";
import { REPORT_LOGO, printHtmlToPdf } from "./face-report-pdf";
import { createLarsonArt, type LarsonGenerated } from "./larson-images";

const ACCENT: Record<LarsonType, string> = {
  Dramatic: "#28282B",
  Natural: "#4E6048",
  Gamine: "#B74372",
  Romantic: "#963D57",
};

const TRAITS = [
  ["face", "Нүүр"],
  ["brows", "Хөмсөг"],
  ["eyes", "Нүд"],
  ["nose", "Хамар"],
  ["lips", "Уруул"],
  ["chin", "Эрүү"],
] as const;

const FACE_FALLBACK: LarsonReading["crops"] = {
  brows: { x: 0.22, y: 0.18, w: 0.56, h: 0.1 },
  eyes: { x: 0.22, y: 0.29, w: 0.56, h: 0.09 },
  nose: { x: 0.36, y: 0.38, w: 0.28, h: 0.12 },
  lips: { x: 0.34, y: 0.51, w: 0.32, h: 0.08 },
  chin: { x: 0.3, y: 0.6, w: 0.4, h: 0.1 },
};

export function faceCrops(crops: LarsonReading["crops"]): LarsonReading["crops"] {
  const order = [crops.brows, crops.eyes, crops.nose, crops.lips, crops.chin];
  const stacked = order.every((box, index) => index === 0 || box.y >= order[index - 1].y + order[index - 1].h * 0.35);
  const usable = order.every((box) => box.w >= 0.18 && box.w <= 0.62 && box.h >= 0.05 && box.h <= 0.16 && box.x >= 0.1 && box.x + box.w <= 0.9);
  return stacked && usable ? crops : FACE_FALLBACK;
}

export async function renderTapPdf(photo: Buffer, reading: LarsonReading, bodyShape?: TapBodyShape) {
  const art = await createLarsonArt(photo, reading, bodyShape);
  const html = await renderLarsonHtml(photo, reading, bodyShape, art);
  const pdf = await printHtmlToPdf(html);
  return assertTapPdf(pdf);
}

export async function renderLarsonHtml(photo: Buffer, reading: LarsonReading, bodyShape?: TapBodyShape, art?: LarsonGenerated) {
  const sheet = larsonSheet(reading.type);
  const face = dataUrl(photo);
  const placed = faceCrops(reading.crops);
  const crops = {
    face,
    brows: dataUrl(await cropJpeg(photo, placed.brows)),
    eyes: dataUrl(await cropJpeg(photo, placed.eyes)),
    nose: dataUrl(await cropJpeg(photo, placed.nose)),
    lips: dataUrl(await cropJpeg(photo, placed.lips)),
    chin: dataUrl(await cropJpeg(photo, placed.chin)),
  };
  const traitItems = TRAITS.map(([key]) => `<li>${esc(reading.traits[key])}</li>`).join("");
  const cropItems = TRAITS.map(([key, label]) => `<figure><img src="${crops[key]}" alt=""/><figcaption>${esc(label)}</figcaption><small>${esc(reading.traits[key])}</small></figure>`).join("");
  const sketch = picture(art?.sketch, lineFace(reading.type));
  const shapeName = bodyShape ? tapBodyLabel(bodyShape) : "Сонгоогүй";
  const refs = sheet.references.map((label, index) => shot(art?.portraits[index], portrait(sheet.type, index), label)).join("");
  const lines = sheet.lines.map((label) => `<figure>${silhouette(label, bodyShape, sheet.type)}<figcaption>${esc(label)}</figcaption></figure>`).join("");
  const materials = sheet.materials.map((item, index) => {
    const bytes = art?.materials?.[index];
    const swatch = bytes && (imageFormatOk(bytes, "image/jpeg") || imageFormatOk(bytes, "image/png"))
      ? `<img class="cloth" src="${dataUrl(bytes)}" alt=""/>`
      : `<i style="background:radial-gradient(circle at 32% 30%, #ffffff99, ${esc(item.hex)} 58%)"></i>`;
    return `<figure>${swatch}<figcaption>${esc(item.name)}</figcaption></figure>`;
  }).join("");
  const colors = sheet.colors.map((item) => `<figure><i style="background:${esc(item.hex)}"></i><figcaption>${esc(item.name)}</figcaption></figure>`).join("");
  const looks = sheet.outfits.map((label, index) => shot(art?.outfits[index], outfit(sheet.type, index), label)).join("");
  const bodyView = viewOf(art?.outfits[0], outfit(sheet.type, 0));
  const bodyCaption = bodyView.generated ? `<figcaption>Ерөнхий дүрслэл — таны биеийн хэмжилт биш</figcaption>` : "";
  const hairShots = [0, 1, 2, 3].map((index) => shot(art?.hair?.[index], portrait(sheet.type, index % 3), "")).join("");
  const makeupLabels = ["Нүд", "Хацар", "Уруул"];
  const makeupShots = makeupLabels.map((label, index) => shot(art?.makeup?.[index], portrait(sheet.type, index), label)).join("");
  const jewelView = viewOf(art?.jewelry, jewelryStill());
  const avoidShots = sheet.avoid.slice(0, 4).map((label, index) => {
    const item = viewOf(art?.avoid[index], outfit(sheet.type, index % 4));
    return `<figure class="shot"><span class="frame">${item.html}<b class="x">×</b></span><figcaption>${esc(label)}</figcaption></figure>`;
  }).join("");
  return `<!doctype html><html lang="mn"><head><meta charset="utf-8"/>
<style>
@page { size: A4 landscape; margin: 0; }
@page board { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; background: #fff; color: #1e1a18; }
body { font-family: "Noto Sans", "Manrope", sans-serif; }
.larson-page { width: 297mm; height: 210mm; position: relative; overflow: hidden; break-after: page; page-break-after: always; background: #fff; padding: 7mm 8mm 6mm; }
.larson-page:last-child { break-after: auto; page-break-after: auto; }
h1, h2, p, ul { margin: 0; }
img, svg { display: block; max-width: 100%; }
.mast { display: flex; justify-content: space-between; align-items: center; letter-spacing: 0.14em; font-size: 11px; font-weight: 700; }
.brand { height: 24mm; width: auto; }
.face-top { display: grid; grid-template-columns: 78mm 78mm 1fr; gap: 5mm; margin-top: 4mm; height: 92mm; }
.measured { position: relative; height: 92mm; margin: 0; background: #f7f4ef; }
.measured img { width: 100%; height: 92mm; object-fit: cover; object-position: center top; }
.axis-v, .axis-h, .jaw { position: absolute; pointer-events: none; }
.axis-v { left: 50%; top: 8%; bottom: 10%; border-left: 0.6pt dashed #1e1a18; }
.axis-h { left: 14%; right: 14%; top: 42%; border-top: 0.6pt dashed #1e1a18; }
.jaw { left: 22%; right: 22%; top: 46%; bottom: 12%; border: 0.6pt dashed #1e1a18; border-top: 0; border-radius: 0 0 46% 46%; }
.line-face { margin: 0; height: 92mm; background: #fff; }
.line-face svg, .line-face img { width: 100%; height: 92mm; object-fit: contain; }
.traits { list-style: disc; padding-left: 4.5mm; font-size: 9.5px; line-height: 1.35; }
.traits strong { display: block; letter-spacing: 0.04em; font-size: 12px; margin-bottom: 2mm; }
.traits li { margin: 0 0 1.4mm; }
.face-bottom { display: grid; grid-template-columns: 1fr 42mm; gap: 4mm; margin-top: 3mm; }
.section { letter-spacing: 0.16em; font-size: 9px; font-weight: 700; text-align: center; margin-bottom: 1.5mm; }
.crops { display: grid; grid-template-columns: repeat(6, 1fr); gap: 2mm; }
.crops figure { margin: 0; }
.crops img { width: 100%; height: 22mm; object-fit: cover; background: #f7f4ef; }
.crops figcaption { font-size: 8px; font-weight: 700; letter-spacing: 0.04em; margin-top: 0.6mm; }
.crops small { display: block; font-size: 7px; line-height: 1.25; color: #5c534e; }
.overall { border-left: 0.4pt solid #1e1a18; padding-left: 3mm; }
.overall img { width: 100%; height: 28mm; object-fit: cover; }
.overall p { font-size: 8px; line-height: 1.3; margin-top: 1.5mm; }
.summary { margin-top: 3mm; background: #f4f1ec; border-radius: 2mm; padding: 2.5mm 4mm; text-align: center; }
.summary strong { display: block; letter-spacing: 0.06em; font-size: 11px; }
.summary p { font-size: 9px; line-height: 1.35; margin-top: 1mm; }
.board { --accent: #28282B; page: board; width: 210mm; height: 297mm; padding: 6mm 6mm 5mm; display: flex; flex-direction: column; gap: 2mm; background: #fff; }
.board h2 { font-size: 8px; letter-spacing: 0.12em; font-weight: 700; margin-bottom: 1.4mm; }
.board ul { margin: 0; padding-left: 3.2mm; font-size: 8px; line-height: 1.32; min-width: 0; overflow-wrap: anywhere; }
.board li { margin: 0 0 0.6mm; min-width: 0; }
.board figure { margin: 0; min-width: 0; }
.board section { min-width: 0; overflow: hidden; }
.board small { display: block; font-size: 6.5px; letter-spacing: 0.04em; color: #7a2340; }
.hero { flex: 0 0 54mm; display: grid; grid-template-columns: 0.86fr 1.14fr; gap: 3mm; overflow: hidden; }
.board .brand { height: 20mm; margin-bottom: 1mm; }
.kicker { letter-spacing: 0.16em; font-size: 8px; font-weight: 700; }
.hero h1 { font-family: "Noto Serif", "Times New Roman", serif; font-size: 28px; font-weight: 500; letter-spacing: 0.08em; line-height: 0.92; color: var(--accent); margin-top: 0.6mm; }
.keywords { margin-top: 1mm; color: var(--accent); letter-spacing: 0.12em; font-size: 8px; font-weight: 700; }
.intro { margin-top: 1.2mm; font-size: 8.5px; line-height: 1.38; color: #3c342f; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
.refs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.6mm; }
.refs img, .refs svg { width: 100%; height: 42mm; object-fit: cover; object-position: center 35%; background: #ece7e1; }
.refs figcaption { margin-top: 0.6mm; font-size: 6.5px; letter-spacing: 0.05em; text-align: center; text-transform: uppercase; }
.trio { flex: 0 0 74mm; display: grid; grid-template-columns: 1.21fr 0.99fr 0.72fr; gap: 2mm; }
.card { height: 74mm; overflow: hidden; background: #f6f1ea; padding: 2.2mm 2.4mm; }
.face-split, .body-split { display: grid; gap: 1.6mm; align-items: start; min-width: 0; }
.face-split { grid-template-columns: 34mm minmax(0, 1fr); }
.body-split { grid-template-columns: 28mm minmax(0, 1fr); }
.face-split ul { padding-left: 3mm; }
.face-split img { width: 34mm; height: 62mm; object-fit: contain; object-position: center top; background: #fff; }
.body-split img, .body-split svg { width: 28mm; height: 62mm; object-fit: contain; background: transparent; }
.body-split figcaption, .note { font-size: 7px; line-height: 1.3; color: #5c534e; }
.bands { flex: 0 0 42mm; display: grid; grid-template-columns: 1.05fr 0.95fr 1.1fr; gap: 2mm; }
.lines, .swatches { display: flex; gap: 1.4mm 1mm; align-items: flex-start; }
.lines { flex-wrap: nowrap; }
.swatches { flex-wrap: wrap; }
.lines figure { flex: 1 1 18mm; margin: 0; text-align: center; min-width: 0; }
.swatches figure { flex: 0 0 18mm; margin: 0; text-align: center; }
.lines svg { width: 100%; height: 24mm; }
.swatches i, .swatches img.cloth { display: block; width: 11mm; height: 11mm; border-radius: 50%; margin: 0 auto 0.6mm; border: 0.3pt solid #e4ddd4; object-fit: cover; }
.lines figcaption, .swatches figcaption { font-size: 6.5px; line-height: 1.15; }
.mid { flex: 0 0 64mm; display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 2mm; }
.looks { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1.4mm; }
.looks img, .looks svg { width: 100%; height: 46mm; object-fit: contain; background: #f7f3ee; }
.looks figcaption { margin-top: 0.5mm; font-size: 6.5px; line-height: 1.2; }
.hair-row, .makeup-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1.2mm; }
.makeup-row { grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 1mm; }
.hair-row img, .hair-row svg, .makeup-row img, .makeup-row svg { width: 100%; height: 18mm; object-fit: cover; object-position: center 20%; background: #f6f1ea; }
.hair-row figcaption, .makeup-row figcaption { font-size: 6px; line-height: 1.15; margin-top: 0.3mm; }
.foot { flex: 0 0 38mm; display: grid; grid-template-columns: 0.78fr 1.22fr; gap: 2mm; }
.jewel { display: grid; grid-template-columns: 32mm 1fr; gap: 2mm; align-items: start; }
.jewel img, .jewel svg { width: 32mm; height: 22mm; object-fit: contain; background: #f6f1ea; }
.avoid { display: grid; grid-template-columns: 0.85fr 1.15fr; gap: 1.6mm; align-items: start; }
.avoid-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1mm; }
.shot .frame { position: relative; display: block; }
.shot img, .shot svg { width: 100%; height: 22mm; object-fit: cover; background: #f6f1ea; }
.shot .x { position: absolute; inset: 0; display: grid; place-items: center; color: #fff; font-size: 18px; font-weight: 700; line-height: 1; text-shadow: 0 0 4px #1e1a18; }
.shot figcaption { font-size: 6px; line-height: 1.15; margin-top: 0.3mm; }
</style></head><body>
<article class="larson-page">
  <header class="mast"><span>НҮҮРИЙН ХЭЛБЭР</span><img class="brand" alt="Naruka Styling Studio" src="${REPORT_LOGO}"></header>
  <div class="face-top">
    <figure class="measured"><img src="${face}" alt=""/><span class="axis-v"></span><span class="axis-h"></span><span class="jaw"></span></figure>
    <figure class="line-face">${sketch}</figure>
    <div><strong class="section" style="text-align:left">${esc(sheet.faceTitle.toUpperCase())}</strong><ul class="traits">${traitItems}</ul></div>
  </div>
  <div class="face-bottom">
    <div>
      <p class="section">ОНЦЛОГ</p>
      <div class="crops">${cropItems}</div>
    </div>
    <aside class="overall">
      <p class="section">НИЙТ ТӨРХ</p>
      <img src="${face}" alt=""/>
      <p>${esc(sheet.overall)}</p>
    </aside>
  </div>
  <section class="summary"><strong>${esc(sheet.faceTitle.toUpperCase())}</strong><p>${esc(reading.summary)}</p></section>
</article>
<article class="larson-page board" style="--accent:${ACCENT[reading.type]}">
  <header class="hero">
    <div>
      <img class="brand" alt="Naruka Styling Studio" src="${REPORT_LOGO}">
      <p class="kicker">LARSON STYLE ARCHETYPE</p>
      <h1>${esc(sheet.type.toUpperCase())}</h1>
      <p class="keywords">${esc(sheet.keywords)}</p>
      <p class="intro">${esc(reading.summary)} ${esc(sheet.intro)}</p>
    </div>
    <div class="refs">${refs}</div>
  </header>
  <div class="trio">
    <section class="card">
      <h2>НҮҮРИЙН ШИНЖ</h2>
      <div class="face-split"><img src="${face}" alt=""/><ul>${traitItems}</ul></div>
    </section>
    <section class="card">
      <h2>БИЕИЙН ТӨРХ</h2>
      <div class="body-split">
        <figure>${bodyView.html}${bodyCaption}</figure>
        <div>
          <p class="note">Сонгосон биеийн хэлбэр: ${esc(shapeName)}</p>
          <ul>${bullets(sheet.bodyTraits)}</ul>
        </div>
      </div>
    </section>
    <section class="card">
      <h2>ЕРӨНХИЙ СЭТГЭГДЭЛ</h2>
      <ul>${bullets(sheet.impression)}</ul>
      <p class="note">Стилийн чиглэлийн ерөнхий төрх. Хувийн өнгөний улирал, биеийн хэмжилт биш.</p>
    </section>
  </div>
  <div class="bands">
    <section><h2>ТОХИРОХ ХУВЦАСНЫ ШУГАМ, ХЭЛБЭР</h2><div class="lines">${lines}</div></section>
    <section><h2>ТОХИРОХ МАТЕРИАЛ</h2><div class="swatches">${materials}</div><p class="note">${esc(sheet.materialNote)}</p></section>
    <section><h2>ТОХИРОХ ӨНГӨ</h2><div class="swatches">${colors}</div></section>
  </div>
  <div class="mid">
    <section>
      <h2>ТОХИРОХ ХУВЦАС, ЗАГВАР</h2>
      <div class="looks">${looks}</div>
    </section>
    <section>
      <h2>ҮСНИЙ ЗАСАЛТ, БУДАЛТ</h2>
      <p class="note">${esc(sheet.hair)}</p>
      <div class="hair-row">${hairShots}</div>
      <h2>НҮҮРИЙН БУДАЛТ</h2>
      <ul>${bullets(sheet.makeup)}</ul>
      <div class="makeup-row">${makeupShots}</div>
    </section>
  </div>
  <footer class="foot">
    <section>
      <h2>ТОХИРОХ ҮНЭТ ЭДЛЭЛ</h2>
      <div class="jewel"><figure>${jewelView.html}</figure><ul>${bullets(sheet.jewelry)}</ul></div>
    </section>
    <section>
      <h2>ЗАЙЛСХИЙХ ХЭВ МАЯГ</h2>
      <div class="avoid"><ul>${bullets(sheet.avoid)}</ul><div class="avoid-row">${avoidShots}</div></div>
      <p class="note">Энэ зорилгод бага нийцэх жишээ. Хориг биш.</p>
    </section>
  </footer>
</article>
</body></html>`;
}

function bullets(items: string[]) {
  return items.map((item) => `<li>${esc(item)}</li>`).join("");
}

async function cropJpeg(bytes: Buffer, box: CropBox) {
  try {
    const meta = await sharp(bytes).metadata();
    const width = meta.width ?? 1;
    const height = meta.height ?? 1;
    const left = clamp(Math.round(box.x * width), 0, Math.max(width - 2, 0));
    const top = clamp(Math.round(box.y * height), 0, Math.max(height - 2, 0));
    const cropWidth = clamp(Math.round(box.w * width), 1, width - left);
    const cropHeight = clamp(Math.round(box.h * height), 1, height - top);
    return await sharp(bytes).extract({ left, top, width: cropWidth, height: cropHeight }).jpeg({ quality: 82 }).toBuffer();
  } catch {
    return bytes;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function picture(bytes: Buffer | null | undefined, fallback: string) {
  return viewOf(bytes, fallback).html;
}

function viewOf(bytes: Buffer | null | undefined, fallback: string) {
  if (bytes && (imageFormatOk(bytes, "image/jpeg") || imageFormatOk(bytes, "image/png"))) {
    return { html: `<img src="${dataUrl(bytes)}" alt=""/>`, generated: true };
  }
  return { html: fallback, generated: false };
}

function shot(bytes: Buffer | null | undefined, fallback: string, caption: string) {
  const view = viewOf(bytes, fallback);
  const text = caption ? `<figcaption>${esc(caption)}</figcaption>` : "";
  return `<figure>${view.html}${text}</figure>`;
}

function dataUrl(bytes: Buffer) {
  const mime = imageFormatOk(bytes, "image/png") ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

function esc(value: string) {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] ?? char);
}

export async function assertTapPdf(bytes: Buffer) {
  const doc = await PDFDocument.load(bytes);
  const pages = doc.getPages();
  if (pages.length !== 2) throw new Error(`pdf_pages_${pages.length}`);
  const face = pages[0].getSize();
  const board = pages[1].getSize();
  if (face.width + 1 < face.height) throw new Error("pdf_portrait");
  if (board.height + 1 < board.width) throw new Error("pdf_board_landscape");
  return bytes;
}
