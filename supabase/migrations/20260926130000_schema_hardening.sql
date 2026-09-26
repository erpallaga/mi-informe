-- ================================================
-- Endurecimiento del esquema
-- ================================================
-- Aplicar ANTES de desplegar el código que la acompaña: la importación de
-- backups inserta categories.is_system. (La lectura tolera su ausencia.)
-- Idempotente. Se ejecuta en una transacción: si algún dato existente viola un CHECK,
-- falla entera y no deja nada a medias.

BEGIN;

-- ------------------------------------------------
-- 1. categories.is_system
-- ------------------------------------------------
-- is_active significaba dos cosas: "desactivada por el usuario" y "oculta
-- por el sistema" (categorías creadas por importaciones, p. ej. Reembolso).
-- Ahora:
--   is_system = true  → creada por el sistema: nunca en formularios ni en Ajustes,
--                        pero cuenta en totales y desgloses.
--   is_active         → solo el interruptor del usuario.
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false;

-- Reembolso creado por ImportBackup: name='Reembolso', sort_order=9999, inactiva.
-- is_active se deja en false para que el código anterior (que solo mira
-- is_active) siga ocultándola durante el despliegue.
UPDATE public.categories
SET is_system = true
WHERE name = 'Reembolso' AND sort_order = 9999 AND is_active = false;

-- ------------------------------------------------
-- 2. CHECK constraints
-- ------------------------------------------------
ALTER TABLE public.activity_entries
  DROP CONSTRAINT IF EXISTS activity_entries_predicacion_nonneg,
  ADD CONSTRAINT activity_entries_predicacion_nonneg CHECK (predicacion_hours >= 0),
  DROP CONSTRAINT IF EXISTS activity_entries_cursos_nonneg,
  ADD CONSTRAINT activity_entries_cursos_nonneg CHECK (cursos_biblicos >= 0),
  DROP CONSTRAINT IF EXISTS activity_entries_otros_valid,
  ADD CONSTRAINT activity_entries_otros_valid CHECK (
    jsonb_typeof(otros_hours) = 'object'
    AND NOT jsonb_path_exists(otros_hours, '$.* ? (@.type() != "number" || @ < 0)')
  );

ALTER TABLE public.daily_plans
  DROP CONSTRAINT IF EXISTS daily_plans_predicacion_nonneg,
  ADD CONSTRAINT daily_plans_predicacion_nonneg CHECK (predicacion_hours >= 0),
  DROP CONSTRAINT IF EXISTS daily_plans_cursos_nonneg,
  ADD CONSTRAINT daily_plans_cursos_nonneg CHECK (cursos_biblicos >= 0),
  DROP CONSTRAINT IF EXISTS daily_plans_otros_valid,
  ADD CONSTRAINT daily_plans_otros_valid CHECK (
    jsonb_typeof(otros_hours) = 'object'
    AND NOT jsonb_path_exists(otros_hours, '$.* ? (@.type() != "number" || @ < 0)')
  );

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_custom_goal_range,
  ADD CONSTRAINT profiles_custom_goal_range CHECK (
    custom_goal_hours IS NULL OR (custom_goal_hours > 0 AND custom_goal_hours <= 300)
  );

ALTER TABLE public.categories
  DROP CONSTRAINT IF EXISTS categories_name_not_blank,
  ADD CONSTRAINT categories_name_not_blank CHECK (length(btrim(name)) > 0);

-- ------------------------------------------------
-- 3. updated_at mantenido por la base de datos
-- ------------------------------------------------
-- Antes lo ponía el cliente (reloj del dispositivo, y no en todos los updates).
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.activity_entries;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.activity_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.daily_plans;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.daily_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------
-- 4. Índice redundante
-- ------------------------------------------------
-- UNIQUE (user_id, plan_date) ya crea un índice idéntico.
DROP INDEX IF EXISTS public.idx_daily_plans_user_date;

-- ------------------------------------------------
-- 5. search_path fijo en funciones SECURITY DEFINER
-- ------------------------------------------------
-- Sin él, un search_path manipulado podría redirigir las referencias no
-- cualificadas (advisor de Supabase "function_search_path_mutable").
-- Ambas funciones ya usan nombres cualificados (public.*).
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.seed_default_categories() SET search_path = '';

-- ------------------------------------------------
-- 6. Políticas RLS: auth.uid() evaluado una vez por query
-- ------------------------------------------------
-- `auth.uid() = user_id` se re-evalúa por fila; `(select auth.uid())` se
-- evalúa una vez (advisor "auth_rls_initplan"). Mismo significado.
-- Se añade WITH CHECK explícito en los UPDATE (antes implícito vía USING).
-- Todas las políticas se limitan al rol authenticated.

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING ((select auth.uid()) = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);

-- categories
DROP POLICY IF EXISTS "Users can view own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.categories;
CREATE POLICY "Users can view own categories" ON public.categories
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own categories" ON public.categories
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

-- activity_entries
DROP POLICY IF EXISTS "Users can view own entries" ON public.activity_entries;
DROP POLICY IF EXISTS "Users can insert own entries" ON public.activity_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON public.activity_entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON public.activity_entries;
CREATE POLICY "Users can view own entries" ON public.activity_entries
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert own entries" ON public.activity_entries
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own entries" ON public.activity_entries
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own entries" ON public.activity_entries
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

-- daily_plans
DROP POLICY IF EXISTS "Users can view own plans" ON public.daily_plans;
DROP POLICY IF EXISTS "Users can insert own plans" ON public.daily_plans;
DROP POLICY IF EXISTS "Users can update own plans" ON public.daily_plans;
DROP POLICY IF EXISTS "Users can delete own plans" ON public.daily_plans;
CREATE POLICY "Users can view own plans" ON public.daily_plans
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert own plans" ON public.daily_plans
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own plans" ON public.daily_plans
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own plans" ON public.daily_plans
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

COMMIT;
