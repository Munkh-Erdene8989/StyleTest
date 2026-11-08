import { imageFormatOk } from "@/domain/images";
import { tapBodyLabel, type LarsonReading, type TapBodyShape } from "@/domain/tap";
import { larsonSheet } from "@/content/larson/catalog";
import { renderImage, type ImageRequest, type ModelImage } from "./model-transport";

const BODY = {
  hourglass: "upper and lower body similar, with a defined waist",
  pear: "hips wider than the upper body",
  apple: "fuller midsection, with less waist definition",
  rectangle: "upper and lower body similar, with little waist definition",
  inverted_triangle: "shoulders wider than the hips",
} as const;

export type LarsonImageJob = {
  slot: "sketch" | "portrait" | "outfit" | "hair" | "makeup" | "jewelry" | "material" | "avoid";
  index: number;
  prompt: string;
  size: "1024x1024" | "1024x1536";
  edit: boolean;
};

export type LarsonGenerated = {
  sketch: Buffer | null;
  portraits: (Buffer | null)[];
  outfits: (Buffer | null)[];
  hair: (Buffer | null)[];
  makeup: (Buffer | null)[];
  jewelry: Buffer | null;
  materials: (Buffer | null)[];
  avoid: (Buffer | null)[];
};

const FACE_LOCK = "Use the supplied portrait as the person. Keep this same face: recognizable identity, face shape, proportions, skin texture, natural skin color, and distinctive features. Do not slim the face, enlarge the eyes, reshape the nose or jaw, change apparent age, whiten skin, or add a beautification filter.";

const FABRIC: Record<string, string> = {
  "Торго": "silk with a soft natural sheen and a fine weave",
  "Креп": "crepe with a dry, pebbled matte surface",
  "Ноос": "wool with a visible fiber nap",
  "Арьс": "leather with a fine natural grain",
  "Маалинга": "linen with an open, slubby weave",
  "Хөвөн": "cotton with a plain woven texture",
  "Деним": "denim with a diagonal twill weave",
  "Нэхээс": "delicate lace with an open woven pattern",
  "Хилэн": "velvet with a dense directional pile",
  "Нарийн ноос": "fine wool suiting with a tight weave",
  "Нягт хөвөн": "dense cotton twill",
  "Гөлгөр ноос": "smooth wool flannel",
  "Поплин": "cotton poplin with a fine rib",
};

export const FACE_RESTORE_PROMPT = [
  "Edit the supplied photo into a clean natural photograph of the same person.",
  "Remove color overlays, scan effects, translucent layers, beauty filters, and artificial color casts.",
  "Keep the same head angle, expression, and framing.",
  FACE_LOCK,
  "Do not add makeup or a new background graphic.",
  "No text, labels, logos, or diagrams.",
].join(" ");

export function larsonImageJobs(reading: LarsonReading, bodyShape?: TapBodyShape | null): LarsonImageJob[] {
  const sheet = larsonSheet(reading.type);
  const palette = sheet.colors.slice(0, 4).map((item) => `${item.name} ${item.hex}`).join(", ");
  const shape = bodyShape ? `${tapBodyLabel(bodyShape)} — ${BODY[bodyShape]}` : "unknown. Do not guess a body type";
  const direction = `Larson-inspired ${sheet.type} styling direction. Keywords: ${sheet.keywords}. Palette: ${palette}.`;
  const clean = "No text, labels, logos, watermarks, diagrams, arrows, or a recognizable celebrity.";
  const sketch: LarsonImageJob = {
    slot: "sketch",
    index: 0,
    size: "1024x1024",
    edit: true,
    prompt: [
      "Edit the supplied portrait into a black ink contour sketch of this same face.",
      FACE_LOCK,
      "White background. Fine black lines only: face outline, brows, eyes, nose, lips, and jaw.",
      "No color fill, no photo texture, no shading, no text, labels, arrows, or measurement marks.",
    ].join(" "),
  };
  const portraits = sheet.references.map((note, index) => ({
    slot: "portrait" as const,
    index,
    size: "1024x1024" as const,
    edit: true,
    prompt: [
      `Edit the supplied portrait into a shoulders-up styling photo of this same person. Direction: ${direction}`,
      `Visual note: ${note}.`,
      FACE_LOCK,
      "Change only hair styling and light makeup. Warm gray studio background, soft light, front-facing.",
      clean,
      "This is a style preview of the supplied person, not a different model.",
    ].join(" "),
  }));
  const outfits = sheet.outfits.map((item, index) => ({
    slot: "outfit" as const,
    index,
    size: "1024x1536" as const,
    edit: true,
    prompt: [
      `Edit the supplied portrait into a full-length photo of this same person wearing ${item}.`,
      `Visual direction: ${direction}`,
      `Clothing ease only: ${shape}.`,
      FACE_LOCK,
      "Keep this face on the body. The photo shows only the head and shoulders, so the body below is a styling illustration, not a measurement.",
      "Modest daywear, whole outfit and shoes visible, neutral pose, soft studio light, warm ivory background.",
      "Do not present exact measurements or a before-and-after change.",
      clean,
    ].join(" "),
  }));
  const hairLooks = [
    "long and smooth, worn down",
    "soft waves at the shoulders",
    "a polished bob ending at the jaw",
    "loosely pulled back, with a few strands at the face",
  ];
  const hair = hairLooks.map((look, index) => ({
    slot: "hair" as const,
    index,
    size: "1024x1024" as const,
    edit: true,
    prompt: [
      `Edit the supplied portrait to demonstrate this hairstyle only: ${look}. Direction: ${sheet.hair}.`,
      FACE_LOCK,
      "Change only the hair styling. Keep makeup minimal and natural.",
      "Shoulders-up, same camera angle, same expression, neutral background.",
      "No text, labels, diagrams, watermarks, or measurement marks. This is a style preview, not analysis evidence.",
    ].join(" "),
  }));
  const makeupLooks = [
    "an extreme close-up of one open adult eye and eyelid only",
    "an extreme close-up of cheek skin with blush only, no eye and no mouth",
    "an extreme close-up of closed lips only, no nose and no chin",
  ];
  const makeup = makeupLooks.map((look, index) => ({
    slot: "makeup" as const,
    index,
    size: "1024x1024" as const,
    edit: false,
    prompt: [
      `Create ${look}. Makeup direction: ${sheet.makeup[index] ?? sheet.makeup[0]}. Palette: ${palette}.`,
      "Soft studio light, realistic skin, warm ivory background, tight crop.",
      "No full face, no person identity, no text, labels, logos, or a recognizable celebrity.",
      "This is a generic makeup example.",
    ].join(" "),
  }));
  const materials = sheet.materials.map((item, index) => ({
    slot: "material" as const,
    index,
    size: "1024x1024" as const,
    edit: false,
    prompt: [
      `Create a macro photograph of real ${FABRIC[item.name] ?? item.name} filling the entire frame.`,
      `The cloth color is close to ${item.hex}.`,
      "Show the actual thread, weave, nap, or grain. Soft side light, sharp focus, no garment silhouette.",
      "No person, mannequin, clothing shape, background scene, text, labels, logos, or watermarks.",
    ].join(" "),
  }));
  const jewelry: LarsonImageJob = {
    slot: "jewelry",
    index: 0,
    size: "1024x1024",
    edit: false,
    prompt: [
      `Create a premium editorial flat-lay of these accessories: ${sheet.jewelry.join(", ")}.`,
      `Visual direction: ${direction}`,
      "Warm ivory background, realistic material, soft studio light, clear margins.",
      "No people, invented logos, captions, prices, or text.",
    ].join(" "),
  };
  const avoid = sheet.avoid.slice(0, 4).map((item, index) => ({
    slot: "avoid" as const,
    index,
    size: "1024x1536" as const,
    edit: false,
    prompt: [
      `Create a full-length photo of a generic adult mannequin in modest daywear that is a weaker match for this direction: ${item}.`,
      `The preferred direction is ${sheet.type}. Show a plain, less aligned outfit, shoes visible.`,
      "Warm ivory background, neutral pose. Do not use the report subject's face.",
      clean,
      "This is a generic example of a weaker styling match, not a rule.",
    ].join(" "),
  }));
  return [sketch, ...portraits, ...outfits, ...hair, ...makeup, jewelry, ...materials, ...avoid];
}

export async function restoreTapImages(
  images: Buffer[],
  render: (input: ImageRequest) => Promise<ModelImage> = renderImage,
): Promise<Buffer[] | null> {
  if (!process.env.OPENAI_API_KEY || images.length !== 4) return null;
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.6-flare";
  const made = await pool(images.map((bytes) => () => cleanFrame(render, model, bytes)), 2);
  if (made.every((item) => !item)) return null;
  return images.map((original, index) => made[index] ?? original);
}

async function cleanFrame(render: (input: ImageRequest) => Promise<ModelImage>, model: string, photo: Buffer) {
  try {
    const image = await render({
      model,
      prompt: FACE_RESTORE_PROMPT,
      size: "1024x1024",
      outputFormat: "jpeg",
      quality: "medium",
      timeoutMs: 180_000,
      reference: { bytes: photo, mime: "image/jpeg" },
    });
    if (!imageFormatOk(image.bytes, "image/jpeg") && !imageFormatOk(image.bytes, "image/png")) return null;
    return image.bytes;
  } catch {
    return null;
  }
}

export async function createLarsonArt(
  photo: Buffer,
  reading: LarsonReading,
  bodyShape?: TapBodyShape | null,
  render: (input: ImageRequest) => Promise<ModelImage> = renderImage,
): Promise<LarsonGenerated> {
  const empty: LarsonGenerated = { sketch: null, portraits: [], outfits: [], hair: [], makeup: [], jewelry: null, materials: [], avoid: [] };
  if (!process.env.OPENAI_API_KEY) return empty;
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.6-flare";
  const jobs = larsonImageJobs(reading, bodyShape);
  const made = await pool(jobs.map((job) => () => draw(render, model, photo, job)), 3);
  for (const [index, job] of jobs.entries()) {
    const bytes = made[index];
    if (!bytes) continue;
    if (job.slot === "sketch") empty.sketch = bytes;
    if (job.slot === "portrait") empty.portraits[job.index] = bytes;
    if (job.slot === "outfit") empty.outfits[job.index] = bytes;
    if (job.slot === "hair") empty.hair[job.index] = bytes;
    if (job.slot === "makeup") empty.makeup[job.index] = bytes;
    if (job.slot === "jewelry") empty.jewelry = bytes;
    if (job.slot === "material") empty.materials[job.index] = bytes;
    if (job.slot === "avoid") empty.avoid[job.index] = bytes;
  }
  return empty;
}

async function draw(render: (input: ImageRequest) => Promise<ModelImage>, model: string, photo: Buffer, job: LarsonImageJob) {
  try {
    const image = await render({
      model,
      prompt: job.prompt,
      size: job.size,
      outputFormat: "jpeg",
      quality: "medium",
      timeoutMs: 180_000,
      ...(job.edit ? { reference: { bytes: photo, mime: "image/jpeg" } } : {}),
    });
    if (!imageFormatOk(image.bytes, "image/jpeg") && !imageFormatOk(image.bytes, "image/png")) {
      console.error("larson_image_failed", job.slot, job.index, "bad_format");
      return null;
    }
    console.log("larson_image_ok", job.slot, job.index);
    return image.bytes;
  } catch (error) {
    console.error("larson_image_failed", job.slot, job.index, error instanceof Error ? error.message.slice(0, 160) : "unknown");
    return null;
  }
}

async function pool<T>(jobs: (() => Promise<T>)[], limit: number) {
  const results = new Array<T>(jobs.length);
  let next = 0;
  async function worker() {
    while (next < jobs.length) {
      const index = next;
      next += 1;
      results[index] = await jobs[index]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, jobs.length) }, () => worker()));
  return results;
}
