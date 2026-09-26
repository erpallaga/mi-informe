"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { monthBounds } from "@/lib/utils/dates";
import { fetchEntriesBetween } from "@/lib/query/fetchers";
import { queryKeys } from "@/lib/query/keys";
import type { ActivityEntry } from "@/lib/types";

const EMPTY: ActivityEntry[] = [];

export function useEventos() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const { from, to } = monthBounds(month);

  // One cache entry per month: responses for a month already left can't
  // overwrite the visible one, and going back to a month is instant.
  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.entries.month(from),
    queryFn: () => fetchEntriesBetween(from, to),
  });

  function prevMonth() {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }

  function nextMonth() {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  return {
    month,
    entries: data ?? EMPTY,
    loading: isPending,
    error: error ? error.message : null,
    prevMonth,
    nextMonth,
    refresh: () => void refetch(),
  };
}
