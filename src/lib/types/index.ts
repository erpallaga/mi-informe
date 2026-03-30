export type GoalType = "publicador" | "precursor_auxiliar" | "precursor_regular" | "custom";

export const GOAL_PRESETS: Record<Exclude<GoalType, "custom">, { monthlyHours: number; label: string }> = {
  publicador: { monthlyHours: 1, label: "Publicador" },
  precursor_auxiliar: { monthlyHours: 30, label: "Precursor Auxiliar" },
  precursor_regular: { monthlyHours: 50, label: "Precursor Regular" },
};

export interface Profile {
  id: string;
  display_name: string | null;
  goal_type: GoalType;
  custom_goal_hours: number | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ActivityEntry {
  id: string;
  user_id: string;
  entry_date: string;
  predicacion_hours: number;
  cursos_biblicos: number;
  otros_hours: Record<string, number>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MonthlyProgress {
  month: number;
  year: number;
  predicacionHours: number;
  otrosHours: number;
  totalHours: number;
  cursosBiblicos: number;
  entriesCount: number;
}
