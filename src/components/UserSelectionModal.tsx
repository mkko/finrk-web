'use client'

import { useStore } from '@/lib/store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RotateCcw, DatabaseZap } from 'lucide-react'
import { cn } from '@/lib/utils'

const ROLE_ORDER = ['tekstiryhma', 'hallitus', 'seurantaryhma'] as const
const ROLE_LABELS: Record<string, string> = {
  tekstiryhma: 'Tekstiryhmä',
  seurantaryhma: 'Seurantaryhmä',
  hallitus: 'Hallitus',
}

interface UserSelectionModalProps {
  open: boolean
  onClose: () => void
  dismissable?: boolean
}

export function UserSelectionModal({ open, onClose, dismissable = true }: UserSelectionModalProps) {
  const { currentUserId, users, setCurrentUser, resetState, loadDemoData } = useStore()

  function selectUser(userId: string) {
    setCurrentUser(userId)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v && dismissable) onClose() }}>
      <DialogContent className="sm:max-w-lg" showCloseButton={dismissable}>
        <DialogHeader>
          <DialogTitle>Valitse käyttäjä</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {ROLE_ORDER.map(role => {
            const roleUsers = users.filter(u => u.roles.includes(role))
            if (roleUsers.length === 0) return null
            return (
              <div key={role}>
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">
                  {ROLE_LABELS[role]}
                </p>
                <div className="space-y-1">
                  {roleUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => selectUser(user.id)}
                      className={cn(
                        'w-full text-left rounded-md border px-4 py-2.5 text-sm transition-colors',
                        user.id === currentUserId
                          ? 'border-stone-400 bg-stone-100 font-medium text-stone-900'
                          : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-stone-700'
                      )}
                    >
                      <span className="font-medium">{user.name}</span>
                      {user.roleLabel && (
                        <span className="ml-2 text-xs text-stone-400">({user.roleLabel})</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-2 pt-2 border-t border-stone-200">
          <Button
            variant="outline"
            size="sm"
            className="text-stone-500"
            onClick={() => { loadDemoData(); onClose() }}
          >
            <DatabaseZap className="h-4 w-4 mr-1.5" />
            Lataa esimerkkidata
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-stone-500"
            onClick={() => resetState()}
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Tyhjennä data
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
