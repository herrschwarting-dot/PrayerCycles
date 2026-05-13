import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { PrayerList, Prayer } from '../db/types'
import { getAllLists } from '../features/cycles/list-operations'
import { getPrayersByList } from '../features/prayers/prayer-operations'

type ListWithPrayers = {
  list: PrayerList
  prayers: Prayer[]
}

export function ListsPage() {
  const [data, setData] = useState<ListWithPrayers[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const lists = await getAllLists()
    const withPrayers = await Promise.all(
      lists.map(async (list) => ({
        list,
        prayers: await getPrayersByList(list.id),
      })),
    )
    setData(withPrayers)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const handler = () => load()
    window.addEventListener('prayercycles:refresh', handler)
    return () => window.removeEventListener('prayercycles:refresh', handler)
  }, [load])

  if (loading) {
    return <div className="flex h-40 items-center justify-center text-slate-500">Loading...</div>
  }

  const active = data.filter((d) => d.list.status === 'active')
  const archived = data.filter((d) => d.list.status === 'archived')

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
      <div className="mx-auto columns-2 gap-3 sm:columns-2 md:columns-3 max-w-2xl space-y-3">
        {active.length === 0 && archived.length === 0 && (
          <p className="pt-20 text-center text-slate-400">No lists yet.</p>
        )}

        {active.map(({ list, prayers }) => (
          <ListCard key={list.id} list={list} prayers={prayers} />
        ))}

        {archived.length > 0 && (
          <>
            <div className="pt-4 text-xs font-medium uppercase tracking-wide text-slate-500 break-inside-avoid">
              Archived
            </div>
            {archived.map(({ list, prayers }) => (
              <ListCard key={list.id} list={list} prayers={prayers} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

const MAX_VISIBLE = 30

function ListCard({ list, prayers }: { list: PrayerList; prayers: Prayer[] }) {
  const navigate = useNavigate()
  const isArchived = list.status === 'archived'
  const cadenceLabel = `${list.cycle.cadence} · ${list.cycle.persistence === 'sustained' ? 'Sustained' : 'One session'}`
  const visible = prayers.slice(0, MAX_VISIBLE)
  const overflow = prayers.length - MAX_VISIBLE

  return (
    <div
      className={`rounded-lg p-4 shadow-md break-inside-avoid cursor-pointer bg-slate-800 hover:bg-slate-750 transition border-2 border-sky-300/80 shadow-[0_0_14px_rgba(125,211,252,0.35)] ${isArchived ? 'opacity-50' : ''}`}
      onClick={() => navigate(`/lists/${list.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/lists/${list.id}`) }}
    >
      <h3 className="text-lg font-semibold text-slate-100">{list.name}</h3>
      {list.description && (
        <div className="relative mt-1">
          <p className="text-sm text-slate-300 line-clamp-5">{list.description}</p>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-slate-800 to-transparent" />
        </div>
      )}
      <p className="mt-1 text-xs text-slate-400 capitalize">{cadenceLabel}</p>

      <div className="mt-2 space-y-1">
        {visible.map((prayer) => (
          <div key={prayer.id} className="text-sm text-slate-200">
            {prayer.title}
          </div>
        ))}
        {overflow > 0 && (
          <div className="text-xs text-slate-400">expand</div>
        )}
        {prayers.length === 0 && (
          <div className="text-xs text-slate-400 italic">No prayers yet</div>
        )}
      </div>
    </div>
  )
}
