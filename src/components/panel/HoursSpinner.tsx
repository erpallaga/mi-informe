"use client";

interface HoursSpinnerProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
}

export default function HoursSpinner({
  value,
  onChange,
  step = 0.5,
  min = 0,
  max = 24,
}: HoursSpinnerProps) {
  function decrement() {
    const next = Math.max(min, Math.round((value - step) * 10) / 10);
    onChange(next);
  }

  function increment() {
    const next = Math.min(max, Math.round((value + step) * 10) / 10);
    onChange(next);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        className="flex h-9 w-9 items-center justify-center bg-surface-container text-on-surface disabled:opacity-30 text-lg font-medium transition-opacity ease-out"
        aria-label="Reducir"
      >
        −
      </button>
      <span className="w-12 text-center text-base font-semibold tabular-nums text-on-surface">
        {value % 1 === 0 ? `${value}` : value.toFixed(1)}
      </span>
      <button
        type="button"
        onClick={increment}
        disabled={value >= max}
        className="flex h-9 w-9 items-center justify-center bg-surface-container text-on-surface disabled:opacity-30 text-lg font-medium transition-opacity ease-out"
        aria-label="Aumentar"
      >
        +
      </button>
    </div>
  );
}
