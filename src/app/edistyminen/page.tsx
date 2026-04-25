'use client'

import { useStore } from '@/lib/store'
import { STATUS_LABELS, STATUS_INDICATOR_COLORS, ProposalStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const STATUS_ORDER: ProposalStatus[] = [
  'keskustelussa',
  'seurantaryhman_arvioitavana',
  'hyvaksytty_tyoryhmassa',
  'hyvaksytty_lopullisesti',
]

export default function ProgressPage() {
  const { verses, proposals, activity, users } = useStore()

  const totalVerses = verses.length
  const ratifiedVerses = new Set(
    proposals
      .filter(p => p.status === 'hyvaksytty_lopullisesti')
      .flatMap(p =>
        p.ranges.flatMap(r => {
          const nums: number[] = []
          for (let i = r.verseStart; i <= r.verseEnd; i++) nums.push(i)
          return nums
        })
      )
  ).size

  const statusCounts = STATUS_ORDER.map(status => ({
    status,
    count: proposals.filter(p => p.status === status).length,
  }))

  const recentActivity = activity.slice(0, 10)

  return (
    <div className="h-full overflow-y-auto"><div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <h1 className="text-xl font-semibold text-stone-800 mb-6">Edistyminen</h1>

      {/* Progress bar */}
      <div className="bg-white rounded-lg border border-stone-200 p-6 mb-6">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-medium text-stone-800">Lopullisesti hyväksytyt jakeet</h2>
          <span className="text-2xl font-semibold text-stone-800">
            {ratifiedVerses} / {totalVerses}
          </span>
        </div>
        <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-500"
            style={{ width: `${(ratifiedVerses / totalVerses) * 100}%` }}
          />
        </div>
        <p className="text-sm text-stone-500 mt-2">
          {totalVerses - ratifiedVerses} jaetta odottaa vielä käsittelyä
        </p>
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
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

      {/* Recent activity */}
      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200">
          <h2 className="font-medium text-stone-800">Viimeaikainen toiminta</h2>
        </div>
        {recentActivity.length === 0 ? (
          <div className="px-6 py-8 text-center text-stone-400">
            Ei vielä toimintaa.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {recentActivity.map(entry => {
              const user = users.find(u => u.id === entry.userId)
              return (
                <div key={entry.id} className="px-6 py-3 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-stone-300 mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-700">
                      <span className="font-medium">{user?.name ?? 'Tuntematon'}</span>
                      {' — '}
                      {entry.detail}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {new Date(entry.timestamp).toLocaleDateString('fi-FI', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div></div>
  )
}
