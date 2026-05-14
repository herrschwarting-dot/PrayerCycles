import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function TrashPage() {
  const navigate = useNavigate()

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
      <div className="mx-auto max-w-lg">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1 text-sm text-slate-400 hover:text-slate-300"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <h2 className="text-xl font-semibold text-slate-100 mb-4">Deleted Lists</h2>
        <p className="text-sm text-slate-500 italic pt-4">No deleted lists.</p>
      </div>
    </div>
  )
}
