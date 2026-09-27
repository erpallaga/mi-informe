import { describe, it, expect } from 'vitest'
import { buildCumulativeSeries } from '../cumulative'

const m = (pred: number, otros: number, isCurrentMonth = false) => ({ predicacionHours: pred, otrosHours: otros, isCurrentMonth })

describe('buildCumulativeSeries', () => {
  // Protects: the stacked areas show ALL hours, the capped line what counts (55h/month cap)
  it('caps the "contado" series per month while areas keep the full total', () => {
    const { points } = buildCumulativeSeries([m(40, 30), m(50, 0)], 600, true)
    expect(points[0].predicacion! + points[0].otros!).toBe(70)
    expect(points[0].contado).toBe(55)
    expect(points[1].contado).toBe(105)
    expect(points[1].predicacion! + points[1].otros!).toBe(120)
  })

  // Protects: months after the current one are cut, not drawn flat
  it('returns null after the current month', () => {
    const { points } = buildCumulativeSeries([m(10, 0), m(10, 0, true), m(0, 0)], 600, true)
    expect(points[1].contado).toBe(20)
    expect(points[2]).toMatchObject({ predicacion: null, otros: null, contado: null })
    expect(points[2].ideal).toBe(150)
  })

  // Protects: the cap is a Precursor Regular rule — no capped line for other goals
  it('omits the capped series when withCap is false', () => {
    const { points } = buildCumulativeSeries([m(40, 30)], 360, false)
    expect(points[0].contado).toBeNull()
  })

  it('scales yMax to the goal or the data, whichever is larger', () => {
    expect(buildCumulativeSeries([m(10, 0)], 600, true).yMax).toBeCloseTo(630)
    expect(buildCumulativeSeries([m(700, 0)], 600, true).yMax).toBeCloseTo(735)
    expect(buildCumulativeSeries([m(10, 0)], 0, false).yMax).toBeCloseTo(11)
  })
})
