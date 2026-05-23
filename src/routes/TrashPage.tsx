import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { useT } from '../i18n'
import { getDeletedLists, restoreList } from '../features/cycles/list-operations'
import type { PrayerList } from '../db/types'

const FIFTY_DAYS_MS = 50 * 24 * 60 * 60 * 1000

export function TrashPage() {
  const { t } = useT()
  const navigate = useNavigate()
  const [lists, setLists] = useState<PrayerList[]>([])

  const load = () => {
    getDeletedLists().then(setLists)
  }

  useEffect(() => {
    load()
    window.addEventListener('prayercycles:refresh', load)
    return () => window.removeEventListener('prayercycles:refresh', load)
  }, [])

  const handleRestore = async (id: string) => {
    await restoreList(id)
    load()
    window.dispatchEvent(new Event('prayercycles:refresh'))
  }

  const daysRemaining = (deletedAt: number | undefined) => {
    if (!deletedAt) return 50
    const elapsed = Date.now() - deletedAt
    const remaining = Math.ceil((FIFTY_DAYS_MS - elapsed) / (24 * 60 * 60 * 1000))
    return Math.max(1, remaining)
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
      <div className="mx-auto max-w-lg">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1 text-sm text-text-tertiary hover:text-text-secondary"
        >
          <ArrowLeft size={16} />
          {t.back}
        </button>

        <h2 className="text-xl font-semibold text-text mb-2">{t.deletedListsTitle}</h2>
        <p className="text-xs text-text-muted mb-4">{t.deletedListsDesc}</p>

        {lists.length === 0 ? (
          <p className="text-sm text-text-muted italic pt-4">{t.noDeletedLists}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {lists.map((list) => (
              <div
                key={list.id}
                className="flex items-center justify-between rounded-lg bg-card px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-secondary">{list.name}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {t.daysUntilDeletion(daysRemaining(list.deletedAt))}
                  </p>
                </div>
                <button
                  onClick={() => handleRestore(list.id)}
                  className="ml-3 flex items-center gap-1.5 rounded-md bg-input px-3 py-1.5 text-xs text-text-secondary hover:bg-input-hover hover:text-text"
                >
                  <RotateCcw size={14} />
                  {t.restore}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
