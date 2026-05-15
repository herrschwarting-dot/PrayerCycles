import { db } from '../../db/db'
import { generateId } from '../../lib/id'
import { snapshotToLocalStorage } from '../backup/local-backup'
import type { Cycle, ListStatus, PrayerList } from '../../db/types'

export async function createList(
  name: string,
  cycle: Cycle,
  description = '',
  initialPrayerTitles: string[] = [],
): Promise<string> {
  const id = generateId()

  const queue: string[] = []
  const now = Date.now()
  const prayersToAdd = initialPrayerTitles
    .map((t) => t.trim())
    .filter(Boolean)
    .map((title, i) => {
      const prayerId = generateId()
      queue.push(prayerId)
      return {
        id: prayerId,
        title,
        description: '',
        listIds: [id],
        createdAt: now + i,
        lastPrayedAt: null,
        prayerTally: 0,
      }
    })

  const list: PrayerList = {
    id,
    name,
    description,
    cycle,
    status: 'active',
    rotationState: { queue, pointer: 0, lastCadenceBoundary: Date.now(), tallyOffsets: {} },
    completionTally: 0,
    createdAt: Date.now(),
  }

  await db.transaction('rw', [db.prayerLists, db.prayers], async () => {
    await db.prayerLists.add(list)
    if (prayersToAdd.length > 0) {
      await db.prayers.bulkAdd(prayersToAdd)
    }
  })

  snapshotToLocalStorage()
  return id
}

export async function getList(id: string): Promise<PrayerList | undefined> {
  return db.prayerLists.get(id)
}

export async function getAllLists(): Promise<PrayerList[]> {
  return db.prayerLists.orderBy('createdAt').toArray()
}

export async function getListsByStatus(status: ListStatus): Promise<PrayerList[]> {
  return db.prayerLists.where('status').equals(status).sortBy('createdAt')
}

export async function updateList(
  id: string,
  changes: Partial<Omit<PrayerList, 'id' | 'createdAt'>>,
): Promise<void> {
  await db.prayerLists.update(id, changes)
  snapshotToLocalStorage()
}

export async function archiveList(id: string): Promise<void> {
  await db.prayerLists.update(id, { status: 'archived' })
  snapshotToLocalStorage()
}

export async function reactivateList(id: string): Promise<void> {
  await db.prayerLists.update(id, { status: 'active' })
  snapshotToLocalStorage()
}

export async function deleteList(id: string): Promise<void> {
  await db.transaction('rw', [db.prayerLists, db.prayers, db.prayerLogs], async () => {
    const prayers = await db.prayers.where('listIds').equals(id).toArray()
    for (const prayer of prayers) {
      const remaining = prayer.listIds.filter((lid) => lid !== id)
      if (remaining.length === 0) {
        await db.prayers.delete(prayer.id)
      } else {
        await db.prayers.update(prayer.id, { listIds: remaining })
      }
    }
    await db.prayerLogs.where('listId').equals(id).delete()
    await db.prayerLists.delete(id)
  })
  snapshotToLocalStorage()
}
