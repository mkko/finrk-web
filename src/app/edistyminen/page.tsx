'use client'

import { useStore } from '@/lib/store'
import { STATUS_LABELS, STATUS_INDICATOR_COLORS, TextWorkStatus } from '@/lib/types'
import { getVisibleTextWorks } from '@/lib/selectors'
import { cn } from '@/lib/utils'

const STATUS_ORDER: TextWorkStatus[] = [
  'luonnos',
  'julkaistu_palautteelle',
  'lahetetty_hallitukselle',
  'hyvaksytty',
  'hylatty',
]

export default function ProgressPage() {
  const { textWorks, users, currentUserId } = useStore()
  const currentUser = users.find(u => u.id === currentUserId)
  if (!currentUser) return null

  const visibleTws = getVisibleTextWorks(textWorks, currentUser.roles)

  const totalTextWorks = visibleTws.length
  const approvedCount = visibleTws.filter(tw => tw.status === 'hyvaksytty').length

  const statusCounts = STATUS_ORDER
    .filter(s => {
      if (currentUser.roles.includes('seurantaryhma') && !currentUser.roles.includes('tekstiryhma') && (s === 'luonnos' || s === 'hylatty')) return false
      return true
    })
    .map(status => ({
      status,
      count: visibleTws.filter(tw => tw.status === status).length,
    }))

  return (
    <div className="h-full overflow-y-auto"><div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <h1 className="text-xl font-semibold text-stone-800 mb-6">Edistyminen</h1>

      {/* Progress bar */}
      <div className="bg-white rounded-lg border border-stone-200 p-6 mb-6">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-medium text-stone-800">Hyväksytyt tekstit</h2>
          <span className="text-2xl font-semibold text-stone-800">
            {approvedCount} / {totalTextWorks}
          </span>
        </div>
        <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-500"
            style={{ width: totalTextWorks > 0 ? `${(approvedCount / totalTextWorks) * 100}%` : '0%' }}
          />
        </div>
        <p className="text-sm text-stone-500 mt-2">
          {totalTextWorks - approvedCount} tekstiä odottaa vielä käsittelyä
        </p>
      </div>

      {/* Status breakdown */}
      <div className={cn('grid gap-3 mb-6', `grid-cols-2 sm:grid-cols-${Math.min(statusCounts.length, 5)}`)}>
        {statusCounts.map(({ status, count }) => (
          <div key={status} className="bg-white rounded-lg border border-stone-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('w-2.5 h-2.5 rounded-full', STATUS_INDICATOR_COLORS[status])} />
              <span className="text-xs text-stone-500">{STATUS_LABELS[status]}</span>
            </div>
            <span className="text-2xl font-semibold text-stone-800">{count}</span>
          </div>
        ))}
      </div>
    </div></div>
  )
}
