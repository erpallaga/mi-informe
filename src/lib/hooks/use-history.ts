"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { aggregateEntries } from "@/lib/utils/calculations";
import { formatMonthShort, getServiceYear } from "@/lib/utils/dates";
import { normalizeEntry } from "@/lib/utils/normalize";
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

interface YearData {
  months: MonthData[];
  entries: ActivityEntry[];
}

// The 12 months of the service year in order: Sept(8)...Dec(11), Jan(0)...Aug(7)
const SERVICE_YEAR_MONTHS = [8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7];

// Module-level cache keyed by service startYear.
const cache = new Map<number, YearData>();
const fetchPromises = new Map<number, Promise<void>>();
// Bumped on every entry change so in-flight responses fetched before it are discarded.
let generation = 0;

function buildMonthData(entries: ActivityEntry[], startYear: number): MonthData[] {
  const endYear = startYear + 1;
  const now = new Date();
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

function fetchForYear(startYear: number): Promise<void> {
  const pending = fetchPromises.get(startYear);
  if (pending) return pending;
  const gen = generation;
  const endYear = startYear + 1;
  const promise = Promise.resolve(
    createClient()
      .from("activity_entries")
      .select("*")
      .gte("entry_date", `${startYear}-09-01`)
      .lte("entry_date", `${endYear}-08-31`)
  ).then(({ data, error }) => {
    if (fetchPromises.get(startYear) === promise) fetchPromises.delete(startYear);
    // Stale response (an entry changed meanwhile) or error: don't cache it.
    if (gen !== generation || error) return;
    const entries = (data ?? []).map(normalizeEntry);
    cache.set(startYear, { months: buildMonthData(entries, startYear), entries });
  });
  fetchPromises.set(startYear, promise);
  return promise;
}

// Global (not per-instance) invalidation: entries logged while Historial is not
// mounted must not leave a stale year in the cache for the next visit.
// Any year may have changed (edits of old entries, backup imports).
let listenerAttached = false;
function attachGlobalListener() {
  if (listenerAttached || typeof window === "undefined") return;
  listenerAttached = true;
  window.addEventListener("mi-informe:entry-created", () => {
    generation++;
    cache.clear();
    fetchPromises.clear();
  });
}

const EMPTY: YearData = { months: [], entries: [] };

export function useHistory(serviceStartYear?: number) {
  const startYear = serviceStartYear ?? getServiceYear().startYear;

  const [data, setData] = useState<YearData>(cache.get(startYear) ?? EMPTY);
  const [loading, setLoading] = useState(!cache.has(startYear));

  useEffect(() => {
    let mounted = true;
    attachGlobalListener();

    function load(showLoading: boolean) {
      const cached = cache.get(startYear);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
      if (showLoading) setLoading(true);
      const gen = generation;
      fetchForYear(startYear).then(() => {
        if (!mounted) return;
        const fresh = cache.get(startYear);
        if (fresh) {
          setData(fresh);
          setLoading(false);
        } else if (gen === generation) {
          // Request failed: stop the skeleton, keep what was shown.
          setLoading(false);
        }
        // Otherwise an entry changed meanwhile and onEntryChange already reloads.
      });
    }
    load(true);

    // Runs after the global listener has cleared the cache: silent refetch.
    function onEntryChange() {
      load(false);
    }

    window.addEventListener("mi-informe:entry-created", onEntryChange);
    return () => {
      mounted = false;
      window.removeEventListener("mi-informe:entry-created", onEntryChange);
    };
  }, [startYear]);

  return { months: data.months, entries: data.entries, loading };
}
