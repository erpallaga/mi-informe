# Mi Informe — Field Service Tracker

App de time tracking para Testigos de Jehová. Registro de predicación, proyectos teocráticos, objetivos mensuales/anuales y dashboard de progreso.

## Stack
- Next.js 14 App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL + auth email/password)
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
- DB: columnas `NUMERIC(5,2)` — **Supabase devuelve string en runtime**. Coercionar siempre con `Number()` al leer datos de Supabase.

### Progreso anual (Precursor Regular: objetivo 600h/año, 50h/mes)
- Hay un **tope de 55h/mes** cuando hay `otros_hours` — ver `monthlyAnnualContribution()`.
- **Nunca** calcular progreso como `totalHours / annualGoal` — es inexacto si hay otros proyectos.
- Usar `aggregateAnnualCapped(rawEntries)` de `calculations.ts` para horas que cuentan hacia el objetivo.

### Registros de actividad
- **Múltiples entries por día** están permitidas — siempre INSERT, nunca UPSERT. Sin UNIQUE en `(user_id, entry_date)`.
- `otros_hours` es `Record<categoryId, number>` — sumar siempre con `sumOtrosHours()`.

### Categorías
- Las creadas automáticamente (por imports) se guardan con `is_active: false`: cuentan en totales pero no aparecen en la UI.
- `Abbuono` de Ministry Assistant → `otros_hours`, nunca `predicacion_hours`.

---

## Patrones de código establecidos

### Fechas ISO: nunca usar toISOString()
`toISOString()` convierte medianoche local a UTC, desplazando 1 día en España (UTC+1/+2). Construir strings directamente:
```ts
from: `${y}-${pad(m + 1)}-01`
to:   `${y}-${pad(m + 1)}-${pad(lastDay)}`
```

### Caché de módulo para hooks de datos estáticos
`use-categories` y `use-profile` usan caché a nivel de módulo + Set de setters para evitar fetches duplicados. Aplicar el mismo patrón a cualquier hook con datos raramente cambiantes.

### Refrescos silenciosos
En hooks con datos volátiles, no poner `loading = true` en refrescos (solo en la primera carga) para evitar desmontar componentes con estado interno.

---

## Principios de desarrollo
- Registro de actividad en máximo 3 taps/clicks.
- Componentes pequeños y reutilizables.
