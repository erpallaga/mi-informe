"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { monthBounds } from "@/lib/utils/dates";
import { normalizeEntry } from "@/lib/utils/normalize";
import type { ActivityEntry } from "@/lib/types";

export function useEventos() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Id of the latest request: responses for a month the user already left are dropped.
  const requestIdRef = useRef(0);

  const fetchEntries = useCallback(
    async (isInitial: boolean) => {
      const requestId = ++requestIdRef.current;
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

      if (requestId !== requestIdRef.current) return;
      if (fetchError) {
        setError(fetchError.message);
      } else {
        setEntries((data ?? []).map(normalizeEntry));
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
