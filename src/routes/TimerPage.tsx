import { useEffect } from 'react'
import { Play, Pause, RotateCcw, Dices, ChevronDown } from 'lucide-react'
import { useTimer, TODAY_ID } from '../context/TimerContext'

export function TimerPage() {
  const {
    lists,
    selectedListId,
    prayers,
    dropdownOpen,
    prayerIncrement,
    timerMode,
    customMinutes,
    running,
    timeLeft,
    currentIndex,
    incrementTimeLeft,
    setSelectedListId,
    setDropdownOpen,
    setPrayerIncrement,
    setTimerMode,
    setCustomMinutes,
    handleStart,
    handlePause,
    handleReset,
    pickRandom,
    refreshLists,
  } = useTimer()

  // Refresh lists when page is visited
  useEffect(() => { refreshLists() }, [refreshLists])

  function formatTime(s: number): string {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const incrementMinutes = Math.floor(prayerIncrement / 60)
  const incrementSeconds = prayerIncrement % 60
  const isToday = selectedListId === TODAY_ID
  const selectedList = isToday ? null : lists.find((l) => l.id === selectedListId)
  const displayName = isToday ? "Today's Prayers" : (selectedList?.name ?? 'Select a prayer list')
  const hasSelection = isToday || !!selectedList
  const currentPrayer = prayers.length > 0 ? (prayers[currentIndex] ?? prayers[0]) : null
  const upcomingPrayers = currentPrayer
    ? prayers.slice((running || timeLeft < (timerMode === 'until-done' ? prayers.length * prayerIncrement : customMinutes * 60)) ? currentIndex + 1 : 1)
    : []

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
      <div className="mx-auto max-w-2xl space-y-3">

        {/* List selector */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { if (!running) setDropdownOpen(!dropdownOpen) }}
              className={`flex-1 flex items-center justify-between rounded-lg bg-slate-800 px-4 py-3 text-left transition-colors border border-slate-700 hover:border-slate-600 ${running ? 'opacity-50' : ''}`}
            >
              <span className={`text-lg font-semibold ${hasSelection ? 'text-slate-100' : 'text-slate-500'}`}>
                {displayName}
              </span>
              <ChevronDown size={18} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={pickRandom}
              className={`rounded-lg bg-slate-800 p-3 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors border border-slate-700 ${running ? 'opacity-50' : ''}`}
              title="Pick a random list"
            >
              <Dices size={20} />
            </button>
          </div>
          {dropdownOpen && !running && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute z-50 mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 shadow-lg overflow-hidden">
                {/* Today's Prayers — always first */}
                <button
                  onClick={() => { setSelectedListId(TODAY_ID); setDropdownOpen(false) }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-700 transition-colors ${
                    isToday ? 'text-sky-300' : 'text-slate-200'
                  }`}
                >
                  Today's Prayers
                </button>
                {lists.length > 0 && (
                  <div className="border-t border-slate-700" />
                )}
                {lists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => { setSelectedListId(list.id); setDropdownOpen(false) }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-700 transition-colors ${
                      selectedListId === list.id ? 'text-sky-300' : 'text-slate-200'
                    }`}
                  >
                    {list.name}
                  </button>
                ))}
                {lists.length === 0 && (
                  <div className="px-4 py-3 text-sm text-slate-500 italic">No other lists</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Timebox */}
        <div className="rounded-lg bg-slate-800 border-2 border-sky-300/80 shadow-[0_0_14px_rgba(125,211,252,0.35)] overflow-hidden">
          <div className="flex min-h-[240px]">

            {/* Left: current prayer with description */}
            <div className="flex-1 p-4 overflow-y-auto border-r border-slate-700 break-words">
              {currentPrayer ? (
                <div>
                  {running && (
                    <div className="text-xs text-sky-300 uppercase tracking-wide mb-1">Now praying</div>
                  )}
                  <h3 className="text-lg font-semibold text-slate-100">{currentPrayer.title}</h3>
                  {currentPrayer.description && (
                    <p className="mt-2 text-sm text-slate-300 whitespace-pre-wrap">{currentPrayer.description}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-sm text-slate-500 italic text-center">
                    {selectedListId ? 'No prayers in this list' : 'Select a prayer list'}
                  </div>
                </div>
              )}
            </div>

            {/* Right: timer + controls + settings */}
            <div className="w-48 flex flex-col items-center justify-between p-4">

              {/* Timer */}
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-slate-100 tracking-wider">
                  {formatTime(timeLeft)}
                </div>
                {running && currentPrayer && prayerIncrement > 0 && (
                  <div className="mt-1 text-xs text-slate-500">
                    {formatTime(incrementTimeLeft)}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex gap-2 my-3">
                {!running ? (
                  <button
                    onClick={handleStart}
                    disabled={!selectedListId || prayers.length === 0}
                    className="rounded-full bg-slate-700 p-2.5 text-slate-100 hover:bg-slate-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Start"
                  >
                    <Play size={20} />
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    className="rounded-full bg-slate-700 p-2.5 text-slate-100 hover:bg-slate-600 transition-colors"
                    aria-label="Pause"
                  >
                    <Pause size={20} />
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="rounded-full bg-slate-700 p-2.5 text-slate-400 hover:bg-slate-600 transition-colors"
                  aria-label="Reset"
                >
                  <RotateCcw size={20} />
                </button>
              </div>

              {/* Settings */}
              <div className="w-full space-y-2 pt-2 border-t border-slate-700">
                <div className="flex gap-1 justify-center">
                  <button
                    onClick={() => { if (!running) setTimerMode('until-done') }}
                    className={`rounded px-2 py-0.5 text-xs ${timerMode === 'until-done' ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-400'} ${running ? 'opacity-50' : ''}`}
                  >
                    Full
                  </button>
                  <button
                    onClick={() => { if (!running) setTimerMode('custom') }}
                    className={`rounded px-2 py-0.5 text-xs ${timerMode === 'custom' ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-400'} ${running ? 'opacity-50' : ''}`}
                  >
                    Custom
                  </button>
                </div>
                {timerMode === 'custom' && (
                  <div className="flex items-center gap-1 justify-center">
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={customMinutes}
                      onChange={(e) => { if (!running) setCustomMinutes(Math.max(1, Number(e.target.value))) }}
                      disabled={running}
                      className={`w-12 rounded bg-slate-700 px-1 py-0.5 text-xs text-slate-100 text-center outline-none focus:ring-2 focus:ring-slate-500 ${running ? 'opacity-50' : ''}`}
                    />
                    <span className="text-xs text-slate-400">min</span>
                  </div>
                )}

                <div className="text-center">
                  <div className="text-xs text-slate-500 mb-1">Per prayer</div>
                  <div className="flex items-center gap-1 justify-center">
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={incrementMinutes}
                      onChange={(e) => {
                        if (!running) setPrayerIncrement(Math.max(0, Number(e.target.value)) * 60 + incrementSeconds)
                      }}
                      disabled={running}
                      className={`w-10 rounded bg-slate-700 px-1 py-0.5 text-xs text-slate-100 text-center outline-none focus:ring-2 focus:ring-slate-500 ${running ? 'opacity-50' : ''}`}
                    />
                    <span className="text-xs text-slate-500">:</span>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={incrementSeconds}
                      onChange={(e) => {
                        if (!running) setPrayerIncrement(incrementMinutes * 60 + Math.max(0, Math.min(59, Number(e.target.value))))
                      }}
                      disabled={running}
                      className={`w-10 rounded bg-slate-700 px-1 py-0.5 text-xs text-slate-100 text-center outline-none focus:ring-2 focus:ring-slate-500 ${running ? 'opacity-50' : ''}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Up next — below the timebox */}
        {upcomingPrayers.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-slate-500 uppercase tracking-wide px-1">Up next</div>
            {upcomingPrayers.slice(0, 6).map((prayer, i) => (
              <div
                key={prayer.id}
                className="px-1"
                style={{ opacity: 1 - i * 0.15 }}
              >
                <div className="text-sm text-slate-300">{prayer.title}</div>
              </div>
            ))}
            {upcomingPrayers.length > 6 && (
              <div className="px-1 text-xs text-slate-600">
                +{upcomingPrayers.length - 6} more
              </div>
            )}
          </div>
        )}

        {selectedListId && prayers.length === 0 && (
          <p className="text-sm text-slate-500 italic pt-2">No prayers in this list yet.</p>
        )}
      </div>
    </div>
  )
}
