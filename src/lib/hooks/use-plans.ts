"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { monthBounds } from "@/lib/utils/dates";
import { normalizePlan } from "@/lib/utils/normalize";
import { fetchPlansBetween } from "@/lib/query/fetchers";
import { queryKeys } from "@/lib/query/keys";
import type { DailyPlan } from "@/lib/types";

export type PlanInput = Pick<
  DailyPlan,
  "predicacion_hours" | "cursos_biblicos" | "otros_hours"
>;

const EMPTY: Record<string, DailyPlan> = {};

/** Cache key of the month a "YYYY-MM-DD" date belongs to. */
function monthKeyOf(planDate: string) {
  return queryKeys.plans.month(`${planDate.substring(0, 7)}-01`);
}

export function usePlans() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [saving, setSaving] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const { from, to } = monthBounds(month);

  const { data, isPending, error } = useQuery({
    queryKey: queryKeys.plans.month(from),
    queryFn: () => fetchPlansBetween(from, to),
  });

  // The date may belong to a month other than the visible one (auto-save when
  // leaving a month), so the cache entry is derived from the date itself.
  function writeCache(planDate: string, plan: DailyPlan | null) {
    queryClient.setQueryData<Record<string, DailyPlan>>(monthKeyOf(planDate), (prev) => {
      if (!prev) return prev; // month not cached: it will be fetched when shown
      const next = { ...prev };
      if (plan) next[planDate] = plan;
      else delete next[planDate];
      return next;
    });
  }

  async function upsertPlan(planDate: string, input: PlanInput): Promise<boolean> {
    setSaving(true);
    setMutationError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setMutationError("No hay sesión activa");
      setSaving(false);
      return false;
    }

    const filteredOtros = Object.fromEntries(
      Object.entries(input.otros_hours).filter(([, v]) => v > 0)
    );

    // updated_at is set by a DB trigger.
    const { data: row, error: upsertError } = await supabase
      .from("daily_plans")
      .upsert(
        {
          user_id: user.id,
          plan_date: planDate,
          predicacion_hours: input.predicacion_hours,
          cursos_biblicos: input.cursos_biblicos,
          otros_hours: filteredOtros,
        },
        { onConflict: "user_id,plan_date" }
      )
      .select()
      .single();

    setSaving(false);
    if (upsertError) {
      setMutationError(upsertError.message);
      return false;
    }
    writeCache(planDate, normalizePlan(row));
    return true;
  }

  async function deletePlan(planDate: string): Promise<boolean> {
    setSaving(true);
    setMutationError(null);

    const { error: deleteError } = await createClient()
      .from("daily_plans")
      .delete()
      .eq("plan_date", planDate);

    setSaving(false);
    if (deleteError) {
      setMutationError(deleteError.message);
      return false;
    }
    writeCache(planDate, null);
    return true;
  }

  function prevMonth() {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }

  function nextMonth() {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  return {
    month,
    plans: data ?? EMPTY,
    loading: isPending,
    saving,
    error: mutationError ?? (error ? error.message : null),
    upsertPlan,
    deletePlan,
    prevMonth,
    nextMonth,
  };
}
