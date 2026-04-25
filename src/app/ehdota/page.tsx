'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Suspense } from 'react'

function ProposeForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialVerse = searchParams.get('verse') ? Number(searchParams.get('verse')) : 1

  const { verses, addProposal, currentUserId, users } = useStore()
  const currentUser = users.find(u => u.id === currentUserId)!

  const [verseStart, setVerseStart] = useState(initialVerse)
  const [verseEnd, setVerseEnd] = useState(initialVerse)
  const [proposedText, setProposedText] = useState('')
  const [rationale, setRationale] = useState('')

  if (currentUser.role !== 'kaantaja') {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <p className="text-stone-500">Vain kääntäjät voivat ehdottaa muutoksia.</p>
      </div>
    )
  }

  const selectedVerses = verses.filter(v => v.number >= verseStart && v.number <= verseEnd)
  const currentText = selectedVerses.map(v => v.text).join(' ')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!proposedText.trim() || !rationale.trim()) return

    addProposal({
      verseStart,
      verseEnd,
      proposedText: proposedText.trim(),
      rationale: rationale.trim(),
      authorId: currentUserId,
      status: 'keskustelussa', // auto-advance from luonnos
    })
    router.push('/')
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <h1 className="text-xl font-semibold text-stone-800 mb-6">Ehdota muutosta</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Verse range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Alkaen jakeesta
            </label>
            <select
              value={verseStart}
              onChange={e => {
                const v = Number(e.target.value)
                setVerseStart(v)
                if (v > verseEnd) setVerseEnd(v)
              }}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm bg-white"
            >
              {verses.map(v => (
                <option key={v.number} value={v.number}>
                  Jae {v.number}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Päättyen jakeeseen
            </label>
            <select
              value={verseEnd}
              onChange={e => setVerseEnd(Number(e.target.value))}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm bg-white"
            >
              {verses
                .filter(v => v.number >= verseStart)
                .map(v => (
                  <option key={v.number} value={v.number}>
                    Jae {v.number}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Current text */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Nykyinen teksti
          </label>
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="font-serif text-base leading-7 text-stone-600">
              {currentText}
            </p>
          </div>
        </div>

        {/* Proposed text */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Ehdotettu teksti
          </label>
          <Textarea
            value={proposedText}
            onChange={e => setProposedText(e.target.value)}
            placeholder="Kirjoita ehdotettu uusi teksti..."
            className="min-h-[120px] font-serif text-base leading-7"
            rows={4}
          />
        </div>

        {/* Rationale */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Perustelut
          </label>
          <Textarea
            value={rationale}
            onChange={e => setRationale(e.target.value)}
            placeholder="Miksi ehdotat tätä muutosta?"
            className="min-h-[80px] text-sm"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Peruuta
          </Button>
          <Button
            type="submit"
            disabled={!proposedText.trim() || !rationale.trim()}
          >
            Tallenna ehdotus
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function ProposePage() {
  return (
    <Suspense>
      <ProposeForm />
    </Suspense>
  )
}
