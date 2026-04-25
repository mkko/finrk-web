'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { STATUS_LABELS, STATUS_COLORS, Proposal, User, ProposalStatus, proposalCoversVerse, proposalVerseRef } from '@/lib/types'
import { canAdvance, canSendBack, getNextStatus, getSendBackStatus, getAdvanceLabel } from '@/lib/state-machine'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { X, ArrowRight, ArrowLeft, MessageSquare, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VerseDetailPanelProps {
  verseNumber: number
  onClose: () => void
  onStartEdit?: () => void
  onRevert?: () => void
}

export function VerseDetailPanel({ verseNumber, onClose, onStartEdit, onRevert }: VerseDetailPanelProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return <PanelContent verseNumber={verseNumber} onClose={onClose} onStartEdit={onStartEdit} onRevert={onRevert} />
}

function PanelContent({ verseNumber, onClose, onStartEdit, onRevert }: { verseNumber: number; onClose: () => void; onStartEdit?: () => void; onRevert?: () => void }) {
  const verses = useStore(s => s.verses)
  const proposals = useStore(s => s.proposals)
  const users = useStore(s => s.users)
  const currentUser = useStore(s => s.users.find(u => u.id === s.currentUserId)!)
  const addComment = useStore(s => s.addComment)
  const updateProposalStatus = useStore(s => s.updateProposalStatus)

  const verse = verses.find(v => v.number === verseNumber)!
  const verseProposals = proposals
    .filter(p => proposalCoversVerse(p, verseNumber))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const hasBeenRevised = verse.text !== verse.baseText
  const hasActiveProposal = verseProposals.some(p => p.status !== 'hyvaksytty_lopullisesti')

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-stone-200 sticky top-0 bg-white z-10">
        <h2 className="font-semibold text-stone-800 flex items-center gap-2">
          Jae {verseNumber}
          {onRevert && (
            <span className="text-xs font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
              Muokkaus
            </span>
          )}
        </h2>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 hover:bg-stone-100 transition-colors"
          title="Sulje"
        >
          <X className="h-5 w-5 text-stone-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Current text */}
        <div>
          <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
            Nykyinen teksti
          </h3>
          <p className="font-serif text-base leading-7 text-stone-800">
            {verse.text}
          </p>
        </div>

        {/* Base text if different */}
        {hasBeenRevised && (
          <div>
            <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
              Alkuperäinen (RK12)
            </h3>
            <p className="font-serif text-base leading-7 text-stone-500 italic">
              {verse.baseText}
            </p>
          </div>
        )}

        {onStartEdit && (
          <Button variant="outline" className="w-full" onClick={onStartEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Ehdota muutosta
          </Button>
        )}
        {onRevert && (
          <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={onRevert}>
            Palauta alkuperäinen
          </Button>
        )}

        {verseProposals.length > 0 && <Separator />}

        {/* Proposals */}
        {verseProposals.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wide">
              Ehdotukset
            </h3>
            {verseProposals.map(proposal => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                users={users}
                currentUser={currentUser}
                onAddComment={addComment}
                onUpdateStatus={updateProposalStatus}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-400 py-2">
            Ei ehdotuksia tälle jakeelle.
          </p>
        )}
      </div>
    </div>
  )
}

function ProposalCard({
  proposal,
  users,
  currentUser,
  onAddComment,
  onUpdateStatus,
}: {
  proposal: Proposal
  users: User[]
  currentUser: User
  onAddComment: (proposalId: string, comment: { authorId: string; text: string }) => void
  onUpdateStatus: (proposalId: string, status: ProposalStatus, comment?: string) => void
}) {
  const [commentText, setCommentText] = useState('')
  const [sendBackText, setSendBackText] = useState('')
  const [showSendBack, setShowSendBack] = useState(false)
  const author = users.find(u => u.id === proposal.authorId)!

  const showAdvance = canAdvance(proposal.status, currentUser.role)
  const showSendBackBtn = canSendBack(proposal.status, currentUser.role)

  function handleAdvance() {
    const next = getNextStatus(proposal.status)
    if (next) onUpdateStatus(proposal.id, next)
  }

  function handleSendBack() {
    const prev = getSendBackStatus(proposal.status)
    if (prev && sendBackText.trim()) {
      onUpdateStatus(proposal.id, prev, sendBackText.trim())
      setSendBackText('')
      setShowSendBack(false)
    }
  }

  function handleAddComment() {
    if (commentText.trim()) {
      onAddComment(proposal.id, { authorId: currentUser.id, text: commentText.trim() })
      setCommentText('')
    }
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50/50 overflow-hidden">
      {/* Proposal header */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="text-sm">
            <span className="font-medium text-stone-700">{author.name}</span>
            <span className="text-stone-400 ml-2">
              {formatDate(proposal.createdAt)}
            </span>
          </div>
          <Badge variant="outline" className={cn('text-xs shrink-0', STATUS_COLORS[proposal.status])}>
            {STATUS_LABELS[proposal.status]}
          </Badge>
        </div>

        {/* Proposed text — one block per range */}
        {proposal.ranges.map((range, i) => (
          <div key={i} className="bg-white rounded-md border border-stone-200 p-3">
            {proposal.ranges.length > 1 && (
              <p className="text-xs text-stone-400 mb-1">
                {range.verseStart === range.verseEnd ? `Jae ${range.verseStart}` : `Jakeet ${range.verseStart}–${range.verseEnd}`}
              </p>
            )}
            <p className="font-serif text-sm leading-6 text-stone-800">
              {range.proposedText}
            </p>
          </div>
        ))}

        {/* Rationale */}
        <p className="text-sm text-stone-600 leading-relaxed">
          {proposal.rationale}
        </p>

        {/* Verse range indicator for multi-range or multi-verse proposals */}
        {(proposal.ranges.length > 1 || proposal.ranges[0].verseStart !== proposal.ranges[0].verseEnd) && (
          <p className="text-xs text-stone-400">
            {proposalVerseRef(proposal)}
          </p>
        )}
      </div>

      {/* Comments */}
      {proposal.comments.length > 0 && (
        <div className="border-t border-stone-200 px-4 py-3 space-y-3">
          {proposal.comments.map(comment => {
            const commentAuthor = users.find(u => u.id === comment.authorId)!
            return (
              <div key={comment.id} className={cn('text-sm', comment.isSendBack && 'border-l-2 border-amber-400 pl-3')}>
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-stone-700">{commentAuthor.name}</span>
                  <span className="text-xs text-stone-400">{formatDate(comment.createdAt)}</span>
                  {comment.isSendBack && (
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                      Palautettu
                    </Badge>
                  )}
                </div>
                <p className="text-stone-600 mt-0.5 leading-relaxed">{comment.text}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Add comment (for kääntäjä and seurantaryhmä) */}
      {(currentUser.role === 'kaantaja' || currentUser.role === 'seurantaryhma') && proposal.status !== 'hyvaksytty_lopullisesti' && (
        <div className="border-t border-stone-200 px-4 py-3">
          <div className="flex gap-2">
            <Textarea
              placeholder="Kirjoita kommentti..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              className="min-h-[60px] text-sm resize-none"
              rows={2}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddComment}
              disabled={!commentText.trim()}
              className="self-end shrink-0"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Actions */}
      {(showAdvance || showSendBackBtn) && (
        <div className="border-t border-stone-200 px-4 py-3 space-y-2">
          {showSendBack && (
            <div className="space-y-2">
              <Textarea
                placeholder="Perustele palautus..."
                value={sendBackText}
                onChange={e => setSendBackText(e.target.value)}
                className="min-h-[60px] text-sm resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowSendBack(false)}>
                  Peruuta
                </Button>
                <Button size="sm" variant="outline" onClick={handleSendBack} disabled={!sendBackText.trim()}>
                  Palauta
                </Button>
              </div>
            </div>
          )}

          {!showSendBack && (
            <div className="flex gap-2">
              {showSendBackBtn && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSendBack(true)}
                  className="text-amber-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Palauta
                </Button>
              )}
              {showAdvance && (
                <Button
                  size="sm"
                  onClick={handleAdvance}
                  className="ml-auto"
                >
                  {getAdvanceLabel(proposal.status)}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric', year: 'numeric' })
}
