"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ActivityInput {
  entry_date: string;
  predicacion_hours: number;
  cursos_biblicos: number;
  otros_hours: Record<string, number>;
}

export function useActivity() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function insertEntry(input: ActivityInput): Promise<boolean> {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("No hay sesión activa");
      setLoading(false);
      return false;
    }

    const { error: insertError } = await supabase
      .from("activity_entries")
      .insert({
        user_id: user.id,
        entry_date: input.entry_date,
        predicacion_hours: input.predicacion_hours,
        cursos_biblicos: input.cursos_biblicos,
        otros_hours: input.otros_hours,
      });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return false;
    }

    setLoading(false);
    window.dispatchEvent(new CustomEvent("mi-informe:entry-created"));
    return true;
  }

  async function updateEntry(id: string, input: ActivityInput): Promise<boolean> {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("activity_entries")
      .update({
        entry_date: input.entry_date,
        predicacion_hours: input.predicacion_hours,
        cursos_biblicos: input.cursos_biblicos,
        otros_hours: input.otros_hours,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return false;
    }

    setLoading(false);
    window.dispatchEvent(new CustomEvent("mi-informe:entry-created"));
    return true;
  }

  async function deleteEntry(id: string): Promise<boolean> {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("activity_entries")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      setLoading(false);
      return false;
    }

    setLoading(false);
    window.dispatchEvent(new CustomEvent("mi-informe:entry-created"));
    return true;
  }

  return { insertEntry, updateEntry, deleteEntry, loading, error };
}
