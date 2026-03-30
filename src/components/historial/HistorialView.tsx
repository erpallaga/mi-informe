"use client";

import { useHistory } from "@/lib/hooks/use-history";
import MonthlyBarChart from "./MonthlyBarChart";
import MonthlyCard from "./MonthlyCard";

export default function HistorialView() {
  const year = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const { months, loading } = useHistory(year);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="bg-surface-container-low h-40 animate-pulse" />
        <div className="bg-surface-container-low h-24 animate-pulse" />
        <div className="bg-surface-container-low h-24 animate-pulse" />
      </div>
    );
  }

  const totalHours = months.reduce((s, m) => s + m.totalHours, 0);
  const monthsWithData = months.filter((m) => m.entriesCount > 0);
  const avg =
    monthsWithData.length > 0
      ? totalHours / monthsWithData.length
      : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
            Resumen
          </p>
          <p className="text-2xl font-black text-primary">{year}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-on-surface-variant">Promedio mensual</p>
          <p className="text-lg font-black tabular-nums text-primary">
            {avg % 1 === 0 ? avg : avg.toFixed(1)}h
          </p>
        </div>
      </div>

      {/* Chart */}
      <MonthlyBarChart months={months} currentMonth={currentMonth} />

      {/* Monthly cards — most recent first */}
      <div className="flex flex-col gap-3">
        {[...months]
          .slice(0, currentMonth + 1)
          .reverse()
          .map((m, i) => {
            const prevIndex = currentMonth - i - 1;
            const prev = prevIndex >= 0 ? months[prevIndex] : null;
            return (
              <MonthlyCard key={m.month} data={m} prev={prev} />
            );
          })}
      </div>
    </div>
  );
}
