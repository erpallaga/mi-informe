import { describe, it, expect } from 'vitest'
import { normalizeEntry, normalizeOtros, normalizePlan, normalizeProfile } from '../normalize'
import { aggregateEntries } from '../calculations'

describe('normalizeEntry', () => {
  // Protects: NUMERIC columns arriving as strings would string-concatenate in sums
  it('coerces string numerics to numbers', () => {
    const e = normalizeEntry({
      id: 'a',
      entry_date: '2026-09-01',
      predicacion_hours: '2.50',
      cursos_biblicos: '1',
      otros_hours: { cat: '1.25' },
    })
    expect(e.predicacion_hours).toBe(2.5)
    expect(e.cursos_biblicos).toBe(1)
    expect(e.otros_hours).toEqual({ cat: 1.25 })
  })

  it('makes aggregation arithmetic, not concatenation', () => {
    const rows = [
      { entry_date: '2026-09-01', predicacion_hours: '2.50', cursos_biblicos: 0, otros_hours: {} },
      { entry_date: '2026-09-02', predicacion_hours: '1.00', cursos_biblicos: 0, otros_hours: {} },
    ].map(normalizeEntry)
    expect(aggregateEntries(rows).predicacionHours).toBe(3.5)
  })

  it('treats null/garbage as 0 and non-object otros as empty', () => {
    const e = normalizeEntry({ entry_date: '2026-09-01', predicacion_hours: null, otros_hours: null })
    expect(e.predicacion_hours).toBe(0)
    expect(e.cursos_biblicos).toBe(0)
    expect(e.otros_hours).toEqual({})
  })
})

describe('normalizeOtros', () => {
  it('coerces each value', () => {
    expect(normalizeOtros({ a: '0.5', b: 2, c: 'x' })).toEqual({ a: 0.5, b: 2, c: 0 })
  })
})

describe('normalizePlan', () => {
  it('coerces plan hours', () => {
    const p = normalizePlan({ plan_date: '2026-09-01', predicacion_hours: '3.00', cursos_biblicos: 0, otros_hours: { total: 1 } })
    expect(p.predicacion_hours).toBe(3)
    expect(p.otros_hours).toEqual({ total: 1 })
  })
})

describe('normalizeProfile', () => {
  // Protects: GoalSelector compared custom_goal_hours === 15 against "15.0"
  it('coerces custom_goal_hours and keeps null', () => {
    expect(normalizeProfile({ id: 'u', custom_goal_hours: '15.0' }).custom_goal_hours).toBe(15)
    expect(normalizeProfile({ id: 'u', custom_goal_hours: null }).custom_goal_hours).toBeNull()
  })
})
