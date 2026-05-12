import Dexie, { type EntityTable } from 'dexie'
import type { Prayer, PrayerList, PrayerLog } from './types'

const db = new Dexie('PrayerCyclesDB') as Dexie & {
  prayerLists: EntityTable<PrayerList, 'id'>
  prayers: EntityTable<Prayer, 'id'>
  prayerLogs: EntityTable<PrayerLog, 'id'>
}

db.version(1).stores({
  prayerLists: 'id, name, status, createdAt',
  prayers: 'id, title, *listIds, createdAt, lastPrayedAt',
  prayerLogs: 'id, prayerId, listId, prayedAt',
})

export { db }
