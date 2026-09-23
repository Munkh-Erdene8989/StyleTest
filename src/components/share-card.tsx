"use client";

export function ShareCard({ title, appName }: { title: string; appName: string }) {
  async function download() {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#f4f3ef";
    ctx.fillRect(0, 0, 1080, 1080);
    ctx.fillStyle = "#6e2c38";
    ctx.fillRect(0, 0, 28, 1080);
    ctx.fillStyle = "#141414";
    const family = getComputedStyle(document.body).fontFamily || "sans-serif";
    ctx.font = `500 42px ${family}`;
    ctx.fillText(appName, 96, 180);
    ctx.font = `600 78px ${family}`;
    wrap(ctx, title, 96, 340, 900, 96);
    ctx.font = `400 32px ${family}`;
    ctx.fillStyle = "#5c5852";
    ctx.fillText("Хөгжилтэй тест. Шинжлэх ухааны үнэлгээ биш.", 96, 960);
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "result.png";
    link.click();
  }

  return (
    <button type="button" onClick={() => void download()} className="btn-quiet">
      Хуваалцах зураг татах
    </button>
  );
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, line: number) {
  const words = text.split(" ");
  let row = "";
  let top = y;
  for (const word of words) {
    const next = `${row} ${word}`.trim();
    if (ctx.measureText(next).width > max) {
      ctx.fillText(row, x, top);
      row = word;
      top += line;
    } else row = next;
  }
  ctx.fillText(row, x, top);
}
