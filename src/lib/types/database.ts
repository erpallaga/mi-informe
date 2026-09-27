// Tipos del esquema de Supabase, en el formato de `supabase gen types typescript`.
// Escritos a mano a partir de supabase/migration.sql + supabase/migrations/*.
// Regenerar con `npm run db:types` (requiere SUPABASE_PROJECT_ID y `supabase login`)
// y revisar el diff: si difiere, manda el esquema real.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12"
  }
  public: {
    Tables: {
      activity_entries: {
        Row: {
          created_at: string
          cursos_biblicos: number
          entry_date: string
          id: string
          notes: string | null
          otros_hours: Json
          predicacion_hours: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cursos_biblicos?: number
          entry_date: string
          id?: string
          notes?: string | null
          otros_hours?: Json
          predicacion_hours?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cursos_biblicos?: number
          entry_date?: string
          id?: string
          notes?: string | null
          otros_hours?: Json
          predicacion_hours?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_plans: {
        Row: {
          created_at: string
          cursos_biblicos: number
          id: string
          notes: string | null
          otros_hours: Json
          plan_date: string
          predicacion_hours: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cursos_biblicos?: number
          id?: string
          notes?: string | null
          otros_hours?: Json
          plan_date: string
          predicacion_hours?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cursos_biblicos?: number
          id?: string
          notes?: string | null
          otros_hours?: Json
          plan_date?: string
          predicacion_hours?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          custom_goal_hours: number | null
          display_name: string | null
          goal_type: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_goal_hours?: number | null
          display_name?: string | null
          goal_type?: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_goal_hours?: number | null
          display_name?: string | null
          goal_type?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
