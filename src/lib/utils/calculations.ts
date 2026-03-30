import type { ActivityEntry, GoalType } from "@/lib/types";
import { GOAL_PRESETS } from "@/lib/types";

export function sumOtrosHours(otros: Record<string, number>): number {
  return Object.values(otros).reduce((sum, h) => sum + h, 0);
}

export function calculateTotalHours(entry: ActivityEntry): number {
  return entry.predicacion_hours + sumOtrosHours(entry.otros_hours);
}

export function aggregateEntries(entries: ActivityEntry[]) {
  let predicacionHours = 0;
  let otrosHours = 0;
  let cursosBiblicos = 0;

  for (const entry of entries) {
    predicacionHours += entry.predicacion_hours;
    otrosHours += sumOtrosHours(entry.otros_hours);
    cursosBiblicos += entry.cursos_biblicos;
  }

  return {
    predicacionHours,
    otrosHours,
    totalHours: predicacionHours + otrosHours,
    cursosBiblicos,
    entriesCount: entries.length,
  };
}

/**
 * Returns the monthly goal in hours.
 * - publicador: 0 (no goal)
 * - precursor_auxiliar: custom_goal_hours (15 or 30), default 30
 * - precursor_regular: 50
 * - custom: custom_goal_hours
 */
export function getMonthlyGoalHours(
  goalType: GoalType,
  customHours: number | null
): number {
  if (goalType === "publicador") return 0;
  if (goalType === "precursor_regular") return GOAL_PRESETS.precursor_regular.monthlyHours;
  if (goalType === "precursor_auxiliar") {
    return customHours !== null ? customHours : GOAL_PRESETS.precursor_auxiliar.monthlyHours;
  }
  // custom
  return customHours !== null ? customHours : 0;
}

/**
 * Returns the annual goal in hours.
 * - publicador: 0 (no goal)
 * - precursor_regular: 600 (fixed by org policy)
 * - precursor_auxiliar: monthly * 12
 * - custom: monthly * 12
 */
export function getAnnualGoalHours(
  goalType: GoalType,
  customHours: number | null
): number {
  if (goalType === "publicador") return 0;
  if (goalType === "precursor_regular") return GOAL_PRESETS.precursor_regular.annualHours ?? 600;
  const monthly = getMonthlyGoalHours(goalType, customHours);
  return monthly * 12;
}
