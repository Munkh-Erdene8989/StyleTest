"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { AI_QUIZ_CATALOG } from "@/content/quizzes/catalog";
import { formatMnt } from "@/lib/format";
import { LoginForm } from "@/components/login-form";

type Sheet = "magic" | "profile" | null;

export function MobileDock({
  loggedIn,
  archetypeReady,
  price,
}: {
  loggedIn: boolean;
  archetypeReady: boolean;
  price: number;
}) {
  const pathname = usePathname();
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

  function openMagic() {
    setSheet((current) => (current === "magic" ? null : "magic"));
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
  const magicOn = sheet === "magic" || (sheet === null && pathname.startsWith("/tests"));
  const profileOn = sheet === "profile" || (sheet === null && (pathname.startsWith("/account") || pathname === "/login"));

  return (
    <div className="mobile-dock">
      {sheet ? (
        <button type="button" className="dock-backdrop" aria-label="Хаах" onClick={() => setSheet(null)} />
      ) : null}
      {sheet === "magic" ? (
        <section
          ref={sheetRef}
          id={sheetId}
          className="dock-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Тестүүд"
          tabIndex={-1}
        >
          <header className="dock-sheet-head">
            <h2>Тестүүд</h2>
            <button type="button" onClick={() => setSheet(null)}>
              Хаах
            </button>
          </header>
          <ul className="dock-tests">
            {AI_QUIZ_CATALOG.map((quiz) => {
              const waiting = quiz.kind === "archetype" && !archetypeReady;
              return (
                <li key={quiz.slug}>
                  {waiting ? (
                    <div>
                      <strong>{quiz.title}</strong>
                      <span>Асуултын файл хүлээгдэж байна.</span>
                    </div>
                  ) : (
                    <Link href={`/tests/${quiz.slug}`} onClick={() => setSheet(null)}>
                      <strong>{quiz.title}</strong>
                      <span>
                        {quiz.minutes} минут · {formatMnt(price)}₮
                      </span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
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
          className={magicOn ? "dock-on" : undefined}
          aria-expanded={sheet === "magic"}
          aria-controls={sheet === "magic" ? sheetId : undefined}
          onClick={openMagic}
        >
          <MagicMark />
          <span>Magic</span>
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
      <path d="M18.2 14.4 18.9 16.3 20.8 17 18.9 17.7 18.2 19.6 17.5 17.7 15.6 17 17.5 16.3Z" />
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
