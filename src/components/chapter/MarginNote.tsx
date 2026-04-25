'use client'

import { Proposal, STATUS_LABELS, STATUS_INDICATOR_COLORS, proposalVerseRef } from '@/lib/types'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { MessageSquare } from 'lucide-react'

interface MarginNoteProps {
  proposal: Proposal
  isSelected: boolean
  onClick: () => void
}

export function MarginNote({ proposal, isSelected, onClick }: MarginNoteProps) {
  const users = useStore(s => s.users)
  const author = users.find(u => u.id === proposal.authorId)

  const verseRef = proposalVerseRef(proposal).replace('Jae ', 'j. ').replace('Jakeet ', 'j. ')

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-md border px-3 py-2 transition-colors text-xs',
        isSelected
          ? 'border-stone-400 bg-stone-100'
          : 'border-stone-200 bg-stone-50/80 hover:border-stone-300 hover:bg-stone-50'
      )}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className={cn('w-2 h-2 rounded-full shrink-0', STATUS_INDICATOR_COLORS[proposal.status])} />
        <span className="font-medium text-stone-700 truncate">{verseRef}</span>
      </div>
      <p className="text-stone-500 leading-snug line-clamp-2">
        {STATUS_LABELS[proposal.status]}
      </p>
      {proposal.comments.length > 0 && (
        <div className="flex items-center gap-1 mt-1.5 text-stone-400">
          <MessageSquare className="w-3 h-3" />
          <span>{proposal.comments.length}</span>
        </div>
      )}
    </button>
  )
}
