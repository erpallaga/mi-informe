import type { ActivityEntry, DailyPlan, Profile } from "@/lib/types";

/**
 * Supabase can return NUMERIC columns as strings, and JSONB values are whatever
 * was stored. Every row read from the DB goes through these helpers so the rest
 * of the app can rely on real numbers (`0 + "2.50"` would silently concatenate).
 */

function toNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeOtros(otros: unknown): Record<string, number> {
  if (!otros || typeof otros !== "object") return {};
  const out: Record<string, number> = {};
  for (const [id, h] of Object.entries(otros as Record<string, unknown>)) {
    out[id] = toNumber(h);
  }
  return out;
}

type HoursRow = {
  predicacion_hours: unknown;
  cursos_biblicos?: unknown;
  otros_hours: unknown;
};

function normalizeHours<T extends HoursRow>(row: T) {
  return {
    ...row,
    predicacion_hours: toNumber(row.predicacion_hours),
    cursos_biblicos: toNumber(row.cursos_biblicos),
    otros_hours: normalizeOtros(row.otros_hours),
  };
}

export function normalizeEntry(row: Record<string, unknown>): ActivityEntry {
  return normalizeHours(row as unknown as ActivityEntry) as ActivityEntry;
}

export function normalizePlan(row: Record<string, unknown>): DailyPlan {
  return normalizeHours(row as unknown as DailyPlan) as DailyPlan;
}

export function normalizeProfile(row: Record<string, unknown>): Profile {
  const p = row as unknown as Profile;
  return {
    ...p,
    custom_goal_hours:
      p.custom_goal_hours === null || p.custom_goal_hours === undefined
        ? null
        : toNumber(p.custom_goal_hours),
  };
}
