'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useStore } from '@/lib/store'
import { Verse } from './Verse'
import { VerseDetailPanel } from './VerseDetailPanel'
import { DocumentEditor } from './DocumentEditor'
import { TiptapEditorA } from './TiptapEditorA'
import { TiptapEditorB } from './TiptapEditorB'
import { ContinuousDoc } from './ContinuousDoc'
import { proposalCoversVerse, proposalVerseRef } from '@/lib/types'
import { REFERENCE_TRANSLATIONS } from '@/lib/seed-data'
import type { ProposalAnnotation, ReviewComment, FootnoteAnnotation } from './Verse'
import { cn } from '@/lib/utils'

type DocView = 'ehdotukset' | 'tarkistus'

export function ChapterView() {
  const searchParams = useSearchParams()
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null)
  const [docView, setDocView] = useState<DocView>('ehdotukset')
  const [draftingVerse, setDraftingVerse] = useState<number | null>(null)
  const [draftText, setDraftText] = useState('')
  const [draftRationale, setDraftRationale] = useState('')

  const storeVerses = useStore(s => s.verses)
  const proposals = useStore(s => s.proposals)
  const users = useStore(s => s.users)
  const addProposal = useStore(s => s.addProposal)
  const editProposalText = useStore(s => s.editProposalText)
  const deleteProposal = useStore(s => s.deleteProposal)
  const addFootnote = useStore(s => s.addFootnote)
  const editFootnote = useStore(s => s.editFootnote)
  const deleteFootnote = useStore(s => s.deleteFootnote)
  const currentUserId = useStore(s => s.currentUserId)
  const currentUser = users.find(u => u.id === currentUserId)!
  const viewingSnapshotId = useStore(s => s.viewingSnapshotId)
  const snapshots = useStore(s => s.snapshots)
  const viewedSnapshot = viewingSnapshotId ? snapshots.find(s => s.id === viewingSnapshotId) : null
  const verses = viewedSnapshot
    ? storeVerses.map(v => {
        const snapshotVerse = viewedSnapshot.verseTexts.find(sv => sv.number === v.number)
        return snapshotVerse ? { ...v, text: snapshotVerse.text } : v
      })
    : storeVerses

  const appVersion = useStore(s => s.appVersion)
  const viewSnapshotAction = useStore(s => s.viewSnapshot)
  const [referenceId, setReferenceId] = useState(REFERENCE_TRANSLATIONS[0].id)
  const selectedRef = REFERENCE_TRANSLATIONS.find(r => r.id === referenceId) ?? REFERENCE_TRANSLATIONS[0]

  useEffect(() => {
    const v = searchParams.get('verse')
    if (v) {
      const num = Number(v)
      if (num >= 1 && num <= 20) setSelectedVerse(num)
    }
  }, [searchParams])

  function startDraft(verseNum: number) {
    const verse = verses.find(v => v.number === verseNum)
    if (!verse) return
    setDraftingVerse(verseNum)
    setDraftText(verse.text)
    setDraftRationale('')
    setSelectedVerse(verseNum)
  }

  function submitDraft() {
    if (!draftText.trim() || draftingVerse === null) return
    const verse = verses.find(v => v.number === draftingVerse)
    if (!verse || draftText === verse.text) return
    addProposal({
      ranges: [{ verseStart: draftingVerse, verseEnd: draftingVerse, proposedText: draftText.trim() }],
      rationale: draftRationale.trim() || '',
      authorId: currentUserId,
      status: 'luonnos',
    })
    cancelDraft()
  }

  function cancelDraft() {
    setDraftingVerse(null)
    setDraftText('')
    setDraftRationale('')
  }

  // Compute per-verse annotation data
  const verseAnnotations = useCallback(() => {
    return verses.map(verse => {
      const activeProposal = proposals.find(
        p => p.status !== 'hyvaksytty_lopullisesti' && proposalCoversVerse(p, verse.number)
      )

      let proposalAnnotation: ProposalAnnotation | undefined
      if (activeProposal) {
        const range = activeProposal.ranges.find(r => verse.number >= r.verseStart && verse.number <= r.verseEnd)
        if (range && verse.number === range.verseStart) {
          const author = users.find(u => u.id === activeProposal.authorId)
          const proposalId = activeProposal.id
          proposalAnnotation = {
            id: proposalId,
            proposedText: range.proposedText,
            authorName: author?.name ?? 'Tuntematon',
            status: activeProposal.status,
            verseLabel: proposalVerseRef(activeProposal),
            onEdit: (newText: string) => editProposalText(proposalId, newText),
            onDelete: () => deleteProposal(proposalId),
          }
        }
      }

      const reviewComments: ReviewComment[] = activeProposal?.comments
        .filter(c => c.thread === 'seurantaryhma')
        .map(c => ({
          text: c.text,
          authorName: users.find(u => u.id === c.authorId)?.name ?? 'Tuntematon',
        })) ?? []

      return { proposalAnnotation, reviewComments: reviewComments.length > 0 ? reviewComments : undefined }
    })
  }, [verses, proposals, users, editProposalText, deleteProposal])()

  const setVerseRef = useCallback((_num: number, _el: HTMLDivElement | null) => {
    // placeholder for future scroll-to-verse
  }, [])

  return (
    <div className="h-full flex">
      {/* Reference text panel — v2.0 only */}
      {appVersion === '2.0' && (
        <div className="w-96 shrink-0 border-r border-stone-200 bg-stone-100/50 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-6 py-6">
              <div className="mb-4">
                <p className="font-serif text-base text-stone-400">Vertailuteksti</p>
                <select
                  value={referenceId}
                  onChange={e => setReferenceId(e.target.value)}
                  className="font-serif text-2xl font-semibold text-stone-500 leading-tight mt-1 bg-transparent border-none focus:outline-none cursor-pointer hover:text-stone-700 transition-colors appearance-none pr-6"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a8a29e' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right center' }}
                >
                  {REFERENCE_TRANSLATIONS.map(ref => (
                    <option key={ref.id} value={ref.id}>{ref.label}</option>
                  ))}
                </select>
              </div>
              <div className="bg-white/70 border border-stone-200 p-6 sm:p-8">
                <div className={cn('font-serif text-base leading-7 text-stone-500', selectedRef.language === 'el' && 'text-sm leading-6')}>
                  {selectedRef.verses.map(v => (
                    <div
                      key={v.number}
                      className={cn(
                        'py-0.5 transition-colors',
                        selectedVerse === v.number && 'bg-stone-200/60 rounded text-stone-700'
                      )}
                    >
                      <sup className="text-xs text-stone-400 mr-0.5 font-sans">{v.number}</sup>
                      {v.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main document column */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Snapshot viewing banner */}
        {viewedSnapshot && (
          <div className="flex-none border-b border-blue-200 bg-blue-50 px-6 py-2.5 flex items-center justify-between">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Tilannekuva:</span> {viewedSnapshot.name}
              <span className="text-blue-600 ml-2">
                ({new Date(viewedSnapshot.createdAt).toLocaleDateString('fi-FI', { day: 'numeric', month: 'long', year: 'numeric' })})
              </span>
            </p>
            <button
              onClick={() => viewSnapshotAction(null)}
              className="text-sm text-blue-700 hover:text-blue-900 font-medium px-3 py-1 rounded hover:bg-blue-100 transition-colors"
            >
              Sulje
            </button>
          </div>
        )}

        {/* Scrollable document area */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-stone-100">
          <div className="max-w-3xl mx-auto py-8 px-4">
            {/* A4-like page */}
            <div className="bg-white border border-stone-300 shadow-md" style={{ padding: '40px 50px', minHeight: '800px' }}>
              {/* Document header */}
              <p className="font-serif text-sm text-stone-400 mb-1">1. Tessalonikalaiskirje</p>
              <h1 className="font-serif text-2xl font-semibold text-stone-800 leading-tight mb-4">Luku 2</h1>

              {/* View toggle */}
              <div className="flex gap-1 mb-6 border-b border-stone-200">
                <button
                  onClick={() => setDocView('ehdotukset')}
                  className={cn(
                    'text-sm px-3 py-1.5 -mb-px border-b-2 transition-colors',
                    docView === 'ehdotukset'
                      ? 'border-green-600 text-green-700 font-medium'
                      : 'border-transparent text-stone-400 hover:text-stone-600'
                  )}
                >
                  Ehdotukset
                </button>
                <button
                  onClick={() => setDocView('tarkistus')}
                  className={cn(
                    'text-sm px-3 py-1.5 -mb-px border-b-2 transition-colors',
                    docView === 'tarkistus'
                      ? 'border-yellow-600 text-yellow-700 font-medium'
                      : 'border-transparent text-stone-400 hover:text-stone-600'
                  )}
                >
                  Tarkistus
                </button>
              </div>

              {/* Verses */}
              <div className="font-serif text-base leading-7 text-stone-800">
                {(appVersion === '1a' || appVersion === '1ba' || appVersion === '1bb' || appVersion === '1c') ? (
                  <>
                    {appVersion === '1a' && (
                      <DocumentEditor
                        verses={verses}
                        proposals={proposals}
                        users={users}
                        currentUserId={currentUserId}
                        showProposals={docView === 'ehdotukset'}
                        showReviewComments={docView === 'tarkistus'}
                        selectedVerse={selectedVerse}
                        onSelectVerse={setSelectedVerse}
                        onAddProposal={addProposal}
                      />
                    )}
                    {appVersion === '1ba' && (
                      <TiptapEditorA
                        verses={verses}
                        proposals={proposals}
                        users={users}
                        currentUserId={currentUserId}
                        showProposals={docView === 'ehdotukset'}
                        showReviewComments={docView === 'tarkistus'}
                        selectedVerse={selectedVerse}
                        onSelectVerse={setSelectedVerse}
                        onAddProposal={addProposal}
                      />
                    )}
                    {appVersion === '1bb' && (
                      <TiptapEditorB
                        verses={verses}
                        proposals={proposals}
                        users={users}
                        currentUserId={currentUserId}
                        showProposals={docView === 'ehdotukset'}
                        showReviewComments={docView === 'tarkistus'}
                        selectedVerse={selectedVerse}
                        onSelectVerse={setSelectedVerse}
                        onAddProposal={addProposal}
                        onEditFootnote={editFootnote}
                      />
                    )}
                    {appVersion === '1c' && (
                      <ContinuousDoc
                        verses={verses}
                        proposals={proposals}
                        users={users}
                        currentUserId={currentUserId}
                        currentUserRole={currentUser.role}
                        showProposals={docView === 'ehdotukset'}
                        showReviewComments={docView === 'tarkistus'}
                        selectedVerse={selectedVerse}
                        onSelectVerse={setSelectedVerse}
                        onAddProposal={addProposal}
                      />
                    )}
                  </>
                ) : (
                  verses.map((verse, i) => {
                    const annotations = verseAnnotations[i]
                    const hasActiveProposal = proposals.some(
                      p => p.status !== 'hyvaksytty_lopullisesti' && proposalCoversVerse(p, verse.number)
                    )
                    const canDraft = currentUser.role === 'kaantaja' && !hasActiveProposal && draftingVerse !== verse.number

                    return (
                      <Verse
                        key={verse.number}
                        ref={el => setVerseRef(verse.number, el)}
                        verse={verse}
                        isSelected={selectedVerse === verse.number}
                        onSelect={() => setSelectedVerse(verse.number)}
                        sectionHeader={verse.sectionHeader}
                        footnotes={verse.footnotes?.map(fn => ({
                          ...fn,
                          onEdit: (newText: string) => editFootnote(verse.number, fn.marker, newText),
                          onDelete: () => deleteFootnote(verse.number, fn.marker),
                        }))}
                        footnoteActions={{ onAdd: (text: string) => addFootnote(verse.number, text) }}
                        proposalAnnotation={annotations.proposalAnnotation}
                        reviewComments={annotations.reviewComments}
                        showProposals={docView === 'ehdotukset'}
                        showReviewComments={docView === 'tarkistus'}
                        onStartDraft={canDraft ? () => startDraft(verse.number) : undefined}
                        draftState={draftingVerse === verse.number ? {
                          text: draftText,
                          rationale: draftRationale,
                          onTextChange: setDraftText,
                          onRationaleChange: setDraftRationale,
                          onSubmit: submitDraft,
                          onCancel: cancelDraft,
                        } : undefined}
                      />
                    )
                  })
                )}
              </div>
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
              onStartEdit={undefined}
              onRevert={undefined}
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
