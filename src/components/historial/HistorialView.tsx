"use client";

import { useHistory } from "@/lib/hooks/use-history";
import { getServiceYear } from "@/lib/utils/dates";
import { fmtHours } from "@/lib/utils/calculations";
import MonthlyBarChart from "./MonthlyBarChart";
import MonthlyCard from "./MonthlyCard";

export default function HistorialView() {
  const serviceYear = getServiceYear();
  const { months, loading } = useHistory(serviceYear.startYear);

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
  const avg = monthsWithData.length > 0 ? totalHours / monthsWithData.length : 0;

  // Show only months up to and including the current one in the service year
  const currentIndex = months.findIndex((m) => m.isCurrentMonth);
  const visibleMonths = currentIndex >= 0 ? months.slice(0, currentIndex + 1) : months;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
            Resumen
          </p>
          <p className="text-2xl font-black text-primary">{serviceYear.label}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-on-surface-variant">Promedio mensual</p>
          <p className="text-lg font-black tabular-nums text-primary">
            {fmtHours(avg)}
          </p>
        </div>
      </div>

      {/* Chart — all 12 months of service year */}
      <MonthlyBarChart months={months} />

      {/* Monthly cards — most recent first */}
      <div className="flex flex-col gap-3">
        {[...visibleMonths].reverse().map((m, i) => {
          const prevIndex = visibleMonths.length - 1 - i - 1;
          const prev = prevIndex >= 0 ? visibleMonths[prevIndex] : null;
          return <MonthlyCard key={`${m.calYear}-${m.month}`} data={m} prev={prev} />;
        })}
      </div>
    </div>
  );
}
