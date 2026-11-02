import { describe, expect, it } from "vitest";
import { FACE_MANIFEST, assertLandscapePdf, printHtmlToPdf, renderQuizReportHtml, type FaceDraft } from "./face-report-pdf";
import { reportDesign } from "./report-design";
import { MANIFESTS, developerPrompt, imageJobsFor, imagePrompt, userMessage } from "./report-prompts";

const PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function fixture(): FaceDraft {
  return {
    reportId: "aiq_test",
    briefSections: [{ heading: "Хувийн нүүрний чиглэл", body: "Хариултаас гарсан нэг чиглэл." }],
    images: { 1: PIXEL, 16: PIXEL, 24: PIXEL },
    captions: {},
    pages: FACE_MANIFEST.map((item) => ({
      page_number: item.page,
      intro_mn: "Хариултаас гарсан нэг чиглэл.",
      recommendations: [{ action_mn: "Нэг акцент сонго", why_mn: "Хариултын контраст өндөр." }],
      callouts: item.page === 3 ? [{ title: "Нүд", text: "Зөөлөн туяа", side: "R" as const, cx: 590, cy: 300, size: 150 }] : [],
    })),
  };
}

describe("face report pdf", () => {
  it("renders the 25-page face manifest", () => {
    expect(FACE_MANIFEST).toHaveLength(25);
    expect(FACE_MANIFEST.map((item) => item.page)).toEqual(Array.from({ length: 25 }, (_, index) => index + 1));
    const html = renderQuizReportHtml(fixture(), "face_beauty");
    expect(html.match(/class="report-page/g)).toHaveLength(25);
    expect(html).toContain("1/25");
    expect(html).toContain("25/25");
    expect(html).toContain("Хариултаас гарсан нэг чиглэл.");
    expect(html).toContain("Нүд");
    expect(html).not.toContain("has-swatches");
    expect(html).not.toContain("Тодруулах сонголт");
    const design = reportDesign() as unknown as Record<string, unknown>;
    expect(design.pages).toBeUndefined();
    expect(JSON.stringify(design)).not.toContain("Тодруулах сонголт");
    expect(html).toContain("object-fit: contain");
    expect(html).not.toContain("split");
    expect(html.match(/class="hero"/g)).toHaveLength(3);
    expect(html.match(/class="step"/g)).toHaveLength(25);
    expect(html.match(/class="logo"/g)).toHaveLength(25);
    expect(html).not.toContain("AI стиль туршилт");
    expect(html).not.toContain("Жишээ зураг · маникен");
    expect(html).toContain("Анхны зураг");
    expect(html).toContain("#B08A3E");
    expect(html).toContain("background: #FFFFFF");
    expect(html).not.toContain("#F7F3ED");
  });

  it("reuses a small image plan and keeps outfit edits on the body photo", () => {
    for (const kind of ["face_beauty", "body_shape", "archetype"] as const) {
      const jobs = imageJobsFor(kind);
      const pages = jobs.flatMap((job) => job.pages).sort((a, b) => a - b);
      expect(pages).toEqual(Array.from({ length: 25 }, (_, index) => index + 1));
      expect(jobs.length).toBeLessThanOrEqual(kind === "face_beauty" ? 16 : 10);
    }
    const face = imageJobsFor("face_beauty");
    expect(face.filter((job) => job.id.startsWith("makeup_"))).toHaveLength(2);
    expect(face.filter((job) => job.id.startsWith("glasses_"))).toHaveLength(3);
    expect(imagePrompt(face[0], true)).toContain("plain white background");
    expect(imageJobsFor("body_shape").filter((job) => job.kind === "outfit").every((job) => job.role === "body")).toBe(true);
    expect(imageJobsFor("archetype").every((job) => job.role === "none")).toBe(true);
    const shortened = imageJobsFor("face_beauty", ["short"]);
    expect(shortened.some((job) => job.id === "hair_short")).toBe(false);
    expect(shortened.flatMap((job) => job.pages).sort((a, b) => a - b)).toEqual(Array.from({ length: 25 }, (_, index) => index + 1));
    const outfit = imageJobsFor("body_shape").find((job) => job.kind === "outfit");
    expect(outfit).toBeTruthy();
    expect(imagePrompt(outfit!, true)).toContain("Do not slim the waist");
    expect(imagePrompt(outfit!, false)).toContain("mannequin");
    expect(imagePrompt(imageJobsFor("archetype")[1], true)).toContain("mannequin");
  });

  it("uses the 25-page instruction for every quiz", () => {
    for (const kind of ["face_beauty", "body_shape", "archetype"] as const) {
      expect(MANIFESTS[kind]).toHaveLength(25);
      expect(MANIFESTS[kind].every((item) => item.imageJobId && (item.kind === "base" || item.kind === "change"))).toBe(true);
      expect(developerPrompt(kind)).toContain("яг 25 хуудастай");
      expect(developerPrompt(kind)).not.toContain("computed_result");
      const message = userMessage({ quiz_type: kind, answers: [{ question: "Асуулт", answer: "Хариулт" }] }, MANIFESTS[kind]);
      expect(message).toContain("PAGE_MANIFEST");
      expect(message).not.toContain("computed_result");
      expect(message).not.toContain("\"cx\"");
      const html = renderQuizReportHtml({ ...fixture(), pages: MANIFESTS[kind].map((item) => ({ ...fixture().pages[0], page_number: item.page })) }, kind);
      expect(html.match(/class="report-page/g)).toHaveLength(25);
    }
    expect(developerPrompt("face_beauty")).toContain("callouts");
    expect(developerPrompt("face_beauty")).toContain("будалт 5");
    expect(developerPrompt("face_beauty")).toContain("зохихгүй");
    expect(developerPrompt("body_shape")).toContain("PAGE_MANIFEST_BODY");
    expect(developerPrompt("archetype")).toContain("PAGE_MANIFEST_ARCHETYPE");
  });

  it("prints 25 landscape A4 pages", async () => {
    const pdf = await printHtmlToPdf(renderQuizReportHtml(fixture(), "face_beauty"));
    await assertLandscapePdf(pdf);
  }, 60_000);
});
