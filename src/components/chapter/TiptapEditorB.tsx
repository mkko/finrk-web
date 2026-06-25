'use client'

/**
 * Bible chapter editor with three paragraph types:
 *   - Jae (verse text) — default paragraph, verse number detected by prefix
 *   - Väliotsikko (section header) — bold heading
 *   - Alaviite (footnote) — indented, smaller text
 *
 * All three types share `inline*` content model so toggling between them
 * is a clean node-type swap with no content loss or cursor jumping.
 *
 * Verse numbers are plain text detected by regex. Paragraphs without a
 * verse number are continuations of the previous verse.
 */

import { useEffect, useCallback, useRef, useMemo, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Node as TiptapNode, Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { Slice, Fragment } from '@tiptap/pm/model'
import { Verse, User } from '@/lib/types'
import { parseVerseLines, parseVerseLinesEndOfChapter, parseDocxPaste } from '@/lib/paste-parsers'

// ── Props ─────────────────────────────────────────────

export type FootnoteMode = 'inline' | 'endOfChapter'

interface Props {
  verses: Verse[]
  users: User[]
  currentUserId: string
  readOnly: boolean
  footnoteMode: FootnoteMode
  toolbarRef?: RefObject<HTMLDivElement | null>
  selectedVerse: number | null
  onSelectVerse: (num: number) => void
  onEditVerse: (chapter: number, verseNumber: number, newText: string) => void
  onAddFootnote: (chapter: number, verseNumber: number, text: string) => void
  onEditFootnote: (chapter: number, verseNumber: number, marker: string, newText: string) => void
  onEditSectionHeader: (chapter: number, verseNumber: number, newText: string) => void
  onCursorVerseChange?: (chapter: number, verseNumber: number) => void
  onComment?: (chapter: number, verseNumber: number, selectedText: string, commentText: string) => void
  onDirtyChange?: (dirty: boolean) => void
  onFocusChange?: (focused: boolean) => void
  onOpenSidebar?: (verseNumber: number) => void
}

// ── Verse number detection ────────────────────────────

const VERSE_RE = /^(\d+)\s+([\s\S]*)/

function parseVersePrefix(text: string): { verseNum: number | null; body: string } {
  const m = text.match(VERSE_RE)
  if (m) {
    const n = parseInt(m[1], 10)
    if (n > 0 && n <= 200) return { verseNum: n, body: m[2] }
  }
  return { verseNum: null, body: text }
}

// ── Custom block nodes ────────────────────────────────
// All use `inline*` content so setNode() toggles cleanly.

const SectionHeader = TiptapNode.create({
  name: 'sectionHeader',
  group: 'block',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return { verse: { default: 0 } }
  },

  parseHTML() { return [{ tag: 'h3[data-section]' }] },
  renderHTML() {
    return ['h3', {
      'data-section': '',
      style: 'font-weight: 600; font-size: 1rem; color: #1c1917; margin-top: 1.5rem; margin-bottom: 0.5rem;',
    }, 0]
  },
})

const FootnoteBlock = TiptapNode.create({
  name: 'footnoteBlock',
  group: 'block',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return { verse: { default: 0 } }
  },

  parseHTML() { return [{ tag: 'p[data-footnote-block]' }] },
  renderHTML() {
    return ['p', {
      'data-footnote-block': '',
      style: 'font-size: 0.875rem; color: #78716c; padding-left: 1.5rem; line-height: 1.625;',
    }, 0]
  },
})

const AnnotationBlock = TiptapNode.create({
  name: 'annotationBlock',
  group: 'block',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return { verse: { default: 0 } }
  },

  parseHTML() { return [{ tag: 'p[data-annotation]' }] },
  renderHTML() {
    return ['p', {
      'data-annotation': '',
      style: 'font-family: ui-sans-serif, system-ui, sans-serif; font-size: 0.8125rem; color: #92400e; background: #fffbeb; border-left: 3px solid #f59e0b; padding: 0.375rem 0.5rem; margin: 0.25rem 0; border-radius: 0.25rem; font-style: italic;',
    }, 0]
  },
})

const ChapterHeading = TiptapNode.create({
  name: 'chapterHeading',
  group: 'block',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return { chapter: { default: 1 } }
  },

  parseHTML() { return [{ tag: 'h2[data-chapter]' }] },
  renderHTML({ node }) {
    return ['h2', {
      'data-chapter': node.attrs.chapter,
      style: 'font-weight: 600; font-size: 1.125rem; color: #57534e; margin-top: 4rem; margin-bottom: 0.75rem;',
    }, 0]
  },
})

const FootnoteSeparator = TiptapNode.create({
  name: 'footnoteSeparator',
  group: 'block',
  atom: true,

  parseHTML() { return [{ tag: 'hr[data-fn-separator]' }] },
  renderHTML() {
    return ['hr', {
      'data-fn-separator': '',
      contenteditable: 'false',
      style: 'border: none; border-top: 1px dashed #d6d3d1; margin: 1.5rem 0 0.75rem; pointer-events: none;',
    }]
  },
})

// ── Decorations ───────────────────────────────────────
// Verse number superscript styling + collapsible original-text widget.

function createOriginalWidget(verseNum: number, text: string): HTMLElement {
  const details = document.createElement('details')
  details.contentEditable = 'false'
  details.className = 'select-none mb-0.5'

  const summary = document.createElement('summary')
  summary.className = 'list-none relative cursor-pointer outline-none'
  summary.style.cssText = 'height:0;line-height:0;font-size:0;'
  summary.tabIndex = -1

  const line = document.createElement('span')
  line.className = 'block border-t border-amber-300/60'
  line.style.cssText = 'margin-right:0.5rem;'

  const caret = document.createElement('span')
  caret.className = 'absolute transition-all rounded-full'
  caret.style.cssText = 'left:-2.25rem;top:0;transform:translateY(-50%);width:2.25rem;height:2.25rem;display:flex;align-items:center;justify-content:center;'
  caret.innerHTML = '<svg width="16" height="16" viewBox="0 0 8 8" style="display:block;"><path d="M2 1 L6 4 L2 7 Z" fill="rgb(251 191 36)"/></svg>'
  caret.addEventListener('mouseenter', () => { caret.style.backgroundColor = 'rgb(252 211 77 / 0.4)' })
  caret.addEventListener('mouseleave', () => { caret.style.backgroundColor = 'transparent' })

  summary.append(line, caret)
  details.appendChild(summary)

  details.addEventListener('toggle', () => {
    caret.style.transform = details.open ? 'translateY(-50%) rotate(90deg)' : 'translateY(-50%)'
  })

  const content = document.createElement('div')
  content.className = 'text-stone-500 font-serif text-base leading-7 bg-amber-50/60 border border-amber-300/60 border-t-0 rounded-lg px-2 py-1'
  content.style.cssText = 'border-top-left-radius:0;border-top-right-radius:0;'

  const num = document.createElement('span')
  num.className = 'text-xs text-stone-400 font-sans'
  num.style.cssText = 'vertical-align:super;font-size:0.65em;line-height:0;'
  num.textContent = `${verseNum}`

  content.append(num, document.createTextNode(` ${text}`))
  details.appendChild(content)
  return details
}

const decoKey = new PluginKey('decoB')

function makeDecoPlugin(versesRef: React.RefObject<Verse[]>) {
  return new Plugin({
    key: decoKey,
    state: {
      init(_config, state) { return buildDecos(state.doc, versesRef.current ?? []) },
      apply(tr, prev) { return tr.docChanged ? buildDecos(tr.doc, versesRef.current ?? []) : prev },
    },
    props: {
      decorations(state) { return this.getState(state) ?? DecorationSet.empty },
    },
  })
}

function buildDecos(doc: any, verses: Verse[]): DecorationSet {
  const decorations: Decoration[] = []
  let currentChapter = 1
  const knownKeys = new Set(verses.map(v => `${v.chapter}:${v.number}`))
  const seen = new Set<string>()

  doc.descendants((node: any, pos: number) => {
    if (node.type.name === 'chapterHeading') {
      const chMatch = node.textContent.match(/(\d+)/)
      currentChapter = chMatch ? parseInt(chMatch[1], 10) : node.attrs.chapter
      return false
    }

    // Only decorate paragraphs (verse text), not headers or footnotes
    if (node.type.name !== 'paragraph') return node.type.name === 'doc' ? undefined : false

    const text = node.textContent
    const { verseNum, body } = parseVersePrefix(text)
    if (verseNum === null) return false

    const key = `${currentChapter}:${verseNum}`

    // Style the verse-number prefix
    const firstChild = node.firstChild
    if (firstChild?.isText) {
      const m = (firstChild.text as string).match(/^(\d+)\s/)
      if (m) {
        const from = pos + 1
        const to = from + m[0].length
        const isDup = seen.has(key)
        const isUnk = !knownKeys.has(key)
        const cls = `text-xs font-sans ${isDup ? 'text-orange-500' : isUnk ? 'text-red-400' : 'text-stone-400'}`
        decorations.push(Decoration.inline(from, to, {
          class: cls,
          style: 'vertical-align:super;font-size:0.65em;line-height:0;',
        }))
      }
    }

    seen.add(key)

    // Changed verse highlight + original-text widget
    // Compare first line only since multiline verses are split across paragraphs
    const verse = verses.find(v => v.chapter === currentChapter && v.number === verseNum)
    const baseFirstLine = verse?.baseText.split('\n')[0] ?? ''
    const isChanged = verse && body.trim() !== baseFirstLine.trim()
    if (isChanged) {
      // Green background highlight for changed text
      decorations.push(Decoration.node(pos, pos + node.nodeSize, {
        style: 'background: rgba(187, 247, 208, 0.3); border-radius: 2px;',
      }))
      decorations.push(
        Decoration.widget(pos, () => createOriginalWidget(verseNum, verse.baseText), {
          side: -1,
          key: `orig-${key}`,
        })
      )
    }

    return false
  })

  return DecorationSet.create(doc, decorations)
}

// ── Build editor content from verse data ──────────────

function buildContent(verses: Verse[], mode: FootnoteMode = 'inline') {
  const content: any[] = []
  let currentChapter = 0
  let collectedFootnotes: any[] = []

  function flushFootnotes() {
    if (mode === 'endOfChapter') {
      content.push({ type: 'footnoteSeparator' })
      if (collectedFootnotes.length > 0) {
        content.push(...collectedFootnotes)
        collectedFootnotes = []
      }
    }
  }

  for (const verse of verses) {
    // Chapter heading
    if (verse.chapter !== currentChapter) {
      flushFootnotes()
      currentChapter = verse.chapter
      content.push({ type: 'chapterHeading', attrs: { chapter: currentChapter }, content: [{ type: 'text', text: `Luku ${currentChapter}` }] })
    }

    // Section header
    if (verse.sectionHeader) {
      content.push({
        type: 'sectionHeader',
        attrs: { verse: verse.number },
        content: [{ type: 'text', text: verse.sectionHeader }],
      })
    }

    // Verse text — split on \n into multiple paragraphs
    const text = verse.text || ' '
    const lines = text.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] || (i === 0 ? ' ' : '')
      if (i === 0) {
        content.push({
          type: 'paragraph',
          content: [{ type: 'text', text: `${verse.number} ${line}` }],
        })
      } else {
        content.push(
          line
            ? { type: 'paragraph', content: [{ type: 'text', text: line }] }
            : { type: 'paragraph' }
        )
      }
    }

    // Footnotes
    if (verse.footnotes) {
      for (const fn of verse.footnotes) {
        const fnNode = {
          type: 'footnoteBlock',
          attrs: { verse: verse.number },
          content: [{ type: 'text', text: `${fn.marker} ${fn.text}` }],
        }
        if (mode === 'endOfChapter') {
          collectedFootnotes.push(fnNode)
        } else {
          content.push(fnNode)
        }
      }
    }
  }

  // Flush remaining footnotes for the last chapter
  flushFootnotes()

  if (content.length === 0) {
    content.push({ type: 'paragraph', content: [{ type: 'text', text: ' ' }] })
  }

  return { type: 'doc', content }
}

// ── Extract data from editor document ─────────────────

interface ExtractedVerse {
  chapter: number
  number: number
  text: string
}

interface ExtractedData {
  verses: ExtractedVerse[]
  footnotes: { chapter: number; verse: number; marker: string; text: string }[]
  sectionHeaders: { chapter: number; verse: number; text: string }[]
}

function extractData(doc: any, mode: FootnoteMode = 'inline'): ExtractedData {
  const verses: ExtractedVerse[] = []
  const footnotes: { chapter: number; verse: number; marker: string; text: string }[] = []
  const sectionHeaders: { chapter: number; verse: number; text: string }[] = []
  let currentChapter = 1
  let lastVerseNum: number | null = null

  doc.descendants((node: any) => {
    if (node.type.name === 'chapterHeading') {
      const chMatch = node.textContent.match(/(\d+)/)
      currentChapter = chMatch ? parseInt(chMatch[1], 10) : node.attrs.chapter
      lastVerseNum = null
      return false
    }

    if (node.type.name === 'footnoteSeparator') return false

    if (node.type.name === 'sectionHeader') {
      const v = node.attrs.verse
      if (v > 0) sectionHeaders.push({ chapter: currentChapter, verse: v, text: node.textContent.trim() })
      return false
    }

    if (node.type.name === 'footnoteBlock') {
      const v = mode === 'endOfChapter' ? node.attrs.verse : (node.attrs.verse || lastVerseNum)
      if (v && v > 0) {
        const raw = node.textContent.trim()
        const m = raw.match(/^(\S+)\s+(.*)/)
        if (m) {
          footnotes.push({ chapter: currentChapter, verse: v, marker: m[1], text: m[2] })
        } else if (raw) {
          footnotes.push({ chapter: currentChapter, verse: v, marker: `${v}`, text: raw })
        }
      }
      return false
    }

    if (node.type.name === 'annotationBlock') return false

    if (node.type.name !== 'paragraph') return

    const text = node.textContent
    const { verseNum, body } = parseVersePrefix(text)

    if (verseNum !== null) {
      verses.push({ chapter: currentChapter, number: verseNum, text: body.trim() })
      lastVerseNum = verseNum
    } else if (lastVerseNum !== null) {
      // Continuation paragraph — append to last verse
      const last = verses[verses.length - 1]
      if (last) last.text += '\n' + text.trim()
    }

    return false
  })

  return { verses, footnotes, sectionHeaders }
}

// ── Find verse number at cursor ───────────────────────

function verseAtCursor(editor: any): { chapter: number; verse: number } | null {
  if (!editor) return null
  const { $from } = editor.state.selection
  const parent = $from.parent

  // Find chapter by walking backwards to nearest chapterHeading
  function findChapter(fromIdx: number): number {
    const doc = editor.state.doc
    for (let i = fromIdx; i >= 0; i--) {
      const node = doc.child(i)
      if (node.type.name === 'chapterHeading') {
        const chMatch = node.textContent.match(/(\d+)/)
        return chMatch ? parseInt(chMatch[1], 10) : node.attrs.chapter
      }
    }
    return 1
  }

  const idx = $from.index(0)

  // SectionHeader, FootnoteBlock, AnnotationBlock carry a verse attr
  if (parent.type.name === 'sectionHeader' || parent.type.name === 'footnoteBlock' || parent.type.name === 'annotationBlock') {
    const v = parent.attrs.verse
    return v ? { chapter: findChapter(idx), verse: v } : null
  }

  // Paragraph: check text prefix
  if (parent.type.name === 'paragraph') {
    const { verseNum } = parseVersePrefix(parent.textContent)
    if (verseNum !== null) return { chapter: findChapter(idx), verse: verseNum }
  }

  // Walk backwards for continuation paragraphs
  const doc = editor.state.doc
  for (let i = idx - 1; i >= 0; i--) {
    const node = doc.child(i)
    if (node.type.name === 'paragraph') {
      const { verseNum } = parseVersePrefix(node.textContent)
      if (verseNum !== null) return { chapter: findChapter(i), verse: verseNum }
    }
    if (node.type.name === 'footnoteBlock' && node.attrs.verse > 0) {
      return { chapter: findChapter(i), verse: node.attrs.verse }
    }
    if (node.type.name === 'chapterHeading') break
  }

  return null
}


// ── Component ─────────────────────────────────────────

export function TiptapEditorB({
  verses, users, currentUserId,
  readOnly, footnoteMode, toolbarRef,
  selectedVerse, onSelectVerse, onCursorVerseChange,
  onEditVerse,
  onAddFootnote, onEditFootnote, onEditSectionHeader,
  onComment, onDirtyChange, onFocusChange, onOpenSidebar,
}: Props) {
  const footnoteModeRef = useRef<FootnoteMode>(footnoteMode)
  footnoteModeRef.current = footnoteMode

  const versesRef = useRef(verses)
  versesRef.current = verses
  const justSavedRef = useRef(false)

  const DecoExt = useMemo(() => {
    return Extension.create({
      name: 'decoB',
      addProseMirrorPlugins: () => [makeDecoPlugin(versesRef)],
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep editor always editable so clicks/selection work for all roles.
  // Block content changes when readOnly via filterTransaction.
  const readOnlyRef = useRef(readOnly)
  readOnlyRef.current = readOnly

  const ReadOnlyGuard = useMemo(() => {
    return Extension.create({
      name: 'readOnlyGuard',
      addProseMirrorPlugins() {
        return [
          new Plugin({
            filterTransaction(tr) {
              if (readOnlyRef.current && tr.docChanged) return false
              return true
            },
            appendTransaction(_trs, oldState, newState) {
              // Restore footnoteSeparators if any were deleted
              if (footnoteModeRef.current !== 'endOfChapter') return null
              let oldCount = 0, newCount = 0
              oldState.doc.forEach(n => { if (n.type.name === 'footnoteSeparator') oldCount++ })
              newState.doc.forEach(n => { if (n.type.name === 'footnoteSeparator') newCount++ })
              if (newCount >= oldCount) return null
              // Re-insert missing separators before each chapter's footnote section
              // Simple approach: append one at the end of the doc
              const { tr, schema } = newState
              const missing = oldCount - newCount
              for (let i = 0; i < missing; i++) {
                tr.insert(tr.doc.content.size, schema.nodes.footnoteSeparator.create())
              }
              return tr
            },
          }),
        ]
      },
    })
  }, [])

  const HeadingAutoSwap = useMemo(() => {
    const LUKU_RE = /^Luku\s+(\d+)$/
    return Extension.create({
      name: 'headingAutoSwap',
      addProseMirrorPlugins() {
        return [
          new Plugin({
            appendTransaction(_trs, _oldState, newState) {
              const { doc, schema, tr } = newState
              let changed = false
              doc.forEach((node, pos) => {
                const text = node.textContent.trim()
                if (node.type.name === 'sectionHeader') {
                  const m = text.match(LUKU_RE)
                  if (m) {
                    const chapter = parseInt(m[1], 10)
                    tr.setNodeMarkup(pos, schema.nodes.chapterHeading, { chapter })
                    changed = true
                  }
                } else if (node.type.name === 'chapterHeading') {
                  if (!LUKU_RE.test(text)) {
                    // Find the verse attr by looking at the next verse paragraph
                    let verse = 0
                    const nextPos = pos + node.nodeSize
                    if (nextPos < doc.content.size) {
                      const next = doc.nodeAt(nextPos)
                      if (next?.type.name === 'paragraph') {
                        const { verseNum } = parseVersePrefix(next.textContent)
                        if (verseNum !== null) verse = verseNum
                      }
                    }
                    tr.setNodeMarkup(pos, schema.nodes.sectionHeader, { verse })
                    changed = true
                  }
                }
              })
              return changed ? tr : null
            },
          }),
        ]
      },
    })
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, codeBlock: false, blockquote: false,
        bulletList: false, orderedList: false, listItem: false,
        horizontalRule: false,
      }),
      SectionHeader,
      FootnoteBlock,
      FootnoteSeparator,
      ChapterHeading,
      AnnotationBlock,
      ReadOnlyGuard,
      HeadingAutoSwap,
      DecoExt,
    ],
    content: buildContent(verses, footnoteMode),
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[200px] font-serif text-base leading-7 text-stone-800',
      },
      handlePaste(view, event) {
        if (readOnlyRef.current) return true // block paste
        const text = event.clipboardData?.getData('text/plain')
        if (!text) return false

        const { schema } = view.state

        // Try full DOCX document paste first
        const docx = parseDocxPaste(text)
        if (docx) {
          const nodes: any[] = []
          const crossRefsByChapter = new Map<number, Map<number, string>>()

          // First pass: collect cross-refs
          for (const n of docx) {
            if (n.type === 'crossRef' && n.chapter && n.verse) {
              if (!crossRefsByChapter.has(n.chapter)) crossRefsByChapter.set(n.chapter, new Map())
              crossRefsByChapter.get(n.chapter)!.set(n.verse, n.text)
            }
          }

          // Second pass: build nodes per chapter
          let currentCh = 0
          const chapterFootnotes: any[] = []

          function flushChapterFootnotes() {
            // Append cross-refs for completed chapter, then all footnotes
            const refs = crossRefsByChapter.get(currentCh)
            if (refs) {
              for (const [v, refText] of refs) {
                chapterFootnotes.push(schema.nodes.footnoteBlock.create({ verse: v }, [schema.text(`${v} ${refText}`)]))
              }
            }
            if (chapterFootnotes.length > 0) {
              nodes.push(schema.nodes.footnoteSeparator.create())
              nodes.push(...chapterFootnotes.splice(0))
            }
          }

          const storeVerses = versesRef.current ?? []

          for (const n of docx) {
            if (n.type === 'crossRef') continue // handled above

            if (n.type === 'chapterHeading') {
              if (currentCh > 0) flushChapterFootnotes()
              currentCh = n.chapter!
              nodes.push(schema.nodes.chapterHeading.create({ chapter: currentCh }, [schema.text(`Luku ${currentCh}`)]))
              continue
            }

            if (n.type === 'sectionHeader') {
              nodes.push(schema.nodes.sectionHeader.create({ verse: n.verse ?? 0 }, [schema.text(n.text)]))
              continue
            }

            if (n.type === 'verse') {
              nodes.push(schema.nodes.paragraph.create(null, [schema.text(`${n.verse} ${n.text}`)]))
              continue
            }

            if (n.type === 'base') {
              // Base text from DOCX (the first of a duplicate pair).
              // Drop it if it matches the store's baseText; keep as annotation if it differs.
              const sv = storeVerses.find(v => v.chapter === currentCh && v.number === n.verse)
              if (!sv || sv.baseText.trim() === n.text.trim()) continue
              nodes.push(schema.nodes.annotationBlock.create({ verse: n.verse ?? 0 }, [schema.text(n.text)]))
              continue
            }

            if (n.type === 'variant') {
              nodes.push(schema.nodes.annotationBlock.create({ verse: n.verse ?? 0 }, [schema.text(n.text)]))
              continue
            }

            if (n.type === 'footnote') {
              chapterFootnotes.push(schema.nodes.footnoteBlock.create({ verse: n.verse ?? 0 }, [schema.text(n.text)]))
              continue
            }
          }
          flushChapterFootnotes()

          // Full document paste — replace entire editor content
          const tr = view.state.tr
          tr.replaceWith(0, tr.doc.content.size, nodes)
          view.dispatch(tr)
          return true
        }

        // Fallback: simple verse line parsing
        if (footnoteModeRef.current === 'endOfChapter') {
          const parsed = parseVerseLinesEndOfChapter(text)
          if (!parsed) return false

          const nodes: any[] = []
          const fnNodes: any[] = []

          for (const v of parsed) {
            const lines = v.text.split('\n')
            for (let i = 0; i < lines.length; i++) {
              nodes.push(schema.nodes.paragraph.create(null, [
                schema.text(i === 0 ? `${v.number} ${lines[i]}` : lines[i]),
              ]))
            }
            for (const fn of v.footnotes) {
              fnNodes.push(schema.nodes.footnoteBlock.create(
                { verse: v.number },
                [schema.text(`${fn.marker} ${fn.text}`)]
              ))
            }
          }

          if (fnNodes.length > 0) {
            nodes.push(schema.nodes.footnoteSeparator.create())
            nodes.push(...fnNodes)
          }

          view.dispatch(view.state.tr.replaceSelection(new Slice(Fragment.from(nodes), 0, 0)))
          return true
        }

        // Inline mode: existing behavior
        const parsed = parseVerseLines(text)
        if (!parsed) return false

        const nodes = parsed.flatMap(v => {
          const lines = v.text.split('\n')
          return lines.map((line, i) =>
            schema.nodes.paragraph.create(null, [
              schema.text(i === 0 ? `${v.number} ${line}` : line),
            ])
          )
        })
        view.dispatch(view.state.tr.replaceSelection(new Slice(Fragment.from(nodes), 0, 0)))
        return true
      },
      handleClick(view) {
        const loc = verseAtCursor({ state: view.state })
        if (loc !== null) onSelectVerse(loc.verse)
        return false
      },
    },
  })
  const suppressDirty = useRef(false)
  useEffect(() => {
    if (editor && !editor.isFocused) {
      if (justSavedRef.current) {
        justSavedRef.current = false
        return // skip — editor is already the source of truth
      }
      suppressDirty.current = true
      editor.commands.setContent(buildContent(verses, footnoteMode))
      onDirtyChange?.(false)
      requestAnimationFrame(() => { suppressDirty.current = false })
    }
  }, [editor, verses, footnoteMode, onDirtyChange])

  // Signal dirty state only on user-initiated content changes
  useEffect(() => {
    if (!editor) return
    const handler = () => {
      if (!suppressDirty.current) {
        onDirtyChange?.(true)
      }
    }
    editor.on('update', handler)
    return () => { editor.off('update', handler) }
  }, [editor, onDirtyChange])

  // ── Cursor-following verse detection ────────────
  useEffect(() => {
    if (!editor || !onCursorVerseChange) return
    let lastKey: string | null = null
    const handler = () => {
      const loc = verseAtCursor(editor)
      if (loc !== null) {
        const key = `${loc.chapter}:${loc.verse}`
        if (key !== lastKey) {
          lastKey = key
          onCursorVerseChange(loc.chapter, loc.verse)
        }
      }
    }
    editor.on('selectionUpdate', handler)
    return () => { editor.off('selectionUpdate', handler) }
  }, [editor, onCursorVerseChange])

  // ── Blur → save changes ──────────────────────────

  const handleBlur = useCallback(() => {
    if (!editor || readOnly) return
    const data = extractData(editor.state.doc, footnoteMode)

    for (const ev of data.verses) {
      const verse = verses.find(v => v.chapter === ev.chapter && v.number === ev.number)
      if (verse && ev.text !== verse.text) {
        onEditVerse(ev.chapter, ev.number, ev.text)
      }
    }

    for (const fn of data.footnotes) {
      const verse = verses.find(v => v.chapter === fn.chapter && v.number === fn.verse)
      if (!verse?.footnotes) continue
      const orig = verse.footnotes.find(f => f.marker === fn.marker)
      if (orig && fn.text !== orig.text) {
        onEditFootnote(fn.chapter, fn.verse, fn.marker, fn.text)
      }
    }

    for (const sh of data.sectionHeaders) {
      const verse = verses.find(v => v.chapter === sh.chapter && v.number === sh.verse)
      if (verse) {
        const oldH = verse.sectionHeader ?? ''
        if (sh.text !== oldH) {
          onEditSectionHeader(sh.chapter, sh.verse, sh.text)
        }
      }
    }

    onDirtyChange?.(false)
    justSavedRef.current = true
  }, [editor, verses, readOnly, footnoteMode, onEditVerse, onEditFootnote, onEditSectionHeader, onDirtyChange])


  // ── Toolbar state ────────────────────────────────

  const [, setTick] = useState(0)
  useEffect(() => {
    if (!editor) return
    const update = () => setTick(t => t + 1)
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    return () => { editor.off('selectionUpdate', update); editor.off('transaction', update) }
  }, [editor])

  type BlockType = 'paragraph' | 'sectionHeader' | 'footnoteBlock' | 'annotationBlock'

  const activeType: BlockType =
    editor?.isActive('sectionHeader') ? 'sectionHeader'
    : editor?.isActive('footnoteBlock') ? 'footnoteBlock'
    : editor?.isActive('annotationBlock') ? 'annotationBlock'
    : 'paragraph'

  const cursorLoc = verseAtCursor(editor)

  const setType = useCallback((type: BlockType) => {
    if (!editor || type === activeType) return
    const attrs = type !== 'paragraph' ? { verse: cursorLoc?.verse ?? 0 } : undefined
    editor.chain().focus().setNode(type, attrs).run()
  }, [editor, activeType, cursorLoc])

  // ── Info button positioning (narrow layout — follows mouse hover) ──

  const editorRef = useRef<HTMLDivElement>(null)
  const hoverZoneRef = useRef<HTMLDivElement>(null)
  const [infoButtonPos, setInfoButtonPos] = useState<{ top: number; verse: number } | null>(null)

  useEffect(() => {
    if (!editor || !onOpenSidebar) return
    const hoverZone = hoverZoneRef.current
    const container = editorRef.current
    if (!hoverZone || !container) return

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Walk up to find the block-level node rendered by ProseMirror
      const block = target.closest<HTMLElement>('p, h3[data-section], p[data-footnote-block], p[data-annotation]')
      if (!block || !container.contains(block)) return
      // Resolve the ProseMirror position from the DOM node
      const pos = editor.view.posAtDOM(block, 0)
      const resolved = editor.state.doc.resolve(pos)
      const node = resolved.parent

      // Determine verse number from the block
      let verseNum: number | null = null
      if (node.type.name === 'paragraph') {
        verseNum = parseVersePrefix(node.textContent).verseNum
      } else if (node.attrs?.verse > 0) {
        verseNum = node.attrs.verse
      }
      // For continuation paragraphs, walk back
      if (verseNum === null) {
        const idx = resolved.index(0)
        for (let i = idx - 1; i >= 0; i--) {
          const prev = editor.state.doc.child(i)
          if (prev.type.name === 'paragraph') {
            const v = parseVersePrefix(prev.textContent).verseNum
            if (v !== null) { verseNum = v; break }
          }
          if (prev.type.name === 'footnoteBlock' && prev.attrs.verse > 0) {
            verseNum = prev.attrs.verse; break
          }
        }
      }

      if (verseNum === null) return

      const blockRect = block.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      setInfoButtonPos({ top: blockRect.top - containerRect.top, verse: verseNum })
    }

    const handleMouseLeave = () => setInfoButtonPos(null)

    hoverZone.addEventListener('mousemove', handleMouseMove)
    hoverZone.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      hoverZone.removeEventListener('mousemove', handleMouseMove)
      hoverZone.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [editor, onOpenSidebar])

  // ── Comment popup on text selection ─────────────

  const popupRef = useRef<HTMLDivElement>(null)
  const [commentPopup, setCommentPopup] = useState<{ top: number; left: number } | null>(null)
  const [bubbleComment, setBubbleComment] = useState('')
  const [highlightRange, setHighlightRange] = useState<{ from: number; to: number } | null>(null)

  // Decoration to keep the selection visually highlighted while the popup is open
  useEffect(() => {
    if (!editor) return
    const key = new PluginKey('commentHighlight')
    const plugin = new Plugin({
      key,
      state: {
        init() { return DecorationSet.empty },
        apply() {
          if (!highlightRange) return DecorationSet.empty
          return DecorationSet.create(editor.state.doc, [
            Decoration.inline(highlightRange.from, highlightRange.to, {
              style: 'background: rgb(191 219 254); border-radius: 2px;',
            }),
          ])
        },
      },
      props: {
        decorations(state) { return this.getState(state) },
      },
    })
    editor.registerPlugin(plugin)
    return () => { editor.unregisterPlugin(key) }
  }, [editor, highlightRange])

  useEffect(() => {
    if (!onComment) return

    function onMouseUp() {
      requestAnimationFrame(() => {
        if (!editor || !editorRef.current) return
        const { from, to } = editor.state.selection
        if (from === to) return
        const text = editor.state.doc.textBetween(from, to, ' ').trim()
        if (!text) return

        const sel = window.getSelection()
        if (!sel || sel.isCollapsed) return
        const range = sel.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        const containerRect = editorRef.current.getBoundingClientRect()

        setBubbleComment('')
        setHighlightRange({ from, to })
        setCommentPopup({
          top: rect.bottom - containerRect.top + 4,
          left: rect.left - containerRect.left + rect.width / 2,
        })
      })
    }

    function onMouseDown(e: MouseEvent) {
      if (popupRef.current?.contains(e.target as Node)) return
      setCommentPopup(null)
      setBubbleComment('')
      setHighlightRange(null)
    }

    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mousedown', onMouseDown)
    return () => {
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('mousedown', onMouseDown)
    }
  }, [onComment, editor])

  const handleSubmitComment = useCallback(() => {
    if (!editor || !onComment || !bubbleComment.trim()) return
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, ' ')
    const loc = verseAtCursor(editor)
    if (loc !== null) {
      onComment(loc.chapter, loc.verse, selectedText, bubbleComment.trim())
      setBubbleComment('')
      setCommentPopup(null)
      setHighlightRange(null)
      window.getSelection()?.removeAllRanges()
    }
  }, [editor, onComment, bubbleComment])

  // ── Render ───────────────────────────────────────

  const toolbar = !readOnly ? (
    <div className="flex items-center gap-2">
      <div className="inline-flex rounded-md border border-stone-200 bg-stone-50 p-0.5">
        <SegmentBtn active={activeType === 'paragraph'} onClick={() => setType('paragraph')} label="Jae" />
        <SegmentBtn active={activeType === 'sectionHeader'} onClick={() => setType('sectionHeader')} label="Väliotsikko" />
        {footnoteMode === 'inline' && (
          <SegmentBtn active={activeType === 'footnoteBlock'} onClick={() => setType('footnoteBlock')} label="Alaviite" />
        )}
        <SegmentBtn active={activeType === 'annotationBlock'} onClick={() => setType('annotationBlock')} label="Merkintä" />
      </div>
    </div>
  ) : null

  return (
    <div ref={hoverZoneRef} className="relative" style={{ marginRight: '-2.5rem', paddingRight: '2.5rem' }}>
    <div ref={editorRef} onFocus={() => onFocusChange?.(true)} onBlur={() => { handleBlur(); onFocusChange?.(false) }} className="relative">
      {toolbar && toolbarRef?.current
        ? createPortal(toolbar, toolbarRef.current)
        : toolbar && <div className="flex items-center mb-3 pb-2 border-b border-stone-200">{toolbar}</div>
      }
      <EditorContent editor={editor} />
      {infoButtonPos && onOpenSidebar && (
        <button
          type="button"
          className="absolute z-10 editor-md:hidden flex items-center justify-center w-7 h-7 rounded-full bg-stone-100 border border-stone-300 text-stone-500 hover:bg-stone-200 hover:text-stone-700 transition-colors shadow-sm"
          style={{ top: infoButtonPos.top, right: '-2.25rem' }}
          onClick={() => onOpenSidebar(infoButtonPos.verse)}
          aria-label="Näytä jakeen tiedot"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="6.5" />
            <line x1="8" y1="7" x2="8" y2="11.5" />
            <circle cx="8" cy="5" r="0.5" fill="currentColor" stroke="none" />
          </svg>
        </button>
      )}
      {commentPopup && onComment && (
        <div
          ref={popupRef}
          className="absolute z-20"
          style={{
            top: commentPopup.top,
            left: commentPopup.left,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="bg-white rounded-lg shadow-lg border border-stone-200 p-3 w-72">
            <textarea
              value={bubbleComment}
              onChange={e => setBubbleComment(e.target.value)}
              placeholder="Kirjoita kommentti..."
              className="w-full text-sm border border-stone-200 rounded px-2.5 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-stone-400"
              rows={2}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmitComment()
                if (e.key === 'Escape') { setCommentPopup(null); setBubbleComment(''); setHighlightRange(null) }
              }}
            />
            <button
              onMouseDown={e => e.preventDefault()}
              onClick={handleSubmitComment}
              disabled={!bubbleComment.trim()}
              className="mt-2 w-full text-sm rounded-md bg-stone-800 text-white px-3 py-1.5 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Kommentoi
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}

function SegmentBtn({ active, onClick, label, disabled }: { active: boolean; onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1 text-xs rounded transition-colors ${
        disabled
          ? 'text-stone-300 cursor-not-allowed'
          : active
            ? 'bg-white text-stone-800 font-medium shadow-sm'
            : 'text-stone-400 hover:text-stone-600'
      }`}
    >
      {label}
    </button>
  )
}
