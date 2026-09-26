// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { ActivityEntry, Category, DailyPlan } from '@/lib/types'

// ─── Mocks ───────────────────────────────────────────────────────────────────

const db = {
  entries: [] as ActivityEntry[],
  categories: [] as Category[],
  plans: {} as Record<string, DailyPlan>,
}

vi.mock('@/lib/query/fetchers', () => ({
  fetchEntriesBetween: vi.fn(async (from: string, to: string) =>
    db.entries.filter((e) => e.entry_date >= from && e.entry_date <= to)
  ),
  fetchCategories: vi.fn(async () => db.categories),
  fetchProfile: vi.fn(async () => null),
  fetchPlansBetween: vi.fn(async () => ({ ...db.plans })),
}))

// Minimal chainable Supabase client: insert() adds to the fake DB.
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
    from: () => ({
      insert: async (row: Partial<ActivityEntry>) => {
        db.entries.push(makeEntry(row.entry_date!, row.predicacion_hours ?? 0, row.otros_hours ?? {}))
        return { error: null }
      },
      upsert: (row: Partial<DailyPlan>) => ({
        select: () => ({
          single: async () => ({ data: { id: 'p', ...row }, error: null }),
        }),
      }),
    }),
  }),
}))

import { fetchEntriesBetween } from '@/lib/query/fetchers'
import { useProgress } from '../use-progress'
import { useHistory } from '../use-history'
import { useActivity } from '../use-activity'
import { useCategories, useUpdateCategoriesCache } from '../use-categories'
import { usePlans } from '../use-plans'

function makeEntry(date: string, pred: number, otros: Record<string, number> = {}): ActivityEntry {
  return {
    id: `${date}-${Math.random()}`,
    user_id: 'u1',
    entry_date: date,
    predicacion_hours: pred,
    cursos_biblicos: 0,
    otros_hours: otros,
    notes: null,
    created_at: '',
    updated_at: '',
  }
}

function makeCategory(id: string, is_active: boolean, is_system = false): Category {
  return { id, user_id: 'u1', name: id, sort_order: 0, is_active, is_system, created_at: '' }
}

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
  return Wrapper
}

beforeEach(() => {
  // Only Date is faked: TanStack Query's timers keep running normally.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 8, 26, 12, 0)) // 26 Sep 2026 → service year 2026-2027
  db.entries = []
  db.categories = []
  db.plans = {}
  vi.mocked(fetchEntriesBetween).mockClear()
})

afterEach(() => {
  vi.useRealTimers()
})

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useProgress + useHistory', () => {
  // Protects: Panel and Historial reuse one service-year request
  it('share a single service-year request', async () => {
    db.entries = [makeEntry('2026-09-10', 2)]
    const Wrapper = wrapper()
    const { result } = renderHook(() => ({ p: useProgress(), h: useHistory() }), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.p.loading).toBe(false))
    expect(result.current.h.loading).toBe(false)
    expect(fetchEntriesBetween).toHaveBeenCalledTimes(1)
    expect(fetchEntriesBetween).toHaveBeenCalledWith('2026-09-01', '2027-08-31')
    expect(result.current.h.months[0].predicacionHours).toBe(2)
  })

  // Protects: monthly card only counts the current month; annual counts the service year
  it('splits monthly and annual totals', async () => {
    db.entries = [makeEntry('2026-09-10', 2), makeEntry('2026-10-01', 3)]
    const { result } = renderHook(() => useProgress(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.monthly?.totalHours).toBe(2)
    expect(result.current.annual?.totalHours).toBe(5)
  })

  // Protects: a new entry refreshes progress without going back to the skeleton
  it('refreshes silently after inserting an entry', async () => {
    const { result } = renderHook(() => ({ p: useProgress(), a: useActivity() }), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.p.loading).toBe(false))
    expect(result.current.p.monthly?.totalHours).toBe(0)

    const loadingStates: boolean[] = []
    await act(async () => {
      await result.current.a.insertEntry({
        entry_date: '2026-09-26',
        predicacion_hours: 1.5,
        cursos_biblicos: 0,
        otros_hours: {},
      })
    })
    await waitFor(() => {
      loadingStates.push(result.current.p.loading)
      expect(result.current.p.monthly?.totalHours).toBe(1.5)
    })
    expect(loadingStates.every((l) => l === false)).toBe(true)
  })
})

describe('useCategories', () => {
  // Protects: forms only offer active, user-created categories; lookups see all
  it('separates form categories from all categories', async () => {
    db.categories = [makeCategory('a', true), makeCategory('b', false), makeCategory('sys', false, true)]
    const { result } = renderHook(() => useCategories(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.categories.map((c) => c.id)).toEqual(['a'])
    expect(result.current.allCategories).toHaveLength(3)
  })

  // Protects: a change in Ajustes reaches the entry form without a reload
  it('propagates cache updates to every consumer', async () => {
    db.categories = [makeCategory('a', true)]
    const { result } = renderHook(
      () => ({ form: useCategories(), update: useUpdateCategoriesCache() }),
      { wrapper: wrapper() }
    )
    await waitFor(() => expect(result.current.form.loading).toBe(false))
    act(() => {
      result.current.update((cats) => cats.map((c) => ({ ...c, is_active: false })))
    })
    // Observers are notified in the next tick (TanStack's notifyManager batching)
    await waitFor(() => expect(result.current.form.categories).toEqual([]))
  })
})

describe('usePlans', () => {
  // Protects: a saved plan shows up in the month map without refetching
  it('writes the upserted plan into the month cache', async () => {
    const { result } = renderHook(() => usePlans(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.upsertPlan('2026-09-27', {
        predicacion_hours: 2,
        cursos_biblicos: 0,
        otros_hours: {},
      })
    })
    expect(result.current.plans['2026-09-27']?.predicacion_hours).toBe(2)
  })
})
