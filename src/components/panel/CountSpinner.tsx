"use client";

interface CountSpinnerProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function CountSpinner({
  value,
  onChange,
  min = 0,
  max = 99,
}: CountSpinnerProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="flex h-9 w-9 items-center justify-center bg-surface-container text-on-surface disabled:opacity-30 text-lg font-medium transition-opacity ease-out"
        aria-label="Reducir"
      >
        −
      </button>
      <span className="w-12 text-center text-base font-semibold tabular-nums text-on-surface">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="flex h-9 w-9 items-center justify-center bg-surface-container text-on-surface disabled:opacity-30 text-lg font-medium transition-opacity ease-out"
        aria-label="Aumentar"
      >
        +
      </button>
    </div>
  );
}
