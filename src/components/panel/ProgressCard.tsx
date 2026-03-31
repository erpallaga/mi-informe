"use client";

import { useState } from "react";
import { fmtHours } from "@/lib/utils/calculations";

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
  collapsibleTotal?: number;
  noGoal?: boolean;
}

export default function ProgressCard({
  title,
  current,
  goal,
  details,
  collapsibleDetails,
  collapsibleTotal,
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
          {fmtHours(current)}
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
                  {collapsibleTotal !== undefined ? fmtHours(collapsibleTotal) : ""}
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
