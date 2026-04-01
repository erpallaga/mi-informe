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

  const plannedDates = new Set(Object.keys(plans));
  const actualDates = new Set(entries.map((e) => e.entry_date));
  const selectedPlan = plans[selectedDate] ?? null;

  const totalPlanned = Object.values(plans).reduce((sum, p) => {
    const otros = Object.values(p.otros_hours).reduce((a, b) => a + b, 0);
    return sum + p.predicacion_hours + otros;
  }, 0);

  const totalActual = entries.reduce((sum, e) => {
    const otros = Object.values(e.otros_hours).reduce((a, b) => a + b, 0);
    return sum + e.predicacion_hours + otros;
  }, 0);

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
        plannedDates={plannedDates}
        actualDates={actualDates}
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
