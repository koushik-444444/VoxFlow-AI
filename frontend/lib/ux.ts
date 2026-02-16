export function triggerHaptic(pattern: number | number[] = 10) {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    try {
      window.navigator.vibrate(pattern)
    } catch (e) {
      // Ignore vibration errors (unsupported browsers)
    }
  }
}

export type ThemeMood = 'calm' | 'creative' | 'warning' | 'neutral'

export function updateThemeMood(mood: ThemeMood) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  switch (mood) {
    case 'calm':
      root.style.setProperty('--ambient-color-1', 'rgba(75, 144, 255, 0.2)')
      root.style.setProperty('--ambient-color-2', 'rgba(167, 139, 250, 0.15)')
      break
    case 'creative':
      root.style.setProperty('--ambient-color-1', 'rgba(167, 139, 250, 0.25)')
      root.style.setProperty('--ambient-color-2', 'rgba(255, 143, 171, 0.2)')
      break
    case 'warning':
      root.style.setProperty('--ambient-color-1', 'rgba(255, 100, 100, 0.2)')
      root.style.setProperty('--ambient-color-2', 'rgba(255, 150, 0, 0.15)')
      break
    default:
      root.style.setProperty('--ambient-color-1', 'rgba(75, 144, 255, 0.15)')
      root.style.setProperty('--ambient-color-2', 'rgba(167, 139, 250, 0.1)')
  }
}
