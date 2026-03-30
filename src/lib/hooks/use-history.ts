"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { aggregateEntries } from "@/lib/utils/calculations";
import { formatMonthShort } from "@/lib/utils/dates";
import type { ActivityEntry } from "@/lib/types";

export interface MonthData {
  month: number; // 0-based
  label: string; // "ENE", "FEB", etc.
  predicacionHours: number;
  otrosHours: number;
  totalHours: number;
  cursosBiblicos: number;
  entriesCount: number;
}

export function useHistory(year?: number) {
  const targetYear = year ?? new Date().getFullYear();
  const [months, setMonths] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("activity_entries")
      .select("*")
      .gte("entry_date", `${targetYear}-01-01`)
      .lte("entry_date", `${targetYear}-12-31`)
      .then(({ data }) => {
        const entries = (data ?? []) as ActivityEntry[];

        const result: MonthData[] = Array.from({ length: 12 }, (_, i) => {
          const monthEntries = entries.filter((e) => {
            const m = new Date(e.entry_date + "T00:00:00").getMonth();
            return m === i;
          });
          const agg = aggregateEntries(monthEntries);
          return {
            month: i,
            label: formatMonthShort(i),
            ...agg,
          };
        });

        setMonths(result);
        setLoading(false);
      });
  }, [targetYear]);

  return { months, loading };
}
