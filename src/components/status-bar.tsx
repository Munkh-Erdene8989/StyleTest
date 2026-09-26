import type { TrackProgress } from "@/domain/progress";

export function StatusBar({ progress }: { progress: TrackProgress }) {
  return (
    <div className="status-bars">
      <p className="status-label">Хариулт {progress.answered}/{progress.questions}</p>
      <div
        className="meter"
        role="progressbar"
        aria-label={`Хариулт ${progress.answered}/${progress.questions}`}
        aria-valuemin={0}
        aria-valuemax={progress.questions}
        aria-valuenow={progress.answered}
      >
        <span style={{ width: percent(progress.answered, progress.questions) }} />
      </div>
      <p className="status-label">{progress.reportLabel}</p>
      <div
        className={progress.failed ? "meter meter-fail" : "meter"}
        role="progressbar"
        aria-label={progress.reportLabel}
        aria-valuemin={0}
        aria-valuemax={progress.reportTotal}
        aria-valuenow={progress.reportDone}
      >
        <span style={{ width: percent(progress.reportDone, progress.reportTotal) }} />
      </div>
    </div>
  );
}

function percent(done: number, total: number) {
  if (total <= 0) return "0%";
  return `${Math.max(0, Math.min(100, Math.round((done / total) * 100)))}%`;
}
