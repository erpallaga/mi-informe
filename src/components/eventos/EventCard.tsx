"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { fmtHours } from "@/lib/utils/calculations";
import type { ActivityEntry, Category } from "@/lib/types";

interface EventCardProps {
  entry: ActivityEntry;
  categories: Category[];
  onEdit: (entry: ActivityEntry) => void;
  onDelete: (id: string) => Promise<void>;
}

export default function EventCard({ entry, categories, onEdit, onDelete }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dateLabel = format(
    new Date(entry.entry_date + "T12:00:00"),
    "EEEE, d 'de' MMMM",
    { locale: es }
  );

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const rows: { label: string; value: string }[] = [];
  if (entry.predicacion_hours > 0) {
    rows.push({ label: "Predicación", value: fmtHours(entry.predicacion_hours) });
  }
  if (entry.cursos_biblicos > 0) {
    rows.push({
      label: "Cursos Bíblicos",
      value: String(entry.cursos_biblicos),
    });
  }
  for (const [catId, hours] of Object.entries(entry.otros_hours)) {
    if (hours > 0) {
      rows.push({ label: catMap[catId] ?? catId, value: fmtHours(hours) });
    }
  }

  async function handleDelete() {
    setDeleting(true);
    await onDelete(entry.id);
    setDeleting(false);
    setConfirming(false);
  }

  function handleToggle() {
    setExpanded((e) => !e);
    setConfirming(false);
  }

  return (
    <div className="bg-surface-container-lowest">
      {/* Fecha — tappable */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 pt-4 pb-2 bg-surface-container-low text-left"
      >
        <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant capitalize">
          {dateLabel}
        </p>
        <p className="text-xs font-medium text-on-surface-variant">
          {expanded ? "—" : "+"}
        </p>
      </button>

      {/* Filas de actividad */}
      <div className="flex flex-col">
        {rows.length === 0 ? (
          <div className="px-4 pb-3">
            <p className="text-xs text-on-surface-variant">Sin actividad registrada</p>
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between px-4 py-2.5 bg-surface-container-lowest"
            >
              <p className="text-sm text-on-surface">{row.label}</p>
              <p className="text-sm font-semibold tabular-nums text-on-surface">{row.value}</p>
            </div>
          ))
        )}
      </div>

      {/* Acciones — solo cuando expanded */}
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-200 ease-out ${
          expanded ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex items-center gap-4 px-4 pt-2 pb-4 bg-surface-container-low">
          {confirming ? (
            <>
              <p className="text-xs text-on-surface-variant flex-1">
                ¿Eliminar esta entrada?
              </p>
              <button
                onClick={() => setConfirming(false)}
                className="text-xs font-medium uppercase tracking-widest text-on-surface-variant py-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs font-medium uppercase tracking-widest text-primary py-1 disabled:opacity-40"
              >
                {deleting ? "..." : "Confirmar"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onEdit(entry)}
                className="text-xs font-medium uppercase tracking-widest text-on-surface-variant py-1"
              >
                Editar
              </button>
              <button
                onClick={() => setConfirming(true)}
                className="text-xs font-medium uppercase tracking-widest text-on-surface-variant py-1"
              >
                Eliminar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
