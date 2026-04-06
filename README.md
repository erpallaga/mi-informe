# Mi Informe

App de seguimiento de actividad de predicación para Testigos de Jehová. Registra horas, cursos bíblicos y progreso hacia objetivos mensuales y anuales.

## Stack

- **Next.js 14** App Router + TypeScript
- **Tailwind CSS** (design system propio, 0px border-radius, glassmorphism)
- **Supabase** — auth (Magic Link) + PostgreSQL
- **Vercel** — deploy

## Funcionalidades

- Panel de progreso con objetivo mensual y anual (año de servicio sept–ago)
- Registro de actividad: predicación, cursos bíblicos, categorías personalizadas
- Historial mensual con detalle por día
- Calendario visual mensual
- Sección de eventos y planificador
- Importación de backups desde Ministry Assistant (`.mhbackup`)
- Ajustes: objetivo de horas, gestión de categorías, importar datos

## Desarrollo local

```bash
npm install
npm run dev
```

Requiere variables de entorno en `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Tests

```bash
npm test          # modo watch
npm run test:run  # una sola pasada
npm run test:coverage
```

Cubren la lógica de negocio crítica en `src/lib/utils/`:

- **`calculations`** — `fmtHours`, `parseHHMM`, `sumOtrosHours`, `monthlyAnnualContribution`, `aggregateAnnualCapped` y helpers de objetivo
- **`dates`** — `getServiceYear` (año de servicio sept–ago), `formatMonthShort`, `getMonthName`

## Build

```bash
npm run build
```

El build es estricto: falla con variables no usadas o errores de tipos TypeScript.
