'use client'

import { forwardRef, useState } from 'react'
import { Verse as VerseType, Footnote, ProposalStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Pencil } from 'lucide-react'

export interface ProposalAnnotation {
  id: string
  proposedText: string
  authorName: string
  status: ProposalStatus
  verseLabel: string
}

export interface ReviewComment {
  text: string
  authorName: string
}

export interface DraftState {
  text: string
  rationale: string
  onTextChange: (text: string) => void
  onRationaleChange: (rationale: string) => void
  onSubmit: () => void
  onCancel: () => void
}

interface VerseProps {
  verse: VerseType
  isSelected: boolean
  onSelect: () => void
  sectionHeader?: string
  footnotes?: Footnote[]
  proposalAnnotation?: ProposalAnnotation
  reviewComments?: ReviewComment[]
  onStartDraft?: () => void
  draftState?: DraftState
  showProposals: boolean
  showReviewComments: boolean
}

export const Verse = forwardRef<HTMLDivElement, VerseProps>(
  function Verse({
    verse, isSelected, onSelect, sectionHeader, footnotes,
    proposalAnnotation, reviewComments, onStartDraft, draftState,
    showProposals, showReviewComments,
  }, ref) {
    const [hovered, setHovered] = useState(false)

    return (
      <div ref={ref} className="mb-1">
        {sectionHeader && (
          <h3 className="font-serif text-base font-semibold text-stone-700 mt-6 mb-2">
            {sectionHeader}
          </h3>
        )}

        {/* Verse text line (read-only) */}
        <div
          className={cn(
            'group py-0.5 rounded-sm transition-colors cursor-pointer relative',
            isSelected && 'bg-stone-100',
            !isSelected && hovered && 'bg-stone-50',
          )}
          onClick={() => {
            if (window.getSelection()?.isCollapsed === false) return
            onSelect()
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect() }}
        >
          <sup className="text-xs text-stone-400 font-sans mr-0.5 select-none">
            {verse.number}
          </sup>
          {verse.text}

          {/* Pen icon — always visible on hover, only in proposals view */}
          {onStartDraft && showProposals && (
            <button
              onClick={e => { e.stopPropagation(); onStartDraft() }}
              className={cn(
                'inline-flex items-center justify-center w-5 h-5 rounded ml-1 align-middle transition-opacity',
                'text-stone-400 hover:text-stone-600 hover:bg-stone-200',
                hovered ? 'opacity-100' : 'opacity-0',
              )}
              title="Ehdota muutosta"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Active draft (editable, green) — inline like a Word line */}
        {draftState && showProposals && (
          <div className="py-0.5 space-y-1">
            <div
              contentEditable
              suppressContentEditableWarning
              onInput={e => draftState.onTextChange(e.currentTarget.textContent ?? '')}
              ref={el => { if (el && !el.textContent) el.textContent = draftState.text }}
              className="bg-green-200/70 font-serif text-base leading-7 text-stone-800 focus:outline-none min-h-[1.75rem]"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={draftState.rationale}
                onChange={e => draftState.onRationaleChange(e.target.value)}
                placeholder="Perustele muutos lyhyesti"
                className="flex-1 text-sm text-stone-500 bg-transparent border-none focus:outline-none placeholder:text-stone-300"
              />
              <button
                onClick={draftState.onSubmit}
                disabled={!draftState.text.trim() || draftState.text === verse.text}
                className="text-xs font-medium px-2 py-0.5 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Tallenna
              </button>
              <button
                onClick={draftState.onCancel}
                className="text-xs text-stone-400 hover:text-stone-600"
              >
                Peruuta
              </button>
            </div>
          </div>
        )}

        {/* Existing proposal (green, read-only) — styled like a Word highlight */}
        {proposalAnnotation && showProposals && !draftState && (
          <div className="py-0.5">
            <span className="bg-green-200/70">
              <sup className="text-xs text-green-700 font-sans mr-0.5">{verse.number}</sup>
              {proposalAnnotation.proposedText}
            </span>
          </div>
        )}

        {/* Seurantaryhmä comments (yellow) — styled like a Word highlight */}
        {showReviewComments && reviewComments?.map((rc, i) => (
          <div key={i} className="py-0.5 text-sm">
            <span className="bg-yellow-200/70">{rc.text}</span>
          </div>
        ))}

        {/* Footnotes */}
        {footnotes?.map(fn => (
          <p key={fn.marker} className="ml-8 text-sm text-stone-400 leading-relaxed">
            <sup className="text-xs font-sans mr-0.5">{fn.marker}</sup>
            {fn.text}
          </p>
        ))}
      </div>
    )
  }
)
