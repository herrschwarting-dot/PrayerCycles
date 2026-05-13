export type Cadence = 'daily' | 'weekly' | 'monthly' | 'custom'
export type Persistence = 'one-session' | 'sustained'
export type Lifecycle = 'indefinite' | 'finite'
export type ListStatus = 'active' | 'archived'

export type Cycle = {
  cadence: Cadence
  persistence: Persistence
  lifecycle: Lifecycle
}

export type RotationState = {
  queue: string[]
  pointer: number
  lastCadenceBoundary: number
}

export type PrayerList = {
  id: string
  name: string
  description: string
  cycle: Cycle
  status: ListStatus
  rotationState: RotationState
  createdAt: number
}

export type Prayer = {
  id: string
  title: string
  description: string
  listIds: string[]
  createdAt: number
  lastPrayedAt: number | null
  prayerTally: number
}

export type PrayerLog = {
  id: string
  prayerId: string
  listId: string
  prayedAt: number
}
