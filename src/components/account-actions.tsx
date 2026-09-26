"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RefundForm({ orders }: { orders: { id: string; label: string }[] }) {
  const [orderId, setOrderId] = useState(orders[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/refunds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, reason }),
    });
    const data = await response.json();
    setMessage(response.ok ? "Хүсэлт илгээгдлээ. Админ хянана." : messageFor(data.error));
  }

  if (orders.length === 0) return <p>Буцаалт хүсэх төлбөр алга.</p>;

  return (
    <form onSubmit={submit} className="stack-form">
      <label>
        Захиалга
        <select className="field" value={orderId} onChange={(event) => setOrderId(event.target.value)}>
          {orders.map((order) => (
            <option key={order.id} value={order.id}>
              {order.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Шалтгаан
        <textarea required className="field" value={reason} onChange={(event) => setReason(event.target.value)} />
      </label>
      <button type="submit" className="btn-quiet">
        24 цагийн дотор буцаалт хүсэх
      </button>
      {message ? <p role="status">{message}</p> : null}
    </form>
  );
}

export function DeletePhotosButton() {
  const [message, setMessage] = useState("");
  async function run() {
    const response = await fetch("/api/uploads/originals", { method: "DELETE" });
    setMessage(response.ok ? "Эх зургийг устгалаа. Худалдаж авсан тайлан, дүрслэл үлдэнэ." : "Устгасангүй.");
  }
  return (
    <div className="stack-form">
      <button type="button" onClick={() => void run()} className="btn-danger">
        Эх зураг устгах
      </button>
      {message ? <p>{message}</p> : null}
    </div>
  );
}

export function DeleteAccountForm() {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm }),
    });
    if (!response.ok) {
      setMessage("Баталгаажуулалт таараагүй.");
      return;
    }
    router.push("/");
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="stack-form">
      <p>Бүртгэл устгахад хариулт, тайлан, эх зураг, дүрслэл, эрх хамт устана. Захиалга, буцаалтын санхүүгийн мөр үлдэнэ.</p>
      <label>
        Батлахын тулд «устгах» гэж бичнэ үү
        <input className="field" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
      </label>
      <button type="submit" className="btn-danger">
        Бүртгэл, тайлан устгах
      </button>
      {message ? <p role="alert" className="alert">{message}</p> : null}
    </form>
  );
}

function messageFor(code: string) {
  if (code === "refund_window_closed") return "24 цаг өнгөрсөн байна.";
  if (code === "reason_required") return "Шалтгаан бичнэ үү.";
  return "Хүсэлт илгээгдсэнгүй.";
}
