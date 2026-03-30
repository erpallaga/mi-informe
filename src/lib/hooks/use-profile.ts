"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

// Module-level listener set so all mounted instances of useProfile
// receive the updated profile when any one of them calls refreshProfile.
type ProfileSetter = (p: Profile | null) => void;
const listeners = new Set<ProfileSetter>();

async function fetchProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const { data } = await supabase.from("profiles").select("*").single();
  return data ?? null;
}

function notifyAll(profile: Profile | null) {
  listeners.forEach((fn) => fn(profile));
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listeners.add(setProfile);
    fetchProfile().then((data) => {
      setProfile(data);
      setLoading(false);
    });
    return () => {
      listeners.delete(setProfile);
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    const data = await fetchProfile();
    notifyAll(data);
  }, []);

  return { profile, loading, refreshProfile };
}
