import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { sendEmail } from "./email";
import { ensureQuizReportPdf } from "./face-report-pdf";
import { getStore } from "./store";

const quizId = process.env.FACE_PDF_QUIZ;
const to = process.env.FACE_PDF_TO;
const photoPath = process.env.FACE_PDF_PHOTO;

describe.skipIf(!quizId || !to)("deliver face pdf", () => {
  it("builds the 25-page pdf and emails it", async () => {
    const quiz = await getStore().getAiQuiz(quizId!);
    expect(quiz?.kind).toBeTruthy();
    const photo = photoPath ? await readFile(photoPath) : undefined;
    const pdf = await ensureQuizReportPdf(quiz!, photo ? { referencePhoto: photo } : undefined);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    const sent = await sendEmail({
      to: to!,
      subject: "Naruka — таны хувийн тайлан бэлэн боллоо",
      text: [
        "Сайн байна уу.",
        "",
        "Таны хувийн тайлан бэлэн боллоо.",
        "25 хуудастай PDF хавсаргав.",
        photo
          ? "Оруулсан зургийг хавсаргав. Хуудас бүрийн жишээ зураг энэ зурган дээр үндэслэсэн."
          : "Хуудас бүрийн жишээ зураг нь маникен дээрх загвар. Хэрэглэгчийн зураг биш.",
        "",
        "— Naruka Styling Studio",
      ].join("\n"),
      attachments: [
        { filename: `naruka-${quiz!.kind}-report.pdf`, content: pdf },
        ...(photo ? [{ filename: "naruka-uploaded-photo.jpg", content: photo }] : []),
      ],
    });
    expect(sent.skipped).toBe(false);
    await getStore().updateAiQuiz(quizId!, (current) => ({ ...current, reportStatus: "sent" }));
  }, 2_400_000);
});
