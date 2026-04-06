"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ActivityEntry } from "@/lib/types";

function monthBounds(month: Date): { from: string; to: string } {
  const y = month.getFullYear();
  const m = month.getMonth(); // 0-indexed
  const pad = (n: number) => String(n).padStart(2, "0");
  const lastDay = new Date(y, m + 1, 0).getDate();
  return {
    from: `${y}-${pad(m + 1)}-01`,
    to: `${y}-${pad(m + 1)}-${pad(lastDay)}`,
  };
}

export function useEventos() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(
    async (isInitial: boolean) => {
      if (isInitial) setLoading(true);
      setError(null);

      const supabase = createClient();
      const { from, to } = monthBounds(month);

      const { data, error: fetchError } = await supabase
        .from("activity_entries")
        .select("*")
        .gte("entry_date", from)
        .lte("entry_date", to)
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        const normalized = (data ?? []).map((e) => ({
          ...e,
          predicacion_hours: Number(e.predicacion_hours),
        }));
        setEntries(normalized);
      }

      setLoading(false);
    },
    [month]
  );

  useEffect(() => {
    fetchEntries(true);
  }, [fetchEntries]);

  // Stable ref so the event listener never needs to be torn down and re-created
  // when the month changes — it always calls the latest fetchEntries.
  const fetchEntriesRef = useRef(fetchEntries);
  fetchEntriesRef.current = fetchEntries;

  useEffect(() => {
    function onEntryChange() {
      fetchEntriesRef.current(false);
    }
    window.addEventListener("mi-informe:entry-created", onEntryChange);
    return () => window.removeEventListener("mi-informe:entry-created", onEntryChange);
  }, []); // runs once — ref always points to current fetchEntries

  function prevMonth() {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }

  function nextMonth() {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  function refresh() {
    fetchEntries(false);
  }

  return { month, entries, loading, error, prevMonth, nextMonth, refresh };
}
