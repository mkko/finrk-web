'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { getCurrentTextWork } from '@/lib/selectors'
import { textWorkLabel } from '@/lib/types'
import { WordDiff } from '@/components/chapter/VersionHistory'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Check, X, ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'

type View = 'list' | 'new'

export default function LahetysPage() {
  const verses = useStore(s => s.verses)
  const textWorks = useStore(s => s.textWorks)
  const proposals = useStore(s => s.proposals)
  const submitToHallitus = useStore(s => s.submitToHallitus)
  const currentUserId = useStore(s => s.currentUserId)
  const users = useStore(s => s.users)
  const currentUser = users.find(u => u.id === currentUserId)
  if (!currentUser) return null
  const currentTw = getCurrentTextWork(textWorks)

  const [view, setView] = useState<View>('list')
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set())
  if (currentUser.role !== 'tekstiryhma') {
    return (
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
          <p className="text-stone-500">Tämä näkymä on tarkoitettu tekstiryhmän jäsenille.</p>
        </div>
      </div>
    )
  }

  // Proposals sorted newest first
  const sortedProposals = [...proposals].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // Verses with published changes (baseText !== approvedText)
  const unreviewedVerses = verses.filter(v => v.baseText !== v.approvedText)

  const toggleVerse = (num: number) => {
    setSelectedVerses(prev => {
      const next = new Set(prev)
      if (next.has(num)) next.delete(num)
      else next.add(num)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedVerses.size === unreviewedVerses.length) {
      setSelectedVerses(new Set())
    } else {
      setSelectedVerses(new Set(unreviewedVerses.map(v => v.number)))
    }
  }

  const selectedList = unreviewedVerses.filter(v => selectedVerses.has(v.number))

  const hallitusMembers = users.filter(u => u.role === 'hallitus')

  function handleSubmit() {
    if (!currentTw || selectedList.length === 0) return
    const allHallitusIds = hallitusMembers.map(u => u.id)
    submitToHallitus(currentTw.id, allHallitusIds, '', [...selectedVerses])
    setSelectedVerses(new Set())
    setView('list')
  }

  // ── New submission view ──
  if (view === 'new') {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-none border-b border-stone-200 bg-white px-4 sm:px-6 py-2">
          <div className="mx-auto max-w-5xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setView('list'); setSelectedVerses(new Set()) }}
                className="text-stone-400 hover:text-stone-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-stone-800">Uusi lähetys</h1>
                <p className="text-sm text-stone-500 mt-0.5">
                  Valitse jakeet ja lähetä hallituksen tarkistettavaksi.
                </p>
              </div>
            </div>
            {selectedList.length > 0 && (
              <Button onClick={handleSubmit}>
                Lähetä hallitukselle
              </Button>
            )}
          </div>
        </div>

        {unreviewedVerses.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="text-sm text-stone-400">Ei julkaistuja muutoksia lähetettäväksi.</p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex">
            {/* Left panel: verse checklist */}
            <div className="w-72 shrink-0 border-r border-stone-200 overflow-y-auto bg-stone-50">
              <div className="p-3 space-y-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                    Muuttuneet jakeet ({unreviewedVerses.length})
                  </p>
                  <button
                    onClick={toggleAll}
                    className="text-xs text-stone-500 hover:text-stone-700"
                  >
                    {selectedVerses.size === unreviewedVerses.length ? 'Poista valinnat' : 'Valitse kaikki'}
                  </button>
                </div>
                {unreviewedVerses.map(v => (
                  <label
                    key={v.number}
                    className={cn(
                      'flex items-start gap-2 rounded-md px-3 py-2 text-xs cursor-pointer transition-colors',
                      selectedVerses.has(v.number)
                        ? 'bg-violet-50 border border-violet-200'
                        : 'hover:bg-white/60'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedVerses.has(v.number)}
                      onChange={() => toggleVerse(v.number)}
                      className="mt-0.5 h-4 w-4 rounded border-stone-300"
                    />
                    <div className="min-w-0">
                      <span className="font-medium text-stone-700">Jae {v.number}</span>
                      <p className="text-stone-400 truncate mt-0.5">
                        {v.approvedText.slice(0, 60)}…
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Right panel: diff preview */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedList.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-stone-400">
                    Valitse jakeet vasemmalta nähdäksesi muutokset.
                  </p>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-4">
                  <div className="text-xs text-stone-400 mb-4">
                    {selectedList.length} {selectedList.length === 1 ? 'jae' : 'jaetta'} valittu
                  </div>
                  <div
                    className="bg-white border border-stone-300 shadow-md font-serif text-base leading-7 text-stone-800 rounded-lg"
                    style={{ padding: '40px 50px' }}
                  >
                    {selectedList.map(v => (
                      <p key={v.number} className="mb-1">
                        <span
                          className="text-xs text-stone-400 font-sans"
                          style={{ verticalAlign: 'super', fontSize: '0.65em', lineHeight: 0 }}
                        >
                          {v.number}
                        </span>{' '}
                        <WordDiff oldText={v.approvedText} newText={v.baseText} />
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    )
  }

  // ── Proposal list view (landing) ──
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-stone-800">Tarkistus</h1>
            <p className="text-sm text-stone-500 mt-1">
              Hallitukselle lähetetyt ehdotukset ja niiden käsittelytilanne.
            </p>
          </div>
          {unreviewedVerses.length > 0 && (
            <Button onClick={() => setView('new')}>
              <Plus className="h-4 w-4 mr-1" />
              Uusi lähetys
            </Button>
          )}
        </div>

        {sortedProposals.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-stone-400 mb-4">Ei vielä lähetettyjä ehdotuksia.</p>
            {unreviewedVerses.length > 0 && (
              <Button variant="outline" onClick={() => setView('new')}>
                <Plus className="h-4 w-4 mr-1" />
                Lähetä ensimmäinen ehdotus
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedProposals.map(proposal => {
              const tw = textWorks.find(t => t.id === proposal.textWorkId)
              if (!tw) return null
              const isCancelled = !!proposal.cancelledAt
              const isResolved = !!proposal.resolvedAt
              const isApproved = isResolved && proposal.votes.every(v => v.decision === 'approve')
              const isRejected = isResolved && !isApproved

              const statusLabel = isCancelled ? 'Peruutettu'
                : isApproved ? 'Hyväksytty'
                : isRejected ? 'Hylätty'
                : 'Käsittelyssä'
              const statusColor = isCancelled ? 'bg-stone-100 text-stone-600 border-stone-300'
                : isApproved ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : isRejected ? 'bg-red-50 text-red-800 border-red-300'
                : 'bg-violet-50 text-violet-800 border-violet-300'

              const verseLabel = proposal.selectedVerses && proposal.selectedVerses.length > 0
                ? `Jakeet ${proposal.selectedVerses.join(', ')}`
                : 'Kaikki jakeet'

              return (
                <Link
                  key={proposal.id}
                  href={`/review/${proposal.id}`}
                  className="block bg-white rounded-lg border border-stone-200 hover:border-stone-300 hover:shadow-sm transition-all overflow-hidden"
                >
                  <div className="px-6 py-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-stone-800">
                          {textWorkLabel(tw)}
                        </h3>
                        <p className="text-sm text-stone-500 mt-0.5">
                          {verseLabel} — {new Date(proposal.createdAt).toLocaleDateString('fi-FI', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })}
                        </p>
                      </div>
                      <Badge variant="outline" className={cn('text-xs', statusColor)}>
                        {statusLabel}
                      </Badge>
                    </div>

                    {/* Voter progress */}
                    {!isResolved && !isCancelled && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-400">
                          {proposal.votes.length}/{proposal.selectedVoters.length} äänestänyt
                        </span>
                        <div className="flex gap-1">
                          {proposal.selectedVoters.map(voterId => {
                            const member = users.find(u => u.id === voterId)
                            const vote = proposal.votes.find(v => v.userId === voterId)
                            return (
                              <span
                                key={voterId}
                                className={cn(
                                  'inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full',
                                  vote
                                    ? vote.decision === 'approve'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-red-100 text-red-700'
                                    : 'bg-stone-100 text-stone-400'
                                )}
                              >
                                {member?.name.split(' ')[0] ?? '?'}
                                {vote && (vote.decision === 'approve' ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />)}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Rejection comments */}
                    {isRejected && proposal.votes
                      .filter(v => v.decision === 'reject' && v.comment)
                      .map((v, i) => {
                        const voter = users.find(u => u.id === v.userId)
                        return (
                          <p key={i} className="text-sm text-red-700">
                            <span className="font-medium">{voter?.name}:</span> {v.comment}
                          </p>
                        )
                      })
                    }
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
