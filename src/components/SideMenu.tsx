import { X, History, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type SideMenuProps = {
  open: boolean
  onClose: () => void
}

export function SideMenu({ open, onClose }: SideMenuProps) {
  const navigate = useNavigate()

  function goTo(path: string) {
    navigate(path)
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-800 shadow-xl transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100">PrayerCycles</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-700"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-2 space-y-1">
          <button
            onClick={() => goTo('/history')}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <History size={18} />
            Prayer History
          </button>
          <button
            onClick={() => goTo('/export')}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Download size={18} />
            Export / Import
          </button>
        </nav>
      </div>
    </>
  )
}
