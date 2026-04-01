"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DailyPlan } from "@/lib/types";

function monthBounds(month: Date): { from: string; to: string } {
  const y = month.getFullYear();
  const m = month.getMonth(); // 0-indexed
  const pad = (n: number) => String(n).padStart(2, "0");
  const lastDay = new Date(y, m + 1, 0).getDate();
  return {
    from: `${y}-${pad(m + 1)}-01`,
    to: `${y}-${pad(m + 1)}-${pad(lastDay)}`,
  };
}

export type PlanInput = Pick<
  DailyPlan,
  "predicacion_hours" | "cursos_biblicos" | "otros_hours"
>;

export function usePlans() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [plans, setPlans] = useState<Record<string, DailyPlan>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(
    async (isInitial: boolean) => {
      if (isInitial) setLoading(true);
      setError(null);

      const supabase = createClient();
      const { from, to } = monthBounds(month);

      const { data, error: fetchError } = await supabase
        .from("daily_plans")
        .select("*")
        .gte("plan_date", from)
        .lte("plan_date", to);

      if (fetchError) {
        setError(fetchError.message);
      } else {
        const byDate: Record<string, DailyPlan> = {};
        for (const plan of data ?? []) {
          byDate[plan.plan_date] = {
            ...plan,
            predicacion_hours: Number(plan.predicacion_hours),
          };
        }
        setPlans(byDate);
      }

      setLoading(false);
    },
    [month]
  );

  useEffect(() => {
    fetchPlans(true);
  }, [fetchPlans]);

  async function upsertPlan(planDate: string, input: PlanInput): Promise<boolean> {
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("No hay sesión activa");
      setSaving(false);
      return false;
    }

    const filteredOtros = Object.fromEntries(
      Object.entries(input.otros_hours).filter(([, v]) => v > 0)
    );

    const { data, error: upsertError } = await supabase
      .from("daily_plans")
      .upsert(
        {
          user_id: user.id,
          plan_date: planDate,
          predicacion_hours: input.predicacion_hours,
          cursos_biblicos: input.cursos_biblicos,
          otros_hours: filteredOtros,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,plan_date" }
      )
      .select()
      .single();

    if (upsertError) {
      setError(upsertError.message);
      setSaving(false);
      return false;
    }

    setPlans((prev) => ({
      ...prev,
      [planDate]: { ...data, predicacion_hours: Number(data.predicacion_hours) },
    }));
    setSaving(false);
    return true;
  }

  async function deletePlan(planDate: string): Promise<boolean> {
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("daily_plans")
      .delete()
      .eq("plan_date", planDate);

    if (deleteError) {
      setError(deleteError.message);
      setSaving(false);
      return false;
    }

    setPlans((prev) => {
      const next = { ...prev };
      delete next[planDate];
      return next;
    });
    setSaving(false);
    return true;
  }

  function prevMonth() {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }

  function nextMonth() {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  return { month, plans, loading, saving, error, upsertPlan, deletePlan, prevMonth, nextMonth };
}
