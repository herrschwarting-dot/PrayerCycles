import { encryptString, hasCryptoKey, isEncrypted } from '../lib/crypto'
import type { db as DbType } from './db'

const LIST_FIELDS = ['name', 'description', 'tags'] as const
const PRAYER_FIELDS = ['title', 'description', 'tags'] as const

function encryptField(val: unknown): string | undefined {
  if (typeof val === 'string' && val !== '' && !isEncrypted(val)) return encryptString(val)
  if (Array.isArray(val) && val.length > 0) return encryptString(JSON.stringify(val))
  return undefined
}

export async function migrateUnencryptedData(db: typeof DbType): Promise<void> {
  if (!hasCryptoKey()) return

  const MIGRATION_KEY = 'prayercycles-encrypted'
  if (localStorage.getItem(MIGRATION_KEY) === '1') return

  await db.transaction('rw', db.prayerLists, db.prayers, async () => {
    const lists = await db.prayerLists.toArray()
    for (const list of lists) {
      const updates: Record<string, unknown> = {}
      let needsUpdate = false
      for (const field of LIST_FIELDS) {
        const encrypted = encryptField((list as any)[field])
        if (encrypted !== undefined) {
          updates[field] = encrypted
          needsUpdate = true
        }
      }
      if (needsUpdate) await db.prayerLists.update(list.id, updates)
    }

    const prayers = await db.prayers.toArray()
    for (const prayer of prayers) {
      const updates: Record<string, unknown> = {}
      let needsUpdate = false
      for (const field of PRAYER_FIELDS) {
        const encrypted = encryptField((prayer as any)[field])
        if (encrypted !== undefined) {
          updates[field] = encrypted
          needsUpdate = true
        }
      }
      if (needsUpdate) await db.prayers.update(prayer.id, updates)
    }
  })

  localStorage.setItem(MIGRATION_KEY, '1')
}
