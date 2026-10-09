"use client";

import { useMemo, useState } from "react";

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

function scaleWidth(value: number, min: number, max: number, from: number, to: number) {
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return from + ratio * (to - from);
}

function BodyPreview({ measurements }: { measurements: Measurements }) {
  const bustWidth = scaleWidth(measurements.bust, 70, 130, 45, 76);
  const waistWidth = scaleWidth(measurements.waist, 50, 110, 29, 65);
  const highHipWidth = scaleWidth(measurements.highHip, 65, 125, 42, 73);
  const hipWidth = scaleWidth(measurements.hip, 75, 140, 48, 79);
  const left = (width: number) => 130 - width;
  const right = (width: number) => 130 + width;

  const bodyPath = [
    "M 117 54",
    "C 106 59, 100 68, 99 82",
    `C ${left(bustWidth) - 15} 88, ${left(bustWidth) - 9} 104, ${left(bustWidth)} 120`,
    `C ${left(bustWidth) + 1} 137, ${left(waistWidth) - 5} 153, ${left(waistWidth)} 174`,
    `C ${left(waistWidth) + 1} 188, ${left(highHipWidth) - 3} 198, ${left(highHipWidth)} 210`,
    `C ${left(hipWidth) - 4} 225, ${left(hipWidth)} 243, ${left(hipWidth) + 8} 259`,
    `C ${left(hipWidth) + 18} 281, 101 296, 103 320`,
    "L 109 405",
    "C 110 421, 121 423, 126 407",
    "L 130 338",
    "L 134 407",
    "C 139 423, 150 421, 151 405",
    "L 157 320",
    `C 159 296, ${right(hipWidth) - 18} 281, ${right(hipWidth) - 8} 259`,
    `C ${right(hipWidth)} 243, ${right(hipWidth) + 4} 225, ${right(highHipWidth)} 210`,
    `C ${right(highHipWidth) + 3} 198, ${right(waistWidth) - 1} 188, ${right(waistWidth)} 174`,
    `C ${right(waistWidth) + 5} 153, ${right(bustWidth) - 1} 137, ${right(bustWidth)} 120`,
    `C ${right(bustWidth) + 9} 104, ${right(bustWidth) + 15} 88, 161 82`,
    "C 160 68, 154 59, 143 54",
    "C 141 66, 119 66, 117 54 Z",
  ].join(" ");

  const guides = [
    { key: "bust", y: 120, width: bustWidth, value: measurements.bust },
    { key: "waist", y: 174, width: waistWidth, value: measurements.waist },
    { key: "highHip", y: 210, width: highHipWidth, value: measurements.highHip },
    { key: "hip", y: 246, width: hipWidth, value: measurements.hip },
  ];

  return (
    <svg viewBox="0 0 350 450" className="body-figure" role="img" aria-label="Таны оруулсан хэмжээсээр өөрчлөгдөх биеийн дүрс">
      <defs>
        <linearGradient id="bodyGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f6ecec" />
          <stop offset="100%" stopColor="#c4956a" />
        </linearGradient>
        <filter id="bodyShadow" x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#1e1a18" floodOpacity=".12" />
        </filter>
      </defs>

      <ellipse cx="130" cy="426" rx="64" ry="10" fill="#1e1a18" opacity=".06" />
      <circle cx="130" cy="30" r="24" fill="url(#bodyGradient)" />
      <path d={bodyPath} fill="url(#bodyGradient)" filter="url(#bodyShadow)" className="body-shape" />

      {guides.map((guide, index) => (
        <g key={guide.key} className="measure-guide">
          <line
            x1={left(guide.width) - 5}
            x2={right(guide.width) + 5}
            y1={guide.y}
            y2={guide.y}
            stroke={index === 1 ? "#7a2340" : "#c4956a"}
            strokeWidth="1.4"
            strokeDasharray="3 4"
          />
          <circle cx={left(guide.width)} cy={guide.y} r="3.2" fill="#fffdfb" stroke="#7a2340" />
          <circle cx={right(guide.width)} cy={guide.y} r="3.2" fill="#fffdfb" stroke="#7a2340" />
          <path d={`M ${right(guide.width) + 8} ${guide.y} H 248`} stroke="#e8ddd5" />
          <text x="258" y={guide.y + 4} fill="#3a3330" fontSize="11" fontWeight="650">
            {guide.value} см
          </text>
        </g>
      ))}
    </svg>
  );
}

export function BodyCalculator() {
  const [measurements, setMeasurements] = useState<Measurements>(defaults);
  const bodyType = useMemo(() => getBodyType(measurements), [measurements]);
  const bodyInfo = bodyTypeInfo[bodyType];
  const isDefault = controls.every(({ key }) => measurements[key] === defaults[key]);

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

      <div className="body-preview">
        <div className="body-panel-head">
          <div>
            <p className="kicker">Алхам 02</p>
            <h2>Таны дүрслэл</h2>
          </div>
          <span className="body-live">Шууд шинэчлэгдэнэ</span>
        </div>

        <div className="body-preview-grid">
          <BodyPreview measurements={measurements} />
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
