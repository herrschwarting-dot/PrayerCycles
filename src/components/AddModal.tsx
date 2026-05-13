import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { PrayerList, Cadence, Persistence, Lifecycle } from '../db/types'
import { createList, getAllLists } from '../features/cycles/list-operations'
import { createPrayer } from '../features/prayers/prayer-operations'

type AddModalProps = {
  open: boolean
  onClose: () => void
  onAdded: () => void
}

type Mode = 'create-list' | 'add-single'

export function AddModal({ open, onClose, onAdded }: AddModalProps) {
  const [mode, setMode] = useState<Mode>('create-list')
  const [lists, setLists] = useState<PrayerList[]>([])

  // Create list fields
  const [listName, setListName] = useState('')
  const [listDescription, setListDescription] = useState('')
  const [cadence, setCadence] = useState<Cadence>('daily')
  const [persistence, setPersistence] = useState<Persistence>('sustained')
  const [lifecycle, setLifecycle] = useState<Lifecycle>('indefinite')
  const [initialPrayers, setInitialPrayers] = useState('')

  // Add prayer fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedLists, setSelectedLists] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      getAllLists().then(setLists)
      setMode('create-list')
    }
  }, [open])

  function reset() {
    setListName('')
    setListDescription('')
    setCadence('daily')
    setPersistence('sustained')
    setLifecycle('indefinite')
    setInitialPrayers('')
    setTitle('')
    setDescription('')
    setSelectedLists([])
    setMode('create-list')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function toggleList(id: string) {
    setSelectedLists((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    )
  }

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault()
    if (!listName.trim()) return
    const titles = initialPrayers.split('\n').filter((t) => t.trim())
    await createList(
      listName.trim(),
      { cadence, persistence, lifecycle },
      listDescription.trim(),
      titles,
    )
    reset()
    onAdded()
    onClose()
  }

  async function handleAddPrayer(e: React.FormEvent) {
    e.preventDefault()
    if (selectedLists.length === 0 || !title.trim()) return
    await createPrayer(title.trim(), selectedLists, description.trim())
    reset()
    onAdded()
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-slate-800 p-6 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">
            {mode === 'create-list' ? '+ Prayer List' : '+ Prayer'}
          </h2>
          <button
            onClick={handleClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-700"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode switcher */}
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('create-list')}
            className={`rounded px-3 py-1 text-sm ${mode === 'create-list' ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          >
            + Prayer List
          </button>
          <button
            type="button"
            onClick={() => setMode('add-single')}
            className={`rounded px-3 py-1 text-sm ${mode === 'add-single' ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-400'}`}
          >
            + Prayer
          </button>
        </div>

        {/* Create List form */}
        {mode === 'create-list' && (
          <form onSubmit={handleCreateList} className="space-y-4">
            <input
              type="text"
              placeholder="List name"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              className="w-full rounded-lg bg-slate-700 px-3 py-2 text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-500"
              autoFocus
            />

            <div>
              <textarea
                placeholder="Description (optional)"
                value={listDescription}
                onChange={(e) => setListDescription(e.target.value.slice(0, 500))}
                rows={2}
                maxLength={500}
                className="w-full rounded-lg bg-slate-700 px-3 py-2 text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-500 resize-none"
              />
              <div className="text-right text-xs text-slate-500 mt-1">{listDescription.length}/500</div>
            </div>

            <div>
              <div className="mb-2 text-sm text-slate-400">Cycle</div>
              <div className="flex flex-wrap gap-2">
                {(['daily', 'weekly', 'monthly'] as Cadence[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCadence(c)}
                    className={`rounded px-3 py-1 text-sm capitalize ${cadence === c ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm text-slate-400">Persistence</div>
              <div className="flex gap-2">
                {(['sustained', 'one-session'] as Persistence[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPersistence(p)}
                    className={`rounded px-3 py-1 text-sm ${persistence === p ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                  >
                    {p === 'sustained' ? 'Sustained' : 'One session'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm text-slate-400">Lifecycle</div>
              <div className="flex gap-2">
                {(['indefinite', 'finite'] as Lifecycle[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLifecycle(l)}
                    className={`rounded px-3 py-1 text-sm capitalize ${lifecycle === l ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm text-slate-400">Prayers (one per line)</div>
              <textarea
                placeholder={"Mom\nDad\nSister\nBrother"}
                value={initialPrayers}
                onChange={(e) => setInitialPrayers(e.target.value)}
                rows={5}
                className="w-full rounded-lg bg-slate-700 px-3 py-2 text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!listName.trim()}
              className="w-full rounded-lg bg-slate-600 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create List
            </button>
          </form>
        )}

        {/* Add single prayer form */}
        {mode === 'add-single' && (
          <form onSubmit={handleAddPrayer} className="space-y-4">
            <input
              type="text"
              placeholder="Prayer title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-slate-700 px-3 py-2 text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-500"
              autoFocus
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
              maxLength={2000}
              rows={3}
              className="w-full rounded-lg bg-slate-700 px-3 py-2 text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-500 resize-none"
            />
            <div className="text-right text-xs text-slate-500 -mt-3">{description.length}/2000</div>
            <ListPicker lists={lists} selected={selectedLists} onToggle={toggleList} />
            <button
              type="submit"
              disabled={selectedLists.length === 0 || !title.trim()}
              className="w-full rounded-lg bg-slate-600 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add Prayer
            </button>
          </form>
        )}

      </div>
    </div>
  )
}

function ListPicker({
  lists,
  selected,
  onToggle,
}: {
  lists: PrayerList[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  if (lists.length === 0) {
    return <p className="text-sm text-slate-500 italic">No lists yet. Create one first.</p>
  }
  return (
    <div>
      <div className="mb-2 text-sm text-slate-400">Add to list</div>
      <div className="flex flex-wrap gap-2">
        {lists.map((list) => (
          <button
            key={list.id}
            type="button"
            onClick={() => onToggle(list.id)}
            className={`rounded px-3 py-1 text-sm transition-colors ${
              selected.includes(list.id)
                ? 'bg-slate-500 text-white ring-2 ring-white'
                : 'bg-slate-700 text-slate-400'
            }`}
          >
            {list.name}
          </button>
        ))}
      </div>
    </div>
  )
}
