import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import type { PrayerList, Prayer, Cadence, Persistence, Lifecycle } from '../db/types'
import { getList, updateList, deleteList, archiveList, reactivateList } from '../features/cycles/list-operations'
import { getPrayersByList, createPrayer, bulkCreatePrayers } from '../features/prayers/prayer-operations'
import { PrayerDetailModal } from '../components/PrayerDetailModal'

export function ListDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [list, setList] = useState<PrayerList | null>(null)
  const [prayers, setPrayers] = useState<Prayer[]>([])
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showAddPrayer, setShowAddPrayer] = useState(false)
  const [newPrayerText, setNewPrayerText] = useState('')
  type SortMode = 'original' | 'az' | 'za' | 'most' | 'least'
  const storageKey = `prayercycles-sort-${id}`
  const [sortMode, setSortMode] = useState<SortMode>(() => {
    return (localStorage.getItem(storageKey) as SortMode) || 'original'
  })
  const [sortTrail, setSortTrail] = useState<SortMode[]>(() => {
    const saved = localStorage.getItem(storageKey)
    return saved ? [saved as SortMode] : ['original']
  })

  function handleSort(mode: SortMode) {
    setSortMode(mode)
    localStorage.setItem(storageKey, mode)
    setSortTrail((prev) => [...prev.slice(-2), mode])
  }

  function getTrailStyle(mode: SortMode): string {
    // Find the most recent index of this mode in the trail
    const lastIndex = sortTrail.lastIndexOf(mode)
    if (lastIndex === -1) return 'bg-slate-800 text-slate-500'

    const recency = sortTrail.length - 1 - lastIndex
    // If a more recent entry exists for this same mode, only show the latest
    if (recency === 0) return 'bg-sky-500 text-white'
    if (recency === 1) return 'bg-sky-500/40 text-slate-300'
    if (recency === 2) return 'bg-sky-500/20 text-slate-400'
    return 'bg-slate-800 text-slate-500'
  }

  // Edit fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [cadence, setCadence] = useState<Cadence>('daily')
  const [persistence, setPersistence] = useState<Persistence>('sustained')
  const [lifecycle, setLifecycle] = useState<Lifecycle>('indefinite')

  const load = useCallback(async () => {
    if (!id) return
    const l = await getList(id)
    if (!l) return
    setList(l)
    setName(l.name)
    setDescription(l.description)
    setCadence(l.cycle.cadence)
    setPersistence(l.cycle.persistence)
    setLifecycle(l.cycle.lifecycle)
    const p = await getPrayersByList(id)
    setPrayers(p)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function handleSaveList() {
    if (!id || !name.trim()) return
    await updateList(id, {
      name: name.trim(),
      description: description.trim(),
      cycle: { cadence, persistence, lifecycle },
    })
    setEditing(false)
    load()
  }

  async function handleDeleteList() {
    if (!id) return
    await deleteList(id)
    navigate('/lists')
  }

  async function handleToggleArchive() {
    if (!id || !list) return
    if (list.status === 'active') {
      await archiveList(id)
    } else {
      await reactivateList(id)
    }
    load()
  }

  async function handleAddPrayers() {
    if (!id || !newPrayerText.trim()) return
    const lines = newPrayerText.split('\n').filter((t) => t.trim())
    if (lines.length === 0) return
    if (lines.length === 1) {
      await createPrayer(lines[0].trim(), [id])
    } else {
      await bulkCreatePrayers(lines, id)
    }
    setNewPrayerText('')
    setShowAddPrayer(false)
    load()
    window.dispatchEvent(new Event('prayercycles:refresh'))
  }

  if (!list) {
    return <div className="flex h-40 items-center justify-center text-slate-500">Loading...</div>
  }

  const cadenceLabel = `${list.cycle.cadence} · ${list.cycle.persistence === 'sustained' ? 'Sustained' : 'One session'}`

  const sortedPrayers = [...prayers].sort((a, b) => {
    if (sortMode === 'az') return a.title.localeCompare(b.title) || a.createdAt - b.createdAt
    if (sortMode === 'za') return b.title.localeCompare(a.title) || a.createdAt - b.createdAt
    if (sortMode === 'most') return (b.prayerTally - a.prayerTally) || a.title.localeCompare(b.title) || a.createdAt - b.createdAt
    if (sortMode === 'least') return (a.prayerTally - b.prayerTally) || a.title.localeCompare(b.title) || a.createdAt - b.createdAt
    return a.createdAt - b.createdAt
  })

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <button
          onClick={() => navigate('/lists')}
          className="mb-4 flex items-center gap-1 text-sm text-slate-400 hover:text-slate-300"
        >
          <ArrowLeft size={16} />
          Back to lists
        </button>

        {/* List info */}
        <div className="rounded-lg p-5 shadow-md bg-slate-800">
          {editing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-slate-100 font-semibold text-lg outline-none focus:ring-2 focus:ring-white/30"
              />
              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                maxLength={500}
                rows={2}
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-slate-200 text-sm outline-none focus:ring-2 focus:ring-white/30 resize-none"
              />
              <div>
                <div className="mb-1 text-xs text-slate-300">Cycle</div>
                <div className="flex flex-wrap gap-1">
                  {(['daily', 'weekly', 'monthly'] as Cadence[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCadence(c)}
                      className={`rounded px-2 py-0.5 text-xs capitalize ${cadence === c ? 'bg-slate-700 text-white' : 'bg-white/10 text-slate-200'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs text-slate-300">Persistence</div>
                <div className="flex gap-1">
                  {(['sustained', 'one-session'] as Persistence[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPersistence(p)}
                      className={`rounded px-2 py-0.5 text-xs ${persistence === p ? 'bg-slate-700 text-white' : 'bg-white/10 text-slate-200'}`}
                    >
                      {p === 'sustained' ? 'Sustained' : 'One session'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs text-slate-300">Lifecycle</div>
                <div className="flex gap-1">
                  {(['indefinite', 'finite'] as Lifecycle[]).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLifecycle(l)}
                      className={`rounded px-2 py-0.5 text-xs capitalize ${lifecycle === l ? 'bg-slate-700 text-white' : 'bg-white/10 text-slate-200'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSaveList}
                  className="rounded-lg bg-slate-700 px-3 py-1 text-sm text-white hover:bg-slate-600"
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditing(false); setName(list.name); setDescription(list.description) }}
                  className="rounded-lg bg-white/30 px-3 py-1 text-sm text-slate-700 hover:bg-white/20"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-slate-100">{list.name}</h2>
              {list.description && (
                <p className="mt-1 text-sm text-slate-300">{list.description}</p>
              )}
              <p className="mt-1 text-xs text-slate-400 capitalize">{cadenceLabel}</p>
              {list.status === 'archived' && (
                <span className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">
                  Archived
                </span>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-lg bg-white/30 px-3 py-1 text-sm text-slate-700 hover:bg-white/20"
                >
                  Edit
                </button>
                <button
                  onClick={handleToggleArchive}
                  className="rounded-lg bg-white/30 px-3 py-1 text-sm text-slate-700 hover:bg-white/20"
                >
                  {list.status === 'active' ? 'Archive' : 'Reactivate'}
                </button>
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1 rounded-lg bg-white/30 px-3 py-1 text-sm text-red-300 hover:bg-white/20"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-red-300">Delete list and all prayers?</span>
                    <button
                      onClick={handleDeleteList}
                      className="rounded-lg bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-500"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="rounded-lg bg-white/30 px-2 py-1 text-xs text-slate-700 hover:bg-white/20"
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Add prayers inline */}
        <div className="mt-4">
          {!showAddPrayer ? (
            <button
              onClick={() => setShowAddPrayer(true)}
              className="text-sm text-sky-300 hover:text-sky-200 transition-colors"
            >
              + Add prayers to this list
            </button>
          ) : (
            <div className="rounded-lg bg-slate-800 p-4 space-y-3">
              <textarea
                placeholder={"Add prayers (one per line)\ne.g.\nMom\nDad\nSister"}
                value={newPrayerText}
                onChange={(e) => setNewPrayerText(e.target.value)}
                rows={4}
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-slate-100 placeholder-slate-400 text-sm outline-none focus:ring-2 focus:ring-white/30 resize-none"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddPrayers}
                  disabled={!newPrayerText.trim()}
                  className="rounded-lg bg-slate-700 px-3 py-1 text-sm text-white hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add
                </button>
                <button
                  onClick={() => { setShowAddPrayer(false); setNewPrayerText('') }}
                  className="rounded-lg bg-white/30 px-3 py-1 text-sm text-slate-700 hover:bg-white/20"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Prayer list */}
        <div className="mt-4 space-y-1">
          <div className="flex gap-1 mb-2">
            {([['original', 'Original Order'], ['az', 'A–Z'], ['za', 'Z–A'], ['most', 'Most Prayed'], ['least', 'Least Prayed']] as const).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => handleSort(mode)}
                className={`rounded px-3 py-1 text-xs transition-colors ${getTrailStyle(mode)}`}
              >
                {label}
              </button>
            ))}
          </div>
          {sortedPrayers.map((prayer) => (
            <button
              key={prayer.id}
              onClick={() => setSelectedPrayer(prayer)}
              className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <span>{prayer.title}</span>
              <span className="text-xs text-sky-300 ml-2 shrink-0">{prayer.prayerTally}</span>
            </button>
          ))}
          {prayers.length === 0 && (
            <p className="text-sm text-slate-500 italic pt-2">No prayers in this list yet.</p>
          )}
        </div>
      </div>

      {selectedPrayer && (
        <PrayerDetailModal
          prayer={selectedPrayer}
          onClose={() => setSelectedPrayer(null)}
          onUpdated={load}
        />
      )}
    </div>
  )
}
