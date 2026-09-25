"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BRAND_NAME } from "@/domain/brand";

export function SiteHeader({
  loggedIn,
  email,
}: {
  loggedIn: boolean;
  email: string;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");
  const onHero = pathname === "/";
  const clear = onHero && !scrolled && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/") return;
    const ids = ["home", "about", "services", "training"];
    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit?.target.id) setActive(hit.target.id);
      },
      { threshold: [0.25, 0.45], rootMargin: "-15% 0px -45% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [pathname]);

  const here = (id: string) => (pathname === "/" ? `#${id}` : `/#${id}`);
  const links = [
    { href: here("home"), label: "Нүүр", section: "home" },
    { href: here("about"), label: "Бидний тухай", section: "about" },
    { href: here("services"), label: "Үйлчилгээ", section: "services" },
    { href: here("training"), label: "Сургалт", section: "training" },
    { href: "/news", label: "Мэдээ", section: "" },
  ];

  return (
    <header className={`top${clear ? " top-clear" : ""}`}>
      <div className="bar">
        <Link href="/" className="wordmark" aria-label={BRAND_NAME}>
          <img src="/naruka-logo.png" alt="" />
        </Link>
        <nav className={`nav${open ? " nav-open" : ""}`}>
          {links.map((link) => {
            const current = link.section ? pathname === "/" && active === link.section : pathname === link.href;
            return (
              <Link key={link.label} href={link.href} className={current ? "nav-current" : undefined} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            );
          })}
          {loggedIn ? null : (
            <Link href="/login" className="nav-cta" onClick={() => setOpen(false)}>
              Нэвтрэх
            </Link>
          )}
        </nav>
        <div className="bar-end">
          {loggedIn ? <ProfileMenu email={email} pathname={pathname} navOpen={open} onNavigate={() => setOpen(false)} /> : null}
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-label={open ? "Цэс хаах" : "Цэс нээх"}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}

function ProfileMenu({
  email,
  pathname,
  navOpen,
  onNavigate,
}: {
  email: string;
  pathname: string;
  navOpen: boolean;
  onNavigate: () => void;
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (navOpen) setOpen(false);
  }, [navOpen]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function logout() {
    setLeaving(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await fetch("/api/auth/guest", { method: "POST" });
      setOpen(false);
      onNavigate();
      router.push("/");
      router.refresh();
    } finally {
      setLeaving(false);
    }
  }

  return (
    <div className="profile-menu" ref={rootRef}>
      <button
        type="button"
        className="profile-btn"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="profile-menu"
        aria-label="Профайл"
        onClick={() =>
          setOpen((value) => {
            if (!value) onNavigate();
            return !value;
          })
        }
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="3.15" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M5.4 19.2c1.25-3.05 3.55-4.5 6.6-4.5s5.35 1.45 6.6 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      {open ? (
        <div id="profile-menu" className="profile-drop" role="menu">
          {email ? <p className="profile-email">{email}</p> : null}
          <Link href="/account" role="menuitem" className={pathname.startsWith("/account") ? "nav-current" : undefined} onClick={() => setOpen(false)}>
            Миний хэсэг
          </Link>
          <button type="button" role="menuitem" onClick={logout} disabled={leaving}>
            {leaving ? "Гарч байна…" : "Гарах"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
