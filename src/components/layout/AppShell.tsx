'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { UserSelectionModal } from '@/components/UserSelectionModal'

export function AppShell({ children }: { children: React.ReactNode }) {
  const currentUserId = useStore(s => s.currentUserId)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  // Don't flash the modal during SSR/hydration
  if (!hydrated) return <>{children}</>

  const needsSelection = !currentUserId

  return (
    <>
      {children}
      <UserSelectionModal
        open={needsSelection}
        onClose={() => {}}
        dismissable={false}
      />
    </>
  )
}
