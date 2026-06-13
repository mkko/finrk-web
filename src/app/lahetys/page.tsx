'use client'

import { useState, useMemo } from 'react'
import { useStore } from '@/lib/store'
import { getCurrentTextWork } from '@/lib/selectors'
import { WordDiff } from '@/components/chapter/VersionHistory'
import { VoterSelectionModal } from '@/components/chapter/VoterSelectionModal'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function LahetysPage() {
  const verses = useStore(s => s.verses)
  const textWorks = useStore(s => s.textWorks)
  const proposals = useStore(s => s.proposals)
  const currentUserId = useStore(s => s.currentUserId)
  const users = useStore(s => s.users)
  const currentUser = users.find(u => u.id === currentUserId)!
  const currentTw = getCurrentTextWork(textWorks)

  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set())
  const [showVoterModal, setShowVoterModal] = useState(false)

  if (currentUser.role !== 'tekstiryhma') {
    return (
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
          <p className="text-stone-500">Tämä näkymä on tarkoitettu tekstiryhmän jäsenille.</p>
        </div>
      </div>
    )
  }

  // Find verses in active (unresolved) proposals
  const activeProposalVerses = useMemo(() => {
    const active = proposals.filter(p => !p.resolvedAt && p.selectedVerses)
    const nums = new Set<number>()
    for (const p of active) {
      for (const n of p.selectedVerses ?? []) nums.add(n)
    }
    return nums
  }, [proposals])

  // Published but unreviewed: baseText !== approvedText and not in active proposal
  const unreviewedVerses = verses.filter(v =>
    v.baseText !== v.approvedText && !activeProposalVerses.has(v.number)
  )

  const toggleVerse = (num: number) => {
    setSelectedVerses(prev => {
      const next = new Set(prev)
      if (next.has(num)) next.delete(num)
      else next.add(num)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedVerses.size === unreviewedVerses.length) {
      setSelectedVerses(new Set())
    } else {
      setSelectedVerses(new Set(unreviewedVerses.map(v => v.number)))
    }
  }

  const selectedList = unreviewedVerses.filter(v => selectedVerses.has(v.number))

  return (
    <div className="h-full flex flex-col">
      {/* Page header */}
      <div className="flex-none border-b border-stone-200 bg-white px-4 sm:px-6 py-4">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-xl font-semibold text-stone-800">Lähetys hallitukselle</h1>
          <p className="text-sm text-stone-500 mt-1">
            Valitse julkaistut muutokset ja lähetä ne hallituksen tarkistettavaksi.
          </p>
        </div>
      </div>

      {unreviewedVerses.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-sm text-stone-400">Ei tarkistamattomia muutoksia.</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex">
          {/* Left panel: verse checklist */}
          <div className="w-72 shrink-0 border-r border-stone-200 overflow-y-auto bg-stone-50">
            <div className="p-3 space-y-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                  Tarkistamattomat ({unreviewedVerses.length})
                </p>
                <button
                  onClick={toggleAll}
                  className="text-xs text-stone-500 hover:text-stone-700"
                >
                  {selectedVerses.size === unreviewedVerses.length ? 'Poista valinnat' : 'Valitse kaikki'}
                </button>
              </div>
              {unreviewedVerses.map(v => (
                <label
                  key={v.number}
                  className={cn(
                    'flex items-start gap-2 rounded-md px-3 py-2 text-xs cursor-pointer transition-colors',
                    selectedVerses.has(v.number)
                      ? 'bg-violet-50 border border-violet-200'
                      : 'hover:bg-white/60'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedVerses.has(v.number)}
                    onChange={() => toggleVerse(v.number)}
                    className="mt-0.5 h-4 w-4 rounded border-stone-300"
                  />
                  <div className="min-w-0">
                    <span className="font-medium text-stone-700">Jae {v.number}</span>
                    <p className="text-stone-400 truncate mt-0.5">
                      {v.approvedText.slice(0, 60)}…
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Right panel: diff preview */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedList.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-stone-400">
                  Valitse jakeet vasemmalta nähdäksesi muutokset.
                </p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="text-xs text-stone-400 mb-4">
                  {selectedList.length} {selectedList.length === 1 ? 'jae' : 'jaetta'} valittu
                </div>
                <div
                  className="bg-white border border-stone-300 shadow-md font-serif text-base leading-7 text-stone-800 rounded-lg"
                  style={{ padding: '40px 50px' }}
                >
                  {selectedList.map(v => (
                    <p key={v.number} className="mb-1">
                      <span
                        className="text-xs text-stone-400 font-sans"
                        style={{ verticalAlign: 'super', fontSize: '0.65em', lineHeight: 0 }}
                      >
                        {v.number}
                      </span>{' '}
                      <WordDiff oldText={v.approvedText} newText={v.baseText} />
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      {selectedList.length > 0 && (
        <div className="flex-none border-t border-stone-200 bg-white px-6 py-3 flex items-center justify-between">
          <p className="text-sm text-stone-600">
            {selectedList.length} {selectedList.length === 1 ? 'jae' : 'jaetta'} valittu lähetettäväksi
          </p>
          <Button onClick={() => setShowVoterModal(true)}>
            Lähetä hallitukselle
          </Button>
        </div>
      )}

      {currentTw && (
        <VoterSelectionModal
          open={showVoterModal}
          onClose={() => {
            setShowVoterModal(false)
            setSelectedVerses(new Set())
          }}
          textWorkId={currentTw.id}
          selectedVerses={[...selectedVerses]}
        />
      )}
    </div>
  )
}
