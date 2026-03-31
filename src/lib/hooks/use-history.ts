"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { aggregateEntries } from "@/lib/utils/calculations";
import { formatMonthShort, getServiceYear } from "@/lib/utils/dates";
import type { ActivityEntry } from "@/lib/types";

export interface MonthData {
  month: number;        // calendar month 0-based
  calYear: number;      // calendar year for this month
  label: string;        // "SEP", "OCT", etc.
  isCurrentMonth: boolean;
  predicacionHours: number;
  otrosHours: number;
  otrosByCategory: Record<string, number>;
  totalHours: number;
  cursosBiblicos: number;
  entriesCount: number;
}

// The 12 months of the service year in order: Sept(8)...Dec(11), Jan(0)...Aug(7)
const SERVICE_YEAR_MONTHS = [8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7];

export function useHistory(serviceStartYear?: number) {
  const sv = getServiceYear();
  const startYear = serviceStartYear ?? sv.startYear;
  const endYear = startYear + 1;

  const [months, setMonths] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const now = new Date();
    const currentCalMonth = now.getMonth();
    const currentCalYear = now.getFullYear();

    supabase
      .from("activity_entries")
      .select("*")
      .gte("entry_date", `${startYear}-09-01`)
      .lte("entry_date", `${endYear}-08-31`)
      .then(({ data }) => {
        const entries = (data ?? []) as ActivityEntry[];

        const result: MonthData[] = SERVICE_YEAR_MONTHS.map((calMonth) => {
          // Sept-Dec belong to startYear, Jan-Aug to endYear
          const calYear = calMonth >= 8 ? startYear : endYear;
          const monthEntries = entries.filter((e) => {
            const d = new Date(e.entry_date + "T00:00:00");
            return d.getMonth() === calMonth && d.getFullYear() === calYear;
          });
          const agg = aggregateEntries(monthEntries);
          return {
            month: calMonth,
            calYear,
            label: formatMonthShort(calMonth),
            isCurrentMonth: calMonth === currentCalMonth && calYear === currentCalYear,
            ...agg,
          };
        });

        setMonths(result);
        setLoading(false);
      });
  }, [startYear, endYear]);

  return { months, loading };
}
