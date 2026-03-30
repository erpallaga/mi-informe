import { format } from "date-fns";
import { es } from "date-fns/locale";

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
