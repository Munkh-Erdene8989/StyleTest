import { randomUUID } from "crypto";
import { after } from "next/server";
import { TAP_PRICE_MNT, tapBodyShape, type TapRecord, type TapRetake } from "@/domain/tap";
import { AppError } from "@/domain/errors";
import { paymentRequired, type ObservedPayment } from "@/domain/payment";
import { iso } from "@/domain/time";
import type { Upload, User } from "@/domain/types";
import { assumeAdult, attachEmail } from "./auth";
import { sendEmail } from "./email";
import { readLarson } from "./larson-analysis";
import { renderTapPdf } from "./larson-report-pdf";
import { limit } from "./limit";
import { checkInvoice, createInvoice, simulatePayAllowed } from "./qpay";
import { settlePayment } from "./settlement";
import { getStore } from "./store";
import { prepareTapPhoto, prepareTapVideo } from "./tap-media";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REPORT_LOCK_MS = 15 * 60 * 1000;

export async function saveTapMedia(user: User, input: { photo: Buffer; video: Buffer; consent: boolean }) {
  if (!input.consent) throw new AppError("consent_required", 400);
  await limit(user.id, "tap_upload", 12);
  const photo = await prepareTapPhoto(input.photo);
  const prepared = await prepareTapVideo(input.video);
  const store = getStore();
  const videoPath = `private/${user.id}/tap-video/${randomUUID()}.mp4`;
  await store.putObject(videoPath, prepared.mp4, "video/mp4");
  const photoUpload = await storeFace(user, photo.bytes);
  const frameUploads = [];
  for (const frame of prepared.frames) frameUploads.push(await storeFace(user, frame.bytes));
  return { photoId: photoUpload.id, frameIds: frameUploads.map((item) => item.id), videoPath };
}

export async function createTapCheckout(user: User, input: { email: string; photoId: string; frameIds: unknown; videoPath: string; bodyShape: unknown }) {
  const email = cleanEmail(input.email);
  if (!EMAIL.test(email)) throw new AppError("invalid_contact", 400);
  const bodyShape = tapBodyShape(input.bodyShape);
  if (!bodyShape) throw new AppError("invalid_body", 400);
  const frameIds = stringIds(input.frameIds);
  if (frameIds.length !== 3) throw new AppError("invalid_video", 400);
  if (!input.videoPath.startsWith(`private/${user.id}/tap-video/`)) throw new AppError("invalid_video", 400);
  const video = await getStore().getObject(input.videoPath);
  if (!video?.bytes.length) throw new AppError("invalid_video", 400);
  await limit(email, "tap_create", 8);
  const stored = await assumeAdult((await getStore().getUser(user.id)) ?? user);
  const owner = stored.email ? stored : await attachEmail(stored.id, email);
  await ownUpload(owner, input.photoId);
  for (const id of frameIds) await ownUpload(owner, id);
  const tap: TapRecord = {
    id: `tap_${randomUUID()}`,
    ownerUid: owner.id,
    email,
    amount: TAP_PRICE_MNT,
    currency: "MNT",
    paymentStatus: "invoiced",
    urls: [],
    photoUploadId: input.photoId,
    frameUploadIds: frameIds,
    videoPath: input.videoPath,
    bodyShape,
    reportStatus: "pending",
    reading: null,
    retake: null,
    createdAt: iso(),
  };
  await linkUploads(owner, tap);
  if (!paymentRequired() || tap.amount === 0) {
    tap.paymentStatus = "paid";
    tap.paidAt = iso();
    await getStore().saveTap(tap);
    scheduleReport(tap);
    return publicTap(tap, owner.id);
  }
  const invoice = await createInvoice({ id: tap.id, amount: tap.amount, description: "Naruka 1 TAP" });
  tap.qpayInvoiceId = invoice.invoiceId;
  tap.qrImage = invoice.qrImage;
  tap.urls = invoice.urls;
  await getStore().saveTap(tap);
  return publicTap(tap, owner.id);
}

export async function readTap(user: User, id: string) {
  const tap = await loadOwned(user, id);
  if (tap.paymentStatus === "paid") scheduleReport(tap);
  return publicTap(tap);
}

export async function confirmTap(user: User, id: string) {
  await limit(id, "tap_check", 90, 10 * 60 * 1000);
  const tap = await loadOwned(user, id);
  if (!tap.qpayInvoiceId) throw new AppError("invoice_missing", 400);
  const observed = await checkInvoice(tap.qpayInvoiceId);
  return applyTapObservation(tap.id, observed);
}

export async function simulateTap(user: User, id: string) {
  if (!simulatePayAllowed()) throw new AppError("simulate_disabled", 403);
  const tap = await loadOwned(user, id);
  return applyTapObservation(tap.id, {
    paid: true,
    amount: tap.amount,
    currency: "MNT",
    paymentId: `sim_${tap.id}`,
    channel: "other",
  });
}

export async function retryTap(user: User, id: string) {
  const tap = await loadOwned(user, id);
  if (tap.paymentStatus !== "paid") throw new AppError("unpaid", 402);
  if (reportLocked(tap)) return publicTap(tap);
  await getStore().updateTap(id, (current) => {
    if (reportLocked(current)) return current;
    return { ...current, reportStatus: "pending", reportStartedAt: undefined, retake: null };
  });
  scheduleReport({ ...tap, reportStatus: "pending", reportStartedAt: undefined, retake: null });
  return publicTap({ ...tap, reportStatus: "pending", retake: null });
}

export async function replaceTapMedia(user: User, id: string, input: { photo: Buffer; video: Buffer; consent: boolean }) {
  const tap = await loadOwned(user, id);
  if (tap.paymentStatus !== "paid") throw new AppError("unpaid", 402);
  const owner = (await getStore().getUser(tap.ownerUid)) ?? user;
  const saved = await saveTapMedia(owner, input);
  await getStore().deleteObject(pdfKey(tap));
  await getStore().updateTap(id, (current) => ({
    ...current,
    photoUploadId: saved.photoId,
    frameUploadIds: saved.frameIds,
    videoPath: saved.videoPath,
    reading: null,
    retake: null,
    reportStatus: "pending",
    reportStartedAt: undefined,
  }));
  const next = await loadOwned(user, id);
  await linkUploads(owner, next);
  scheduleReport(next);
  return publicTap(next);
}

export async function downloadTapPdf(user: User, id: string) {
  const tap = await loadTap(id);
  if (!sameAccount(user, tap)) throw new AppError("not_found", 404);
  if (tap.paymentStatus !== "paid") throw new AppError("unpaid", 402);
  if (tap.retake) throw new AppError("retake_required", 409);
  const pdf = await ensureTapPdf(tap);
  return pdf;
}

export async function fulfillTap(id: string) {
  const store = getStore();
  const current = await store.getTap(id);
  if (!current || current.paymentStatus !== "paid" || reportLocked(current)) return;
  const startedAt = iso();
  const { previous } = await store.updateTap(id, (tap) => {
    if (reportLocked(tap)) return tap;
    return { ...tap, reportStatus: "sending", reportStartedAt: startedAt };
  });
  if (reportLocked(previous)) return;
  try {
    const images = await tapImages(current);
    const resolved = await readLarson(images, current.bodyShape);
    const verdict = resolved.verdict;
    if (!verdict) throw new Error("larson_unread");
    if (verdict.status === "retake") {
      await store.updateTap(id, (tap) => ({ ...tap, reportStatus: "failed", retake: verdict.retake, reading: null }));
      await sendEmail({
        to: current.email,
        subject: "Naruka — зургаа дахин оруулна уу",
        text: ["Сайн байна уу.", "", "1 TAP тайлан гаргахад зураг эсвэл бичлэг хангалтгүй байна.", ...verdict.retake.instructions, "", "— Naruka Styling Studio"].join("\n"),
      });
      return;
    }
    const pdf = await renderTapPdf(resolved.images[0], verdict.reading, current.bodyShape);
    await store.putObject(pdfKey(current), pdf, "application/pdf");
    await sendEmail({
      to: current.email,
      subject: "Naruka — 1 TAP тайлан бэлэн боллоо",
      text: ["Сайн байна уу.", "", "Нүүрний хэлбэр болон Larson биеийн загварын 2 хуудастай PDF хавсаргав.", "", "— Naruka Styling Studio"].join("\n"),
      attachments: [{ filename: "naruka-1-tap.pdf", content: pdf }],
    });
    await store.updateTap(id, (tap) => ({ ...tap, reading: verdict.reading, retake: null, reportStatus: "sent" }));
  } catch (error) {
    console.error("tap_report_failed", error instanceof Error ? error.message.slice(0, 180) : "unknown");
    await store.updateTap(id, (tap) => ({ ...tap, reportStatus: "failed" }));
  }
}

export async function applyTapObservation(id: string, observed: ObservedPayment) {
  const store = getStore();
  const current = await store.getTap(id);
  if (!current) throw new AppError("not_found", 404);
  const settled = await settlePayment(current, observed, {
    commit: (stamp) =>
      store.updateTap(id, (tap) => {
        if (tap.paymentStatus === "paid") return tap;
        return { ...tap, paymentStatus: "paid", qpayPaymentId: stamp.qpayPaymentId, paidAt: stamp.paidAt };
      }),
    afterPaid: (tap) => scheduleReport(tap),
    afterDuplicate: (tap) => scheduleReport(tap),
  });
  return { duplicate: settled.duplicate, tap: publicTap(settled.record), reason: settled.reason };
}

async function ensureTapPdf(tap: TapRecord) {
  const stored = await getStore().getObject(pdfKey(tap));
  if (stored?.bytes.length) return stored.bytes;
  if (!tap.reading) throw new AppError("report_pending", 409);
  const images = await tapImages(tap);
  const pdf = await renderTapPdf(images[0], tap.reading, tap.bodyShape);
  await getStore().putObject(pdfKey(tap), pdf, "application/pdf");
  return pdf;
}

async function tapImages(tap: TapRecord) {
  const photo = await uploadBytes(tap.photoUploadId, tap.ownerUid);
  const frames = [];
  for (const id of tap.frameUploadIds) frames.push(await uploadBytes(id, tap.ownerUid));
  if (!photo || frames.length !== 3 || frames.some((item) => !item)) throw new AppError("invalid_image", 400);
  return [photo, ...frames] as Buffer[];
}

async function uploadBytes(id: string, ownerUid: string) {
  const upload = await getStore().getUpload(id);
  if (!upload || upload.ownerUid !== ownerUid || upload.deletedAt) return null;
  const object = await getStore().getObject(upload.path);
  return object?.bytes.length ? object.bytes : null;
}

async function storeFace(user: User, bytes: Buffer) {
  const upload: Upload = {
    id: randomUUID(),
    ownerUid: user.id,
    sessionId: "tap",
    role: "face",
    path: `private/${user.id}/tap-photos/${randomUUID()}`,
    contentType: "image/jpeg",
    consentAt: iso(),
    linked: false,
    createdAt: iso(),
  };
  await getStore().putObject(upload.path, bytes, "image/jpeg");
  await getStore().saveUpload(upload);
  return upload;
}

async function ownUpload(user: User, id: string) {
  const upload = await getStore().getUpload(id);
  if (!upload || upload.ownerUid !== user.id || upload.deletedAt || upload.role !== "face" || !upload.consentAt) {
    throw new AppError("invalid_image", 400);
  }
  return upload;
}

async function linkUploads(user: User, tap: TapRecord) {
  for (const id of [tap.photoUploadId, ...tap.frameUploadIds]) {
    const upload = await ownUpload(user, id);
    upload.linked = true;
    upload.sessionId = tap.id;
    await getStore().saveUpload(upload);
  }
}

function scheduleReport(tap: TapRecord) {
  if (tap.paymentStatus !== "paid" || reportLocked(tap)) return;
  try {
    after(() => fulfillTap(tap.id));
  } catch {
    void fulfillTap(tap.id);
  }
}

function reportLocked(tap: TapRecord, now = Date.now()) {
  if (tap.reportStatus === "sent") return true;
  if (tap.reportStatus !== "sending") return false;
  if (!tap.reportStartedAt) return false;
  const started = new Date(tap.reportStartedAt).getTime();
  return Number.isFinite(started) && now - started < REPORT_LOCK_MS;
}

function publicTap(tap: TapRecord, accountId = tap.ownerUid) {
  const paid = tap.paymentStatus === "paid";
  const qrImage = tap.qrImage ? (tap.qrImage.startsWith("data:") ? tap.qrImage : `data:image/png;base64,${tap.qrImage}`) : undefined;
  return {
    id: tap.id,
    amount: tap.amount,
    currency: tap.currency,
    paymentStatus: tap.paymentStatus,
    email: tap.email,
    qrImage,
    urls: tap.urls,
    simulate: simulatePayAllowed() && tap.paymentStatus !== "paid",
    reportStatus: tap.reportStatus,
    retake: paid ? tap.retake : null,
    type: paid ? tap.reading?.type ?? null : null,
    accountId,
  };
}

async function loadOwned(user: User, id: string) {
  const tap = await loadTap(id);
  if (!sameAccount(user, tap)) throw new AppError("not_found", 404);
  return tap;
}

async function loadTap(id: string) {
  if (!id.startsWith("tap_")) throw new AppError("not_found", 404);
  const tap = await getStore().getTap(id);
  if (!tap) throw new AppError("not_found", 404);
  return tap;
}

function sameAccount(user: User, tap: TapRecord) {
  return tap.ownerUid === user.id || Boolean(user.email && tap.email.toLowerCase() === user.email.toLowerCase());
}

function pdfKey(tap: TapRecord) {
  return `private/${tap.ownerUid}/tap/${tap.id}.pdf`;
}

function cleanEmail(value: string) {
  return String(value ?? "").replace(/\s+/g, "").trim().toLowerCase().slice(0, 160);
}

function stringIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0).slice(0, 3);
}

export type { TapRetake };
