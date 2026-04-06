"use client";

import React from "react";
import { useHeatmapData } from "@/lib/hooks/use-heatmap";
import { sumOtrosHours } from "@/lib/utils/calculations";
import { formatMonthShort } from "@/lib/utils/dates";

// Service year months in order: Sep(8)…Dec(11), Jan(0)…Aug(7)
const SERVICE_YEAR_MONTHS = [8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7];
const WEEKDAYS = ["LU", "MA", "MI", "JU", "VI", "SA", "DO"];

// Monday=0 … Sunday=6
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

interface WeekdayHeatmapProps {
  startYear: number;
}

export default function WeekdayHeatmap({ startYear }: WeekdayHeatmapProps) {
  const { entries, loading } = useHeatmapData(startYear);

  if (loading) {
    return <div className="bg-surface-container-low h-44 animate-pulse" />;
  }

  // Build grid: key `${calYear}-${month}-${weekdayIndex}` → total hours
  const grid: Record<string, number> = {};
  for (const e of entries) {
    const d = new Date(e.entry_date + "T00:00:00");
    const month = d.getMonth();
    const calYear = month >= 8 ? startYear : startYear + 1;
    const dow = mondayIndex(d);
    const key = `${calYear}-${month}-${dow}`;
    grid[key] = (grid[key] ?? 0) + e.predicacion_hours + sumOtrosHours(e.otros_hours);
  }

  const maxVal = Math.max(...Object.values(grid), 1);

  function cellStyle(val: number): React.CSSProperties {
    if (val === 0) return { backgroundColor: "#f3f3f5" };
    const opacity = 0.1 + (val / maxVal) * 0.75;
    return { backgroundColor: `rgba(26,28,29,${opacity.toFixed(2)})` };
  }

  return (
    <div className="w-full overflow-x-auto">
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: "28px repeat(7, 1fr)", minWidth: 200 }}
      >
        {/* Header row */}
        <div />
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[8px] font-semibold uppercase tracking-wide text-on-surface-variant pb-1"
          >
            {d}
          </div>
        ))}

        {/* Data rows */}
        {SERVICE_YEAR_MONTHS.map((month) => {
          const calYear = month >= 8 ? startYear : startYear + 1;
          return (
            <React.Fragment key={`row-${calYear}-${month}`}>
              <div className="flex items-center text-[8px] font-medium text-on-surface-variant pr-1">
                {formatMonthShort(month)}
              </div>
              {Array.from({ length: 7 }, (_, dow) => {
                const key = `${calYear}-${month}-${dow}`;
                const val = grid[key] ?? 0;
                return (
                  <div
                    key={key}
                    className="h-4 w-full"
                    style={cellStyle(val)}
                    title={val > 0 ? `${formatMonthShort(month)} ${WEEKDAYS[dow]}: ${val.toFixed(1)}h` : undefined}
                  />
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
