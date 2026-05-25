'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { STATUS_LABELS, STATUS_INDICATOR_COLORS, ProposalStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const STATUS_ORDER: ProposalStatus[] = [
  'luonnos',
  'ehdotettu',
  'hallituksen_kasittelyssa',
  'hyvaksytty_lopullisesti',
]

export default function ProgressPage() {
  const { verses, proposals, activity, users, snapshots, viewingSnapshotId, createSnapshot, viewSnapshot } = useStore()
  const [snapshotName, setSnapshotName] = useState('')
  const [showForm, setShowForm] = useState(false)

  const totalVerses = verses.length
  const ratifiedVerses = new Set(
    proposals
      .filter(p => p.status === 'hyvaksytty_lopullisesti')
      .flatMap(p =>
        p.ranges.flatMap(r => {
          const nums: number[] = []
          for (let i = r.verseStart; i <= r.verseEnd; i++) nums.push(i)
          return nums
        })
      )
  ).size

  const statusCounts = STATUS_ORDER.map(status => ({
    status,
    count: proposals.filter(p => p.status === status).length,
  }))

  const recentActivity = activity.slice(0, 10)

  const approvedCount = proposals.filter(p => p.status === 'hyvaksytty_lopullisesti').length

  const handleCreateSnapshot = () => {
    if (!snapshotName.trim()) return
    createSnapshot(snapshotName.trim())
    setSnapshotName('')
    setShowForm(false)
  }

  const viewedSnapshot = viewingSnapshotId ? snapshots.find(s => s.id === viewingSnapshotId) : null

  return (
    <div className="h-full overflow-y-auto"><div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <h1 className="text-xl font-semibold text-stone-800 mb-6">Edistyminen</h1>

      {/* Snapshot viewing banner */}
      {viewedSnapshot && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-800">
              Katselet tilannekuvaa: {viewedSnapshot.name}
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              {new Date(viewedSnapshot.createdAt).toLocaleDateString('fi-FI', { day: 'numeric', month: 'long', year: 'numeric' })}
              {' — '}
              {viewedSnapshot.includedProposalIds.length} hyväksyttyä ehdotusta
            </p>
          </div>
          <button
            onClick={() => viewSnapshot(null)}
            className="text-sm text-blue-700 hover:text-blue-900 font-medium px-3 py-1.5 rounded hover:bg-blue-100 transition-colors"
          >
            Sulje
          </button>
        </div>
      )}

      {/* Progress bar */}
      <div className="bg-white rounded-lg border border-stone-200 p-6 mb-6">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-medium text-stone-800">Lopullisesti hyväksytyt jakeet</h2>
          <span className="text-2xl font-semibold text-stone-800">
            {ratifiedVerses} / {totalVerses}
          </span>
        </div>
        <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-500"
            style={{ width: `${(ratifiedVerses / totalVerses) * 100}%` }}
          />
        </div>
        <p className="text-sm text-stone-500 mt-2">
          {totalVerses - ratifiedVerses} jaetta odottaa vielä käsittelyä
        </p>
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {statusCounts.map(({ status, count }) => (
          <div key={status} className="bg-white rounded-lg border border-stone-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('w-2.5 h-2.5 rounded-full', STATUS_INDICATOR_COLORS[status])} />
              <span className="text-xs text-stone-500">{STATUS_LABELS[status]}</span>
            </div>
            <span className="text-2xl font-semibold text-stone-800">{count}</span>
          </div>
        ))}
      </div>

      {/* Snapshots */}
      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <h2 className="font-medium text-stone-800">Tilannekuvat</h2>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="text-sm text-stone-600 hover:text-stone-900 font-medium px-3 py-1.5 rounded hover:bg-stone-50 transition-colors"
            >
              Luo tilannekuva
            </button>
          )}
        </div>

        {showForm && (
          <div className="px-6 py-4 border-b border-stone-100 bg-stone-50">
            <p className="text-sm text-stone-600 mb-3">
              Tilannekuva tallentaa käännöksen nykyisen tilan. {approvedCount > 0
                ? `${approvedCount} hyväksyttyä ehdotusta sisällytetään.`
                : 'Ei vielä hyväksyttyjä ehdotuksia.'}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={snapshotName}
                onChange={e => setSnapshotName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateSnapshot()}
                placeholder="Tilannekuvan nimi, esim. &quot;Toinen luonnoskierros&quot;"
                className="flex-1 text-sm border border-stone-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <button
                onClick={handleCreateSnapshot}
                disabled={!snapshotName.trim()}
                className="text-sm font-medium px-4 py-1.5 rounded-md bg-stone-800 text-white hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Luo
              </button>
              <button
                onClick={() => { setShowForm(false); setSnapshotName('') }}
                className="text-sm text-stone-500 hover:text-stone-700 px-3 py-1.5"
              >
                Peruuta
              </button>
            </div>
          </div>
        )}

        {snapshots.length === 0 ? (
          <div className="px-6 py-8 text-center text-stone-400">
            Ei vielä tilannekuvia.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {[...snapshots].reverse().map(snapshot => {
              const creator = users.find(u => u.id === snapshot.createdBy)
              const isViewing = viewingSnapshotId === snapshot.id
              return (
                <div key={snapshot.id} className={cn('px-6 py-4 flex items-center justify-between', isViewing && 'bg-blue-50')}>
                  <div>
                    <p className="text-sm font-medium text-stone-800">{snapshot.name}</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {creator?.name ?? 'Tuntematon'}
                      {' — '}
                      {new Date(snapshot.createdAt).toLocaleDateString('fi-FI', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                      {' — '}
                      {snapshot.includedProposalIds.length} ehdotusta
                    </p>
                  </div>
                  <button
                    onClick={() => viewSnapshot(isViewing ? null : snapshot.id)}
                    className={cn(
                      'text-sm font-medium px-3 py-1.5 rounded transition-colors',
                      isViewing
                        ? 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                    )}
                  >
                    {isViewing ? 'Sulje' : 'Näytä'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200">
          <h2 className="font-medium text-stone-800">Viimeaikainen toiminta</h2>
        </div>
        {recentActivity.length === 0 ? (
          <div className="px-6 py-8 text-center text-stone-400">
            Ei vielä toimintaa.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {recentActivity.map(entry => {
              const user = users.find(u => u.id === entry.userId)
              return (
                <div key={entry.id} className="px-6 py-3 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-stone-300 mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-700">
                      <span className="font-medium">{user?.name ?? 'Tuntematon'}</span>
                      {' — '}
                      {entry.detail}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {new Date(entry.timestamp).toLocaleDateString('fi-FI', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div></div>
  )
}
