'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useStore } from '@/lib/store'
import { STATUS_LABELS, STATUS_COLORS, textWorkLabel } from '@/lib/types'
import { canEditVerses, getAvailableTransitions, getTransitionLabel } from '@/lib/state-machine'
import { getCurrentTextWork, getOpenCommentCount, getPublishedSnapshot, hasDraft } from '@/lib/selectors'
import { VerseDetailPanel } from './VerseDetailPanel'
import { TiptapEditorB } from './TiptapEditorB'
import { VoterSelectionModal } from './VoterSelectionModal'
import { SnapshotList } from './SnapshotList'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Pencil, Eye } from 'lucide-react'

type ViewMode = 'published' | 'draft'

export function ChapterView() {
  const searchParams = useSearchParams()
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null)
  const [showVoterModal, setShowVoterModal] = useState(false)
  const [showSnapshotList, setShowSnapshotList] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode | null>(null) // null = not yet initialized

  const storeVerses = useStore(s => s.verses)
  const users = useStore(s => s.users)
  const editVerse = useStore(s => s.editVerse)
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
  const publishedSnapshot = currentTw ? getPublishedSnapshot(allSnapshots, currentTw.id) : undefined
  const draftExists = hasDraft(storeVerses, publishedSnapshot)
  const isTekstiryhma = currentUser.role === 'tekstiryhma'

  // Default view mode: tekstiryhma → draft, others → published (if available)
  const effectiveViewMode = viewMode ?? (isTekstiryhma ? 'draft' : (publishedSnapshot ? 'published' : 'draft'))

  // Reset view mode when user switches persona
  useEffect(() => {
    setViewMode(null)
  }, [currentUserId])

  // Determine which verses to show
  const verses = viewedSnapshot
    ? storeVerses.map(v => {
        const snapshotVerse = viewedSnapshot.verseTexts.find(sv => sv.number === v.number)
        return snapshotVerse ? { ...v, text: snapshotVerse.text } : v
      })
    : effectiveViewMode === 'published' && publishedSnapshot
      ? storeVerses.map(v => {
          const sv = publishedSnapshot.verseTexts.find(sv => sv.number === v.number)
          return sv ? { ...v, text: sv.text } : v
        })
      : storeVerses

  // Read-only logic: editable only when viewing draft as tekstiryhma
  const canEdit = canEditVerses(currentTw?.status ?? 'luonnos', currentUser.role)
  const readOnly = !canEdit || effectiveViewMode === 'published' || !!viewedSnapshot

  const openComments = currentTw ? getOpenCommentCount(comments, currentTw.id) : 0
  const availableTransitions = currentTw
    ? getAvailableTransitions(currentTw.status, currentUser.role)
    : []

  // Check if current user is a selected voter for an active proposal
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

        {/* Published view banner */}
        {!viewedSnapshot && effectiveViewMode === 'published' && publishedSnapshot && (
          <div className="flex-none border-b border-amber-200 bg-amber-50 px-6 py-2.5 flex items-center justify-between">
            <p className="text-sm text-amber-800">
              <span className="font-medium">Julkaistu versio</span>
              <span className="text-amber-600 ml-2">
                ({new Date(publishedSnapshot.createdAt).toLocaleDateString('fi-FI', { day: 'numeric', month: 'long', year: 'numeric' })})
              </span>
            </p>
            {draftExists && (
              <button
                onClick={() => setViewMode('draft')}
                className="text-sm text-amber-700 hover:text-amber-900 font-medium px-3 py-1 rounded hover:bg-amber-100 transition-colors flex items-center gap-1.5"
              >
                {isTekstiryhma ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {isTekstiryhma ? 'Muokkaa luonnosta' : 'Näytä luonnos'}
              </button>
            )}
          </div>
        )}

        {/* Draft view banner (when not in luonnos — i.e. there's a published version to go back to) */}
        {!viewedSnapshot && effectiveViewMode === 'draft' && publishedSnapshot && currentTw?.status !== 'luonnos' && (
          <div className="flex-none border-b border-green-200 bg-green-50 px-6 py-2.5 flex items-center justify-between">
            <p className="text-sm text-green-800">
              <span className="font-medium">{isTekstiryhma ? 'Luonnos (muokattavissa)' : 'Luonnos (vain luku)'}</span>
            </p>
            <button
              onClick={() => setViewMode('published')}
              className="text-sm text-green-700 hover:text-green-900 font-medium px-3 py-1 rounded hover:bg-green-100 transition-colors"
            >
              Näytä julkaistu versio
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

              {/* Status header bar */}
              {currentTw && (
                <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-stone-200">
                  <Badge variant="outline" className={cn('text-xs', STATUS_COLORS[currentTw.status])}>
                    {STATUS_LABELS[currentTw.status]}
                  </Badge>

                  {/* Draft badge */}
                  {draftExists && (
                    <button
                      onClick={() => setViewMode(effectiveViewMode === 'draft' ? 'published' : 'draft')}
                      className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 hover:bg-green-100 transition-colors cursor-pointer"
                    >
                      <Pencil className="h-3 w-3" />
                      Luonnos
                    </button>
                  )}

                  {openComments > 0 && (
                    <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                      {openComments} avointa kommenttia
                    </span>
                  )}

                  <div className="flex-1" />

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

                  {/* Snapshot button for tekstiryhma */}
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
                  selectedVerse={selectedVerse}
                  onSelectVerse={setSelectedVerse}
                  onEditVerse={editVerse}
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
