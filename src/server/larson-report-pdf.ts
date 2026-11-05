import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { detailStill, jewelryStill, lineFace, outfit, portrait, silhouette } from "@/content/larson/art";
import { larsonSheet } from "@/content/larson/catalog";
import { tapBodyLabel, type CropBox, type LarsonReading, type TapBodyShape } from "@/domain/tap";
import { printHtmlToPdf } from "./face-report-pdf";

const TRAITS = [
  ["face", "Нүүр"],
  ["brows", "Хөмсөг"],
  ["eyes", "Нүд"],
  ["nose", "Хамар"],
  ["lips", "Уруул"],
  ["chin", "Эрүү"],
] as const;

export async function renderTapPdf(photo: Buffer, reading: LarsonReading, bodyShape?: TapBodyShape) {
  const html = await renderLarsonHtml(photo, reading, bodyShape);
  const pdf = await printHtmlToPdf(html);
  return assertTapPdf(pdf);
}

export async function renderLarsonHtml(photo: Buffer, reading: LarsonReading, bodyShape?: TapBodyShape) {
  const sheet = larsonSheet(reading.type);
  const face = dataUrl(photo);
  const crops = {
    face,
    brows: dataUrl(await cropJpeg(photo, reading.crops.brows)),
    eyes: dataUrl(await cropJpeg(photo, reading.crops.eyes)),
    nose: dataUrl(await cropJpeg(photo, reading.crops.nose)),
    lips: dataUrl(await cropJpeg(photo, reading.crops.lips)),
    chin: dataUrl(await cropJpeg(photo, reading.crops.chin)),
  };
  const traitItems = TRAITS.map(([key, label]) => `<li><span>${esc(label)}</span>${esc(reading.traits[key])}</li>`).join("");
  const cropItems = TRAITS.map(([key, label]) => `<figure><img src="${crops[key]}" alt=""/><figcaption>${esc(label)}</figcaption><small>${esc(reading.traits[key])}</small></figure>`).join("");
  const refs = sheet.references.map((label, index) => `<figure>${portrait(sheet.type, index)}<figcaption>${esc(label)}</figcaption></figure>`).join("");
  const lines = sheet.lines.map((name, index) => `<figure>${silhouette(sheet.type, index)}<figcaption>${esc(name)}</figcaption></figure>`).join("");
  const materials = sheet.materials.map((item) => `<figure><i style="background:${esc(item.hex)}"></i><figcaption>${esc(item.name)}</figcaption></figure>`).join("");
  const colors = sheet.colors.map((item) => `<figure><i style="background:${esc(item.hex)}"></i><figcaption>${esc(item.name)}</figcaption></figure>`).join("");
  const outfits = sheet.outfits.slice(0, 2).map((caption, index) => `<figure>${outfit(sheet.type, index)}<figcaption>${esc(caption)}</figcaption></figure>`).join("");
  const outfitNotes = sheet.outfits.map((item) => `<li>${esc(item)}</li>`).join("");
  const bodyTraits = sheet.bodyTraits.map((item) => `<li>${esc(item)}</li>`).join("");
  const impression = sheet.impression.map((item) => `<li>${esc(item)}</li>`).join("");
  const makeup = sheet.makeup.map((item) => `<li>${esc(item)}</li>`).join("");
  const jewelry = sheet.jewelry.map((item) => `<li>${esc(item)}</li>`).join("");
  const avoid = sheet.avoid.map((item) => `<li>${esc(item)}</li>`).join("");
  return `<!doctype html><html lang="mn"><head><meta charset="utf-8"/>
<style>
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; background: #fff; color: #1e1a18; }
body { font-family: "Noto Sans", "Manrope", sans-serif; }
.larson-page { width: 297mm; height: 210mm; position: relative; overflow: hidden; break-after: page; page-break-after: always; background: #fff; padding: 7mm 8mm 6mm; }
.larson-page:last-child { break-after: auto; page-break-after: auto; }
h1, h2, p, ul { margin: 0; }
img, svg { display: block; max-width: 100%; }
.mast { display: flex; justify-content: space-between; align-items: baseline; letter-spacing: 0.14em; font-size: 11px; font-weight: 700; }
.face-top { display: grid; grid-template-columns: 78mm 78mm 1fr; gap: 5mm; margin-top: 4mm; height: 92mm; }
.measured { position: relative; height: 92mm; margin: 0; background: #f7f4ef; }
.measured img { width: 100%; height: 92mm; object-fit: cover; object-position: center top; }
.axis-v, .axis-h, .jaw { position: absolute; pointer-events: none; }
.axis-v { left: 50%; top: 8%; bottom: 10%; border-left: 0.6pt dashed #1e1a18; }
.axis-h { left: 14%; right: 14%; top: 42%; border-top: 0.6pt dashed #1e1a18; }
.jaw { left: 22%; right: 22%; top: 46%; bottom: 12%; border: 0.6pt dashed #1e1a18; border-top: 0; border-radius: 0 0 46% 46%; }
.line-face { margin: 0; height: 92mm; }
.line-face svg { width: 100%; height: 92mm; }
.traits { list-style: disc; padding-left: 4.5mm; font-size: 9.5px; line-height: 1.35; }
.traits strong { display: block; letter-spacing: 0.04em; font-size: 12px; margin-bottom: 2mm; }
.traits li { margin: 0 0 1.4mm; }
.traits span { display: none; }
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
.hero { display: grid; grid-template-columns: 78mm 1fr; gap: 4mm; border-bottom: 0.4pt solid #e6dfd6; padding-bottom: 3mm; }
.kicker { letter-spacing: 0.18em; font-size: 9px; font-weight: 700; }
.hero h1 { font-family: "Noto Serif", "Times New Roman", serif; font-size: 28px; font-weight: 600; letter-spacing: 0.08em; line-height: 1; }
.keywords { font-size: 10px; letter-spacing: 0.08em; margin: 1mm 0 2mm; }
.hero p { font-size: 9px; line-height: 1.35; }
.refs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2mm; }
.refs figure { margin: 0; }
.refs svg { width: 100%; height: 38mm; }
.refs figcaption { text-align: center; font-size: 7px; letter-spacing: 0.08em; }
.columns { display: grid; grid-template-columns: 1.2fr 0.9fr 0.8fr; gap: 3mm; margin-top: 2.5mm; }
.columns h2 { font-size: 9px; letter-spacing: 0.08em; margin-bottom: 1mm; }
.columns ul, .notes ul { padding-left: 3.5mm; font-size: 8px; line-height: 1.3; }
.balance { margin-top: 2mm; font-size: 8px; }
.bar { display: flex; height: 3mm; margin-top: 1mm; }
.bar i { background: #1e1a18; }
.bar b { background: #d9d3cb; }
.bands { display: grid; grid-template-columns: 1.1fr 1fr 1fr; gap: 3mm; margin-top: 2.5mm; }
.bands h2, .lower h2 { font-size: 8px; letter-spacing: 0.08em; margin-bottom: 1mm; }
.lines, .swatches { display: flex; gap: 2mm; }
.lines figure, .swatches figure { margin: 0; text-align: center; flex: 1; }
.lines svg { width: 100%; height: 16mm; }
.swatches i { display: block; width: 8mm; height: 8mm; border-radius: 50%; margin: 0 auto 0.6mm; }
.swatches figcaption, .lines figcaption { font-size: 7px; }
.note { font-size: 7.5px; color: #5c534e; margin-top: 1mm; }
.lower { display: grid; grid-template-columns: 1.3fr 1fr 0.8fr; gap: 3mm; margin-top: 2.5mm; }
.looks { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm; }
.looks svg { width: 100%; height: 28mm; }
.looks figcaption { font-size: 7px; }
.pair { display: grid; grid-template-columns: 22mm 1fr; gap: 2mm; align-items: start; }
.pair svg { width: 22mm; height: 16mm; }
</style></head><body>
<article class="larson-page">
  <header class="mast"><span>НҮҮРИЙН ХЭЛБЭР</span><span>NARUKA</span></header>
  <div class="face-top">
    <figure class="measured"><img src="${face}" alt=""/><span class="axis-v"></span><span class="axis-h"></span><span class="jaw"></span></figure>
    <figure class="line-face">${lineFace(reading.type)}</figure>
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
<article class="larson-page">
  <div class="hero">
    <div>
      <p class="kicker">LARSON STYLE ARCHETYPE</p>
      <h1>${esc(sheet.type.toUpperCase())}</h1>
      <p class="keywords">${esc(sheet.keywords)}</p>
      <p>${esc(reading.summary)} ${esc(sheet.intro)}</p>
    </div>
    <div class="refs">${refs}</div>
  </div>
  <div class="columns">
    <section><h2>НҮҮРИЙН ШИНЖ</h2><ul class="traits">${traitItems}</ul></section>
    <section><h2>БИЕИЙН ТӨРХ</h2>${bodyShape ? `<p class="note">Сонгосон биеийн хэлбэр: ${esc(tapBodyLabel(bodyShape))}</p>` : ""}<ul>${bodyTraits}</ul></section>
    <section>
      <h2>ЕРӨНХИЙ СЭТГЭГДЭЛ</h2>
      <ul>${impression}</ul>
      <div class="balance"><span>ЭРЧИМ ХҮЧ</span><div>Yang ${sheet.yang}%</div><div class="bar"><i style="width:${sheet.yang}%"></i><b style="width:${sheet.yin}%"></b></div><div>Yin ${sheet.yin}%</div></div>
    </section>
  </div>
  <div class="bands">
    <section><h2>ТОХИРОХ ХУВЦАСНЫ ШУГАМ, ХЭЛБЭР</h2><div class="lines">${lines}</div></section>
    <section><h2>ТОХИРОХ МАТЕРИАЛ</h2><div class="swatches">${materials}</div><p class="note">${esc(sheet.materialNote)}</p></section>
    <section><h2>ТОХИРОХ ӨНГӨ</h2><div class="swatches">${colors}</div></section>
  </div>
  <div class="lower">
    <section><h2>ТОХИРОХ ХУВЦАС, ЗАГВАР</h2><div class="looks">${outfits}</div><ul>${outfitNotes}</ul></section>
    <section class="notes">
      <h2>ҮСНИЙ ЗАСАЛТ, БУДАЛТ</h2>
      <div class="pair">${detailStill(sheet.colors[0]?.hex ?? "#1e1a18")}<p>${esc(sheet.hair)}</p></div>
      <h2>НҮҮРИЙН БУДАЛТ</h2>
      <ul>${makeup}</ul>
    </section>
    <section class="notes">
      <h2>ТОХИРОХ ҮНЭТ ЭДЛЭЛ</h2>
      ${jewelryStill()}
      <ul>${jewelry}</ul>
      <h2>ЗАЙЛСХИЙХ ХЭВ МАЯГ</h2>
      <ul>${avoid}</ul>
    </section>
  </div>
</article>
</body></html>`;
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

function dataUrl(bytes: Buffer) {
  return `data:image/jpeg;base64,${bytes.toString("base64")}`;
}

function esc(value: string) {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] ?? char);
}

export async function assertTapPdf(bytes: Buffer) {
  const doc = await PDFDocument.load(bytes);
  const pages = doc.getPages();
  if (pages.length !== 2) throw new Error(`pdf_pages_${pages.length}`);
  for (const page of pages) {
    const { width, height } = page.getSize();
    if (width + 1 < height) throw new Error("pdf_portrait");
  }
  return bytes;
}
