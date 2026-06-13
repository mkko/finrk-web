'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useStore } from '@/lib/store'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types'
import { canEditVerses, getAvailableTransitions, getTransitionLabel } from '@/lib/state-machine'
import { getCurrentTextWork, getOpenCommentCount, getVerseComments } from '@/lib/selectors'
import { useLayoutMode } from '@/hooks/useLayoutMode'
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
  const layoutMode = useLayoutMode()

  // Two verse states: cursor-following vs explicit selection
  const [cursorVerse, setCursorVerse] = useState<number | null>(null)
  const [sidebarVerse, setSidebarVerse] = useState<number | null>(null)
  const [sidebarCommentId, setSidebarCommentId] = useState<string | null>(null)

  const [showVoterModal, setShowVoterModal] = useState(false)
  const [showSnapshotList, setShowSnapshotList] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode | null>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [editorDirty, setEditorDirty] = useState(false)

  const storeVerses = useStore(s => s.verses)
  const users = useStore(s => s.users)
  const editVerse = useStore(s => s.editVerse)
  const publishDraft = useStore(s => s.publishDraft)
  const addFootnote = useStore(s => s.addFootnote)
  const editFootnote = useStore(s => s.editFootnote)
  const editSectionHeader = useStore(s => s.editSectionHeader)
  const addComment = useStore(s => s.addComment)
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
  const isDraft = effectiveViewMode === 'draft'

  useEffect(() => { setViewMode(null) }, [currentUserId])

  const verses = viewedSnapshot
    ? storeVerses.map(v => {
        const sv = viewedSnapshot.verseTexts.find(sv => sv.number === v.number)
        return sv ? { ...v, text: sv.text } : v
      })
    : isDraft ? storeVerses : baseVerses

  const canEdit = canEditVerses(currentTw?.status ?? 'luonnos', currentUser.role)
  const readOnly = !isDraft || !canEdit || !!viewedSnapshot

  const canComment = currentUser.role === 'tekstiryhma' || currentUser.role === 'seurantaryhma'
  const handleComment = useCallback((verseNumber: number, selectedText: string, commentText: string) => {
    if (!currentTw) return
    addComment({
      textWorkId: currentTw.id,
      verseAnchor: { verseStart: verseNumber },
      verseSnapshot: selectedText,
      authorId: currentUserId,
      text: commentText,
      thread: currentUser.role === 'seurantaryhma' ? 'seurantaryhma' : 'tekstiryhma',
    })
  }, [currentTw, addComment, currentUserId, currentUser.role])

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
      if (num >= 1 && num <= 20) {
        setCursorVerse(num)
        setSidebarVerse(num)
      }
    }
  }, [searchParams])

  // In automatic mode (medium/wide), the sidebar shows cursorVerse
  // In manual mode (narrow), it shows sidebarVerse only when explicitly set
  const displayedVerse = layoutMode === 'narrow' ? sidebarVerse : cursorVerse

  const handleSelectVerse = useCallback((num: number) => {
    setCursorVerse(num)
  }, [])

  const handleOpenSidebar = useCallback((num: number) => {
    setSidebarVerse(num)
  }, [])

  const handleCursorVerseChange = useCallback((num: number) => {
    setCursorVerse(num)
    setSidebarCommentId(null)
  }, [])

  const dismissOverlay = useCallback(() => {
    setSidebarVerse(null)
    setSidebarCommentId(null)
  }, [])

  // Margin comment bubbles — one per open comment
  const marginComments = currentTw
    ? storeVerses.flatMap(v => {
        const vc = getVerseComments(comments, currentTw.id, v.number)
        return vc
          .filter(c => c.status === 'avoin')
          .map(c => {
            const author = users.find(u => u.id === c.authorId)
            return {
              id: c.id,
              verseNumber: v.number,
              authorName: author?.name?.split(' ')[0] ?? '',
              preview: c.text.length > 40 ? c.text.slice(0, 40) + '…' : c.text,
            }
          })
      })
    : []

  return (
    <div className="h-full flex">
      {/* Main content column */}
      <div className="flex-1 min-h-0 flex flex-col">

        {/* Document toolbar */}
        {!viewedSnapshot && (
          <div className={cn(
            'flex-none border-b px-4 py-2 flex items-center gap-3 transition-colors duration-200',
            isDraft ? 'bg-amber-50/70 border-amber-200/50' : 'bg-white border-stone-200'
          )}>
            {/* Version toggle */}
            <div className={cn(
              'inline-flex rounded-md border p-0.5 transition-colors duration-200',
              isDraft ? 'border-amber-300/50 bg-amber-100/40' : 'border-stone-200 bg-stone-50'
            )}>
              <button
                onClick={() => setViewMode('base')}
                className={cn(
                  'px-3 py-1 text-xs rounded transition-colors',
                  !isDraft
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
                  isDraft
                    ? 'bg-amber-600 text-white font-medium shadow-sm'
                    : 'text-stone-400 hover:text-stone-600'
                )}
              >
                Luonnos
                {changedVerseCount > 0 && (
                  <span className={cn(
                    'ml-1.5 text-xs tabular-nums',
                    isDraft ? 'text-amber-200' : 'text-amber-600'
                  )}>
                    ({changedVerseCount})
                  </span>
                )}
              </button>
            </div>

            <div className={cn('w-px h-5', isDraft ? 'bg-amber-300/40' : 'bg-stone-200')} />

            {/* Editor paragraph type controls — portal target */}
            <div ref={toolbarRef} />

            <div className="flex-1" />

            {/* Publish button */}
            {isTekstiryhma && isDraft && (changedVerseCount > 0 || editorDirty) && (
              <Button
                size="sm"
                onClick={() => {
                  if (window.confirm('Haluatko varmasti julkaista luonnoksen?')) {
                    publishDraft()
                    setViewMode('base')
                  }
                }}
              >
                Julkaise
              </Button>
            )}

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
        <div className={cn(
          'flex-1 min-h-0 overflow-y-auto transition-colors duration-200',
          isDraft ? 'bg-amber-50/20' : 'bg-stone-100'
        )}>
          <div className="py-8 px-4 flex justify-center gap-4">
            {/* Left spacer — mirrors margin width for centering (wide only) */}
            <div className="w-48 shrink-0 hidden editor-lg:block" />

            {/* A4 page — fixed max-width, shrinks on mobile */}
            <div className="w-full max-w-3xl shrink-0">
              <div
                className={cn(
                  'border shadow-md transition-colors duration-200',
                  isDraft ? 'border-amber-200/50' : 'border-stone-300'
                )}
                style={{
                  padding: '40px 50px',
                  minHeight: '800px',
                  backgroundColor: isDraft ? '#fffdf7' : '#ffffff',
                  boxShadow: isDraft ? 'inset 3px 0 0 #fcd34d' : undefined,
                }}
              >
                {/* Document header */}
                <p className="font-serif text-sm text-stone-400 mb-1">1. Tessalonikalaiskirje</p>
                <h1 className="font-serif text-2xl font-semibold text-stone-800 leading-tight mb-4">Luku 2</h1>

                {/* Action bar — transition buttons, snapshots, voting */}
                {currentTw && (availableTransitions.length > 0 || isTekstiryhma || (currentTw.status === 'lahetetty_hallitukselle' && isSelectedVoter)) && (
                  <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-stone-200">
                    {availableTransitions.map(target => {
                      if (target === 'lahetetty_hallitukselle') {
                        return (
                          <Button key={target} size="sm" onClick={() => setShowVoterModal(true)}>
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
                      <Button size="sm" variant="outline" onClick={() => setShowSnapshotList(true)}>
                        Tilannekuvat
                      </Button>
                    )}

                    {currentTw.status === 'lahetetty_hallitukselle' && isSelectedVoter && !hasVoted && activeProposal && (
                      <div className="w-full mt-2 rounded-md border border-violet-200 bg-violet-50/50 p-3 space-y-2">
                        <p className="text-sm font-medium text-violet-800">Äänestyksesi vaaditaan</p>
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
                    selectedVerse={cursorVerse}
                    onSelectVerse={handleSelectVerse}
                    onCursorVerseChange={handleCursorVerseChange}
                    onEditVerse={editVerse}
                    onAddFootnote={addFootnote}
                    onEditFootnote={editFootnote}
                    onEditSectionHeader={editSectionHeader}
                    onComment={canComment ? handleComment : undefined}
                    onDirtyChange={setEditorDirty}
                    onOpenSidebar={handleOpenSidebar}
                  />
                </div>
              </div>
            </div>

            {/* Right margin: comment bubbles — icons on narrow, full cards on wide */}
            {marginComments.length > 0 && (
              <div className="shrink-0 w-8 editor-lg:w-48">
                <div className="sticky top-8 space-y-2">
                  {marginComments.map(mc => (
                    <button
                      key={mc.id}
                      onClick={() => { handleSelectVerse(mc.verseNumber); setSidebarVerse(mc.verseNumber); setSidebarCommentId(mc.id) }}
                      className={cn(
                        'transition-colors',
                        // Compact icon mode
                        'w-7 h-7 flex items-center justify-center rounded-full border text-xs font-medium',
                        // Expand to full card on wide
                        'editor-lg:w-full editor-lg:h-auto editor-lg:rounded-md editor-lg:p-2 editor-lg:text-left editor-lg:block',
                        sidebarCommentId === mc.id
                          ? 'border-amber-300 bg-amber-50 text-amber-700'
                          : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:shadow-sm'
                      )}
                    >
                      {/* Icon mode: verse number */}
                      <span className="editor-lg:hidden">{mc.verseNumber}</span>
                      {/* Full card mode */}
                      <span className="hidden editor-lg:inline text-stone-400">Jae {mc.verseNumber}</span>
                      <br className="hidden editor-lg:block" />
                      <span className="hidden editor-lg:inline text-stone-600">
                        {mc.authorName}: {mc.preview}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline sidebar — medium and wide */}
      {displayedVerse !== null && layoutMode !== 'narrow' && (
        <div className="hidden editor-md:flex w-96 shrink-0 border-l border-stone-200 bg-white flex-col overflow-hidden">
          <VerseDetailPanel
            verseNumber={displayedVerse}
            textWorkId={currentTw?.id}
            focusCommentId={sidebarCommentId}
            onFocusComment={setSidebarCommentId}
            onClose={() => { setCursorVerse(null); setSidebarVerse(null); setSidebarCommentId(null) }}
          />
        </div>
      )}

      {/* Empty sidebar placeholder when no verse selected — medium and wide */}
      {displayedVerse === null && layoutMode !== 'narrow' && (
        <div className="hidden editor-md:flex w-96 shrink-0 border-l border-stone-200 bg-white flex-col overflow-hidden">
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <p className="text-sm text-stone-400">Valitse jae nähdäksesi tiedot</p>
          </div>
        </div>
      )}

      {/* Floating sidebar overlay — narrow, on-demand */}
      {layoutMode === 'narrow' && sidebarVerse !== null && (
        <>
          <div className="fixed inset-0 bg-black/20 z-20" onClick={dismissOverlay} />
          <div className="fixed inset-y-0 right-0 w-96 max-w-[90vw] z-30 bg-white border-l border-stone-200 shadow-xl flex flex-col overflow-hidden">
            <VerseDetailPanel
              verseNumber={sidebarVerse}
              textWorkId={currentTw?.id}
              focusCommentId={sidebarCommentId}
              onFocusComment={setSidebarCommentId}
              onClose={dismissOverlay}
              overlay
            />
          </div>
        </>
      )}

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
