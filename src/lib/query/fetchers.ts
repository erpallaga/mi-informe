import { createClient } from "@/lib/supabase/client";
import { normalizeEntry, normalizePlan, normalizeProfile } from "@/lib/utils/normalize";
import type { ActivityEntry, Category, DailyPlan, Profile } from "@/lib/types";

// Fetchers throw on error so TanStack Query can retry and expose `isError`.

export async function fetchEntriesBetween(from: string, to: string): Promise<ActivityEntry[]> {
  const { data, error } = await createClient()
    .from("activity_entries")
    .select("*")
    .gte("entry_date", from)
    .lte("entry_date", to)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalizeEntry);
}

export async function fetchPlansBetween(from: string, to: string): Promise<Record<string, DailyPlan>> {
  const { data, error } = await createClient()
    .from("daily_plans")
    .select("*")
    .gte("plan_date", from)
    .lte("plan_date", to);
  if (error) throw error;
  const byDate: Record<string, DailyPlan> = {};
  for (const row of data ?? []) {
    const plan = normalizePlan(row);
    byDate[plan.plan_date] = plan;
  }
  return byDate;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await createClient()
    .from("categories")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as Category[];
}

/** null when the profile row doesn't exist (maybeSingle: no error for 0 rows). */
export async function fetchProfile(): Promise<Profile | null> {
  const { data, error } = await createClient().from("profiles").select("*").maybeSingle();
  if (error) throw error;
  return data ? normalizeProfile(data) : null;
}
