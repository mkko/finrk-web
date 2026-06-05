'use client'

import { useState, useRef } from 'react'
import { Verse, Proposal, User, PersonaRole, proposalCoversVerse, proposalVerseRef } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ContinuousDocProps {
  verses: Verse[]
  proposals: Proposal[]
  users: User[]
  currentUserId: string
  currentUserRole: PersonaRole
  showProposals: boolean
  showReviewComments: boolean
  selectedVerse: number | null
  onSelectVerse: (num: number) => void
  onAddProposal: (proposal: {
    ranges: { verseStart: number; verseEnd: number; proposedText: string }[]
    rationale: string
    authorId: string
    status: 'luonnos'
  }) => void
}

function InlineVerseEditor({
  verse,
  onSave,
  onCancel,
}: {
  verse: Verse
  onSave: (text: string, rationale: string) => void
  onCancel: () => void
}) {
  const spanRef = useRef<HTMLSpanElement>(null)
  const textRef = useRef(verse.text)
  const [rationale, setRationale] = useState('')

  return (
    <span className="inline">
      <span
        ref={spanRef}
        contentEditable
        suppressContentEditableWarning
        className="bg-green-200/70 focus:outline-none"
        onInput={e => { textRef.current = e.currentTarget.textContent ?? '' }}
        onKeyDown={e => {
          if (e.key === 'Escape') onCancel()
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            const text = textRef.current.trim()
            if (text && text !== verse.text) onSave(text, rationale)
            else onCancel()
          }
        }}
        autoFocus
      >
        {verse.text}
      </span>
      <span className="inline-flex items-center gap-1 ml-1 align-baseline">
        <input
          type="text"
          value={rationale}
          onChange={e => setRationale(e.target.value)}
          placeholder="Perustelu"
          className="text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded px-1 py-0 w-24 focus:outline-none"
          onKeyDown={e => {
            if (e.key === 'Escape') onCancel()
            if (e.key === 'Enter') {
              const text = textRef.current.trim()
              if (text && text !== verse.text) onSave(text, rationale)
              else onCancel()
            }
          }}
        />
        <button
          onClick={() => {
            const text = textRef.current.trim()
            if (text && text !== verse.text) onSave(text, rationale)
            else onCancel()
          }}
          className="text-xs font-medium px-1.5 py-0 rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          OK
        </button>
        <button
          onClick={onCancel}
          className="text-xs text-stone-400 hover:text-stone-600"
        >
          Peru
        </button>
      </span>
    </span>
  )
}

export function ContinuousDoc({
  verses, proposals, users, currentUserId, currentUserRole,
  showProposals, showReviewComments,
  selectedVerse, onSelectVerse, onAddProposal,
}: ContinuousDocProps) {
  const [editingVerse, setEditingVerse] = useState<number | null>(null)

  function handleSave(verseNum: number, text: string, rationale: string) {
    onAddProposal({
      ranges: [{ verseStart: verseNum, verseEnd: verseNum, proposedText: text }],
      rationale,
      authorId: currentUserId,
      status: 'luonnos',
    })
    setEditingVerse(null)
  }

  function handleVerseClick(verseNum: number) {
    onSelectVerse(verseNum)
    // Only translators can edit, and only if no active proposal
    if (currentUserRole === 'kaantaja' && showProposals) {
      const hasActiveProposal = proposals.some(
        p => p.status !== 'hyvaksytty_lopullisesti' && proposalCoversVerse(p, verseNum)
      )
      if (!hasActiveProposal) {
        setEditingVerse(verseNum)
      }
    }
  }

  return (
    <div className="continuous-doc">
      {verses.map(verse => {
        const activeProposal = proposals.find(
          p => p.status !== 'hyvaksytty_lopullisesti' && proposalCoversVerse(p, verse.number)
        )
        const proposalRange = activeProposal?.ranges.find(
          r => verse.number >= r.verseStart && verse.number <= r.verseEnd
        )
        const isEditing = editingVerse === verse.number

        return (
          <span key={verse.number} className="inline">
            {/* Section header as block break */}
            {verse.sectionHeader && (
              <h3 className="font-serif text-base font-semibold text-stone-700 mt-6 mb-2 block">
                {verse.sectionHeader}
              </h3>
            )}

            {/* Verse number */}
            <sup className="text-xs text-stone-400 font-sans mr-0.5 select-none">
              {verse.number}
            </sup>

            {/* Verse text — editable or read-only */}
            {isEditing ? (
              <InlineVerseEditor
                verse={verse}
                onSave={(text, rationale) => handleSave(verse.number, text, rationale)}
                onCancel={() => setEditingVerse(null)}
              />
            ) : (
              <span
                className={cn(
                  'cursor-pointer transition-colors rounded-sm',
                  selectedVerse === verse.number && 'bg-stone-100',
                )}
                onClick={() => handleVerseClick(verse.number)}
              >
                {verse.text}
              </span>
            )}
            {' '}

            {/* Green proposed text inline below */}
            {showProposals && proposalRange && verse.number === proposalRange.verseStart && !isEditing && (
              <div className="bg-green-100 border-l-2 border-green-500 pl-2 py-0.5 my-0.5 text-stone-700">
                <sup className="text-xs text-green-700 font-sans mr-0.5">{verse.number}</sup>
                {proposalRange.proposedText}
                <span className="text-xs text-green-600 ml-1">
                  — {users.find(u => u.id === activeProposal?.authorId)?.name ?? 'Tuntematon'}
                </span>
              </div>
            )}

            {/* Review comments */}
            {showReviewComments && activeProposal?.comments
              .filter(c => c.thread === 'seurantaryhma')
              .map((c, i) => (
                <div key={i} className="py-0.5 text-sm">
                  <span className="bg-yellow-200/70">{c.text}</span>
                </div>
              ))
            }

            {/* Footnotes */}
            {verse.footnotes?.map(fn => (
              <div key={fn.marker} className="ml-8 text-sm text-stone-400 leading-relaxed">
                <sup className="text-xs font-sans mr-0.5">{fn.marker}</sup>
                {fn.text}
              </div>
            ))}
          </span>
        )
      })}
    </div>
  )
}
