'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useStore } from '@/lib/store'
import { STATUS_LABELS, STATUS_COLORS, textWorkLabel } from '@/lib/types'
import { WordDiff } from '@/components/chapter/VersionHistory'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Check, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ReviewPage() {
  const params = useParams()
  const proposalId = params.proposalId as string

  const { proposals, textWorks, users, verses, snapshots, currentUserId, castVote } = useStore()
  const currentUser = users.find(u => u.id === currentUserId)!

  const proposal = proposals.find(p => p.id === proposalId)
  const tw = proposal ? textWorks.find(t => t.id === proposal.textWorkId) : null
  const snapshot = proposal ? snapshots.find(s => s.id === proposal.snapshotId) : null

  const [rejectText, setRejectText] = useState('')
  const [showReject, setShowReject] = useState(false)

  if (!proposal || !tw) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
          <p className="text-stone-500">Ehdotusta ei löytynyt.</p>
          <Link href="/hallitus" className="text-sm text-stone-600 hover:text-stone-800 mt-4 inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Takaisin
          </Link>
        </div>
      </div>
    )
  }

  const submitter = users.find(u => u.id === snapshot?.createdBy)
  const isHallitus = currentUser.role === 'hallitus'
  const currentUserVote = proposal.votes.find(v => v.userId === currentUserId)
  const isResolved = !!proposal.resolvedAt
  const isApproved = tw.status === 'hyvaksytty'
  const isRejected = tw.status === 'hylatty'
  const isPending = tw.status === 'lahetetty_hallitukselle'

  // Build diff data: compare approvedText (before) → proposed text (snapshot)
  const diffVerses = snapshot
    ? snapshot.verseTexts.map(sv => {
        const currentVerse = verses.find(v => v.number === sv.number)
        return {
          number: sv.number,
          oldText: currentVerse?.approvedText ?? '',
          newText: sv.text,
        }
      })
    : []

  function handleApprove() {
    castVote(proposalId, 'approve')
  }

  function handleReject() {
    if (rejectText.trim()) {
      castVote(proposalId, 'reject', rejectText.trim())
      setRejectText('')
      setShowReject(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
        {/* Back link */}
        <Link
          href="/hallitus"
          className="text-sm text-stone-500 hover:text-stone-700 inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Takaisin
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-stone-800">
              {textWorkLabel(tw)}
              {proposal.selectedVerses && proposal.selectedVerses.length > 0 && (
                <span className="text-stone-400 font-normal ml-2">
                  (jakeet {proposal.selectedVerses.join(', ')})
                </span>
              )}
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Lähetetty {new Date(proposal.createdAt).toLocaleDateString('fi-FI', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
              {submitter && <> — {submitter.name}</>}
            </p>
          </div>
          <Badge variant="outline" className={cn('text-xs', STATUS_COLORS[tw.status])}>
            {STATUS_LABELS[tw.status]}
          </Badge>
        </div>

        {/* Rationale */}
        {proposal.rationale && (
          <div className="bg-stone-50 rounded-lg border border-stone-200 p-4">
            <p className="text-sm text-stone-600">{proposal.rationale}</p>
          </div>
        )}

        {/* Voter progress */}
        {(() => {
          const hallitusMembers = users.filter(u => u.role === 'hallitus')
          return (
            <div className={cn(
              'rounded-lg border p-4 space-y-3',
              isPending ? 'border-violet-200 bg-violet-50/50' : 'border-stone-200 bg-stone-50'
            )}>
              <p className="text-sm font-medium text-stone-700">
                Äänestys: {proposal.votes.length}/{hallitusMembers.length} äänestänyt
              </p>
              <div className="flex flex-wrap gap-2">
                {hallitusMembers.map(member => {
                  const vote = proposal.votes.find(v => v.userId === member.id)
                  return (
                    <span
                      key={member.id}
                      className={cn(
                        'inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium',
                        vote
                          ? vote.decision === 'approve'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                          : 'bg-stone-100 text-stone-500'
                      )}
                    >
                      {member.name}
                      {vote && (
                        vote.decision === 'approve'
                          ? <Check className="h-3.5 w-3.5" />
                          : <X className="h-3.5 w-3.5" />
                      )}
                    </span>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Diff section */}
        <div>
          <h2 className="text-sm font-medium text-stone-700 mb-3">Muutokset</h2>
          <div
            className="bg-white border border-stone-300 shadow-md font-serif text-base leading-7 text-stone-800 rounded-lg"
            style={{ padding: '40px 50px' }}
          >
            {diffVerses.map(dv => (
              <p key={dv.number} className="mb-1">
                <span
                  className="text-xs text-stone-400 font-sans"
                  style={{ verticalAlign: 'super', fontSize: '0.65em', lineHeight: 0 }}
                >
                  {dv.number}
                </span>{' '}
                {dv.oldText !== dv.newText ? (
                  <WordDiff oldText={dv.oldText} newText={dv.newText} />
                ) : (
                  <span>{dv.newText}</span>
                )}
              </p>
            ))}
          </div>
        </div>

        {/* Voting section — hallitus only, pending */}
        {isHallitus && isPending && !currentUserVote && (
          <div className="rounded-lg border border-violet-200 bg-white p-4 space-y-3">
            <h2 className="text-sm font-medium text-stone-700">Äänestä</h2>
            {showReject ? (
              <div className="space-y-3">
                <Textarea
                  placeholder="Perustele hylkäys..."
                  value={rejectText}
                  onChange={e => setRejectText(e.target.value)}
                  className="min-h-[80px] text-sm resize-none"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowReject(false)}>
                    Peruuta
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-700"
                    onClick={handleReject}
                    disabled={!rejectText.trim()}
                  >
                    Hylkää
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-700"
                  onClick={() => setShowReject(true)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Hylkää
                </Button>
                <Button
                  size="sm"
                  onClick={handleApprove}
                  className="bg-emerald-700 hover:bg-emerald-600"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Hyväksy
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Already voted */}
        {isHallitus && currentUserVote && (
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm text-violet-700 flex items-center gap-1.5">
              <Check className="h-4 w-4" />
              Olet äänestänyt: {currentUserVote.decision === 'approve' ? 'Hyväksy' : 'Hylkää'}
            </p>
          </div>
        )}

        {/* Result section */}
        {isResolved && (
          <div className={cn(
            'rounded-lg border p-4',
            isApproved
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-red-200 bg-red-50'
          )}>
            <p className={cn(
              'text-sm font-medium',
              isApproved ? 'text-emerald-800' : 'text-red-800'
            )}>
              {isApproved ? 'Hyväksytty' : 'Hylätty'}
            </p>
            {proposal.votes
              .filter(v => v.decision === 'reject' && v.comment)
              .map((v, i) => {
                const voter = users.find(u => u.id === v.userId)
                return (
                  <p key={i} className="mt-2 text-sm text-red-700">
                    <span className="font-medium">{voter?.name}:</span> {v.comment}
                  </p>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}
