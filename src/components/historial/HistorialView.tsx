"use client";

import { useState } from "react";
import { useHistory } from "@/lib/hooks/use-history";
import { useCategories } from "@/lib/hooks/use-categories";
import { useProfile } from "@/lib/hooks/use-profile";
import { getServiceYear } from "@/lib/utils/dates";
import { getAnnualGoalHours } from "@/lib/utils/calculations";
import MonthlyBarChart from "./MonthlyBarChart";
import MonthlyCard from "./MonthlyCard";
import CumulativeAreaChart from "./CumulativeAreaChart";
import WeekdayHeatmap from "./WeekdayHeatmap";
import YearSummaryCard from "./YearSummaryCard";

export default function HistorialView() {
  const currentSY = getServiceYear();
  const [startYear, setStartYear] = useState(currentSY.startYear);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const label = `${startYear}-${startYear + 1}`;
  const isCurrentYear = startYear === currentSY.startYear;

  const { months, loading: loadingMonths } = useHistory(startYear);
  const { categories, loading: loadingCats } = useCategories();
  const { profile, loading: loadingProfile } = useProfile();

  if (loadingMonths || loadingCats || loadingProfile) {
    return (
      <div className="flex flex-col gap-3">
        <div className="bg-surface-container-low h-40 animate-pulse" />
        <div className="bg-surface-container-low h-24 animate-pulse" />
        <div className="bg-surface-container-low h-24 animate-pulse" />
      </div>
    );
  }

  const currentIndex = months.findIndex((m) => m.isCurrentMonth);
  const visibleMonths = isCurrentYear && currentIndex >= 0 ? months.slice(0, currentIndex + 1) : months;

  const annualGoal = profile
    ? getAnnualGoalHours(profile.goal_type, profile.custom_goal_hours)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
            Resumen
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <button
              onClick={() => setStartYear((y) => y - 1)}
              className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant py-1 pr-2"
            >
              ← Ant.
            </button>
            <p className="text-2xl font-black text-primary">{label}</p>
            <button
              onClick={() => setStartYear((y) => y + 1)}
              disabled={isCurrentYear}
              className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant py-1 pl-2 disabled:opacity-30"
            >
              Sig. →
            </button>
          </div>
        </div>
      </div>

      <MonthlyBarChart months={months} />

      <YearSummaryCard months={months} categories={categories} />

      {/* Toggle análisis avanzado */}
      <button
        onClick={() => setShowAnalysis((v) => !v)}
        className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant text-left py-1"
      >
        {showAnalysis ? "Ocultar análisis ▴" : "Ver análisis ▾"}
      </button>

      {showAnalysis && (
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant mb-3">
              Acumulado vs. ritmo ideal
            </p>
            <CumulativeAreaChart
              months={months}
              annualGoal={annualGoal}
              isCurrentYear={isCurrentYear}
            />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant mb-3">
              Actividad por día de la semana
            </p>
            <WeekdayHeatmap startYear={startYear} />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {[...visibleMonths].reverse().map((m) => (
          <MonthlyCard key={`${m.calYear}-${m.month}`} data={m} categories={categories} />
        ))}
      </div>
    </div>
  );
}
