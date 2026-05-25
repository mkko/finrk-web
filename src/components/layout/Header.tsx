'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PersonaSwitcher } from '@/components/PersonaSwitcher'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Luku' },
  { href: '/ehdotukset', label: 'Ehdotukset' },
  { href: '/edistyminen', label: 'Edistyminen' },
]

function VersionTabs() {
  const { appVersion, setAppVersion } = useStore()
  return (
    <div className="border-b border-stone-100 bg-stone-50">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 flex items-center gap-0.5 h-9">
        <button
          onClick={() => setAppVersion('1.0')}
          className={cn(
            'text-xs px-3 py-1 -mb-px relative z-10 rounded-t transition-colors',
            appVersion === '1.0'
              ? 'font-semibold text-stone-800 bg-white border border-stone-200 border-b-white'
              : 'text-stone-400 hover:text-stone-600'
          )}
        >
          Versio 1.0
        </button>
        <button
          onClick={() => setAppVersion('2.0')}
          className={cn(
            'text-xs px-3 py-1 -mb-px relative z-10 rounded-t transition-colors',
            appVersion === '2.0'
              ? 'font-semibold text-stone-800 bg-white border border-stone-200 border-b-white'
              : 'text-stone-400 hover:text-stone-600'
          )}
        >
          Versio 2.0
        </button>
      </div>
    </div>
  )
}

export function Header() {
  const pathname = usePathname()
  const { currentUserId, users } = useStore()
  const currentUser = users.find(u => u.id === currentUserId)!

  // Role-specific nav items
  const roleItems = currentUser.role === 'seurantaryhma'
    ? [{ href: '/seurantaryhma', label: 'Arviointi' }]
    : currentUser.role === 'hallitus'
      ? [{ href: '/hallitus', label: 'Ratifiointi' }]
      : []

  const allItems = [...NAV_ITEMS, ...roleItems]

  return (
    <header className="border-b border-stone-200 bg-white">
      {/* Version tabs */}
      <VersionTabs />
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
