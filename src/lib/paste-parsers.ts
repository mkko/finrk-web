// Parse functions for pasted Bible text content.
// Extracted from TiptapEditorB for testability.

export function parseVerseLines(text: string): { number: number; text: string }[] | null {
  const lines = text.split('\n').filter(l => l.trim())
  const parsed: { number: number; text: string }[] = []
  for (const line of lines) {
    const m = line.match(/^(\d+)\s+(.+)/)
    if (m) {
      parsed.push({ number: parseInt(m[1], 10), text: m[2].trim() })
    } else if (parsed.length > 0) {
      parsed[parsed.length - 1].text += '\n' + line.trim()
    }
  }
  return parsed.length > 0 ? parsed : null
}

export function parseVerseLinesEndOfChapter(text: string): { number: number; text: string; footnotes: { marker: string; text: string }[] }[] | null {
  const lines = text.split('\n').filter(l => l.trim())
  const result: { number: number; text: string; footnotes: { marker: string; text: string }[] }[] = []
  let expectedNext: number | null = null

  for (const line of lines) {
    const m = line.match(/^(\d+)\s+(.+)/)
    if (m) {
      const num = parseInt(m[1], 10)
      if (expectedNext === null || num === expectedNext) {
        result.push({ number: num, text: m[2].trim(), footnotes: [] })
        expectedNext = num + 1
      } else if (result.length > 0) {
        const prev = result[result.length - 1]
        prev.footnotes.push({ marker: m[1], text: m[2].trim() })
      }
    } else if (result.length > 0) {
      const trimmed = line.trim()
      if (/^[a-z]\)/.test(trimmed) || /^[\u2020\u2021*†‡§]/.test(trimmed) || /^\(/.test(trimmed)) {
        const prev = result[result.length - 1]
        const markerMatch = trimmed.match(/^(\S+)\s+(.*)/)
        if (markerMatch) {
          prev.footnotes.push({ marker: markerMatch[1], text: markerMatch[2] })
        } else {
          prev.footnotes.push({ marker: `${prev.number}`, text: trimmed })
        }
      } else {
        result[result.length - 1].text += '\n' + trimmed
      }
    }
  }

  return result.length > 0 ? result : null
}

const CHAPTER_RE = /^Luku\s+(\d+)\s*$/
const FOOTNOTE_RE = /^(\d+:\d+)\.\s+(.+)/
const VERSE_RE_LINE = /^(\d+)\s+(.+)/

export interface ParsedDocxNode {
  type: 'chapterHeading' | 'sectionHeader' | 'verse' | 'variant' | 'base' | 'footnote' | 'crossRef'
  chapter?: number
  verse?: number
  text: string
}

export function parseDocxPaste(text: string): ParsedDocxNode[] | null {
  const lines = text.split('\n')
  const result: ParsedDocxNode[] = []
  const seenChapters = new Set<number>()
  let inCrossRefSection = false
  let lastVerseNum = 0
  let currentChapter = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const chM = line.match(CHAPTER_RE)
    if (chM) {
      const ch = parseInt(chM[1], 10)
      if (seenChapters.has(ch)) {
        inCrossRefSection = true
        currentChapter = ch
        continue
      }
      seenChapters.add(ch)
      currentChapter = ch
      lastVerseNum = 0
      inCrossRefSection = false
      result.push({ type: 'chapterHeading', chapter: ch, text: '' })
      continue
    }

    if (inCrossRefSection) {
      const rm = line.match(VERSE_RE_LINE)
      if (rm) {
        result.push({ type: 'crossRef', chapter: currentChapter, verse: parseInt(rm[1], 10), text: rm[2] })
      }
      continue
    }

    const fnM = line.match(FOOTNOTE_RE)
    if (fnM) {
      result.push({ type: 'footnote', verse: lastVerseNum, text: `${fnM[1]} ${fnM[2]}` })
      continue
    }

    const vM = line.match(VERSE_RE_LINE)
    if (vM) {
      const num = parseInt(vM[1], 10)
      if (num === lastVerseNum) {
        // Duplicate verse number: first was base text, second is the proposal.
        // Retroactively demote the previous verse to 'base', this one becomes the verse.
        const prevIdx = result.findLastIndex(n => n.type === 'verse' && n.verse === num && n.chapter === currentChapter)
        if (prevIdx !== -1) {
          result[prevIdx] = { ...result[prevIdx], type: 'base' }
        }
        result.push({ type: 'verse', chapter: currentChapter, verse: num, text: vM[2] })
      } else {
        lastVerseNum = num
        result.push({ type: 'verse', chapter: currentChapter, verse: num, text: vM[2] })
      }
      continue
    }

    // Section header vs continuation: a section header appears when:
    // 1. Previous verse ends with sentence-ending punctuation (.!?)
    // 2. The line itself has no ending punctuation (it's a title)
    // 3. The next non-empty line starts with a verse number
    const lastNode = result.length > 0 ? result[result.length - 1] : null
    const prevEndsWithSentence = lastNode && /[.!?]$/.test(lastNode.text.trim())
    const lineHasNoPunctuation = !/[.!?,;:]$/.test(line.trim())
    const nextLine = lines.slice(i + 1).find(l => l.trim())
    const nextStartsWithNumber = nextLine && VERSE_RE_LINE.test(nextLine.trim())
    const isSectionHeader = !lastNode
      || lastNode.type === 'chapterHeading' || lastNode.type === 'sectionHeader'
      || (prevEndsWithSentence && lineHasNoPunctuation && nextStartsWithNumber)
    if (isSectionHeader) {
      result.push({ type: 'sectionHeader', verse: lastVerseNum > 0 ? lastVerseNum : undefined, text: line })
    } else {
      lastNode.text += '\n' + line
    }
  }

  return seenChapters.size > 0 ? result : null
}
