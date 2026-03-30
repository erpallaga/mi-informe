"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type GoalType } from "@/lib/types";
import { useProfile } from "@/lib/hooks/use-profile";

const OPTIONS: { value: GoalType; label: string; hours: string }[] = [
  { value: "publicador", label: "Publicador", hours: "1h/mes" },
  { value: "precursor_auxiliar", label: "Precursor Auxiliar", hours: "30h/mes" },
  { value: "precursor_regular", label: "Precursor Regular", hours: "50h/mes" },
  { value: "custom", label: "Personalizado", hours: "" },
];

export default function GoalSelector() {
  const { profile, loading } = useProfile();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [goalType, setGoalType] = useState<GoalType | null>(null);
  const [customHours, setCustomHours] = useState<string>("");

  const currentGoal = goalType ?? profile?.goal_type ?? "publicador";
  const currentCustom =
    customHours !== ""
      ? customHours
      : String(profile?.custom_goal_hours ?? "");

  async function handleSave(newType: GoalType, newCustom?: string) {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("profiles").update({
      goal_type: newType,
      custom_goal_hours:
        newType === "custom" && newCustom ? parseFloat(newCustom) : null,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return <div className="bg-surface-container-low h-32 animate-pulse" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
        Objetivo mensual
      </p>

      <div className="flex flex-col gap-2">
        {OPTIONS.map((opt) => {
          const isActive = currentGoal === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setGoalType(opt.value);
                if (opt.value !== "custom") handleSave(opt.value);
              }}
              className={`flex items-center justify-between px-4 py-3 text-left transition-colors ${
                isActive
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-on-surface"
              }`}
            >
              <span className="text-sm font-medium">{opt.label}</span>
              {opt.hours && (
                <span
                  className={`text-xs ${
                    isActive ? "text-on-primary" : "text-on-surface-variant"
                  }`}
                >
                  {opt.hours}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {currentGoal === "custom" && (
        <div className="flex gap-3 items-center">
          <input
            type="number"
            min={1}
            max={300}
            value={currentCustom}
            onChange={(e) => setCustomHours(e.target.value)}
            placeholder="Horas por mes"
            className="flex-1 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:bg-white transition-colors"
          />
          <button
            type="button"
            disabled={saving || !currentCustom}
            onClick={() => handleSave("custom", currentCustom)}
            className="bg-primary px-5 py-3 text-xs font-semibold uppercase tracking-widest text-on-primary disabled:opacity-40"
          >
            {saving ? "..." : saved ? "Guardado" : "Guardar"}
          </button>
        </div>
      )}
    </div>
  );
}
