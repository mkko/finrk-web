'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PersonaSwitcher } from '@/components/PersonaSwitcher'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function Header() {
  const pathname = usePathname()
  const { currentUserId, users } = useStore()
  const currentUser = users.find(u => u.id === currentUserId)!

  const ehdotuksetLabel = currentUser.role === 'tekstiryhma'
    ? 'Tekstit'
    : currentUser.role === 'seurantaryhma'
      ? 'Julkaistut tekstit'
      : 'Hyväksyttävät tekstit'

  const navItems = [
    { href: '/', label: 'Luku' },
    { href: '/ehdotukset', label: ehdotuksetLabel },
    { href: '/edistyminen', label: 'Edistyminen' },
  ]

  // Role-specific nav items
  const roleItems = currentUser.role === 'seurantaryhma'
    ? [{ href: '/seurantaryhma', label: 'Arviointi' }]
    : currentUser.role === 'hallitus'
      ? [{ href: '/hallitus', label: 'Ratifiointi' }]
      : []

  const allItems = [...navItems, ...roleItems]

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-base font-semibold text-stone-800 tracking-tight">
              Raamatun käännöstyökalu
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              {allItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm transition-colors',
                    pathname === item.href
                      ? 'bg-stone-100 text-stone-900 font-medium'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <PersonaSwitcher />
        </div>
      </div>
    </header>
  )
}
