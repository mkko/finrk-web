'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { STATUS_LABELS, STATUS_COLORS, proposalVerseRef } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Check, ArrowLeft } from 'lucide-react'

export default function HallitusPage() {
  const { proposals, users, verses, currentUserId, updateProposalStatus } = useStore()
  const currentUser = users.find(u => u.id === currentUserId)!
  const [sendBackTexts, setSendBackTexts] = useState<Record<string, string>>({})
  const [showSendBack, setShowSendBack] = useState<Record<string, boolean>>({})

  if (currentUser.role !== 'hallitus') {
    return (
      <div className="h-full overflow-y-auto"><div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <p className="text-stone-500">Tämä näkymä on tarkoitettu hallituksen jäsenille.</p>
      </div></div>
    )
  }

  const ratificationProposals = proposals.filter(p => p.status === 'ehdotettu')

  return (
    <div className="h-full overflow-y-auto"><div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <h1 className="text-xl font-semibold text-stone-800 mb-2">Hallituksen hyväksyntä</h1>
      <p className="text-sm text-stone-500 mb-6">
        Alla olevat ehdotukset odottavat hallituksen hyväksyntää.
      </p>

      {ratificationProposals.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          Ei hyväksyttäviä ehdotuksia tällä hetkellä.
        </div>
      ) : (
        <div className="space-y-6">
          {ratificationProposals.map(proposal => {
            const author = users.find(u => u.id === proposal.authorId)!
            const verseRef = proposalVerseRef(proposal)
            const sendBackText = sendBackTexts[proposal.id] || ''
            const mainComments = proposal.comments.filter(c => c.thread === 'main')

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

                  {/* Side by side comparison — one row per range */}
                  {proposal.ranges.map((range, i) => {
                    const originalVerses = verses.filter(v => v.number >= range.verseStart && v.number <= range.verseEnd)
                    const originalText = originalVerses.map(v => v.baseText).join(' ')
                    return (
                      <div key={i}>
                        {proposal.ranges.length > 1 && (
                          <p className="text-xs font-medium text-stone-400 mb-1">
                            {range.verseStart === range.verseEnd ? `Jae ${range.verseStart}` : `Jakeet ${range.verseStart}–${range.verseEnd}`}
                          </p>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
                            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Nykyinen</p>
                            <p className="font-serif text-sm leading-6 text-stone-600">{originalText}</p>
                          </div>
                          <div className="rounded-md border border-emerald-200 bg-emerald-50/50 p-3">
                            <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">Ehdotettu</p>
                            <p className="font-serif text-sm leading-6 text-stone-800">{range.proposedText}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  <p className="text-sm text-stone-600">{proposal.rationale}</p>

                  {/* Main thread comments */}
                  {mainComments.length > 0 && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-stone-500 hover:text-stone-700">
                        {mainComments.length} kommenttia
                      </summary>
                      <div className="mt-2 space-y-2 pl-3 border-l-2 border-stone-200">
                        {mainComments.map(comment => {
                          const commentAuthor = users.find(u => u.id === comment.authorId)!
                          return (
                            <div key={comment.id}>
                              <span className="font-medium text-stone-700">{commentAuthor.name}</span>
                              <p className="text-stone-600">{comment.text}</p>
                            </div>
                          )
                        })}
                      </div>
                    </details>
                  )}
                </div>

                {/* Actions */}
                <div className="border-t border-stone-200 px-6 py-4">
                  {showSendBack[proposal.id] ? (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Perustele palautus..."
                        value={sendBackText}
                        onChange={e => setSendBackTexts({ ...sendBackTexts, [proposal.id]: e.target.value })}
                        className="min-h-[60px] text-sm resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowSendBack({ ...showSendBack, [proposal.id]: false })}
                        >
                          Peruuta
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (sendBackText.trim()) {
                              updateProposalStatus(proposal.id, 'luonnos', sendBackText.trim())
                              setSendBackTexts({ ...sendBackTexts, [proposal.id]: '' })
                              setShowSendBack({ ...showSendBack, [proposal.id]: false })
                            }
                          }}
                          disabled={!sendBackText.trim()}
                        >
                          Palauta
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowSendBack({ ...showSendBack, [proposal.id]: true })}
                        className="text-amber-700"
                      >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Palauta luonnokseksi
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateProposalStatus(proposal.id, 'hyvaksytty_lopullisesti')}
                        className="ml-auto bg-emerald-700 hover:bg-emerald-600"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Hyväksy
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div></div>
  )
}
