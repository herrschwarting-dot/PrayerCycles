import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { TimerBar } from './components/TimerBar'
import { BottomNav } from './components/BottomNav'
import { SideMenu } from './components/SideMenu'
import { AddModal } from './components/AddModal'
import { TimerProvider } from './context/TimerContext'
import { TapPrayPage } from './routes/TapPrayPage'
import { ListsPage } from './routes/ListsPage'
import { ListDetailPage } from './routes/ListDetailPage'
import { TimerPage } from './routes/TimerPage'
import { HistoryPage } from './routes/HistoryPage'
import { ExportPage } from './routes/ExportPage'
import { TrashPage } from './routes/TrashPage'

function AppContent() {
  const [addOpen, setAddOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
      <TimerProvider>
      <div className="flex min-h-screen flex-col bg-slate-900 text-slate-100">
        <TimerBar onMenuOpen={() => setMenuOpen(true)} />
        <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
        <Routes>
          <Route path="/" element={<TapPrayPage />} />
          <Route path="/lists" element={<ListsPage />} />
          <Route path="/lists/:id" element={<ListDetailPage />} />
          <Route path="/timer" element={<TimerPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/export" element={<ExportPage />} />
          <Route path="/trash" element={<TrashPage />} />
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
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
