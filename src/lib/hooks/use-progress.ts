"use client";

import { useEffect, useState } from "react";
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

export function useProgress() {
  const [monthly, setMonthly] = useState<ProgressData | null>(null);
  const [annual, setAnnual] = useState<ProgressData | null>(null);
  const [annualCappedHours, setAnnualCappedHours] = useState(0);
  const [loading, setLoading] = useState(true);

  function fetchData() {
    setLoading(true);
    const supabase = createClient();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const serviceYear = getServiceYear(now);

    const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const monthEnd = new Date(year, month, 0);
    const monthEndStr = `${year}-${String(month).padStart(2, "0")}-${String(monthEnd.getDate()).padStart(2, "0")}`;

    Promise.all([
      supabase.from("activity_entries").select("*").gte("entry_date", monthStart).lte("entry_date", monthEndStr),
      supabase.from("activity_entries").select("*").gte("entry_date", serviceYear.start).lte("entry_date", serviceYear.end),
    ]).then(([monthRes, yearRes]) => {
      const annualEntries = (yearRes.data ?? []) as ActivityEntry[];
      setMonthly(aggregateEntries((monthRes.data ?? []) as ActivityEntry[]));
      setAnnual(aggregateEntries(annualEntries));
      setAnnualCappedHours(aggregateAnnualCapped(annualEntries));
      setLoading(false);
    });
  }

  useEffect(() => {
    fetchData();
    window.addEventListener("mi-informe:entry-created", fetchData);
    return () => window.removeEventListener("mi-informe:entry-created", fetchData);
  }, []);

  return { monthly, annual, annualCappedHours, loading };
}
