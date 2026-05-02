import React from 'react'

export function renderWithHighlights(text: string, highlights: string[]): React.ReactNode {
  if (!highlights.length) return text

  const ranges: { start: number; end: number }[] = []
  for (const hl of highlights) {
    let idx = 0
    while ((idx = text.indexOf(hl, idx)) !== -1) {
      ranges.push({ start: idx, end: idx + hl.length })
      idx += 1
    }
  }

  if (!ranges.length) return text

  ranges.sort((a, b) => a.start - b.start || b.end - a.end)

  const merged: { start: number; end: number }[] = [ranges[0]]
  for (let i = 1; i < ranges.length; i++) {
    const last = merged[merged.length - 1]
    if (ranges[i].start <= last.end) {
      last.end = Math.max(last.end, ranges[i].end)
    } else {
      merged.push({ ...ranges[i] })
    }
  }

  const parts: React.ReactNode[] = []
  let cursor = 0
  for (const range of merged) {
    if (cursor < range.start) {
      parts.push(text.slice(cursor, range.start))
    }
    parts.push(
      <mark key={range.start} className="bg-amber-100/70 rounded-sm">
        {text.slice(range.start, range.end)}
      </mark>
    )
    cursor = range.end
  }
  if (cursor < text.length) {
    parts.push(text.slice(cursor))
  }

  return <>{parts}</>
}
