import type { ActivityEntry, GoalType, GOAL_PRESETS } from "@/lib/types";

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

export function getMonthlyGoalHours(
  goalType: GoalType,
  customHours: number | null,
  presets: typeof GOAL_PRESETS
): number {
  if (goalType === "custom" && customHours !== null) {
    return customHours;
  }
  if (goalType !== "custom") {
    return presets[goalType].monthlyHours;
  }
  return 0;
}
