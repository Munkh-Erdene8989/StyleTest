"use client";

import { useState } from "react";

import type { SiteGalleryItem } from "@/domain/types";

export function StudioGallery({ items }: { items: SiteGalleryItem[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <>
      <div className="gallery">
        {items.map((item) => (
          <button key={`${item.label}-${item.image}`} type="button" className={item.tall ? "gallery-tall" : undefined} onClick={() => setOpen(item.image)}>
            <img src={item.image} alt="" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      {open ? (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Зураг" onClick={() => setOpen(null)}>
          <button type="button" className="lightbox-close" aria-label="Хаах" onClick={() => setOpen(null)}>
            ×
          </button>
          <img src={open} alt="" onClick={(event) => event.stopPropagation()} />
        </div>
      ) : null}
    </>
  );
}
