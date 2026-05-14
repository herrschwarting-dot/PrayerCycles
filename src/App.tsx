import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { SearchBar } from './components/SearchBar'
import { BottomNav } from './components/BottomNav'
import { SideMenu } from './components/SideMenu'
import { AddModal } from './components/AddModal'
import { TimerProvider } from './context/TimerContext'
import { TodayPage } from './routes/TodayPage'
import { ListsPage } from './routes/ListsPage'
import { ListDetailPage } from './routes/ListDetailPage'
import { TimerPage } from './routes/TimerPage'
import { HistoryPage } from './routes/HistoryPage'
import { ExportPage } from './routes/ExportPage'

export function App() {
  const [addOpen, setAddOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <BrowserRouter basename="/PrayerCycles">
      <TimerProvider>
      <div className="flex min-h-screen flex-col bg-slate-900 text-slate-100">
        <SearchBar onMenuOpen={() => setMenuOpen(true)} />
        <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/lists" element={<ListsPage />} />
          <Route path="/lists/:id" element={<ListDetailPage />} />
          <Route path="/timer" element={<TimerPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/export" element={<ExportPage />} />
        </Routes>

        <button
          onClick={() => setAddOpen(true)}
          className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-slate-600 text-white shadow-lg hover:bg-slate-500"
          aria-label="Add"
        >
          <Plus size={24} />
        </button>

        <AddModal open={addOpen} onClose={() => setAddOpen(false)} onAdded={() => window.dispatchEvent(new Event('prayercycles:refresh'))} />
        <BottomNav />
      </div>
      </TimerProvider>
    </BrowserRouter>
  )
}

export default App
