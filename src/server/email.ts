import { AppError } from "@/domain/errors";

export async function sendEmail(input: { to: string; subject: string; text: string }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!key || !from) {
    if (process.env.NODE_ENV === "production") throw new AppError("email_unconfigured", 500);
    return { skipped: true as const };
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: input.to, subject: input.subject, text: input.text }),
  });
  if (!response.ok) throw new AppError("email_failed", 502);
  return { skipped: false as const };
}
