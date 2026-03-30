import type { MonthData } from "@/lib/hooks/use-history";
import { getMonthName } from "@/lib/utils/dates";

interface MonthlyCardProps {
  data: MonthData;
  prev: MonthData | null;
}

export default function MonthlyCard({ data, prev }: MonthlyCardProps) {
  if (data.entriesCount === 0) return null;

  const delta =
    prev && prev.totalHours > 0
      ? data.totalHours - prev.totalHours
      : null;

  return (
    <div className="bg-surface-container-low p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
          {getMonthName(data.month)}
        </p>
        {delta !== null && (
          <span
            className={`text-xs font-semibold ${
              delta >= 0 ? "text-on-surface" : "text-secondary"
            }`}
          >
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}h
          </span>
        )}
      </div>

      <div className="flex items-end gap-1.5">
        <span className="text-3xl font-black tabular-nums text-primary leading-none">
          {data.totalHours % 1 === 0
            ? data.totalHours
            : data.totalHours.toFixed(1)}
        </span>
        <span className="text-sm text-on-surface-variant mb-0.5">hrs</span>
      </div>

      <div className="flex gap-4 text-xs text-on-surface-variant">
        <span>Predicación {data.predicacionHours}h</span>
        {data.otrosHours > 0 && <span>Otros {data.otrosHours}h</span>}
        {data.cursosBiblicos > 0 && (
          <span>{data.cursosBiblicos} cursos</span>
        )}
      </div>
    </div>
  );
}
