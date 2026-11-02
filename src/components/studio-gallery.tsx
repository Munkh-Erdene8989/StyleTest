"use client";

import { useState } from "react";

const ITEMS = [
  { img: "/studio/gallery-summer.jpg", label: "Зун улирлын палитр", tall: true },
  { img: "/studio/gallery-autumn.jpg", label: "Warm Autumn", tall: false },
  { img: "/studio/gallery-winter.jpg", label: "Cool Winter", tall: true },
  { img: "/studio/gallery-spring.jpg", label: "Spring Bright", tall: false },
  { img: "/studio/gallery-soft-summer.jpg", label: "Soft Summer", tall: true },
  { img: "/studio/gallery-deep-autumn.jpg", label: "Deep Autumn", tall: false },
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
