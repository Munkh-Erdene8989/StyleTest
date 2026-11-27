import { describe, expect, it } from "vitest";
import { checkLarsonVerdict } from "./tap";

const box = { x: 0.3, y: 0.3, w: 0.2, h: 0.12 };

function ready(type = "Dramatic") {
  return {
    status: "ready",
    type,
    traits: { face: "Урт нүүр", brows: "Шулуун хөмсөг", eyes: "Нарийн нүд", nose: "Шулуун хамар", lips: "Нарийн уруул", chin: "Шовх эрүү" },
    summary: "Шулуун шугам давамгайлсан нүүр.",
    crops: { brows: box, eyes: box, nose: box, lips: box, chin: box },
  };
}

describe("larson verdict", () => {
  it("accepts one of the four Larson types", () => {
    const verdict = checkLarsonVerdict(ready("Gamine"));
    expect(verdict?.status).toBe("ready");
    if (verdict?.status === "ready") expect(verdict.reading.type).toBe("Gamine");
  });

  it("rejects a type outside Larson", () => {
    expect(checkLarsonVerdict(ready("Classic"))).toBeNull();
    expect(checkLarsonVerdict({ status: "retake", retakeTarget: "video", instructions: [] })).toBeNull();
  });

  it("keeps a usable reading when a crop sits slightly outside the frame", () => {
    const verdict = checkLarsonVerdict({
      ...ready(),
      traits: { ...ready().traits, chin: "" },
      summary: "",
      crops: { ...ready().crops, chin: { x: 0.2, y: 0.9, w: 0.95, h: 0.2 } },
    });
    expect(verdict?.status).toBe("ready");
    if (verdict?.status !== "ready") return;
    expect(verdict.reading.traits.chin).toBe("Энэ хэсэг зураг дээр тодорхойгүй.");
    expect(verdict.reading.summary.length).toBeGreaterThan(0);
    expect(verdict.reading.crops.chin.x + verdict.reading.crops.chin.w).toBeLessThanOrEqual(1);
  });

  it("turns a ready result with no Larson type into a retake", () => {
    const verdict = checkLarsonVerdict({ ...ready("none"), retakeTarget: "none", instructions: [] });
    expect(verdict?.status).toBe("retake");
    if (verdict?.status === "retake") expect(verdict.retake.instructions.length).toBeGreaterThan(0);
  });

  it("keeps a retake that names the file to repeat", () => {
    const verdict = checkLarsonVerdict({ status: "retake", retakeTarget: "both", instructions: ["Нүүрээ бүтэн харуулна уу."] });
    expect(verdict).toEqual({ status: "retake", retake: { target: "both", instructions: ["Нүүрээ бүтэн харуулна уу."] } });
  });
});
