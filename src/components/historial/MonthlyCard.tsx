"use client";

import { useState } from "react";
import type { MonthData } from "@/lib/hooks/use-history";
import { useCategories } from "@/lib/hooks/use-categories";
import { getMonthName } from "@/lib/utils/dates";

interface MonthlyCardProps {
  data: MonthData;
  prev: MonthData | null;
}

export default function MonthlyCard({ data, prev }: MonthlyCardProps) {
  const [otrosOpen, setOtrosOpen] = useState(false);
  const { categories } = useCategories();

  if (data.entriesCount === 0) return null;

  const delta =
    prev && prev.totalHours > 0 ? data.totalHours - prev.totalHours : null;

  const otrosCategories = categories.filter(
    (cat) => (data.otrosByCategory?.[cat.id] ?? 0) > 0
  );

  function fmt(h: number) {
    return h % 1 === 0 ? `${h}h` : `${h.toFixed(1)}h`;
  }

  return (
    <div className="bg-surface-container-low p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
          {getMonthName(data.month)}
        </p>
        {delta !== null && (
          <span
            className={`text-xs font-semibold ${
              delta >= 0 ? "text-on-surface" : "text-secondary"
            }`}
          >
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}h
          </span>
        )}
      </div>

      <div className="flex items-end gap-1.5">
        <span className="text-3xl font-black tabular-nums text-primary leading-none">
          {data.totalHours % 1 === 0 ? data.totalHours : data.totalHours.toFixed(1)}
        </span>
        <span className="text-sm text-on-surface-variant mb-0.5">hrs</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-on-surface-variant">Predicación</span>
          <span className="text-xs font-medium text-on-surface tabular-nums">
            {fmt(data.predicacionHours)}
          </span>
        </div>

        {data.cursosBiblicos > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">Cursos bíblicos</span>
            <span className="text-xs font-medium text-on-surface tabular-nums">
              {data.cursosBiblicos}
            </span>
          </div>
        )}

        {otrosCategories.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setOtrosOpen((v) => !v)}
              className="flex items-center justify-between pt-0.5"
            >
              <span className="text-xs text-on-surface-variant">Otros trabajos</span>
              <span className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
                {otrosOpen ? "Ocultar" : "Ver"}
              </span>
            </button>

            {otrosOpen && (
              <div className="flex flex-col gap-1.5 pl-2">
                {otrosCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant">{cat.name}</span>
                    <span className="text-xs font-medium text-on-surface tabular-nums">
                      {fmt(data.otrosByCategory[cat.id])}
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
