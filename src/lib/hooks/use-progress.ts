"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { aggregateEntries, aggregateAnnualCapped } from "@/lib/utils/calculations";
import { getServiceYear } from "@/lib/utils/dates";
import type { ActivityEntry } from "@/lib/types";

interface ProgressData {
  predicacionHours: number;
  otrosHours: number;
  otrosByCategory: Record<string, number>;
  totalHours: number;
  cursosBiblicos: number;
  entriesCount: number;
}

interface CachedProgress {
  monthly: ProgressData;
  annual: ProgressData;
  annualCappedHours: number;
}

type Setter = (data: CachedProgress) => void;

// Module-level cache shared across all hook instances.
// Invalidated on entry-created events and when the calendar month changes.
let cachedData: CachedProgress | null = null;
let cachedMonthKey: string | null = null; // "YYYY-MM" — used to detect month rollover
let fetchPromise: Promise<void> | null = null;
const setters = new Set<Setter>();

function getCurrentMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function notifyAll(data: CachedProgress) {
  setters.forEach((fn) => fn(data));
}

function fetchAndCache(): Promise<void> {
  if (fetchPromise) return fetchPromise;
  fetchPromise = (async () => {
    const supabase = createClient();
    const now = new Date();
    const serviceYear = getServiceYear(now);
    const monthKey = getCurrentMonthKey();

    // Single query for the full service year — month is filtered client-side.
    const { data } = await supabase
      .from("activity_entries")
      .select("*")
      .gte("entry_date", serviceYear.start)
      .lte("entry_date", serviceYear.end);

    const allEntries = (data ?? []) as ActivityEntry[];
    const monthEntries = allEntries.filter((e) =>
      e.entry_date.startsWith(monthKey)
    );

    const result: CachedProgress = {
      monthly: aggregateEntries(monthEntries),
      annual: aggregateEntries(allEntries),
      annualCappedHours: aggregateAnnualCapped(allEntries),
    };

    cachedData = result;
    cachedMonthKey = monthKey;
    fetchPromise = null;
    notifyAll(result);
  })();
  return fetchPromise;
}

function invalidateAndRefresh() {
  cachedData = null;
  cachedMonthKey = null;
  fetchPromise = null;
  fetchAndCache();
}

export function useProgress() {
  const [data, setData] = useState<CachedProgress | null>(cachedData);
  const [loading, setLoading] = useState(cachedData === null);
  // Only show the loading skeleton on the very first fetch so that
  // the celebration animation in ProgressCard survives silent refreshes.
  const hasLoadedRef = useRef(cachedData !== null);

  useEffect(() => {
    let mounted = true;
    setters.add(setData);

    const currentMonthKey = getCurrentMonthKey();
    const cacheValid = cachedData !== null && cachedMonthKey === currentMonthKey;

    if (cacheValid) {
      // Instant return from cache — no network request.
      setData(cachedData!);
      setLoading(false);
      hasLoadedRef.current = true;
    } else {
      if (!hasLoadedRef.current) setLoading(true);
      fetchAndCache().then(() => {
        if (mounted) {
          setLoading(false);
          hasLoadedRef.current = true;
        }
      });
    }

    function onEntryCreated() {
      invalidateAndRefresh();
    }

    window.addEventListener("mi-informe:entry-created", onEntryCreated);
    return () => {
      mounted = false;
      setters.delete(setData);
      window.removeEventListener("mi-informe:entry-created", onEntryCreated);
    };
  }, []);

  return {
    monthly: data?.monthly ?? null,
    annual: data?.annual ?? null,
    annualCappedHours: data?.annualCappedHours ?? 0,
    loading,
  };
}
