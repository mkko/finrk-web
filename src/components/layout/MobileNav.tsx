'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const pathname = usePathname()
  const { currentUserId, users } = useStore()
  const currentUser = users.find(u => u.id === currentUserId)
  if (!currentUser) return null

  const ehdotuksetLabel = currentUser.role === 'tekstiryhma'
    ? 'Tekstit'
    : currentUser.role === 'seurantaryhma'
      ? 'Julkaistut tekstit'
      : 'Hyväksyttävät tekstit'

  const items = [
    { href: '/', label: 'Luku' },
    ...(currentUser.role === 'tekstiryhma' ? [{ href: '/lahetys', label: 'Tarkistus' }] : []),
    { href: '/ehdotukset', label: ehdotuksetLabel },
    { href: '/edistyminen', label: 'Edistyminen' },
    ...(currentUser.role === 'seurantaryhma' ? [{ href: '/seurantaryhma', label: 'Arviointi' }] : []),
    ...(currentUser.role === 'hallitus' ? [{ href: '/hallitus', label: 'Ratifiointi' }] : []),
  ]

  return (
    <nav className="sm:hidden border-b border-stone-200 bg-white overflow-x-auto">
      <div className="flex px-4 gap-1">
        {items.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors',
              pathname === item.href || (item.href === '/hallitus' && pathname.startsWith('/review/'))
                ? 'bg-stone-100 text-stone-900 font-medium'
                : 'text-stone-600 hover:text-stone-900'
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
