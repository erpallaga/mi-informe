"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { aggregateEntries } from "@/lib/utils/calculations";
import { formatMonthShort, getServiceYear } from "@/lib/utils/dates";
import { fetchEntriesBetween } from "@/lib/query/fetchers";
import { queryKeys } from "@/lib/query/keys";
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

const EMPTY: ActivityEntry[] = [];

export function buildMonthData(entries: ActivityEntry[], startYear: number, now = new Date()): MonthData[] {
  const endYear = startYear + 1;
  const currentCalMonth = now.getMonth();
  const currentCalYear = now.getFullYear();

  const byMonthKey = new Map<string, ActivityEntry[]>();
  for (const e of entries) {
    const key = e.entry_date.substring(0, 7); // "YYYY-MM"
    const list = byMonthKey.get(key);
    if (list) list.push(e);
    else byMonthKey.set(key, [e]);
  }

  return SERVICE_YEAR_MONTHS.map((calMonth) => {
    const calYear = calMonth >= 8 ? startYear : endYear;
    const key = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
    const agg = aggregateEntries(byMonthKey.get(key) ?? []);
    return {
      month: calMonth,
      calYear,
      label: formatMonthShort(calMonth),
      isCurrentMonth: calMonth === currentCalMonth && calYear === currentCalYear,
      ...agg,
    };
  });
}

/**
 * All entries of one service year (Sept → Aug). Shared by Panel (useProgress)
 * and Historial (useHistory): same key, one request.
 */
export function useServiceYearEntries(startYear: number) {
  return useQuery({
    queryKey: queryKeys.entries.serviceYear(startYear),
    queryFn: () => fetchEntriesBetween(`${startYear}-09-01`, `${startYear + 1}-08-31`),
  });
}

export function useHistory(serviceStartYear?: number) {
  const startYear = serviceStartYear ?? getServiceYear().startYear;
  const { data, isPending } = useServiceYearEntries(startYear);
  const entries = data ?? EMPTY;
  const months = useMemo(() => buildMonthData(entries, startYear), [entries, startYear]);

  return { months, entries, loading: isPending };
}
