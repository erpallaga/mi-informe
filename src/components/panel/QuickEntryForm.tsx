"use client";

import { useState } from "react";
import HoursSpinner from "./HoursSpinner";
import CountSpinner from "./CountSpinner";
import { useCategories } from "@/lib/hooks/use-categories";
import { useActivity } from "@/lib/hooks/use-activity";
import type { ActivityEntry } from "@/lib/types";

function todayISO(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

interface QuickEntryFormProps {
  onSuccess?: () => void;
  defaultOtrosOpen?: boolean;
  editEntry?: ActivityEntry;
}

export default function QuickEntryForm({
  onSuccess,
  defaultOtrosOpen = false,
  editEntry,
}: QuickEntryFormProps) {
  const isEdit = !!editEntry;

  const [date, setDate] = useState(editEntry?.entry_date ?? todayISO());
  const [predicacionHours, setPredicacionHours] = useState(editEntry?.predicacion_hours ?? 0);
  const [cursosBiblicos, setCursosBiblicos] = useState(editEntry?.cursos_biblicos ?? 0);
  const [otrosHours, setOtrosHours] = useState<Record<string, number>>(
    editEntry?.otros_hours ?? {}
  );
  const [otrosOpen, setOtrosOpen] = useState(defaultOtrosOpen || isEdit);

  const { categories, loading: loadingCats } = useCategories();
  const { insertEntry, updateEntry, loading: submitting, error } = useActivity();

  function setOtroHours(id: string, value: number) {
    setOtrosHours((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const filteredOtros = Object.fromEntries(
      Object.entries(otrosHours).filter(([, v]) => v > 0)
    );

    const input = {
      entry_date: date,
      predicacion_hours: predicacionHours,
      cursos_biblicos: cursosBiblicos,
      otros_hours: filteredOtros,
    };

    let ok: boolean;
    if (isEdit && editEntry) {
      ok = await updateEntry(editEntry.id, input);
    } else {
      ok = await insertEntry(input);
      if (ok) {
        setPredicacionHours(0);
        setCursosBiblicos(0);
        setOtrosHours({});
        setDate(todayISO());
      }
    }

    if (ok) {
      onSuccess?.();
    }
  }

  const isEmpty =
    predicacionHours === 0 &&
    cursosBiblicos === 0 &&
    Object.values(otrosHours).every((v) => v === 0);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Fecha */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
          Fecha
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:bg-white transition-colors ease-out"
        />
      </div>

      {/* Predicación */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-on-surface">Predicación</p>
          <p className="text-xs text-on-surface-variant">horas</p>
        </div>
        <HoursSpinner value={predicacionHours} onChange={setPredicacionHours} />
      </div>

      {/* Cursos Bíblicos */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-on-surface">Cursos Bíblicos</p>
          <p className="text-xs text-on-surface-variant">cursos realizados</p>
        </div>
        <CountSpinner value={cursosBiblicos} onChange={setCursosBiblicos} />
      </div>

      {/* Otros Trabajos */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setOtrosOpen((v) => !v)}
          className="flex items-center justify-between py-1"
        >
          <div>
            <p className="text-sm font-semibold text-on-surface text-left">
              Otros Trabajos
            </p>
            <p className="text-xs text-on-surface-variant text-left">horas por categoría</p>
          </div>
          <span className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
            {otrosOpen ? "Cerrar" : "Expandir"}
          </span>
        </button>

        {otrosOpen && (
          <div className="flex flex-col gap-4 bg-surface-container-low p-4">
            {loadingCats ? (
              <p className="text-xs text-on-surface-variant">Cargando...</p>
            ) : (
              categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between">
                  <p className="text-sm text-on-surface">{cat.name}</p>
                  <HoursSpinner
                    value={otrosHours[cat.id] ?? 0}
                    onChange={(v) => setOtroHours(cat.id, v)}
                  />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-error">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || (!isEdit && isEmpty)}
        className="sticky bottom-0 bg-primary py-4 text-sm font-semibold uppercase tracking-widest text-on-primary disabled:opacity-40 transition-opacity ease-out"
      >
        {submitting
          ? isEdit ? "Guardando..." : "Registrando..."
          : isEdit ? "Guardar cambios" : "Registrar Actividad"}
      </button>
    </form>
  );
}
