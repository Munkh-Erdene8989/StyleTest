import { AppError } from "@/domain/errors";
import type { ObservedPayment } from "@/domain/payment";
import type { PayChannel } from "@/domain/types";

type TokenCache = { access: string; exp: number };
let tokenCache: TokenCache | null = null;

export function simulatePayAllowed() {
  if (process.env.QPAY_SIMULATE !== "true") return false;
  const base = process.env.QPAY_BASE_URL || "";
  if (base.includes("://merchant.qpay.mn") && !base.includes("sandbox")) return false;
  return base.includes("sandbox") || process.env.NODE_ENV !== "production";
}

export function qpayConfigured() {
  return Boolean(
    process.env.QPAY_BASE_URL &&
      process.env.QPAY_CLIENT_ID &&
      process.env.QPAY_CLIENT_SECRET &&
      process.env.QPAY_INVOICE_CODE,
  );
}

export async function createInvoice(order: { id: string; amount: number; description: string }) {
  if (!qpayConfigured()) {
    if (simulatePayAllowed()) return { invoiceId: undefined, qrImage: undefined, urls: [] as { name: string; link: string }[] };
    throw new AppError("qpay_unconfigured", 500);
  }
  const access = await accessToken();
  const response = await fetch(`${process.env.QPAY_BASE_URL}/v2/invoice`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      invoice_code: process.env.QPAY_INVOICE_CODE,
      sender_invoice_no: order.id,
      invoice_receiver_code: "terminal",
      invoice_description: order.description,
      amount: order.amount,
      callback_url: process.env.QPAY_CALLBACK_URL,
    }),
  });
  if (!response.ok) throw new AppError("qpay_invoice", 502);
  const json = (await response.json()) as { invoice_id?: string; qr_image?: string; urls?: { name?: string; link?: string }[] };
  return {
    invoiceId: json.invoice_id ? String(json.invoice_id) : undefined,
    qrImage: typeof json.qr_image === "string" ? json.qr_image : undefined,
    urls: Array.isArray(json.urls)
      ? json.urls
          .map((item) => ({ name: String(item.name ?? "Банк"), link: String(item.link ?? "") }))
          .filter((item) => item.link.startsWith("https://") || item.link.includes("://"))
      : [],
  };
}

export async function checkInvoice(invoiceId: string) {
  if (!qpayConfigured()) throw new AppError("qpay_unconfigured", 500);
  const access = await accessToken();
  const response = await fetch(`${process.env.QPAY_BASE_URL}/v2/payment/check`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
    body: JSON.stringify({ object_type: "INVOICE", object_id: invoiceId }),
  });
  if (!response.ok) throw new AppError("qpay_check", 502);
  return parseCheck(await response.json());
}

export async function refundCardPayment(paymentId: string) {
  if (!qpayConfigured()) throw new AppError("qpay_unconfigured", 500);
  const access = await accessToken();
  const response = await fetch(`${process.env.QPAY_BASE_URL}/v2/payment/refund/${encodeURIComponent(paymentId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${access}` },
  });
  if (!response.ok) throw new AppError("qpay_refund_failed", 502);
}

export function parseCheck(json: unknown): ObservedPayment {
  const body = (json ?? {}) as { count?: number; rows?: Record<string, unknown>[] };
  const rows = Array.isArray(body.rows) ? body.rows : [];
  const row = rows.find(isPaidRow) ?? null;
  if (!row) return { paid: false, amount: null, currency: null, paymentId: null, channel: "unknown" };
  return {
    paid: true,
    amount: numberField(row, ["payment_amount", "amount", "paid_amount"]),
    currency: stringField(row, ["currency", "payment_currency"]) ?? "MNT",
    paymentId: stringField(row, ["payment_id", "id"]),
    channel: channelFrom(row),
  };
}

async function accessToken() {
  if (tokenCache && tokenCache.exp > Date.now() + 10_000) return tokenCache.access;
  const basic = Buffer.from(`${process.env.QPAY_CLIENT_ID}:${process.env.QPAY_CLIENT_SECRET}`).toString("base64");
  const response = await fetch(`${process.env.QPAY_BASE_URL}/v2/auth/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}` },
  });
  if (!response.ok) throw new AppError("qpay_auth", 502);
  const json = (await response.json()) as { access_token?: string; expires_in?: number; refresh_token?: string };
  if (!json.access_token) throw new AppError("qpay_auth", 502);
  tokenCache = { access: json.access_token, exp: Date.now() + (json.expires_in ?? 300) * 1000 };
  return json.access_token;
}

function isPaidRow(row: Record<string, unknown>) {
  const status = String(row.payment_status ?? row.status ?? "").toUpperCase();
  return status === "PAID" || status === "SUCCESS";
}

function numberField(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return null;
}

function stringField(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function channelFrom(row: Record<string, unknown>): PayChannel {
  const blob = JSON.stringify(row).toLowerCase();
  if (blob.includes("card") || blob.includes("visa") || blob.includes("mastercard")) return "card";
  if (blob.includes("bank") || blob.includes("p2p") || blob.includes("qr")) return "bank_qr";
  return "unknown";
}
