import { describe, expect, it } from "vitest";
import { checkPhotoAnalysis, photoAgrees } from "./photo-analysis";

const readyFace = {
  status: "ready",
  quality_issues: [],
  body_label: null,
  face_label: "oval",
  observations: ["зууван харагдана"],
  retake_instructions: [],
};

describe("photo analysis gate", () => {
  it("accepts a ready face label and rejects a body label on a portrait", () => {
    expect(checkPhotoAnalysis("face_front", readyFace).ok).toBe(true);
    const mismatch = checkPhotoAnalysis("face_front", { ...readyFace, body_label: "pear" });
    expect(mismatch.ok).toBe(false);
    if (!mismatch.ok) expect(mismatch.code).toBe("ROLE_LABEL_MISMATCH");
  });

  it("requires a label only when the photo is ready", () => {
    const missing = checkPhotoAnalysis("face_front", { ...readyFace, face_label: null });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.code).toBe("READY_WITHOUT_LABEL");
    const early = checkPhotoAnalysis("body_front", { ...readyFace, status: "review", face_label: null, body_label: "pear" });
    expect(early.ok).toBe(false);
    if (!early.ok) expect(early.code).toBe("UNCONFIRMED_LABEL");
  });

  it("requires retake instructions and keeps the quiz label when the photo disagrees", () => {
    const retake = checkPhotoAnalysis("body_front", {
      status: "retake",
      quality_issues: ["бүтэн бие харагдахгүй"],
      body_label: null,
      face_label: null,
      observations: [],
      retake_instructions: [],
    });
    expect(retake.ok).toBe(false);
    if (!retake.ok) expect(retake.code).toBe("MISSING_RETAKE_INSTRUCTIONS");
    expect(photoAgrees("Алиман хэлбэр", "pear")).toBe(false);
    expect(photoAgrees("Лийр хэлбэр", "pear")).toBe(true);
    expect(photoAgrees("Урвуу гурвалжин", "triangle")).toBe(false);
  });
});
