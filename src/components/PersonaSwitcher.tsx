'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { UserSelectionModal } from './UserSelectionModal'
import { ChevronDown } from 'lucide-react'

export function PersonaSwitcher() {
  const { currentUserId, users } = useStore()
  const currentUser = users.find(u => u.id === currentUserId)
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-stone-100 transition-colors"
      >
        <span className="font-medium">{currentUser?.name ?? 'Valitse käyttäjä'}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
      <UserSelectionModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
