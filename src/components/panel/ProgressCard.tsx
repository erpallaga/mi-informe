"use client";

import { useState, useEffect, useRef } from "react";
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
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayFading, setOverlayFading] = useState(false);
  const prevCurrentRef = useRef<number | null>(null);

  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
  const done = !noGoal && goal > 0 && current >= goal;
  const hasOtros = collapsibleDetails && collapsibleDetails.length > 0;

  // Detect the moment the goal is crossed
  useEffect(() => {
    const prev = prevCurrentRef.current;
    if (prev !== null && prev < goal && current >= goal && !noGoal && goal > 0) {
      setShowOverlay(true);
      setOverlayFading(false);
      const fadeTimer = setTimeout(() => setOverlayFading(true), 3000);
      const hideTimer = setTimeout(() => setShowOverlay(false), 3600);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
    prevCurrentRef.current = current;
  }, [current, goal, noGoal]);

  return (
    <div
      className={`relative p-5 flex flex-col gap-4 transition-colors duration-700 ease-out ${
        done ? "bg-primary" : "bg-surface-container-low"
      }`}
    >
      {/* Glassmorphism overlay */}
      {showOverlay && (
        <div
          className={`absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[20px] bg-white/80 transition-opacity duration-500 ease-out ${
            overlayFading ? "opacity-0" : "opacity-100"
          }`}
        >
          <p className="text-3xl font-black uppercase tracking-widest text-primary text-center leading-tight">
            Objetivo<br />Cumplido
          </p>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <p className={`text-xs font-medium uppercase tracking-widest ${done ? "text-white/60" : "text-on-surface-variant"}`}>
          {title}
        </p>
        {done && (
          <span className="text-xs font-semibold uppercase tracking-widest text-white/80">
            Cumplido
          </span>
        )}
      </div>

      <div className="flex items-end gap-1.5">
        <span className={`text-3xl font-black tabular-nums leading-none ${done ? "text-white" : "text-primary"}`}>
          {fmtHours(current)}
        </span>
        {!noGoal && (
          <span className={`text-sm mb-0.5 ${done ? "text-white/60" : "text-on-surface-variant"}`}>
            / {goal} hrs
          </span>
        )}
        {noGoal && (
          <span className={`text-sm mb-0.5 ${done ? "text-white/60" : "text-on-surface-variant"}`}>hrs</span>
        )}
      </div>

      {((details && details.length > 0) || hasOtros) && (
        <div className="flex flex-col gap-1.5">
          {details?.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className={`text-xs ${done ? "text-white/60" : "text-on-surface-variant"}`}>{row.label}</span>
              <span className={`text-xs font-medium tabular-nums ${done ? "text-white/80" : "text-on-surface"}`}>{row.value}</span>
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
                  <span className={`text-xs ${done ? "text-white/60" : "text-on-surface-variant"}`}>Otros trabajos</span>
                  <span className={`text-xs ${done ? "text-white/60" : "text-on-surface-variant"}`}>{otrosOpen ? "▲" : "▼"}</span>
                </button>
                <span className={`text-xs font-medium tabular-nums ${done ? "text-white/80" : "text-on-surface"}`}>
                  {collapsibleTotal !== undefined ? fmtHours(collapsibleTotal) : ""}
                </span>
              </div>

              {otrosOpen && (
                <div className="flex flex-col gap-1.5 pl-2 pt-0.5">
                  {collapsibleDetails.map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className={`text-xs ${done ? "text-white/60" : "text-on-surface-variant"}`}>{row.label}</span>
                      <span className={`text-xs font-medium tabular-nums ${done ? "text-white/80" : "text-on-surface"}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!noGoal && (
        <div className={`h-1 w-full ${done ? "bg-white/20" : "bg-surface-container-high"}`}>
          <div
            className={`h-1 transition-all duration-500 ease-out ${done ? "bg-white" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
