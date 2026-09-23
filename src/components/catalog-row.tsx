import Link from "next/link";
import type { TestKind } from "@/domain/types";

export function CatalogRow({
  href,
  kind,
  title,
  meta,
}: {
  href: string;
  kind: TestKind;
  title: string;
  meta: string;
}) {
  return (
    <Link href={href} className="row">
      <span className={`swatch swatch-${kind}`} aria-hidden="true" />
      <span>
        <span className="row-title">{title}</span>
        <span className="row-meta">{meta}</span>
      </span>
    </Link>
  );
}
