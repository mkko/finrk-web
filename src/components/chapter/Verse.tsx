'use client'

import { forwardRef, useRef, useCallback, useState } from 'react'
import { Verse as VerseType, Proposal } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Pencil } from 'lucide-react'

export interface VerseEditState {
  text: string
  onChange: (text: string) => void
  isPrimary: boolean
}

interface VerseProps {
  verse: VerseType
  proposals: Proposal[]
  isSelected: boolean
  onSelect: () => void
  draftActive?: boolean
  inDraft?: boolean
  onRemoveFromScope?: () => void
  editState?: VerseEditState
}

export const Verse = forwardRef<HTMLSpanElement, VerseProps>(
  function Verse({ verse, proposals, isSelected, onSelect, draftActive, inDraft, onRemoveFromScope, editState }, ref) {
    const activeProposal = proposals.find(p => p.status !== 'hyvaksytty_lopullisesti')
    const hasBeenRevised = verse.text !== verse.baseText
    const [hovered, setHovered] = useState(false)

    const proposedRange = activeProposal?.ranges.find(r => verse.number >= r.verseStart && verse.number <= r.verseEnd)
    const proposedText = (proposedRange && verse.number === proposedRange.verseStart)
      ? proposedRange.proposedText
      : null

    const initialized = useRef(false)
    const initialTextRef = useRef('')
    const isPrimaryRef = useRef(false)
    if (editState) {
      if (!initialized.current) initialTextRef.current = editState.text
      isPrimaryRef.current = editState.isPrimary
    }

    const contentEditableRef = useCallback((el: HTMLSpanElement | null) => {
      if (el && !initialized.current) {
        el.textContent = initialTextRef.current
        initialized.current = true
        if (isPrimaryRef.current) {
          el.focus()
          const range = document.createRange()
          const sel = window.getSelection()
          range.selectNodeContents(el)
          range.collapse(false)
          sel?.removeAllRanges()
          sel?.addRange(range)
        }
      } else if (!el) {
        initialized.current = false
      }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return (
      <span
        ref={ref}
        className={cn(
          'rounded-sm transition-colors inline',
          !editState && 'cursor-pointer',
          isSelected && !editState && 'bg-stone-100',
          draftActive && !editState && hovered && 'bg-lime-100',
          !activeProposal && !isSelected && !editState && !hovered && 'hover:bg-stone-50',
        )}
        onClick={onSelect}
        role={editState ? undefined : 'button'}
        tabIndex={editState ? undefined : 0}
        onKeyDown={editState ? undefined : (e => { if (e.key === 'Enter' || e.key === ' ') onSelect() })}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <sup className="text-xs text-stone-400 font-sans mr-0.5 select-none">
          {verse.number}
        </sup>

        {editState ? (
          <span
            ref={contentEditableRef}
            contentEditable
            suppressContentEditableWarning
            onInput={e => editState.onChange(e.currentTarget.textContent ?? '')}
            onBlur={e => {
              if (e.currentTarget.textContent === verse.text) onRemoveFromScope?.()
            }}
            className="focus:outline-none bg-amber-100 border-b-2 border-amber-500 rounded-sm px-0.5 -mx-0.5 cursor-text"
          />
        ) : (
          <>
            {proposedText ? (
              <mark className="bg-lime-300 text-stone-900 rounded-sm px-0.5 -mx-0.5">
                {proposedText}
              </mark>
            ) : (
              verse.text
            )}

            {/* Pen — visual only, floats at end, only on hover */}
            {draftActive && !inDraft && hovered && (
              <span className="relative inline-block w-0 overflow-visible">
                <span className="absolute left-1 bottom-0 z-10 inline-flex items-center justify-center w-5 h-5 rounded bg-lime-200 text-lime-800 border border-lime-400">
                  <Pencil className="w-3 h-3" />
                </span>
              </span>
            )}
          </>
        )}
        {' '}
      </span>
    )
  }
)
