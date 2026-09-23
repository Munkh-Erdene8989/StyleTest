"use client";

export function ShareCard({ title, appName }: { title: string; appName: string }) {
  async function download() {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#f6f4f1";
    ctx.fillRect(0, 0, 1080, 1080);
    ctx.fillStyle = "#0f766e";
    ctx.fillRect(80, 80, 160, 12);
    ctx.fillStyle = "#1c1917";
    ctx.font = "48px sans-serif";
    ctx.fillText(appName, 80, 180);
    ctx.font = "72px sans-serif";
    wrap(ctx, title, 80, 320, 900, 88);
    ctx.font = "32px sans-serif";
    ctx.fillStyle = "#57534e";
    ctx.fillText("Хөгжилтэй тест. Шинжлэх ухааны үнэлгээ биш.", 80, 860);
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "result.png";
    link.click();
  }

  return (
    <button type="button" onClick={() => void download()} className="min-h-12 rounded-xl border border-stone-300 px-4">
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
