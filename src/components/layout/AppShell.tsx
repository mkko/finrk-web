'use client'

import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { UserSelectionModal } from '@/components/UserSelectionModal'

const AppShellContext = createContext<{ openUserModal: () => void }>({ openUserModal: () => {} })

export function useAppShell() {
  return useContext(AppShellContext)
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const currentUserId = useStore(s => s.currentUserId)
  const [hydrated, setHydrated] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  const openUserModal = useCallback(() => setManualOpen(true), [])

  if (!hydrated) return <>{children}</>

  const needsSelection = !currentUserId
  const isOpen = needsSelection || manualOpen

  return (
    <AppShellContext.Provider value={{ openUserModal }}>
      {needsSelection ? null : children}
      <UserSelectionModal
        open={isOpen}
        onClose={() => setManualOpen(false)}
        dismissable={!needsSelection}
      />
    </AppShellContext.Provider>
  )
}
