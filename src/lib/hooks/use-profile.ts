"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

type ProfileSetter = (p: Profile | null) => void;
const listeners = new Set<ProfileSetter>();

// undefined = not fetched yet, null = fetched but no profile row
let cachedProfile: Profile | null | undefined = undefined;
let fetchPromise: Promise<void> | null = null;

function doFetch(): Promise<void> {
  if (fetchPromise) return fetchPromise;
  fetchPromise = Promise.resolve(
    createClient().from("profiles").select("*").single()
  ).then(({ data }) => {
    cachedProfile = data ?? null;
    fetchPromise = null;
    listeners.forEach((fn) => fn(cachedProfile!));
  });
  return fetchPromise;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(
    cachedProfile !== undefined ? cachedProfile : null
  );
  const [loading, setLoading] = useState(cachedProfile === undefined);

  useEffect(() => {
    let mounted = true;
    listeners.add(setProfile);

    if (cachedProfile !== undefined) {
      // Cache hit — serve immediately.
      setProfile(cachedProfile);
      setLoading(false);
    } else {
      doFetch().then(() => {
        if (mounted) setLoading(false);
      });
    }

    return () => {
      mounted = false;
      listeners.delete(setProfile);
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    cachedProfile = undefined;
    fetchPromise = null;
    await doFetch();
  }, []);

  return { profile, loading, refreshProfile };
}
