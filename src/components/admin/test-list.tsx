"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeskTitle } from "./admin-frame";
import { useDesk } from "./desk-context";
import { kindLabel, statusLabel } from "./labels";

export function TestList() {
  const { desk } = useDesk();
  if (!desk) return null;
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <DeskTitle title="Асуулга" text="Google Forms шиг асуулт, сонголт, оноо, үр дүнгийн муж. Хадгалсан тест сайт дээр гарна." />
        <Button asChild>
          <Link href="/admin/tests/new">Шинэ асуулга</Link>
        </Button>
      </div>
      <ul className="grid gap-3">
        {desk.tests.map((test) => (
          <li key={test.version.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-medium">{test.version.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {kindLabel[test.version.kind]} · {test.version.questions.length} асуулт · {test.version.bands.length} үр дүн · оноо {test.span.min}–{test.span.max}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{statusLabel[test.version.status] ?? test.version.status}</Badge>
                {test.builtin ? <Badge variant="secondary">Систем</Badge> : <Badge variant="secondary">Өөрийн</Badge>}
                {test.hidden ? <Badge variant="outline">Нуусан</Badge> : <Badge>Сайт дээр</Badge>}
                {test.issues.length ? <Badge variant="warn">Муж шалгах</Badge> : null}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button asChild size="sm">
                <Link href={`/admin/tests/${test.version.id}`}>Засах</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/tests/new?from=${test.version.id}`}>Хуулбарлах</Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
