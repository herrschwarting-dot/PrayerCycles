import { db } from '../../db/db'
import { generateId } from '../../lib/id'
import type { Cycle, ListStatus, PrayerList } from '../../db/types'

const LIST_COLORS = [
  '#fef3c7', '#fce7f3', '#dbeafe', '#d1fae5',
  '#ede9fe', '#ffedd5', '#e0e7ff', '#fecdd3',
]

export async function createList(
  name: string,
  cycle: Cycle,
  color?: string,
): Promise<string> {
  const id = generateId()
  const list: PrayerList = {
    id,
    name,
    color: color ?? LIST_COLORS[Math.floor(Math.random() * LIST_COLORS.length)],
    cycle,
    status: 'active',
    rotationState: { queue: [], pointer: 0, lastCadenceBoundary: Date.now() },
    createdAt: Date.now(),
  }
  await db.prayerLists.add(list)
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
}

export async function archiveList(id: string): Promise<void> {
  await db.prayerLists.update(id, { status: 'archived' })
}

export async function reactivateList(id: string): Promise<void> {
  await db.prayerLists.update(id, { status: 'active' })
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
}
