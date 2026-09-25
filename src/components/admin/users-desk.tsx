"use client";

import { formatDay } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeskTitle } from "./admin-frame";
import { useDesk } from "./desk-context";
import { roleLabel } from "./labels";

export function UsersDesk() {
  const { desk } = useDesk();
  if (!desk) return null;
  const registered = desk.users.filter((user) => user.email && !user.anonymous);
  const guests = desk.users.filter((user) => !user.email || user.anonymous);
  return (
    <div>
      <DeskTitle title="Хэрэглэгч" text={`${registered.length} бүртгэлтэй, ${guests.length} зочин.`} />
      <Tabs defaultValue="registered">
        <TabsList>
          <TabsTrigger value="registered">Бүртгэлтэй</TabsTrigger>
          <TabsTrigger value="guests">Зочин</TabsTrigger>
        </TabsList>
        <TabsContent value="registered">
          <UserTable rows={registered} />
        </TabsContent>
        <TabsContent value="guests">
          <UserTable rows={guests} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UserTable({ rows }: { rows: { id: string; email: string | null; ageBand: string; role: string; createdAt: string }[] }) {
  if (rows.length === 0) return <p className="text-muted-foreground">Хүн алга.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Имэйл</TableHead>
          <TableHead>Нас</TableHead>
          <TableHead>Эрх</TableHead>
          <TableHead>Бүртгэсэн</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.email || "—"}</TableCell>
            <TableCell>{user.ageBand === "adult" ? "Насанд хүрсэн" : user.ageBand === "under18" ? "18-аас доош" : "Ороогүй"}</TableCell>
            <TableCell>{roleLabel[user.role] ?? user.role}</TableCell>
            <TableCell>{formatDay(user.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
