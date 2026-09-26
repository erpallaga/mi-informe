"use client";

import { useEffect, useMemo, useState } from "react";
import { aggregateEntries, aggregateAnnualCapped } from "@/lib/utils/calculations";
import { getServiceYear } from "@/lib/utils/dates";
import { useServiceYearEntries } from "./use-history";

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * "YYYY-MM" of today, re-read when the app comes back to the foreground: a PWA
 * can stay open across a month change, and a refetch that returns identical
 * data would not re-render on its own.
 */
function useCurrentMonthKey(): string {
  const [monthKey, setMonthKey] = useState(getCurrentMonthKey);
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") setMonthKey(getCurrentMonthKey());
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);
  return monthKey;
}

export function useProgress() {
  const monthKey = useCurrentMonthKey();
  // Derived from monthKey so a September rollover switches service year too.
  const [y, m] = monthKey.split("-").map(Number);
  const { startYear } = getServiceYear(new Date(y, m - 1, 1));
  const { data: entries, isPending } = useServiceYearEntries(startYear);

  const progress = useMemo(() => {
    if (!entries) return null;
    const monthEntries = entries.filter((e) => e.entry_date.startsWith(monthKey));
    return {
      monthly: aggregateEntries(monthEntries),
      annual: aggregateEntries(entries),
      annualCappedHours: aggregateAnnualCapped(entries),
    };
  }, [entries, monthKey]);

  return {
    monthly: progress?.monthly ?? null,
    annual: progress?.annual ?? null,
    annualCappedHours: progress?.annualCappedHours ?? 0,
    // Only true before the first data: refetches keep the cards mounted, so the
    // celebration animation in ProgressCard survives silent refreshes.
    loading: isPending,
  };
}
