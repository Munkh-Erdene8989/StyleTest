import { randomUUID } from "crypto";
import { paidFeaturesAllowed } from "@/domain/age";
import { STYLE_DIRECTIONS, STYLE_EXAMPLES } from "@/domain/content";
import { AppError } from "@/domain/errors";
import { PRICES } from "@/domain/money";
import { entitlementAfterPayment, qpayRefundSupported, refundWindowOpen, verifyObservation } from "@/domain/payment";
import { nextAddonDirection } from "@/domain/style-match";
import { iso } from "@/domain/time";
import type { Entitlement, Order, ProductCode, User } from "@/domain/types";
import { recordOnce } from "./events";
import { limit } from "./limit";
import { checkInvoice, createInvoice, refundCardPayment, simulatePayAllowed } from "./qpay";
import { getStore } from "./store";
import { newJob, ownedSession } from "./session-service";
import { deliverReportEmail, recoverCost } from "./worker";
import { enqueueJob } from "./enqueue";

type PaymentObservation = import("@/domain/payment").ObservedPayment;

export async function createOrder(user: User, input: { sessionId: string; productCode: ProductCode; addonDirectionId?: string }) {
  if (!user.email) throw new AppError("login_required", 401);
  if (!paidFeaturesAllowed(user.ageBand)) throw new AppError("age_restricted", 403);
  await limit(user.id, "order_create", 10);
  const session = await ownedSession(user, input.sessionId);
  if (session.status !== "completed") throw new AppError("incomplete", 400);
  const store = getStore();
  const reportId = input.productCode === "style_addon" ? undefined : `rep_${session.id}`;
  if (input.productCode === "personality_report" && session.kind !== "personality") throw new AppError("invalid_product", 400);
  if (input.productCode === "style_package" && session.kind !== "style") throw new AppError("invalid_product", 400);
  if (input.productCode === "style_addon") {
    const eligible = await addonEligibility(user, session.id);
    if (!eligible.eligible || eligible.directionId !== input.addonDirectionId) throw new AppError("addon_unavailable", 400);
    const base = (await store.listOrdersByOwner(user.id)).find(
      (order) => order.sessionId === session.id && order.productCode === "style_package" && order.paymentStatus === "paid",
    );
    if (!base) throw new AppError("base_unpaid", 400);
  }
  const existing = (await store.listOrdersByOwner(user.id)).find(
    (order) =>
      order.sessionId === session.id &&
      order.productCode === input.productCode &&
      (order.addonDirectionId ?? "") === (input.addonDirectionId ?? "") &&
      (order.paymentStatus === "draft" || order.paymentStatus === "invoiced"),
  );
  if (existing) return existing;
  const amount = PRICES[input.productCode];
  const order: Order = {
    id: `ord_${randomUUID()}`,
    ownerUid: user.id,
    productCode: input.productCode,
    amount,
    currency: "MNT",
    sessionId: session.id,
    reportId: reportId ?? "",
    addonDirectionId: input.addonDirectionId,
    paymentStatus: "draft",
    channel: "unknown",
    createdAt: iso(),
  };
  const invoice = await createInvoice({
    id: order.id,
    amount,
    description: productLabel(input.productCode),
  });
  order.qpayInvoiceId = invoice.invoiceId;
  order.qrImage = invoice.qrImage;
  order.urls = invoice.urls;
  order.paymentStatus = "invoiced";
  if (input.productCode === "style_addon" && input.addonDirectionId) {
    order.reportId = "";
  }
  await store.saveOrder(order);
  await recordOnce(`checkout_started:${order.id}`, {
    name: "checkout_started",
    userId: user.id,
    product: input.productCode,
    sessionId: session.id,
    orderId: order.id,
  });
  return publicOrder(order);
}

export async function confirmOrder(user: User, orderId: string) {
  await limit(`${user.id}:${orderId}`, "payment_check", 6, 10 * 60 * 1000);
  const order = await ownedOrder(user, orderId);
  if (!order.qpayInvoiceId) throw new AppError("invoice_missing", 400);
  const observed = await checkInvoice(order.qpayInvoiceId);
  return applyObservation(order.id, observed);
}

export async function simulateOrder(user: User, orderId: string) {
  if (!simulatePayAllowed()) throw new AppError("simulate_disabled", 403);
  const order = await ownedOrder(user, orderId);
  return applyObservation(order.id, {
    paid: true,
    amount: order.amount,
    currency: "MNT",
    paymentId: `sim_${order.id}`,
    channel: "other",
  });
}

export async function applyCallback(body: Record<string, unknown>, queryInvoice?: string) {
  const invoiceId = stringValue(body.invoice_id) || stringValue(body.object_id) || queryInvoice || "";
  const sender = stringValue(body.sender_invoice_no);
  const store = getStore();
  const order = invoiceId ? await store.findOrderByInvoice(invoiceId) : sender ? await store.getOrder(sender) : null;
  if (!order?.qpayInvoiceId) throw new AppError("not_found", 404);
  const observed = await checkInvoice(order.qpayInvoiceId);
  const result = await applyObservation(order.id, observed);
  return { ok: true, duplicate: result.duplicate };
}

export async function applyObservation(orderId: string, observed: PaymentObservation) {
  const store = getStore();
  const current = await store.getOrder(orderId);
  if (!current) throw new AppError("not_found", 404);
  if (current.paymentStatus === "paid") return { duplicate: true, order: publicOrder(current), reason: "duplicate" };
  const verdict = verifyObservation(current, observed);
  if (!verdict.ok) {
    if (verdict.reason !== "unpaid") {
      await store.saveAudit({
        id: randomUUID(),
        actorId: "system",
        role: "ops",
        action: "payment_rejected",
        target: orderId,
        reason: verdict.reason,
        createdAt: iso(),
      });
    }
    return { duplicate: false, order: publicOrder(current), reason: verdict.reason };
  }
  const { previous, next } = await store.updateOrder(orderId, (order) => {
    if (order.paymentStatus === "paid") return order;
    return {
      ...order,
      paymentStatus: "paid",
      qpayPaymentId: observed.paymentId ?? undefined,
      channel: observed.channel,
      paidAt: iso(),
    };
  });
  if (previous.paymentStatus === "paid") return { duplicate: true, order: publicOrder(next), reason: "duplicate" };
  await grant(next);
  const saved = await store.getOrder(orderId);
  return { duplicate: false, order: publicOrder(saved ?? next), reason: "paid" };
}

async function grant(order: Order) {
  const store = getStore();
  let reportId = order.reportId;
  let job = order.reportId ? await jobForReport(order.reportId) : null;
  if (order.productCode === "style_addon" && order.addonDirectionId) {
    const session = await store.getSession(order.sessionId);
    if (!session) throw new AppError("not_found", 404);
    job = newJob({
      session,
      kind: "style_addon",
      inputHash: order.addonDirectionId,
      addonDirectionId: order.addonDirectionId,
      billablePurchaseId: order.id,
    });
    reportId = `rep_${job.id}`;
    if (!(await store.getJob(job.id))) await store.saveJob(job);
    if (!(await store.getReport(reportId))) {
      await store.saveReport({
        id: reportId,
        sessionId: session.id,
        ownerUid: order.ownerUid,
        versionId: "style-catalog-v1",
        kind: "style_addon",
        summary: { title: "Нэмэлт стайлын чиглэл", body: "Төлбөр баталгаажсан. Дүрслэл бэлтгэгдэж байна." },
        outline: ["Шинэ чиглэл", "Нэг AI дүрслэл"],
        fullContent: null,
        assetPaths: [],
        generationJobId: job.id,
        priceMnt: 1000,
        createdAt: iso(),
      });
    }
    order.reportId = reportId;
    await store.saveOrder(order);
    await enqueueJob(job.id);
  }
  const status = entitlementAfterPayment(job);
  const entitlement: Entitlement = {
    id: `ent_${order.id}`,
    ownerUid: order.ownerUid,
    orderId: order.id,
    targetId: reportId,
    status,
    grantedAt: status === "active" ? iso() : undefined,
  };
  await store.saveEntitlement(entitlement);
  await recordOnce(`payment_verified:${order.id}`, {
    name: "payment_verified",
    userId: order.ownerUid,
    product: order.productCode,
    sessionId: order.sessionId,
    orderId: order.id,
  });
  if (!(await store.getLedger(`revenue:${order.id}`))) {
    await store.saveLedger({
      id: `revenue:${order.id}`,
      type: "revenue",
      orderId: order.id,
      amountMnt: order.amount,
      ownerRef: order.ownerUid,
      createdAt: iso(),
    });
  }
  if (job) await recoverCost(job.id);
  if (status === "active") await deliverReportEmail(order.ownerUid, order.id, reportId);
}

export async function addonEligibility(user: User, sessionId: string) {
  const session = await ownedSession(user, sessionId);
  const store = getStore();
  const paidBase = (await store.listOrdersByOwner(user.id)).some(
    (order) => order.sessionId === sessionId && order.productCode === "style_package" && order.paymentStatus === "paid",
  );
  const pkg = await store.getStylePackage(sessionId);
  if (!paidBase || !pkg || !session.styleInput) return { eligible: false as const };
  const delivered = pkg.deliveredDirectionIds
    .map((id) => STYLE_DIRECTIONS.find((item) => item.id === id))
    .filter((item) => item !== undefined);
  const next = nextAddonDirection({
    directions: STYLE_DIRECTIONS,
    examples: STYLE_EXAMPLES,
    likedIds: session.styleInput.likedIds,
    aspireIds: session.styleInput.aspireIds,
    dislikedIds: session.styleInput.dislikedIds,
    lifestyle: session.styleInput.lifestyle,
    delivered,
  });
  if (!next) return { eligible: false as const };
  return { eligible: true as const, directionId: next.id, title: next.title, reason: next.reasonHint };
}

export async function requestRefund(user: User, orderId: string, reason: string, now = new Date()) {
  const order = await ownedOrder(user, orderId);
  if (order.paymentStatus !== "paid" || !order.paidAt) throw new AppError("not_paid", 400);
  if (!refundWindowOpen(order.paidAt, now)) throw new AppError("refund_window_closed", 400);
  if (!reason.trim()) throw new AppError("reason_required", 400);
  const store = getStore();
  const existing = await store.getRefundByOrder(order.id);
  if (existing) return existing;
  const refund = {
    id: randomUUID(),
    orderId: order.id,
    ownerUid: user.id,
    reason: reason.trim().slice(0, 1000),
    status: "requested" as const,
    requestedAt: iso(now),
  };
  order.paymentStatus = "refund_requested";
  await store.saveOrder(order);
  await store.saveRefund(refund);
  await recordOnce(`refund_requested:${order.id}`, {
    name: "refund_requested",
    userId: user.id,
    product: order.productCode,
    sessionId: order.sessionId,
    orderId: order.id,
  });
  return refund;
}

export async function reviewRefund(
  reviewer: User,
  refundId: string,
  decision: "approve" | "reject",
  deps: { refundCard?: (paymentId: string) => Promise<void> } = {},
) {
  const store = getStore();
  const refund = (await store.listRefunds()).find((item) => item.id === refundId);
  if (!refund) throw new AppError("not_found", 404);
  const order = await store.getOrder(refund.orderId);
  if (!order) throw new AppError("not_found", 404);
  if (decision === "reject") {
    refund.status = "rejected";
    refund.reviewer = reviewer.id;
    order.paymentStatus = "refund_rejected";
    await store.saveRefund(refund);
    await store.saveOrder(order);
    return { refund, manual: false };
  }
  if (!qpayRefundSupported(order.channel)) {
    refund.status = "manual_pending";
    refund.reviewer = reviewer.id;
    order.paymentStatus = "refund_manual_pending";
    await store.saveRefund(refund);
    await store.saveOrder(order);
    return { refund, manual: true };
  }
  if (!order.qpayPaymentId) throw new AppError("payment_missing", 400);
  await (deps.refundCard ?? refundCardPayment)(order.qpayPaymentId);
  await finalizeRefund(order.id, reviewer.id, "QPay картын буцаалт");
  return { refund: await store.getRefundByOrder(order.id), manual: false };
}

export async function confirmManualRefund(reviewer: User, refundId: string) {
  const store = getStore();
  const refund = (await store.listRefunds()).find((item) => item.id === refundId);
  if (!refund || refund.status !== "manual_pending") throw new AppError("not_manual", 400);
  await finalizeRefund(refund.orderId, reviewer.id, "Гараар шилжүүлсэн");
}

async function finalizeRefund(orderId: string, reviewerId: string, resolution: string) {
  const store = getStore();
  const order = await store.getOrder(orderId);
  const refund = await store.getRefundByOrder(orderId);
  if (!order || !refund) throw new AppError("not_found", 404);
  order.paymentStatus = "refunded";
  refund.status = "refunded";
  refund.reviewer = reviewerId;
  refund.resolution = resolution;
  const entitlement = await store.getEntitlement(`ent_${order.id}`);
  if (entitlement) {
    entitlement.status = "revoked";
    entitlement.revokedAt = iso();
    await store.saveEntitlement(entitlement);
  }
  await store.saveOrder(order);
  await store.saveRefund(refund);
  if (!(await store.getLedger(`refund:${order.id}`))) {
    await store.saveLedger({
      id: `refund:${order.id}`,
      type: "refund",
      orderId: order.id,
      amountMnt: order.amount,
      ownerRef: order.ownerUid,
      createdAt: iso(),
    });
  }
}

export function publicOrder(order: Order) {
  return {
    id: order.id,
    productCode: order.productCode,
    amount: order.amount,
    currency: order.currency,
    paymentStatus: order.paymentStatus,
    channel: order.channel,
    qrImage: order.qrImage,
    urls: order.urls ?? [],
    sessionId: order.sessionId,
    reportId: order.reportId,
    simulate: simulatePayAllowed(),
    cardRefundAvailable: qpayRefundSupported(order.channel),
  };
}

async function ownedOrder(user: User, orderId: string) {
  const order = await getStore().getOrder(orderId);
  if (!order || order.ownerUid !== user.id) throw new AppError("not_found", 404);
  return order;
}

async function jobForReport(reportId: string) {
  const report = await getStore().getReport(reportId);
  if (!report?.generationJobId) return null;
  return getStore().getJob(report.generationJobId);
}

function productLabel(code: ProductCode) {
  if (code === "personality_report") return "Дэлгэрэнгүй тайлан";
  if (code === "style_package") return "Стайлын бүтэн багц";
  return "Нэмэлт стайлын чиглэл";
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}
