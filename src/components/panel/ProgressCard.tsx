interface ProgressCardProps {
  title: string;
  current: number;
  goal: number;
  subtitle?: string;
}

export default function ProgressCard({
  title,
  current,
  goal,
  subtitle,
}: ProgressCardProps) {
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
  const done = goal > 0 && current >= goal;

  return (
    <div className="bg-surface-container-low p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
            {title}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-on-surface-variant">{subtitle}</p>
          )}
        </div>
        {done && (
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Cumplido
          </span>
        )}
      </div>

      <div className="flex items-end gap-1.5">
        <span className="text-3xl font-black tabular-nums text-primary leading-none">
          {current % 1 === 0 ? current : current.toFixed(1)}
        </span>
        <span className="text-sm text-on-surface-variant mb-0.5">
          / {goal} hrs
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-surface-container-high">
        <div
          className="h-1 bg-primary transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
