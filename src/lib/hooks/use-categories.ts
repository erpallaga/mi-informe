"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";

// Module-level cache shared across all hook instances.
// Holds ALL categories (active + inactive): inactive ones are hidden from entry
// forms but still needed to label hours already logged under them.
let cachedCategories: Category[] | null = null;
let fetchPromise: Promise<void> | null = null;
type Setter = (cats: Category[]) => void;
const setters = new Set<Setter>();

function notifyAll(cats: Category[]) {
  cachedCategories = cats;
  setters.forEach((s) => s(cats));
}

function fetchCategories(): Promise<void> {
  if (fetchPromise) return fetchPromise;
  fetchPromise = Promise.resolve(
    createClient().from("categories").select("*").order("sort_order")
  ).then(({ data, error }) => {
    fetchPromise = null;
    // On error, don't poison the cache: the next mount retries.
    if (error) {
      setters.forEach((s) => s(cachedCategories ?? []));
      return;
    }
    notifyAll((data ?? []) as Category[]);
  });
  return fetchPromise;
}

/** Applies a local change (after a successful mutation) to every mounted hook. */
export function updateCategoriesCache(updater: (cats: Category[]) => Category[]) {
  notifyAll(updater(cachedCategories ?? []));
}

export function useCategories() {
  const [allCategories, setAllCategories] = useState<Category[]>(cachedCategories ?? []);
  const [loading, setLoading] = useState(cachedCategories === null);

  useEffect(() => {
    let mounted = true;
    // Always subscribe so mutations elsewhere (Ajustes) reach this instance.
    setters.add(setAllCategories);
    if (cachedCategories !== null) {
      setAllCategories(cachedCategories);
      setLoading(false);
    } else {
      fetchCategories().then(() => {
        if (mounted) setLoading(false);
      });
    }
    return () => {
      mounted = false;
      setters.delete(setAllCategories);
    };
  }, []);

  const categories = useMemo(() => allCategories.filter((c) => c.is_active), [allCategories]);

  return {
    /** Active categories: the ones offered in entry forms. */
    categories,
    /** Every category, for name lookups of hours already logged. */
    allCategories,
    loading,
  };
}
