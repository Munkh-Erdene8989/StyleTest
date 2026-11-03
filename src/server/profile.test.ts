import { describe, expect, it } from "vitest";
import { faceQuestions } from "@/content/quizzes/face-beauty";
import type { AiAnswer, AiQuizRecord } from "@/domain/ai-quiz";
import { figureFromBodyShape, yearMonth } from "@/domain/profile";
import type { StyleQuizRecord } from "@/domain/style-quiz";
import type { Report, User } from "@/domain/types";
import { blankUser } from "./auth";
import { loadProfile, updateProfile } from "./profile-service";
import { resetStoreForTests } from "./store";

function single(optionId: string): AiAnswer {
  return { type: "single", optionId };
}

const pear = {
  q01: single("q01_o3"),
  q02: single("q02_o3"),
  q03: single("q03_o2"),
  q04: single("q04_o2"),
  q05: single("q05_o2"),
  q06: single("q06_o2"),
};

describe("profile", () => {
  it("labels a month in Ulaanbaatar time and maps the straight shape to banana", () => {
    expect(yearMonth("2026-10-31T16:30:00.000Z")).toEqual({ year: 2026, month: 11, label: "2026 оны 11-р сар" });
    expect(figureFromBodyShape("rectangle")).toBe("banana");
    expect(figureFromBodyShape("inverted_triangle")).toBeNull();
  });

  it("shows shapes from completed tests and keeps a manual figure", async () => {
    const store = resetStoreForTests();
    const user = blankUser("user_profile");
    user.email = "saraa@example.com";
    user.dateOfBirth = "1994-04-02";
    user.ageBand = "adult";
    user.anonymous = false;
    await store.saveUser(user);
    await store.saveAiQuiz(quiz("aiq_old", "body_shape", pear, "2026-08-01T00:00:00.000Z", "paid"));
    await store.saveAiQuiz(quiz("aiq_new", "body_shape", {}, "2026-09-01T00:00:00.000Z", "invoiced"));
    await store.saveAiQuiz(quiz("aiq_face", "face_beauty", faceAnswers(), "2026-11-02T00:00:00.000Z", "paid"));
    await store.saveStyleQuiz(styleQuiz());
    await store.saveReport(classicReport(user.id));

    const view = await loadProfile(user);
    expect(view.age).toBeGreaterThan(30);
    expect(view.bodyShape).toBe("Лийр хэлбэр");
    expect(view.bodyFigure).toBe("pear");
    expect(view.faceShape).toBeTruthy();
    expect(view.reports.map((item) => item.title)).toEqual([
      "Нүүр ба гоо сайхан",
      "Стайлын зөвлөмж",
      "Биеийн хэлбэр ба хувцаслалт",
      "Биеийн хэлбэр ба хувцаслалт",
      "Хөгжилтэй",
    ]);
    expect(view.reports.find((item) => item.id === "aiq_new")?.pdf).toBe(false);
    expect(view.reports.find((item) => item.id === "aiq_face")?.label).toBe("2026 оны 11-р сар");

    const saved = await updateProfile(user, {
      dateOfBirth: "1994-04-02",
      gender: "female",
      email: "saraa@example.com",
      phone: "9911 2233",
      bodyFigure: "hourglass",
    });
    expect(saved.phone).toBe("99112233");
    expect(saved.gender).toBe("female");
    expect(saved.bodyFigure).toBe("hourglass");
    expect(saved.bodyFigureSet).toBe(true);
    expect((await loadProfile(saved)).bodyFigure).toBe("hourglass");
    expect((await loadProfile(saved)).bodyShape).toBe("Лийр хэлбэр");

    const followed = await updateProfile(saved, {
      dateOfBirth: "1994-04-02",
      gender: "female",
      email: "saraa@example.com",
      phone: "99112233",
      bodyFigure: "pear",
    });
    expect(followed.bodyFigureSet).toBe(false);
    expect((await loadProfile(followed)).bodyFigure).toBe("pear");
    await expect(updateProfile(followed, {
      dateOfBirth: "1994-04-02",
      gender: "female",
      email: "saraa@example.com",
      phone: "12",
      bodyFigure: "pear",
    })).rejects.toMatchObject({ code: "invalid_phone" });
  });
});

function quiz(id: string, kind: AiQuizRecord["kind"], answers: Record<string, AiAnswer>, createdAt: string, paymentStatus: "paid" | "invoiced"): AiQuizRecord {
  return {
    id,
    kind,
    ownerUid: "user_profile",
    email: "saraa@example.com",
    answers,
    amount: 150,
    currency: "MNT",
    paymentStatus,
    urls: [],
    brief: null,
    detail: null,
    reportStatus: paymentStatus === "paid" ? "sent" : "pending",
    createdAt,
    paidAt: paymentStatus === "paid" ? createdAt : undefined,
  };
}

function faceAnswers() {
  return Object.fromEntries(faceQuestions.map((question) => [question.id, single(question.options[0]?.id ?? "")]));
}

function styleQuiz(): StyleQuizRecord {
  return {
    id: "quiz_style",
    name: "Сараа",
    email: "saraa@example.com",
    answers: { undertone: { value: "warm", label: "Дулаан", insight: "Дулаан өнгө зохино." } },
    amount: 150,
    currency: "MNT",
    paymentStatus: "paid",
    urls: [],
    reportStatus: "sent",
    createdAt: "2026-10-03T00:00:00.000Z",
    paidAt: "2026-10-03T00:00:00.000Z",
  };
}

function classicReport(ownerUid: string): Report {
  return {
    id: "rep_fun",
    sessionId: "ses_fun",
    ownerUid,
    versionId: "v1",
    kind: "fun",
    summary: { title: "Хөгжилтэй", body: "Товч" },
    outline: [],
    fullContent: null,
    assetPaths: [],
    priceMnt: 0,
    createdAt: "2026-03-15T00:00:00.000Z",
  };
}
