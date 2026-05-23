export type ThemeId = 'slate' | 'nuudelchin' | 'altan' | 'tal' | 'tug' | 'khentii'

export type ThemeGroup = 'default' | 'mongolian'

export type ThemeDef = {
  id: ThemeId
  /** Display name (localized via i18n) */
  labelKey: string
  /** Preview swatch colors: [base, card, accent] */
  swatches: [string, string, string]
  /** Which group this theme belongs to */
  group: ThemeGroup
}

export const themeGroups: { id: ThemeGroup; labelKey: string }[] = [
  { id: 'default', labelKey: '' },
  { id: 'mongolian', labelKey: 'themeGroupMongolian' },
]

export const themes: ThemeDef[] = [
  {
    id: 'slate',
    labelKey: 'themeSlate',
    swatches: ['#0f172a', '#1e293b', '#0ea5e9'],
    group: 'default',
  },
  {
    id: 'nuudelchin',
    labelKey: 'themeNuudelchin',
    swatches: ['#1a1209', '#2a1f11', '#c8902e'],
    group: 'mongolian',
  },
  {
    id: 'altan',
    labelKey: 'themeAltan',
    swatches: ['#0a0e1e', '#121832', '#d4a42c'],
    group: 'mongolian',
  },
  {
    id: 'tal',
    labelKey: 'themeTal',
    swatches: ['#0c1410', '#162118', '#6aad5a'],
    group: 'mongolian',
  },
  {
    id: 'tug',
    labelKey: 'themeTug',
    swatches: ['#041a38', '#0a2650', '#c4272f'],
    group: 'mongolian',
  },
  {
    id: 'khentii',
    labelKey: 'themeKhentii',
    swatches: ['#0b1214', '#13202a', '#3a9e8a'],
    group: 'mongolian',
  },
]

const STORAGE_KEY = 'prayercycles-theme'

export function getSavedTheme(): ThemeId {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && themes.some((t) => t.id === saved)) return saved as ThemeId
  return 'slate'
}

export function saveTheme(id: ThemeId) {
  localStorage.setItem(STORAGE_KEY, id)
}

export function applyTheme(id: ThemeId) {
  if (id === 'slate') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', id)
  }
  saveTheme(id)
}
