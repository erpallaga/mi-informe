import { describe, it, expect } from 'vitest'
import { getServiceYear, formatMonthShort, getMonthName } from '../dates'

// ─── getServiceYear ───────────────────────────────────────────────────────────

describe('getServiceYear', () => {
  // Protects: the service year starts in September, not January — wrong year would
  // put months 1-8 into the wrong annual bucket and corrupt annual progress totals.

  it('returns correct service year for a date in October (mid-year)', () => {
    const result = getServiceYear(new Date(2025, 9, 15)) // Oct 2025
    expect(result.startYear).toBe(2025)
    expect(result.label).toBe('2025-2026')
    expect(result.start).toBe('2025-09-01')
    expect(result.end).toBe('2026-08-31')
  })

  it('returns correct service year for a date in January (same year as start)', () => {
    const result = getServiceYear(new Date(2026, 0, 15)) // Jan 2026
    // Jan 2026 belongs to the 2025-2026 service year (Sept 2025 → Aug 2026)
    expect(result.startYear).toBe(2025)
    expect(result.label).toBe('2025-2026')
    expect(result.start).toBe('2025-09-01')
    expect(result.end).toBe('2026-08-31')
  })

  it('returns correct service year for a date in August (last month of year)', () => {
    const result = getServiceYear(new Date(2026, 7, 31)) // Aug 31 2026
    expect(result.startYear).toBe(2025)
    expect(result.label).toBe('2025-2026')
    expect(result.start).toBe('2025-09-01')
    expect(result.end).toBe('2026-08-31')
  })

  // Protects: September 1 is the exact boundary — must open a NEW service year
  it('starts a new service year on September 1', () => {
    const result = getServiceYear(new Date(2026, 8, 1)) // Sept 1 2026
    expect(result.startYear).toBe(2026)
    expect(result.label).toBe('2026-2027')
    expect(result.start).toBe('2026-09-01')
    expect(result.end).toBe('2027-08-31')
  })

  // Protects: August 31 is still the old year — off-by-one here corrupts progress
  it('August 31 belongs to the PREVIOUS service year, not the upcoming one', () => {
    const aug31 = getServiceYear(new Date(2026, 7, 31)) // Aug 31 2026
    const sep1  = getServiceYear(new Date(2026, 8, 1))  // Sep 1  2026
    expect(aug31.startYear).toBe(2025)
    expect(sep1.startYear).toBe(2026)
  })

  // Protects: the date strings are built without toISOString() — must not have timezone drift
  it('builds date strings without time component (no UTC conversion artifacts)', () => {
    const result = getServiceYear(new Date(2026, 3, 6)) // Apr 6 2026
    // If toISOString() were used in UTC+1 at midnight, this could produce the previous date
    expect(result.start).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(result.end).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(result.start).toBe('2025-09-01')
    expect(result.end).toBe('2026-08-31')
  })

  // Protects: called without argument uses current date without crashing
  it('works without arguments (uses today)', () => {
    const result = getServiceYear()
    expect(result.startYear).toBeTypeOf('number')
    expect(result.label).toMatch(/^\d{4}-\d{4}$/)
    expect(result.start).toMatch(/^\d{4}-09-01$/)
    expect(result.end).toMatch(/^\d{4}-08-31$/)
  })
})

// ─── formatMonthShort ─────────────────────────────────────────────────────────

describe('formatMonthShort', () => {
  // Protects: chart axis labels — month indexes must map to correct Spanish abbreviations

  it('returns ENE for January (month 0)', () => {
    expect(formatMonthShort(0)).toBe('ENE')
  })

  it('returns SEP for September (month 8, start of service year)', () => {
    expect(formatMonthShort(8)).toBe('SEP')
  })

  it('returns AGO for August (month 7, end of service year)', () => {
    expect(formatMonthShort(7)).toBe('AGO')
  })

  // Protects: output is uppercase (as used in chart labels)
  it('returns uppercase strings', () => {
    const result = formatMonthShort(5) // June
    expect(result).toBe(result.toUpperCase())
  })
})

// ─── getMonthName ─────────────────────────────────────────────────────────────

describe('getMonthName', () => {
  // Protects: month names used in headers and selectors must be correct Spanish

  it('returns full Spanish name for January (month 0)', () => {
    expect(getMonthName(0)).toBe('ENERO')
  })

  it('returns full Spanish name for September (month 8)', () => {
    expect(getMonthName(8)).toBe('SEPTIEMBRE')
  })

  it('returns uppercase result', () => {
    const result = getMonthName(3) // April
    expect(result).toBe(result.toUpperCase())
  })
})
