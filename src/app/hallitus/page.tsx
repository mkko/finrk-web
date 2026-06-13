'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { STATUS_LABELS, STATUS_COLORS, textWorkLabel } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'

export default function HallitusPage() {
  const router = useRouter()
  const { textWorks, proposals, users, currentUserId, castVote } = useStore()
  const currentUser = users.find(u => u.id === currentUserId)!
  const [rejectTexts, setRejectTexts] = useState<Record<string, string>>({})
  const [showReject, setShowReject] = useState<Record<string, boolean>>({})
  const [showLuonnokset, setShowLuonnokset] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hallitus-show-luonnokset')
      if (stored === 'true') setShowLuonnokset(true)
    }
  }, [])

  if (currentUser.role !== 'hallitus') {
    return (
      <div className="h-full overflow-y-auto"><div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <p className="text-stone-500">Tämä näkymä on tarkoitettu hallituksen jäsenille.</p>
      </div></div>
    )
  }

  // TextWorks where current user is a selected voter
  const myVoterProposals = proposals.filter(p =>
    p.selectedVoters.includes(currentUserId)
  )
  const myTwIds = new Set(myVoterProposals.map(p => p.textWorkId))

  // Show voter-relevant TextWorks + optionally luonnokset
  const displayTws = textWorks.filter(tw => {
    if (myTwIds.has(tw.id)) return true
    if (showLuonnokset) return true
    return tw.status !== 'luonnos'
  })

  const sorted = [...displayTws].sort(
    (a, b) => new Date(b.statusChangedAt).getTime() - new Date(a.statusChangedAt).getTime()
  )

  return (
    <div className="h-full overflow-y-auto"><div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold text-stone-800">Hallituksen hyväksyntä</h1>
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
      </div>
      <p className="text-sm text-stone-500 mb-6">
        Alla olevat tekstit odottavat hallituksen käsittelyä.
      </p>

      {sorted.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          Ei käsiteltäviä tekstejä tällä hetkellä.
        </div>
      ) : (
        <div className="space-y-6">
          {sorted.map(tw => {
            const proposal = myVoterProposals.find(p => p.textWorkId === tw.id)
            const currentUserVote = proposal?.votes.find(v => v.userId === currentUserId)
            const rejectText = proposal ? (rejectTexts[proposal.id] || '') : ''
            const isMyVoterItem = proposal && proposal.selectedVoters.includes(currentUserId)

            return (
              <div key={tw.id} className="bg-white rounded-lg border border-stone-200 overflow-hidden">
                <div className="px-6 py-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3
                        className={cn(
                          'font-medium text-stone-800',
                          proposal && 'cursor-pointer hover:text-stone-600'
                        )}
                        onClick={() => proposal && router.push(`/review/${proposal.id}`)}
                      >
                        {textWorkLabel(tw)}
                      </h3>
                      {proposal && (
                        <p className="text-sm text-stone-500 mt-0.5">
                          Lähetetty {new Date(proposal.createdAt).toLocaleDateString('fi-FI')}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className={cn('text-xs', STATUS_COLORS[tw.status])}>
                      {STATUS_LABELS[tw.status]}
                    </Badge>
                  </div>

                  {/* Review link */}
                  {proposal && (
                    <button
                      onClick={() => router.push(`/review/${proposal.id}`)}
                      className="text-sm text-violet-700 hover:text-violet-900 font-medium"
                    >
                      Katso muutokset →
                    </button>
                  )}

                  {/* Rationale */}
                  {proposal?.rationale && (
                    <p className="text-sm text-stone-600 bg-stone-50 rounded-md p-3">
                      {proposal.rationale}
                    </p>
                  )}

                  {/* Voting progress */}
                  {proposal && tw.status === 'lahetetty_hallitukselle' && (
                    <div className="rounded-md border border-violet-200 bg-violet-50/50 p-3 space-y-2">
                      <p className="text-sm font-medium text-violet-800">
                        Äänestys: {proposal.votes.length}/{proposal.selectedVoters.length} äänestänyt
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {proposal.selectedVoters.map(voterId => {
                          const voter = users.find(u => u.id === voterId)
                          const vote = proposal.votes.find(v => v.userId === voterId)
                          return (
                            <span
                              key={voterId}
                              className={cn(
                                'inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full',
                                vote
                                  ? vote.decision === 'approve'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-red-100 text-red-800'
                                  : 'bg-stone-100 text-stone-500'
                              )}
                            >
                              {voter?.name ?? 'Tuntematon'}
                              {vote && (vote.decision === 'approve' ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />)}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Vote result for resolved */}
                  {proposal && (tw.status === 'hyvaksytty' || tw.status === 'hylatty') && (
                    <div className={cn(
                      'rounded-md border p-3 text-sm',
                      tw.status === 'hyvaksytty' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'
                    )}>
                      {tw.status === 'hyvaksytty' ? 'Hyväksytty yksimielisesti' : 'Hylätty'}
                      {proposal.votes.filter(v => v.decision === 'reject' && v.comment).map((v, i) => {
                        const voter = users.find(u => u.id === v.userId)
                        return (
                          <p key={i} className="mt-1 text-xs">
                            {voter?.name}: {v.comment}
                          </p>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Voting actions */}
                {isMyVoterItem && tw.status === 'lahetetty_hallitukselle' && !currentUserVote && proposal && (
                  <div className="border-t border-stone-200 px-6 py-4">
                    {showReject[proposal.id] ? (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Perustele hylkäys..."
                          value={rejectText}
                          onChange={e => setRejectTexts({ ...rejectTexts, [proposal.id]: e.target.value })}
                          className="min-h-[60px] text-sm resize-none"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowReject({ ...showReject, [proposal.id]: false })}
                          >
                            Peruuta
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-700"
                            onClick={() => {
                              if (rejectText.trim()) {
                                castVote(proposal.id, 'reject', rejectText.trim())
                                setRejectTexts({ ...rejectTexts, [proposal.id]: '' })
                                setShowReject({ ...showReject, [proposal.id]: false })
                              }
                            }}
                            disabled={!rejectText.trim()}
                          >
                            Hylkää
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-700"
                          onClick={() => setShowReject({ ...showReject, [proposal.id]: true })}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Hylkää
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => castVote(proposal.id, 'approve')}
                          className="ml-auto bg-emerald-700 hover:bg-emerald-600"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Hyväksy
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {isMyVoterItem && currentUserVote && (
                  <div className="border-t border-stone-200 px-6 py-4">
                    <p className="text-sm text-violet-700 flex items-center gap-1">
                      <Check className="h-4 w-4" />
                      Olet äänestänyt: {currentUserVote.decision === 'approve' ? 'Hyväksy' : 'Hylkää'}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div></div>
  )
}
