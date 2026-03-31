"use client";

import { useState } from "react";

interface DetailRow {
  label: string;
  value: string;
}

interface ProgressCardProps {
  title: string;
  current: number;
  goal: number;
  details?: DetailRow[];
  collapsibleDetails?: DetailRow[];
  noGoal?: boolean;
}

export default function ProgressCard({
  title,
  current,
  goal,
  details,
  collapsibleDetails,
  noGoal = false,
}: ProgressCardProps) {
  const [otrosOpen, setOtrosOpen] = useState(false);
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
  const done = !noGoal && goal > 0 && current >= goal;
  const hasOtros = collapsibleDetails && collapsibleDetails.length > 0;

  return (
    <div className="bg-surface-container-low p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
          {title}
        </p>
        {done && (
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Cumplido
          </span>
        )}
      </div>

      <div className="flex items-end gap-1.5">
        <span className="text-3xl font-black tabular-nums text-primary leading-none">
          {current % 1 === 0 ? current : current.toFixed(1)}
        </span>
        {!noGoal && (
          <span className="text-sm text-on-surface-variant mb-0.5">
            / {goal} hrs
          </span>
        )}
        {noGoal && (
          <span className="text-sm text-on-surface-variant mb-0.5">hrs</span>
        )}
      </div>

      {((details && details.length > 0) || hasOtros) && (
        <div className="flex flex-col gap-1.5">
          {details?.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">{row.label}</span>
              <span className="text-xs font-medium text-on-surface tabular-nums">{row.value}</span>
            </div>
          ))}

          {hasOtros && (
            <>
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setOtrosOpen((v) => !v)}
                  className="flex items-center gap-1.5"
                >
                  <span className="text-xs text-on-surface-variant">Otros trabajos</span>
                  <span className="text-xs text-on-surface-variant">{otrosOpen ? "▲" : "▼"}</span>
                </button>
                <span className="text-xs font-medium text-on-surface tabular-nums">
                  {collapsibleDetails.reduce((acc, r) => {
                    const n = parseFloat(r.value);
                    return acc + (isNaN(n) ? 0 : n);
                  }, 0).toFixed(1).replace(/\.0$/, "")}h
                </span>
              </div>

              {otrosOpen && (
                <div className="flex flex-col gap-1.5 pl-2 pt-0.5">
                  {collapsibleDetails.map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-xs text-on-surface-variant">{row.label}</span>
                      <span className="text-xs font-medium text-on-surface tabular-nums">{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!noGoal && (
        <div className="h-1 w-full bg-surface-container-high">
          <div
            className="h-1 bg-primary transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
