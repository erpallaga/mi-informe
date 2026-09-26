"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { normalizeProfile } from "@/lib/utils/normalize";

type ProfileSetter = (p: Profile | null) => void;
const listeners = new Set<ProfileSetter>();

// undefined = not fetched yet, null = fetched but no profile row
let cachedProfile: Profile | null | undefined = undefined;
let fetchPromise: Promise<void> | null = null;

function doFetch(): Promise<void> {
  if (fetchPromise) return fetchPromise;
  fetchPromise = Promise.resolve(
    createClient().from("profiles").select("*").single()
  ).then(({ data, error }) => {
    fetchPromise = null;
    // On a network error leave the cache unset so the next mount retries.
    const profile = data ? normalizeProfile(data) : null;
    if (!error) cachedProfile = profile;
    listeners.forEach((fn) => fn(profile));
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
