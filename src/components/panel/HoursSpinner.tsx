"use client";

import { useState, useRef } from "react";

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
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function decrement() {
    const next = Math.max(min, Math.round((value - step) * 10) / 10);
    onChange(next);
  }

  function increment() {
    const next = Math.min(max, Math.round((value + step) * 10) / 10);
    onChange(next);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value);
    if (!isNaN(v)) onChange(Math.min(max, Math.max(min, Math.round(v * 100) / 100)));
  }

  function commitEdit() {
    setEditing(false);
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

      {editing ? (
        <input
          ref={inputRef}
          type="number"
          value={value}
          min={min}
          max={max}
          step={0.25}
          autoFocus
          onChange={handleInputChange}
          onBlur={commitEdit}
          onKeyDown={(e) => e.key === "Enter" && commitEdit()}
          className="w-12 text-center text-base font-semibold tabular-nums text-on-surface bg-surface-container-low outline-none py-1"
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className="w-12 text-center text-base font-semibold tabular-nums text-on-surface cursor-text select-none"
        >
          {value % 1 === 0 ? `${value}` : value.toFixed(2).replace(/\.?0+$/, "")}
        </span>
      )}

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
