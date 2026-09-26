"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProfile } from "@/lib/query/fetchers";
import { queryKeys } from "@/lib/query/keys";

export function useProfile() {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: queryKeys.profile,
    queryFn: fetchProfile,
    // Only changes through Ajustes, which calls refreshProfile().
    staleTime: Infinity,
  });

  const refreshProfile = useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
    [queryClient]
  );

  return { profile: data ?? null, loading: isPending, refreshProfile };
}
