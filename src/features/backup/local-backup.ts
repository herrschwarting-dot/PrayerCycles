import { db } from '../../db/db'

const STORAGE_KEY = 'prayercycles_backup'

let debounceTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Debounced snapshot of all Dexie tables to localStorage.
 * Called after every write operation as a safety net against
 * iOS Safari clearing IndexedDB on storage pressure.
 */
export function snapshotToLocalStorage(): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    try {
      const [prayerLists, prayers, prayerLogs] = await Promise.all([
        db.prayerLists.toArray(),
        db.prayers.toArray(),
        db.prayerLogs.toArray(),
      ])
      const snapshot = JSON.stringify({
        version: 1,
        savedAt: Date.now(),
        prayerLists,
        prayers,
        prayerLogs,
      })
      localStorage.setItem(STORAGE_KEY, snapshot)
    } catch {
      // Silently fail — localStorage might be full or unavailable
    }
  }, 1000)
}

/**
 * On startup, if IndexedDB is empty but localStorage has data,
 * silently restore from the backup.
 */
export async function checkAndRestoreFromLocalStorage(): Promise<boolean> {
  try {
    const listCount = await db.prayerLists.count()
    const prayerCount = await db.prayers.count()

    // Only restore if DB is completely empty
    if (listCount > 0 || prayerCount > 0) return false

    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false

    const data = JSON.parse(raw)
    if (!data.prayerLists?.length && !data.prayers?.length) return false

    await db.transaction('rw', [db.prayerLists, db.prayers, db.prayerLogs], async () => {
      if (data.prayerLists?.length) await db.prayerLists.bulkAdd(data.prayerLists)
      if (data.prayers?.length) await db.prayers.bulkAdd(data.prayers)
      if (data.prayerLogs?.length) await db.prayerLogs.bulkAdd(data.prayerLogs)
    })

    console.log('[PrayerCycles] Restored data from localStorage backup')
    return true
  } catch {
    console.warn('[PrayerCycles] Failed to restore from localStorage')
    return false
  }
}
