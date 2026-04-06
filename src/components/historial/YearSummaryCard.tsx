"use client";

import { useState } from "react";
import type { MonthData } from "@/lib/hooks/use-history";
import type { Category } from "@/lib/types";
import { fmtHours } from "@/lib/utils/calculations";

interface YearSummaryCardProps {
  months: MonthData[];
  categories: Category[];
}

export default function YearSummaryCard({ months, categories }: YearSummaryCardProps) {
  const [otrosOpen, setOtrosOpen] = useState(false);

  const predicacionTotal = months.reduce((s, m) => s + m.predicacionHours, 0);
  const otrosTotal = months.reduce((s, m) => s + m.otrosHours, 0);
  const totalHours = predicacionTotal + otrosTotal;

  // Aggregate otros by category across all months
  const otrosByCategory: Record<string, number> = {};
  for (const m of months) {
    for (const [id, h] of Object.entries(m.otrosByCategory ?? {})) {
      otrosByCategory[id] = (otrosByCategory[id] ?? 0) + h;
    }
  }

  const otrosCategories = categories.filter((cat) => (otrosByCategory[cat.id] ?? 0) > 0);

  const pctOf = (part: number) =>
    totalHours > 0 ? Math.round((part / totalHours) * 100) : 0;

  if (totalHours === 0) return null;

  return (
    <div className="bg-surface-container-low px-4 py-4 flex flex-col gap-3">
      {/* Total + progreso */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
            Total año
          </p>
          <p className="text-2xl font-black tabular-nums text-primary leading-none mt-0.5">
            {fmtHours(totalHours)}
          </p>
        </div>
      </div>

      {/* Desglose */}
      <div className="flex flex-col gap-1.5 pt-0.5">
        {/* Predicación */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-on-surface-variant">Predicación</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-on-surface-variant tabular-nums">
              {pctOf(predicacionTotal)}%
            </span>
            <span className="text-xs font-medium text-on-surface tabular-nums w-14 text-right">
              {fmtHours(predicacionTotal)}
            </span>
          </div>
        </div>

        {/* Otros proyectos */}
        {otrosTotal > 0 && (
          <>
            <div className="flex items-center justify-between">
              {otrosCategories.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setOtrosOpen((v) => !v)}
                  className="flex items-center gap-1.5"
                >
                  <span className="text-xs text-on-surface-variant">Otros proyectos</span>
                  <span className="text-[9px] text-on-surface-variant">{otrosOpen ? "▲" : "▼"}</span>
                </button>
              ) : (
                <span className="text-xs text-on-surface-variant">Otros proyectos</span>
              )}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-on-surface-variant tabular-nums">
                  {pctOf(otrosTotal)}%
                </span>
                <span className="text-xs font-medium text-on-surface tabular-nums w-14 text-right">
                  {fmtHours(otrosTotal)}
                </span>
              </div>
            </div>

            {otrosOpen && otrosCategories.length > 0 && (
              <div className="flex flex-col gap-1.5 pl-3">
                {otrosCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant">{cat.name}</span>
                    <span className="text-xs font-medium text-on-surface tabular-nums w-14 text-right">
                      {fmtHours(otrosByCategory[cat.id])}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
