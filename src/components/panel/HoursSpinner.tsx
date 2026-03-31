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

  function decrement() {
    const next = Math.max(min, Math.round((value - step) * 10) / 10);
    onChange(next);
  }

  function increment() {
    const next = Math.min(max, Math.round((value + step) * 10) / 10);
    onChange(next);
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
        <span
          onClick={startEdit}
          className="w-14 text-center text-base font-semibold tabular-nums text-on-surface cursor-text select-none"
        >
          {fmtHours(value)}
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
