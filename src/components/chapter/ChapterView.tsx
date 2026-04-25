'use client'

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useStore } from '@/lib/store'
import { Verse } from './Verse'
import { MarginNote } from './MarginNote'
import { VerseDetailPanel } from './VerseDetailPanel'
import { Proposal } from '@/lib/types'

const NOTE_HEIGHT = 72
const NOTE_GAP = 8

export function ChapterView() {
  const searchParams = useSearchParams()
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null)

  useEffect(() => {
    const v = searchParams.get('verse')
    if (v) {
      const num = Number(v)
      if (num >= 1 && num <= 20) setSelectedVerse(num)
    }
  }, [searchParams])

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-stone-800">
          1. Tessalonikalaiskirje
        </h1>
        <p className="text-sm text-stone-500 mt-1">Luku 2</p>
      </div>

      <article className="bg-white rounded-lg border border-stone-200 p-6 sm:p-8 shadow-sm">
        <ChapterText
          selectedVerse={selectedVerse}
          onSelectVerse={setSelectedVerse}
        />
      </article>

      <VerseDetailPanel
        verseNumber={selectedVerse}
        onClose={() => setSelectedVerse(null)}
      />
    </div>
  )
}

function ChapterText({
  selectedVerse,
  onSelectVerse,
}: {
  selectedVerse: number | null
  onSelectVerse: (v: number) => void
}) {
  const verses = useStore(s => s.verses)
  const proposals = useStore(s => s.proposals)
  const containerRef = useRef<HTMLDivElement>(null)
  const verseRefs = useRef<Map<number, HTMLSpanElement>>(new Map())
  const [notePositions, setNotePositions] = useState<Map<string, number>>(new Map())

  const activeProposals = proposals
    .filter(p => p.status !== 'hyvaksytty_lopullisesti')
    .sort((a, b) => a.verseStart - b.verseStart)

  const proposalKey = activeProposals.map(p => `${p.id}:${p.verseStart}`).join(',')

  function measure() {
    if (!containerRef.current) return
    const containerTop = containerRef.current.getBoundingClientRect().top
    const resolved = new Map<string, number>()
    let lastBottom = -Infinity

    for (const proposal of activeProposals) {
      const el = verseRefs.current.get(proposal.verseStart)
      if (!el) continue
      const desired = el.getBoundingClientRect().top - containerTop
      const top = Math.max(desired, lastBottom + NOTE_GAP)
      resolved.set(proposal.id, top)
      lastBottom = top + NOTE_HEIGHT
    }

    setNotePositions(resolved)
  }

  // Measure before paint so notes never appear at wrong position
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(measure, [proposalKey])

  // Re-measure on resize
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(measure)
    observer.observe(containerRef.current)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalKey])

  const setVerseRef = useCallback((num: number, el: HTMLSpanElement | null) => {
    if (el) verseRefs.current.set(num, el)
    else verseRefs.current.delete(num)
  }, [])

  return (
    <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-x-6 relative">
      <div className="font-serif text-lg leading-8 text-stone-800">
        <p>
          {verses.map(verse => (
            <Verse
              key={verse.number}
              ref={el => setVerseRef(verse.number, el)}
              verse={verse}
              proposals={proposals.filter(p => verse.number >= p.verseStart && verse.number <= p.verseEnd)}
              isSelected={selectedVerse === verse.number}
              onSelect={() => onSelectVerse(verse.number)}
            />
          ))}
        </p>
      </div>

      <div className="hidden lg:block relative" aria-hidden="true">
        {activeProposals.map(proposal => (
          <div
            key={proposal.id}
            className="absolute left-0 right-0"
            style={{ top: notePositions.get(proposal.id) ?? -9999 }}
          >
            <MarginNote
              proposal={proposal}
              isSelected={selectedVerse !== null && selectedVerse >= proposal.verseStart && selectedVerse <= proposal.verseEnd}
              onClick={() => onSelectVerse(proposal.verseStart)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
