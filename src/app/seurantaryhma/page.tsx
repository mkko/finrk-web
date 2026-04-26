'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { STATUS_LABELS, STATUS_COLORS, proposalVerseRef } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { MessageSquare } from 'lucide-react'

export default function SeurantaryhmaPage() {
  const { proposals, users, currentUserId, addComment, addBatchFeedback } = useStore()
  const currentUser = users.find(u => u.id === currentUserId)!
  const [batchFeedback, setBatchFeedback] = useState('')
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({})

  if (currentUser.role !== 'seurantaryhma') {
    return (
      <div className="h-full overflow-y-auto"><div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <p className="text-stone-500">Tämä näkymä on tarkoitettu seurantaryhmän jäsenille.</p>
      </div></div>
    )
  }

  const reviewProposals = proposals.filter(p => p.status === 'ehdotettu' || p.status === 'hyvaksytty_lopullisesti')

  return (
    <div className="h-full overflow-y-auto"><div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <h1 className="text-xl font-semibold text-stone-800 mb-2">Seurantaryhmän arviointi</h1>
      <p className="text-sm text-stone-500 mb-6">
        Alla olevat ehdotukset ovat seurantaryhmän nähtävillä.
      </p>

      {reviewProposals.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          Ei arvioitavia ehdotuksia tällä hetkellä.
        </div>
      ) : (
        <div className="space-y-6">
          {reviewProposals.map(proposal => {
            const author = users.find(u => u.id === proposal.authorId)!
            const verseRef = proposalVerseRef(proposal)
            const commentText = commentTexts[proposal.id] || ''
            const visibleComments = proposal.comments.filter(c => c.thread === 'seurantaryhma')

            return (
              <div key={proposal.id} className="bg-white rounded-lg border border-stone-200 overflow-hidden">
                <div className="px-6 py-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-stone-800">{verseRef}</h3>
                      <p className="text-sm text-stone-500">Ehdottaja: {author.name}</p>
                    </div>
                    <Badge variant="outline" className={cn('text-xs', STATUS_COLORS[proposal.status])}>
                      {STATUS_LABELS[proposal.status]}
                    </Badge>
                  </div>

                  {proposal.ranges.map((range, i) => (
                    <div key={i} className="bg-stone-50 rounded-md border border-stone-200 p-4">
                      {proposal.ranges.length > 1 && (
                        <p className="text-xs font-medium text-stone-400 mb-1">
                          {range.verseStart === range.verseEnd ? `Jae ${range.verseStart}` : `Jakeet ${range.verseStart}–${range.verseEnd}`}
                        </p>
                      )}
                      <p className="font-serif text-base leading-7 text-stone-800">
                        {range.proposedText}
                      </p>
                    </div>
                  ))}

                  <p className="text-sm text-stone-600">{proposal.rationale}</p>

                  {/* Seurantaryhmä thread comments only */}
                  {visibleComments.length > 0 && (
                    <div className="space-y-2 pt-2">
                      {visibleComments.map(comment => {
                        const commentAuthor = users.find(u => u.id === comment.authorId)!
                        return (
                          <div key={comment.id} className="text-sm">
                            <span className="font-medium text-stone-700">{commentAuthor.name}</span>
                            <span className="text-stone-400 ml-2 text-xs">
                              {new Date(comment.createdAt).toLocaleDateString('fi-FI')}
                            </span>
                            <p className="text-stone-600 mt-0.5">{comment.text}</p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Add comment — only on non-final proposals */}
                {proposal.status !== 'hyvaksytty_lopullisesti' && (
                  <div className="border-t border-stone-200 px-6 py-4">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Kirjoita palaute tästä ehdotuksesta..."
                        value={commentText}
                        onChange={e => setCommentTexts({ ...commentTexts, [proposal.id]: e.target.value })}
                        className="min-h-[60px] text-sm resize-none"
                        rows={2}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (commentText.trim()) {
                            addComment(proposal.id, { authorId: currentUserId, text: commentText.trim(), thread: 'seurantaryhma' })
                            setCommentTexts({ ...commentTexts, [proposal.id]: '' })
                          }
                        }}
                        disabled={!commentText.trim()}
                        className="self-end shrink-0"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Batch feedback */}
          <div className="bg-white rounded-lg border border-stone-200 p-6 space-y-3">
            <h3 className="font-medium text-stone-800">Kokonaispalaute</h3>
            <p className="text-sm text-stone-500">
              Voit antaa yleistä palautetta kaikista arvioitavista ehdotuksista.
            </p>
            <Textarea
              placeholder="Kirjoita kokonaispalaute..."
              value={batchFeedback}
              onChange={e => setBatchFeedback(e.target.value)}
              className="min-h-[80px] text-sm"
              rows={3}
            />
            <Button
              size="sm"
              onClick={() => {
                if (batchFeedback.trim()) {
                  addBatchFeedback(batchFeedback.trim())
                  setBatchFeedback('')
                }
              }}
              disabled={!batchFeedback.trim()}
            >
              Lähetä palaute
            </Button>
          </div>
        </div>
      )}
    </div></div>
  )
}
