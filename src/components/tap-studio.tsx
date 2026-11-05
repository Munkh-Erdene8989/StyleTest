"use client";

import { createContext, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { TAP_BODY_SHAPES, TAP_PRICE_MNT, tapBodyLabel, type TapBodyShape } from "@/domain/tap";
import { formatMnt } from "@/lib/format";

type TapView = {
  id: string;
  amount: number;
  paymentStatus: "invoiced" | "paid";
  email: string;
  qrImage?: string;
  urls: { name: string; link: string; logo?: string }[];
  simulate: boolean;
  reportStatus: "pending" | "sending" | "sent" | "failed";
  retake: { target: "photo" | "video" | "both"; instructions: string[] } | null;
  type: string | null;
};

type Step = "intro" | "photo" | "video" | "body" | "email" | "pay" | "report";

const STEPS: { id: Step; label: string }[] = [
  { id: "intro", label: "Оршил" },
  { id: "photo", label: "Зураг" },
  { id: "video", label: "Бичлэг" },
  { id: "body", label: "Бие" },
  { id: "email", label: "Имэйл" },
  { id: "pay", label: "Төлбөр" },
  { id: "report", label: "Тайлан" },
];

const BODY_HINT: Record<TapBodyShape, string> = {
  hourglass: "Мөр, ташаа ойролцоо. Бүсэлхий нарийн.",
  pear: "Ташаа мөрнөөс өргөн.",
  apple: "Дунд хэсэг илүү дугуй.",
  rectangle: "Мөр, бүсэлхий, ташаа ойролцоо.",
  inverted_triangle: "Мөр ташаанаас өргөн.",
};

const STEP_TITLE: Record<Step, string> = {
  intro: "Оршил",
  photo: "Зураг авах",
  video: "Бичлэг",
  body: "Биеийн хэлбэр сонгох",
  email: "Имэйл авах",
  pay: "Төлбөр",
  report: "Тайлан имэйлээр очно",
};

const PHOTO_MAX = 20 * 1024 * 1024;
const VIDEO_MAX = 100 * 1024 * 1024;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TapWindowContext = createContext<(() => void) | null>(null);

export function useOpenTap() {
  return useContext(TapWindowContext);
}

export function TapWindowRoot({ email, children }: { email: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <TapWindowContext.Provider value={() => setOpen(true)}>
      {children}
      {open ? (
        <div
          className="tap-modal"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false);
          }}
        >
          <TapWizard email={email} onClose={() => setOpen(false)} />
        </div>
      ) : null}
    </TapWindowContext.Provider>
  );
}

export function TapWizard({ email: initialEmail = "", onClose }: { email?: string; onClose?: () => void }) {
  const photoCamera = useRef<HTMLInputElement>(null);
  const photoFile = useRef<HTMLInputElement>(null);
  const videoCamera = useRef<HTMLInputElement>(null);
  const videoFile = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoBroken, setVideoBroken] = useState(false);
  const [email, setEmail] = useState(initialEmail);
  const [body, setBody] = useState<TapBodyShape | "">("");
  const [consent, setConsent] = useState(false);
  const [step, setStep] = useState<Step>("intro");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [tap, setTap] = useState<TapView | null>(null);

  useEffect(() => {
    if (!photo) {
      setPhotoUrl("");
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  useEffect(() => {
    if (!video) {
      setVideoUrl("");
      setVideoBroken(false);
      return;
    }
    const url = URL.createObjectURL(video);
    setVideoUrl(url);
    setVideoBroken(false);
    return () => URL.revokeObjectURL(url);
  }, [video]);

  useEffect(() => {
    if (!tap || (tap.paymentStatus === "paid" && (tap.reportStatus === "sent" || tap.reportStatus === "failed"))) return;
    const timer = window.setInterval(() => {
      void refresh(tap.id, setTap);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [tap]);

  const retakeKey = tap?.retake ? `${tap.id}:${tap.retake.target}` : "";
  useEffect(() => {
    if (!retakeKey) return;
    setStep(retakeKey.endsWith(":video") ? "video" : "photo");
  }, [retakeKey]);

  useEffect(() => {
    if (!onClose) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    titleRef.current?.focus();
  }, [step]);

  function takePhoto(file: File | null) {
    setError("");
    if (!file) return;
    if (file.size > PHOTO_MAX) {
      setError("Зураг 20MB-аас бага байна.");
      return;
    }
    setPhoto(file);
  }

  function takeVideo(file: File | null) {
    setError("");
    if (!file) return;
    if (file.size > VIDEO_MAX) {
      setError("Бичлэг 100MB-аас бага байна.");
      return;
    }
    setVideo(file);
  }

  function problemFor(current: Step) {
    if (current === "photo" && !photo) return "Нүүрний зургаа оруулна уу.";
    if (current === "video" && !video) return "Нүүрний бичлэгээ оруулна уу.";
    if (current === "body" && !body) return "Биеийн хэлбэрээ сонгоно уу.";
    if (current === "email" && !EMAIL.test(email.trim())) return "Цахим шуудангийн хаягаа зөв оруулна уу.";
    return "";
  }

  function goTo(target: Step) {
    if (target === "report" && tap?.paymentStatus !== "paid") {
      setError("Эхлээд төлбөрөө төлнө үү.");
      return;
    }
    const order = STEPS.map((item) => item.id);
    const from = order.indexOf(step);
    const to = order.indexOf(target);
    if (to <= from) {
      setError("");
      setStep(target);
      return;
    }
    for (let index = from; index < to; index += 1) {
      const problem = problemFor(order[index]);
      if (problem) {
        setError(problem);
        setStep(order[index]);
        return;
      }
    }
    setError("");
    setStep(target);
  }

  function goNext() {
    const order = STEPS.map((item) => item.id);
    const next = order[order.indexOf(step) + 1];
    if (next) goTo(next);
  }

  async function submit() {
    if (!photo || !video) {
      setError("Нүүрний зураг болон нүүрний бичлэгээ оруулна уу.");
      return;
    }
    if (!body) {
      setError("Биеийн хэлбэрээ сонгоно уу.");
      setStep("body");
      return;
    }
    if (!EMAIL.test(email.trim())) {
      setError("Цахим шуудангийн хаягаа зөв оруулна уу.");
      setStep("email");
      return;
    }
    if (!consent) {
      setError("Зураг, бичлэг ашиглах зөвшөөрлөө батална уу.");
      return;
    }
    setPending(true);
    setError("");
    const form = new FormData();
    form.set("photo", photo);
    form.set("video", video);
    form.set("consent", "true");
    const media = await fetch(tap?.paymentStatus === "paid" ? `/api/tap/${tap.id}/replace` : "/api/tap/media", { method: "POST", body: form });
    const mediaBody = await media.json().catch(() => ({}));
    if (!media.ok) {
      setPending(false);
      setError(mediaError(mediaBody.error));
      return;
    }
    if (tap?.paymentStatus === "paid") {
      setTap(mediaBody);
      setPending(false);
      return;
    }
    const checkout = await fetch("/api/tap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, bodyShape: body, photoId: mediaBody.photoId, frameIds: mediaBody.frameIds, videoPath: mediaBody.videoPath }),
    });
    const checkoutBody = await checkout.json().catch(() => ({}));
    setPending(false);
    if (!checkout.ok) {
      setError(mediaError(checkoutBody.error));
      return;
    }
    setTap(checkoutBody);
  }

  async function confirm() {
    if (!tap) return;
    setPending(true);
    const response = await fetch(`/api/tap/${tap.id}/confirm`, { method: "POST" });
    const body = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError("Төлбөрийг одоогоор шалгаж чадсангүй. Дахин оролдоно уу.");
      return;
    }
    if (body.tap) setTap(body.tap);
  }

  async function simulate() {
    if (!tap) return;
    setPending(true);
    const response = await fetch(`/api/tap/${tap.id}/simulate`, { method: "POST" });
    const body = await response.json().catch(() => ({}));
    setPending(false);
    if (response.ok && body.tap) setTap(body.tap);
  }

  async function retry() {
    if (!tap) return;
    setPending(true);
    const response = await fetch(`/api/tap/${tap.id}/retry`, { method: "POST" });
    const body = await response.json().catch(() => ({}));
    setPending(false);
    if (response.ok) setTap(body);
  }

  async function download() {
    if (!tap) return;
    setPending(true);
    const response = await fetch(`/api/tap/${tap.id}/pdf`);
    setPending(false);
    if (!response.ok) {
      setError("PDF татагдсангүй. Дахин оролдоно уу.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "naruka-1-tap.pdf";
    link.click();
    URL.revokeObjectURL(url);
  }

  const settled = Boolean(tap && !tap.retake);
  const shown: Step = settled ? (tap?.paymentStatus === "paid" ? "report" : "pay") : step;
  const shownIndex = STEPS.findIndex((item) => item.id === shown);
  const title = shown === "report" && tap?.reportStatus === "failed" && !tap.retake ? "Дахин бэлтгэх" : STEP_TITLE[shown];
  const nextLabel: Record<Exclude<Step, "pay" | "report">, string> = {
    intro: "Зураг авах",
    photo: "Бичлэг хийх",
    video: "Биеийн хэлбэр",
    body: "Имэйл оруулах",
    email: "Төлбөр рүү",
  };

  return (
    <form
      className="tap-window"
      noValidate
      role={onClose ? "dialog" : undefined}
      aria-modal={onClose ? true : undefined}
      aria-labelledby="tap-window-title"
      onMouseDown={(event) => event.stopPropagation()}
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        if (step === "pay" && !settled) void submit();
        else if (!settled) goNext();
      }}
    >
      <input ref={photoCamera} type="file" accept="image/*" capture="user" hidden onChange={(event) => takePhoto(event.target.files?.[0] ?? null)} />
      <input ref={photoFile} type="file" hidden onChange={(event) => takePhoto(event.target.files?.[0] ?? null)} />
      <input ref={videoCamera} type="file" accept="video/*" capture="user" hidden onChange={(event) => takeVideo(event.target.files?.[0] ?? null)} />
      <input ref={videoFile} type="file" hidden onChange={(event) => takeVideo(event.target.files?.[0] ?? null)} />

      <header className="tap-window-bar">
        {onClose ? (
          <button type="button" className="tap-guide-close" aria-label="Цонх хаах" onClick={onClose}>
            ×
          </button>
        ) : null}
        <p className="kicker">1 TAP · {formatMnt(TAP_PRICE_MNT)}₮</p>
        <h1 id="tap-window-title" ref={titleRef} tabIndex={-1}>
          {title}
        </h1>
        <ol className="tap-steps">
          {STEPS.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                className={index < shownIndex ? "is-done" : undefined}
                aria-current={shown === item.id ? "step" : undefined}
                aria-label={`${index + 1}. ${STEP_TITLE[item.id]}`}
                disabled={settled}
                onClick={() => goTo(item.id)}
              >
                <span>{index + 1}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ol>
      </header>

      {tap?.retake ? (
        <div className="tap-retake">
          <p>
            Дахин оруулна уу.{" "}
            {tap.retake.target === "photo" ? "Нүүрний зураг." : tap.retake.target === "video" ? "Нүүрний бичлэг." : "Зураг ба бичлэг."}
          </p>
          <ul>
            {tap.retake.instructions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {settled && tap ? (
        <TapResult tap={tap} pending={pending} onDownload={() => void download()} onRetry={() => void retry()} onConfirm={() => void confirm()} onSimulate={() => void simulate()} />
      ) : (
        <div className="tap-window-body">
          {step === "intro" ? (
            <div className="tap-step-copy">
              <p>Нүүрний зураг, богино бичлэг, сонгосон биеийн хэлбэрээр 2 хуудастай тайлан гарна. Тайлан имэйлээр очно.</p>
              <ul className="tap-points">
                <li>
                  <strong>Нүүр</strong>
                  <span>Урдаас, 40–60 см, нүдний түвшин. Малгай, нүдний шилгүй.</span>
                </li>
                <li>
                  <strong>Бичлэг</strong>
                  <span>5–8 секунд. Эхлээд төв, дараа нь зүүн, баруун тийш.</span>
                </li>
                <li>
                  <strong>Тайлан</strong>
                  <span>{formatMnt(TAP_PRICE_MNT)}₮. Төлсний дараа PDF имэйлээр ирнэ.</span>
                </li>
              </ul>
            </div>
          ) : null}

          {step === "photo" ? (
            <div className="tap-step-media">
              <PhoneGuide mode="photo" src={photoUrl || "/studio/tap-face-guide.jpg"} live={Boolean(photoUrl)} />
              <div className="tap-step-copy">
                <p>Утсаа нүүрнээс 40–60 см, нүдний түвшинд барь. Нүүрээ зууван хүрээний төвд тавиад хөдөлгөөнгүй, камер руу эгц хар.</p>
                <p className={photo ? "tap-file is-ready" : "tap-file"}>{photo ? `Сонгогдсон · ${photo.name}` : "Зураг сонгоогүй"}</p>
                <div className="tap-actions">
                  <button type="button" className="btn" onClick={() => photoCamera.current?.click()}>
                    Камер
                  </button>
                  <button type="button" className="btn-quiet" onClick={() => photoFile.current?.click()}>
                    Файл
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {step === "video" ? (
            <div className="tap-step-media">
              <PhoneGuide mode="video" src="/studio/tap-face-guide.jpg" videoSrc={videoUrl && !videoBroken ? videoUrl : "/studio/tap-face-turn.mp4"} onVideoError={videoUrl ? () => setVideoBroken(true) : undefined} />
              <div className="tap-step-copy">
                <p>Нүүрээ хүрээнээс гаргалгүй эхлээд төв рүү хар. Дараа нь толгойгоо зүүн, баруун тийш аажуухан эргүүл. 5–8 секунд хангалттай.</p>
                <p className={video ? "tap-file is-ready" : "tap-file"}>{video ? `Сонгогдсон · ${video.name}` : "Бичлэг сонгоогүй"}</p>
                <div className="tap-actions">
                  <button type="button" className="btn" onClick={() => videoCamera.current?.click()}>
                    Камер
                  </button>
                  <button type="button" className="btn-quiet" onClick={() => videoFile.current?.click()}>
                    Файл
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {step === "body" ? (
            <div className="tap-step-copy">
              <p>Өөрт хамгийн ойр хэлбэрээ сонгоно. Сонголт тайлангийн биеийн хэсэгт бичигдэнэ.</p>
              <p className="tap-file">{body ? BODY_HINT[body] : "Нэгийг сонгоно уу."}</p>
              <div className="tap-shapes" role="listbox" aria-label="Биеийн хэлбэр">
                {TAP_BODY_SHAPES.map((shape) => (
                  <button key={shape.id} type="button" role="option" aria-selected={body === shape.id} onClick={() => { setBody(shape.id); setError(""); }}>
                    <ShapeMark id={shape.id} />
                    <span>{shape.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === "email" ? (
            <div className="tap-step-copy">
              <p>Тайлан энэ цахим шуудан руу очно. Төлбөрөөс өмнө хаягаа үлдээнэ.</p>
              <label>
                Цахим шуудан
                <input className="field" type="email" autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
            </div>
          ) : null}

          {step === "pay" ? (
            <div className="tap-step-copy">
              <div className={photoUrl ? "tap-pay-grid" : undefined}>
                {photoUrl ? <img className="tap-thumb" src={photoUrl} alt="Сонгосон нүүрний зураг" /> : null}
              <dl className="tap-summary">
                <div>
                  <dt>Биеийн хэлбэр</dt>
                  <dd>{body ? tapBodyLabel(body) : ""}</dd>
                </div>
                <div>
                  <dt>Цахим шуудан</dt>
                  <dd>{email.trim()}</dd>
                </div>
                <div>
                  <dt>Зураг</dt>
                  <dd>{photo?.name}</dd>
                </div>
                <div>
                  <dt>Бичлэг</dt>
                  <dd>{video?.name}</dd>
                </div>
              </dl>
              </div>
              <label className="tap-consent">
                <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
                <span>Зураг, бичлэгийг зөвхөн энэ тайланд ашиглахыг зөвшөөрч байна.</span>
              </label>
            </div>
          ) : null}
        </div>
      )}

      {error ? (
        <p className="tap-error" role="alert">
          {error}
        </p>
      ) : null}

      {settled ? null : (
        <footer className="tap-window-nav">
          {step === "intro" ? <span /> : (
            <button type="button" className="btn-quiet" onClick={() => goTo(STEPS[STEPS.findIndex((item) => item.id === step) - 1].id)}>
              Буцах
            </button>
          )}
          {step === "pay" ? (
            <button className="btn" type="submit" disabled={pending}>
              {pending ? "Хөрвүүлж байна…" : tap?.paymentStatus === "paid" ? "Дахин илгээх" : `Төлөх · ${formatMnt(TAP_PRICE_MNT)}₮`}
            </button>
          ) : (
            <button className="btn" type="submit">
              {nextLabel[step === "report" ? "email" : step]}
            </button>
          )}
        </footer>
      )}
    </form>
  );
}

function TapResult({
  tap,
  pending,
  onDownload,
  onRetry,
  onConfirm,
  onSimulate,
}: {
  tap: TapView;
  pending: boolean;
  onDownload: () => void;
  onRetry: () => void;
  onConfirm: () => void;
  onSimulate: () => void;
}) {
  if (tap.paymentStatus !== "paid") {
    return (
      <div className="tap-window-body">
        <div className="tap-step-copy">
          <p>
            {formatMnt(tap.amount)}₮. Төлбөр баталгаажмагц тайлан {tap.email} хаяг руу очно.
          </p>
          {tap.qrImage ? <img className="tap-qr" src={tap.qrImage} alt="QPay QR" /> : null}
          <div className="tap-links">
            {tap.urls.map((url) => (
              <a key={url.link} className="btn-quiet" href={url.link}>
                {url.name}
              </a>
            ))}
          </div>
          <div className="tap-actions">
            <button type="button" className="btn" disabled={pending} onClick={onConfirm}>
              Төлбөр шалгах
            </button>
            {tap.simulate ? (
              <button type="button" className="btn-quiet" disabled={pending} onClick={onSimulate}>
                Туршилтын төлбөр
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tap-window-body">
      <div className="tap-step-copy">
        {tap.reportStatus === "sent" ? (
          <>
            <p>
              Тайлан {tap.email} хаяг руу илгээгдлээ. {tap.type ? `${tap.type} төрөл.` : ""}
            </p>
            <button type="button" className="btn" disabled={pending} onClick={onDownload}>
              PDF татах
            </button>
          </>
        ) : null}
        {tap.reportStatus === "failed" && !tap.retake ? (
          <>
            <p>Тайлан бэлтгэгдсэнгүй. Дахин төлбөр авахгүй.</p>
            <button type="button" className="btn" disabled={pending} onClick={onRetry}>
              Дахин бэлтгэх
            </button>
          </>
        ) : null}
        {tap.reportStatus === "pending" || tap.reportStatus === "sending" ? <p>Тайлан бэлэн болмогц {tap.email} хаяг руу очно.</p> : null}
      </div>
    </div>
  );
}

function ShapeMark({ id }: { id: TapBodyShape }) {
  const body = {
    hourglass: "M6 15h28c-1 8-7 13-9 17 5 5 9 12 10 32H5c1-20 5-27 10-32-2-4-8-9-9-17Z",
    pear: "M13 15h14c1 9 0 16 3 24 3 8 5 14 5 25H5c0-11 2-17 5-25 3-8 2-15 3-24Z",
    apple: "M13 16c-5 5-6 14-4 22 2 8 2 14 3 22h16c1-8 1-14 3-22 2-8 1-17-4-22-3 3-6 4-7 4s-4-1-7-4Z",
    rectangle: "M11 15h18v45H11Z",
    inverted_triangle: "M3 15h34L28 60H12Z",
  }[id];
  return (
    <svg className="tap-shape" viewBox="0 0 40 68" aria-hidden="true">
      <circle cx="20" cy="7.5" r="4.2" />
      <path d={body} />
    </svg>
  );
}

function PhoneGuide({
  mode,
  src,
  live = false,
  videoSrc = "",
  onVideoError,
}: {
  mode: "photo" | "video";
  src: string;
  live?: boolean;
  videoSrc?: string;
  onVideoError?: () => void;
}) {
  return (
    <div className="tap-guide-stage">
      <div className={`tap-phone is-${mode}${live || videoSrc ? " is-live" : ""}`}>
        <span className="tap-phone-notch" />
        <div className="tap-phone-screen">
          {videoSrc ? <video src={videoSrc} muted playsInline autoPlay loop onError={onVideoError} /> : <img src={src} alt="" />}
          <span className="tap-phone-oval" />
          <span className="tap-corner tl" />
          <span className="tap-corner tr" />
          <span className="tap-corner bl" />
          <span className="tap-corner br" />
          {live || videoSrc ? null : <span className="tap-scan" />}
          {mode === "video" && !videoSrc ? (
            <>
              <span className="tap-turn left" aria-hidden="true">
                ‹
              </span>
              <span className="tap-turn right" aria-hidden="true">
                ›
              </span>
            </>
          ) : null}
          <span className="tap-phone-dot" />
          <small>{mode === "photo" ? "НҮҮРЭЭ ХҮРЭЭНД\nБАЙРЛУУЛНА УУ" : "ТОЛГОЙГОО ЗӨӨЛӨН\nЭРГҮҮЛНЭ ҮҮ"}</small>
        </div>
      </div>
    </div>
  );
}

async function refresh(id: string, setTap: (tap: TapView) => void) {
  const response = await fetch(`/api/tap/${id}`);
  if (!response.ok) return;
  setTap(await response.json());
}

function mediaError(code?: string) {
  if (code === "invalid_contact") return "Цахим шуудангийн хаягаа зөв оруулна уу.";
  if (code === "invalid_body") return "Биеийн хэлбэрээ сонгоно уу.";
  if (code === "consent_required") return "Зураг ашиглах зөвшөөрлөө батална уу.";
  if (code === "file_too_large") return "Файл хэт том байна. Зураг 20MB, бичлэг 100MB хүртэл.";
  if (code === "invalid_image") return "Энэ файлыг зураг болгож уншиж чадсангүй.";
  if (code === "invalid_video" || code === "video_convert_failed") return "Энэ бичлэгийг хөрвүүлж чадсангүй. Өөр файл сонгоно уу.";
  if (code === "qpay_invoice" || code === "qpay_unconfigured" || code === "qpay_callback_missing") return "QPay нэхэмжлэх үүсгэж чадсангүй. Түр хүлээгээд дахин оролдоно уу.";
  return "Илгээж чадсангүй. Дахин оролдоно уу.";
}
