"use client";

import { QUIZ_PRICE_MAX_MNT, QUIZ_PRICE_MIN_MNT, quizPriceError } from "@/domain/money";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function QuizPriceField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const issue = quizPriceError(value);
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="numeric"
        min={QUIZ_PRICE_MIN_MNT}
        max={QUIZ_PRICE_MAX_MNT}
        step={1}
        value={value}
        aria-invalid={issue ? true : undefined}
        aria-describedby={issue ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {issue ? (
        <p id={`${id}-error`} className="text-sm text-destructive" role="alert">
          {issue}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Хамгийн багадаа 100₮.</p>
      )}
    </div>
  );
}
