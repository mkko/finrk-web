'use client'

import { forwardRef } from 'react'
import { Verse as VerseType, Proposal, STATUS_INDICATOR_COLORS } from '@/lib/types'
import { cn } from '@/lib/utils'

interface VerseProps {
  verse: VerseType
  proposals: Proposal[]
  isSelected: boolean
  onSelect: () => void
}

export const Verse = forwardRef<HTMLSpanElement, VerseProps>(
  function Verse({ verse, proposals, isSelected, onSelect }, ref) {
    const activeProposal = proposals.find(p => p.status !== 'hyvaksytty_lopullisesti')
    const hasBeenRevised = verse.text !== verse.baseText

    return (
      <span
        ref={ref}
        className={cn(
          'relative cursor-pointer rounded-sm transition-colors inline',
          isSelected && 'bg-stone-100',
          activeProposal && 'underline decoration-dotted decoration-1 underline-offset-4',
          activeProposal && STATUS_INDICATOR_COLORS[activeProposal.status].replace('bg-', 'decoration-'),
          !activeProposal && !isSelected && 'hover:bg-stone-50'
        )}
        onClick={onSelect}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect() }}
      >
        <sup className="text-xs text-stone-400 font-sans mr-0.5 select-none">
          {verse.number}
        </sup>
        {verse.text}
        {activeProposal && (
          <span
            className={cn(
              'inline-block w-2 h-2 rounded-full ml-1 align-middle',
              STATUS_INDICATOR_COLORS[activeProposal.status]
            )}
            title={`Ehdotus: ${activeProposal.status}`}
          />
        )}
        {hasBeenRevised && !activeProposal && (
          <span
            className="inline-block w-2 h-2 rounded-full ml-1 align-middle bg-emerald-600"
            title="Tarkistettu"
          />
        )}
        {' '}
      </span>
    )
  }
)
