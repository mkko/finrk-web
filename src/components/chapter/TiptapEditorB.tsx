'use client'

/**
 * 1bb — Freeform editor with original-text reference for every verse.
 *
 * Each verse is a separate paragraph containing a verseMarker atom + text,
 * followed by inline footnotes (footnoteMarker + styled text).
 * A non-editable collapsible <details> widget sits before every verse,
 * showing the original (baseText).  No proposal blocks — this is a clean
 * editing surface with reference text always available.
 */

import { useEffect, useCallback, useRef, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Node as TiptapNode, Mark as TiptapMark, Extension, mergeAttributes, InputRule } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { Slice, Fragment } from '@tiptap/pm/model'
import { Verse, Proposal, User, proposalCoversVerse } from '@/lib/types'

interface Props {
  verses: Verse[]
  proposals: Proposal[]
  users: User[]
  currentUserId: string
  showProposals: boolean
  showReviewComments: boolean
  selectedVerse: number | null
  onSelectVerse: (num: number) => void
  onAddProposal: (proposal: {
    ranges: { verseStart: number; verseEnd: number; proposedText: string }[]
    rationale: string
    authorId: string
    status: 'luonnos'
  }) => void
  onEditFootnote: (verseNumber: number, marker: string, newText: string) => void
}

// ── Nodes ──────────────────────────────────────────────

const VerseMarker = TiptapNode.create({
  name: 'verseMarker',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return { number: { default: 0 } }
  },

  parseHTML() {
    return [{ tag: 'sup[data-vm]' }]
  },

  renderHTML({ node }) {
    return ['sup', {
      'data-vm': node.attrs.number,
      class: 'text-xs text-stone-400 font-sans mr-0.5 select-none',
      contenteditable: 'false',
    }, `${node.attrs.number}`]
  },

  addInputRules() {
    return [
      new InputRule({
        find: /^(\d+)\s$/,
        handler: ({ state, range, match }) => {
          const num = parseInt(match[1], 10)
          const $from = state.doc.resolve(range.from)
          // Only trigger at the very start of a paragraph with no existing verseMarker
          if ($from.parentOffset !== 0) return null
          const parent = $from.parent
          let hasMarker = false
          parent.forEach((child) => {
            if (child.type.name === 'verseMarker') hasMarker = true
          })
          if (hasMarker) return null

          const markerNode = this.type.create({ number: num })
          state.tr.replaceWith(range.from, range.to, markerNode)
        },
      }),
    ]
  },
})

const FootnoteMarker = TiptapNode.create({
  name: 'footnoteMarker',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: false,
  draggable: false,

  addAttributes() {
    return {
      marker: { default: '' },
      verse: { default: 0 },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-fnm]' }]
  },

  renderHTML({ node }) {
    return ['span', {
      'data-fnm': node.attrs.marker,
      'data-verse': node.attrs.verse,
      class: 'footnote-marker-wrap',
      contenteditable: 'false',
    },
      ['br'],
      ['sup', { class: 'text-[10px] text-stone-400 font-sans ml-6 select-none' }, node.attrs.marker],
      ['span', { class: 'text-[10px] text-stone-400 select-none' }, ' '],
    ]
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () => {
        const { $from } = this.editor.state.selection
        const nodeBefore = $from.nodeBefore
        if (nodeBefore?.type.name === 'footnoteMarker') {
          return true // block deletion
        }
        return false
      },
      Delete: () => {
        const { $from } = this.editor.state.selection
        const nodeAfter = $from.nodeAfter
        if (nodeAfter?.type.name === 'footnoteMarker') {
          return true // block deletion
        }
        return false
      },
    }
  },
})

const FootnoteMark = TiptapMark.create({
  name: 'footnote',

  parseHTML() {
    return [{ tag: 'span[data-fn-text]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, {
      'data-fn-text': '',
      class: 'text-sm text-stone-400 leading-relaxed',
    }), 0]
  },
})

const SectionHeader = TiptapNode.create({
  name: 'sectionHeader',
  group: 'block',
  content: 'text*',
  defining: true,
  selectable: false,
  parseHTML() { return [{ tag: 'h3[data-section]' }] },
  renderHTML() {
    return ['h3', {
      'data-section': '',
      class: 'font-serif text-base font-semibold text-stone-700 mt-6 mb-2',
      contenteditable: 'false',
    }, 0]
  },
})

// ── Original-text decorations (all verses, always) ─────

function createOriginalWidget(verseNum: number, text: string, modified: boolean): HTMLElement {
  const details = document.createElement('details')
  details.contentEditable = 'false'

  details.className = modified
    ? 'bg-amber-50/60 border border-amber-200/60 rounded px-2 py-0.5 text-sm my-0.5 select-none'
    : 'bg-amber-50/60 border border-amber-200/60 rounded px-2 py-0.5 text-sm my-0.5 select-none opacity-0 pointer-events-none'

  const summary = document.createElement('summary')
  summary.className = 'text-[10px] text-stone-400 cursor-pointer leading-tight'
  summary.textContent = `Alkuperainen jae ${verseNum}`
  details.appendChild(summary)

  const content = document.createElement('div')
  content.className = 'text-stone-500 font-serif text-sm leading-snug mt-0.5'
  content.textContent = text
  details.appendChild(content)

  return details
}

const originalTextKey = new PluginKey('originalTextB')

function makeOriginalTextExtension(versesRef: React.RefObject<Verse[]>) {
  return Extension.create({
    name: 'originalTextB',
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: originalTextKey,
          state: {
            init(_config, state) {
              return buildDecos(state.doc, versesRef.current ?? [])
            },
            apply(tr, prev) {
              if (!tr.docChanged) return prev
              return buildDecos(tr.doc, versesRef.current ?? [])
            },
          },
          props: {
            decorations(state) {
              return this.getState(state) ?? DecorationSet.empty
            },
          },
        }),
      ]
    },
  })
}

function extractVerseTextFromParagraph(node: any): { verseNum: number | null; verseText: string } {
  let verseNum: number | null = null
  let verseText = ''
  let hitFootnote = false

  node.forEach((child: any) => {
    if (child.type.name === 'verseMarker' && verseNum === null) {
      verseNum = child.attrs.number
    } else if (child.type.name === 'footnoteMarker') {
      hitFootnote = true
    } else if (child.isText && !hitFootnote) {
      verseText += child.text
    }
  })

  return { verseNum, verseText }
}

function buildDecos(doc: any, verses: Verse[]): DecorationSet {
  const widgets: Decoration[] = []

  doc.descendants((node: any, pos: number) => {
    if (node.type.name === 'paragraph') {
      const { verseNum, verseText } = extractVerseTextFromParagraph(node)

      if (verseNum !== null) {
        const verse = verses.find(v => v.number === verseNum)
        if (verse) {
          const modified = verseText.trim() !== verse.baseText

          widgets.push(
            Decoration.widget(pos, () => createOriginalWidget(verseNum!, verse.baseText, modified), {
              side: -1,
              key: `orig-${verseNum}-${modified ? 'm' : 'u'}`,
            }),
          )
        }
      }
      return false
    }
  })

  return DecorationSet.create(doc, widgets)
}

// ── Content builder ────────────────────────────────────

function buildContent(verses: Verse[]) {
  const content: any[] = []

  for (const verse of verses) {
    if (verse.sectionHeader) {
      content.push({
        type: 'sectionHeader',
        content: [{ type: 'text', text: verse.sectionHeader }],
      })
    }

    const paragraphContent: any[] = [
      { type: 'verseMarker', attrs: { number: verse.number } },
      { type: 'text', text: verse.text || ' ' },
    ]

    if (verse.footnotes) {
      for (const fn of verse.footnotes) {
        paragraphContent.push({
          type: 'footnoteMarker',
          attrs: { marker: fn.marker, verse: verse.number },
        })
        paragraphContent.push({
          type: 'text',
          text: fn.text,
          marks: [{ type: 'footnote' }],
        })
      }
    }

    content.push({
      type: 'paragraph',
      content: paragraphContent,
    })
  }

  if (content.length === 0) {
    content.push({ type: 'paragraph', content: [{ type: 'text', text: ' ' }] })
  }

  return { type: 'doc', content }
}

// ── Extract verse texts and footnotes ──────────────────

interface FootnoteData {
  verse: number
  marker: string
  text: string
}

interface ExtractedData {
  verses: Map<number, string>
  footnotes: FootnoteData[]
}

function extractData(doc: any): ExtractedData {
  const verses = new Map<number, string>()
  const footnotes: FootnoteData[] = []

  doc.descendants((node: any) => {
    if (node.type.name !== 'paragraph') return

    let verseNum: number | null = null
    let verseText = ''
    let currentFootnoteMarker: string | null = null
    let currentFootnoteVerse: number | null = null
    let currentFootnoteText = ''

    const flushFootnote = () => {
      if (currentFootnoteMarker !== null && currentFootnoteVerse !== null) {
        footnotes.push({
          verse: currentFootnoteVerse,
          marker: currentFootnoteMarker,
          text: currentFootnoteText.trim(),
        })
      }
    }

    node.forEach((child: any) => {
      if (child.type.name === 'verseMarker') {
        if (verseNum === null) verseNum = child.attrs.number
      } else if (child.type.name === 'footnoteMarker') {
        flushFootnote()
        currentFootnoteMarker = child.attrs.marker
        currentFootnoteVerse = child.attrs.verse
        currentFootnoteText = ''
      } else if (child.isText) {
        if (currentFootnoteMarker !== null) {
          currentFootnoteText += child.text
        } else {
          verseText += child.text
        }
      }
    })

    flushFootnote()

    if (verseNum !== null) verses.set(verseNum, verseText.trim())
  })

  return { verses, footnotes }
}

// ── Helpers ────────────────────────────────────────────

function verseAtPos(state: any): number | null {
  const { $from } = state.selection
  const parent = $from.parent
  if (parent.type.name !== 'paragraph') return null

  let verseNum: number | null = null
  parent.forEach((child: any) => {
    if (child.type.name === 'verseMarker' && verseNum === null) {
      verseNum = child.attrs.number
    }
  })
  return verseNum
}

// ── Parse verse lines from plain text ──────────────────

function parseVerseLines(text: string): { number: number; text: string }[] | null {
  const lines = text.split('\n').filter(l => l.trim())
  const parsed: { number: number; text: string }[] = []
  for (const line of lines) {
    const match = line.match(/^(\d+)\s+(.+)/)
    if (match) {
      parsed.push({ number: parseInt(match[1], 10), text: match[2].trim() })
    } else if (parsed.length > 0) {
      // Continuation line — append to previous verse
      parsed[parsed.length - 1].text += ' ' + line.trim()
    }
  }
  return parsed.length > 0 ? parsed : null
}

// ── Component ──────────────────────────────────────────

export function TiptapEditorB({
  verses, proposals, users, currentUserId,
  showProposals, showReviewComments,
  selectedVerse, onSelectVerse, onAddProposal,
  onEditFootnote,
}: Props) {
  const versesRef = useRef(verses)
  versesRef.current = verses

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const OriginalText = useMemo(() => makeOriginalTextExtension(versesRef), [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, codeBlock: false, blockquote: false,
        bulletList: false, orderedList: false, listItem: false,
        horizontalRule: false,
      }),
      VerseMarker,
      FootnoteMarker,
      FootnoteMark,
      SectionHeader,
      OriginalText,
    ],
    content: buildContent(verses),
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[200px] font-serif text-base leading-7 text-stone-800',
      },
      handlePaste(view, event) {
        const text = event.clipboardData?.getData('text/plain')
        if (!text) return false

        const parsed = parseVerseLines(text)
        if (!parsed) return false

        const { schema } = view.state
        const nodes = parsed.map(v =>
          schema.nodes.paragraph.create(null, [
            schema.nodes.verseMarker.create({ number: v.number }),
            schema.text(v.text),
          ])
        )
        const slice = new Slice(Fragment.from(nodes), 0, 0)
        view.dispatch(view.state.tr.replaceSelection(slice))
        return true
      },
      handleClick(view) {
        const verse = verseAtPos(view.state)
        if (verse !== null) onSelectVerse(verse)
        return false
      },
    },
  })

  useEffect(() => {
    if (!editor || editor.isFocused) return
    editor.commands.setContent(buildContent(verses))
  }, [editor, verses])

  const handleBlur = useCallback(() => {
    if (!editor) return
    const { verses: newTexts, footnotes: newFootnotes } = extractData(editor.state.doc)

    // Check verse text changes → create proposals
    for (const verse of verses) {
      const newText = newTexts.get(verse.number)
      if (newText !== undefined && newText !== verse.text) {
        onAddProposal({
          ranges: [{ verseStart: verse.number, verseEnd: verse.number, proposedText: newText }],
          rationale: '',
          authorId: currentUserId,
          status: 'luonnos',
        })
      }
    }

    // Check footnote text changes → direct save
    for (const fn of newFootnotes) {
      const verse = verses.find(v => v.number === fn.verse)
      if (!verse?.footnotes) continue
      const origFn = verse.footnotes.find(f => f.marker === fn.marker)
      if (origFn && fn.text !== origFn.text) {
        onEditFootnote(fn.verse, fn.marker, fn.text)
      }
    }
  }, [editor, verses, currentUserId, onAddProposal, onEditFootnote])

  return (
    <div onBlur={handleBlur}>
      <EditorContent editor={editor} />
    </div>
  )
}
