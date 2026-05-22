import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'
import { useT } from '../i18n'
import type { PrayerList, Prayer } from '../db/types'
import { getAllLists, UNSCHEDULED_ID } from '../features/cycles/list-operations'
import { getPrayersByList } from '../features/prayers/prayer-operations'
import { getAllTags } from '../features/tags/tag-operations'
import { getSurfacedPrayers, type SurfacedPrayer } from '../lib/surfacing'
import { useTimer, TODAY_ID } from '../context/TimerContext'

function Highlight({ text, query }: { text: string; query: string }): ReactNode {
  if (!query) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-yellow-400/40 text-inherit rounded-sm px-0.5">{part}</mark>
      : part
  )
}

type ListWithPrayers = {
  list: PrayerList
  prayers: Prayer[]
}

export function ListsPage() {
  const { t } = useT()
  const [data, setData] = useState<ListWithPrayers[]>([])
  const [todayPrayers, setTodayPrayers] = useState<SurfacedPrayer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [allTags, setAllTags] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [tagsExpanded, setTagsExpanded] = useState(false)
  const [tagsOverflow, setTagsOverflow] = useState(false)
  const tagsRef = useRef<HTMLDivElement>(null)
  const { setSelectedListId } = useTimer()

  const load = useCallback(async () => {
    const [lists, surfaced, tags] = await Promise.all([
      getAllLists(),
      getSurfacedPrayers(),
      getAllTags(),
    ])
    const withPrayers = await Promise.all(
      lists.map(async (list) => ({
        list,
        prayers: await getPrayersByList(list.id),
      })),
    )
    setData(withPrayers)
    setTodayPrayers(surfaced)
    setAllTags(tags)
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

  // Detect if tag bar overflows 3 lines
  useEffect(() => {
    const el = tagsRef.current
    if (el) {
      // 5.25rem = 84px is the max-h when collapsed (3 lines)
      setTagsOverflow(el.scrollHeight > 84)
    }
  }, [allTags])

  if (loading) {
    return <div className="flex h-40 items-center justify-center text-slate-500">{t.loading}</div>
  }

  const lower = searchQuery.toLowerCase()
  const hasTagFilter = selectedTags.size > 0

  // Text search filter
  const textFiltered = lower
    ? data.filter((d) =>
        d.list.name.toLowerCase().includes(lower) ||
        d.list.description.toLowerCase().includes(lower) ||
        (d.list.tags ?? []).some((tag) => tag.toLowerCase().includes(lower)) ||
        d.prayers.some((p) => p.title.toLowerCase().includes(lower) || p.description.toLowerCase().includes(lower))
      )
    : data

  // Tag filter (OR — show list if it has ANY of the selected tags)
  const filtered = hasTagFilter
    ? textFiltered.filter((d) =>
        (d.list.tags ?? []).some((tag) => selectedTags.has(tag)),
      )
    : textFiltered

  // Hide Unscheduled list unless it has prayers or user is searching
  const visibleData = filtered.filter((d) =>
    d.list.id !== UNSCHEDULED_ID || d.prayers.length > 0 || lower,
  )
  const active = visibleData.filter((d) => d.list.status === 'active')
  const archived = visibleData.filter((d) => d.list.status === 'archived')

  function toggleTag(tag: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  // Filter today's prayers for search
  const todayFiltered = lower
    ? todayPrayers.filter((s) =>
        'today\'s prayers'.includes(lower) ||
        s.prayer.title.toLowerCase().includes(lower) ||
        s.prayer.description.toLowerCase().includes(lower)
      )
    : todayPrayers
  const showTodayCard = !lower || todayFiltered.length > 0 || 'today\'s prayers'.includes(lower)

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
      <div className="mx-auto max-w-2xl">
        {/* Inline search bar */}
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2">
          <Search size={16} className="text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder={t.searchPrayers}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
          />
        </div>

        {/* Tag filter bar */}
        {allTags.length > 0 && (
          <div className="mb-4">
            <div className="relative">
              <div
                ref={tagsRef}
                className={`flex flex-wrap gap-1.5 overflow-hidden transition-all duration-200 ${
                  tagsExpanded ? '' : 'max-h-[5.25rem]'
                }`}
              >
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                      selectedTags.has(tag)
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
              {!tagsExpanded && tagsOverflow && (
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-7 bg-gradient-to-t from-slate-900 to-transparent" />
              )}
            </div>
            {tagsOverflow && (
              <div className="flex justify-end mt-0.5">
                <button
                  onClick={() => setTagsExpanded(!tagsExpanded)}
                  className="flex items-center gap-0.5 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {tagsExpanded ? t.seeLess : t.seeMore}
                  {tagsExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="columns-2 gap-3 md:columns-3 [&>*]:mb-3">
          {/* Today's Prayers virtual card */}
          {showTodayCard && (
            <TodayCard prayers={todayPrayers} onSelect={() => setSelectedListId(TODAY_ID)} query={searchQuery} />
          )}

          {active.length === 0 && archived.length === 0 && !showTodayCard && (
            <p className="pt-20 text-center text-slate-400">{t.noListsYet}</p>
          )}

          {active.map(({ list, prayers }) => (
            <ListCard key={list.id} list={list} prayers={prayers} query={searchQuery} />
          ))}

          {archived.length > 0 && (
            <>
              <div className="pt-4 text-xs font-medium uppercase tracking-wide text-slate-500 break-inside-avoid">
                {t.deactivated}
              </div>
              {archived.map(({ list, prayers }) => (
                <ListCard key={list.id} list={list} prayers={prayers} query={searchQuery} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function TodayCard({ prayers, onSelect, query }: { prayers: SurfacedPrayer[]; onSelect: () => void; query: string }) {
  const { t } = useT()
  const navigate = useNavigate()
  const MAX_VISIBLE = 30
  const visible = prayers.slice(0, MAX_VISIBLE)
  const overflow = prayers.length - MAX_VISIBLE

  return (
    <div
      className="rounded-lg pt-2 px-4 pb-4 shadow-md break-inside-avoid cursor-pointer bg-slate-800 hover:bg-slate-750 transition border-2 border-emerald-400/80 shadow-[0_0_14px_rgba(52,211,153,0.35)]"
      onClick={() => { onSelect(); navigate('/') }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') { onSelect(); navigate('/') } }}
    >
      <p className="text-xs text-emerald-400 leading-tight">{t.surfacedLabel}</p>
      <h3 className="text-lg font-semibold text-slate-100 -mt-0.5">{t.todaysPrayers}</h3>
      <p className="text-sm text-slate-300 mt-1">{t.todaysPrayersDesc}</p>

      <div className="mt-2 space-y-1">
        {visible.map((s) => (
          <div key={`${s.prayer.id}-${s.listId}`} className="text-sm text-slate-200">
            <Highlight text={s.prayer.title} query={query} />
          </div>
        ))}
        {overflow > 0 && (
          <div className="text-xs text-slate-400">{t.expand}</div>
        )}
        {prayers.length === 0 && (
          <div className="text-xs text-slate-400 italic">{t.noPrayersSurfaced}</div>
        )}
      </div>

      <div className="mt-3 text-xs text-emerald-300 text-right">
        {t.prayerCount(prayers.length)}
      </div>
    </div>
  )
}

const MAX_VISIBLE = 30

function ListCard({ list, prayers, query }: { list: PrayerList; prayers: Prayer[]; query: string }) {
  const { t } = useT()
  const navigate = useNavigate()
  const descRef = useRef<HTMLParagraphElement>(null)
  const [isClamped, setIsClamped] = useState(false)
  const isArchived = list.status === 'archived'
  const displayName = list.id === UNSCHEDULED_ID ? t.unscheduled : list.name

  useEffect(() => {
    const el = descRef.current
    if (el) setIsClamped(el.scrollHeight > el.clientHeight)
  }, [list.description])
  const pUnit = list.cycle.persistence.unit
  const pEvery = list.cycle.persistence.every
  const unitLabels: Record<string, [string, string]> = { wake: [t.day, t.days], passage: [t.week, t.weeks], season: [t.month, t.months], orbit: [t.year, t.years] }
  const [singular, plural] = unitLabels[pUnit] || [t.day, t.days]
  const freqLabel = t.everyUnit(pEvery, singular, plural)
  const lifecycleLabel = list.cycle.lifecycle.type === 'indefinite' ? t.timesInfinite : t.timesCount(list.cycle.lifecycle.retireAfter ?? 1)
  const visible = prayers.slice(0, MAX_VISIBLE)
  const overflow = prayers.length - MAX_VISIBLE

  const isUnscheduled = list.id === UNSCHEDULED_ID
  const borderClass = isUnscheduled
    ? 'border-2 border-slate-500/60 shadow-[0_0_14px_rgba(148,163,184,0.2)]'
    : 'border-2 border-sky-300/80 shadow-[0_0_14px_rgba(125,211,252,0.35)]'

  return (
    <div
      className={`rounded-lg pt-2 px-4 pb-4 shadow-md break-inside-avoid cursor-pointer bg-slate-800 hover:bg-slate-750 transition ${borderClass} ${isArchived ? 'opacity-50' : ''}`}
      onClick={() => navigate(`/lists/${list.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/lists/${list.id}`) }}
    >
      {!isUnscheduled && (
        <p className="text-xs text-slate-400 leading-tight"><span className="capitalize">{list.cycle.cadence}</span> | {freqLabel} | {lifecycleLabel}</p>
      )}
      <h3 className="text-lg font-semibold text-slate-100 -mt-0.5"><Highlight text={displayName} query={query} /></h3>
      {list.description && (
        <div className="relative mt-1">
          <p ref={descRef} className="text-sm text-slate-300 line-clamp-5"><Highlight text={list.description} query={query} /></p>
          {isClamped && (
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-slate-800 to-transparent" />
          )}
        </div>
      )}

      <div className="mt-2 space-y-1">
        {visible.map((prayer) => (
          <div key={prayer.id} className="text-sm text-slate-200">
            <Highlight text={prayer.title} query={query} />
          </div>
        ))}
        {overflow > 0 && (
          <div className="text-xs text-slate-400">{t.expand}</div>
        )}
        {prayers.length === 0 && (
          <div className="text-xs text-slate-400 italic">{t.noPrayersYet}</div>
        )}
      </div>

      {/* Tags */}
      {(list.tags ?? []).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {list.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-slate-400">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 text-xs text-sky-300 text-right">
        {list.completionTally}
      </div>
    </div>
  )
}
