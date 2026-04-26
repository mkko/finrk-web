'use client'

import { useStore } from '@/lib/store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, RotateCcw, DatabaseZap } from 'lucide-react'

export function PersonaSwitcher() {
  const { currentUserId, users, setCurrentUser, resetState, loadDemoData } = useStore()
  const currentUser = users.find(u => u.id === currentUserId)!

  // Show one user per role for switching
  const switchableUsers = [
    users.find(u => u.role === 'kaantaja')!,
    users.find(u => u.role === 'seurantaryhma')!,
    users.find(u => u.role === 'hallitus')!,
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-stone-100 transition-colors focus:outline-none">
        <span className="font-medium">{currentUser.roleLabel}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {switchableUsers.map(user => (
          <DropdownMenuItem
            key={user.id}
            onClick={() => setCurrentUser(user.id)}
            className="flex justify-between py-3 cursor-pointer"
          >
            <span className="font-medium">{user.roleLabel}</span>
            {user.id === currentUserId && (
              <span className="text-muted-foreground text-sm">nykyinen</span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => loadDemoData()}
          className="text-muted-foreground py-3 cursor-pointer"
        >
          <DatabaseZap className="h-4 w-4 mr-2" />
          Lataa esimerkkidata
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => resetState()}
          className="text-muted-foreground py-3 cursor-pointer"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Tyhjennä data
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
