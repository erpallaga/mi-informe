-- ================================================
-- Funciones SECURITY DEFINER fuera de la API pública
-- ================================================
-- Supabase concede EXECUTE sobre las funciones de `public` a anon y
-- authenticated, lo que las expone como /rest/v1/rpc/<nombre> (advisors
-- 0028 y 0029). Estas funciones solo deben ejecutarse como triggers:
-- Postgres no comprueba EXECUTE al disparar un trigger, así que el alta de
-- usuarios (perfil + categorías por defecto) sigue funcionando.
-- service_role conserva el permiso.
-- Idempotente, en transacción.

BEGIN;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.seed_default_categories() FROM PUBLIC, anon, authenticated;

-- rls_auto_enable() no la crea este repositorio: la añade Supabase al activar
-- "RLS automático en tablas nuevas" (función de event trigger). Solo se toca
-- si existe.
DO $$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END
$$;

COMMIT;
