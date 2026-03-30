"use client";

import ProgressCard from "./ProgressCard";
import { useProgress } from "@/lib/hooks/use-progress";
import { useProfile } from "@/lib/hooks/use-profile";
import { getMonthlyGoalHours } from "@/lib/utils/calculations";
import { GOAL_PRESETS } from "@/lib/types";
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
  const monthlyGoal = getMonthlyGoalHours(
    goalType,
    profile?.custom_goal_hours ?? null,
    GOAL_PRESETS
  );
  const annualGoal = monthlyGoal * 12;

  const now = new Date();
  const monthName = getMonthName(now.getMonth());
  const year = now.getFullYear();

  return (
    <div className="flex flex-col gap-3">
      <ProgressCard
        title={monthName}
        current={monthly?.totalHours ?? 0}
        goal={monthlyGoal}
        subtitle={`Predicación ${monthly?.predicacionHours ?? 0}h · Otros ${monthly?.otrosHours ?? 0}h`}
      />
      <ProgressCard
        title={`Año ${year}`}
        current={annual?.totalHours ?? 0}
        goal={annualGoal}
        subtitle={`${annual?.cursosBiblicos ?? 0} cursos bíblicos`}
      />
    </div>
  );
}
