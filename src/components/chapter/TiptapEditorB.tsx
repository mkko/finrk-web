'use client'

/**
 * 1bb — Freeform editor with original-text reference for every verse.
 *
 * Verse numbers are plain editable text detected by regex (^(\d+)\s+).
 * Inline footnotes use footnoteMarker atoms + styled text.
 * A non-editable collapsible <details> widget sits before every verse,
 * showing the original (baseText).  No proposal blocks — this is a clean
 * editing surface with reference text always available.
 */

import { useEffect, useCallback, useRef, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Node as TiptapNode, Mark as TiptapMark, Extension, mergeAttributes } from '@tiptap/core'
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

// ── Verse detection ───────────────────────────────────

const VERSE_RE = /^(\d+)\s+([\s\S]*)/

function extractVerseFromText(text: string): { verseNum: number | null; verseText: string } {
  const match = text.match(VERSE_RE)
  if (match) {
    const num = parseInt(match[1], 10)
    if (num > 0 && num <= 200) return { verseNum: num, verseText: match[2] }
  }
  return { verseNum: null, verseText: text }
}

// ── Nodes ──────────────────────────────────────────────

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

// ── Decorations (original text + verse number styling) ─

function createOriginalWidget(verseNum: number, text: string, modified: boolean): HTMLElement {
  const details = document.createElement('details')
  details.contentEditable = 'false'

  details.className = modified
    ? 'select-none mb-0.5'
    : 'select-none opacity-0 pointer-events-none mb-0.5'

  const summary = document.createElement('summary')
  summary.className = 'list-none relative cursor-pointer'
  summary.style.cssText = 'height: 0; line-height: 0; font-size: 0;'

  // Top line — shorter on trailing side to leave room for the rounded corner
  const line = document.createElement('span')
  line.className = 'block border-t border-amber-300/60'
  line.style.cssText = 'margin-right: 0.5rem;'

  // Caret in the margin
  const caret = document.createElement('span')
  caret.className = 'absolute transition-all rounded-full'
  caret.style.cssText = 'left: -2.25rem; top: 0; transform: translateY(-50%); width: 2.25rem; height: 2.25rem; display: flex; align-items: center; justify-content: center;'
  // SVG triangle — precisely centered
  caret.innerHTML = '<svg width="16" height="16" viewBox="0 0 8 8" style="display:block;"><path d="M2 1 L6 4 L2 7 Z" fill="rgb(251 191 36)"/></svg>'
  caret.addEventListener('mouseenter', () => { caret.style.backgroundColor = 'rgb(252 211 77 / 0.4)' })
  caret.addEventListener('mouseleave', () => { caret.style.backgroundColor = 'transparent' })

  summary.appendChild(line)
  summary.appendChild(caret)
  details.appendChild(summary)

  // Rotate caret when open
  details.addEventListener('toggle', () => {
    caret.style.transform = details.open ? 'translateY(-50%) rotate(90deg)' : 'translateY(-50%)'
  })

  const content = document.createElement('div')
  content.className = 'text-stone-500 font-serif text-base leading-7 bg-amber-50/60 border border-amber-300/60 border-t-0 rounded-lg px-2 py-1'
  content.style.cssText = 'border-top-left-radius: 0; border-top-right-radius: 0;'

  // Verse number as superscript, matching the editor styling
  const num = document.createElement('span')
  num.className = 'text-xs text-stone-400 font-sans'
  num.style.cssText = 'vertical-align: super; font-size: 0.65em; line-height: 0;'
  num.textContent = `${verseNum}`

  content.appendChild(num)
  content.appendChild(document.createTextNode(` ${text}`))
  details.appendChild(content)

  return details
}

const decoKey = new PluginKey('decoB')

function makeDecoExtension(versesRef: React.RefObject<Verse[]>) {
  return Extension.create({
    name: 'decoB',
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: decoKey,
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
  let plainText = ''
  let hitFootnote = false

  node.forEach((child: any) => {
    if (child.type.name === 'footnoteMarker') {
      hitFootnote = true
    } else if (child.isText && !hitFootnote) {
      plainText += child.text
    }
  })

  return extractVerseFromText(plainText)
}

function buildDecos(doc: any, verses: Verse[]): DecorationSet {
  const decorations: Decoration[] = []
  const verseNumbers = new Set(verses.map(v => v.number))
  const seenVerses = new Set<number>()

  doc.descendants((node: any, pos: number) => {
    if (node.type.name === 'paragraph') {
      const { verseNum, verseText } = extractVerseTextFromParagraph(node)

      if (verseNum !== null) {
        // Find the text range for the verse number prefix
        const verseNumStr = `${verseNum}`
        let textOffset = 0
        let foundRange = false

        node.forEach((child: any, offset: number) => {
          if (foundRange) return
          if (child.isText) {
            const childText = child.text as string
            const match = childText.match(/^(\d+)\s/)
            if (match && textOffset === 0) {
              const from = pos + 1 + offset
              const to = from + match[0].length

              // Determine style
              const isDuplicate = seenVerses.has(verseNum)
              const isUnknown = !verseNumbers.has(verseNum)

              let className = 'text-xs font-sans'
              if (isDuplicate) {
                className += ' text-orange-500'
              } else if (isUnknown) {
                className += ' text-red-400'
              } else {
                className += ' text-stone-400'
              }
              // Superscript via inline style (vertical-align doesn't have a Tailwind class)
              decorations.push(
                Decoration.inline(from, to, {
                  class: className,
                  style: 'vertical-align: super; font-size: 0.65em; line-height: 0;',
                })
              )
              foundRange = true
            }
            textOffset += childText.length
          }
        })

        seenVerses.add(verseNum)

        // Original text widget
        const verse = verses.find(v => v.number === verseNum)
        if (verse) {
          const modified = verseText.trim() !== verse.baseText

          decorations.push(
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

  return DecorationSet.create(doc, decorations)
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

    const verseText = verse.text || ' '
    const paragraphContent: any[] = [
      { type: 'text', text: `${verse.number} ${verseText}` },
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

    let plainText = ''
    let currentFootnoteMarker: string | null = null
    let currentFootnoteText = ''
    let hitFootnote = false

    const flushFootnote = () => {
      if (currentFootnoteMarker !== null && detectedVerse !== null) {
        footnotes.push({
          verse: detectedVerse,
          marker: currentFootnoteMarker,
          text: currentFootnoteText.trim(),
        })
      }
    }

    let detectedVerse: number | null = null

    node.forEach((child: any) => {
      if (child.type.name === 'footnoteMarker') {
        // First time hitting footnote: extract verse from accumulated text
        if (!hitFootnote) {
          const { verseNum } = extractVerseFromText(plainText)
          detectedVerse = verseNum
          hitFootnote = true
        }
        flushFootnote()
        currentFootnoteMarker = child.attrs.marker
        currentFootnoteText = ''
      } else if (child.isText) {
        if (currentFootnoteMarker !== null) {
          currentFootnoteText += child.text
        } else {
          plainText += child.text
        }
      }
    })

    // If no footnotes were encountered, detect verse now
    if (!hitFootnote) {
      const { verseNum } = extractVerseFromText(plainText)
      detectedVerse = verseNum
    }

    flushFootnote()

    if (detectedVerse !== null) {
      const { verseText } = extractVerseFromText(plainText)
      verses.set(detectedVerse, verseText.trim())
    }
  })

  return { verses, footnotes }
}

// ── Helpers ────────────────────────────────────────────

function verseAtPos(state: any): number | null {
  const { $from } = state.selection
  const parent = $from.parent
  if (parent.type.name !== 'paragraph') return null

  let plainText = ''
  let hitFootnote = false
  parent.forEach((child: any) => {
    if (child.type.name === 'footnoteMarker') hitFootnote = true
    else if (child.isText && !hitFootnote) plainText += child.text
  })

  return extractVerseFromText(plainText).verseNum
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
  const DecoExt = useMemo(() => makeDecoExtension(versesRef), [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, codeBlock: false, blockquote: false,
        bulletList: false, orderedList: false, listItem: false,
        horizontalRule: false,
      }),
      FootnoteMarker,
      FootnoteMark,
      SectionHeader,
      DecoExt,
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
            schema.text(`${v.number} ${v.text}`),
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
