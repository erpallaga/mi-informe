# Mi Informe — Field Service Tracker

App de time tracking para Testigos de Jehová. Registro de predicación, proyectos teocráticos, objetivos mensuales/anuales y dashboard de progreso.

## Stack
- Next.js 14 App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL + auth email/password)
- TanStack Query v5 (caché y sincronización de datos en cliente)
- Vercel (deploy) · Repo: github.com/erpallaga/mi-informe (privado)

## MCPs activos
- **Stitch**: design system y tokens — consultar antes de crear o modificar cualquier componente visual
- **Figma**: referencia de pantallas → https://www.figma.com/design/ujRtucK01Oy5gQ4qoNlTCs/Mi-Informe
- **Supabase**: base de datos y auth
- **Vercel**: deploy

---

## Design System

### Reglas absolutas
- **0px border-radius** en todo. Sin excepciones.
- **Sin bordes** 1px solid. Separar secciones solo con cambios de `background-color`.
- **Glassmorphism** en nav y modals: `backdrop-filter blur(20px)`, opacidad 70-80%.
- **Paleta**: `surface #f9f9fb` → `surface_container_low #f3f3f5` → `white #fff`.
- **Tipografía**: Inter. Sin iconos salvo necesidad absoluta.
- **Sombras**: blur 40-60px al 4% opacidad. Nunca oscuras.
- **Transiciones**: `linear` o `ease-out` únicamente. Nunca bounce.
- **Mobile-first** siempre. Pantalla de referencia: 393px.

### Tokens de color para Recharts (los props fill/stroke bypasean Tailwind — verificar cada hex manualmente)
| Token | Hex |
|---|---|
| on-surface | `#1a1c1d` |
| on-surface-variant | `#474747` |
| outline | `#777777` |
| inactive | `#c6c6c6` / `#e2e2e4` |
| surface-container-low | `#f3f3f5` |

---

## Dominio: reglas de negocio críticas

### Año de servicio
- **Septiembre → Agosto** (no año calendario). Ver `getServiceYear()` en `src/lib/utils/dates.ts`.

### Horas: formato y almacenamiento
- Mostrar siempre en **`hh:mm`** via `fmtHours()` (`src/lib/utils/calculations.ts`). Nunca decimales.
- Input acepta `h:mm` o número plano via `parseHHMM()`.
- Todo valor de horas que se escribe en BD va redondeado al minuto con `roundToMinute()` (6 decimales). Nunca redondear a 2 decimales: 0:10 no es representable y el error se acumula.
- DB: columnas `NUMERIC(9,6)` — **Supabase puede devolver string en runtime**. Toda fila leída pasa por `normalizeEntry()` / `normalizePlan()` / `normalizeProfile()` (`src/lib/utils/normalize.ts`), nunca `Number()` suelto.

### Progreso anual (Precursor Regular: objetivo 600h/año, 50h/mes)
- Hay un **tope de 55h/mes** cuando hay `otros_hours` — ver `monthlyAnnualContribution()`.
- **Nunca** calcular progreso como `totalHours / annualGoal` — es inexacto si hay otros proyectos.
- Usar `aggregateAnnualCapped(rawEntries)` de `calculations.ts` para horas que cuentan hacia el objetivo.

### Registros de actividad
- **Múltiples entries por día** están permitidas — siempre INSERT, nunca UPSERT. Sin UNIQUE en `(user_id, entry_date)`.
- `otros_hours` es `Record<categoryId, number>` — sumar siempre con `sumOtrosHours()`.

### Categorías
- `is_system = true`: creadas por el sistema (imports, p. ej. Reembolso). Cuentan en totales y desgloses, pero nunca aparecen en formularios ni en Ajustes.
- `is_active`: solo el interruptor del usuario (Ajustes → Activar/Desactivar).
- `useCategories()` devuelve `categories` (activas y no de sistema → formularios) y `allCategories` (todas → etiquetar horas ya registradas). Para desgloses usar siempre `allCategories`, o no cuadran con el total.
- Tras mutar categorías, actualizar la caché con `useUpdateCategoriesCache()`.
- `Abbuono` de Ministry Assistant → `otros_hours`, nunca `predicacion_hours`.

---

## Patrones de código establecidos

### Fechas ISO: nunca usar toISOString()
`toISOString()` convierte medianoche local a UTC, desplazando 1 día en España (UTC+1/+2). Construir strings directamente:
Usar los helpers de `src/lib/utils/dates.ts`: `todayISO()`, `toISODate(date)`, `monthBounds(month)`.

### Datos: TanStack Query
- Fetchers en `src/lib/query/fetchers.ts` (lanzan en error, normalizan filas); claves en `src/lib/query/keys.ts`.
- Toda query de `activity_entries` cuelga de `["entries", …]`. Tras cualquier escritura: `invalidateQueries({ queryKey: queryKeys.entries.all })`. No hay bus de eventos propio.
- Panel (`useProgress`) e Historial (`useHistory`) comparten la query del año de servicio (`useServiceYearEntries`): una sola petición.
- Datos que solo cambian desde Ajustes (perfil, categorías): `staleTime: Infinity` y actualización explícita de la caché.
- `loading` = `isPending` (solo sin datos). Los refetch nunca vuelven al skeleton.

### Sesión
Login y logout hacen navegación completa (`window.location.replace`), no `router.push`, para descartar el QueryClient (y sus datos) entre cuentas.

### Base de datos
- Cambios de esquema solo como migración nueva en `supabase/migrations/` (idempotente, en transacción). Ver `supabase/README.md`.
- Tras cambiar el esquema, actualizar `src/lib/types/database.ts` (`npm run db:types`): los clientes de Supabase están tipados con `Database`.


---

## Principios de desarrollo
- Registro de actividad en máximo 3 taps/clicks.
- Componentes pequeños y reutilizables.
