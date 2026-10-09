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
    { href: "/tests", label: "Тест", section: "" },
    { href: "/bodyshape", label: "Биеийн хэлбэр", section: "" },
  ];

  return (
    <header className={`top${clear ? " top-clear" : ""}`}>
      <div className="bar">
        <Link href="/" className="wordmark" aria-label={BRAND_NAME}>
          <img src="/naruka-logo.png" alt="" />
        </Link>
        <nav className={`nav${open ? " nav-open" : ""}`}>
          {links.map((link) => {
            const current = link.section
              ? pathname === "/" && active === link.section
              : link.href === "/tests"
                ? pathname.startsWith("/tests")
                : link.href === "/bodyshape"
                  ? pathname.startsWith("/bodyshape")
                  : pathname === link.href;
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
          <ColorPlate navOpen={open} onNavigate={() => setOpen(false)} />
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

const PLATE_LENGTH = 2;

function PlateMark() {
  return (
    <svg className="plate-mark" viewBox="0 0 32 32" aria-hidden="true">
      <path className="plate-mark-main" d="M15 3.2 17.1 12.2 26.2 14.2 17.1 16.2 15 25.2 12.9 16.2 3.8 14.2 12.9 12.2Z" />
      <path className="plate-mark-a" d="M25.2 5.2 26.1 7.6 28.6 8.4 26.1 9.2 25.2 11.6 24.3 9.2 21.8 8.4 24.3 7.6Z" />
      <path className="plate-mark-b" d="M8.4 20.4 9.1 22.2 11 22.8 9.1 23.4 8.4 25.2 7.7 23.4 5.8 22.8 7.7 22.2Z" />
    </svg>
  );
}

function ColorPlate({ navOpen, onNavigate }: { navOpen: boolean; onNavigate: () => void }) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const request = useRef(0);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "bad" | "ok" | "fail">("idle");

  function close() {
    request.current += 1;
    setOpen(false);
    setCode("");
    setStatus("idle");
  }

  useEffect(() => {
    close();
  }, [pathname]);

  useEffect(() => {
    if (navOpen) close();
  }, [navOpen]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function onCode(raw: string) {
    const next = raw.toUpperCase().replace(/[^A-Z]/g, "").slice(0, PLATE_LENGTH);
    setCode(next);
    const ticket = ++request.current;
    if (next.length < PLATE_LENGTH) {
      setStatus("idle");
      return;
    }
    setStatus("ok");
    void downloadPlate(next, ticket);
  }

  async function downloadPlate(plateCode: string, ticket: number) {
    try {
      const res = await fetch(`/api/color-plate/${plateCode}`);
      if (ticket !== request.current) return;
      if (res.status === 404) {
        setStatus("bad");
        return;
      }
      if (!res.ok) {
        setStatus("fail");
        return;
      }
      const blob = await res.blob();
      if (ticket !== request.current) return;
      const header = res.headers.get("Content-Disposition");
      const encoded = header?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
      const filename = encoded ? decodeURIComponent(encoded) : `${plateCode}.pdf`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      if (ticket === request.current) setStatus("fail");
    }
  }

  const hint =
    status === "ok" ? "Файл татагдаж байна" : status === "bad" ? "Код буруу байна" : status === "fail" ? "Татаж чадсангүй" : "2 тэмдэгт код оруулна уу";

  return (
    <div className="color-plate" ref={rootRef}>
      <button
        type="button"
        className="color-plate-btn"
        aria-expanded={open}
        aria-controls="color-plate-pop"
        onClick={() => {
          if (open) {
            close();
            return;
          }
          onNavigate();
          setOpen(true);
        }}
      >
        <PlateMark />
        <span>Color Plate</span>
        <i className="plate-sweep" />
      </button>
      {open ? (
        <div id="color-plate-pop" className="color-plate-pop" role="dialog" aria-label="Color Plate">
          <span className="plate-speck plate-speck-a" />
          <span className="plate-speck plate-speck-b" />
          <span className="plate-speck plate-speck-c" />
          <label className="plate-field">
            <span className="sr-only">Код</span>
            <input
              ref={inputRef}
              value={code}
              maxLength={PLATE_LENGTH}
              autoComplete="off"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
              aria-invalid={status === "bad"}
              aria-describedby="color-plate-hint"
              placeholder="••"
              onChange={(event) => onCode(event.target.value)}
            />
          </label>
          <p id="color-plate-hint" className={`plate-hint plate-hint-${status}`} role="status">
            {hint}
          </p>
          <i className="plate-sweep" />
        </div>
      ) : null}
    </div>
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
