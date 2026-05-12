import { db } from '../../db/db'
import { generateId } from '../../lib/id'
import type { Prayer } from '../../db/types'

export async function createPrayer(
  title: string,
  listIds: string[],
  description = '',
): Promise<string> {
  const id = generateId()
  const prayer: Prayer = {
    id,
    title,
    description,
    listIds,
    createdAt: Date.now(),
    lastPrayedAt: null,
    prayerTally: 0,
  }
  await db.prayers.add(prayer)

  for (const listId of listIds) {
    const list = await db.prayerLists.get(listId)
    if (list) {
      const queue = [...list.rotationState.queue, id]
      await db.prayerLists.update(listId, {
        rotationState: { ...list.rotationState, queue },
      })
    }
  }

  return id
}

export async function bulkCreatePrayers(
  titles: string[],
  listId: string,
): Promise<string[]> {
  const ids: string[] = []
  await db.transaction('rw', [db.prayers, db.prayerLists], async () => {
    const list = await db.prayerLists.get(listId)
    if (!list) throw new Error(`List ${listId} not found`)

    const newQueue = [...list.rotationState.queue]

    for (const title of titles) {
      const trimmed = title.trim()
      if (!trimmed) continue
      const id = generateId()
      ids.push(id)
      await db.prayers.add({
        id,
        title: trimmed,
        description: '',
        listIds: [listId],
        createdAt: Date.now(),
        lastPrayedAt: null,
        prayerTally: 0,
      })
      newQueue.push(id)
    }

    await db.prayerLists.update(listId, {
      rotationState: { ...list.rotationState, queue: newQueue },
    })
  })
  return ids
}

export async function getPrayer(id: string): Promise<Prayer | undefined> {
  return db.prayers.get(id)
}

export async function getPrayersByList(listId: string): Promise<Prayer[]> {
  return db.prayers.where('listIds').equals(listId).toArray()
}

export async function getAllPrayers(): Promise<Prayer[]> {
  return db.prayers.orderBy('createdAt').toArray()
}

export async function updatePrayer(
  id: string,
  changes: Partial<Omit<Prayer, 'id' | 'createdAt'>>,
): Promise<void> {
  await db.prayers.update(id, changes)
}

export async function deletePrayer(id: string): Promise<void> {
  await db.transaction('rw', [db.prayers, db.prayerLists, db.prayerLogs], async () => {
    const prayer = await db.prayers.get(id)
    if (!prayer) return

    for (const listId of prayer.listIds) {
      const list = await db.prayerLists.get(listId)
      if (list) {
        const queue = list.rotationState.queue.filter((pid) => pid !== id)
        const pointer = Math.min(list.rotationState.pointer, Math.max(0, queue.length - 1))
        await db.prayerLists.update(listId, {
          rotationState: { ...list.rotationState, queue, pointer },
        })
      }
    }

    await db.prayerLogs.where('prayerId').equals(id).delete()
    await db.prayers.delete(id)
  })
}

export async function recordPrayed(prayerId: string, listId: string): Promise<void> {
  const now = Date.now()
  await db.transaction('rw', [db.prayers, db.prayerLogs], async () => {
    await db.prayerLogs.add({
      id: generateId(),
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
  })
}

export async function searchPrayers(query: string): Promise<Prayer[]> {
  const lower = query.toLowerCase()
  const all = await db.prayers.toArray()
  return all.filter(
    (p) =>
      p.title.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower),
  )
}
