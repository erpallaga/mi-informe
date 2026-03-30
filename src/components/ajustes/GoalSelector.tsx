"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type GoalType } from "@/lib/types";
import { useProfile } from "@/lib/hooks/use-profile";

const MAIN_OPTIONS: { value: GoalType; label: string; detail: string }[] = [
  { value: "publicador", label: "Publicador", detail: "Sin objetivo de horas" },
  { value: "precursor_auxiliar", label: "Precursor Auxiliar", detail: "15h o 30h / mes" },
  { value: "precursor_regular", label: "Precursor Regular", detail: "50h / mes · 600h / año" },
  { value: "custom", label: "Personalizado", detail: "Elige tus horas" },
];

const AUXILIAR_OPTIONS: { hours: 15 | 30; label: string }[] = [
  { hours: 15, label: "15h / mes" },
  { hours: 30, label: "30h / mes" },
];

export default function GoalSelector() {
  const { profile, loading, refreshProfile } = useProfile();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Local overrides — null means "use what's in profile"
  const [goalType, setGoalType] = useState<GoalType | null>(null);
  const [auxiliarHours, setAuxiliarHours] = useState<15 | 30 | null>(null);
  const [customHours, setCustomHours] = useState<string>("");

  const currentGoal: GoalType = goalType ?? profile?.goal_type ?? "publicador";

  // For precursor_auxiliar the sub-choice comes from custom_goal_hours (15 or 30)
  const currentAuxiliarHours: 15 | 30 =
    auxiliarHours ??
    ((profile?.custom_goal_hours === 15 ? 15 : 30) as 15 | 30);

  const currentCustom =
    customHours !== "" ? customHours : String(profile?.custom_goal_hours ?? "");

  async function save(
    newType: GoalType,
    newCustomHours: number | null
  ): Promise<void> {
    if (!profile) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({
        goal_type: newType,
        custom_goal_hours: newCustomHours,
      })
      .eq("id", profile.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleSelectMain(type: GoalType) {
    setGoalType(type);
    // For types with no sub-choice, save immediately
    if (type === "publicador") {
      await save("publicador", null);
    } else if (type === "precursor_regular") {
      await save("precursor_regular", null);
    }
    // precursor_auxiliar and custom need a sub-choice before saving
  }

  async function handleSelectAuxiliar(hours: 15 | 30) {
    setAuxiliarHours(hours);
    await save("precursor_auxiliar", hours);
  }

  if (loading) {
    return <div className="bg-surface-container-low h-40 animate-pulse" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
        Objetivo mensual
      </p>

      {/* Main option buttons */}
      <div className="flex flex-col gap-2">
        {MAIN_OPTIONS.map((opt) => {
          const isActive = currentGoal === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelectMain(opt.value)}
              className={`flex items-center justify-between px-4 py-3 text-left transition-colors ${
                isActive
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-on-surface"
              }`}
            >
              <span className="text-sm font-medium">{opt.label}</span>
              <span
                className={`text-xs ${
                  isActive ? "text-on-primary/80" : "text-on-surface-variant"
                }`}
              >
                {opt.detail}
              </span>
            </button>
          );
        })}
      </div>

      {/* Precursor Auxiliar sub-choice */}
      {currentGoal === "precursor_auxiliar" && (
        <div className="flex gap-2 mt-1">
          {AUXILIAR_OPTIONS.map((opt) => {
            const isActive = currentAuxiliarHours === opt.hours;
            return (
              <button
                key={opt.hours}
                type="button"
                disabled={saving}
                onClick={() => handleSelectAuxiliar(opt.hours)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors disabled:opacity-40 ${
                  isActive
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-low text-on-surface"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Custom hours input */}
      {currentGoal === "custom" && (
        <div className="flex gap-3 items-center mt-1">
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
            onClick={() =>
              save("custom", currentCustom ? parseFloat(currentCustom) : null)
            }
            className="bg-primary px-5 py-3 text-xs font-semibold uppercase tracking-widest text-on-primary disabled:opacity-40"
          >
            {saving ? "..." : saved ? "Guardado" : "Guardar"}
          </button>
        </div>
      )}

      {/* Save feedback for non-custom types */}
      {saved && currentGoal !== "custom" && (
        <p className="text-xs font-medium text-primary uppercase tracking-widest">
          Guardado
        </p>
      )}
    </div>
  );
}
