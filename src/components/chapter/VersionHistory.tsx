'use client'

import { useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { Snapshot, Proposal, TextWork } from '@/lib/types'

interface Props {
  textWorkId: string
}

type TimelineEntry =
  | { kind: 'draft'; snapshot: Snapshot }
  | { kind: 'milestone'; snapshot: Snapshot; label: string; color: 'green' | 'violet' | 'red' }

function getMilestoneInfo(
  snapshot: Snapshot,
  proposals: Proposal[],
  textWorks: TextWork[],
): { label: string; color: 'green' | 'violet' | 'red' } | null {
  if (snapshot.type === 'publication') {
    return { label: snapshot.name ?? 'Pohjaversio', color: 'green' }
  }

  if (snapshot.type === 'submission') {
    const proposal = proposals.find(p => p.snapshotId === snapshot.id)
    if (!proposal) return { label: 'Lähetetty', color: 'violet' }

    if (proposal.cancelledAt) return null // cancelled submissions hidden
    if (proposal.resolvedAt) {
      const tw = textWorks.find(t => t.id === proposal.textWorkId)
      return tw?.status === 'hyvaksytty'
        ? { label: 'Hyväksytty', color: 'green' }
        : { label: 'Hylätty', color: 'red' }
    }
    return { label: 'Käsittelyssä', color: 'violet' }
  }

  return null
}

export function VersionHistory({ textWorkId }: Props) {
  const snapshots = useStore(s => s.snapshots)
  const proposals = useStore(s => s.proposals)
  const textWorks = useStore(s => s.textWorks)
  const users = useStore(s => s.users)

  const timeline = useMemo(() => {
    const workSnapshots = snapshots.filter(s => s.textWorkId === textWorkId)
    const workProposals = proposals.filter(p => p.textWorkId === textWorkId)

    const entries: TimelineEntry[] = []

    for (const snap of workSnapshots) {
      const milestoneInfo = getMilestoneInfo(snap, workProposals, textWorks)
      if (milestoneInfo) {
        entries.push({ kind: 'milestone', snapshot: snap, ...milestoneInfo })
      } else if (snap.type === 'internal') {
        entries.push({ kind: 'draft', snapshot: snap })
      }
      // cancelled submissions are skipped
    }

    // Sort newest first
    entries.sort((a, b) =>
      new Date(b.snapshot.createdAt).getTime() - new Date(a.snapshot.createdAt).getTime()
    )

    return entries
  }, [snapshots, proposals, textWorks, textWorkId])

  // Find the nearest preceding milestone for diff base
  function findDiffBase(entryIndex: number): Snapshot | null {
    for (let i = entryIndex + 1; i < timeline.length; i++) {
      if (timeline[i].kind === 'milestone') {
        return timeline[i].snapshot
      }
    }
    return null
  }

  const [selectedIdx, setSelectedIdx] = useState(0)
  const selected = timeline[selectedIdx]?.snapshot ?? null
  const diffBase = selectedIdx >= 0 ? findDiffBase(selectedIdx) : null

  if (timeline.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-sm text-stone-400">Ei aiempia versioita.</p>
      </div>
    )
  }

  const milestoneColorClasses = {
    green: {
      border: 'border-l-emerald-500',
      bg: 'bg-emerald-50',
      badge: 'bg-emerald-100 text-emerald-700',
      selectedBorder: 'border-emerald-400',
    },
    violet: {
      border: 'border-l-violet-500',
      bg: 'bg-violet-50',
      badge: 'bg-violet-100 text-violet-700',
      selectedBorder: 'border-violet-400',
    },
    red: {
      border: 'border-l-red-500',
      bg: 'bg-red-50',
      badge: 'bg-red-100 text-red-700',
      selectedBorder: 'border-red-400',
    },
  }

  return (
    <div className="flex-1 min-h-0 flex">
      {/* Version list */}
      <div className="w-56 shrink-0 border-r border-stone-200 overflow-y-auto bg-stone-50">
        <div className="p-3 space-y-1">
          {timeline.map((entry, i) => {
            const isSelected = selectedIdx === i
            const date = new Date(entry.snapshot.createdAt).toLocaleDateString('fi-FI', {
              day: 'numeric', month: 'numeric', year: 'numeric',
            })

            if (entry.kind === 'milestone') {
              const colors = milestoneColorClasses[entry.color]
              return (
                <button
                  key={entry.snapshot.id}
                  onClick={() => setSelectedIdx(i)}
                  className={cn(
                    'w-full text-left rounded-md px-3 py-2 text-xs transition-colors border-l-[3px]',
                    colors.border,
                    colors.bg,
                    isSelected
                      ? `border ${colors.selectedBorder} shadow-sm`
                      : 'hover:brightness-95'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={cn('inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded', colors.badge)}>
                      {entry.label}
                    </span>
                  </div>
                  <div className="text-stone-500 mt-1">{date}</div>
                </button>
              )
            }

            // Draft entry
            const author = users.find(u => u.id === entry.snapshot.createdBy)
            return (
              <button
                key={entry.snapshot.id}
                onClick={() => setSelectedIdx(i)}
                className={cn(
                  'w-full text-left rounded-md px-3 py-2 text-xs transition-colors',
                  isSelected
                    ? 'bg-white border border-stone-300 shadow-sm'
                    : 'hover:bg-white/60'
                )}
              >
                <div className="font-medium text-stone-700 truncate">
                  {entry.snapshot.name || 'Luonnos'}
                </div>
                <div className="text-stone-400 mt-0.5">{date}</div>
                {author && (
                  <div className="text-stone-400 mt-0.5">{author.name}</div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Diff view */}
      <div className="flex-1 overflow-y-auto p-6">
        {selected && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="text-xs text-stone-400 mb-4">
              {diffBase
                ? <>Muutokset verrattuna edelliseen versioon ({diffBase.name || 'edellinen'})</>
                : <>Ensimmäinen versio</>
              }
            </div>
            <div className="bg-white border border-stone-300 shadow-md font-serif text-base leading-7 text-stone-800" style={{ padding: '40px 50px' }}>
              {selected.verseTexts.map(sv => {
                const prevText = diffBase?.verseTexts.find(p => p.chapter === sv.chapter && p.number === sv.number)?.text
                const changed = prevText !== undefined && prevText !== sv.text
                const isNew = prevText === undefined

                return (
                  <p key={`${sv.chapter}-${sv.number}`} className="mb-1">
                    <span className="text-xs text-stone-400 font-sans" style={{ verticalAlign: 'super', fontSize: '0.65em', lineHeight: 0 }}>
                      {sv.number}
                    </span>
                    {' '}
                    {changed ? (
                      <WordDiff oldText={prevText!} newText={sv.text} />
                    ) : isNew ? (
                      <span>{renderTextWithBreaks(sv.text, 'bg-emerald-100/60 rounded-sm px-0.5')}</span>
                    ) : (
                      <span>{renderTextWithBreaks(sv.text)}</span>
                    )}
                  </p>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Simple word-level diff

interface DiffPart {
  type: 'same' | 'add' | 'del'
  text: string
}

function renderTextWithBreaks(text: string, className?: string) {
  const segments = text.split('\n')
  return segments.map((seg, i) => (
    <span key={i}>
      {i > 0 && <br />}
      <span className={className}>{seg}</span>
    </span>
  ))
}

export function WordDiff({ oldText, newText }: { oldText: string; newText: string }) {
  const parts = diffWords(oldText, newText)

  // If too few words are shared, the inline diff is unreadable — show as block diff instead
  const sameCount = parts.filter(p => p.type === 'same').reduce((n, p) => n + p.text.trim().split(/\s+/).filter(Boolean).length, 0)
  const totalWords = Math.max(
    oldText.trim().split(/\s+/).filter(Boolean).length,
    newText.trim().split(/\s+/).filter(Boolean).length,
    1
  )
  const similarity = sameCount / totalWords

  if (similarity < 0.4) {
    return (
      <span>
        <span className="bg-red-100 text-red-700 line-through rounded-sm px-0.5">{oldText}</span>
        {' '}
        <span className="bg-emerald-100 text-emerald-700 rounded-sm px-0.5">{newText}</span>
      </span>
    )
  }

  return (
    <span>
      {parts.map((p, i) => {
        if (p.type === 'same') return <span key={i}>{renderTextWithBreaks(p.text)}</span>
        if (p.type === 'del') return <span key={i}>{renderTextWithBreaks(p.text, 'bg-red-100 text-red-700 line-through rounded-sm px-0.5')}</span>
        return <span key={i}>{renderTextWithBreaks(p.text, 'bg-emerald-100 text-emerald-700 rounded-sm px-0.5')}</span>
      })}
    </span>
  )
}

function diffWords(a: string, b: string): DiffPart[] {
  const aWords = a.split(/(\s+)/)
  const bWords = b.split(/(\s+)/)

  // Simple LCS-based word diff
  const m = aWords.length
  const n = bWords.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (aWords[i - 1] === bWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack
  const parts: DiffPart[] = []
  let i = m, j = n
  const stack: DiffPart[] = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aWords[i - 1] === bWords[j - 1]) {
      stack.push({ type: 'same', text: aWords[i - 1] })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: 'add', text: bWords[j - 1] })
      j--
    } else {
      stack.push({ type: 'del', text: aWords[i - 1] })
      i--
    }
  }

  stack.reverse()

  // Merge consecutive same-type parts
  for (const part of stack) {
    const last = parts[parts.length - 1]
    if (last && last.type === part.type) {
      last.text += part.text
    } else {
      parts.push({ ...part })
    }
  }

  return parts
}
