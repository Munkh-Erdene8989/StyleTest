import type { MethodologyVersion, Question, Score } from "./types";
import { AppError } from "./errors";

export function scoreAnswers(version: MethodologyVersion, answers: Record<string, string>): Score {
  let raw = 0;
  for (const question of version.questions) {
    const optionId = answers[question.id];
    const option = question.options.find((item) => item.id === optionId);
    if (!option) throw new AppError("incomplete", 400);
    raw += option.score;
  }
  const band = version.bands.find((item) => raw >= item.min && raw <= item.max);
  if (!band) throw new AppError("score_out_of_range", 500);
  return {
    sessionId: "",
    versionId: version.id,
    raw,
    bandId: band.id,
    computedBy: "deterministic",
  };
}

export function bandFor(version: MethodologyVersion, bandId: string) {
  const band = version.bands.find((item) => item.id === bandId);
  if (!band) throw new AppError("band_missing", 500);
  return band;
}

export function questionAnswerPairs(version: MethodologyVersion, answers: Record<string, string>) {
  return version.questions.map((question) => ({
    question: question.text,
    answer: labelFor(question, answers[question.id]),
  }));
}

function labelFor(question: Question, optionId: string | undefined) {
  return question.options.find((item) => item.id === optionId)?.label ?? "";
}
