const KEY = 'prayercycles_devmode'

export function isDevMode(): boolean {
  return localStorage.getItem(KEY) === 'true'
}

export function setDevMode(on: boolean): void {
  localStorage.setItem(KEY, on ? 'true' : 'false')
}
