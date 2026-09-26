import type { ActivityEntry, GoalType } from "@/lib/types";
import { GOAL_PRESETS } from "@/lib/types";

/** Formats decimal hours as "h:mm" (e.g. 1.5 → "1:30", 0.5 → "0:30", -0.5 → "-0:30") */
export function fmtHours(h: number): string {
  if (!Number.isFinite(h)) return "0:00";
  const totalMin = Math.round(Math.abs(h) * 60);
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  const sign = h < 0 && totalMin > 0 ? "-" : "";
  return `${sign}${hh}:${String(mm).padStart(2, "0")}`;
}

/**
 * Rounds decimal hours to the nearest whole minute, kept with 6 decimals to
 * match the DB column NUMERIC(9,6) (error < 0.00003 min per value). With the
 * old 2 decimals, 0:10 was stored as 0.17 (+0.2 min) and errors accumulated.
 */
export function roundToMinute(h: number): number {
  if (!Number.isFinite(h)) return 0;
  return Math.round((Math.round(h * 60) / 60) * 1e6) / 1e6;
}

/**
 * Parses "h:mm" or a plain number string into decimal hours. Returns null if invalid.
 * Accepts a decimal comma ("1,5") as typed on Spanish keyboards. Negative values are rejected.
 */
export function parseHHMM(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (trimmed.includes(":")) {
    const match = /^(\d+):(\d{1,2})$/.exec(trimmed);
    if (!match) return null;
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (m > 59) return null;
    return roundToMinute(h + m / 60);
  }
  const normalized = trimmed.replace(",", ".");
  if (!/^\d*\.?\d+$|^\d+\.$/.test(normalized)) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? roundToMinute(n) : null;
}

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
