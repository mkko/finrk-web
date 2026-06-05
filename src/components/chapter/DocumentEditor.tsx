'use client'

import { useRef, useCallback, useEffect } from 'react'
import { Verse, Proposal, User, proposalCoversVerse } from '@/lib/types'
import { cn } from '@/lib/utils'

interface DocumentEditorProps {
  verses: Verse[]
  proposals: Proposal[]
  users: User[]
  currentUserId: string
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

function buildHTML(verses: Verse[], proposals: Proposal[], users: User[], showProposals: boolean, showReviewComments: boolean): string {
  let html = ''
  for (const verse of verses) {
    if (verse.sectionHeader) {
      html += `<h3 class="font-serif text-base font-semibold text-stone-700 mt-6 mb-2" contenteditable="false">${verse.sectionHeader}</h3>`
    }

    html += `<span data-verse="${verse.number}"><sup contenteditable="false" class="text-xs text-stone-400 font-sans mr-0.5 select-none">${verse.number}</sup>${verse.text}</span> `

    // Green proposal line
    if (showProposals) {
      const activeProposal = proposals.find(
        p => p.status !== 'hyvaksytty_lopullisesti' && proposalCoversVerse(p, verse.number)
      )
      if (activeProposal) {
        const range = activeProposal.ranges.find(r => verse.number >= r.verseStart && verse.number <= r.verseEnd)
        if (range && verse.number === range.verseStart) {
          const author = users.find(u => u.id === activeProposal.authorId)
          html += `<div contenteditable="false" class="bg-green-100 border-l-2 border-green-500 pl-2 py-0.5 my-0.5 text-stone-700"><sup class="text-xs text-green-700 font-sans mr-0.5">${verse.number}</sup>${range.proposedText} <span class="text-xs text-green-600 ml-1">— ${author?.name ?? 'Tuntematon'}</span></div>`
        }
      }
    }

    // Review comments
    if (showReviewComments) {
      const activeProposal = proposals.find(
        p => p.status !== 'hyvaksytty_lopullisesti' && proposalCoversVerse(p, verse.number)
      )
      if (activeProposal) {
        const comments = activeProposal.comments.filter(c => c.thread === 'seurantaryhma')
        for (const c of comments) {
          html += `<div contenteditable="false" class="py-0.5 text-sm"><span class="bg-yellow-200/70">${c.text}</span></div>`
        }
      }
    }

    // Footnotes
    if (verse.footnotes) {
      for (const fn of verse.footnotes) {
        html += `<div contenteditable="false" class="ml-8 text-sm text-stone-400 leading-relaxed"><sup class="text-xs font-sans mr-0.5">${fn.marker}</sup>${fn.text}</div>`
      }
    }
  }
  return html
}

function parseVerseTexts(container: HTMLDivElement): Map<number, string> {
  const result = new Map<number, string>()
  const spans = container.querySelectorAll('span[data-verse]')
  for (const span of spans) {
    const num = parseInt(span.getAttribute('data-verse') ?? '0')
    if (num <= 0) continue
    // Get text content, stripping the verse number sup
    const clone = span.cloneNode(true) as HTMLElement
    const sup = clone.querySelector('sup')
    if (sup) sup.remove()
    const text = clone.textContent?.trim() ?? ''
    result.set(num, text)
  }
  return result
}

export function DocumentEditor({
  verses, proposals, users, currentUserId,
  showProposals, showReviewComments,
  selectedVerse, onSelectVerse, onAddProposal,
}: DocumentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const lastHTMLRef = useRef('')

  const html = buildHTML(verses, proposals, users, showProposals, showReviewComments)

  useEffect(() => {
    if (editorRef.current && html !== lastHTMLRef.current) {
      editorRef.current.innerHTML = html
      lastHTMLRef.current = html
    }
  }, [html])

  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const verseSpan = target.closest('span[data-verse]')
    if (verseSpan) {
      const num = parseInt(verseSpan.getAttribute('data-verse') ?? '0')
      if (num > 0) onSelectVerse(num)
    }
  }, [onSelectVerse])

  const handleBlur = useCallback(() => {
    if (!editorRef.current) return
    const newTexts = parseVerseTexts(editorRef.current)
    for (const verse of verses) {
      const newText = newTexts.get(verse.number)
      if (newText !== undefined && newText !== verse.text) {
        onAddProposal({
          ranges: [{ verseStart: verse.number, verseEnd: verse.number, proposedText: newText }],
          rationale: '',
          authorId: currentUserId,
          status: 'luonnos',
        })
      }
    }
  }, [verses, currentUserId, onAddProposal])

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      className={cn(
        'focus:outline-none min-h-[200px]',
        'prose prose-stone max-w-none',
        '[&_span[data-verse]]:inline',
      )}
      onClick={handleClick}
      onBlur={handleBlur}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
