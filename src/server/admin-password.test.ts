import { beforeEach, describe, expect, it } from "vitest";
import { blankUser } from "./auth";
import { confirmAdminPasswordReset, loginWithPassword, requestAdminPasswordReset, requestEmailOtp, verifyEmailOtp } from "./auth";
import { getStore, resetStoreForTests } from "./store";

const ADMIN = "m.erdene8989@gmail.com";

describe("sole admin password", () => {
  beforeEach(() => {
    resetStoreForTests();
    process.env.BOOTSTRAP_ADMIN_EMAIL = ADMIN;
    process.env.BOOTSTRAP_SENSITIVE_EMAIL = ADMIN;
    process.env.ADMIN_PASSWORD = "0103";
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
  });

  it("accepts the env password, then only the password set from the email link", async () => {
    const guest = blankUser();
    await getStore().saveUser(guest);
    const signedIn = await loginWithPassword(guest.id, ADMIN, "0103");
    expect(signedIn.role).toBe("ops_sensitive");

    const reset = await requestAdminPasswordReset(ADMIN, "https://admin.naruka.mn");
    if (!("token" in reset) || !reset.token) throw new Error("expected a development reset token");
    await confirmAdminPasswordReset(reset.token, "studio-desk");

    await expect(loginWithPassword(guest.id, ADMIN, "0103")).rejects.toMatchObject({ code: "invalid_code" });
    const again = await loginWithPassword(guest.id, "M.Erdene8989@gmail.com", "studio-desk");
    expect(again.email).toBe(ADMIN);
    expect(again.role).toBe("ops_sensitive");
  });

  it("refuses a reset for any other email and does not grant admin through a one-time code", async () => {
    const guest = blankUser();
    await getStore().saveUser(guest);
    await expect(requestAdminPasswordReset("other@example.com", "https://admin.naruka.mn")).rejects.toMatchObject({
      code: "invalid_email",
    });
    const sent = await requestEmailOtp(guest.id, ADMIN);
    if (!("code" in sent)) throw new Error("expected a development code");
    const account = await verifyEmailOtp(guest.id, ADMIN, sent.code);
    expect(account.role).toBe("user");
  });
});
