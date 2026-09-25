"use client";

import { formatDay, formatMnt } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeskTitle } from "./admin-frame";
import { useDesk } from "./desk-context";
import { channelLabel, paymentLabel, productLabel } from "./labels";

export function OrdersDesk() {
  const { desk } = useDesk();
  if (!desk) return null;
  const email = (uid: string) => desk.users.find((user) => user.id === uid)?.email || "Зочин";
  const revenue = desk.orders.filter((order) => order.paymentStatus === "paid").reduce((sum, order) => sum + order.amount, 0);
  return (
    <div>
      <DeskTitle title="Худалдан авалт" text={`Төлсөн дүн ${formatMnt(revenue)}₮.`} />
      {desk.orders.length === 0 ? <p className="text-muted-foreground">Захиалга алга.</p> : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Бүтээгдэхүүн</TableHead>
            <TableHead>Хүн</TableHead>
            <TableHead>Дүн</TableHead>
            <TableHead>Төлөв</TableHead>
            <TableHead>Суваг</TableHead>
            <TableHead>Огноо</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {desk.orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>{productLabel[order.productCode] ?? order.productCode}</TableCell>
              <TableCell>{email(order.ownerUid)}</TableCell>
              <TableCell>{formatMnt(order.amount)}₮</TableCell>
              <TableCell>
                <Badge variant={order.paymentStatus === "paid" ? "default" : "outline"}>{paymentLabel[order.paymentStatus] ?? order.paymentStatus}</Badge>
              </TableCell>
              <TableCell>{channelLabel[order.channel] ?? order.channel}</TableCell>
              <TableCell>{formatDay(order.paidAt || order.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <h2 className="mb-3 mt-8 font-medium">Орлого ба өртөг</h2>
      {desk.ledger.length === 0 ? <p className="text-muted-foreground">Бичилт алга.</p> : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Төрөл</TableHead>
            <TableHead>Төгрөг</TableHead>
            <TableHead>Доллар</TableHead>
            <TableHead>Огноо</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {desk.ledger.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{entry.type}</TableCell>
              <TableCell>{entry.amountMnt ? `${formatMnt(entry.amountMnt)}₮` : "—"}</TableCell>
              <TableCell>{entry.costUsd ? `$${entry.costUsd}` : "—"}</TableCell>
              <TableCell>{formatDay(entry.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
