import { db } from '../db/db'
import type { Prayer, PrayerList } from '../db/types'

export type SurfacedPrayer = {
  prayer: Prayer
  listId: string
  listName: string
}

function getCadenceBoundary(cadence: string, now: Date): number {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  switch (cadence) {
    case 'daily':
      return start.getTime()
    case 'weekly': {
      const day = start.getDay()
      start.setDate(start.getDate() - day)
      return start.getTime()
    }
    case 'monthly': {
      start.setDate(1)
      return start.getTime()
    }
    default:
      return start.getTime()
  }
}

function advanceRotation(list: PrayerList, now: Date): PrayerList {
  const boundary = getCadenceBoundary(list.cycle.cadence, now)

  if (list.rotationState.lastCadenceBoundary >= boundary) {
    return list
  }

  const queue = list.rotationState.queue
  if (queue.length === 0) return list

  let pointer = list.rotationState.pointer

  if (list.cycle.lifecycle === 'finite' && pointer >= queue.length) {
    return { ...list, status: 'archived' }
  }

  if (pointer >= queue.length) {
    pointer = 0
  }

  return {
    ...list,
    rotationState: {
      ...list.rotationState,
      pointer,
      lastCadenceBoundary: boundary,
    },
  }
}

async function pickLeastPrayed(queue: string[]): Promise<Prayer | undefined> {
  if (queue.length === 0) return undefined

  const prayers = await Promise.all(queue.map((id) => db.prayers.get(id)))
  const valid = prayers.filter((p): p is Prayer => p !== undefined)
  if (valid.length === 0) return undefined

  // Sort by tally (lowest first), then randomize among ties
  const minTally = Math.min(...valid.map((p) => p.prayerTally))
  const leastPrayed = valid.filter((p) => p.prayerTally === minTally)

  return leastPrayed[Math.floor(Math.random() * leastPrayed.length)]
}

export async function getSurfacedPrayers(): Promise<SurfacedPrayer[]> {
  const now = new Date()
  const lists = await db.prayerLists.where('status').equals('active').toArray()
  const surfaced: SurfacedPrayer[] = []

  for (const rawList of lists) {
    const list = advanceRotation(rawList, now)

    if (list.status === 'archived') {
      await db.prayerLists.update(list.id, { status: 'archived' })
      continue
    }

    if (list.rotationState !== rawList.rotationState) {
      await db.prayerLists.update(list.id, {
        rotationState: list.rotationState,
      })
    }

    const queue = list.rotationState.queue
    if (queue.length === 0) continue

    const prayer = await pickLeastPrayed(queue)

    if (prayer) {
      surfaced.push({
        prayer,
        listId: list.id,
        listName: list.name,
      })
    }
  }

  return surfaced
}

export async function completePrayer(
  prayerId: string,
  listId: string,
): Promise<void> {
  const list = await db.prayerLists.get(listId)
  if (!list) return

  const now = Date.now()

  await db.prayerLogs.add({
    id: crypto.randomUUID(),
    prayerId,
    listId,
    prayedAt: now,
  })

  const prayer = await db.prayers.get(prayerId)
  if (prayer) {
    await db.prayers.update(prayerId, {
      lastPrayedAt: now,
      prayerTally: prayer.prayerTally + 1,
    })
  }

  if (list.cycle.persistence === 'one-session') {
    const queue = list.rotationState.queue
    let nextPointer = list.rotationState.pointer + 1
    if (list.cycle.lifecycle === 'finite' && nextPointer >= queue.length) {
      await db.prayerLists.update(listId, { status: 'archived' })
    } else {
      if (nextPointer >= queue.length) nextPointer = 0
      await db.prayerLists.update(listId, {
        rotationState: { ...list.rotationState, pointer: nextPointer },
      })
    }
  }
}
