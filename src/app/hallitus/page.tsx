'use client'

import { useStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { textWorkLabel, Proposal } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Check, X, Clock, CircleDot } from 'lucide-react'

export default function HallitusPage() {
  const router = useRouter()
  const { textWorks, proposals, users, currentUserId } = useStore()
  const currentUser = users.find(u => u.id === currentUserId)
  if (!currentUser) return null

  if (!currentUser.roles.includes('hallitus')) {
    return (
      <div className="h-full overflow-y-auto"><div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <p className="text-stone-500">Tämä näkymä on tarkoitettu hallituksen jäsenille.</p>
      </div></div>
    )
  }

  // Only active (non-cancelled) proposals
  const activeProposals = proposals.filter(p => !p.cancelledAt)

  // Group proposals
  const pendingNotVoted: Proposal[] = []
  const pendingVoted: Proposal[] = []
  const resolved: Proposal[] = []

  for (const p of activeProposals) {
    if (p.resolvedAt) {
      resolved.push(p)
    } else if (p.votes.some(v => v.userId === currentUserId)) {
      pendingVoted.push(p)
    } else {
      pendingNotVoted.push(p)
    }
  }

  // Sort each group by date (newest first)
  const byDate = (a: Proposal, b: Proposal) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  pendingNotVoted.sort(byDate)
  pendingVoted.sort(byDate)
  resolved.sort(byDate)

  const groups = [
    { title: 'Odottaa äänestystäsi', proposals: pendingNotVoted, empty: 'Ei odottavia ehdotuksia.' },
    { title: 'Käsittelyssä', proposals: pendingVoted, empty: null },
    { title: 'Ratkaistut', proposals: resolved, empty: null },
  ]

  function ProposalCard({ proposal }: { proposal: Proposal }) {
    const tw = textWorks.find(t => t.id === proposal.textWorkId)
    if (!tw) return null

    const isResolved = !!proposal.resolvedAt
    const isApproved = isResolved && tw.status === 'hyvaksytty'
    const isRejected = isResolved && tw.status === 'hylatty'
    const myVote = proposal.votes.find(v => v.userId === currentUserId)

    const verseLabel = proposal.selectedVerses && proposal.selectedVerses.length > 0
      ? `Jakeet ${proposal.selectedVerses.join(', ')}`
      : 'Kaikki jakeet'

    const statusLabel = isApproved ? 'Hyväksytty'
      : isRejected ? 'Hylätty'
      : 'Käsittelyssä'
    const statusColor = isApproved ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
      : isRejected ? 'bg-red-50 text-red-800 border-red-300'
      : 'bg-violet-50 text-violet-800 border-violet-300'

    return (
      <button
        onClick={() => router.push(`/review/${proposal.id}`)}
        className="w-full text-left bg-white rounded-lg border border-stone-200 hover:border-stone-300 hover:shadow-sm transition-all overflow-hidden"
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
            <Badge variant="outline" className={cn('text-xs shrink-0', statusColor)}>
              {statusLabel}
            </Badge>
          </div>

          {/* Voter progress pills */}
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

          {/* Your vote status for pending-voted */}
          {!isResolved && myVote && (
            <p className="text-xs text-violet-600 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Olet äänestänyt: {myVote.decision === 'approve' ? 'Kannatan' : 'Vastustan'}
            </p>
          )}
        </div>
      </button>
    )
  }

  return (
    <div className="h-full overflow-y-auto"><div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <h1 className="text-xl font-semibold text-stone-800 mb-6">Ratifiointi</h1>

      {activeProposals.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          Ei käsiteltäviä ehdotuksia tällä hetkellä.
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(group => {
            if (group.proposals.length === 0 && !group.empty) return null
            return (
              <div key={group.title}>
                <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  {group.title === 'Odottaa äänestystäsi' && <CircleDot className="h-4 w-4 text-violet-500" />}
                  {group.title === 'Käsittelyssä' && <Clock className="h-4 w-4 text-stone-400" />}
                  {group.title === 'Ratkaistut' && <Check className="h-4 w-4 text-stone-400" />}
                  {group.title}
                  {group.proposals.length > 0 && (
                    <span className="text-xs text-stone-400 font-normal">({group.proposals.length})</span>
                  )}
                </h2>
                {group.proposals.length === 0 ? (
                  group.empty && <p className="text-sm text-stone-400 py-4">{group.empty}</p>
                ) : (
                  <div className="space-y-3">
                    {group.proposals.map(p => (
                      <ProposalCard key={p.id} proposal={p} />
                    ))}
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
