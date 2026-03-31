import { format } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Returns the theocratic service year (Sept 1 – Aug 31) for a given date.
 * e.g. any date in Sept 2025–Aug 2026 → { startYear: 2025, label: "2025-2026", start: "2025-09-01", end: "2026-08-31" }
 */
export function getServiceYear(now?: Date): {
  startYear: number;
  label: string;
  start: string;
  end: string;
} {
  const d = now ?? new Date();
  const startYear = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  const endYear = startYear + 1;
  return {
    startYear,
    label: `${startYear}-${endYear}`,
    start: `${startYear}-09-01`,
    end: `${endYear}-08-31`,
  };
}

export function formatDateLong(date: Date): string {
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
}

export function formatMonthYear(date: Date): string {
  return format(date, "MMMM yyyy", { locale: es }).toUpperCase();
}

export function formatMonthShort(month: number): string {
  const date = new Date(2024, month, 1);
  return format(date, "MMM", { locale: es }).toUpperCase();
}

export function getMonthName(month: number): string {
  const date = new Date(2024, month, 1);
  return format(date, "MMMM", { locale: es }).toUpperCase();
}
