"use client";

import { useState } from "react";
import { useEventos } from "@/lib/hooks/use-eventos";
import { useCategories } from "@/lib/hooks/use-categories";
import { useActivity } from "@/lib/hooks/use-activity";
import { formatMonthYear } from "@/lib/utils/dates";
import EventCard from "./EventCard";
import NewEntrySheet from "@/components/panel/NewEntrySheet";
import type { ActivityEntry } from "@/lib/types";

export default function EventosView() {
  const { month, entries, loading, prevMonth, nextMonth } = useEventos();
  const { categories, loading: loadingCats } = useCategories();
  const { deleteEntry } = useActivity();

  const [editEntry, setEditEntry] = useState<ActivityEntry | null>(null);

  async function handleDelete(id: string) {
    await deleteEntry(id);
  }

  if (loading || loadingCats) {
    return (
      <div className="flex flex-col gap-3 pt-4">
        <div className="bg-surface-container-low h-8 w-48 animate-pulse" />
        <div className="bg-white h-32 animate-pulse" />
        <div className="bg-white h-32 animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6 pt-4">
        {/* Navegación de mes */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant py-1 pr-3"
          >
            ← Ant.
          </button>
          <p className="text-sm font-black tracking-tight text-primary">
            {formatMonthYear(month)}
          </p>
          <button
            onClick={nextMonth}
            className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant py-1 pl-3"
          >
            Sig. →
          </button>
        </div>

        {/* Lista de entradas */}
        {entries.length === 0 ? (
          <div className="bg-surface-container-low px-6 py-10 text-center">
            <p className="text-sm font-semibold text-on-surface">Sin actividad este mes</p>
            <p className="text-xs text-on-surface-variant mt-1">
              Registra tus horas desde el Panel
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry) => (
              <EventCard
                key={entry.id}
                entry={entry}
                categories={categories}
                onEdit={(e) => setEditEntry(e)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sheet de edición — solo cuando hay entrada seleccionada */}
      {editEntry && (
        <NewEntrySheet
          open={true}
          onClose={() => setEditEntry(null)}
          onSuccess={() => setEditEntry(null)}
          editEntry={editEntry}
        />
      )}
    </>
  );
}
