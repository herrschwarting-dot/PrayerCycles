import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import type { PrayerList, Prayer } from '../db/types'
import { getAllLists } from '../features/cycles/list-operations'
import { getPrayersByList } from '../features/prayers/prayer-operations'
import { getSurfacedPrayers, type SurfacedPrayer } from '../lib/surfacing'

type TimerMode = 'custom' | 'until-done'

export const TODAY_ID = '__today__'

type TimerState = {
  lists: PrayerList[]
  selectedListId: string | null
  prayers: Prayer[]
  surfacedPrayers: SurfacedPrayer[]
  dropdownOpen: boolean
  prayerIncrement: number
  timerMode: TimerMode
  customMinutes: number
  running: boolean
  timeLeft: number
  totalTime: number
  currentIndex: number
  incrementTimeLeft: number
  setSelectedListId: (id: string | null) => void
  setDropdownOpen: (open: boolean) => void
  setPrayerIncrement: (val: number) => void
  setTimerMode: (mode: TimerMode) => void
  setCustomMinutes: (val: number) => void
  setTimeLeft: (val: number) => void
  handleStart: () => void
  handlePause: () => void
  handleReset: () => void
  pickRandom: () => void
  refreshLists: () => void
  refreshPrayers: () => void
}

const TimerContext = createContext<TimerState | null>(null)

export function TimerProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<PrayerList[]>([])
  const [selectedListId, setSelectedListId] = useState<string | null>(TODAY_ID)
  const [prayers, setPrayers] = useState<Prayer[]>([])
  const [surfacedPrayers, setSurfacedPrayers] = useState<SurfacedPrayer[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const [prayerIncrement, setPrayerIncrement] = useState(60)
  const [timerMode, setTimerMode] = useState<TimerMode>('until-done')
  const [customMinutes, setCustomMinutes] = useState(10)

  const [running, setRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refreshLists = useCallback(() => {
    getAllLists().then((all) => setLists(all.filter((l) => l.status === 'active')))
  }, [])

  useEffect(() => {
    refreshLists()
  }, [refreshLists])

  const loadPrayers = useCallback(() => {
    if (!selectedListId) { setPrayers([]); setSurfacedPrayers([]); return }
    if (selectedListId === TODAY_ID) {
      getSurfacedPrayers().then((surfaced) => {
        setSurfacedPrayers(surfaced)
        setPrayers(surfaced.map((s) => s.prayer))
      })
    } else {
      getPrayersByList(selectedListId).then((p) => {
        setPrayers(p)
        const list = lists.find((l) => l.id === selectedListId)
        const listName = list?.name ?? ''
        setSurfacedPrayers(p.map((prayer) => ({ prayer, listId: selectedListId, listName })))
      })
    }
  }, [selectedListId, lists])

  // Load prayers when list changes
  useEffect(() => {
    loadPrayers()
  }, [loadPrayers])

  const refreshPrayers = useCallback(() => {
    loadPrayers()
  }, [loadPrayers])

  const totalTime = timerMode === 'until-done'
    ? prayers.length * prayerIncrement
    : customMinutes * 60

  // Derive currentIndex and per-prayer countdown from timeLeft
  const elapsed = totalTime - timeLeft
  const currentIndex = prayerIncrement > 0
    ? Math.min(Math.floor(elapsed / prayerIncrement), Math.max(0, prayers.length - 1))
    : 0
  const incrementTimeLeft = prayerIncrement > 0
    ? prayerIncrement - (elapsed % prayerIncrement)
    : 0

  const prevTotalTimeRef = useRef(totalTime)
  useEffect(() => {
    // Only reset timeLeft when totalTime actually changes (config change),
    // not when pausing/resuming
    if (prevTotalTimeRef.current !== totalTime && !running) {
      setTimeLeft(totalTime)
    }
    prevTotalTimeRef.current = totalTime
  }, [totalTime, running])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) { setRunning(false); return 0 }
          return prev - 1
        })
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  function handleStart() {
    if (selectedListId && prayers.length === 0) return
    if (totalTime === 0) return
    if (timeLeft === 0) {
      setTimeLeft(totalTime)
    }
    setRunning(true)
  }

  function handlePause() { setRunning(false) }

  function handleReset() {
    setRunning(false)
    setTimeLeft(totalTime)
  }

  function pickRandom() {
    if (running || lists.length === 0) return
    const random = lists[Math.floor(Math.random() * lists.length)]
    setSelectedListId(random.id)
  }

  return (
    <TimerContext.Provider value={{
      lists,
      selectedListId,
      prayers,
      surfacedPrayers,
      dropdownOpen,
      prayerIncrement,
      timerMode,
      customMinutes,
      running,
      timeLeft,
      totalTime,
      currentIndex,
      incrementTimeLeft,
      setSelectedListId,
      setDropdownOpen,
      setPrayerIncrement,
      setTimerMode,
      setCustomMinutes,
      setTimeLeft,
      handleStart,
      handlePause,
      handleReset,
      pickRandom,
      refreshLists,
      refreshPrayers,
    }}>
      {children}
    </TimerContext.Provider>
  )
}

export function useTimer() {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error('useTimer must be used within TimerProvider')
  return ctx
}
