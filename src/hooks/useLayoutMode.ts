import { useSyncExternalStore } from 'react'

export type LayoutMode = 'narrow' | 'medium' | 'wide'

const BREAKPOINT_MD = 1152
const BREAKPOINT_LG = 1360

function getMode(): LayoutMode {
  if (typeof window === 'undefined') return 'narrow'
  const w = window.innerWidth
  if (w >= BREAKPOINT_LG) return 'wide'
  if (w >= BREAKPOINT_MD) return 'medium'
  return 'narrow'
}

let listeners: (() => void)[] = []
let cachedMode: LayoutMode = getMode()

function subscribe(cb: () => void) {
  if (listeners.length === 0 && typeof window !== 'undefined') {
    const mqMd = window.matchMedia(`(min-width: ${BREAKPOINT_MD}px)`)
    const mqLg = window.matchMedia(`(min-width: ${BREAKPOINT_LG}px)`)
    const update = () => {
      const next = getMode()
      if (next !== cachedMode) {
        cachedMode = next
        listeners.forEach(l => l())
      }
    }
    mqMd.addEventListener('change', update)
    mqLg.addEventListener('change', update)
    // Store cleanup refs on the subscribe function
    ;(subscribe as any)._cleanup = () => {
      mqMd.removeEventListener('change', update)
      mqLg.removeEventListener('change', update)
    }
  }
  listeners.push(cb)
  return () => {
    listeners = listeners.filter(l => l !== cb)
    if (listeners.length === 0 && (subscribe as any)._cleanup) {
      ;(subscribe as any)._cleanup()
      ;(subscribe as any)._cleanup = null
    }
  }
}

function getSnapshot(): LayoutMode {
  return cachedMode
}

function getServerSnapshot(): LayoutMode {
  return 'narrow'
}

export function useLayoutMode(): LayoutMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
