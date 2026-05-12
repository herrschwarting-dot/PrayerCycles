import { db } from '../../db/db'
import type { Prayer, PrayerList, PrayerLog } from '../../db/types'

type BackupData = {
  version: 1
  exportedAt: number
  prayerLists: PrayerList[]
  prayers: Prayer[]
  prayerLogs: PrayerLog[]
}

export async function exportData(): Promise<string> {
  const [prayerLists, prayers, prayerLogs] = await Promise.all([
    db.prayerLists.toArray(),
    db.prayers.toArray(),
    db.prayerLogs.toArray(),
  ])

  const data: BackupData = {
    version: 1,
    exportedAt: Date.now(),
    prayerLists,
    prayers,
    prayerLogs,
  }

  return JSON.stringify(data, null, 2)
}

export async function importData(json: string): Promise<void> {
  const data: BackupData = JSON.parse(json)

  await db.transaction('rw', [db.prayerLists, db.prayers, db.prayerLogs], async () => {
    await db.prayerLists.clear()
    await db.prayers.clear()
    await db.prayerLogs.clear()

    await db.prayerLists.bulkAdd(data.prayerLists)
    await db.prayers.bulkAdd(data.prayers)
    await db.prayerLogs.bulkAdd(data.prayerLogs)
  })
}
