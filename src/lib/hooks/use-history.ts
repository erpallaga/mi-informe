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

// Module-level cache keyed by service startYear.
const cache = new Map<number, MonthData[]>();
const fetchPromises = new Map<number, Promise<void>>();

function buildMonthData(entries: ActivityEntry[], startYear: number): MonthData[] {
  const endYear = startYear + 1;
  const now = new Date();
  const currentCalMonth = now.getMonth();
  const currentCalYear = now.getFullYear();

  return SERVICE_YEAR_MONTHS.map((calMonth) => {
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
}

function fetchForYear(startYear: number): Promise<void> {
  if (fetchPromises.has(startYear)) return fetchPromises.get(startYear)!;
  const endYear = startYear + 1;
  const promise = Promise.resolve(
    createClient()
      .from("activity_entries")
      .select("*")
      .gte("entry_date", `${startYear}-09-01`)
      .lte("entry_date", `${endYear}-08-31`)
  ).then(({ data }) => {
    const entries = (data ?? []) as ActivityEntry[];
    cache.set(startYear, buildMonthData(entries, startYear));
    fetchPromises.delete(startYear);
  });
  fetchPromises.set(startYear, promise);
  return promise;
}

export function useHistory(serviceStartYear?: number) {
  const sv = getServiceYear();
  const startYear = serviceStartYear ?? sv.startYear;

  const [months, setMonths] = useState<MonthData[]>(cache.get(startYear) ?? []);
  const [loading, setLoading] = useState(!cache.has(startYear));

  useEffect(() => {
    let mounted = true;

    if (cache.has(startYear)) {
      setMonths(cache.get(startYear)!);
      setLoading(false);
    } else {
      setLoading(true);
      fetchForYear(startYear).then(() => {
        if (mounted) {
          setMonths(cache.get(startYear)!);
          setLoading(false);
        }
      });
    }

    function onEntryCreated() {
      // Only invalidate the current service year — past years don't change.
      const currentSY = getServiceYear().startYear;
      if (startYear === currentSY) {
        cache.delete(startYear);
        fetchForYear(startYear).then(() => {
          if (mounted) setMonths(cache.get(startYear)!);
        });
      }
    }

    window.addEventListener("mi-informe:entry-created", onEntryCreated);
    return () => {
      mounted = false;
      window.removeEventListener("mi-informe:entry-created", onEntryCreated);
    };
  }, [startYear]);

  return { months, loading };
}
