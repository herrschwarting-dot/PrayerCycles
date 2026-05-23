import { db } from '../../db/db'
import { snapshotToLocalStorage } from './local-backup'
import type { Prayer, PrayerList, PrayerLog } from '../../db/types'

const TAG_REGISTRY_KEY = 'prayercycles_tag_registry'

type BackupDataV1 = {
  version: 1
  exportedAt: number
  prayerLists: PrayerList[]
  prayers: Prayer[]
  prayerLogs: PrayerLog[]
}

type BackupDataV2 = {
  version: 2
  exportedAt: number
  prayerLists: PrayerList[]
  prayers: Prayer[]
  prayerLogs: PrayerLog[]
  tagRegistry: string[]
}

type BackupData = BackupDataV1 | BackupDataV2

export async function exportData(): Promise<string> {
  const [prayerLists, prayers, prayerLogs] = await Promise.all([
    db.prayerLists.toArray(),
    db.prayers.toArray(),
    db.prayerLogs.toArray(),
  ])

  let tagRegistry: string[] = []
  try {
    const raw = localStorage.getItem(TAG_REGISTRY_KEY)
    tagRegistry = raw ? JSON.parse(raw) : []
  } catch {
    tagRegistry = []
  }

  const data: BackupDataV2 = {
    version: 2,
    exportedAt: Date.now(),
    prayerLists,
    prayers,
    prayerLogs,
    tagRegistry,
  }

  return JSON.stringify(data, null, 2)
}

export async function importData(json: string): Promise<void> {
  const data: BackupData = JSON.parse(json)

  // Normalize v1 backups (no tag registry)
  const tagRegistry = 'tagRegistry' in data ? data.tagRegistry : []

  await db.transaction('rw', [db.prayerLists, db.prayers, db.prayerLogs], async () => {
    // Smart merge: upsert imported data, keep local items not in backup

    // Prayer Lists — imported wins on conflict
    for (const list of data.prayerLists) {
      const existing = await db.prayerLists.get(list.id)
      if (existing) {
        await db.prayerLists.update(list.id, list)
      } else {
        await db.prayerLists.add(list)
      }
    }

    // Prayers — imported wins on conflict
    for (const prayer of data.prayers) {
      const existing = await db.prayers.get(prayer.id)
      if (existing) {
        await db.prayers.update(prayer.id, prayer)
      } else {
        await db.prayers.add(prayer)
      }
    }

    // Prayer Logs — imported wins on conflict
    for (const log of data.prayerLogs) {
      const existing = await db.prayerLogs.get(log.id)
      if (existing) {
        await db.prayerLogs.update(log.id, log)
      } else {
        await db.prayerLogs.add(log)
      }
    }
  })

  // Merge tag registry — combine local + imported, deduplicate
  let localRegistry: string[] = []
  try {
    const raw = localStorage.getItem(TAG_REGISTRY_KEY)
    localRegistry = raw ? JSON.parse(raw) : []
  } catch {
    localRegistry = []
  }
  const mergedRegistry = [...new Set([...localRegistry, ...tagRegistry])]
  localStorage.setItem(TAG_REGISTRY_KEY, JSON.stringify(mergedRegistry))

  snapshotToLocalStorage()
}
