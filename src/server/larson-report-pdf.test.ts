import sharp from "sharp";
import { describe, expect, it } from "vitest";
import type { LarsonReading } from "@/domain/tap";
import { renderLarsonHtml } from "./larson-report-pdf";

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
  it("builds two pages for the face sheet and the Larson body sheet", async () => {
    const photo = await sharp({ create: { width: 40, height: 60, channels: 3, background: "#c48b6a" } }).jpeg().toBuffer();
    const html = await renderLarsonHtml(photo, reading, "hourglass");
    expect(html.match(/class="larson-page"/g)).toHaveLength(2);
    expect(html).toContain("НҮҮРИЙН ХЭЛБЭР");
    expect(html).toContain("LARSON STYLE ARCHETYPE");
    expect(html).toContain("DRAMATIC");
    expect(html).toContain("Шулуун шугам давамгайлсан нүүр.");
    expect(html).toContain("БИЕИЙН ТӨРХ");
    expect(html).toContain("Сонгосон биеийн хэлбэр: Элсэн цаг");
  });
});
