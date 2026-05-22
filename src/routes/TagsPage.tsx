import { useState, useEffect, useCallback, useRef } from 'react'
import { Hash, Trash2, Plus } from 'lucide-react'
import { useT } from '../i18n'
import { getAllTags, getTagCounts, renameTag, deleteTag, createStandaloneTag } from '../features/tags/tag-operations'

type TagEntry = {
  name: string
  listCount: number
  prayerCount: number
}

export function TagsPage() {
  const { t } = useT()
  const [tags, setTags] = useState<TagEntry[]>([])
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [confirmDeleteTag, setConfirmDeleteTag] = useState<string | null>(null)
  const [newTagName, setNewTagName] = useState('')
  const editRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    const [allTags, counts] = await Promise.all([getAllTags(), getTagCounts()])
    setTags(
      allTags.map((name) => {
        const c = counts.get(name) ?? { lists: 0, prayers: 0 }
        return { name, listCount: c.lists, prayerCount: c.prayers }
      }),
    )
  }, [])

  useEffect(() => {
    load()
    window.addEventListener('prayercycles:refresh', load)
    return () => window.removeEventListener('prayercycles:refresh', load)
  }, [load])

  function handleCreateTag(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newTagName.trim()
    if (!trimmed) return
    const created = createStandaloneTag(trimmed)
    if (created) {
      setNewTagName('')
      load()
    }
  }

  function startEditing(tagName: string) {
    setEditingTag(tagName)
    setEditValue(tagName)
    // Focus happens via autoFocus on the input
  }

  async function commitRename(oldName: string) {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== oldName) {
      await renameTag(oldName, trimmed)
      window.dispatchEvent(new Event('prayercycles:refresh'))
    }
    setEditingTag(null)
    setEditValue('')
    load()
  }

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement>, oldName: string) {
    const val = e.target.value

    // Double-space commits the edit
    if (val.endsWith('  ')) {
      const trimmed = val.trimEnd()
      if (trimmed) {
        setEditValue(trimmed)
        // Use setTimeout so the state updates before commit
        setTimeout(() => commitRename(oldName), 0)
        return
      }
    }

    setEditValue(val)
  }

  function handleEditKeyDown(e: React.KeyboardEvent, oldName: string) {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      commitRename(oldName)
    }
    if (e.key === 'Escape') {
      setEditingTag(null)
      setEditValue('')
    }
  }

  function handleEditBlur(oldName: string) {
    commitRename(oldName)
  }

  async function handleDelete(tagName: string) {
    await deleteTag(tagName)
    setConfirmDeleteTag(null)
    window.dispatchEvent(new Event('prayercycles:refresh'))
    load()
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
      <div className="mx-auto max-w-lg">
        <h2 className="text-xl font-semibold text-slate-100 mb-1">{t.prayerTags}</h2>
        <p className="text-xs text-slate-500 mb-4">{t.prayerTagsDesc}</p>

        {/* Create tag input */}
        <form onSubmit={handleCreateTag} className="mb-4 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2">
            <Hash size={16} className="text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder={t.newTagPlaceholder}
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!newTagName.trim()}
            className="flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={16} />
            {t.createTag}
          </button>
        </form>

        {tags.length === 0 ? (
          <p className="text-sm text-slate-500 italic pt-4">{t.noTagsYet}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {tags.map((tag) => (
              <div
                key={tag.name}
                className="flex items-center justify-between rounded-lg bg-slate-800 px-4 py-3"
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <Hash size={14} className="text-slate-400 shrink-0" />
                  {editingTag === tag.name ? (
                    <input
                      ref={editRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => handleEditChange(e, tag.name)}
                      onKeyDown={(e) => handleEditKeyDown(e, tag.name)}
                      onBlur={() => handleEditBlur(tag.name)}
                      className="flex-1 bg-transparent text-sm font-medium text-slate-100 outline-none border-b border-slate-500 pb-0.5"
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => startEditing(tag.name)}
                      className="text-sm font-medium text-slate-200 truncate cursor-text hover:text-slate-100"
                    >
                      {tag.name}
                    </span>
                  )}
                  <span className="text-xs text-slate-500 shrink-0">({tag.prayerCount})</span>
                </div>

                <div className="flex items-center gap-1 ml-3">
                  {confirmDeleteTag === tag.name ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-400">{t.deleteConfirm}</span>
                      <button
                        onClick={() => handleDelete(tag.name)}
                        className="rounded bg-red-600 px-2 py-0.5 text-xs text-white hover:bg-red-500"
                      >
                        {t.yes}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteTag(null)}
                        className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300 hover:bg-slate-600"
                      >
                        {t.no}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteTag(tag.name)}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
