"use client";

import { useState, useRef } from "react";
import { fmtHours, parseHHMM } from "@/lib/utils/calculations";

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
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Round to whole minutes (stored with 2 decimals like parseHHMM). Rounding to
  // 0.1h turned 1:10 − 0:30 into 0:42 instead of 0:40.
  function stepBy(delta: number) {
    const minutes = Math.round((value + delta) * 60);
    const next = Math.round((minutes / 60) * 100) / 100;
    onChange(Math.min(max, Math.max(min, next)));
  }

  function decrement() {
    stepBy(-step);
  }

  function increment() {
    stepBy(step);
  }

  function startEdit() {
    setDraft(fmtHours(value));
    setEditing(true);
  }

  function commitEdit() {
    const parsed = parseHHMM(draft);
    if (parsed !== null) {
      onChange(Math.min(max, Math.max(min, parsed)));
    }
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
          type="text"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => e.key === "Enter" && commitEdit()}
          placeholder="0:00"
          className="w-14 text-center text-base font-semibold tabular-nums text-on-surface bg-surface-container-low outline-none py-1"
        />
      ) : (
        <button
          type="button"
          onClick={startEdit}
          aria-label={`Editar horas (${fmtHours(value)})`}
          className="w-14 text-center text-base font-semibold tabular-nums text-on-surface cursor-text select-none"
        >
          {fmtHours(value)}
        </button>
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
