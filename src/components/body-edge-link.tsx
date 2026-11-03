"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BodyEdgeLink() {
  const pathname = usePathname();
  if (pathname.startsWith("/bodyshape") || pathname.startsWith("/admin")) return null;

  return (
    <Link href="/bodyshape" className="body-edge body-edge-on">
      <span className="body-edge-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="4.15" r="2.05" />
          <path d="M8.15 9.05c.45-1.15 1.7-1.9 3.85-1.9s3.4.75 3.85 1.9c.35.9-.35 1.45-1.05 1.35.15 1.7.35 3.55.55 5.35.15 1.35-1.85 1.7-2.15.35L12.6 14.2h-1.2l-.6 1.9c-.3 1.35-2.3 1-2.15-.35.2-1.8.4-3.65.55-5.35-.7.1-1.4-.45-1.05-1.35Z" />
        </svg>
      </span>
      <span className="body-edge-copy">Body calculator</span>
    </Link>
  );
}
