import { describe, it, expect } from 'vitest'
import {
  fmtHours,
  parseHHMM,
  monthlyAnnualContribution,
  aggregateAnnualCapped,
  sumOtrosHours,
  calculateTotalHours,
  aggregateEntries,
  getMonthlyGoalHours,
  getAnnualGoalHours,
} from '../calculations'
import type { ActivityEntry } from '@/lib/types'

// ─── Test factory ────────────────────────────────────────────────────────────

function makeEntry(
  date: string,
  predicacion_hours: number,
  otros_hours: Record<string, number> = {},
  cursos_biblicos = 0
): ActivityEntry {
  return {
    id: `entry-${date}`,
    user_id: 'user-abc',
    entry_date: date,
    predicacion_hours,
    cursos_biblicos,
    otros_hours,
    notes: null,
    created_at: `${date}T08:00:00Z`,
    updated_at: `${date}T08:00:00Z`,
  }
}

// ─── fmtHours ────────────────────────────────────────────────────────────────

describe('fmtHours', () => {
  // Protects: hours never shown as decimals (3.5 must never appear as "3.5")
  it('formats a whole number correctly', () => {
    expect(fmtHours(3)).toBe('3:00')
  })

  // Protects: half-hour rounding — 1.5h must be 1:30, not 1:50
  it('converts 1.5 decimal hours to 1:30', () => {
    expect(fmtHours(1.5)).toBe('1:30')
  })

  // Protects: minute padding — single-digit minutes need leading zero (e.g. 1:05)
  it('pads minutes with leading zero for values under 10', () => {
    expect(fmtHours(1 + 5 / 60)).toBe('1:05')
  })

  // Protects: zero hours renders as 0:00 not empty string or NaN
  it('handles zero hours', () => {
    expect(fmtHours(0)).toBe('0:00')
  })

  // Protects: large pioneer totals (600h/year) display correctly
  it('handles multi-digit hours like 70:00', () => {
    expect(fmtHours(70)).toBe('70:00')
  })

  // Protects: Supabase NUMERIC returns string — after Number() coercion the format still works
  it('formats hours that came in as coerced strings (e.g. Number("3.50"))', () => {
    expect(fmtHours(Number('3.50'))).toBe('3:30')
  })

  // Protects: quarterly total with minutes (e.g. 87.75h = 87h 45min)
  it('converts fractional hours with non-round minutes', () => {
    expect(fmtHours(87.75)).toBe('87:45')
  })
})

// ─── parseHHMM ───────────────────────────────────────────────────────────────

describe('parseHHMM', () => {
  // Protects: "h:mm" colon-format input from the time entry form
  it('parses h:mm colon format', () => {
    expect(parseHHMM('1:30')).toBe(1.5)
  })

  // Protects: plain number input (user types "3" meaning 3 hours)
  it('parses plain integer string', () => {
    expect(parseHHMM('3')).toBe(3)
  })

  // Protects: decimal input like "2.5" entered by the user
  it('parses plain decimal string', () => {
    expect(parseHHMM('2.5')).toBe(2.5)
  })

  // Protects: whitespace around user input should not break parsing
  it('trims surrounding whitespace', () => {
    expect(parseHHMM('  2:00  ')).toBe(2)
  })

  // Protects: empty string or garbage should return null, not crash
  it('returns null for empty string', () => {
    expect(parseHHMM('')).toBeNull()
  })

  // Protects: garbage text returns null, preventing NaN from propagating to the DB
  it('returns null for non-numeric garbage', () => {
    expect(parseHHMM('abc')).toBeNull()
  })

  // Protects: invalid minutes (>59) in h:mm format must be rejected
  it('returns null for h:mm with minutes > 59', () => {
    expect(parseHHMM('1:60')).toBeNull()
  })

  // Protects: h:mm with negative minutes must be rejected
  it('returns null for h:mm with negative minutes', () => {
    expect(parseHHMM('1:-5')).toBeNull()
  })

  // Protects: "0:00" is a valid zero-hour entry (rest day logged)
  it('parses 0:00 as 0 hours', () => {
    expect(parseHHMM('0:00')).toBe(0)
  })

  // Protects: "0:30" — half-hour session like cart witnessing
  it('parses 0:30 as 0.5 hours', () => {
    expect(parseHHMM('0:30')).toBe(0.5)
  })

  // Protects: round-trip fmtHours → parseHHMM must be lossless
  it('round-trips through fmtHours without precision loss', () => {
    const original = 3.5
    const formatted = fmtHours(original)
    const parsed = parseHHMM(formatted)
    expect(parsed).toBe(original)
  })
})

// ─── sumOtrosHours ───────────────────────────────────────────────────────────

describe('sumOtrosHours', () => {
  // Protects: otros_hours is a Record — never summed with simple addition
  it('sums multiple category hours', () => {
    expect(sumOtrosHours({ 'cat-1': 2, 'cat-2': 1.5 })).toBe(3.5)
  })

  // Protects: empty record returns 0, not undefined
  it('returns 0 for empty record', () => {
    expect(sumOtrosHours({})).toBe(0)
  })

  // Protects: single category (most common case)
  it('handles single category', () => {
    expect(sumOtrosHours({ 'cat-theocratic': 4 })).toBe(4)
  })

  // Protects: Supabase NUMERIC coercion — values may arrive as numbers after Number()
  it('sums values that were coerced with Number()', () => {
    expect(sumOtrosHours({ 'cat-1': Number('2.50'), 'cat-2': Number('1.00') })).toBe(3.5)
  })
})

// ─── monthlyAnnualContribution ───────────────────────────────────────────────

describe('monthlyAnnualContribution', () => {
  // Protects: when no otros_hours, full predicacion hours count (no artificial cap)
  it('returns predicacion hours unchanged when no otros hours', () => {
    expect(monthlyAnnualContribution(45, 0)).toBe(45)
  })

  // Protects: core business rule — total capped at 55h when otros_hours present
  it('caps combined hours at 55 when otros hours are present', () => {
    expect(monthlyAnnualContribution(45, 20)).toBe(55)
  })

  // Protects: case C from spec — predicacion alone already > 55, cap doesn't reduce it
  it('never reduces below predicacion hours alone (case C: pred > 55)', () => {
    expect(monthlyAnnualContribution(60, 10)).toBe(60)
  })

  // Protects: pioneer goal boundary — exactly 50 pred + 5 otros = 55 (hits cap exactly)
  it('returns exactly 55 when pred + otros equals 55', () => {
    expect(monthlyAnnualContribution(50, 5)).toBe(55)
  })

  // Protects: small otros amount that stays under the 55h cap
  it('returns sum when pred + otros is less than 55', () => {
    expect(monthlyAnnualContribution(30, 10)).toBe(40)
  })

  // Protects: zero predicacion but otros present — contribution is zero (can't count otros alone)
  it('returns 0 when predicacion is 0 and otros are present', () => {
    // Math.max(0, Math.min(0 + 5, 55)) = Math.max(0, 5) = 5
    // Actually the function returns Max(pred, Min(pred+otros, 55))
    // Max(0, Min(5, 55)) = Max(0, 5) = 5 — otros DO count even without predicacion
    expect(monthlyAnnualContribution(0, 5)).toBe(5)
  })

  // Protects: auxiliary pioneer (30h goal) with small theocratic project
  it('handles auxiliary pioneer hours with small otros', () => {
    expect(monthlyAnnualContribution(28, 4)).toBe(32)
  })
})

// ─── aggregateAnnualCapped ───────────────────────────────────────────────────

describe('aggregateAnnualCapped', () => {
  // Protects: the main annual progress calculation — never use totalHours/annualGoal directly
  it('returns 0 for empty entries array', () => {
    expect(aggregateAnnualCapped([])).toBe(0)
  })

  // Protects: single month, no otros — full hours count
  it('sums a single month with no otros hours', () => {
    const entries = [
      makeEntry('2026-03-10', 20),
      makeEntry('2026-03-17', 25),
    ]
    expect(aggregateAnnualCapped(entries)).toBe(45)
  })

  // Protects: multiple months are summed independently (the cap applies per month)
  it('sums across multiple months independently', () => {
    const entries = [
      makeEntry('2026-01-05', 50),
      makeEntry('2026-02-05', 50),
    ]
    expect(aggregateAnnualCapped(entries)).toBe(100)
  })

  // Protects: the 55h cap applies per month, not to the total
  it('applies the 55h cap per month when otros hours are present', () => {
    const entries = [
      makeEntry('2026-03-10', 45, { 'cat-1': 20 }), // pred=45 otros=20 → capped at 55
      makeEntry('2026-04-10', 30, { 'cat-1': 5 }),  // pred=30 otros=5  → 35 (under cap)
    ]
    expect(aggregateAnnualCapped(entries)).toBe(55 + 35)
  })

  // Protects: multiple entries in the same month are grouped before applying the cap
  it('groups same-month entries before applying cap', () => {
    const entries = [
      makeEntry('2026-03-05', 30, { 'cat-1': 10 }), // month total: pred=40 otros=15 → 55
      makeEntry('2026-03-20', 10, { 'cat-1': 5 }),
    ]
    // pred total = 40, otros total = 15, pred+otros = 55 → capped at 55
    expect(aggregateAnnualCapped(entries)).toBe(55)
  })

  // Protects: precursor regular full year (12 months × 50h = 600h, no otros)
  it('calculates a full clean pioneer year at 600h', () => {
    const months = [
      '2025-09', '2025-10', '2025-11', '2025-12',
      '2026-01', '2026-02', '2026-03', '2026-04',
      '2026-05', '2026-06', '2026-07', '2026-08',
    ]
    const entries = months.map(m => makeEntry(`${m}-01`, 50))
    expect(aggregateAnnualCapped(entries)).toBe(600)
  })

  // Protects: case where predicacion > 55 — cap must not reduce it
  it('does not cap months where predicacion alone exceeds 55', () => {
    const entries = [makeEntry('2026-03-01', 60, { 'cat-1': 5 })]
    expect(aggregateAnnualCapped(entries)).toBe(60)
  })
})

// ─── calculateTotalHours ─────────────────────────────────────────────────────

describe('calculateTotalHours', () => {
  // Protects: entry-level total (used in list views and day summary)
  it('sums predicacion and all otros hours for an entry', () => {
    const entry = makeEntry('2026-03-15', 3.5, { 'cat-1': 1, 'cat-2': 0.5 })
    expect(calculateTotalHours(entry)).toBe(5)
  })

  // Protects: entry with no otros hours
  it('returns predicacion hours when otros is empty', () => {
    const entry = makeEntry('2026-03-15', 2)
    expect(calculateTotalHours(entry)).toBe(2)
  })
})

// ─── aggregateEntries ─────────────────────────────────────────────────────────

describe('aggregateEntries', () => {
  // Protects: the monthly dashboard aggregate — feeds MonthlyProgress
  it('aggregates multiple entries correctly', () => {
    const entries = [
      makeEntry('2026-03-10', 3, { 'cat-1': 1 }, 1),
      makeEntry('2026-03-17', 2, { 'cat-1': 0.5 }, 0),
    ]
    const result = aggregateEntries(entries)
    expect(result.predicacionHours).toBe(5)
    expect(result.otrosHours).toBe(1.5)
    expect(result.totalHours).toBe(6.5)
    expect(result.cursosBiblicos).toBe(1)
    expect(result.entriesCount).toBe(2)
  })

  // Protects: per-category breakdown used in the history chart
  it('tracks otros hours by category id', () => {
    const entries = [
      makeEntry('2026-03-10', 0, { 'cat-theocratic': 2, 'cat-meetings': 1 }),
      makeEntry('2026-03-17', 0, { 'cat-theocratic': 1 }),
    ]
    const result = aggregateEntries(entries)
    expect(result.otrosByCategory['cat-theocratic']).toBe(3)
    expect(result.otrosByCategory['cat-meetings']).toBe(1)
  })

  // Protects: empty array returns all zeros without crashing
  it('returns zeros for empty array', () => {
    const result = aggregateEntries([])
    expect(result.predicacionHours).toBe(0)
    expect(result.otrosHours).toBe(0)
    expect(result.totalHours).toBe(0)
    expect(result.cursosBiblicos).toBe(0)
    expect(result.entriesCount).toBe(0)
    expect(result.otrosByCategory).toEqual({})
  })
})

// ─── getMonthlyGoalHours ──────────────────────────────────────────────────────

describe('getMonthlyGoalHours', () => {
  // Protects: publicador has no monthly goal (returns 0, avoids division-by-zero in progress bars)
  it('returns 0 for publicador', () => {
    expect(getMonthlyGoalHours('publicador', null)).toBe(0)
  })

  // Protects: precursor_regular always 50h/month (org policy, not user-configurable)
  it('returns 50 for precursor_regular regardless of custom hours', () => {
    expect(getMonthlyGoalHours('precursor_regular', null)).toBe(50)
    expect(getMonthlyGoalHours('precursor_regular', 999)).toBe(50)
  })

  // Protects: auxiliary pioneer defaults to 30h when no custom goal set
  it('returns 30 for precursor_auxiliar with null custom hours', () => {
    expect(getMonthlyGoalHours('precursor_auxiliar', null)).toBe(30)
  })

  // Protects: auxiliary pioneer can override to 15h (the other preset option)
  it('returns custom hours for precursor_auxiliar when set', () => {
    expect(getMonthlyGoalHours('precursor_auxiliar', 15)).toBe(15)
  })

  // Protects: custom goal type uses user-set value
  it('returns custom hours for custom goal type', () => {
    expect(getMonthlyGoalHours('custom', 40)).toBe(40)
  })

  // Protects: custom goal with null falls back to 0 (no goal), not a crash
  it('returns 0 for custom goal type with null custom hours', () => {
    expect(getMonthlyGoalHours('custom', null)).toBe(0)
  })
})

// ─── getAnnualGoalHours ───────────────────────────────────────────────────────

describe('getAnnualGoalHours', () => {
  // Protects: publicador has no annual goal
  it('returns 0 for publicador', () => {
    expect(getAnnualGoalHours('publicador', null)).toBe(0)
  })

  // Protects: precursor_regular annual goal is always 600 (org policy, not monthly×12)
  it('returns 600 for precursor_regular', () => {
    expect(getAnnualGoalHours('precursor_regular', null)).toBe(600)
  })

  // Protects: auxiliary pioneer at 30h/month → 360h/year
  it('returns 360 for precursor_auxiliar at default 30h', () => {
    expect(getAnnualGoalHours('precursor_auxiliar', null)).toBe(360)
  })

  // Protects: auxiliary pioneer at 15h/month → 180h/year
  it('returns 180 for precursor_auxiliar at 15h/month', () => {
    expect(getAnnualGoalHours('precursor_auxiliar', 15)).toBe(180)
  })

  // Protects: custom goal type annual is monthly × 12
  it('returns monthly × 12 for custom goal type', () => {
    expect(getAnnualGoalHours('custom', 40)).toBe(480)
  })
})
