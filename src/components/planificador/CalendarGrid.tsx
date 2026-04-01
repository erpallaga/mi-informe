"use client";

import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { formatMonthYear } from "@/lib/utils/dates";

const WEEKDAYS = ["LU", "MA", "MI", "JU", "VI", "SA", "DO"];

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/** Returns 0-6 index where 0=Monday (date-fns getDay returns 0=Sunday) */
function mondayIndex(date: Date): number {
  const d = getDay(date); // 0=Sun, 1=Mon … 6=Sat
  return d === 0 ? 6 : d - 1;
}

interface CalendarGridProps {
  month: Date;
  selectedDate: string | null;
  plannedDates: Set<string>;
  actualDates: Set<string>;
  onSelectDay: (dateISO: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function CalendarGrid({
  month,
  selectedDate,
  plannedDates,
  actualDates,
  onSelectDay,
  onPrev,
  onNext,
}: CalendarGridProps) {
  const today = todayISO();
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const firstOffset = mondayIndex(days[0]);

  // Build grid cells: nulls for offset + actual days
  const cells: (Date | null)[] = [
    ...Array<null>(firstOffset).fill(null),
    ...days,
  ];
  // Pad to multiple of 7
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="flex flex-col gap-3">
      {/* Header con navegación */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrev}
          className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant py-1 pr-3"
        >
          ← Ant.
        </button>
        <p className="text-sm font-black tracking-tight text-primary">
          {formatMonthYear(month)}
        </p>
        <button
          onClick={onNext}
          className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant py-1 pl-3"
        >
          Sig. →
        </button>
      </div>

      {/* Días de semana */}
      <div className="grid grid-cols-7 gap-px">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="text-center py-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
              {wd}
            </span>
          </div>
        ))}
      </div>

      {/* Celdas del calendario */}
      <div className="grid grid-cols-7 gap-px bg-surface-container-low">
        {cells.map((day, i) => {
          if (!day) {
            return <div key={`empty-${i}`} className="bg-surface-container-lowest aspect-square" />;
          }

          const iso = format(day, "yyyy-MM-dd");
          const isSelected = iso === selectedDate;
          const isToday = iso === today;
          const hasPlan = plannedDates.has(iso);
          const hasActual = actualDates.has(iso);
          const isOtherMonth = day.getMonth() !== month.getMonth();

          return (
            <button
              key={iso}
              onClick={() => onSelectDay(iso)}
              className={`bg-surface-container-lowest aspect-square flex flex-col items-center justify-center gap-0.5 transition-colors ease-out ${
                isOtherMonth ? "opacity-30" : ""
              } ${isSelected ? "!bg-primary" : ""}`}
            >
              <span
                className={`text-sm font-semibold tabular-nums ${
                  isSelected
                    ? "text-on-primary"
                    : isToday
                    ? "text-primary font-black"
                    : "text-on-surface"
                }`}
              >
                {day.getDate()}
              </span>
              {(hasPlan || hasActual) && (
                <div className="flex gap-0.5">
                  {hasPlan && (
                    <span className={`w-1 h-1 ${isSelected ? "bg-on-primary" : "bg-primary"}`} />
                  )}
                  {hasActual && (
                    <span className={`w-1 h-1 ${isSelected ? "bg-on-primary" : "bg-on-surface-variant"}`} />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
