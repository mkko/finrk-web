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

// ── Props ─────────────────────────────────────────────

interface Props {
  verses: Verse[]
  users: User[]
  currentUserId: string
  readOnly: boolean
  toolbarRef?: RefObject<HTMLDivElement | null>
  selectedVerse: number | null
  onSelectVerse: (num: number) => void
  onEditVerse: (verseNumber: number, newText: string) => void
  onAddFootnote: (verseNumber: number, text: string) => void
  onEditFootnote: (verseNumber: number, marker: string, newText: string) => void
  onEditSectionHeader: (verseNumber: number, newText: string) => void
  onCursorVerseChange?: (verseNumber: number) => void
  onComment?: (verseNumber: number, selectedText: string, commentText: string) => void
  onDirtyChange?: (dirty: boolean) => void
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

// ── Decorations ───────────────────────────────────────
// Verse number superscript styling + collapsible original-text widget.

function createOriginalWidget(verseNum: number, text: string, modified: boolean): HTMLElement {
  const details = document.createElement('details')
  details.contentEditable = 'false'
  details.className = modified
    ? 'select-none mb-0.5'
    : 'select-none opacity-0 pointer-events-none mb-0.5'

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
  const knownVerses = new Set(verses.map(v => v.number))
  const seen = new Set<number>()

  doc.descendants((node: any, pos: number) => {
    // Only decorate paragraphs (verse text), not headers or footnotes
    if (node.type.name !== 'paragraph') return node.type.name === 'doc' ? undefined : false

    const text = node.textContent
    const { verseNum, body } = parseVersePrefix(text)
    if (verseNum === null) return false

    // Style the verse-number prefix
    const numStr = `${verseNum}`
    const firstChild = node.firstChild
    if (firstChild?.isText) {
      const m = (firstChild.text as string).match(/^(\d+)\s/)
      if (m) {
        const from = pos + 1
        const to = from + m[0].length
        const isDup = seen.has(verseNum)
        const isUnk = !knownVerses.has(verseNum)
        const cls = `text-xs font-sans ${isDup ? 'text-orange-500' : isUnk ? 'text-red-400' : 'text-stone-400'}`
        decorations.push(Decoration.inline(from, to, {
          class: cls,
          style: 'vertical-align:super;font-size:0.65em;line-height:0;',
        }))
      }
    }

    seen.add(verseNum)

    // Original-text widget
    const verse = verses.find(v => v.number === verseNum)
    if (verse) {
      const modified = body.trim() !== verse.baseText
      decorations.push(
        Decoration.widget(pos, () => createOriginalWidget(verseNum, verse.baseText, modified), {
          side: -1,
          key: `orig-${verseNum}-${modified ? 'm' : 'u'}`,
        })
      )
    }

    return false
  })

  return DecorationSet.create(doc, decorations)
}

// ── Build editor content from verse data ──────────────

function buildContent(verses: Verse[]) {
  const content: any[] = []

  for (const verse of verses) {
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
      } else if (line.trim()) {
        content.push({
          type: 'paragraph',
          content: [{ type: 'text', text: line }],
        })
      }
    }

    // Footnotes as separate blocks
    if (verse.footnotes) {
      for (const fn of verse.footnotes) {
        content.push({
          type: 'footnoteBlock',
          attrs: { verse: verse.number },
          content: [{ type: 'text', text: `${fn.marker} ${fn.text}` }],
        })
      }
    }
  }

  if (content.length === 0) {
    content.push({ type: 'paragraph', content: [{ type: 'text', text: ' ' }] })
  }

  return { type: 'doc', content }
}

// ── Extract data from editor document ─────────────────

interface ExtractedData {
  verses: Map<number, string>
  footnotes: { verse: number; marker: string; text: string }[]
  sectionHeaders: Map<number, string>
}

function extractData(doc: any): ExtractedData {
  const verses = new Map<number, string>()
  const footnotes: { verse: number; marker: string; text: string }[] = []
  const sectionHeaders = new Map<number, string>()
  let lastVerseNum: number | null = null

  doc.descendants((node: any) => {
    if (node.type.name === 'sectionHeader') {
      const v = node.attrs.verse
      if (v > 0) sectionHeaders.set(v, node.textContent.trim())
      return false
    }

    if (node.type.name === 'footnoteBlock') {
      const v = node.attrs.verse || lastVerseNum
      if (v) {
        const raw = node.textContent.trim()
        const m = raw.match(/^(\S+)\s+(.*)/)
        if (m) {
          footnotes.push({ verse: v, marker: m[1], text: m[2] })
        } else if (raw) {
          footnotes.push({ verse: v, marker: `${v}`, text: raw })
        }
      }
      return false
    }

    // Annotations are internal-only, not part of published content
    if (node.type.name === 'annotationBlock') return false

    if (node.type.name !== 'paragraph') return

    const text = node.textContent
    const { verseNum, body } = parseVersePrefix(text)

    if (verseNum !== null) {
      verses.set(verseNum, body.trim())
      lastVerseNum = verseNum
    } else if (lastVerseNum !== null) {
      // Continuation paragraph
      const trimmed = text.trim()
      if (trimmed) {
        const existing = verses.get(lastVerseNum) ?? ''
        verses.set(lastVerseNum, existing + '\n' + trimmed)
      }
    }

    return false
  })

  return { verses, footnotes, sectionHeaders }
}

// ── Find verse number at cursor ───────────────────────

function verseAtCursor(editor: any): number | null {
  if (!editor) return null
  const { $from } = editor.state.selection
  const parent = $from.parent

  // SectionHeader, FootnoteBlock, AnnotationBlock carry a verse attr
  if (parent.type.name === 'sectionHeader' || parent.type.name === 'footnoteBlock' || parent.type.name === 'annotationBlock') {
    return parent.attrs.verse || null
  }

  // Paragraph: check text prefix
  if (parent.type.name === 'paragraph') {
    const { verseNum } = parseVersePrefix(parent.textContent)
    if (verseNum !== null) return verseNum
  }

  // Walk backwards for continuation paragraphs
  const idx = $from.index(0)
  const doc = editor.state.doc
  for (let i = idx - 1; i >= 0; i--) {
    const node = doc.child(i)
    if (node.type.name === 'paragraph') {
      const { verseNum } = parseVersePrefix(node.textContent)
      if (verseNum !== null) return verseNum
    }
    if (node.type.name === 'footnoteBlock' && node.attrs.verse > 0) {
      return node.attrs.verse
    }
  }

  return null
}

// ── Parse pasted verse lines ──────────────────────────

function parseVerseLines(text: string): { number: number; text: string }[] | null {
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

// ── Component ─────────────────────────────────────────

export function TiptapEditorB({
  verses, users, currentUserId,
  readOnly, toolbarRef,
  selectedVerse, onSelectVerse, onCursorVerseChange,
  onEditVerse,
  onAddFootnote, onEditFootnote, onEditSectionHeader,
  onComment, onDirtyChange, onOpenSidebar,
}: Props) {
  const versesRef = useRef(verses)
  versesRef.current = verses

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
      AnnotationBlock,
      ReadOnlyGuard,
      DecoExt,
    ],
    content: buildContent(verses),
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[200px] font-serif text-base leading-7 text-stone-800',
      },
      handlePaste(view, event) {
        if (readOnlyRef.current) return true // block paste
        const text = event.clipboardData?.getData('text/plain')
        if (!text) return false
        const parsed = parseVerseLines(text)
        if (!parsed) return false

        const { schema } = view.state
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
        const verse = verseAtCursor({ state: view.state })
        if (verse !== null) onSelectVerse(verse)
        return false
      },
    },
  })
  const suppressDirty = useRef(false)
  useEffect(() => {
    if (editor && !editor.isFocused) {
      suppressDirty.current = true
      editor.commands.setContent(buildContent(verses))
      onDirtyChange?.(false)
      // Allow the update event to fire first, then unsuppress
      requestAnimationFrame(() => { suppressDirty.current = false })
    }
  }, [editor, verses, onDirtyChange])

  // Signal dirty state only on user-initiated content changes
  useEffect(() => {
    if (!editor || !onDirtyChange) return
    const handler = () => { if (!suppressDirty.current) onDirtyChange(true) }
    editor.on('update', handler)
    return () => { editor.off('update', handler) }
  }, [editor, onDirtyChange])

  // ── Cursor-following verse detection ────────────
  useEffect(() => {
    if (!editor || !onCursorVerseChange) return
    let lastVerse: number | null = null
    const handler = () => {
      const v = verseAtCursor(editor)
      if (v !== null && v !== lastVerse) {
        lastVerse = v
        onCursorVerseChange(v)
      }
    }
    editor.on('selectionUpdate', handler)
    return () => { editor.off('selectionUpdate', handler) }
  }, [editor, onCursorVerseChange])

  // ── Blur → save changes ──────────────────────────

  const handleBlur = useCallback(() => {
    if (!editor || readOnly) return
    const data = extractData(editor.state.doc)

    for (const verse of verses) {
      const newText = data.verses.get(verse.number)
      if (newText !== undefined && newText !== verse.text) {
        onEditVerse(verse.number, newText)
      }
    }

    for (const fn of data.footnotes) {
      const verse = verses.find(v => v.number === fn.verse)
      if (!verse?.footnotes) continue
      const orig = verse.footnotes.find(f => f.marker === fn.marker)
      if (orig && fn.text !== orig.text) {
        onEditFootnote(fn.verse, fn.marker, fn.text)
      }
    }

    for (const verse of verses) {
      const newH = data.sectionHeaders.get(verse.number)
      const oldH = verse.sectionHeader ?? ''
      if (newH !== undefined && newH !== oldH) {
        onEditSectionHeader(verse.number, newH)
      }
    }

    onDirtyChange?.(false)
  }, [editor, verses, readOnly, onEditVerse, onEditFootnote, onEditSectionHeader, onDirtyChange])

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

  const cursorVerse = verseAtCursor(editor)

  const setType = useCallback((type: BlockType) => {
    if (!editor || type === activeType) return
    const attrs = type !== 'paragraph' ? { verse: cursorVerse ?? 0 } : undefined
    editor.chain().focus().setNode(type, attrs).run()
  }, [editor, activeType, cursorVerse])

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
    const verse = verseAtCursor(editor)
    if (verse !== null) {
      onComment(verse, selectedText, bubbleComment.trim())
      setBubbleComment('')
      setCommentPopup(null)
      setHighlightRange(null)
      window.getSelection()?.removeAllRanges()
    }
  }, [editor, onComment, bubbleComment])

  // ── Render ───────────────────────────────────────

  const toolbar = !readOnly ? (
    <div className="inline-flex rounded-md border border-stone-200 bg-stone-50 p-0.5">
      <SegmentBtn active={activeType === 'paragraph'} onClick={() => setType('paragraph')} label="Jae" />
      <SegmentBtn active={activeType === 'sectionHeader'} onClick={() => setType('sectionHeader')} label="Väliotsikko" />
      <SegmentBtn active={activeType === 'footnoteBlock'} onClick={() => setType('footnoteBlock')} label="Alaviite" />
      <SegmentBtn active={activeType === 'annotationBlock'} onClick={() => setType('annotationBlock')} label="Merkintä" />
    </div>
  ) : null

  return (
    <div ref={hoverZoneRef} className="relative" style={{ marginRight: '-2.5rem', paddingRight: '2.5rem' }}>
    <div ref={editorRef} onBlur={handleBlur} className="relative">
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

function SegmentBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      className={`px-3 py-1 text-xs rounded transition-colors ${
        active
          ? 'bg-white text-stone-800 font-medium shadow-sm'
          : 'text-stone-400 hover:text-stone-600'
      }`}
    >
      {label}
    </button>
  )
}
