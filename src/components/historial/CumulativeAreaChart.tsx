"use client";

import { useMemo } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { MonthData } from "@/lib/hooks/use-history";
import { fmtHours } from "@/lib/utils/calculations";
import { buildCumulativeSeries } from "@/lib/utils/cumulative";

interface CumulativeAreaChartProps {
  months: MonthData[];
  annualGoal: number;
  /** Precursor Regular: draw the capped "counts toward the goal" line. */
  showCapped: boolean;
}

// Design-system tokens (Recharts props bypass Tailwind)
const ON_SURFACE = "#1a1c1d";
const ON_SURFACE_VARIANT = "#474747";
const OUTLINE = "#777777";
const INACTIVE = "#c6c6c6";

export default function CumulativeAreaChart({
  months,
  annualGoal,
  showCapped,
}: CumulativeAreaChartProps) {
  const { data, yMax } = useMemo(() => {
    const { points, yMax } = buildCumulativeSeries(months, annualGoal, showCapped);
    return { data: points.map((p, i) => ({ ...p, label: months[i].label })), yMax };
  }, [months, annualGoal, showCapped]);

  return (
    <div className="flex flex-col gap-2">
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 12, left: -28, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: OUTLINE }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 10, fill: OUTLINE }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              domain={[0, Math.ceil(yMax)]}
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              contentStyle={{
                background: "#ffffff",
                border: "none",
                borderRadius: 0,
                fontSize: 12,
                boxShadow: "0 4px 40px rgba(26,28,29,0.04)",
              }}
              formatter={(value, name) => {
                if (name === "predicacion") return [fmtHours(Number(value)), "Predicación"];
                if (name === "otros") return [fmtHours(Number(value)), "Otros"];
                if (name === "contado") return [fmtHours(Number(value)), "Cuenta para el objetivo"];
                if (name === "ideal") return [fmtHours(Number(value)), "Ritmo ideal"];
                return [value, name];
              }}
              labelFormatter={(label) => label}
            />
            {annualGoal > 0 && (
              <ReferenceLine
                y={annualGoal}
                stroke={INACTIVE}
                strokeDasharray="4 4"
                label={{
                  value: fmtHours(annualGoal),
                  // Left: the lines reach the goal on the right, where the label collided.
                  position: "insideTopLeft",
                  fontSize: 9,
                  fill: OUTLINE,
                  }}
              />
            )}
            <Area
              type="monotone"
              dataKey="predicacion"
              stackId="1"
              stroke="none"
              fill="#000000"
              fillOpacity={0.45}
              dot={false}
              activeDot={{ r: 3, fill: "#000000" }}
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="otros"
              stackId="1"
              stroke={ON_SURFACE_VARIANT}
              strokeWidth={2}
              fill={ON_SURFACE_VARIANT}
              fillOpacity={0.20}
              dot={false}
              activeDot={{ r: 3, fill: ON_SURFACE_VARIANT }}
              connectNulls={false}
            />
            {showCapped && (
              <Line
                type="monotone"
                dataKey="contado"
                stroke={ON_SURFACE}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: ON_SURFACE, stroke: "#ffffff", strokeWidth: 2 }}
                connectNulls={false}
              />
            )}
            {annualGoal > 0 && (
              <Line
                type="monotone"
                dataKey="ideal"
                stroke={INACTIVE}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend showCapped={showCapped} showIdeal={annualGoal > 0} />
    </div>
  );
}

// Identity never by color alone: each swatch mirrors its mark type
// (filled area, solid line, dashed line).
function ChartLegend({ showCapped, showIdeal }: { showCapped: boolean; showIdeal: boolean }) {
  const items: { label: string; swatch: React.ReactNode }[] = [
    {
      label: "Predicación",
      swatch: <span className="block h-2.5 w-3" style={{ backgroundColor: "#000000", opacity: 0.45 }} />,
    },
    {
      label: "Otros",
      swatch: (
        <span
          className="block h-2.5 w-3"
          style={{ backgroundColor: "rgba(71,71,71,0.20)", boxShadow: `inset 0 2px 0 ${ON_SURFACE_VARIANT}` }}
        />
      ),
    },
  ];
  if (showCapped) {
    items.push({
      label: "Cuenta para el objetivo",
      swatch: <span className="block h-0.5 w-3" style={{ backgroundColor: ON_SURFACE }} />,
    });
  }
  if (showIdeal) {
    items.push({
      label: "Ritmo ideal",
      swatch: (
        <span
          className="block h-0.5 w-3"
          style={{ backgroundImage: `linear-gradient(to right, ${INACTIVE} 50%, transparent 50%)`, backgroundSize: "6px 2px" }}
        />
      ),
    });
  }
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 text-[10px] text-on-surface-variant">
          {item.swatch}
          {item.label}
        </span>
      ))}
    </div>
  );
}
