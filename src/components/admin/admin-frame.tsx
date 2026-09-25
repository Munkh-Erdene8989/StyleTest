"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Newspaper,
  RotateCcw,
  Scale,
  ScrollText,
  Settings,
  Shirt,
  Sparkles,
  Users,
  Cpu,
  MessagesSquare,
} from "lucide-react";
import { DeskProvider, useDesk } from "./desk-context";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Тойм", icon: LayoutDashboard },
  { href: "/admin/tests", label: "Асуулга", icon: ClipboardList },
  { href: "/admin/responses", label: "Хариулт", icon: MessagesSquare },
  { href: "/admin/reports", label: "Тайлан", icon: Sparkles },
  { href: "/admin/rules", label: "Дүрэм", icon: Scale },
  { href: "/admin/users", label: "Хэрэглэгч", icon: Users },
  { href: "/admin/orders", label: "Худалдан авалт", icon: CreditCard },
  { href: "/admin/news", label: "Мэдээ", icon: Newspaper },
  { href: "/admin/refunds", label: "Буцаалт", icon: RotateCcw },
  { href: "/admin/jobs", label: "Үүсгэлт", icon: Cpu },
  { href: "/admin/style", label: "Стайл", icon: Shirt },
  { href: "/admin/settings", label: "Тохиргоо", icon: Settings },
  { href: "/admin/audit", label: "Аудит", icon: ScrollText },
];

export function AdminFrame({ children }: { children: React.ReactNode }) {
  return (
    <DeskProvider>
      <FrameBody>{children}</FrameBody>
    </DeskProvider>
  );
}

function FrameBody({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { desk, error } = useDesk();
  if (error) {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="max-w-sm">
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-medium">Админ эрх алга</h1>
          <p className="mt-3 text-muted-foreground">Энэ ширээ студийн операторт нээлттэй. Нэвтэрсэн имэйл операторын имэйлтэй таарах ёстой.</p>
          <Link href="/login" className="mt-6 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm text-primary-foreground">
            Нэвтрэх
          </Link>
        </div>
      </div>
    );
  }
  if (!desk) return <p className="p-8">Ачаалж байна…</p>;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="admin-rail md:sticky md:top-0 md:h-screen md:w-56 md:shrink-0 md:overflow-y-auto">
        <div className="px-4 py-5">
          <Link href="/admin" className="font-[family-name:var(--font-display)] text-3xl leading-none">
            Naruka
          </Link>
          <p className="mt-1 text-sm text-white/70">Студийн ширээ</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:grid md:px-2">
          {links.map((link) => {
            const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm",
                  active ? "bg-white/15" : "hover:bg-white/10",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden px-4 py-4 text-sm text-white/70 md:block">
          <p>{desk.viewer.email || "Имэйлгүй"}</p>
          <Link href="/" className="mt-2 inline-block underline">
            Сайт руу
          </Link>
        </div>
      </aside>
      <div className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</div>
    </div>
  );
}

export function DeskTitle({ title, text }: { title: string; text?: string }) {
  return (
    <header className="mb-6 max-w-3xl">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-medium tracking-tight">{title}</h1>
      {text ? <p className="mt-2 text-muted-foreground">{text}</p> : null}
    </header>
  );
}
