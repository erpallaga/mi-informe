/**
 * Query keys. Every activity_entries query lives under ["entries", …] so a
 * single `invalidateQueries({ queryKey: queryKeys.entries.all })` after any
 * write refreshes Panel, Historial, Eventos and Planificador at once.
 */
export const queryKeys = {
  profile: ["profile"] as const,
  categories: ["categories"] as const,
  entries: {
    all: ["entries"] as const,
    serviceYear: (startYear: number) => ["entries", "service-year", startYear] as const,
    month: (from: string) => ["entries", "month", from] as const,
  },
  plans: {
    all: ["plans"] as const,
    month: (from: string) => ["plans", "month", from] as const,
  },
};
