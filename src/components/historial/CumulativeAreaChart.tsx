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

interface CumulativeAreaChartProps {
  months: MonthData[];
  annualGoal: number;
}

export default function CumulativeAreaChart({
  months,
  annualGoal,
}: CumulativeAreaChartProps) {
  const { data, yMax } = useMemo(() => {
    let cumPred = 0;
    let cumOtros = 0;
    const data = months.map((m, i) => {
      cumPred += m.predicacionHours;
      cumOtros += m.otrosHours;
      const ideal = annualGoal > 0 ? ((i + 1) * annualGoal) / 12 : undefined;
      return { label: m.label, predicacion: cumPred, otros: cumOtros, ideal };
    });

    const maxCumulative = cumPred + cumOtros;
    const yMax = annualGoal > 0 ? Math.max(annualGoal, maxCumulative) * 1.05 : maxCumulative * 1.1;
    return { data, yMax };
  }, [months, annualGoal]);

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: "#777777", fontFamily: "Inter" }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#777777", fontFamily: "Inter" }}
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
              fontFamily: "Inter",
              boxShadow: "0 4px 40px rgba(26,28,29,0.04)",
            }}
            formatter={(value, name) => {
              if (name === "predicacion") return [fmtHours(Number(value)), "Predicación"];
              if (name === "otros") return [fmtHours(Number(value)), "Otros"];
              if (name === "ideal") return [fmtHours(Number(value)), "Ritmo ideal"];
              return [value, name];
            }}
            labelFormatter={(label) => label}
          />
          {annualGoal > 0 && (
            <ReferenceLine
              y={annualGoal}
              stroke="#c6c6c6"
              strokeDasharray="4 4"
              label={{
                value: fmtHours(annualGoal),
                position: "insideTopRight",
                fontSize: 9,
                fill: "#777777",
                fontFamily: "Inter",
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
          />
          <Area
            type="monotone"
            dataKey="otros"
            stackId="1"
            stroke="#474747"
            strokeWidth={2}
            fill="#474747"
            fillOpacity={0.20}
            dot={false}
            activeDot={{ r: 3, fill: "#474747" }}
          />
          {annualGoal > 0 && (
            <Line
              type="monotone"
              dataKey="ideal"
              stroke="#c6c6c6"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              activeDot={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
