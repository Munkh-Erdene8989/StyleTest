import type { Session } from "./types";

export type TrackProgress = {
  answered: number;
  questions: number;
  reportDone: number;
  reportTotal: number;
  reportLabel: string;
  failed: boolean;
};

export function answerCounts(session: Pick<Session, "kind" | "answers" | "styleInput">, questionTotal: number) {
  if (session.kind === "style") {
    const input = session.styleInput;
    const done = [
      (input?.likedIds.length ?? 0) + (input?.aspireIds.length ?? 0) > 0,
      Boolean(input?.comfort?.trim() || input?.request?.trim()),
      Boolean(input?.faceUploadId && input?.bodyUploadId),
    ].filter(Boolean).length;
    return { answered: done, questions: 3 };
  }
  const questions = Math.max(questionTotal, 1);
  return { answered: Math.min(Object.keys(session.answers).length, questions), questions };
}

export function reportCounts(input: { jobStatus: string | null; ready: boolean }): Pick<TrackProgress, "reportDone" | "reportTotal" | "reportLabel" | "failed"> {
  if (input.jobStatus === "failed") {
    return { reportDone: 1, reportTotal: 1, reportLabel: "Тайлан амжилтгүй", failed: true };
  }
  if (input.jobStatus === "processing") {
    return { reportDone: 2, reportTotal: 3, reportLabel: "Тайлан бэлтгэгдэж байна", failed: false };
  }
  if (input.jobStatus === "pending") {
    return { reportDone: 1, reportTotal: 3, reportLabel: "Тайлан хүлээгдэж байна", failed: false };
  }
  if (input.ready || input.jobStatus === "ready") {
    return { reportDone: 1, reportTotal: 1, reportLabel: "Тайлан бэлэн", failed: false };
  }
  return { reportDone: 0, reportTotal: 1, reportLabel: "Тайлан хараахан гараагүй", failed: false };
}
