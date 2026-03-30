"use client";

import { useState } from "react";
import HoursSpinner from "./HoursSpinner";
import CountSpinner from "./CountSpinner";
import { useCategories } from "@/lib/hooks/use-categories";
import { useActivity } from "@/lib/hooks/use-activity";

function todayISO(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

export default function QuickEntryForm({ onSuccess }: { onSuccess?: () => void }) {
  const [date, setDate] = useState(todayISO());
  const [predicacionHours, setPredicacionHours] = useState(0);
  const [cursosBiblicos, setCursosBiblicos] = useState(0);
  const [otrosHours, setOtrosHours] = useState<Record<string, number>>({});
  const [otrosOpen, setOtrosOpen] = useState(false);
  const [success, setSuccess] = useState(false);

  const { categories, loading: loadingCats } = useCategories();
  const { insertEntry, loading: submitting, error } = useActivity();

  function setOtroHours(id: string, value: number) {
    setOtrosHours((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Filter out zero-value otros
    const filteredOtros = Object.fromEntries(
      Object.entries(otrosHours).filter(([, v]) => v > 0)
    );

    const ok = await insertEntry({
      entry_date: date,
      predicacion_hours: predicacionHours,
      cursos_biblicos: cursosBiblicos,
      otros_hours: filteredOtros,
    });

    if (ok) {
      setPredicacionHours(0);
      setCursosBiblicos(0);
      setOtrosHours({});
      setDate(todayISO());
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onSuccess?.();
    }
  }

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
          className="bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:bg-white transition-colors"
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

      {/* Success */}
      {success && (
        <p className="text-xs font-medium text-on-surface bg-surface-container-low px-4 py-3">
          Actividad registrada correctamente.
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || (predicacionHours === 0 && cursosBiblicos === 0 && Object.values(otrosHours).every((v) => v === 0))}
        className="mt-2 bg-primary py-4 text-sm font-semibold uppercase tracking-widest text-on-primary disabled:opacity-40 transition-opacity"
      >
        {submitting ? "Registrando..." : "Registrar Actividad"}
      </button>
    </form>
  );
}
