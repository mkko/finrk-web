'use client'

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useStore } from '@/lib/store'
import { Verse } from './Verse'
import { MarginNote } from './MarginNote'
import { VerseDetailPanel } from './VerseDetailPanel'
import { proposalCoversVerse } from '@/lib/types'
import type { VerseEditState } from './Verse'
import { cn } from '@/lib/utils'

const NOTE_HEIGHT = 72
const NOTE_GAP = 8

export type DraftRange = { verseStart: number; verseEnd: number; proposedText: string }
export type Draft = { ranges: DraftRange[]; rationale: string } | null

export function ChapterView() {
  const searchParams = useSearchParams()
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null)
  const [draft, setDraft] = useState<Draft>(null)

  const verses = useStore(s => s.verses)
  const proposals = useStore(s => s.proposals)
  const users = useStore(s => s.users)
  const addProposal = useStore(s => s.addProposal)
  const currentUserId = useStore(s => s.currentUserId)
  const currentUser = users.find(u => u.id === currentUserId)!

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
    setDraft(d => d
      ? { ...d, ranges: d.ranges.some(r => r.verseStart === verseNum) ? d.ranges : [...d.ranges, { verseStart: verseNum, verseEnd: verseNum, proposedText: verse.text }] }
      : { ranges: [{ verseStart: verseNum, verseEnd: verseNum, proposedText: verse.text }], rationale: '' }
    )
  }

  function handleVerseClick(verseNum: number) {
    // Auto-revert previously selected verse if it's in draft but unchanged
    if (selectedVerse !== null && selectedVerse !== verseNum && draft) {
      const prevRange = draft.ranges.find(r => selectedVerse >= r.verseStart && selectedVerse <= r.verseEnd)
      const prevVerse = verses.find(v => v.number === selectedVerse)
      if (prevRange && prevVerse && prevRange.proposedText === prevVerse.text) {
        removeFromScope(selectedVerse)
      }
    }
    setSelectedVerse(verseNum)
    if (draft && currentUser.role === 'kaantaja') {
      const hasActiveProposal = proposals.some(
        p => p.status !== 'hyvaksytty_lopullisesti' && proposalCoversVerse(p, verseNum)
      )
      if (!hasActiveProposal) startEdit(verseNum)
    }
  }

  function updateRangeText(verseStart: number, text: string) {
    setDraft(d => d ? { ...d, ranges: d.ranges.map(r => r.verseStart === verseStart ? { ...r, proposedText: text } : r) } : d)
  }

  function removeFromScope(verseNum: number) {
    setDraft(d => {
      if (!d) return d
      const newRanges = d.ranges.filter(r => r.verseStart !== verseNum)
      return newRanges.length === 0 ? null : { ...d, ranges: newRanges }
    })
  }

  function submitDraft() {
    if (!draft || !draft.rationale.trim()) return
    addProposal({
      ranges: draft.ranges,
      rationale: draft.rationale.trim(),
      authorId: currentUserId,
      status: 'luonnos',
    })
    setDraft(null)
  }

  return (
    <div className="h-full flex">
      {/* Left column — draft action bar + article */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Draft action bar — only visible while editing */}
        {draft && (
          <div className="flex-none border-b border-amber-200 bg-amber-50 px-6 py-3 flex flex-wrap items-center gap-3">
            <span className="text-sm text-amber-800 font-medium shrink-0">Ehdotus:</span>
            <input
              type="text"
              value={draft.rationale}
              onChange={e => setDraft(d => d ? { ...d, rationale: e.target.value } : d)}
              placeholder="Perustele muutos lyhyesti"
              className="flex-1 min-w-[200px] text-sm border border-amber-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            />
            <button
              onClick={submitDraft}
              disabled={!draft.rationale.trim()}
              className="shrink-0 text-sm rounded-md bg-stone-800 text-white px-4 py-1.5 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Tallenna ehdotus
            </button>
            <button
              onClick={() => setDraft(null)}
              className="shrink-0 text-sm text-stone-500 hover:text-stone-700 border border-stone-300 rounded-md px-4 py-1.5 hover:bg-stone-50 transition-colors"
            >
              Peruuta
            </button>
          </div>
        )}

        {/* Article */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="mb-4">
              <p className="font-serif text-base text-stone-500">1. Tessalonikalaiskirje</p>
              <h1 className="font-serif text-3xl font-semibold text-stone-800 leading-tight mt-1">Luku 2</h1>
            </div>
            <div className="bg-white rounded-lg border border-stone-200 p-6 sm:p-8 shadow-sm">
              <ChapterText
                selectedVerse={selectedVerse}
                onVerseClick={handleVerseClick}
                draft={draft}
                onUpdateRangeText={updateRangeText}
                onRemoveFromScope={removeFromScope}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar — always visible, right */}
      <div className="w-96 shrink-0 border-l border-stone-200 bg-white flex flex-col overflow-hidden">
        {selectedVerse !== null
          ? <VerseDetailPanel
              verseNumber={selectedVerse}
              onClose={() => setSelectedVerse(null)}
              onStartEdit={
                currentUser.role === 'kaantaja'
                && !proposals.some(p => p.status !== 'hyvaksytty_lopullisesti' && proposalCoversVerse(p, selectedVerse))
                && !draft?.ranges.some(r => selectedVerse >= r.verseStart && selectedVerse <= r.verseEnd)
                  ? () => startEdit(selectedVerse)
                  : undefined
              }
              onRevert={
                draft?.ranges.some(r => selectedVerse >= r.verseStart && selectedVerse <= r.verseEnd)
                  ? () => removeFromScope(selectedVerse)
                  : undefined
              }
            />
          : (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <p className="text-sm text-stone-400">Valitse jae nähdäksesi tiedot</p>
            </div>
          )
        }
      </div>
    </div>
  )
}

function ChapterText({
  selectedVerse,
  onVerseClick,
  draft,
  onUpdateRangeText,
  onRemoveFromScope,
}: {
  selectedVerse: number | null
  onVerseClick: (v: number) => void
  draft: Draft
  onUpdateRangeText: (verseStart: number, text: string) => void
  onRemoveFromScope: (verseNum: number) => void
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
              }
            }

            return (
              <Verse
                key={verse.number}
                ref={el => setVerseRef(verse.number, el)}
                verse={verse}
                proposals={verseProposals}
                isSelected={selectedVerse === verse.number}
                onSelect={() => onVerseClick(verse.number)}
                draftActive={draftActive}
                inDraft={inDraft}
                onRemoveFromScope={() => onRemoveFromScope(verse.number)}
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
              onClick={() => onVerseClick(proposal.ranges[0].verseStart)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
