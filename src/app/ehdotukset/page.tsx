'use client'

import { useStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { STATUS_LABELS, STATUS_COLORS, ProposalStatus, proposalVerseRef, proposalCoversVerse } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import Link from 'next/link'

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'kaikki', label: 'Kaikki' },
  { value: 'keskustelussa', label: 'Keskustelussa' },
  { value: 'seurantaryhman_arvioitavana', label: 'Seurantaryhmän arvioitavana' },
  { value: 'hyvaksytty_tyoryhmassa', label: 'Hyväksytty työryhmässä' },
  { value: 'hyvaksytty_lopullisesti', label: 'Hyväksytty lopullisesti' },
]

export default function ProposalsPage() {
  const router = useRouter()
  const { proposals, users, currentUserId } = useStore()
  const currentUser = users.find(u => u.id === currentUserId)!

  // Default filter per role
  const defaultFilter = currentUser.role === 'seurantaryhma'
    ? 'seurantaryhman_arvioitavana'
    : currentUser.role === 'hallitus'
      ? 'hyvaksytty_tyoryhmassa'
      : 'kaikki'

  const [filter, setFilter] = useState(defaultFilter)

  const filtered = filter === 'kaikki'
    ? proposals
    : proposals.filter(p => p.status === filter)

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.statusChangedAt).getTime() - new Date(a.statusChangedAt).getTime()
  )

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-stone-800">Ehdotukset</h1>
        {currentUser.role === 'kaantaja' && (
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 transition-colors"
          >
            Kirjoitusnäkymä
          </Link>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {STATUS_FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={cn(
              'whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors',
              filter === opt.value
                ? 'bg-stone-200 text-stone-900 font-medium'
                : 'text-stone-600 hover:bg-stone-100'
            )}
          >
            {opt.label}
            <span className="ml-1.5 text-stone-400">
              {opt.value === 'kaikki'
                ? proposals.length
                : proposals.filter(p => p.status === opt.value).length}
            </span>
          </button>
        ))}
      </div>

      {/* Proposals table */}
      {sorted.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          Ei ehdotuksia tässä tilassa.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="text-left px-4 py-3 font-medium text-stone-600">Jae</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600">Ehdottaja</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600">Tila</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 hidden sm:table-cell">Päiviä tilassa</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 hidden sm:table-cell">Kommentit</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(proposal => {
                const author = users.find(u => u.id === proposal.authorId)!
                const daysInState = Math.floor(
                  (Date.now() - new Date(proposal.statusChangedAt).getTime()) / (1000 * 60 * 60 * 24)
                )
                const verseRef = proposalVerseRef(proposal)

                return (
                  <tr
                    key={proposal.id}
                    onClick={() => router.push(`/?verse=${proposal.ranges[0].verseStart}`)}
                    className="border-b border-stone-100 last:border-0 hover:bg-stone-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-stone-800">{verseRef}</td>
                    <td className="px-4 py-3 text-stone-600">{author.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn('text-xs', STATUS_COLORS[proposal.status])}>
                        {STATUS_LABELS[proposal.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-stone-500 hidden sm:table-cell">{daysInState} pv</td>
                    <td className="px-4 py-3 text-stone-500 hidden sm:table-cell">{proposal.comments.length}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
