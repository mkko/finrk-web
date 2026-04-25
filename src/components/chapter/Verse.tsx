'use client'

import { forwardRef, useState } from 'react'
import { Verse as VerseType, Proposal, STATUS_INDICATOR_COLORS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Pencil } from 'lucide-react'

export interface VerseEditState {
  text: string
  onChange: (text: string) => void
  isPrimary: boolean
  rationale: string
  onRationaleChange: (text: string) => void
  onSubmit: () => void
  onCancel: () => void
}

interface VerseProps {
  verse: VerseType
  proposals: Proposal[]
  isSelected: boolean
  onSelect: () => void
  draftActive?: boolean
  inDraft?: boolean
  onAddToScope?: () => void
  editState?: VerseEditState
}

export const Verse = forwardRef<HTMLSpanElement, VerseProps>(
  function Verse({ verse, proposals, isSelected, onSelect, draftActive, inDraft, onAddToScope, editState }, ref) {
    const activeProposal = proposals.find(p => p.status !== 'hyvaksytty_lopullisesti')
    const hasBeenRevised = verse.text !== verse.baseText

    const [showAddRangeForm, setShowAddRangeForm] = useState(false)
    const [addStart, setAddStart] = useState('')
    const [addEnd, setAddEnd] = useState('')

    if (editState) {
      return (
        <span ref={ref} className="block my-3">
          <span className="flex items-start gap-2">
            <sup className="text-xs text-stone-400 font-sans mt-1 select-none shrink-0">
              {verse.number}
            </sup>
            <textarea
              autoFocus={editState.isPrimary}
              value={editState.text}
              onChange={e => editState.onChange(e.target.value)}
              className="flex-1 font-serif text-base leading-7 text-stone-800 border border-stone-300 rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[80px]"
              rows={3}
            />
          </span>

          {editState.isPrimary && (
            <span className="block ml-5 mt-2 space-y-2">
              <span className="flex items-center gap-2">
                <label className="text-xs font-medium text-stone-500 shrink-0">Perustelut:</label>
                <input
                  type="text"
                  value={editState.rationale}
                  onChange={e => editState.onRationaleChange(e.target.value)}
                  placeholder="Miksi ehdotat tätä muutosta?"
                  className="flex-1 text-sm border border-stone-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
              </span>

              <span className="flex items-center gap-2">
                <button
                  onClick={editState.onSubmit}
                  disabled={!editState.rationale.trim()}
                  className="text-xs rounded-md bg-stone-800 text-white px-3 py-1 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Tallenna
                </button>
                <button
                  onClick={editState.onCancel}
                  className="text-xs text-stone-500 hover:text-stone-700 border border-stone-300 rounded-md px-3 py-1 hover:bg-stone-50 transition-colors"
                >
                  Peruuta
                </button>
              </span>
            </span>
          )}
        </span>
      )
    }

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
        {draftActive && !inDraft && (
          <button
            onClick={e => { e.stopPropagation(); onAddToScope?.() }}
            className="inline-flex items-center justify-center w-4 h-4 ml-0.5 align-middle rounded text-stone-300 hover:text-stone-600 hover:bg-stone-100 transition-colors"
            title="Lisää muokkausalueeseen"
          >
            <Pencil className="w-2.5 h-2.5" />
          </button>
        )}
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
