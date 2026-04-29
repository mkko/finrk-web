'use client'

import { useStore } from '@/lib/store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, RotateCcw, DatabaseZap } from 'lucide-react'

const ROLE_ORDER = ['kaantaja', 'hallitus', 'seurantaryhma'] as const
const ROLE_LABELS: Record<string, string> = {
  kaantaja: 'Kääntäjät',
  seurantaryhma: 'Seurantaryhmä',
  hallitus: 'Hallitus',
}

export function PersonaSwitcher() {
  const { currentUserId, users, setCurrentUser, resetState, loadDemoData } = useStore()
  const currentUser = users.find(u => u.id === currentUserId)!

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-stone-100 transition-colors focus:outline-none">
        <span className="font-medium">{currentUser.name}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {ROLE_ORDER.map((role, ri) => {
          const roleUsers = users.filter(u => u.role === role)
          return (
            <DropdownMenuGroup key={role}>
              {ri > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {ROLE_LABELS[role]}
              </DropdownMenuLabel>
              {roleUsers.map(user => (
                <DropdownMenuItem
                  key={user.id}
                  onClick={() => setCurrentUser(user.id)}
                  className="flex justify-between py-2 cursor-pointer"
                >
                  <span className="font-medium">{user.name}</span>
                  {user.id === currentUserId && (
                    <span className="text-muted-foreground text-sm">valittu</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          )
        })}
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
