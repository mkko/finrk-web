'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useStore } from '@/lib/store'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types'
import { canEditVerses, getAvailableTransitions, getTransitionLabel } from '@/lib/state-machine'
import { getCurrentTextWork, getOpenCommentCount } from '@/lib/selectors'
import { VerseDetailPanel } from './VerseDetailPanel'
import { TiptapEditorB } from './TiptapEditorB'
import { VoterSelectionModal } from './VoterSelectionModal'
import { SnapshotList } from './SnapshotList'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ViewMode = 'base' | 'draft'

export function ChapterView() {
  const searchParams = useSearchParams()
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null)
  const [showVoterModal, setShowVoterModal] = useState(false)
  const [showSnapshotList, setShowSnapshotList] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode | null>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)

  const storeVerses = useStore(s => s.verses)
  const users = useStore(s => s.users)
  const editVerse = useStore(s => s.editVerse)
  const addFootnote = useStore(s => s.addFootnote)
  const editFootnote = useStore(s => s.editFootnote)
  const editSectionHeader = useStore(s => s.editSectionHeader)
  const currentUserId = useStore(s => s.currentUserId)
  const currentUser = useStore(s => s.users.find(u => u.id === s.currentUserId)!)
  const textWorks = useStore(s => s.textWorks)
  const comments = useStore(s => s.comments)
  const proposals = useStore(s => s.proposals)
  const allSnapshots = useStore(s => s.snapshots)
  const updateTextWorkStatus = useStore(s => s.updateTextWorkStatus)
  const castVote = useStore(s => s.castVote)
  const viewingSnapshotId = useStore(s => s.viewingSnapshotId)
  const viewedSnapshot = viewingSnapshotId ? allSnapshots.find(s => s.id === viewingSnapshotId) : null
  const viewSnapshotAction = useStore(s => s.viewSnapshot)

  const currentTw = getCurrentTextWork(textWorks)
  const isTekstiryhma = currentUser.role === 'tekstiryhma'

  const baseVerses = storeVerses.map(v => ({ ...v, text: v.baseText }))
  const changedVerseCount = storeVerses.filter(v => v.text !== v.baseText).length

  const effectiveViewMode = viewMode ?? (isTekstiryhma ? 'draft' : 'base')

  useEffect(() => { setViewMode(null) }, [currentUserId])

  const verses = viewedSnapshot
    ? storeVerses.map(v => {
        const sv = viewedSnapshot.verseTexts.find(sv => sv.number === v.number)
        return sv ? { ...v, text: sv.text } : v
      })
    : effectiveViewMode === 'base'
      ? baseVerses
      : storeVerses

  const canEdit = canEditVerses(currentTw?.status ?? 'luonnos', currentUser.role)
  const readOnly = effectiveViewMode === 'base' || !canEdit || !!viewedSnapshot

  const openComments = currentTw ? getOpenCommentCount(comments, currentTw.id) : 0
  const availableTransitions = currentTw
    ? getAvailableTransitions(currentTw.status, currentUser.role)
    : []

  const activeProposal = currentTw?.submissionProposalId
    ? proposals.find(p => p.id === currentTw.submissionProposalId)
    : undefined
  const isSelectedVoter = activeProposal?.selectedVoters.includes(currentUserId) ?? false
  const hasVoted = activeProposal?.votes.some(v => v.userId === currentUserId) ?? false

  useEffect(() => {
    const v = searchParams.get('verse')
    if (v) {
      const num = Number(v)
      if (num >= 1 && num <= 20) setSelectedVerse(num)
    }
  }, [searchParams])

  return (
    <div className="h-full flex">
      {/* Main document column */}
      <div className="flex-1 min-h-0 flex flex-col">

        {/* Document toolbar — fixed below header */}
        {!viewedSnapshot && (
          <div className="flex-none border-b border-stone-200 bg-white px-4 py-2 flex items-center gap-3">
            {/* Version toggle */}
            <div className="inline-flex rounded-md border border-stone-200 bg-stone-50 p-0.5">
              <button
                onClick={() => setViewMode('base')}
                className={cn(
                  'px-3 py-1 text-xs rounded transition-colors',
                  effectiveViewMode === 'base'
                    ? 'bg-white text-stone-800 font-medium shadow-sm'
                    : 'text-stone-400 hover:text-stone-600'
                )}
              >
                Julkaistu
              </button>
              <button
                onClick={() => setViewMode('draft')}
                className={cn(
                  'px-3 py-1 text-xs rounded transition-colors',
                  effectiveViewMode === 'draft'
                    ? 'bg-white text-stone-800 font-medium shadow-sm'
                    : 'text-stone-400 hover:text-stone-600'
                )}
              >
                Luonnos
                {changedVerseCount > 0 && (
                  <span className={cn(
                    'ml-1.5 text-xs tabular-nums',
                    effectiveViewMode === 'draft' ? 'text-stone-400' : 'text-amber-600'
                  )}>
                    ({changedVerseCount})
                  </span>
                )}
              </button>
            </div>

            <div className="w-px h-5 bg-stone-200" />

            {/* Editor paragraph type controls — portal target */}
            <div ref={toolbarRef} />

            <div className="flex-1" />

            {/* Status badge */}
            {currentTw && (
              <Badge variant="outline" className={cn('text-xs', STATUS_COLORS[currentTw.status])}>
                {STATUS_LABELS[currentTw.status]}
              </Badge>
            )}

            {openComments > 0 && (
              <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                {openComments} avointa
              </span>
            )}
          </div>
        )}

        {/* Snapshot viewing banner */}
        {viewedSnapshot && (
          <div className="flex-none border-b border-blue-200 bg-blue-50 px-6 py-2.5 flex items-center justify-between">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Tilannekuva:</span> {viewedSnapshot.name}
              <span className="text-blue-600 ml-2">
                ({new Date(viewedSnapshot.createdAt).toLocaleDateString('fi-FI', { day: 'numeric', month: 'long', year: 'numeric' })})
              </span>
            </p>
            <button
              onClick={() => viewSnapshotAction(null)}
              className="text-sm text-blue-700 hover:text-blue-900 font-medium px-3 py-1 rounded hover:bg-blue-100 transition-colors"
            >
              Sulje
            </button>
          </div>
        )}

        {/* Scrollable document area */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-stone-100">
          <div className="max-w-3xl mx-auto py-8 px-4">
            {/* A4-like page */}
            <div className="bg-white border border-stone-300 shadow-md" style={{ padding: '40px 50px', minHeight: '800px' }}>
              {/* Document header */}
              <p className="font-serif text-sm text-stone-400 mb-1">1. Tessalonikalaiskirje</p>
              <h1 className="font-serif text-2xl font-semibold text-stone-800 leading-tight mb-4">Luku 2</h1>

              {/* Action bar — transition buttons, snapshots, voting */}
              {currentTw && (availableTransitions.length > 0 || (isTekstiryhma) || (currentTw.status === 'lahetetty_hallitukselle' && isSelectedVoter)) && (
                <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-stone-200">
                  {/* Transition buttons for tekstiryhma */}
                  {availableTransitions.map(target => {
                    if (target === 'lahetetty_hallitukselle') {
                      return (
                        <Button
                          key={target}
                          size="sm"
                          onClick={() => setShowVoterModal(true)}
                        >
                          {getTransitionLabel(currentTw.status, target)}
                        </Button>
                      )
                    }
                    return (
                      <Button
                        key={target}
                        size="sm"
                        variant={target === 'luonnos' ? 'outline' : 'default'}
                        onClick={() => updateTextWorkStatus(currentTw.id, target)}
                      >
                        {getTransitionLabel(currentTw.status, target)}
                      </Button>
                    )
                  })}

                  {isTekstiryhma && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowSnapshotList(true)}
                    >
                      Tilannekuvat
                    </Button>
                  )}

                  {/* Voting panel for selected hallitus voter */}
                  {currentTw.status === 'lahetetty_hallitukselle' && isSelectedVoter && !hasVoted && activeProposal && (
                    <div className="w-full mt-2 rounded-md border border-violet-200 bg-violet-50/50 p-3 space-y-2">
                      <p className="text-sm font-medium text-violet-800">
                        Äänestyksesi vaaditaan
                      </p>
                      <p className="text-xs text-violet-600">
                        {activeProposal.votes.length}/{activeProposal.selectedVoters.length} äänestänyt
                      </p>
                      <VotingButtons proposalId={activeProposal.id} onVote={castVote} />
                    </div>
                  )}
                  {currentTw.status === 'lahetetty_hallitukselle' && isSelectedVoter && hasVoted && (
                    <span className="text-xs text-violet-600">Olet äänestänyt</span>
                  )}
                </div>
              )}

              {/* Verses */}
              <div className="font-serif text-base leading-7 text-stone-800">
                <TiptapEditorB
                  verses={verses}
                  users={users}
                  currentUserId={currentUserId}
                  readOnly={readOnly}
                  toolbarRef={toolbarRef}
                  selectedVerse={selectedVerse}
                  onSelectVerse={setSelectedVerse}
                  onEditVerse={editVerse}
                  onAddFootnote={addFootnote}
                  onEditFootnote={editFootnote}
                  onEditSectionHeader={editSectionHeader}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar — always visible, right */}
      <div className="w-96 shrink-0 border-l border-stone-200 bg-white flex flex-col overflow-hidden">
        {selectedVerse !== null
          ? <VerseDetailPanel
              verseNumber={selectedVerse}
              textWorkId={currentTw?.id}
              onClose={() => setSelectedVerse(null)}
            />
          : (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <p className="text-sm text-stone-400">Valitse jae nähdäksesi tiedot</p>
            </div>
          )
        }
      </div>

      {/* Modals */}
      {currentTw && (
        <>
          <VoterSelectionModal
            open={showVoterModal}
            onClose={() => setShowVoterModal(false)}
            textWorkId={currentTw.id}
          />
          <SnapshotList
            open={showSnapshotList}
            onClose={() => setShowSnapshotList(false)}
            textWorkId={currentTw.id}
          />
        </>
      )}
    </div>
  )
}

function VotingButtons({ proposalId, onVote }: { proposalId: string; onVote: (id: string, d: 'approve' | 'reject', c?: string) => void }) {
  const [showReject, setShowReject] = useState(false)
  const [rejectText, setRejectText] = useState('')

  if (showReject) {
    return (
      <div className="space-y-2">
        <textarea
          placeholder="Perustele hylkäys..."
          value={rejectText}
          onChange={e => setRejectText(e.target.value)}
          className="w-full text-sm border border-violet-200 rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-violet-400"
          rows={2}
        />
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowReject(false)}>
            Peruuta
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-700"
            onClick={() => {
              if (rejectText.trim()) {
                onVote(proposalId, 'reject', rejectText.trim())
              }
            }}
            disabled={!rejectText.trim()}
          >
            Hylkää
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        className="text-red-700"
        onClick={() => setShowReject(true)}
      >
        Hylkää
      </Button>
      <Button
        size="sm"
        onClick={() => onVote(proposalId, 'approve')}
        className="ml-auto"
      >
        Hyväksy
      </Button>
    </div>
  )
}
