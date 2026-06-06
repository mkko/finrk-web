'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useStore } from '@/lib/store'
import { VerseDetailPanel } from './VerseDetailPanel'
import { TiptapEditorB } from './TiptapEditorB'
import { cn } from '@/lib/utils'

type DocView = 'ehdotukset' | 'tarkistus'

export function ChapterView() {
  const searchParams = useSearchParams()
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null)
  const [docView, setDocView] = useState<DocView>('ehdotukset')

  const storeVerses = useStore(s => s.verses)
  const proposals = useStore(s => s.proposals)
  const users = useStore(s => s.users)
  const addProposal = useStore(s => s.addProposal)
  const editFootnote = useStore(s => s.editFootnote)
  const editSectionHeader = useStore(s => s.editSectionHeader)
  const currentUserId = useStore(s => s.currentUserId)
  const viewingSnapshotId = useStore(s => s.viewingSnapshotId)
  const snapshots = useStore(s => s.snapshots)
  const viewedSnapshot = viewingSnapshotId ? snapshots.find(s => s.id === viewingSnapshotId) : null
  const verses = viewedSnapshot
    ? storeVerses.map(v => {
        const snapshotVerse = viewedSnapshot.verseTexts.find(sv => sv.number === v.number)
        return snapshotVerse ? { ...v, text: snapshotVerse.text } : v
      })
    : storeVerses

  const viewSnapshotAction = useStore(s => s.viewSnapshot)

  useEffect(() => {
    const v = searchParams.get('verse')
    if (v) {
      const num = Number(v)
      if (num >= 1 && num <= 20) setSelectedVerse(num)
    }
  }, [searchParams])

  return (
    <div className="h-full flex">
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
                  onEditSectionHeader={editSectionHeader}
                />
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
