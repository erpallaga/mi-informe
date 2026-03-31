"use client";

import ProgressCard from "./ProgressCard";
import { useProgress } from "@/lib/hooks/use-progress";
import { useProfile } from "@/lib/hooks/use-profile";
import { useCategories } from "@/lib/hooks/use-categories";
import { getMonthlyGoalHours, getAnnualGoalHours } from "@/lib/utils/calculations";
import { getMonthName, getServiceYear } from "@/lib/utils/dates";

function fmt(h: number) {
  return h % 1 === 0 ? `${h}h` : `${h.toFixed(1)}h`;
}

export default function ProgressSection() {
  const { monthly, annual, annualCappedHours, loading: loadingProgress } = useProgress();
  const { profile, loading: loadingProfile } = useProfile();
  const { categories, loading: loadingCats } = useCategories();

  if (loadingProgress || loadingProfile || loadingCats) {
    return (
      <div className="flex flex-col gap-3">
        <div className="bg-surface-container-low h-28 animate-pulse" />
        <div className="bg-surface-container-low h-28 animate-pulse" />
      </div>
    );
  }

  const goalType = profile?.goal_type ?? "publicador";
  const customHours = profile?.custom_goal_hours ?? null;

  const monthlyGoal = getMonthlyGoalHours(goalType, customHours);
  const annualGoal = getAnnualGoalHours(goalType, customHours);

  const now = new Date();
  const monthName = getMonthName(now.getMonth());
  const serviceYear = getServiceYear(now);
  // Months elapsed since start of service year (Sept = month 1)
  const calMonth = now.getMonth();
  const monthsElapsed = calMonth >= 8 ? calMonth - 7 : calMonth + 5;

  // Build category name map
  const catNames: Record<string, string> = {};
  for (const cat of categories) catNames[cat.id] = cat.name;

  // Monthly details
  const monthlyDetails = [
    { label: "Predicación", value: fmt(monthly?.predicacionHours ?? 0) },
    ...categories
      .filter((cat) => (monthly?.otrosByCategory?.[cat.id] ?? 0) > 0)
      .map((cat) => ({ label: cat.name, value: fmt(monthly!.otrosByCategory[cat.id]) })),
    { label: "Cursos bíblicos", value: `${monthly?.cursosBiblicos ?? 0}` },
  ];

  // Annual details
  const avgCursos = annual?.cursosBiblicos
    ? (annual.cursosBiblicos / monthsElapsed).toFixed(1)
    : "0";

  const annualDetails = [
    { label: "Predicación", value: fmt(annual?.predicacionHours ?? 0) },
    ...categories
      .filter((cat) => (annual?.otrosByCategory?.[cat.id] ?? 0) > 0)
      .map((cat) => ({ label: cat.name, value: fmt(annual!.otrosByCategory[cat.id]) })),
    { label: "Promedio cursos / mes", value: avgCursos },
  ];

  return (
    <div className="flex flex-col gap-3">
      <ProgressCard
        title={monthName}
        current={monthly?.totalHours ?? 0}
        goal={monthlyGoal}
        details={monthlyDetails}
        noGoal={goalType === "publicador"}
      />
      <ProgressCard
        title={serviceYear.label}
        current={goalType === "precursor_regular" ? annualCappedHours : (annual?.totalHours ?? 0)}
        goal={annualGoal}
        details={annualDetails}
        noGoal={goalType !== "precursor_regular"}
      />
    </div>
  );
}
