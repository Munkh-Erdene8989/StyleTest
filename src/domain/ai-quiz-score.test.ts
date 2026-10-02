import { describe, expect, it } from "vitest";
import { faceQuestions } from "@/content/quizzes/face-beauty";
import type { AiAnswer } from "@/domain/ai-quiz";
import { pickWinner, scoreArchetype, scoreBody, scoreFace, type BodyBank } from "@/domain/ai-quiz-score";
import { bodyQuizBank, publicQuestions } from "@/server/ai-quiz-banks";

function single(optionId: string): AiAnswer {
  return { type: "single", optionId };
}

describe("ai quiz scoring", () => {
  it("does not invent a face shape when answers are missing", () => {
    const scored = scoreFace({});
    expect(scored.brief.status).toBe("insufficient_data");
    expect(scored.brief.sections.map((section) => section.body).join(" ")).not.toContain("Зууван");
  });

  it("leaves a tie without picking a winner", () => {
    expect(pickWinner([["oval", 2], ["round", 2]])).toEqual({ winner: null, tied: ["oval", "round"] });
    expect(pickWinner([["oval", 3], ["round", 1]])).toEqual({ winner: "oval", tied: [] });
  });

  it("classifies a pear body only after enough known answers", () => {
    const bank = bodyQuizBank();
    const pear = {
      q01: single("q01_o3"),
      q02: single("q02_o3"),
      q03: single("q03_o2"),
      q04: single("q04_o2"),
      q05: single("q05_o2"),
      q06: single("q06_o2"),
    };
    expect(scoreBody(bank, pear).brief.sections[0]?.heading).toBe("Лийр хэлбэр");
    const sparse = { q01: single("q01_o3"), q02: single("q02_o3"), q04: single("q04_o2") };
    expect(scoreBody(bank, sparse).brief.status).toBe("insufficient_data");
    expect(scoreBody(bank, sparse).brief.sections[0]?.heading).not.toBe("Лийр хэлбэр");
  });

  it("does not impute skipped archetype answers", () => {
    const bank = {
      dimensions: [{ id: "SOC" }, { id: "EXP" }],
      questions: [
        { id: "a1", dimension: "SOC", text: "Нэг" },
        { id: "a2", dimension: "EXP", text: "Хоёр", reverse: true },
      ],
    };
    const partial = scoreArchetype(bank, { a1: single("5") });
    expect(partial.brief.status).toBe("insufficient_data");
    const full = scoreArchetype(bank, { a1: single("5"), a2: single("5") });
    expect(full.brief.status).toBe("ready");
    expect(full.brief.sections[0]?.heading).toBe("Холбогч");
  });

  it("keeps face question count", () => {
    expect(faceQuestions).toHaveLength(32);
    expect(JSON.stringify(publicQuestions("face_beauty"))).not.toContain("scores");
    const bank: BodyBank = bodyQuizBank();
    expect(bank.questions.length).toBeGreaterThan(6);
  });
});
