"use client";

import { useEffect, useState } from "react";

type Overview = {
  appName: string;
  helpContacts: { name: string; phone: string; note: string; source: string }[];
  orders: { id: string; productCode: string; amount: number; paymentStatus: string; channel: string }[];
  jobs: { id: string; kind: string; status: string; attempt: number; costUsd: number; error: string | null; billablePurchaseId: string | null }[];
  refunds: { id: string; orderId: string; status: string; reason: string }[];
  events: { name: string; product?: string }[];
  ledger: { id: string; type: string; amountMnt?: number; costUsd?: number }[];
  versions: { id: string; title: string; status: string; kind: string }[];
};

export function AdminPanel() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [target, setTarget] = useState("");
  const [sensitive, setSensitive] = useState("");

  async function load() {
    const response = await fetch("/api/admin/overview");
    if (!response.ok) {
      setError("Админ эрх алга.");
      return;
    }
    const json = await response.json();
    setData(json);
    setName(json.appName);
  }

  useEffect(() => {
    void load();
  }, []);

  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p role="status">Ачаалж байна…</p>;

  return (
    <div className="grid gap-6">
      <form
        className="grid gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          await fetch("/api/admin/site", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ appName: name }),
          });
          await load();
        }}
      >
        <label className="grid gap-1">
          Сайтын нэр
          <input className="field" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <button className="btn" type="submit">
          Нэр хадгалах
        </button>
      </form>
      <section>
        <h2 className="font-medium">Аргачлал</h2>
        <ul>
          {data.versions.map((version) => (
            <li key={version.id}>
              {version.title}: {version.status}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-medium">Захиалга</h2>
        {data.orders.length === 0 ? <p>Захиалга алга.</p> : null}
        <ul>
          {data.orders.map((order) => (
            <li key={order.id}>
              {order.productCode} · {order.amount}₮ · {order.paymentStatus} · {order.channel}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-medium">Generation</h2>
        {data.jobs.map((job) => (
          <div key={job.id} className="mb-2 flex flex-wrap items-center gap-2">
            <span>
              {job.kind} · {job.status} · ${job.costUsd} {job.error ? `· ${job.error}` : ""}
            </span>
            <button
              type="button"
              className="btn-small"
              onClick={() =>
                void fetch("/api/admin/jobs/retry", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ jobId: job.id }),
                }).then(load)
              }
            >
              Дахин
            </button>
          </div>
        ))}
      </section>
      <section>
        <h2 className="font-medium">Буцаалт</h2>
        {data.refunds.map((refund) => (
          <div key={refund.id} className="mb-2 grid gap-1">
            <p>
              {refund.status}: {refund.reason}
            </p>
            <div className="flex gap-2">
              <button type="button" className="btn-small" onClick={() => void decide(refund.id, "approve")}>
                Зөвшөөрөх
              </button>
              <button type="button" className="btn-small" onClick={() => void decide(refund.id, "reject")}>
                Татгалзах
              </button>
              <button type="button" className="btn-small" onClick={() => void decide(refund.id, "manual")}>
                Гараар буцаасан
              </button>
            </div>
          </div>
        ))}
      </section>
      <section>
        <h2 className="font-medium">Өртөг</h2>
        <ul>
          {data.ledger.map((entry) => (
            <li key={entry.id}>
              {entry.type} {entry.amountMnt ? `${entry.amountMnt}₮` : ""} {entry.costUsd ? `$${entry.costUsd}` : ""}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-medium">Үйл явдал</h2>
        <p>{data.events.map((event) => event.name).join(", ") || "Алга"}</p>
      </section>
      <form
        className="grid gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const response = await fetch("/api/admin/sensitive", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ target, reason }),
          });
          setSensitive(response.ok ? "Хандалт аудитад бүртгэгдлээ." : "Мэдрэмтгий хандалт хаалттай.");
        }}
      >
        <h2 className="font-medium">Мэдрэмтгий хандалт</h2>
        <input className="field" placeholder="session:..." value={target} onChange={(event) => setTarget(event.target.value)} />
        <input className="field" placeholder="Шалтгаан" value={reason} onChange={(event) => setReason(event.target.value)} />
        <button type="submit" className="btn-quiet">
          Шалтгаантай нээх
        </button>
        {sensitive ? <p>{sensitive}</p> : null}
      </form>
    </div>
  );

  async function decide(refundId: string, action: "approve" | "reject" | "manual") {
    await fetch("/api/admin/refunds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action === "manual" ? { action: "manual", refundId } : { decision: action, refundId }),
    });
    await load();
  }
}
