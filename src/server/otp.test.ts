import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { blankUser, requestEmailOtp, verifyEmailOtp } from "./auth";
import { getStore, resetStoreForTests } from "./store";

async function guest() {
  const user = blankUser();
  await getStore().saveUser(user);
  return user;
}

describe("email otp", () => {
  beforeEach(() => {
    resetStoreForTests();
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
  });

  it("sends only a code from the OTP alias", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.RESEND_FROM_EMAIL = "App <noreply@example.com>";
    const user = await guest();
    let sent: { from?: string; to?: string; subject?: string; text?: string } = {};
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        sent = JSON.parse(String(init?.body));
        return new Response("{}", { status: 200 });
      }),
    );

    const result = await requestEmailOtp(user.id, "person@example.com");
    expect(result).toEqual({ sent: true, development: false });
    expect(sent.from).toBe("OTP <noreply@example.com>");
    expect(sent.to).toBe("person@example.com");
    expect(sent.subject).toBe("1 удаагийн баталгаажуулах код");
    expect(sent.text).not.toMatch(/https?:\/\//);
    const code = sent.text?.match(/\d{6}/)?.[0];
    expect(code).toBeTruthy();
    const stored = await getStore().getEmailOtp("person@example.com");
    expect(stored?.codeHash).not.toBe(code);
    expect((await getStore().getUser(user.id))?.email).toBeNull();

    const account = await verifyEmailOtp(user.id, "person@example.com", code!);
    expect(account.email).toBe("person@example.com");
    expect(await getStore().getEmailOtp("person@example.com")).toBeNull();
  });

  it("rejects a wrong code", async () => {
    const user = await guest();
    const issued = await requestEmailOtp(user.id, "person@example.com");
    expect(issued.development).toBe(true);
    if (!issued.development) return;
    const wrong = issued.code === "000000" ? "111111" : "000000";
    await expect(verifyEmailOtp(user.id, "person@example.com", wrong)).rejects.toMatchObject({
      code: "invalid_code",
      status: 400,
    });
    expect((await getStore().getUser(user.id))?.email).toBeNull();
    expect((await getStore().getEmailOtp("person@example.com"))?.attempts).toBe(1);
  });

  it("rejects an expired code", async () => {
    const user = await guest();
    const issued = await requestEmailOtp(user.id, "person@example.com");
    if (!issued.development) throw new Error("expected a development code");
    const row = await getStore().getEmailOtp("person@example.com");
    await getStore().saveEmailOtp({ ...row!, expiresAt: Date.now() - 1 });
    await expect(verifyEmailOtp(user.id, "person@example.com", issued.code)).rejects.toMatchObject({
      code: "code_expired",
      status: 400,
    });
    expect(await getStore().getEmailOtp("person@example.com")).toBeNull();
    expect((await getStore().getUser(user.id))?.email).toBeNull();
  });

  it("attaches the email after the right code", async () => {
    const user = await guest();
    const issued = await requestEmailOtp(user.id, "Person@Example.com");
    if (!issued.development) throw new Error("expected a development code");
    const account = await verifyEmailOtp(user.id, "person@example.com", issued.code);
    expect(account.id).toBe(user.id);
    expect(account.email).toBe("person@example.com");
    expect(account.anonymous).toBe(false);
    expect(await getStore().getEmailOtp("person@example.com")).toBeNull();
  });
});
