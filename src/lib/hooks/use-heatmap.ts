"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface HeatmapEntry {
  entry_date: string;
  predicacion_hours: number;
  otros_hours: Record<string, number>;
}

export function useHeatmapData(startYear: number) {
  const [entries, setEntries] = useState<HeatmapEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("activity_entries")
      .select("entry_date, predicacion_hours, otros_hours")
      .gte("entry_date", `${startYear}-09-01`)
      .lte("entry_date", `${startYear + 1}-08-31`)
      .then(({ data }) => {
        setEntries((data ?? []) as HeatmapEntry[]);
        setLoading(false);
      });
  }, [startYear]);

  return { entries, loading };
}
