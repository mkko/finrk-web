'use client'

import { useStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { STATUS_LABELS, STATUS_COLORS, TextWorkStatus, textWorkLabel } from '@/lib/types'
import { getVisibleTextWorks, getOpenCommentCount } from '@/lib/selectors'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const ALL_STATUSES: TextWorkStatus[] = [
  'luonnos',
  'julkaistu_palautteelle',
  'lahetetty_hallitukselle',
  'hyvaksytty',
  'hylatty',
]

export default function ProposalsPage() {
  const router = useRouter()
  const { textWorks, proposals, comments, users, currentUserId } = useStore()
  const currentUser = users.find(u => u.id === currentUserId)
  if (!currentUser) return null

  const visibleTws = getVisibleTextWorks(textWorks, currentUser.role)

  // Hallitus: hide luonnos by default, with toggle
  const [showLuonnokset, setShowLuonnokset] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hallitus-show-luonnokset')
      if (stored === 'true') setShowLuonnokset(true)
    }
  }, [])

  const isHallitus = currentUser.role === 'hallitus'
  const displayTws = isHallitus && !showLuonnokset
    ? visibleTws.filter(tw => tw.status !== 'luonnos')
    : visibleTws

  // Default filter
  const defaultFilter = currentUser.role === 'hallitus'
    ? 'lahetetty_hallitukselle'
    : currentUser.role === 'seurantaryhma'
      ? 'julkaistu_palautteelle'
      : 'kaikki'

  const [filter, setFilter] = useState(defaultFilter)

  const filtered = filter === 'kaikki'
    ? displayTws
    : displayTws.filter(tw => tw.status === filter)

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.statusChangedAt).getTime() - new Date(a.statusChangedAt).getTime()
  )

  // Tab options based on role
  const filterOptions: { value: string; label: string }[] = [
    { value: 'kaikki', label: 'Kaikki' },
    ...ALL_STATUSES
      .filter(s => {
        if (isHallitus && s === 'luonnos' && !showLuonnokset) return false
        if (currentUser.role === 'seurantaryhma' && (s === 'luonnos' || s === 'hylatty')) return false
        return true
      })
      .map(s => ({ value: s, label: STATUS_LABELS[s] })),
  ]

  const pageTitle = currentUser.role === 'tekstiryhma'
    ? 'Tekstit'
    : currentUser.role === 'seurantaryhma'
      ? 'Julkaistut tekstit'
      : 'Hyväksyttävät tekstit'

  return (
    <div className="h-full overflow-y-auto"><div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-stone-800">{pageTitle}</h1>
        <div className="flex items-center gap-3">
          {isHallitus && (
            <label className="flex items-center gap-2 text-sm text-stone-500 cursor-pointer">
              <input
                type="checkbox"
                checked={showLuonnokset}
                onChange={e => {
                  setShowLuonnokset(e.target.checked)
                  localStorage.setItem('hallitus-show-luonnokset', String(e.target.checked))
                }}
                className="h-4 w-4 rounded border-stone-300"
              />
              Näytä myös luonnokset
            </label>
          )}
          {currentUser.role === 'tekstiryhma' && (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 transition-colors"
            >
              Kirjoitusnäkymä
            </Link>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {filterOptions.map(opt => (
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
                ? displayTws.length
                : displayTws.filter(tw => tw.status === opt.value).length}
            </span>
          </button>
        ))}
      </div>

      {/* TextWorks table */}
      {sorted.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          Ei tekstejä tässä tilassa.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="text-left px-4 py-3 font-medium text-stone-600">Teksti</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600">Tila</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 hidden sm:table-cell">Viimeisin toiminta</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 hidden sm:table-cell">Kommentit</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600 hidden sm:table-cell">Äänet</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(tw => {
                const openCount = getOpenCommentCount(comments, tw.id)
                const proposal = tw.submissionProposalId
                  ? proposals.find(p => p.id === tw.submissionProposalId)
                  : undefined
                const voteInfo = proposal
                  ? `${proposal.votes.length}/${proposal.selectedVoters.length}`
                  : '—'
                const daysInState = Math.floor(
                  (Date.now() - new Date(tw.statusChangedAt).getTime()) / (1000 * 60 * 60 * 24)
                )

                return (
                  <tr
                    key={tw.id}
                    onClick={() => {
                      if (tw.scope.chapter === 2) {
                        // Hallitus: go to review page if there's an active proposal
                        if (isHallitus && proposal) {
                          router.push(`/review/${proposal.id}`)
                        } else {
                          router.push('/')
                        }
                      }
                    }}
                    className={cn(
                      'border-b border-stone-100 last:border-0 transition-colors',
                      tw.scope.chapter === 2 ? 'hover:bg-stone-50 cursor-pointer' : 'opacity-60'
                    )}
                  >
                    <td className="px-4 py-3 font-medium text-stone-800">
                      {textWorkLabel(tw)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn('text-xs', STATUS_COLORS[tw.status])}>
                        {STATUS_LABELS[tw.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-stone-500 hidden sm:table-cell">{daysInState} pv sitten</td>
                    <td className="px-4 py-3 text-stone-500 hidden sm:table-cell">
                      {openCount > 0 ? (
                        <span className="text-amber-700">{openCount} avointa</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-stone-500 hidden sm:table-cell">{voteInfo}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div></div>
  )
}
