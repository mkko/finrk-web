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
import { Check, X, ArrowLeft, MessageSquare, UserPlus, UserMinus } from 'lucide-react'
import Link from 'next/link'

export default function ReviewPage() {
  const params = useParams()
  const proposalId = params.proposalId as string

  const { proposals, textWorks, users, verses, snapshots, comments, currentUserId, castVote, cancelProposal, updateSelectedVoters } = useStore()
  const currentUser = users.find(u => u.id === currentUserId)
  if (!currentUser) return null

  const proposal = proposals.find(p => p.id === proposalId)
  const tw = proposal ? textWorks.find(t => t.id === proposal.textWorkId) : null
  const snapshot = proposal ? snapshots.find(s => s.id === proposal.snapshotId) : null

  const [rejectText, setRejectText] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

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
  const isHallitus = currentUser.roles.includes('hallitus')
  const isTekstiryhma = currentUser.roles.includes('tekstiryhma')
  const currentUserVote = proposal.votes.find(v => v.userId === currentUserId)
  const isResolved = !!proposal.resolvedAt
  const isCancelled = !!proposal.cancelledAt
  const isApproved = isResolved && proposal.votes.every(v => v.decision === 'approve')
  const isRejected = isResolved && !isApproved
  const isPending = !isResolved && !isCancelled && tw.status === 'lahetetty_hallitukselle'
  const canVote = isHallitus && isPending && !currentUserVote && proposal.selectedVoters.includes(currentUserId)

  // Build diff data
  const diffVerses = snapshot
    ? snapshot.verseTexts.map(sv => {
        const currentVerse = verses.find(v => v.chapter === sv.chapter && v.number === sv.number)
        return {
          chapter: sv.chapter,
          number: sv.number,
          oldText: currentVerse?.approvedText ?? '',
          newText: sv.text,
        }
      })
    : []

  // Discussion context: comments for the textWork filtered by proposal verse range
  const proposalVerseNumbers = proposal.selectedVerses && proposal.selectedVerses.length > 0
    ? new Set(proposal.selectedVerses)
    : new Set(snapshot?.verseTexts.map(sv => sv.number) ?? [])

  const relatedComments = comments.filter(c => {
    if (c.textWorkId !== proposal.textWorkId) return false
    return proposalVerseNumbers.has(c.verseAnchor.verseStart)
  }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  // Status for display
  const displayStatus = isCancelled ? 'Peruutettu' : STATUS_LABELS[tw.status]
  const displayStatusColor = isCancelled
    ? 'bg-stone-100 text-stone-600 border-stone-300'
    : STATUS_COLORS[tw.status]

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

  function handleCancel() {
    cancelProposal(proposalId)
    setShowCancelConfirm(false)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
        {/* Back link */}
        <Link
          href={isHallitus ? '/hallitus' : '/lahetys'}
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
          <Badge variant="outline" className={cn('text-xs', displayStatusColor)}>
            {displayStatus}
          </Badge>
        </div>

        {/* Rationale */}
        {proposal.rationale && (
          <div className="bg-stone-50 rounded-lg border border-stone-200 p-4">
            <p className="text-sm text-stone-600">{proposal.rationale}</p>
          </div>
        )}

        {/* Voter progress + management */}
        {isHallitus && !isCancelled && (() => {
          const selectedMembers = proposal.selectedVoters.map(id => users.find(u => u.id === id)).filter(Boolean)
          const allHallitus = users.filter(u => u.roles.includes('hallitus'))
          const nonSelectedHallitus = allHallitus.filter(u => !proposal.selectedVoters.includes(u.id))
          const votedIds = new Set(proposal.votes.map(v => v.userId))

          function toggleVoter(userId: string) {
            if (proposal!.selectedVoters.includes(userId)) {
              if (votedIds.has(userId)) return // can't remove someone who already voted
              updateSelectedVoters(proposalId, proposal!.selectedVoters.filter(id => id !== userId))
            } else {
              updateSelectedVoters(proposalId, [...proposal!.selectedVoters, userId])
            }
          }

          return (
            <div className={cn(
              'rounded-lg border p-4 space-y-3',
              isPending ? 'border-violet-200 bg-violet-50/50' : 'border-stone-200 bg-stone-50'
            )}>
              <p className="text-sm font-medium text-stone-700">
                Äänestys: {proposal.votes.length}/{proposal.selectedVoters.length} äänestänyt
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map(member => {
                  if (!member) return null
                  const vote = proposal.votes.find(v => v.userId === member.id)
                  const hasVoted = votedIds.has(member.id)
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
                      {isPending && !hasVoted && (
                        <button
                          onClick={() => toggleVoter(member.id)}
                          className="ml-0.5 text-stone-400 hover:text-red-600 transition-colors"
                          title="Poista äänestäjä"
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </span>
                  )
                })}
                {/* Add voter buttons for non-selected hallitus members */}
                {isPending && nonSelectedHallitus.map(member => (
                  <button
                    key={member.id}
                    onClick={() => toggleVoter(member.id)}
                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium border border-dashed border-stone-300 text-stone-400 hover:border-violet-400 hover:text-violet-600 transition-colors"
                    title="Lisää äänestäjä"
                  >
                    {member.name}
                    <UserPlus className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            </div>
          )
        })()}

        {/* Vote audit trail — hallitus only */}
        {isHallitus && proposal.votes.length > 0 && (
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 space-y-2">
            <h2 className="text-sm font-medium text-stone-700 mb-2">Äänestysloki</h2>
            {proposal.votes.map((vote, i) => {
              const voter = users.find(u => u.id === vote.userId)
              return (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className={cn(
                    'inline-flex items-center gap-1 font-medium',
                    vote.decision === 'approve' ? 'text-emerald-700' : 'text-red-700'
                  )}>
                    {vote.decision === 'approve' ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                    {vote.decision === 'approve' ? 'Hyväksy' : 'Hylkää'}
                  </span>
                  <span className="text-stone-600">{voter?.name ?? 'Tuntematon'}</span>
                  <span className="text-stone-400">
                    {new Date(vote.createdAt).toLocaleDateString('fi-FI', {
                      day: 'numeric', month: 'numeric', year: 'numeric',
                    })}
                  </span>
                  {vote.comment && (
                    <span className="text-stone-500 italic">&quot;{vote.comment}&quot;</span>
                  )}
                </div>
              )
            })}
          </div>
        )}

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

        {/* Discussion context */}
        {relatedComments.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-stone-700 mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Keskustelu
            </h2>
            <div className="space-y-3">
              {relatedComments.map(comment => {
                const author = users.find(u => u.id === comment.authorId)
                const threadLabel = comment.thread === 'tekstiryhma' ? 'Tekstiryhmä' : 'Seurantaryhmä'
                return (
                  <div
                    key={comment.id}
                    className={cn(
                      'rounded-lg border p-4',
                      comment.status === 'kasitelty'
                        ? 'border-stone-200 bg-stone-50'
                        : 'border-amber-200 bg-amber-50/50'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-medium text-stone-700">
                        {author?.name ?? 'Tuntematon'}
                      </span>
                      <span className="text-xs text-stone-400">
                        {new Date(comment.createdAt).toLocaleDateString('fi-FI', {
                          day: 'numeric', month: 'numeric', year: 'numeric',
                        })}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {threadLabel}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          comment.status === 'avoin'
                            ? 'bg-amber-50 text-amber-700 border-amber-300'
                            : 'bg-stone-100 text-stone-500 border-stone-300'
                        )}
                      >
                        {comment.status === 'avoin' ? 'Avoin' : 'Käsitelty'}
                      </Badge>
                    </div>
                    <p className="text-xs text-stone-400 mb-1">Jae {comment.verseAnchor.verseStart}</p>
                    <p className="text-sm text-stone-600">{comment.text}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Voting section — hallitus only, pending, selected voter */}
        {canVote && (
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

        {/* Cancelled notice */}
        {isCancelled && (
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm text-stone-600">
              Äänestys peruutettu {new Date(proposal.cancelledAt!).toLocaleDateString('fi-FI', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        )}

        {/* Cancel button — tekstiryhma only, pending */}
        {isTekstiryhma && isPending && (
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            {showCancelConfirm ? (
              <div className="space-y-3">
                <p className="text-sm text-stone-600">
                  Haluatko varmasti peruuttaa äänestyksen? Teksti palautuu palautteelle-tilaan.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowCancelConfirm(false)}>
                    Ei, älä peruuta
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-700"
                    onClick={handleCancel}
                  >
                    Kyllä, peruuta äänestys
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="text-red-700"
                onClick={() => setShowCancelConfirm(true)}
              >
                Peruuta äänestys
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
