# Field Service Tracker

## Descripción
App de time tracking para Testigos de Jehová. Registro de horas de 
predicación, proyectos teocráticos, objetivos mensuales/anuales y 
dashboard de progreso.

## Stack
- Next.js 14 App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (auth + PostgreSQL)
- Vercel (deploy)

## Design System
La fuente de verdad del design system vive en Google Stitch.
Antes de crear o modificar cualquier componente visual, consulta
el proyecto de Stitch via MCP para obtener los tokens y specs actuales.

### Reglas críticas (nunca olvides estas):
- 0px border-radius en absolutamente todo. Sin excepciones.
- Sin bordes 1px solid. Solo cambios de background-color para separar secciones.
- Glassmorphism en nav y modals: backdrop-filter blur(20px), opacidad 70-80%.
- Paleta: surface #f9f9fb → surface_container_low #f3f3f5 → white (#fff).
- Tipografía: Inter. Sin iconos salvo necesidad absoluta.
- Sombras: blur 40-60px al 4% opacidad. Nunca sombras oscuras.
- Transiciones: linear o ease-out únicamente. Nunca bounce.
- Mobile-first siempre.

## Figma
Referencia visual de pantallas: https://www.figma.com/design/ujRtucK01Oy5gQ4qoNlTCs/Mi-Informe?t=U7AY3cHt5NRAGRmQ-0

## MCPs activos
- Stitch: design system, tokens y generación de UI
- Figma: pantallas de referencia
- Supabase: base de datos y auth
- Vercel: deploy

## Principios de desarrollo
- El registro de actividad debe completarse en máximo 3 taps/clicks.
- Componentes pequeños y reutilizables.
- Sin overengineering.