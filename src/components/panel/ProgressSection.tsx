"use client";

import ProgressCard from "./ProgressCard";
import { useProgress } from "@/lib/hooks/use-progress";
import { useProfile } from "@/lib/hooks/use-profile";
import { getMonthlyGoalHours, getAnnualGoalHours } from "@/lib/utils/calculations";
import { getMonthName } from "@/lib/utils/dates";

export default function ProgressSection() {
  const { monthly, annual, loading: loadingProgress } = useProgress();
  const { profile, loading: loadingProfile } = useProfile();

  if (loadingProgress || loadingProfile) {
    return (
      <div className="flex flex-col gap-3">
        <div className="bg-surface-container-low h-28 animate-pulse" />
        <div className="bg-surface-container-low h-28 animate-pulse" />
      </div>
    );
  }

  const goalType = profile?.goal_type ?? "publicador";
  const customHours = profile?.custom_goal_hours ?? null;

  const isRegular = goalType === "precursor_regular";
  const isPublicador = goalType === "publicador";

  const now = new Date();
  const monthName = getMonthName(now.getMonth());
  const year = now.getFullYear();

  if (isRegular) {
    const annualGoal = getAnnualGoalHours(goalType, customHours);
    return (
      <ProgressCard
        title={`Año ${year}`}
        current={annual?.totalHours ?? 0}
        goal={annualGoal}
        subtitle={`Predicación ${annual?.predicacionHours ?? 0}h · ${annual?.cursosBiblicos ?? 0} cursos`}
      />
    );
  }

  const monthlyGoal = getMonthlyGoalHours(goalType, customHours);
  return (
    <ProgressCard
      title={monthName}
      current={monthly?.totalHours ?? 0}
      goal={monthlyGoal}
      subtitle={`Predicación ${monthly?.predicacionHours ?? 0}h · Otros ${monthly?.otrosHours ?? 0}h`}
      noGoal={isPublicador}
    />
  );
}
