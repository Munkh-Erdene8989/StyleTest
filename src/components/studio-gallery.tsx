"use client";

import { useState } from "react";

const ITEMS = [
  { img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&h=1100&fit=crop&auto=format", label: "Зун улирлын палитр", tall: true },
  { img: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=900&h=700&fit=crop&auto=format", label: "Warm Autumn", tall: false },
  { img: "https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=900&h=1100&fit=crop&auto=format", label: "Cool Winter", tall: true },
  { img: "https://images.unsplash.com/photo-1512361436605-a484bdb34b5f?w=900&h=700&fit=crop&auto=format", label: "Spring Bright", tall: false },
  { img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&h=1100&fit=crop&auto=format", label: "Soft Summer", tall: true },
  { img: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&h=700&fit=crop&auto=format", label: "Deep Autumn", tall: false },
];

export function StudioGallery() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <>
      <div className="gallery">
        {ITEMS.map((item) => (
          <button key={item.label} type="button" className={item.tall ? "gallery-tall" : undefined} onClick={() => setOpen(item.img)}>
            <img src={item.img} alt="" />
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
