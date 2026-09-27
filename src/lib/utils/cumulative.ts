import { monthlyAnnualContribution } from "./calculations";

interface MonthTotals {
  isCurrentMonth: boolean;
  predicacionHours: number;
  otrosHours: number;
}

export interface CumulativePoint {
  predicacion: number | null;
  otros: number | null;
  /** Hours that count toward the annual goal (55h/month cap with otros). */
  contado: number | null;
  ideal: number | undefined;
}

/**
 * Cumulative series for the service-year chart. Months after the current one
 * are null (areas stop at today instead of running flat). `withCap` adds the
 * capped series: only meaningful for Precursor Regular, where the 55h/month
 * cap applies — the stacked areas show all hours, `contado` what counts.
 */
export function buildCumulativeSeries(
  months: MonthTotals[],
  annualGoal: number,
  withCap: boolean
): { points: CumulativePoint[]; yMax: number } {
  // -1 means past year (no current month) → show all months
  const currentIndex = months.findIndex((m) => m.isCurrentMonth);

  let cumPred = 0;
  let cumOtros = 0;
  let cumContado = 0;
  const points = months.map((m, i) => {
    const isFuture = currentIndex >= 0 && i > currentIndex;
    if (!isFuture) {
      cumPred += m.predicacionHours;
      cumOtros += m.otrosHours;
      cumContado += monthlyAnnualContribution(m.predicacionHours, m.otrosHours);
    }
    return {
      predicacion: isFuture ? null : cumPred,
      otros: isFuture ? null : cumOtros,
      contado: withCap && !isFuture ? cumContado : null,
      ideal: annualGoal > 0 ? ((i + 1) * annualGoal) / 12 : undefined,
    };
  });

  const maxCumulative = cumPred + cumOtros;
  const yMax = annualGoal > 0 ? Math.max(annualGoal, maxCumulative) * 1.05 : maxCumulative * 1.1;
  return { points, yMax };
}
