-- ================================================
-- Precisión de horas
-- ================================================
-- NUMERIC(5,2) no puede representar la mayoría de minutos (0:10 = 0,1666… → 0,17).
-- Cada entrada perdía hasta ±0,2 min y el error, sistemático para un mismo
-- valor (1:10, 2:40…), se acumulaba: ~5 min/mes con 25 entradas de 1:10.
--
-- Con 6 decimales el error por entrada es < 0,00003 min (despreciable).
-- La semántica no cambia (siguen siendo horas decimales), así que la migración
-- es compatible en ambos sentidos: el código anterior funciona con el esquema
-- nuevo y el código nuevo con el esquema anterior (redondeado como hasta ahora).
--
-- Además normaliza los datos existentes al minuto exacto más cercano, incluidos
-- los valores de otros_hours (JSONB), que el cliente redondeaba a 2 decimales.
-- Idempotente: volver a ejecutarla no cambia nada.

BEGIN;

ALTER TABLE public.activity_entries
  ALTER COLUMN predicacion_hours TYPE NUMERIC(9,6);
ALTER TABLE public.daily_plans
  ALTER COLUMN predicacion_hours TYPE NUMERIC(9,6);

-- round(h * 60) recupera el minuto original: el error de 2 decimales (≤ 0,3 min)
-- es menor que medio minuto.
UPDATE public.activity_entries
SET predicacion_hours = round(round(predicacion_hours * 60) / 60.0, 6)
WHERE predicacion_hours <> round(round(predicacion_hours * 60) / 60.0, 6);

UPDATE public.daily_plans
SET predicacion_hours = round(round(predicacion_hours * 60) / 60.0, 6)
WHERE predicacion_hours <> round(round(predicacion_hours * 60) / 60.0, 6);

-- otros_hours: {categoryId: horas}. Solo se tocan valores numéricos.
UPDATE public.activity_entries e
SET otros_hours = (
  SELECT jsonb_object_agg(
    t.key,
    CASE WHEN jsonb_typeof(t.value) = 'number'
      THEN to_jsonb(round(round((t.value #>> '{}')::numeric * 60) / 60.0, 6))
      ELSE t.value
    END
  )
  FROM jsonb_each(e.otros_hours) AS t
)
WHERE e.otros_hours <> '{}'::jsonb;

UPDATE public.daily_plans p
SET otros_hours = (
  SELECT jsonb_object_agg(
    t.key,
    CASE WHEN jsonb_typeof(t.value) = 'number'
      THEN to_jsonb(round(round((t.value #>> '{}')::numeric * 60) / 60.0, 6))
      ELSE t.value
    END
  )
  FROM jsonb_each(p.otros_hours) AS t
)
WHERE p.otros_hours <> '{}'::jsonb;

COMMIT;
