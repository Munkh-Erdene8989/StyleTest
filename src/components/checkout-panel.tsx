"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatMnt } from "@/lib/format";

type OrderView = {
  id: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  qrImage?: string;
  urls: { name: string; link: string }[];
  reportId: string;
  simulate: boolean;
  cardRefundAvailable: boolean;
};

export function CheckoutPanel({ initial }: { initial: OrderView }) {
  const [order, setOrder] = useState(initial);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/orders/${order.id}`);
      if (response.ok) setOrder(await response.json());
    }, 3000);
    return () => window.clearInterval(timer);
  }, [order.id, order.paymentStatus]);

  async function check() {
    const response = await fetch(`/api/orders/${order.id}/confirm`, { method: "POST" });
    const data = await response.json();
    if (!response.ok) {
      setMessage("Төлбөрийг одоогоор баталгаажуулсангүй.");
      return;
    }
    if (data.order) setOrder(data.order);
    setMessage(data.reason === "paid" ? "Төлбөр баталгаажлаа." : "Төлбөр хүлээгдэж байна.");
  }

  async function simulate() {
    const response = await fetch(`/api/orders/${order.id}/simulate`, { method: "POST" });
    const data = await response.json();
    if (response.ok && data.order) setOrder(data.order);
  }

  const qr = order.qrImage ? (order.qrImage.startsWith("data:") ? order.qrImage : `data:image/png;base64,${order.qrImage}`) : "";

  return (
    <section className="stack-form">
      <p className="price">
        {formatMnt(order.amount)} {order.currency}
      </p>
      <p role="status">Төлөв: {statusLabel(order.paymentStatus)}</p>
      {qr ? <img src={qr} alt="QPay QR" className="qr" /> : null}
      <ul className="grid gap-2">
        {order.urls.map((url) => (
          <li key={url.link}>
            <a className="inline-link" href={url.link}>
              {url.name}
            </a>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => void check()} className="btn">
        Төлбөр шалгах
      </button>
      {order.simulate ? (
        <button type="button" onClick={() => void simulate()} className="btn-quiet">
          Туршилтын төлбөр баталгаажуулах
        </button>
      ) : null}
      {order.paymentStatus === "paid" && order.reportId ? (
        <Link className="inline-link" href={`/reports/${order.reportId}`}>
          Тайлан руу орох
        </Link>
      ) : null}
      {message ? <p>{message}</p> : null}
      <p className="note">
        Картын буцаалт QPay-ээр, банкны QR гар аргаар шийдэгдэнэ. Одоогийн суваг автомат буцаалттай эсэх:{" "}
        {order.cardRefundAvailable ? "тийм." : "үгүй."}
      </p>
    </section>
  );
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    invoiced: "Нэхэмжлэл үүссэн",
    paid: "Төлөгдсөн",
    refund_requested: "Буцаалт хүссэн",
    refunded: "Буцаагдсан",
    refund_manual_pending: "Гараар буцаах хүлээгдэж байна",
    refund_rejected: "Буцаалтаас татгалзсан",
  };
  return labels[status] ?? status;
}
