"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCategories, updateCategoriesCache } from "@/lib/hooks/use-categories";
import type { Category } from "@/lib/types";

export default function CategoryManager() {
  // User categories including deactivated ones (otherwise a deactivated one
  // vanished and could never be re-activated). System ones (imports) are hidden.
  const { allCategories, loading } = useCategories();
  const displayed = allCategories.filter((c) => !c.is_system);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleActive(cat: Category) {
    setError(null);
    const next = !cat.is_active;
    // Optimistic update of the shared cache: entry forms see it immediately.
    updateCategoriesCache((cats) =>
      cats.map((c) => (c.id === cat.id ? { ...c, is_active: next } : c))
    );
    const { error: updateError } = await createClient()
      .from("categories")
      .update({ is_active: next })
      .eq("id", cat.id);
    if (updateError) {
      updateCategoriesCache((cats) =>
        cats.map((c) => (c.id === cat.id ? { ...c, is_active: cat.is_active } : c))
      );
      setError("No se pudo guardar el cambio.");
    }
  }

  async function addCategory() {
    const name = newName.trim();
    if (!name || adding) return;
    if (allCategories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setError("Ya existe una categoría con ese nombre.");
      return;
    }
    setAdding(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("No hay sesión activa.");
      setAdding(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("categories")
      .insert({
        user_id: user.id,
        name,
        sort_order: displayed.reduce((max, c) => Math.max(max, c.sort_order), -1) + 1,
        is_active: true,
      })
      .select()
      .single();

    if (insertError || !data) {
      setError("No se pudo crear la categoría.");
    } else {
      updateCategoriesCache((cats) => [...cats, data as Category]);
      setNewName("");
    }
    setAdding(false);
  }

  if (loading) {
    return <div className="bg-surface-container-low h-32 animate-pulse" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
        Categorías — Otros Trabajos
      </p>

      <div className="flex flex-col gap-1">
        {displayed.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between bg-surface-container-low px-4 py-3"
          >
            <span
              className={`text-sm ${
                cat.is_active ? "text-on-surface" : "text-on-surface-variant line-through"
              }`}
            >
              {cat.name}
            </span>
            <button
              type="button"
              onClick={() => toggleActive(cat)}
              className="text-xs font-medium uppercase tracking-widest text-on-surface-variant"
            >
              {cat.is_active ? "Desactivar" : "Activar"}
            </button>
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-error">{error}</p>}

      {/* Add new */}
      <div className="flex gap-3 items-center">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCategory();
            }
          }}
          placeholder="Nueva categoría"
          className="flex-1 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:bg-white transition-colors ease-out"
        />
        <button
          type="button"
          disabled={adding || !newName.trim()}
          onClick={addCategory}
          className="bg-primary px-5 py-3 text-xs font-semibold uppercase tracking-widest text-on-primary disabled:opacity-40"
        >
          {adding ? "..." : "Añadir"}
        </button>
      </div>
    </div>
  );
}
