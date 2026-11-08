"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { LoginForm } from "@/components/login-form";
import { useOpenTap } from "@/components/tap-studio";

type Sheet = "profile" | null;

export function MobileDock({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  const openTap = useOpenTap();
  const router = useRouter();
  const sheetId = useId();
  const sheetRef = useRef<HTMLElement>(null);
  const [sheet, setSheet] = useState<Sheet>(null);

  useEffect(() => {
    setSheet(null);
  }, [pathname]);

  useEffect(() => {
    if (!sheet) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheetRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSheet(null);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [sheet]);

  function goHome() {
    setSheet(null);
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    router.push("/");
  }

  function openStylish() {
    setSheet(null);
    if (pathname === "/tap" || !openTap) return;
    openTap();
  }

  function openProfile() {
    if (loggedIn) {
      setSheet(null);
      if (!pathname.startsWith("/account")) router.push("/account");
      return;
    }
    setSheet((current) => (current === "profile" ? null : "profile"));
  }

  const homeOn = pathname === "/" && sheet === null;
  const stylishOn = pathname.startsWith("/tap");
  const profileOn = sheet === "profile" || (sheet === null && (pathname.startsWith("/account") || pathname === "/login"));

  return (
    <div className="mobile-dock">
      {sheet ? (
        <button type="button" className="dock-backdrop" aria-label="Хаах" onClick={() => setSheet(null)} />
      ) : null}
      {sheet === "profile" ? (
        <section
          ref={sheetRef}
          id={sheetId}
          className="dock-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="И-мэйлээр нэвтрэх"
          tabIndex={-1}
        >
          <header className="dock-sheet-head">
            <h2>И-мэйлээр нэвтрэх</h2>
            <button type="button" onClick={() => setSheet(null)}>
              Хаах
            </button>
          </header>
          <LoginForm idPrefix="dock-" />
        </section>
      ) : null}
      <nav className="dock-bar" aria-label="Гар утасны цэс">
        <button type="button" className={homeOn ? "dock-on" : undefined} aria-current={homeOn ? "page" : undefined} onClick={goHome}>
          <HomeMark />
          <span>Home</span>
        </button>
        <button
          type="button"
          className={stylishOn ? "dock-feature dock-on" : "dock-feature"}
          aria-current={stylishOn ? "page" : undefined}
          onClick={openStylish}
        >
          <MagicMark />
          <span>Stylish</span>
        </button>
        <button
          type="button"
          className={profileOn ? "dock-on" : undefined}
          aria-expanded={loggedIn ? undefined : sheet === "profile"}
          aria-controls={!loggedIn && sheet === "profile" ? sheetId : undefined}
          aria-current={loggedIn && profileOn ? "page" : undefined}
          onClick={openProfile}
        >
          <ProfileMark />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}

function HomeMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.5 11.2 12 4.8l7.5 6.4V19a1.2 1.2 0 0 1-1.2 1.2h-4.1v-5.1H9.8v5.1H5.7A1.2 1.2 0 0 1 4.5 19Z" />
    </svg>
  );
}

function MagicMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.2 13.55 8.7 19 10.2 13.55 11.7 12 17.2 10.45 11.7 5 10.2 10.45 8.7Z" />
      <path className="dock-glint" d="M18.2 14.4 18.9 16.3 20.8 17 18.9 17.7 18.2 19.6 17.5 17.7 15.6 17 17.5 16.3Z" />
    </svg>
  );
}

function ProfileMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8.2" r="3.1" />
      <path d="M5.6 19.4c1.2-3 3.4-4.4 6.4-4.4s5.2 1.4 6.4 4.4" />
    </svg>
  );
}
