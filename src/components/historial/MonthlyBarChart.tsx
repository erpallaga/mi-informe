"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { MonthData } from "@/lib/hooks/use-history";
import { fmtHours } from "@/lib/utils/calculations";

interface MonthlyBarChartProps {
  months: MonthData[];
}

export default function MonthlyBarChart({ months }: MonthlyBarChartProps) {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={months}
          barSize={16}
          margin={{ top: 4, right: 0, left: -28, bottom: 0 }}
        >
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#777777", fontFamily: "Inter" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#777777", fontFamily: "Inter" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
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
            formatter={(value, name) => [
              fmtHours(Number(value)),
              name === "predicacionHours" ? "Predicación" : "Otros",
            ]}
            labelFormatter={(label) => label}
          />
          <Bar dataKey="predicacionHours" stackId="a" fill="#1a1c1d">
            {months.map((entry) => (
              <Cell
                key={`${entry.calYear}-${entry.month}`}
                fill={entry.isCurrentMonth ? "#000000" : "#c6c6c6"}
              />
            ))}
          </Bar>
          <Bar dataKey="otrosHours" stackId="a" fill="#777777">
            {months.map((entry) => (
              <Cell
                key={`${entry.calYear}-${entry.month}`}
                fill={entry.isCurrentMonth ? "#474747" : "#e2e2e4"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
