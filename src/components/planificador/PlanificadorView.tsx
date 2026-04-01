"use client";

import { useState } from "react";
import { usePlans } from "@/lib/hooks/use-plans";
import type { PlanInput } from "@/lib/hooks/use-plans";
import { useEventos } from "@/lib/hooks/use-eventos";
import { fmtHours } from "@/lib/utils/calculations";
import CalendarGrid from "./CalendarGrid";
import DayPlanForm from "./DayPlanForm";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export default function PlanificadorView() {
  const { month, plans, loading, saving, upsertPlan, deletePlan, prevMonth, nextMonth } = usePlans();
  const { entries, loading: loadingEntries, prevMonth: eventoPrev, nextMonth: eventoNext } = useEventos();
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);

  // Horas planificadas por día
  const plansByDate: Record<string, number> = {};
  for (const [date, plan] of Object.entries(plans)) {
    const otros = Object.values(plan.otros_hours).reduce((a, b) => a + b, 0);
    plansByDate[date] = plan.predicacion_hours + otros;
  }

  // Horas realizadas por día (suma de todas las entradas del día)
  const actualByDate: Record<string, number> = {};
  for (const e of entries) {
    const otros = Object.values(e.otros_hours).reduce((a, b) => a + b, 0);
    actualByDate[e.entry_date] = (actualByDate[e.entry_date] ?? 0) + e.predicacion_hours + otros;
  }

  const totalPlanned = Object.values(plansByDate).reduce((a, b) => a + b, 0);
  const totalActual = Object.values(actualByDate).reduce((a, b) => a + b, 0);

  const selectedPlan = plans[selectedDate] ?? null;

  if (loading || loadingEntries) {
    return (
      <div className="flex flex-col gap-6 pt-4">
        <div className="bg-surface-container-low h-16 animate-pulse" />
        <div className="bg-surface-container-low h-64 animate-pulse" />
        <div className="bg-surface-container-low h-24 animate-pulse" />
      </div>
    );
  }

  function handlePrev() { prevMonth(); eventoPrev(); }
  function handleNext() { nextMonth(); eventoNext(); }

  async function handleSave(input: PlanInput) {
    return await upsertPlan(selectedDate, input);
  }

  async function handleDelete() {
    return await deletePlan(selectedDate);
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      {/* Strip planificado / realizado */}
      <div className="flex items-center justify-between bg-surface-container-low px-4 py-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">Planificado</p>
          <p className="text-base font-black tabular-nums text-primary">{fmtHours(totalPlanned)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">Realizado</p>
          <p className="text-base font-black tabular-nums text-on-surface">{fmtHours(totalActual)}</p>
        </div>
      </div>

      <CalendarGrid
        month={month}
        selectedDate={selectedDate}
        plansByDate={plansByDate}
        actualByDate={actualByDate}
        onSelectDay={setSelectedDate}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      <DayPlanForm
        date={selectedDate}
        plan={selectedPlan}
        saving={saving}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
