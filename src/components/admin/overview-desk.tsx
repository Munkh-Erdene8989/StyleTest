"use client";

import Link from "next/link";
import { formatDay, formatMnt } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeskTitle } from "./admin-frame";
import { useDesk } from "./desk-context";
import { eventLabel, paymentLabel, productLabel } from "./labels";

export function OverviewDesk() {
  const { desk } = useDesk();
  if (!desk) return null;
  const registered = desk.users.filter((user) => user.email && !user.anonymous).length;
  const paid = desk.orders.filter((order) => order.paymentStatus === "paid").length;
  const openRefunds = desk.refunds.filter((refund) => refund.status === "requested" || refund.status === "manual_pending").length;
  const failedJobs = desk.jobs.filter((job) => job.status === "failed").length;
  const broken = desk.tests.filter((test) => test.issues.length > 0);

  return (
    <div>
      <DeskTitle title="Өнөөдрийн ширээ" text="Асуулга, хариулт, тайлан, худалдан авалт нэг дороос." />
      <dl className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
        <Tally label="Бүртгэлтэй" value={String(registered)} />
        <Tally label="Төлсөн захиалга" value={String(paid)} />
        <Tally label="Нээлттэй буцаалт" value={String(openRefunds)} />
        <Tally label="Алдаатай үүсгэлт" value={String(failedJobs)} />
      </dl>
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-medium">Асуулгууд</h2>
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {desk.tests.map((test) => (
              <li key={test.version.id}>
                <Link href={`/admin/tests/${test.version.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span>
                    <span className="block">{test.version.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {test.version.questions.length} асуулт · оноо {test.span.min}–{test.span.max}
                    </span>
                  </span>
                  {test.hidden ? <Badge variant="outline">Нуусан</Badge> : test.issues.length ? <Badge variant="warn">Муж дутуу</Badge> : <Badge>Нээлттэй</Badge>}
                </Link>
              </li>
            ))}
          </ul>
          {broken.length ? <p className="mt-2 text-sm text-destructive">Онооны муж хаагдаагүй тест байна. Нээж засна.</p> : null}
        </section>
        <section>
          <h2 className="mb-3 font-medium">Сүүлийн худалдан авалт</h2>
          {desk.orders.length === 0 ? <p className="text-muted-foreground">Захиалга алга.</p> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Бүтээгдэхүүн</TableHead>
                <TableHead>Дүн</TableHead>
                <TableHead>Төлөв</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {desk.orders.slice(0, 6).map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{productLabel[order.productCode] ?? order.productCode}</TableCell>
                  <TableCell>{formatMnt(order.amount)}₮</TableCell>
                  <TableCell>{paymentLabel[order.paymentStatus] ?? order.paymentStatus}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <h2 className="mb-3 mt-8 font-medium">Сүүлийн үйл явдал</h2>
          <ul className="text-sm">
            {desk.events.slice(0, 8).map((event, index) => (
              <li key={`${event.createdAt}-${index}`} className="flex justify-between gap-3 border-b border-border py-2">
                <span>{eventLabel[event.name] ?? event.name}</span>
                <time className="text-muted-foreground">{formatDay(event.createdAt)}</time>
              </li>
            ))}
            {desk.events.length === 0 ? <li className="text-muted-foreground">Үйл явдал алга.</li> : null}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Tally({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card px-4 py-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-3xl font-medium tabular-nums">{value}</dd>
    </div>
  );
}
