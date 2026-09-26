"use client";

import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCategories } from "@/lib/query/fetchers";
import { queryKeys } from "@/lib/query/keys";
import type { Category } from "@/lib/types";

const EMPTY: Category[] = [];

/**
 * ALL categories (active + inactive + system): inactive/system ones are hidden
 * from entry forms but still needed to label hours already logged under them.
 */
export function useCategories() {
  const { data, isPending } = useQuery({
    queryKey: queryKeys.categories,
    queryFn: fetchCategories,
    // Only changes through Ajustes, which updates the cache itself.
    staleTime: Infinity,
  });
  const allCategories = data ?? EMPTY;

  // `!c.is_system` also tolerates rows read before the is_system migration (undefined).
  const categories = useMemo(
    () => allCategories.filter((c) => c.is_active && !c.is_system),
    [allCategories]
  );

  return {
    /** Active, user-created categories: the ones offered in entry forms. */
    categories,
    /** Every category, for name lookups of hours already logged. */
    allCategories,
    loading: isPending,
  };
}

/** Applies a local change (after a mutation) to the shared categories cache. */
export function useUpdateCategoriesCache() {
  const queryClient = useQueryClient();
  return useCallback(
    (updater: (cats: Category[]) => Category[]) =>
      queryClient.setQueryData<Category[]>(queryKeys.categories, (cats) => updater(cats ?? [])),
    [queryClient]
  );
}
