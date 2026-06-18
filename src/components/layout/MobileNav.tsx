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

  const roles = currentUser.roles

  const ehdotuksetLabel = roles.includes('tekstiryhma')
    ? 'Tekstit'
    : roles.includes('seurantaryhma')
      ? 'Julkaistut tekstit'
      : 'Käsittelyssä'

  const items = [
    { href: '/', label: 'Luku' },
    ...(roles.includes('tekstiryhma') ? [{ href: '/lahetys', label: 'Ehdota' }] : []),
    { href: '/ehdotukset', label: ehdotuksetLabel },
    { href: '/edistyminen', label: 'Edistyminen' },
    ...(roles.includes('seurantaryhma') ? [{ href: '/seurantaryhma', label: 'Arviointi' }] : []),
    ...(roles.includes('hallitus') ? [{ href: '/hallitus', label: 'Ratifiointi' }] : []),
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
