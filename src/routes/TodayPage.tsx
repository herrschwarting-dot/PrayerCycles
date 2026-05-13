import { useEffect } from 'react'
import { Undo2 } from 'lucide-react'
import { useSurfacedPrayers } from '../hooks/useSurfacedPrayers'
import { PrayerCard } from '../components/PrayerCard'

export function TodayPage() {
  const { prayers, loading, complete, undo, canUndo, refresh } = useSurfacedPrayers()

  useEffect(() => {
    const handler = () => refresh()
    window.addEventListener('prayercycles:refresh', handler)
    return () => window.removeEventListener('prayercycles:refresh', handler)
  }, [refresh])

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
      {loading ? (
        <div className="flex h-40 items-center justify-center text-slate-500">Loading...</div>
      ) : prayers.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-20 text-center">
          <p className="text-slate-400">No prayers for today.</p>
        </div>
      ) : (
        <div className="mx-auto columns-2 gap-3 sm:columns-2 md:columns-3 max-w-2xl space-y-3">
          {prayers.map((s) => (
            <PrayerCard
              key={`${s.prayer.id}-${s.listId}`}
              surfaced={s}
              onComplete={complete}
            />
          ))}
        </div>
      )}

      {canUndo && (
        <button
          onClick={undo}
          className="fixed bottom-20 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-slate-300 shadow-lg hover:bg-slate-600"
          aria-label="Undo last completion"
        >
          <Undo2 size={20} />
        </button>
      )}
    </div>
  )
}
