'use client'

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useStore } from '@/lib/store'
import { Verse } from './Verse'
import { MarginNote } from './MarginNote'
import { VerseDetailPanel } from './VerseDetailPanel'
import { proposalCoversVerse } from '@/lib/types'
import type { VerseEditState } from './Verse'

const NOTE_HEIGHT = 72
const NOTE_GAP = 8

export type DraftRange = { verseStart: number; verseEnd: number; proposedText: string }
export type Draft = { ranges: DraftRange[]; rationale: string } | null

export function ChapterView() {
  const searchParams = useSearchParams()
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null)
  const [draft, setDraft] = useState<Draft>(null)

  const verses = useStore(s => s.verses)
  const addProposal = useStore(s => s.addProposal)
  const currentUserId = useStore(s => s.currentUserId)

  useEffect(() => {
    const v = searchParams.get('verse')
    if (v) {
      const num = Number(v)
      if (num >= 1 && num <= 20) setSelectedVerse(num)
    }
  }, [searchParams])

  function startEdit(verseNum: number) {
    const verse = verses.find(v => v.number === verseNum)
    if (!verse) return
    setDraft({
      ranges: [{ verseStart: verseNum, verseEnd: verseNum, proposedText: verse.text }],
      rationale: '',
    })
    setSelectedVerse(null)
  }

  function addToScope(verseNum: number) {
    const verse = verses.find(v => v.number === verseNum)
    if (!verse || !draft) return
    if (draft.ranges.some(r => r.verseStart === verseNum)) return
    setDraft({ ...draft, ranges: [...draft.ranges, { verseStart: verseNum, verseEnd: verseNum, proposedText: verse.text }] })
  }

  function updateRangeText(verseStart: number, text: string) {
    setDraft(d => d ? { ...d, ranges: d.ranges.map(r => r.verseStart === verseStart ? { ...r, proposedText: text } : r) } : d)
  }

  function submitDraft() {
    if (!draft || !draft.rationale.trim()) return
    addProposal({
      ranges: draft.ranges,
      rationale: draft.rationale.trim(),
      authorId: currentUserId,
      status: 'keskustelussa',
    })
    setDraft(null)
  }

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
          draft={draft}
          onAddToScope={addToScope}
          onUpdateRangeText={updateRangeText}
          onUpdateRationale={(text) => setDraft(d => d ? { ...d, rationale: text } : d)}
          onSubmitDraft={submitDraft}
          onCancelDraft={() => setDraft(null)}
        />
      </article>

      <VerseDetailPanel
        verseNumber={selectedVerse}
        onClose={() => setSelectedVerse(null)}
        onStartEdit={startEdit}
      />
    </div>
  )
}

function ChapterText({
  selectedVerse,
  onSelectVerse,
  draft,
  onAddToScope,
  onUpdateRangeText,
  onUpdateRationale,
  onSubmitDraft,
  onCancelDraft,
}: {
  selectedVerse: number | null
  onSelectVerse: (v: number) => void
  draft: Draft
  onAddToScope: (verseNum: number) => void
  onUpdateRangeText: (verseStart: number, text: string) => void
  onUpdateRationale: (text: string) => void
  onSubmitDraft: () => void
  onCancelDraft: () => void
}) {
  const verses = useStore(s => s.verses)
  const proposals = useStore(s => s.proposals)

  const containerRef = useRef<HTMLDivElement>(null)
  const verseRefs = useRef<Map<number, HTMLSpanElement>>(new Map())
  const [notePositions, setNotePositions] = useState<Map<string, number>>(new Map())

  const activeProposals = proposals
    .filter(p => p.status !== 'hyvaksytty_lopullisesti')
    .sort((a, b) => a.ranges[0].verseStart - b.ranges[0].verseStart)

  const proposalKey = activeProposals.map(p => `${p.id}:${p.ranges[0].verseStart}`).join(',')

  function measure() {
    if (!containerRef.current) return
    const containerTop = containerRef.current.getBoundingClientRect().top
    const resolved = new Map<string, number>()
    let lastBottom = -Infinity

    for (const proposal of activeProposals) {
      const el = verseRefs.current.get(proposal.ranges[0].verseStart)
      if (!el) continue
      const desired = el.getBoundingClientRect().top - containerTop
      const top = Math.max(desired, lastBottom + NOTE_GAP)
      resolved.set(proposal.id, top)
      lastBottom = top + NOTE_HEIGHT
    }

    setNotePositions(resolved)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(measure, [proposalKey])

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

  const primaryDraftVerseStart = draft ? Math.min(...draft.ranges.map(r => r.verseStart)) : null

  return (
    <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-x-6 relative">
      <div className="font-serif text-lg leading-8 text-stone-800">
        <p>
          {verses.map(verse => {
            const verseProposals = proposals.filter(p => proposalCoversVerse(p, verse.number))
            const draftRange = draft?.ranges.find(r => verse.number >= r.verseStart && verse.number <= r.verseEnd)
            const inDraft = Boolean(draftRange)
            const draftActive = Boolean(draft)

            let editState: VerseEditState | undefined
            if (draftRange) {
              editState = {
                text: draftRange.proposedText,
                onChange: (text) => onUpdateRangeText(draftRange.verseStart, text),
                isPrimary: draftRange.verseStart === primaryDraftVerseStart,
                rationale: draft!.rationale,
                onRationaleChange: onUpdateRationale,
                onSubmit: onSubmitDraft,
                onCancel: onCancelDraft,
              }
            }

            return (
              <Verse
                key={verse.number}
                ref={el => setVerseRef(verse.number, el)}
                verse={verse}
                proposals={verseProposals}
                isSelected={selectedVerse === verse.number && !inDraft}
                onSelect={() => onSelectVerse(verse.number)}
                draftActive={draftActive}
                inDraft={inDraft}
                onAddToScope={() => onAddToScope(verse.number)}
                editState={editState}
              />
            )
          })}
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
              isSelected={selectedVerse !== null && proposalCoversVerse(proposal, selectedVerse)}
              onClick={() => onSelectVerse(proposal.ranges[0].verseStart)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
