'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { Comment } from '@/lib/types'
import { getVerseComments } from '@/lib/selectors'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { X, MessageSquare, Check, ChevronLeft } from 'lucide-react'
import { renderWithHighlights } from '@/lib/highlight'
import { cn } from '@/lib/utils'

interface VerseDetailPanelProps {
  chapter: number
  verseNumber: number
  textWorkId?: string
  focusCommentId?: string | null
  onFocusComment?: (id: string | null) => void
  onClose: () => void
  overlay?: boolean
}

export function VerseDetailPanel({ chapter, verseNumber, textWorkId, focusCommentId, onFocusComment, onClose, overlay }: VerseDetailPanelProps) {
  useEffect(() => {
    if (overlay) return // overlay backdrop handles dismiss
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, overlay])

  return <PanelContent chapter={chapter} verseNumber={verseNumber} textWorkId={textWorkId} focusCommentId={focusCommentId} onFocusComment={onFocusComment} onClose={onClose} />
}

function PanelContent({ chapter, verseNumber, textWorkId, focusCommentId, onFocusComment, onClose }: { chapter: number; verseNumber: number; textWorkId?: string; focusCommentId?: string | null; onFocusComment?: (id: string | null) => void; onClose: () => void }) {
  const verses = useStore(s => s.verses)
  const users = useStore(s => s.users)
  const currentUser = useStore(s => s.users.find(u => u.id === s.currentUserId)) ?? { id: '', name: '', roles: ['tekstiryhma'] as const, roleLabel: '' }
  const allComments = useStore(s => s.comments)
  const addComment = useStore(s => s.addComment)
  const resolveComment = useStore(s => s.resolveComment)
  const merkinnat = useStore(s => s.merkinnat)
  const deleteMerkinta = useStore(s => s.deleteMerkinta)
  const updateMerkintaNote = useStore(s => s.updateMerkintaNote)

  const verse = verses.find(v => v.chapter === chapter && v.number === verseNumber)
  const hasBeenRevised = verse ? verse.text !== verse.baseText : false

  const isTekstiRyhma = currentUser.roles.includes('tekstiryhma')
  const isSeurantaryhma = currentUser.roles.includes('seurantaryhma')

  // Comments for this verse
  const verseComments = textWorkId ? getVerseComments(allComments, textWorkId, chapter, verseNumber) : []
  const commentThread = isSeurantaryhma ? 'seurantaryhma' : 'tekstiryhma'
  const allVisible = verseComments.filter(c => {
    if (isTekstiRyhma) return true // sees all threads
    return c.thread === commentThread
  })
  const openComments = allVisible.filter(c => c.status === 'avoin')
  const resolvedComments = allVisible.filter(c => c.status === 'kasitelty')

  // Merkintä (highlights) - only for tekstiryhma
  const verseHighlights = isTekstiRyhma
    ? merkinnat.filter(m => m.verses.some(v => v.chapter === chapter && v.verseNumber === verseNumber) && m.authorId === currentUser.id)
    : []
  const highlightTexts = verseHighlights.flatMap(m =>
    m.verses.filter(v => v.chapter === chapter && v.verseNumber === verseNumber).map(v => v.text)
  )

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteText, setEditingNoteText] = useState('')
  const [commentText, setCommentText] = useState('')

  useEffect(() => {
    setEditingNoteId(null)
    setCommentText('')
  }, [verseNumber])

  if (!verse) return null

  const focusedComment = focusCommentId ? allVisible.find(c => c.id === focusCommentId) : null
  const setFocusedId = onFocusComment ?? (() => {})

  function handleAddComment() {
    if (!commentText.trim() || !textWorkId) return
    addComment({
      textWorkId,
      verseAnchor: { chapter, verseStart: verseNumber },
      verseSnapshot: verse!.text,
      authorId: currentUser.id,
      text: commentText.trim(),
      thread: commentThread,
    })
    setCommentText('')
  }

  // Can comment: tekstiryhma always, seurantaryhma on published texts, hallitus never
  const canComment = isTekstiRyhma || isSeurantaryhma

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-stone-200 sticky top-0 bg-white z-10">
        <h2 className="font-semibold text-stone-800">
          Jae {verseNumber}
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
            {isTekstiRyhma ? renderWithHighlights(verse.text, highlightTexts) : verse.text}
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

        {/* Merkintä highlights (tekstiryhma only) */}
        {verseHighlights.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-2">
              Korostukset
            </h3>
            <div className="space-y-2">
              {verseHighlights.map(m => (
                <div key={m.id} className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  <div className="flex items-center justify-between">
                    <mark className="bg-amber-100/70 rounded-sm text-sm">{m.verses.map(v => v.text).join(' ')}</mark>
                    <button
                      onClick={() => deleteMerkinta(m.id)}
                      className="text-stone-400 hover:text-red-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {editingNoteId === m.id ? (
                    <div className="mt-1.5 space-y-1">
                      <textarea
                        value={editingNoteText}
                        onChange={e => setEditingNoteText(e.target.value)}
                        className="w-full text-xs border border-amber-200 rounded px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-amber-400"
                        rows={2}
                        autoFocus
                        placeholder="Muistiinpano..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { updateMerkintaNote(m.id, editingNoteText.trim()); setEditingNoteId(null) }}
                          className="text-xs text-amber-800 hover:text-amber-900 font-medium"
                        >
                          Tallenna
                        </button>
                        <button
                          onClick={() => setEditingNoteId(null)}
                          className="text-xs text-stone-400 hover:text-stone-600"
                        >
                          Peruuta
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingNoteId(m.id); setEditingNoteText(m.note ?? '') }}
                      className={cn("mt-1 text-xs text-left w-full", m.note ? "text-stone-600 hover:text-stone-800" : "text-stone-400 hover:text-amber-700 italic")}
                    >
                      {m.note || 'Lisää muistiinpano...'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(allVisible.length > 0 || canComment) && <Separator />}

        {/* Focused single-comment view */}
        {focusedComment ? (
          <div className="space-y-3">
            <button
              onClick={() => setFocusedId(null)}
              className="flex items-center gap-1 text-xs font-medium text-stone-400 hover:text-stone-600 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Kaikki kommentit ({allVisible.length})
            </button>
            <CommentCard
              comment={focusedComment}
              users={users}
              onResolve={focusedComment.status === 'avoin' ? () => resolveComment(focusedComment.id) : undefined}
              resolved={focusedComment.status === 'kasitelty'}
            />
          </div>
        ) : (
          <>
            {/* Comments summary — clickable to drill in */}
            {allVisible.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                  Kommentit ({allVisible.length})
                </h3>
                {openComments.map(comment => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    users={users}
                    onResolve={() => resolveComment(comment.id)}
                    onClick={() => setFocusedId(comment.id)}
                  />
                ))}
                {resolvedComments.map(comment => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    users={users}
                    resolved
                    onClick={() => setFocusedId(comment.id)}
                  />
                ))}
              </div>
            )}

            {/* Add comment form */}
            {canComment && textWorkId && (
              <div className="space-y-2">
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

            {/* No comments message */}
            {allVisible.length === 0 && !canComment && (
              <p className="text-sm text-stone-400 py-2">
                Ei kommentteja tälle jakeelle.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function CommentCard({
  comment,
  users,
  onResolve,
  resolved,
  onClick,
}: {
  comment: Comment
  users: { id: string; name: string }[]
  onResolve?: () => void
  resolved?: boolean
  onClick?: () => void
}) {
  const author = users.find(u => u.id === comment.authorId)
  const resolver = comment.resolvedBy ? users.find(u => u.id === comment.resolvedBy) : null

  return (
    <div
      className={cn(
        'rounded-lg border p-3 space-y-1.5',
        resolved ? 'border-stone-100 bg-stone-50/50' : 'border-stone-200 bg-white',
        onClick && 'cursor-pointer hover:border-stone-300 hover:shadow-sm transition-all'
      )}
      onClick={onClick}
    >
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-sm">
          <span className="font-medium text-stone-700">{author?.name ?? 'Tuntematon'}</span>
          <span className="text-xs text-stone-400 ml-2">{formatDate(comment.createdAt)}</span>
          {comment.thread === 'seurantaryhma' && (
            <Badge variant="outline" className="text-[10px] ml-2 px-1 py-0 border-amber-200 text-amber-600">
              seurantaryhmä
            </Badge>
          )}
        </div>
        {!resolved && onResolve && (
          <button
            onClick={e => { e.stopPropagation(); onResolve() }}
            className="text-xs text-stone-400 hover:text-emerald-600 flex items-center gap-0.5 shrink-0 transition-colors"
            title="Merkitse käsitellyksi"
          >
            <Check className="h-3.5 w-3.5" />
            Käsitelty
          </button>
        )}
      </div>
      <p className={cn('text-sm leading-relaxed', resolved ? 'text-stone-400' : 'text-stone-600')}>
        {comment.text}
      </p>
      {resolved && resolver && comment.resolvedAt && (
        <p className="text-[11px] text-stone-400">
          Käsitellyt: {resolver.name}, {formatDate(comment.resolvedAt)}
        </p>
      )}
    </div>
  )
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric', year: 'numeric' })
}
