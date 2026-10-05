import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { tokenExpiry } from "./qpay";

const BASE = "https://merchant-sandbox.qpay.mn";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

async function freshQpay() {
  vi.resetModules();
  return import("./qpay");
}

describe("qpay token", () => {
  beforeEach(() => {
    process.env.QPAY_BASE_URL = BASE;
    process.env.QPAY_CLIENT_ID = "client";
    process.env.QPAY_CLIENT_SECRET = "secret";
    process.env.QPAY_INVOICE_CODE = "TEST_INVOICE";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    delete process.env.QPAY_BASE_URL;
    delete process.env.QPAY_CLIENT_ID;
    delete process.env.QPAY_CLIENT_SECRET;
    delete process.env.QPAY_INVOICE_CODE;
  });

  it("reads expires_in as a Unix timestamp in seconds", () => {
    const now = Date.UTC(2026, 9, 5, 8);
    const epoch = now / 1000 + 24 * 3600;
    expect(tokenExpiry(epoch, now)).toBe(epoch * 1000);
    expect(tokenExpiry(300, now)).toBe(now + 300_000);
    expect(tokenExpiry(undefined, now)).toBe(now + 300_000);
  });

  it("fetches a new token once the QPay expiry passes", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.UTC(2026, 9, 5, 8));
    const expiresAt = Math.floor(Date.now() / 1000) + 24 * 3600;
    let issued = 0;
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).endsWith("/v2/auth/token")) {
        issued += 1;
        return jsonResponse({ access_token: `token-${issued}`, expires_in: expiresAt });
      }
      const headers = init?.headers as Record<string, string>;
      expect(headers.Authorization).toBe(`Bearer token-${issued}`);
      return jsonResponse({ count: 0, rows: [] });
    });
    vi.stubGlobal("fetch", fetchMock);
    const { checkInvoice } = await freshQpay();

    await checkInvoice("inv_1");
    vi.setSystemTime(Date.UTC(2026, 9, 5, 20));
    await checkInvoice("inv_1");
    expect(issued).toBe(1);

    vi.setSystemTime(Date.UTC(2026, 9, 6, 9));
    await checkInvoice("inv_1");
    expect(issued).toBe(2);
  });

  it("retries once with a new token when QPay answers 401", async () => {
    let issued = 0;
    const calls: string[] = [];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).endsWith("/v2/auth/token")) {
        issued += 1;
        return jsonResponse({ access_token: `token-${issued}`, expires_in: Math.floor(Date.now() / 1000) + 3600 });
      }
      const auth = (init?.headers as Record<string, string>).Authorization;
      calls.push(auth);
      if (auth === "Bearer token-1") return jsonResponse({ error: "NO_CREDENDIALS" }, 401);
      expect((init?.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
      return jsonResponse({
        count: 1,
        rows: [{ payment_status: "PAID", payment_amount: "29900", payment_id: "pay_1" }],
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const { checkInvoice } = await freshQpay();

    const observed = await checkInvoice("inv_1");
    expect(calls).toEqual(["Bearer token-1", "Bearer token-2"]);
    expect(observed).toMatchObject({ paid: true, amount: 29900, paymentId: "pay_1" });
  });
});
