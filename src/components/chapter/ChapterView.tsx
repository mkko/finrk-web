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
import { X } from 'lucide-react'

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
      return newRanges.length === 0 ? { ...d, ranges: [] } : { ...d, ranges: newRanges }
    })
  }

  const hasChanges = draft !== null && draft.ranges.some(r => {
    const verse = verses.find(v => v.number === r.verseStart)
    return verse && r.proposedText !== verse.text
  })

  function submitDraft() {
    if (!draft || !hasChanges || !draft.rationale.trim()) return
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
              disabled={!hasChanges || !draft.rationale.trim()}
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
  const merkinnat = useStore(s => s.merkinnat)
  const currentUserId = useStore(s => s.currentUserId)
  const users = useStore(s => s.users)
  const currentUser = users.find(u => u.id === currentUserId)

  const containerRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const verseRefs = useRef<Map<number, HTMLSpanElement>>(new Map())
  const noteRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const [notePositions, setNotePositions] = useState<Map<number, number>>(new Map())
  const addMerkinta = useStore(s => s.addMerkinta)
  const [highlightSelection, setHighlightSelection] = useState<{
    matches: { verseNumber: number; text: string }[]
    displayText: string
    top: number
    left: number
  } | null>(null)
  const [highlightNote, setHighlightNote] = useState('')
  const draftRef = useRef(draft)
  draftRef.current = draft
  const versesRef = useRef(verses)
  versesRef.current = verses

  const userMerkinnat = currentUser?.role === 'kaantaja'
    ? merkinnat.filter(m => m.authorId === currentUserId)
    : []

  // Per-verse highlight texts for inline rendering
  const highlightByVerse = new Map<number, string[]>()
  for (const m of userMerkinnat) {
    for (const v of m.verses) {
      const arr = highlightByVerse.get(v.verseNumber) ?? []
      arr.push(v.text)
      highlightByVerse.set(v.verseNumber, arr)
    }
  }

  // Sidebar notes grouped by anchor verse (first verse of each merkintä)
  const notesByAnchor = new Map<number, { verseLabel: string; text: string; note?: string }[]>()
  for (const m of userMerkinnat) {
    const anchor = m.verses[0].verseNumber
    const arr = notesByAnchor.get(anchor) ?? []
    const nums = m.verses.map(v => v.verseNumber)
    const verseLabel = nums.length === 1 ? `${nums[0]}` : `${nums[0]}–${nums[nums.length - 1]}`
    arr.push({ verseLabel, text: m.verses.map(v => v.text).join(' '), note: m.note })
    notesByAnchor.set(anchor, arr)
  }
  const highlightedVerses = [...notesByAnchor.keys()].sort((a, b) => a - b)

  const merkintaKey = userMerkinnat.map(m => `${m.id}:${m.verses.map(v => v.verseNumber).join('-')}`).join(',')

  function measure() {
    if (!containerRef.current) return
    const containerTop = containerRef.current.getBoundingClientRect().top
    const resolved = new Map<number, number>()
    let lastBottom = -Infinity
    for (const vNum of highlightedVerses) {
      const verseEl = verseRefs.current.get(vNum)
      const noteEl = noteRefs.current.get(vNum)
      if (!verseEl) continue
      const desired = verseEl.getBoundingClientRect().top - containerTop
      const top = Math.max(desired, lastBottom + NOTE_GAP)
      resolved.set(vNum, top)
      const height = noteEl?.offsetHeight ?? 60
      lastBottom = top + height
    }
    setNotePositions(resolved)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(measure, [merkintaKey])

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(measure)
    observer.observe(containerRef.current)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merkintaKey])

  const setVerseRef = useCallback((num: number, el: HTMLSpanElement | null) => {
    if (el) verseRefs.current.set(num, el)
    else verseRefs.current.delete(num)
  }, [])

  const setNoteRef = useCallback((vNum: number, el: HTMLDivElement | null) => {
    if (el) noteRefs.current.set(vNum, el)
    else noteRefs.current.delete(vNum)
  }, [])

  useEffect(() => {
    let isMouseDown = false
    let timerId: ReturnType<typeof setTimeout>

    function checkSelection() {
      if (currentUser?.role !== 'kaantaja') return
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed || !containerRef.current) return
      const text = selection.toString().trim()
      if (!text) return

      const allVerses = versesRef.current
      const matches: { verseNumber: number; text: string }[] = []

      // Try single verse first
      for (const v of allVerses) {
        if (v.text && v.text.includes(text)) {
          matches.push({ verseNumber: v.number, text })
          break
        }
      }

      // If no single-verse match, try multi-verse
      if (!matches.length) {
        const nonEmpty = allVerses.filter(v => v.text)
        const fullText = nonEmpty.map(v => v.text).join(' ')
        const idx = fullText.indexOf(text)
        if (idx !== -1) {
          let pos = 0
          const selEnd = idx + text.length
          for (const v of nonEmpty) {
            const vStart = pos
            const vEnd = pos + v.text.length
            const oStart = Math.max(idx, vStart)
            const oEnd = Math.min(selEnd, vEnd)
            if (oStart < oEnd) {
              const part = fullText.slice(oStart, oEnd).trim()
              if (part) matches.push({ verseNumber: v.number, text: part })
            }
            pos = vEnd + 1 // +1 for the space between verses
          }
        }
      }

      if (!matches.length) return
      // Don't highlight in verses being edited
      if (matches.some(m => draftRef.current?.ranges.some(r => m.verseNumber >= r.verseStart && m.verseNumber <= r.verseEnd))) return
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()
      setHighlightNote('')
      setHighlightSelection({
        matches,
        displayText: text,
        top: rect.bottom - containerRect.top + 4,
        left: rect.left - containerRect.left + rect.width / 2,
      })
    }

    function onMouseDown(e: MouseEvent) {
      if (formRef.current?.contains(e.target as Node)) return
      isMouseDown = true
      setHighlightSelection(null)
      setHighlightNote('')
    }

    function onMouseUp() {
      if (!isMouseDown) return
      isMouseDown = false
      checkSelection()
    }

    function onSelectionChange() {
      if (isMouseDown) return
      clearTimeout(timerId)
      timerId = setTimeout(checkSelection, 50)
    }

    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('selectionchange', onSelectionChange)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('selectionchange', onSelectionChange)
      clearTimeout(timerId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.role])

  function handleHighlight() {
    if (highlightSelection) {
      const note = highlightNote.trim() || undefined
      addMerkinta(highlightSelection.matches.map(m => ({ verseNumber: m.verseNumber, text: m.text })), note)
      setHighlightSelection(null)
      setHighlightNote('')
      window.getSelection()?.removeAllRanges()
    }
  }

  function dismissHighlightForm() {
    setHighlightSelection(null)
    setHighlightNote('')
    window.getSelection()?.removeAllRanges()
  }

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
                highlights={highlightByVerse.get(verse.number)}
              />
            )
          })}
        </p>
      </div>

      <div className="hidden lg:block relative" aria-hidden="true">
        {highlightedVerses.map(vNum => (
          <div
            key={vNum}
            ref={el => setNoteRef(vNum, el)}
            className="absolute left-0 right-0"
            style={{ top: notePositions.get(vNum) ?? -9999 }}
          >
            <MarginNote
              highlights={notesByAnchor.get(vNum)!}
              isSelected={selectedVerse === vNum}
              onClick={() => onVerseClick(vNum)}
            />
          </div>
        ))}
      </div>

      {highlightSelection && (
        <div
          className="absolute z-20"
          style={{
            top: highlightSelection.top,
            left: highlightSelection.left,
            transform: 'translateX(-50%)',
          }}
        >
          <div ref={formRef} className="bg-white rounded-lg border border-amber-300 shadow-lg p-3 w-64">
            <div className="flex items-center justify-between mb-2">
              <mark className="bg-amber-100/70 rounded-sm text-sm px-1 truncate">{highlightSelection.displayText}</mark>
              <button
                onClick={dismissHighlightForm}
                className="text-stone-400 hover:text-stone-600 ml-2 shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <textarea
              value={highlightNote}
              onChange={e => setHighlightNote(e.target.value)}
              placeholder="Muistiinpano (valinnainen)"
              className="w-full text-sm border border-stone-200 rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-amber-400"
              rows={2}
            />
            <button
              onMouseDown={e => e.preventDefault()}
              onClick={handleHighlight}
              className="mt-2 w-full text-sm rounded-md bg-amber-100 text-amber-800 px-3 py-1.5 hover:bg-amber-200 border border-amber-300 transition-colors"
            >
              Lisää merkintä
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
