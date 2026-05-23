import { X, Check } from 'lucide-react'
import { useT, localeLabels, type Locale } from '../i18n'

type LanguageModalProps = {
  open: boolean
  onClose: () => void
}

const locales: Locale[] = ['en', 'ja', 'gsw', 'mn']

export function LanguageModal({ open, onClose }: LanguageModalProps) {
  const { locale, setLocale, t } = useT()

  function pick(l: Locale) {
    setLocale(l)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-overlay sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-card p-6 pb-24 sm:rounded-2xl sm:pb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">{t.languages}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-text-tertiary hover:bg-input"
            aria-label={t.close}
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-1">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => pick(l)}
              className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm transition-colors ${
                locale === l
                  ? 'bg-input-hover text-text'
                  : 'text-text-secondary hover:bg-input'
              }`}
            >
              <span>{localeLabels[l]}</span>
              {locale === l && <Check size={16} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
