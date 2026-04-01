"use client";

import { useState, useEffect, useRef } from "react";
import HoursSpinner from "@/components/panel/HoursSpinner";
import type { DailyPlan } from "@/lib/types";
import type { PlanInput } from "@/lib/hooks/use-plans";

interface DayPlanFormProps {
  date: string;
  plan: DailyPlan | null;
  saving: boolean;
  onSave: (input: PlanInput) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
}

export default function DayPlanForm({
  date,
  plan,
  saving,
  onSave,
  onDelete,
}: DayPlanFormProps) {
  const [predicacionHours, setPredicacionHours] = useState(plan?.predicacion_hours ?? 0);
  const [otrosHours, setOtrosHours] = useState(
    Object.values(plan?.otros_hours ?? {}).reduce((a, b) => a + b, 0)
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sincroniza el formulario al cambiar de día
  useEffect(() => {
    setPredicacionHours(plan?.predicacion_hours ?? 0);
    setOtrosHours(Object.values(plan?.otros_hours ?? {}).reduce((a, b) => a + b, 0));
    setConfirmDelete(false);
  }, [plan, date]);

  // Refs para auto-save (capturan siempre los valores más recientes)
  const valuesRef = useRef({ predicacionHours, otrosHours });
  useEffect(() => {
    valuesRef.current = { predicacionHours, otrosHours };
  }, [predicacionHours, otrosHours]);

  const onSaveRef = useRef(onSave);
  useEffect(() => { onSaveRef.current = onSave; }, [onSave]);

  // Auto-save al cambiar de día o al salir de pantalla
  useEffect(() => {
    return () => {
      const { predicacionHours: pred, otrosHours: otros } = valuesRef.current;
      if (pred > 0 || otros > 0) {
        onSaveRef.current({
          predicacion_hours: pred,
          cursos_biblicos: 0,
          otros_hours: otros > 0 ? { total: otros } : {},
        });
      }
    };
  }, [date]);

  async function handleDelete() {
    await onDelete();
    setConfirmDelete(false);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Predicación */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-on-surface">Predicación</p>
        <HoursSpinner value={predicacionHours} onChange={setPredicacionHours} />
      </div>

      {/* Otros Trabajos */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-on-surface">Otros Trabajos</p>
        <HoursSpinner value={otrosHours} onChange={setOtrosHours} />
      </div>

      {/* Eliminar previsión */}
      {plan && (
        <div className="flex items-center justify-center gap-4 pt-2">
          {confirmDelete ? (
            <>
              <p className="text-xs text-on-surface-variant">¿Eliminar previsión?</p>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-xs font-medium uppercase tracking-widest text-on-surface-variant py-1"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="text-xs font-medium uppercase tracking-widest text-on-surface-variant py-1 disabled:opacity-40"
              >
                Sí, eliminar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-xs font-medium uppercase tracking-widest text-on-surface-variant py-1"
            >
              Eliminar previsión
            </button>
          )}
        </div>
      )}
    </div>
  );
}
