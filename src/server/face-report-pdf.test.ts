import { describe, expect, it } from "vitest";
import { FACE_MANIFEST, assertLandscapePdf, printHtmlToPdf, renderQuizReportHtml, type FaceDraft } from "./face-report-pdf";
import { MANIFESTS, developerPrompt, userMessage } from "./report-prompts";

const PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const HEX = ["#E07A5F", "#F2C1A0", "#F6E7D2", "#C4A35A", "#7D9B76", "#F7F3EA", "#6D2438", "#B89B68", "#29272A", "#D7B89A", "#8C4A3A", "#C47A6A"];

function fixture(): FaceDraft {
  return {
    reportId: "aiq_test",
    briefSections: [
      { heading: "Хэлбэр", body: "Алмазан" },
      { heading: "Улирал", body: "Дулаан хавар" },
      { heading: "Контраст", body: "Өндөр" },
      { heading: "Мөн чанар", body: "Dramatic" },
    ],
    palette: HEX.map((hex, index) => ({
      id: `c${index}`,
      name_mn: `Өнгө ${index + 1}`,
      hex,
      role: index < 4 ? "neutral" : index < 8 ? "accent" : "makeup",
    })),
    images: { 1: PIXEL, 16: PIXEL, 24: PIXEL },
    pages: FACE_MANIFEST.map((item) => ({
      page_number: item.page,
      intro_mn: "Серверийн оноонд тулгуурласан товч тайлбар.",
      notes_mn: "Зөвшөөрсөн лавлагаа зураг байхгүй тул хөрөг оруулаагүй.",
      recommendations: [
        { action_mn: "Нэг акцент сонго", why_mn: "Хариултын контраст өндөр." },
        { action_mn: "Богино алхам", why_mn: "Өдөр тутмын цаг хязгаартай." },
        { action_mn: "Будахгүй хувилбар үлдээ", why_mn: "Сонголтыг хаагаагүй." },
      ],
    })),
  };
}

describe("face report pdf", () => {
  it("renders the 25-page face manifest", () => {
    expect(FACE_MANIFEST).toHaveLength(25);
    expect(FACE_MANIFEST.map((item) => item.page)).toEqual(Array.from({ length: 25 }, (_, index) => index + 1));
    const html = renderQuizReportHtml(fixture(), "face_beauty");
    expect(html.match(/class="report-page"/g)).toHaveLength(25);
    expect(html).toContain("1/25");
    expect(html).toContain("25/25");
    expect(html).toContain("хөрөг оруулаагүй");
    expect(html.match(/class="logo"/g)).toHaveLength(25);
    expect(html.match(/Маникен дээрх жишээ/g)).toHaveLength(3);
  });

  it("uses the 25-page instruction for every quiz", () => {
    for (const kind of ["face_beauty", "body_shape", "archetype"] as const) {
      expect(MANIFESTS[kind]).toHaveLength(25);
      expect(developerPrompt(kind)).toContain("яг 25 хуудастай");
      expect(userMessage({ quiz_type: kind }, MANIFESTS[kind])).toContain("PAGE_MANIFEST");
      const html = renderQuizReportHtml({ ...fixture(), pages: MANIFESTS[kind].map((item) => ({ ...fixture().pages[0], page_number: item.page })) }, kind);
      expect(html.match(/class="report-page"/g)).toHaveLength(25);
    }
    expect(developerPrompt("body_shape")).toContain("PAGE_MANIFEST_BODY");
    expect(developerPrompt("archetype")).toContain("PAGE_MANIFEST_ARCHETYPE");
  });

  it("prints 25 landscape A4 pages", async () => {
    const pdf = await printHtmlToPdf(renderQuizReportHtml(fixture(), "face_beauty"));
    await assertLandscapePdf(pdf);
  }, 60_000);
});
