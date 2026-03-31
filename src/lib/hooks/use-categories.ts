"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";

// Module-level cache shared across all hook instances
let cachedCategories: Category[] | null = null;
let fetchPromise: PromiseLike<void> | null = null;
type Setter = (cats: Category[]) => void;
const setters = new Set<Setter>();

function fetchCategories() {
  if (fetchPromise) return fetchPromise;
  fetchPromise = createClient()
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .then(({ data }) => {
      cachedCategories = data ?? [];
      setters.forEach((s) => s(cachedCategories!));
    });
  return fetchPromise;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(cachedCategories ?? []);
  const [loading, setLoading] = useState(cachedCategories === null);

  useEffect(() => {
    if (cachedCategories !== null) return;
    setters.add(setCategories);
    fetchCategories().then(() => setLoading(false));
    return () => { setters.delete(setCategories); };
  }, []);

  return { categories, loading };
}
