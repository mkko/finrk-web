'use client'

import { cn } from '@/lib/utils'

interface MarginNoteProps {
  highlights: { verseLabel: string; text: string; note?: string }[]
  isSelected: boolean
  onClick: () => void
}

export function MarginNote({ highlights, isSelected, onClick }: MarginNoteProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-md border px-3 py-2 transition-colors',
        isSelected
          ? 'border-amber-300 bg-amber-100'
          : 'border-amber-200 bg-amber-50/80 hover:border-amber-300 hover:bg-amber-50'
      )}
    >
      <div className="space-y-0.5">
        {highlights.map((h, i) => (
          <div key={i}>
            <p className="text-stone-500 text-[10px] font-sans mb-0.5">j. {h.verseLabel}</p>
            <p className="text-xs text-stone-600 font-medium">{h.text}</p>
            {h.note && <p className="text-[10px] text-stone-400 leading-tight">{h.note}</p>}
          </div>
        ))}
      </div>
    </button>
  )
}
