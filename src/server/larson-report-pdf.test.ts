import sharp from "sharp";
import { describe, expect, it } from "vitest";
import type { LarsonReading } from "@/domain/tap";
import type { LarsonGenerated } from "./larson-images";
import { larsonImageJobs, restoreTapImages } from "./larson-images";
import type { ImageRequest } from "./model-transport";
import { silhouette } from "@/content/larson/art";
import { faceCrops, renderLarsonHtml } from "./larson-report-pdf";

const reading: LarsonReading = {
  type: "Dramatic",
  traits: {
    face: "Урт нүүр",
    brows: "Шулуун хөмсөг",
    eyes: "Нарийн нүд",
    nose: "Шулуун хамар",
    lips: "Нарийн уруул",
    chin: "Шовх эрүү",
  },
  summary: "Шулуун шугам давамгайлсан нүүр.",
  crops: {
    brows: { x: 0.2, y: 0.2, w: 0.5, h: 0.2 },
    eyes: { x: 0.2, y: 0.35, w: 0.5, h: 0.2 },
    nose: { x: 0.35, y: 0.45, w: 0.3, h: 0.2 },
    lips: { x: 0.3, y: 0.62, w: 0.4, h: 0.15 },
    chin: { x: 0.3, y: 0.75, w: 0.4, h: 0.18 },
  },
};

describe("larson report", () => {
  it("builds a face page and a Larson archetype board", async () => {
    const photo = await sharp({ create: { width: 40, height: 60, channels: 3, background: "#c48b6a" } }).jpeg().toBuffer();
    const html = await renderLarsonHtml(photo, reading, "hourglass");
    expect(html.match(/class="larson-page/g)).toHaveLength(2);
    expect(html.match(/class="brand"/g)).toHaveLength(2);
    expect(html).toContain("data:image/png;base64,");
    expect(html).toContain("НҮҮРИЙН ХЭЛБЭР");
    expect(html).toContain("Шулуун шугам давамгайлсан нүүр.");
    expect(html).toContain("LARSON STYLE ARCHETYPE");
    expect(html).toContain("DRAMATIC");
    expect(html).toContain("НҮҮРИЙН ШИНЖ");
    expect(html).toContain("БИЕИЙН ТӨРХ");
    expect(html).toContain("ЕРӨНХИЙ СЭТГЭГДЭЛ");
    expect(html).toContain("ТОХИРОХ ХУВЦАСНЫ ШУГАМ, ХЭЛБЭР");
    expect(html).toContain("Шулуун");
    expect(silhouette("Өргөн шулуун")).not.toBe(silhouette("Сул"));
    expect(silhouette("Бүсэлхийтэй", "hourglass")).not.toBe(silhouette("Бүсэлхийтэй", "rectangle"));
    expect(silhouette("Давхарга")).toContain("M ");
    expect(html).toContain("ТОХИРОХ МАТЕРИАЛ");
    expect(html).toContain("ТОХИРОХ ӨНГӨ");
    expect(html).toContain("ТОХИРОХ ХУВЦАС, ЗАГВАР");
    expect(html).toContain("ҮСНИЙ ЗАСАЛТ, БУДАЛТ");
    expect(html).toContain("НҮҮРИЙН БУДАЛТ");
    expect(html).toContain("ТОХИРОХ ҮНЭТ ЭДЛЭЛ");
    expect(html).toContain("ЗАЙЛСХИЙХ ХЭВ МАЯГ");
    expect(html).toContain("Сонгосон биеийн хэлбэр: Элсэн цаг");
    expect(html).not.toContain("Yang");
    expect(html).not.toContain("Таны биеийн харьцаа");
    expect(html).not.toContain("Ерөнхий дүрслэл");
  });

  it("places generated board images from the image model", async () => {
    const photo = await sharp({ create: { width: 40, height: 60, channels: 3, background: "#c48b6a" } }).jpeg().toBuffer();
    const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8]), Buffer.alloc(8)]);
    const art: LarsonGenerated = {
      sketch: jpeg,
      portraits: [jpeg, jpeg, jpeg],
      outfits: [jpeg, jpeg, jpeg, jpeg],
      hair: [jpeg, jpeg, jpeg, jpeg],
      makeup: [jpeg, jpeg, jpeg],
      jewelry: jpeg,
      materials: [jpeg, jpeg, jpeg, jpeg],
      avoid: [jpeg, jpeg, jpeg, jpeg],
    };
    const html = await renderLarsonHtml(photo, reading, "hourglass", art);
    expect(html).toContain('class="line-face"');
    expect(html).toContain("page: board");
    expect(html).toContain("Ерөнхий дүрслэл — таны биеийн хэмжилт биш");
    expect(html).not.toContain("AI стилийн жишээ");
    expect(html.match(/class="cloth"/g)?.length).toBe(4);
    const materials = html.split("ТОХИРОХ МАТЕРИАЛ")[1]?.split("ТОХИРОХ ӨНГӨ")[0] ?? "";
    expect(materials).toContain("Торго");
    expect(html.match(/class="x"/g)?.length).toBe(4);
    expect(html).toContain("Нүд");
    expect(html).toContain("Хацар");
    expect(html).toContain("Уруул");
  });

  it("cleans a rejected photo and frames without changing the face", async () => {
    const previous = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "test-key";
    const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8]), Buffer.alloc(8)]);
    const calls: ImageRequest[] = [];
    const restored = await restoreTapImages([jpeg, jpeg, jpeg, jpeg], async (input) => {
      calls.push(input);
      return { bytes: jpeg, base64: jpeg.toString("base64"), inputTokens: 0 };
    });
    if (previous === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previous;
    expect(restored).toHaveLength(4);
    expect(calls).toHaveLength(4);
    expect(calls.every((call) => call.reference?.bytes === jpeg && call.prompt.includes("Keep this same face") && call.prompt.includes("Remove color overlays") && call.prompt.includes("Do not slim the face"))).toBe(true);
  });

  it("edits the suggested portraits and outfits from the supplied face", () => {
    const jobs = larsonImageJobs(reading, "rectangle");
    expect(jobs.map((job) => job.slot)).toEqual([
      "sketch",
      "portrait", "portrait", "portrait",
      "outfit", "outfit", "outfit", "outfit",
      "hair", "hair", "hair", "hair",
      "makeup", "makeup", "makeup",
      "jewelry",
      "material", "material", "material", "material",
      "avoid", "avoid", "avoid", "avoid",
    ]);
    const edits = jobs.filter((job) => job.edit);
    expect(edits.map((job) => job.slot)).toEqual([
      "sketch",
      "portrait", "portrait", "portrait",
      "outfit", "outfit", "outfit", "outfit",
      "hair", "hair", "hair", "hair",
    ]);
    expect(edits.every((job) => job.prompt.includes("Keep this same face"))).toBe(true);
    expect(jobs.filter((job) => job.slot === "makeup").every((job) => job.edit === false && !job.prompt.includes("Keep this same face"))).toBe(true);
    expect(jobs.filter((job) => job.slot === "avoid").every((job) => job.edit === false && job.prompt.includes("mannequin"))).toBe(true);
    expect(jobs[0]?.prompt).toContain("black ink");
    const outfit = jobs.find((job) => job.slot === "outfit");
    expect(outfit?.edit).toBe(true);
    expect(outfit?.prompt.includes("little waist") && outfit.prompt.includes("same person") && !outfit.prompt.includes("mannequin")).toBe(true);
    expect(jobs.find((job) => job.slot === "portrait")?.prompt).toContain("same person");
    const cloth = jobs.filter((job) => job.slot === "material");
    expect(cloth).toHaveLength(4);
    expect(cloth.every((job) => job.edit === false && job.prompt.includes("macro photograph") && job.prompt.includes("weave") && !job.prompt.includes("Keep this same face"))).toBe(true);
    expect(cloth[0]?.prompt).toContain("silk");
  });

  it("replaces overlapping feature boxes with a front-portrait stack", () => {
    expect(faceCrops(reading.crops)).toEqual({
      brows: { x: 0.22, y: 0.18, w: 0.56, h: 0.1 },
      eyes: { x: 0.22, y: 0.29, w: 0.56, h: 0.09 },
      nose: { x: 0.36, y: 0.38, w: 0.28, h: 0.12 },
      lips: { x: 0.34, y: 0.51, w: 0.32, h: 0.08 },
      chin: { x: 0.3, y: 0.6, w: 0.4, h: 0.1 },
    });
    const tight = {
      brows: { x: 0.25, y: 0.2, w: 0.5, h: 0.08 },
      eyes: { x: 0.25, y: 0.3, w: 0.5, h: 0.08 },
      nose: { x: 0.38, y: 0.4, w: 0.24, h: 0.1 },
      lips: { x: 0.36, y: 0.52, w: 0.28, h: 0.07 },
      chin: { x: 0.32, y: 0.62, w: 0.36, h: 0.08 },
    };
    expect(faceCrops(tight)).toEqual(tight);
  });
});
