"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Measurements = {
  bust: number;
  waist: number;
  highHip: number;
  hip: number;
};

type MeasurementKey = keyof Measurements;

const defaults: Measurements = {
  bust: 90,
  waist: 60,
  highHip: 80,
  hip: 90,
};

const controls: {
  key: MeasurementKey;
  label: string;
  helper: string;
  min: number;
  max: number;
}[] = [
  {
    key: "bust",
    label: "Цээжний тойрог",
    helper: "Цээжний хамгийн өргөн хэсгээр",
    min: 70,
    max: 130,
  },
  {
    key: "waist",
    label: "Бэлхүүсний тойрог",
    helper: "Бэлхүүсний хамгийн нарийн хэсгээр",
    min: 50,
    max: 110,
  },
  {
    key: "highHip",
    label: "Өндөр ташааны тойрог",
    helper: "Бэлхүүснээс 7–10 см доогуур",
    min: 65,
    max: 125,
  },
  {
    key: "hip",
    label: "Ташааны тойрог",
    helper: "Ташааны хамгийн өргөн хэсгээр",
    min: 75,
    max: 140,
  },
];

const bodyTypeInfo: Record<string, { description: string; tag: string }> = {
  "Элсэн цаг": {
    description: "Цээж, ташааны харьцаа тэнцвэртэй бөгөөд бэлхүүс тод ялгарсан байна.",
    tag: "Тэнцвэртэй харьцаа",
  },
  Лийр: {
    description: "Ташааны хэсэг цээжнээс өргөн, бэлхүүс тод ялгарсан харьцаатай байна.",
    tag: "Ташаа давамгай",
  },
  "Урвуу гурвалжин": {
    description: "Цээж, мөрний хэсэг ташаанаас өргөн харагдах харьцаатай байна.",
    tag: "Дээд хэсэг давамгай",
  },
  "Тэгш өнцөгт": {
    description: "Цээж, бэлхүүс, ташааны хэмжээсүүд хоорондоо ойролцоо байна.",
    tag: "Жигд харьцаа",
  },
};

function getBodyType({ bust, waist, hip }: Measurements) {
  const bustHipDifference = bust - hip;
  const waistDefinition = waist / Math.min(bust, hip);

  if (Math.abs(bustHipDifference) <= 5 && waistDefinition <= 0.75) {
    return "Элсэн цаг";
  }
  if (hip - bust > 5) return "Лийр";
  if (bust - hip > 5) return "Урвуу гурвалжин";
  return "Тэгш өнцөгт";
}

const FIGURE = {
  cx: 108,
  bustY: 158,
  waistY: 208,
  highHipY: 244,
  hipY: 276,
  kneeY: 348,
  ankleY: 418,
};

function halfOf(cm: number) {
  return cm * 0.5;
}

function BodyPreview({
  measurements,
  onChange,
}: {
  measurements: Measurements;
  onChange: (key: MeasurementKey, value: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{
    key: MeasurementKey;
    originX: number;
    originCm: number;
    sign: number;
    track: boolean;
  } | null>(null);
  const [active, setActive] = useState<MeasurementKey | null>(null);
  const { cx, bustY, waistY, highHipY, hipY, kneeY, ankleY } = FIGURE;
  const bust = halfOf(measurements.bust);
  const waist = halfOf(measurements.waist);
  const highHip = halfOf(measurements.highHip);
  const hip = halfOf(measurements.hip);
  const shoulder = bust * 0.86;
  const under = waist + (bust - waist) * 0.42;
  const ankle = hip * 0.88;
  const x = (dir: number, width: number) => cx + dir * width;

  const shirt = [
    `M ${x(-1, 8)} 102`,
    `C ${x(-1, 18)} 108, ${x(-1, shoulder * 0.72)} 112, ${x(-1, shoulder)} 124`,
    `C ${x(-1, bust)} 136, ${x(-1, bust)} 146, ${x(-1, bust)} ${bustY}`,
    `C ${x(-1, bust)} ${bustY + 14}, ${x(-1, under)} 184, ${x(-1, under)} 194`,
    `C ${x(-1, waist)} ${waistY - 12}, ${x(-1, waist)} ${waistY - 2}, ${x(-1, waist)} ${waistY}`,
    `Q ${x(-1, waist * 0.4)} ${waistY + 4}, ${cx} ${waistY + 5}`,
    `Q ${x(1, waist * 0.4)} ${waistY + 4}, ${x(1, waist)} ${waistY}`,
    `C ${x(1, waist)} ${waistY - 2}, ${x(1, waist)} ${waistY - 12}, ${x(1, under)} 194`,
    `C ${x(1, under)} 184, ${x(1, bust)} ${bustY + 14}, ${x(1, bust)} ${bustY}`,
    `C ${x(1, bust)} 146, ${x(1, bust)} 136, ${x(1, shoulder)} 124`,
    `C ${x(1, shoulder * 0.72)} 112, ${x(1, 18)} 108, ${x(1, 8)} 102`,
    `Q ${cx} 116, ${x(-1, 8)} 102 Z`,
  ].join(" ");

  const sleeve = (dir: number) =>
    [
      `M ${x(dir, shoulder - 1)} 122`,
      `C ${x(dir, bust)} 128, ${x(dir, bust)} 142, ${x(dir, bust)} ${bustY}`,
      `Q ${x(dir, bust - 5)} ${bustY + 7}, ${x(dir, bust - 9)} ${bustY + 1}`,
      `C ${x(dir, shoulder - 7)} 140, ${x(dir, shoulder - 3)} 128, ${x(dir, shoulder - 1)} 122 Z`,
    ].join(" ");

  const arm = (dir: number) =>
    [
      `M ${x(dir, bust)} ${bustY + 2}`,
      `C ${x(dir, bust - 1)} ${waistY - 10}, ${x(dir, bust - 3)} ${waistY + 16}, ${x(dir, bust - 5)} ${highHipY + 8}`,
      `Q ${x(dir, bust - 9)} ${highHipY + 22}, ${x(dir, bust - 14)} ${highHipY + 10}`,
      `C ${x(dir, bust - 11)} ${waistY + 18}, ${x(dir, bust - 9)} ${bustY + 24}, ${x(dir, bust - 8)} ${bustY + 2} Z`,
    ].join(" ");

  const leg = (dir: number) =>
    [
      `M ${x(dir, waist)} ${waistY}`,
      `C ${x(dir, highHip)} ${highHipY - 16}, ${x(dir, highHip)} ${highHipY}, ${x(dir, highHip)} ${highHipY + 2}`,
      `C ${x(dir, hip)} ${hipY - 12}, ${x(dir, hip)} ${hipY}, ${x(dir, hip)} ${hipY + 8}`,
      `C ${x(dir, ankle)} ${kneeY}, ${x(dir, ankle)} ${ankleY - 24}, ${x(dir, ankle)} ${ankleY}`,
      `L ${x(dir, 10)} ${ankleY}`,
      `C ${x(dir, 9)} ${kneeY}, ${x(dir, 7)} ${hipY + 10}, ${x(dir, 4)} ${hipY - 6}`,
      `C ${x(dir, 2.2)} ${highHipY}, ${x(dir, 1.2)} ${waistY + 12}, ${x(dir, 0.8)} ${waistY} Z`,
    ].join(" ");

  const shoe = (dir: number) => {
    const outer = x(dir, ankle - 1);
    const inner = x(dir, 9);
    const toe = outer + dir * 11;
    return [
      `M ${inner} ${ankleY - 1}`,
      `L ${outer} ${ankleY - 1}`,
      `C ${outer + dir * 3} ${ankleY + 7}, ${toe} ${ankleY + 12}, ${toe} ${ankleY + 14}`,
      `L ${inner - dir} ${ankleY + 14}`,
      `C ${inner} ${ankleY + 8}, ${inner} ${ankleY + 2}, ${inner} ${ankleY - 1} Z`,
    ].join(" ");
  };

  const guideY: Record<MeasurementKey, number> = {
    bust: bustY,
    waist: waistY,
    highHip: highHipY,
    hip: hipY,
  };
  const guideWidth: Record<MeasurementKey, number> = { bust, waist, highHip, hip };

  function pointerX(clientX: number) {
    const svg = svgRef.current;
    if (!svg) return null;
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = 0;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    return point.matrixTransform(matrix.inverse()).x;
  }

  function beginDrag(event: React.PointerEvent<SVGGElement>, key: MeasurementKey) {
    const x = pointerX(event.clientX);
    if (x == null) return;
    event.preventDefault();
    if (event.currentTarget.setPointerCapture) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is unavailable for this event.
      }
    }
    const half = Math.abs(x - cx);
    drag.current = {
      key,
      originX: x,
      originCm: measurements[key],
      sign: x < cx ? -1 : 1,
      track: Math.abs(half - measurements[key] * 0.5) < 22,
    };
    setActive(key);
  }

  function moveDrag(event: React.PointerEvent<SVGGElement>) {
    const session = drag.current;
    if (!session) return;
    const x = pointerX(event.clientX);
    if (x == null) return;
    const next = session.track ? Math.abs(x - cx) * 2 : session.originCm + session.sign * (x - session.originX) * 2;
    onChange(session.key, Math.round(next));
  }

  function endDrag(event: React.PointerEvent<SVGGElement>) {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drag.current = null;
    setActive(null);
  }

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 300 468"
      className={active ? "body-figure is-dragging" : "body-figure"}
      role="img"
      aria-label="Таны оруулсан хэмжээсээр өөрчлөгдөх биеийн дүрс. Тэмдэглэгээг чирж хэмжээг өөрчилнө."
    >
      <defs>
        <linearGradient id="bodycalc-skin" gradientUnits="userSpaceOnUse" x1="78" y1="16" x2="150" y2="140">
          <stop offset="0%" stopColor="#f8d2c0" />
          <stop offset="48%" stopColor="#f0b89a" />
          <stop offset="100%" stopColor="#e0a384" />
        </linearGradient>
        <linearGradient id="bodycalc-shirt" gradientUnits="userSpaceOnUse" x1="48" y1="100" x2="178" y2="220">
          <stop offset="0%" stopColor="#f7ecdf" />
          <stop offset="42%" stopColor="#ead9c6" />
          <stop offset="100%" stopColor="#d2bba4" />
        </linearGradient>
        <linearGradient id="bodycalc-pant" gradientUnits="userSpaceOnUse" x1="36" y1="220" x2="186" y2="470">
          <stop offset="0%" stopColor="#e4d0b8" />
          <stop offset="38%" stopColor="#c9b093" />
          <stop offset="100%" stopColor="#ad9478" />
        </linearGradient>
        <linearGradient id="bodycalc-band" gradientUnits="userSpaceOnUse" x1="60" y1={waistY} x2="160" y2={waistY + 16}>
          <stop offset="0%" stopColor="#cbb59a" />
          <stop offset="100%" stopColor="#a88b72" />
        </linearGradient>
        <radialGradient id="bodycalc-floor" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1e1a18" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#1e1a18" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx={cx} cy="448" rx={Math.max(hip, bust) * 0.9} ry="7" fill="url(#bodycalc-floor)" />

      <path d={leg(-1)} className="body-shape" fill="url(#bodycalc-pant)" />
      <path d={leg(1)} className="body-shape" fill="url(#bodycalc-pant)" />
      <path
        d={`M ${cx} ${waistY + 14} C ${cx - 1.5} ${hipY}, ${cx - 1} ${kneeY}, ${cx} ${ankleY - 8}`}
        className="body-shape"
        fill="none"
        stroke="#a89078"
        strokeOpacity="0.45"
        strokeWidth="1.1"
      />

      <path d={arm(-1)} className="body-shape" fill="url(#bodycalc-skin)" />
      <path d={arm(1)} className="body-shape" fill="url(#bodycalc-skin)" />
      <ellipse className="body-shape" cx={x(-1, bust - 8)} cy={highHipY + 14} rx="5.2" ry="6.4" fill="url(#bodycalc-skin)" />
      <ellipse className="body-shape" cx={x(1, bust - 8)} cy={highHipY + 14} rx="5.2" ry="6.4" fill="url(#bodycalc-skin)" />
      <path d={shirt} className="body-shape" fill="url(#bodycalc-shirt)" />
      <path d={sleeve(-1)} className="body-shape" fill="url(#bodycalc-shirt)" />
      <path d={sleeve(1)} className="body-shape" fill="url(#bodycalc-shirt)" />

      <path
        d={`M ${x(-1, waist)} ${waistY} L ${x(-1, waist * 0.985)} ${waistY + 12} Q ${cx} ${waistY + 15} ${x(1, waist * 0.985)} ${waistY + 12} L ${x(1, waist)} ${waistY} Q ${cx} ${waistY + 3} ${x(-1, waist)} ${waistY} Z`}
        className="body-shape"
        fill="url(#bodycalc-band)"
      />
      <path
        d={`M ${cx} ${waistY + 12} V ${hipY + 6}`}
        className="body-shape"
        fill="none"
        stroke="#a89078"
        strokeOpacity="0.55"
        strokeWidth="0.8"
      />

      <path
        d={`M ${cx - 7.2} 84 C ${cx - 8.2} 96, ${cx - 8.6} 106, ${cx - 8.2} 114 Q ${cx} 119 ${cx + 8.2} 114 C ${cx + 8.6} 106, ${cx + 8.2} 96, ${cx + 7.2} 84 Q ${cx} 89 ${cx - 7.2} 84 Z`}
        fill="url(#bodycalc-skin)"
      />
      <g transform="translate(0 8)">
      <path d={`M ${cx + 3} 78 C ${cx + 8} 90, ${cx + 8} 104, ${cx + 6} 112 L ${cx + 7} 112 C ${cx + 8} 100, ${cx + 7.4} 88, ${cx + 5.5} 78 Z`} fill="#e0a384" opacity="0.35" />
      <path
        d={`M ${cx} 16 C ${cx + 15} 16, ${cx + 21.5} 32, ${cx + 20.5} 48 C ${cx + 19.5} 63, ${cx + 11} 75, ${cx + 1.5} 78 C ${cx - 8} 75, ${cx - 19.5} 63, ${cx - 20.5} 48 C ${cx - 21.5} 32, ${cx - 15} 16, ${cx} 16 Z`}
        fill="url(#bodycalc-skin)"
      />
      <path d={`M ${cx + 6} 34 C ${cx + 16} 42, ${cx + 18} 60, ${cx + 12} 74 C ${cx + 16} 62, ${cx + 14} 46, ${cx + 6} 34 Z`} fill="#e0a384" opacity="0.28" />
      <ellipse cx={cx - 19.5} cy="51" rx="3.2" ry="5.2" fill="#efc0a4" />
      <ellipse cx={cx + 19.5} cy="51" rx="3.2" ry="5.2" fill="#e3ad90" />
      <path
        d={`M ${cx - 18.5} 46 C ${cx - 22} 28, ${cx - 8} 14, ${cx + 1} 15 C ${cx + 12} 14, ${cx + 22} 28, ${cx + 18.5} 48 C ${cx + 13} 38, ${cx + 4} 34, ${cx - 0.5} 35 C ${cx - 7} 34, ${cx - 14} 40, ${cx - 18.5} 46 Z`}
        fill="#322824"
      />
      <ellipse cx={cx + 0.5} cy="17" rx="9.2" ry="6.4" fill="#322824" />
      <ellipse cx={cx - 1.5} cy="14.8" rx="4.4" ry="2.1" fill="#6a564e" opacity="0.4" />
      <ellipse cx={cx - 6.5} cy="62" rx="4.2" ry="2.3" fill="#e7a48e" opacity="0.28" />
      <ellipse cx={cx + 6.5} cy="62" rx="4.2" ry="2.3" fill="#e7a48e" opacity="0.22" />
      <path d={`M ${cx - 11.4} 45.2 Q ${cx - 6.6} 43.1 ${cx - 2.8} 45.4`} fill="none" stroke="#4a3c38" strokeWidth="0.95" strokeLinecap="round" />
      <path d={`M ${cx + 2.8} 45.4 Q ${cx + 6.6} 43.1 ${cx + 11.4} 45.2`} fill="none" stroke="#4a3c38" strokeWidth="0.95" strokeLinecap="round" />
      <path d={`M ${cx - 10.6} 50.8 Q ${cx - 6.6} 48.8 ${cx - 2.8} 50.8 Q ${cx - 6.6} 53.3 ${cx - 10.6} 50.8 Z`} fill="#fffdfb" />
      <path d={`M ${cx + 2.8} 50.8 Q ${cx + 6.6} 48.8 ${cx + 10.6} 50.8 Q ${cx + 6.6} 53.3 ${cx + 2.8} 50.8 Z`} fill="#fffdfb" />
      <path d={`M ${cx - 10.2} 50.6 Q ${cx - 6.6} 49.4 ${cx - 3.2} 50.6`} fill="none" stroke="#2b2422" strokeWidth="0.7" strokeLinecap="round" />
      <path d={`M ${cx + 3.2} 50.6 Q ${cx + 6.6} 49.4 ${cx + 10.2} 50.6`} fill="none" stroke="#2b2422" strokeWidth="0.7" strokeLinecap="round" />
      <circle cx={cx - 6.7} cy="51.1" r="1.2" fill="#2b2422" />
      <circle cx={cx + 6.5} cy="51.1" r="1.2" fill="#2b2422" />
      <circle cx={cx - 7.1} cy="50.7" r="0.35" fill="#fff" />
      <circle cx={cx + 6.1} cy="50.7" r="0.35" fill="#fff" />
      <path d={`M ${cx + 0.3} 54 C ${cx + 1.3} 59.5, ${cx + 0.5} 63.6, ${cx - 0.8} 64.6`} fill="none" stroke="#c9927c" strokeWidth="0.85" strokeLinecap="round" />
      <path d={`M ${cx - 4.6} 69.2 Q ${cx - 2} 70.2 ${cx} 69.8 Q ${cx + 2} 70.2 ${cx + 4.6} 69.2 Q ${cx + 2.2} 72.6 ${cx} 72.8 Q ${cx - 2.2} 72.6 ${cx - 4.6} 69.2 Z`} fill="#c9847e" />
      </g>

      <path
        d={`M ${x(-1, bust)} ${bustY - 1} Q ${x(-1, bust - 7)} ${bustY + 5} ${x(-1, bust - 13)} ${bustY + 1}`}
        className="body-shape"
        fill="none"
        stroke="#b7a08c"
        strokeWidth="0.8"
      />
      <path
        d={`M ${x(1, bust - 13)} ${bustY + 1} Q ${x(1, bust - 7)} ${bustY + 5} ${x(1, bust)} ${bustY - 1}`}
        className="body-shape"
        fill="none"
        stroke="#b7a08c"
        strokeWidth="0.8"
      />
      <path d={`M ${x(-1, 7)} 100 Q ${cx} 112 ${x(1, 7)} 100`} fill="none" stroke="#cbb39f" strokeWidth="1.3" />

      <path d={shoe(-1)} className="body-shape" fill="#eadccf" />
      <path d={shoe(1)} className="body-shape" fill="#ddc9b6" />

      {controls.map((control) => {
        const width = guideWidth[control.key];
        const y = guideY[control.key];
        const value = measurements[control.key];
        return (
          <g
            key={control.key}
            className={active === control.key ? "measure-guide is-active" : "measure-guide"}
            role="slider"
            tabIndex={0}
            aria-label={`${control.label}. Бариад чирж өөрчилнө`}
            aria-valuemin={control.min}
            aria-valuemax={control.max}
            aria-valuenow={value}
            aria-valuetext={`${value} сантиметр`}
            onPointerDown={(event) => beginDrag(event, control.key)}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={(event) => {
              const step = event.shiftKey ? 5 : 1;
              if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                event.preventDefault();
                onChange(control.key, value + step);
              }
              if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                event.preventDefault();
                onChange(control.key, value - step);
              }
            }}
          >
            <line className="measure-hit measure-hit-line" x1={x(-1, width)} x2={x(1, width)} y1={y} y2={y} />
            <circle className="measure-hit" cx={x(-1, width)} cy={y} r="14" />
            <circle className="measure-hit" cx={x(1, width)} cy={y} r="14" />
            <rect className="measure-hit" x="196" y={y - 12} width="86" height="24" />
            <line
              x1={x(-1, width)}
              x2={x(1, width)}
              y1={y}
              y2={y}
              stroke="#7a2340"
              strokeWidth="1.15"
              strokeDasharray="2 3.2"
            />
            <circle className="measure-dot" cx={x(-1, width)} cy={y} r="5" fill="#faf7f2" stroke="#7a2340" strokeWidth="1.5" />
            <circle className="measure-dot" cx={x(1, width)} cy={y} r="5" fill="#faf7f2" stroke="#7a2340" strokeWidth="1.5" />
            <path d={`M ${x(1, width) + 8} ${y} H 196`} stroke="#e5dbd4" strokeWidth="1" />
            <text className="body-measure-label" x="202" y={y + 4}>
              {value} см
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function BodyEdgeMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="4.15" r="2.05" />
      <path d="M8.15 9.05c.45-1.15 1.7-1.9 3.85-1.9s3.4.75 3.85 1.9c.35.9-.35 1.45-1.05 1.35.15 1.7.35 3.55.55 5.35.15 1.35-1.85 1.7-2.15.35L12.6 14.2h-1.2l-.6 1.9c-.3 1.35-2.3 1-2.15-.35.2-1.8.4-3.65.55-5.35-.7.1-1.4-.45-1.05-1.35Z" />
    </svg>
  );
}

export function BodyCalculator() {
  const previewRef = useRef<HTMLDivElement>(null);
  const [measurements, setMeasurements] = useState<Measurements>(defaults);
  const [mounted, setMounted] = useState(false);
  const bodyType = useMemo(() => getBodyType(measurements), [measurements]);
  const bodyInfo = bodyTypeInfo[bodyType];
  const isDefault = controls.every(({ key }) => measurements[key] === defaults[key]);

  useEffect(() => {
    setMounted(true);
  }, []);

  function jumpToPreview() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    previewRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  const updateMeasurement = (key: MeasurementKey, value: number) => {
    const control = controls.find((item) => item.key === key)!;
    const safeValue = Math.max(control.min, Math.min(control.max, value || control.min));
    setMeasurements((current) => ({ ...current, [key]: safeValue }));
  };

  return (
    <section className="body-stage">
      <div className="body-controls">
        <div className="body-panel-head">
          <div>
            <p className="kicker">Алхам 01</p>
            <h2>Хэмжээсээ оруулна уу</h2>
          </div>
          <button type="button" className="btn-quiet btn-small" onClick={() => setMeasurements(defaults)} disabled={isDefault}>
            Шинээр эхлэх
          </button>
        </div>

        <div className="body-fields">
          {controls.map((control) => {
            const value = measurements[control.key];
            const progress = ((value - control.min) / (control.max - control.min)) * 100;

            return (
              <div key={control.key}>
                <div className="body-field-row">
                  <div>
                    <label htmlFor={control.key}>{control.label}</label>
                    <p>{control.helper}</p>
                  </div>
                  <div className="body-value">
                    <input
                      id={control.key}
                      type="number"
                      min={control.min}
                      max={control.max}
                      value={value}
                      onChange={(event) => updateMeasurement(control.key, Number(event.target.value))}
                      aria-label={`${control.label}, сантиметрээр`}
                    />
                    <span>см</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  value={value}
                  onChange={(event) => updateMeasurement(control.key, Number(event.target.value))}
                  className="measurement-range"
                  style={{ "--range-progress": `${progress}%` } as React.CSSProperties}
                  aria-label={`${control.label} гулсуур`}
                />
                <div className="body-scale">
                  <span>{control.min} см</span>
                  <span>{control.max} см</span>
                </div>
              </div>
            );
          })}
        </div>

        <p className="body-note">
          <strong>Зөвлөгөө:</strong> Хэмжих туузыг биедээ хэт бариу бус, газартай параллель байрлуулж хэмжээрэй.
        </p>
      </div>

      {mounted
        ? createPortal(
            <button type="button" className="body-edge body-edge-on" onClick={jumpToPreview} aria-label="Body calculator, дүрслэл рүү очих">
              <span className="body-edge-mark" aria-hidden="true">
                <BodyEdgeMark />
              </span>
              <span className="body-edge-copy">Body calculator</span>
            </button>,
            document.body,
          )
        : null}

      <div className="body-preview" id="body-preview" ref={previewRef}>
        <div className="body-panel-head">
          <div>
            <p className="kicker">Алхам 02</p>
            <h2>Таны дүрслэл</h2>
          </div>
          <span className="body-live">Шууд шинэчлэгдэнэ</span>
        </div>

        <div className="body-preview-grid">
          <div className="body-figure-wrap">
            <BodyPreview measurements={measurements} onChange={updateMeasurement} />
            <p className="body-drag-hint">Тэмдэглэгээг бариад чирнэ үү.</p>
          </div>
          <div className="body-result">
            <p className="kicker">Таны биеийн төрөл</p>
            <h3>{bodyType}</h3>
            <span className="body-tag">{bodyInfo.tag}</span>
            <dl>
              <div>
                <dt>Цээж / Ташаа</dt>
                <dd>{(measurements.bust / measurements.hip).toFixed(2)}</dd>
              </div>
              <div>
                <dt>Бэлхүүс / Ташаа</dt>
                <dd>{(measurements.waist / measurements.hip).toFixed(2)}</dd>
              </div>
            </dl>
            <p>{bodyInfo.description}</p>
          </div>
        </div>

        <p className="body-disclaimer">Үр дүн нь зөвхөн ерөнхий харьцаанд тулгуурласан бөгөөд хүн бүрийн биеийн онцлог давтагдашгүй.</p>
      </div>
    </section>
  );
}
