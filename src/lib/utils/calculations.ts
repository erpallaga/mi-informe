import type { ActivityEntry, GoalType } from "@/lib/types";
import { GOAL_PRESETS } from "@/lib/types";

/**
 * Monthly contribution toward the Precursor Regular annual goal (600h).
 * - No Otros: full total counts.
 * - With Otros: capped at 55h, but never below predicacionHours alone (case C).
 */
export function monthlyAnnualContribution(
  predicacionHours: number,
  otrosHours: number
): number {
  if (otrosHours === 0) return predicacionHours;
  return Math.max(predicacionHours, Math.min(predicacionHours + otrosHours, 55));
}

/**
 * Sums the capped monthly contributions for Precursor Regular from a list of entries.
 * Groups entries by calendar month+year, applies the cap per group, then sums.
 */
export function aggregateAnnualCapped(entries: ActivityEntry[]): number {
  const byMonth: Record<string, { pred: number; otros: number }> = {};
  for (const entry of entries) {
    const key = entry.entry_date.substring(0, 7); // "YYYY-MM"
    if (!byMonth[key]) byMonth[key] = { pred: 0, otros: 0 };
    byMonth[key].pred += entry.predicacion_hours;
    byMonth[key].otros += sumOtrosHours(entry.otros_hours);
  }
  return Object.values(byMonth).reduce(
    (sum, { pred, otros }) => sum + monthlyAnnualContribution(pred, otros),
    0
  );
}

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
  const otrosByCategory: Record<string, number> = {};

  for (const entry of entries) {
    predicacionHours += entry.predicacion_hours;
    otrosHours += sumOtrosHours(entry.otros_hours);
    cursosBiblicos += entry.cursos_biblicos;
    for (const [id, h] of Object.entries(entry.otros_hours)) {
      otrosByCategory[id] = (otrosByCategory[id] ?? 0) + h;
    }
  }

  return {
    predicacionHours,
    otrosHours,
    otrosByCategory,
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
