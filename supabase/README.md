# Base de datos

- `migration.sql` — esquema inicial (ya aplicado en producción).
- `migrations/` — cambios posteriores, **en orden de nombre**. Cada fichero es
  idempotente y va en una transacción: si falla, no deja nada a medias.

| Migración | Qué hace | ¿Antes del deploy? |
|---|---|---|
| `20260926120000_hours_precision.sql` | `predicacion_hours` → `NUMERIC(9,6)` y datos existentes redondeados al minuto exacto (columnas y `otros_hours`) | Indiferente: compatible en ambos sentidos |
| `20260926130000_schema_hardening.sql` | `categories.is_system`, CHECKs, trigger `updated_at`, `search_path` fijo, RLS con `(select auth.uid())`, índice redundante fuera | **Sí**: la importación de backups escribe `is_system` |
| `20260927100000_revoke_definer_execute.sql` | Quita `EXECUTE` a `anon`/`authenticated` sobre las funciones `SECURITY DEFINER` (advisors 0028/0029). Los triggers siguen funcionando | Indiferente |

## Cómo aplicarlas

Supabase Dashboard → SQL Editor → pegar el fichero → Run. O con la CLI:

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

Tras aplicarlas: Dashboard → Advisors (Security y Performance) debería quedar
sin avisos de `function_search_path_mutable`, `auth_rls_initplan` ni
`*_security_definer_function_executable`. El aviso "Leaked Password Protection"
es un ajuste de Auth, no de esquema (Authentication → Sign In / Providers → Email).

## Tipos TypeScript

`src/lib/types/database.ts` tipa los clientes de Supabase. Tras cambiar el
esquema, regenerarlo y revisar el diff:

```bash
npx supabase login
SUPABASE_PROJECT_ID=<ref> npm run db:types
```
