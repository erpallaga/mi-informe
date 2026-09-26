"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { aggregateEntries, aggregateAnnualCapped } from "@/lib/utils/calculations";
import { getServiceYear } from "@/lib/utils/dates";
import { normalizeEntry } from "@/lib/utils/normalize";

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
// Incremented on every invalidation: a response from an older generation is
// discarded so a slow stale fetch can never overwrite fresher data.
let generation = 0;
let listenersAttached = false;
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
  const gen = generation;
  const promise = (async () => {
    const supabase = createClient();
    const now = new Date();
    const serviceYear = getServiceYear(now);
    const monthKey = getCurrentMonthKey();

    // Single query for the full service year — month is filtered client-side.
    const { data, error } = await supabase
      .from("activity_entries")
      .select("*")
      .gte("entry_date", serviceYear.start)
      .lte("entry_date", serviceYear.end);

    if (gen !== generation) {
      // Superseded by a newer invalidation: wait for that one instead.
      await fetchPromise;
      return;
    }
    fetchPromise = null;
    if (error) {
      // Keep whatever was shown before; release the waiting hooks.
      if (cachedData) notifyAll(cachedData);
      return;
    }

    const allEntries = (data ?? []).map(normalizeEntry);
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
    notifyAll(result);
  })();
  fetchPromise = promise;
  return promise;
}

function invalidateAndRefresh() {
  generation++;
  fetchPromise = null;
  // cachedData is kept so mounted cards stay on screen during the silent refresh.
  cachedMonthKey = null;
  fetchAndCache();
}

// One global listener set, however many components use the hook — otherwise
// N mounted instances would fire N identical queries per entry change.
function attachGlobalListeners() {
  if (listenersAttached || typeof window === "undefined") return;
  listenersAttached = true;
  window.addEventListener("mi-informe:entry-created", () => {
    if (setters.size > 0) invalidateAndRefresh();
    else {
      // Nobody is showing progress: just drop the cache, next mount refetches.
      generation++;
      fetchPromise = null;
      cachedData = null;
      cachedMonthKey = null;
    }
  });
  // PWA resumed after hours/days in background: pick up the new month and
  // entries logged from other devices.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && setters.size > 0) {
      invalidateAndRefresh();
    }
  });
}

export function useProgress() {
  const [data, setData] = useState<CachedProgress | null>(cachedData);
  const [loading, setLoading] = useState(cachedData === null);
  // Only show the loading skeleton on the very first fetch so that
  // the celebration animation in ProgressCard survives silent refreshes.
  const hasLoadedRef = useRef(cachedData !== null);

  useEffect(() => {
    let mounted = true;
    attachGlobalListeners();
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

    return () => {
      mounted = false;
      setters.delete(setData);
    };
  }, []);

  return {
    monthly: data?.monthly ?? null,
    annual: data?.annual ?? null,
    annualCappedHours: data?.annualCappedHours ?? 0,
    loading,
  };
}
