"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query/keys";

interface ActivityInput {
  entry_date: string;
  predicacion_hours: number;
  cursos_biblicos: number;
  otros_hours: Record<string, number>;
}

export function useActivity() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refetches the visible entry queries and marks the rest stale, so every
  // screen (including ones not mounted) shows the change next time.
  function invalidateEntries() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.entries.all });
  }

  async function run(action: () => PromiseLike<{ error: { message: string } | null }>): Promise<boolean> {
    setLoading(true);
    setError(null);
    const { error: actionError } = await action();
    setLoading(false);
    if (actionError) {
      setError(actionError.message);
      return false;
    }
    void invalidateEntries();
    return true;
  }

  async function insertEntry(input: ActivityInput): Promise<boolean> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("No hay sesión activa");
      return false;
    }
    return run(() =>
      supabase.from("activity_entries").insert({
        user_id: user.id,
        entry_date: input.entry_date,
        predicacion_hours: input.predicacion_hours,
        cursos_biblicos: input.cursos_biblicos,
        otros_hours: input.otros_hours,
      })
    );
  }

  async function updateEntry(id: string, input: ActivityInput): Promise<boolean> {
    // updated_at is set by a DB trigger.
    return run(() =>
      createClient()
        .from("activity_entries")
        .update({
          entry_date: input.entry_date,
          predicacion_hours: input.predicacion_hours,
          cursos_biblicos: input.cursos_biblicos,
          otros_hours: input.otros_hours,
        })
        .eq("id", id)
    );
  }

  async function deleteEntry(id: string): Promise<boolean> {
    return run(() => createClient().from("activity_entries").delete().eq("id", id));
  }

  return { insertEntry, updateEntry, deleteEntry, invalidateEntries, loading, error };
}
