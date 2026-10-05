import { AppError } from "@/domain/errors";

export function otpSender(configured: string) {
  const trimmed = configured.trim();
  const wrapped = trimmed.match(/<([^>]+)>/);
  const address = (wrapped?.[1] ?? trimmed).trim();
  return `OTP <${address}>`;
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  from?: string;
  attachments?: { filename: string; content: Buffer }[];
}) {
  const key = process.env.RESEND_API_KEY;
  const from = input.from ?? process.env.RESEND_FROM_EMAIL;
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
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      attachments: input.attachments?.map((file) => ({
        filename: file.filename,
        content: file.content.toString("base64"),
      })),
    }),
  });
  if (!response.ok) throw new AppError("email_failed", 502);
  return { skipped: false as const };
}
