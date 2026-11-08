import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TAP_PRICE_MNT } from "@/domain/tap";
import type { LarsonReading } from "@/domain/tap";
import { AppError } from "@/domain/errors";
import { blankUser } from "./auth";
import { sendEmail } from "./email";
import { readLarson } from "./larson-analysis";
import { renderTapPdf } from "./larson-report-pdf";
import { loadProfile } from "./profile-service";
import { createInvoice } from "./qpay";
import { getStore, resetStoreForTests } from "./store";
import { createTapCheckout, downloadTapPdf, saveTapMedia, simulateTap } from "./tap-service";

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

const { reading } = vi.hoisted(() => {
  const reading: LarsonReading = {
    type: "Natural",
    traits: { face: "Тайван нүүр", brows: "Зөөлөн хөмсөг", eyes: "Нээлттэй нүд", nose: "Зөөлөн хамар", lips: "Бүдэг уруул", chin: "Зөөлөн эрүү" },
    summary: "Тайван шугам давамгайлна.",
    crops: {
      brows: { x: 0.2, y: 0.2, w: 0.4, h: 0.2 },
      eyes: { x: 0.2, y: 0.3, w: 0.4, h: 0.2 },
      nose: { x: 0.3, y: 0.45, w: 0.3, h: 0.2 },
      lips: { x: 0.3, y: 0.62, w: 0.3, h: 0.15 },
      chin: { x: 0.3, y: 0.75, w: 0.3, h: 0.15 },
    },
  };
  return { reading };
});

vi.mock("./email", () => ({ sendEmail: vi.fn(async () => ({ skipped: true })) }));
vi.mock("./larson-analysis", () => ({
  readLarson: vi.fn(async (images: Buffer[]) => ({ verdict: { status: "ready", reading }, images })),
}));
vi.mock("./larson-report-pdf", () => ({ renderTapPdf: vi.fn(async () => Buffer.from("%PDF-1.4")) }));
vi.mock("./qpay", () => ({
  createInvoice: vi.fn(async () => ({ invoiceId: "inv_tap", qrImage: undefined, urls: [] })),
  checkInvoice: vi.fn(),
  simulatePayAllowed: () => true,
}));
vi.mock("./video-frames", () => ({
  extractVideoFrames: vi.fn(async () => ({ frames: [PNG, PNG, PNG], mp4: Buffer.alloc(32, 1) })),
}));

describe("1 TAP checkout", () => {
  const user = blankUser("user_tap");

  beforeEach(async () => {
    resetStoreForTests();
    await getStore().saveUser(user);
    vi.mocked(sendEmail).mockClear();
    vi.mocked(createInvoice).mockClear();
    vi.mocked(readLarson).mockClear();
    vi.mocked(renderTapPdf).mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("invoices before the pdf and then keeps the report on the account", async () => {
    const media = await saveTapMedia(user, { photo: PNG, video: Buffer.from("video-bytes-are-enough-here"), consent: true });
    const created = await createTapCheckout(user, { email: "saraa@example.com", bodyShape: "hourglass", ...media });
    expect(created.amount).toBe(TAP_PRICE_MNT);
    expect(created.paymentStatus).toBe("invoiced");
    expect(createInvoice).toHaveBeenCalledTimes(1);
    await expect(downloadTapPdf({ ...user, email: "saraa@example.com" }, created.id)).rejects.toMatchObject({ code: "unpaid", status: 402 });

    const paid = await simulateTap({ ...user, email: "saraa@example.com" }, created.id);
    expect(paid.tap.paymentStatus).toBe("paid");
    await vi.waitFor(async () => {
      expect((await getStore().getTap(created.id))?.reportStatus).toBe("sent");
    });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const profile = await loadProfile({ ...user, email: "saraa@example.com" });
    expect(profile.reports.some((report) => report.id === created.id && report.title === "1 TAP" && report.pdf)).toBe(true);
    const pdf = await downloadTapPdf({ ...user, email: "saraa@example.com" }, created.id);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("refuses checkout without consent", async () => {
    await expect(saveTapMedia(user, { photo: PNG, video: PNG, consent: false })).rejects.toBeInstanceOf(AppError);
  });
});
