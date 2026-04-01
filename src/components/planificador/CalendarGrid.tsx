"use client";

import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { formatMonthYear } from "@/lib/utils/dates";
import { fmtHours } from "@/lib/utils/calculations";

const WEEKDAYS = ["LU", "MA", "MI", "JU", "VI", "SA", "DO"];

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function mondayIndex(date: Date): number {
  const d = getDay(date);
  return d === 0 ? 6 : d - 1;
}

interface CalendarGridProps {
  month: Date;
  selectedDate: string | null;
  plansByDate: Record<string, number>;
  actualByDate: Record<string, number>;
  onSelectDay: (dateISO: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function CalendarGrid({
  month,
  selectedDate,
  plansByDate,
  actualByDate,
  onSelectDay,
  onPrev,
  onNext,
}: CalendarGridProps) {
  const today = todayISO();
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const firstOffset = mondayIndex(days[0]);

  const cells: (Date | null)[] = [
    ...Array<null>(firstOffset).fill(null),
    ...days,
  ];
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
          const planHours = plansByDate[iso] ?? 0;
          const actualHours = actualByDate[iso] ?? 0;
          const hasPlan = planHours > 0;
          const hasActual = actualHours > 0;
          const isOtherMonth = day.getMonth() !== month.getMonth();

          return (
            <button
              key={iso}
              onClick={() => onSelectDay(iso)}
              className={`bg-surface-container-lowest aspect-square flex flex-col items-center justify-center transition-colors ease-out ${
                isOtherMonth ? "opacity-30" : ""
              } ${isSelected ? "!bg-primary" : ""}`}
            >
              {/* Número del día — posición fija */}
              <span
                className={`text-xs font-black tabular-nums leading-none ${
                  isSelected ? "text-on-primary" : isToday ? "text-primary" : "text-on-surface"
                }`}
              >
                {day.getDate()}
              </span>

              {/* Plan — siempre ocupa espacio para fijar la posición del número */}
              <span
                className={`text-[9px] tabular-nums leading-tight ${
                  hasPlan
                    ? isSelected
                      ? "text-on-primary opacity-70"
                      : "text-on-surface-variant"
                    : "opacity-0 select-none"
                }`}
              >
                {fmtHours(planHours)}
              </span>

              {/* Realizado — chip de fondo; siempre ocupa espacio */}
              <span
                className={`flex items-center justify-center text-[9px] font-semibold tabular-nums px-1 h-[14px] ${
                  hasActual
                    ? isSelected
                      ? "bg-on-primary text-primary"
                      : "bg-primary text-on-primary"
                    : "opacity-0 select-none"
                }`}
              >
                {fmtHours(actualHours)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
