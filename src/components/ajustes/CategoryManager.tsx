"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCategories } from "@/lib/hooks/use-categories";
import type { Category } from "@/lib/types";

export default function CategoryManager() {
  const { categories, loading } = useCategories();
  const [localCats, setLocalCats] = useState<Category[] | null>(null);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const displayed = localCats ?? categories;

  async function toggleActive(cat: Category) {
    const supabase = createClient();
    const updated = displayed.map((c) =>
      c.id === cat.id ? { ...c, is_active: !c.is_active } : c
    );
    setLocalCats(updated);
    await supabase
      .from("categories")
      .update({ is_active: !cat.is_active })
      .eq("id", cat.id);
  }

  async function addCategory() {
    if (!newName.trim()) return;
    setAdding(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("categories")
      .insert({
        user_id: user.id,
        name: newName.trim(),
        sort_order: displayed.length,
        is_active: true,
      })
      .select()
      .single();

    if (data) {
      setLocalCats([...displayed, data as Category]);
    }
    setNewName("");
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

      {/* Add new */}
      <div className="flex gap-3 items-center">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCategory()}
          placeholder="Nueva categoría"
          className="flex-1 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:bg-white transition-colors"
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
