"use client";

import ProgressCard from "./ProgressCard";
import { useProgress } from "@/lib/hooks/use-progress";
import { useProfile } from "@/lib/hooks/use-profile";
import { useCategories } from "@/lib/hooks/use-categories";
import { getMonthlyGoalHours, getAnnualGoalHours, fmtHours } from "@/lib/utils/calculations";
import { getMonthName, getServiceYear } from "@/lib/utils/dates";

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

  // Monthly details (always visible)
  const monthlyDetails = [
    { label: "Predicación", value: fmtHours(monthly?.predicacionHours ?? 0) },
    { label: "Cursos bíblicos", value: `${monthly?.cursosBiblicos ?? 0}` },
  ];

  // Monthly Otros (collapsible)
  const monthlyOtros = categories
    .filter((cat) => (monthly?.otrosByCategory?.[cat.id] ?? 0) > 0)
    .map((cat) => ({ label: cat.name, value: fmtHours(monthly!.otrosByCategory[cat.id]) }));

  // Annual details (always visible)
  const avgCursos = annual?.cursosBiblicos
    ? (annual.cursosBiblicos / monthsElapsed).toFixed(1)
    : "0";

  const annualDetails = [
    { label: "Predicación", value: fmtHours(annual?.predicacionHours ?? 0) },
    { label: "Promedio cursos / mes", value: avgCursos },
  ];

  // Annual Otros (collapsible)
  const annualOtros = categories
    .filter((cat) => (annual?.otrosByCategory?.[cat.id] ?? 0) > 0)
    .map((cat) => ({ label: cat.name, value: fmtHours(annual!.otrosByCategory[cat.id]) }));

  return (
    <div className="flex flex-col gap-3">
      <ProgressCard
        title={monthName}
        current={monthly?.totalHours ?? 0}
        goal={monthlyGoal}
        details={monthlyDetails}
        collapsibleDetails={monthlyOtros}
        collapsibleTotal={monthly?.otrosHours}
        noGoal={goalType === "publicador"}
      />
      <ProgressCard
        title={serviceYear.label}
        current={goalType === "precursor_regular" ? annualCappedHours : (annual?.totalHours ?? 0)}
        goal={annualGoal}
        details={annualDetails}
        collapsibleDetails={annualOtros}
        collapsibleTotal={annual?.otrosHours}
        noGoal={goalType !== "precursor_regular"}
      />
    </div>
  );
}
