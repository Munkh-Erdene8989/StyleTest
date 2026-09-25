import { describe, expect, it } from "vitest";
import { catalogFromLibrary, sanitizeDraft, sanitizeNews, scoreSpan } from "./admin-content";

describe("admin content", () => {
  it("covers the built-in quizzes without score gaps", () => {
    const catalog = catalogFromLibrary({ tests: [], news: null });
    expect(catalog.length).toBeGreaterThan(0);
    for (const row of catalog) {
      expect(row.issues).toEqual([]);
      const saved = sanitizeDraft(row, catalog);
      expect("draft" in saved).toBe(true);
    }
  });

  it("rejects a band gap", () => {
    const catalog = catalogFromLibrary({ tests: [], news: null });
    const row = structuredClone(catalog[0]);
    row.version.bands = row.version.bands.map((band, index) => (index === 0 ? { ...band, max: band.max - 1 } : band));
    const saved = sanitizeDraft(row, catalog);
    expect("issues" in saved).toBe(true);
    if ("issues" in saved) expect(saved.issues.some((issue) => issue.includes("завсар"))).toBe(true);
  });

  it("sums option scores into a closed span", () => {
    expect(
      scoreSpan([
        { options: [{ score: 0 }, { score: 2 }] },
        { options: [{ score: 1 }, { score: 3 }] },
      ]),
    ).toEqual({ min: 1, max: 5 });
  });

  it("keeps a news post with a date and body", () => {
    const saved = sanitizeNews([
      {
        slug: "shine-medee",
        title: "Шинэ мэдээ",
        publishedOn: "2026-09-25",
        topic: "Өнгө",
        swatch: "earth",
        excerpt: "Энэ улирлын нэг өнгөний тухай товч.",
        body: ["Нэг зүйлээр эхлэхэд хангалттай."],
      },
    ]);
    expect("posts" in saved && saved.posts).toHaveLength(1);
  });
});
