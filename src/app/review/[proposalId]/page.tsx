'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useStore } from '@/lib/store'
import { STATUS_LABELS, STATUS_COLORS, textWorkLabel } from '@/lib/types'
import type { Comment as CommentType } from '@/lib/types'
import { WordDiff } from '@/components/chapter/VersionHistory'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Check, X, ArrowLeft, MessageSquare, UserPlus, UserMinus, Send } from 'lucide-react'
import Link from 'next/link'

export default function ReviewPage() {
  const params = useParams()
  const proposalId = params.proposalId as string

  const { proposals, textWorks, users, verses, snapshots, comments, currentUserId, approveProposal, rejectProposal, cancelProposal, updateSelectedVoters, addComment } = useStore()
  const currentUser = users.find(u => u.id === currentUserId)

  const proposal = proposals.find(p => p.id === proposalId)
  const tw = proposal ? textWorks.find(t => t.id === proposal.textWorkId) : null
  const snapshot = proposal ? snapshots.find(s => s.id === proposal.snapshotId) : null

  const [rejectText, setRejectText] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [selectedVerse, setSelectedVerse] = useState<{ chapter: number; number: number } | null>(null)
  const docRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const [commentPopup, setCommentPopup] = useState<{ top: number; left: number; chapter: number; verse: number; selectedText: string } | null>(null)
  const [bubbleComment, setBubbleComment] = useState('')

  const submitter = users.find(u => u.id === snapshot?.createdBy)
  const isHallitus = currentUser?.roles.includes('hallitus') ?? false
  const isTekstiryhma = currentUser?.roles.includes('tekstiryhma') ?? false
  const isResolved = !!proposal?.resolvedAt
  const isCancelled = !!proposal?.cancelledAt
  const isApproved = isResolved && tw?.status === 'hyvaksytty'
  const isRejected = isResolved && tw?.status === 'hylatty'
  const isPending = !isResolved && !isCancelled && tw?.status === 'lahetetty_hallitukselle'

  // Build diff data with context
  const CONTEXT_LINES = 2
  const snapshotVerses = snapshot?.verseTexts ?? []
  const changedSet = new Set<string>()
  const contextSet = new Set<string>()

  // Find changed verses — compare against baseText for resolved proposals
  // (approvedText gets updated on acceptance, making the diff empty)
  const diffMap = new Map<string, { oldText: string; newText: string }>()
  for (const sv of snapshotVerses) {
    const key = `${sv.chapter}:${sv.number}`
    const currentVerse = verses.find(v => v.chapter === sv.chapter && v.number === sv.number)
    const oldText = isResolved ? (currentVerse?.baseText ?? '') : (currentVerse?.approvedText ?? '')
    if (oldText !== sv.text) {
      changedSet.add(key)
      diffMap.set(key, { oldText, newText: sv.text })
    }
  }

  // Expand context around changes
  for (const sv of snapshotVerses) {
    const key = `${sv.chapter}:${sv.number}`
    if (changedSet.has(key)) {
      const idx = snapshotVerses.indexOf(sv)
      for (let j = Math.max(0, idx - CONTEXT_LINES); j <= Math.min(snapshotVerses.length - 1, idx + CONTEXT_LINES); j++) {
        const ck = `${snapshotVerses[j].chapter}:${snapshotVerses[j].number}`
        if (!changedSet.has(ck)) contextSet.add(ck)
      }
    }
  }

  // Build display list with separators for gaps
  type DisplayVerse = { type: 'verse'; chapter: number; number: number; text: string; changed: boolean; diff?: { oldText: string; newText: string } }
  type DisplaySep = { type: 'separator' }
  const displayItems: (DisplayVerse | DisplaySep)[] = []
  let lastIdx = -2

  // If no changes found (e.g. all text identical), show all snapshot verses
  const showAll = changedSet.size === 0

  for (let i = 0; i < snapshotVerses.length; i++) {
    const sv = snapshotVerses[i]
    const key = `${sv.chapter}:${sv.number}`
    const isChanged = changedSet.has(key)
    const isContext = contextSet.has(key)
    if (!showAll && !isChanged && !isContext) continue

    if (lastIdx >= 0 && i - lastIdx > 1) {
      displayItems.push({ type: 'separator' })
    }
    displayItems.push({
      type: 'verse',
      chapter: sv.chapter,
      number: sv.number,
      text: sv.text,
      changed: isChanged,
      diff: diffMap.get(key),
    })
    lastIdx = i
  }

  // ── Text selection → comment popup ─────────────
  const textWorkId = proposal?.textWorkId
  useEffect(() => {
    if (!isHallitus || isCancelled) return

    function onMouseUp() {
      requestAnimationFrame(() => {
        if (!docRef.current) return
        const sel = window.getSelection()
        if (!sel || sel.isCollapsed) return
        const text = sel.toString().trim()
        if (!text) return

        // Find the verse element containing the selection
        const anchor = sel.anchorNode
        const verseEl = anchor instanceof HTMLElement
          ? anchor.closest('[data-verse]')
          : anchor?.parentElement?.closest('[data-verse]')
        if (!verseEl) return

        const chapter = parseInt(verseEl.getAttribute('data-chapter') ?? '0', 10)
        const verse = parseInt(verseEl.getAttribute('data-verse') ?? '0', 10)
        if (!chapter || !verse) return

        const range = sel.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        const containerRect = docRef.current.getBoundingClientRect()

        setBubbleComment('')
        setCommentPopup({
          top: rect.bottom - containerRect.top + 4,
          left: rect.left - containerRect.left + rect.width / 2,
          chapter, verse, selectedText: text,
        })
      })
    }

    function onMouseDown(e: MouseEvent) {
      if (popupRef.current?.contains(e.target as Node)) return
      setCommentPopup(null)
      setBubbleComment('')
    }

    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mousedown', onMouseDown)
    return () => {
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('mousedown', onMouseDown)
    }
  }, [isHallitus, isCancelled])

  const handleSubmitComment = useCallback(() => {
    if (!commentPopup || !bubbleComment.trim() || !textWorkId) return
    addComment({
      textWorkId,
      verseAnchor: { chapter: commentPopup.chapter, verseStart: commentPopup.verse },
      verseSnapshot: commentPopup.selectedText,
      authorId: currentUserId,
      text: bubbleComment.trim(),
      thread: 'hallitus',
    })
    setBubbleComment('')
    setCommentPopup(null)
    window.getSelection()?.removeAllRanges()
    // Open sidebar on that verse
    setSelectedVerse({ chapter: commentPopup.chapter, number: commentPopup.verse })
  }, [commentPopup, bubbleComment, addComment, textWorkId, currentUserId])

  // ── Early returns (after all hooks) ─────────────
  if (!currentUser) return null

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

  // Discussion: all comments for the textWork, grouped by verse
  const relatedComments = comments.filter(c => c.textWorkId === proposal.textWorkId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  function verseComments(chapter: number, verseNumber: number): CommentType[] {
    return relatedComments.filter(c => c.verseAnchor.chapter === chapter && c.verseAnchor.verseStart === verseNumber)
  }

  // Status for display
  const displayStatus = isCancelled ? 'Peruutettu' : STATUS_LABELS[tw.status]
  const displayStatusColor = isCancelled
    ? 'bg-stone-100 text-stone-600 border-stone-300'
    : STATUS_COLORS[tw.status]

  function handleReject() {
    if (rejectText.trim()) {
      rejectProposal(proposalId, rejectText.trim())
      setRejectText('')
      setShowReject(false)
    }
  }

  function handleCancel() {
    cancelProposal(proposalId)
    setShowCancelConfirm(false)
  }

  // Collect margin comment bubbles per verse
  const marginBubbles = displayItems
    .filter((item): item is DisplayVerse => item.type === 'verse')
    .flatMap(item => {
      const vc = verseComments(item.chapter, item.number)
      if (vc.length === 0) return []
      const first = vc[0]
      const author = users.find(u => u.id === first.authorId)
      return [{
        chapter: item.chapter,
        number: item.number,
        count: vc.length,
        preview: `${author?.name?.split(' ')[0] ?? ''}: "${first.text.length > 30 ? first.text.slice(0, 30) + '…' : first.text}"`,
      }]
    })

  // Selected verse comments for sidebar
  const sidebarComments = selectedVerse
    ? verseComments(selectedVerse.chapter, selectedVerse.number)
    : []
  const selectedVerseData = selectedVerse
    ? snapshotVerses.find(sv => sv.chapter === selectedVerse.chapter && sv.number === selectedVerse.number)
    : null

  return (
    <div className="h-full flex">
      {/* Main content column */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Top bar */}
        <div className="flex-none border-b border-stone-200 bg-white px-4 py-2 flex items-center gap-3">
          <Link
            href={isHallitus ? '/hallitus' : '/lahetys'}
            className="text-sm text-stone-500 hover:text-stone-700 inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Takaisin
          </Link>
          <div className="flex-1" />
          <Badge variant="outline" className={cn('text-xs', displayStatusColor)}>
            {displayStatus}
          </Badge>
        </div>

        {/* Scrollable document area */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-stone-100">
          <div className="py-8 px-4 flex justify-start lg:justify-center gap-4">
            {/* A4 page */}
            <div className="w-full max-w-3xl shrink-0">
              {/* Meta cards above the document */}
              <div className="space-y-3 mb-6">
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

                {/* Rationale */}
                {proposal.rationale && (
                  <div className="bg-stone-50 rounded-lg border border-stone-200 p-4">
                    <p className="text-sm text-stone-600">{proposal.rationale}</p>
                  </div>
                )}
              </div>

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

        {/* Board decision — any board member can resolve */}
        {isHallitus && isPending && (
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 space-y-3">
            <h2 className="text-xs font-medium text-stone-500 uppercase tracking-wide">Hallituksen päätös</h2>
            {showReject ? (
              <div className="space-y-3">
                <Textarea
                  placeholder="Perustele palautus..."
                  value={rejectText}
                  onChange={e => setRejectText(e.target.value)}
                  className="min-h-[80px] text-sm resize-none"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowReject(false)}>
                    Peruuta
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-700" onClick={handleReject} disabled={!rejectText.trim()}>
                    Palauta käännettäväksi
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-red-700" onClick={() => setShowReject(true)}>
                  Palauta käännettäväksi
                </Button>
                <Button size="sm" variant="outline" className="text-emerald-700" onClick={() => approveProposal(proposalId)}>
                  Vahvista käännös
                </Button>
              </div>
            )}
          </div>
        )}

              {/* Document page */}
              <div
                ref={docRef}
                className="bg-white border border-stone-300 shadow-md font-serif text-base leading-7 text-stone-800 relative"
                style={{ padding: '40px 50px', minHeight: '600px' }}
              >
                <h1 className="text-2xl font-semibold text-stone-800 leading-tight mb-4">{textWorkLabel(tw)}</h1>
                {displayItems.map((item, i) => {
                  if (item.type === 'separator') {
                    return <div key={`sep-${i}`} className="my-4 border-t border-dashed border-stone-200" />
                  }
                  const hasComments = verseComments(item.chapter, item.number).length > 0
                  const isSelected = selectedVerse?.chapter === item.chapter && selectedVerse?.number === item.number
                  return (
                    <p
                      key={`${item.chapter}:${item.number}`}
                      data-chapter={item.chapter}
                      data-verse={item.number}
                      className={cn(
                        'mb-1 cursor-pointer rounded-sm px-1 -mx-1 transition-colors',
                        !item.changed && 'text-stone-400',
                        isSelected && 'bg-amber-50',
                        hasComments && !isSelected && 'hover:bg-stone-50',
                      )}
                      onClick={() => setSelectedVerse(
                        isSelected ? null : { chapter: item.chapter, number: item.number }
                      )}
                    >
                      <span
                        className="text-xs font-sans"
                        style={{ verticalAlign: 'super', fontSize: '0.65em', lineHeight: 0, color: item.changed ? '#a8a29e' : '#d6d3d1' }}
                      >
                        {item.number}
                      </span>{' '}
                      {item.changed && item.diff ? (
                        <WordDiff oldText={item.diff.oldText} newText={item.diff.newText} />
                      ) : (
                        <span>{item.text}</span>
                      )}
                    </p>
                  )
                })}

                {/* Comment popup on text selection */}
                {commentPopup && (
                  <div
                    ref={popupRef}
                    className="absolute z-20"
                    style={{ top: commentPopup.top, left: commentPopup.left, transform: 'translateX(-50%)' }}
                  >
                    <div className="bg-white rounded-lg shadow-lg border border-stone-200 p-3 w-72">
                      <p className="text-xs text-stone-400 mb-1.5 truncate">
                        &ldquo;{commentPopup.selectedText.length > 50 ? commentPopup.selectedText.slice(0, 50) + '…' : commentPopup.selectedText}&rdquo;
                      </p>
                      <textarea
                        value={bubbleComment}
                        onChange={e => setBubbleComment(e.target.value)}
                        placeholder="Kirjoita kommentti..."
                        className="w-full text-sm border border-stone-200 rounded px-2.5 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-violet-400 font-sans"
                        rows={2}
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmitComment()
                          if (e.key === 'Escape') { setCommentPopup(null); setBubbleComment('') }
                        }}
                      />
                      <button
                        onMouseDown={e => e.preventDefault()}
                        onClick={handleSubmitComment}
                        disabled={!bubbleComment.trim()}
                        className="mt-2 w-full text-sm rounded-md bg-violet-700 text-white px-3 py-1.5 hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-sans"
                      >
                        Kommentoi
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Status cards below the document */}
              <div className="mt-6 space-y-3">
                {isResolved && (
                  <div className={cn('rounded-lg border p-4', isApproved ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50')}>
                    <p className={cn('text-sm font-medium', isApproved ? 'text-emerald-800' : 'text-red-800')}>
                      {isApproved ? 'Hyväksytty' : 'Hylätty'}
                    </p>
                    {proposal.votes.filter(v => v.decision === 'reject' && v.comment).map((v, i) => {
                      const voter = users.find(u => u.id === v.userId)
                      return <p key={i} className="mt-2 text-sm text-red-700"><span className="font-medium">{voter?.name}:</span> {v.comment}</p>
                    })}
                  </div>
                )}

                {isCancelled && (
                  <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                    <p className="text-sm text-stone-600">
                      Äänestys peruutettu {new Date(proposal.cancelledAt!).toLocaleDateString('fi-FI', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                )}

                {isTekstiryhma && isPending && (
                  <div className="rounded-lg border border-stone-200 bg-white p-4">
                    {showCancelConfirm ? (
                      <div className="space-y-3">
                        <p className="text-sm text-stone-600">Haluatko varmasti peruuttaa äänestyksen?</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setShowCancelConfirm(false)}>Ei</Button>
                          <Button size="sm" variant="outline" className="text-red-700" onClick={handleCancel}>Kyllä, peruuta</Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="text-red-700" onClick={() => setShowCancelConfirm(true)}>
                        Peruuta äänestys
                      </Button>
                    )}
                  </div>
                )}

              </div>
            </div>

            {/* Right margin: comment bubbles */}
            <div className="shrink-0 w-48 hidden lg:block">
              {marginBubbles.length > 0 && (
                <div className="sticky top-8 space-y-2">
                  {marginBubbles.map(mb => {
                    const isActive = selectedVerse?.chapter === mb.chapter && selectedVerse?.number === mb.number
                    return (
                      <button
                        key={`${mb.chapter}:${mb.number}`}
                        onClick={() => setSelectedVerse(isActive ? null : { chapter: mb.chapter, number: mb.number })}
                        className={cn(
                          'w-full text-left rounded-md border p-2 text-xs transition-colors',
                          isActive
                            ? 'border-amber-300 bg-amber-50 text-amber-700'
                            : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:shadow-sm'
                        )}
                      >
                        <span className="text-stone-400">Jae {mb.number}</span>
                        <br />
                        <span className="text-stone-600">{mb.preview}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar — verse detail + comments */}
      {selectedVerse && (
        <div className="w-96 shrink-0 border-l border-stone-200 bg-white flex flex-col overflow-hidden">
          <div className="flex-none px-4 py-3 border-b border-stone-200 flex items-center justify-between">
            <h2 className="font-medium text-stone-800">Jae {selectedVerse.number}</h2>
            <button onClick={() => setSelectedVerse(null)} className="text-stone-400 hover:text-stone-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Current text */}
            {selectedVerseData && (
              <div>
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Nykyinen teksti</p>
                <p className="text-sm text-stone-700 font-serif leading-relaxed">{selectedVerseData.text}</p>
              </div>
            )}

            {/* Comments */}
            <div>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
                Kaikki kommentit ({sidebarComments.length})
              </p>
              {sidebarComments.length === 0 ? (
                <p className="text-sm text-stone-400">Ei kommentteja.</p>
              ) : (
                <div className="space-y-2">
                  {sidebarComments.map(c => {
                    const author = users.find(u => u.id === c.authorId)
                    const threadLabel = c.thread === 'hallitus' ? 'Hallitus' : c.thread === 'seurantaryhma' ? 'Seurantaryhmä' : 'Tekstiryhmä'
                    return (
                      <div key={c.id} className={cn(
                        'rounded-lg border p-3',
                        c.thread === 'hallitus' ? 'border-violet-200 bg-violet-50/30' : 'border-stone-200'
                      )}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-stone-700">{author?.name ?? 'Tuntematon'}</span>
                          <span className="text-xs text-stone-400">
                            {new Date(c.createdAt).toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                          </span>
                          {c.status === 'kasitelty' && <span className="text-xs text-stone-400 flex items-center gap-0.5"><Check className="h-3 w-3" /> Käsitelty</span>}
                        </div>
                        <p className="text-sm text-stone-600">{c.text}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Add comment */}
            {isHallitus && !isCancelled && (
              <CommentInput
                textWorkId={proposal.textWorkId}
                chapter={selectedVerse.chapter}
                verseNumber={selectedVerse.number}
                verseText={selectedVerseData?.text ?? ''}
                onSubmit={addComment}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CommentInput({ textWorkId, chapter, verseNumber, verseText, onSubmit }: {
  textWorkId: string
  chapter: number
  verseNumber: number
  verseText: string
  onSubmit: (comment: Omit<CommentType, 'id' | 'createdAt' | 'status'>) => void
}) {
  const [text, setText] = useState('')
  const currentUserId = useStore(s => s.currentUserId)

  function submit() {
    if (!text.trim()) return
    onSubmit({
      textWorkId,
      verseAnchor: { chapter, verseStart: verseNumber },
      verseSnapshot: verseText,
      authorId: currentUserId,
      text: text.trim(),
      thread: 'hallitus',
    })
    setText('')
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && text.trim()) { e.preventDefault(); submit() } }}
        placeholder="Kirjoita kommentti..."
        className="text-sm resize-none min-h-[60px]"
        rows={2}
      />
      <Button size="sm" disabled={!text.trim()} onClick={submit} className="w-full">
        <Send className="h-3.5 w-3.5 mr-1" /> Kommentoi
      </Button>
    </div>
  )
}
