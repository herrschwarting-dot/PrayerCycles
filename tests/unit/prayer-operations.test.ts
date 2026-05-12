import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '../../src/db/db'
import { createList } from '../../src/features/cycles/list-operations'
import {
  createPrayer,
  bulkCreatePrayers,
  getPrayer,
  getPrayersByList,
  deletePrayer,
  recordPrayed,
} from '../../src/features/prayers/prayer-operations'

beforeEach(async () => {
  await db.prayerLists.clear()
  await db.prayers.clear()
  await db.prayerLogs.clear()
})

describe('prayer operations', () => {
  it('creates a prayer and adds it to the list rotation queue', async () => {
    const listId = await createList('Family', {
      cadence: 'daily',
      persistence: 'sustained',
      lifecycle: 'indefinite',
    })
    const prayerId = await createPrayer('Cousin Mike', [listId], 'Pray for his job search')
    const prayer = await getPrayer(prayerId)

    expect(prayer).toBeDefined()
    expect(prayer!.title).toBe('Cousin Mike')
    expect(prayer!.description).toBe('Pray for his job search')
    expect(prayer!.listIds).toEqual([listId])
    expect(prayer!.prayerTally).toBe(0)

    const list = await db.prayerLists.get(listId)
    expect(list!.rotationState.queue).toContain(prayerId)
  })

  it('bulk creates prayers with no description', async () => {
    const listId = await createList('Students', {
      cadence: 'weekly',
      persistence: 'one-session',
      lifecycle: 'indefinite',
    })
    const ids = await bulkCreatePrayers(['Alice', 'Bob', '  Charlie  ', '', 'Diana'], listId)

    expect(ids).toHaveLength(4)
    const prayers = await getPrayersByList(listId)
    expect(prayers).toHaveLength(4)
    expect(prayers.every((p) => p.description === '')).toBe(true)
    expect(prayers.find((p) => p.title === 'Charlie')).toBeDefined()
  })

  it('records prayed and increments tally', async () => {
    const listId = await createList('Church', {
      cadence: 'daily',
      persistence: 'sustained',
      lifecycle: 'indefinite',
    })
    const prayerId = await createPrayer('Pastor Dave', [listId])

    await recordPrayed(prayerId, listId)
    await recordPrayed(prayerId, listId)

    const prayer = await getPrayer(prayerId)
    expect(prayer!.prayerTally).toBe(2)
    expect(prayer!.lastPrayedAt).not.toBeNull()

    const logs = await db.prayerLogs.where('prayerId').equals(prayerId).toArray()
    expect(logs).toHaveLength(2)
  })

  it('deletes a prayer and cleans up rotation queue and logs', async () => {
    const listId = await createList('Missions', {
      cadence: 'monthly',
      persistence: 'sustained',
      lifecycle: 'finite',
    })
    const prayerId = await createPrayer('Missionary Kim', [listId])
    await recordPrayed(prayerId, listId)

    await deletePrayer(prayerId)

    expect(await getPrayer(prayerId)).toBeUndefined()
    const list = await db.prayerLists.get(listId)
    expect(list!.rotationState.queue).not.toContain(prayerId)
    const logs = await db.prayerLogs.where('prayerId').equals(prayerId).toArray()
    expect(logs).toHaveLength(0)
  })
})
