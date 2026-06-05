'use client'

/**
 * 1bb — Freeform editor with original-text reference for every verse.
 *
 * Each verse is a separate paragraph containing a verseMarker atom + text.
 * A non-editable collapsible <details> widget sits before every verse,
 * showing the original (baseText).  No proposal blocks — this is a clean
 * editing surface with reference text always available.
 */

import { useEffect, useCallback, useRef, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Node as TiptapNode, Extension, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
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

const FootnoteBlock = TiptapNode.create({
  name: 'footnoteBlock',
  group: 'block',
  content: 'text*',
  atom: true,
  selectable: false,
  parseHTML() { return [{ tag: 'div[data-fn]' }] },
  renderHTML() {
    return ['div', {
      'data-fn': '',
      class: 'ml-8 text-sm text-stone-400 leading-relaxed',
      contenteditable: 'false',
    }, 0]
  },
})

// ── Original-text decorations (all verses, always) ─────

function createOriginalWidget(verseNum: number, text: string): HTMLElement {
  const details = document.createElement('details')
  details.contentEditable = 'false'
  details.className = 'bg-amber-50/60 border border-amber-200/60 rounded px-2 py-0.5 text-sm my-0.5 select-none'

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
      let cachedDecos = DecorationSet.empty
      let cachedDocId: any = null

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

function buildDecos(doc: any, verses: Verse[]): DecorationSet {
  const widgets: Decoration[] = []

  doc.descendants((node: any, pos: number) => {
    // Only look at top-level block nodes
    if (node.type.name === 'paragraph') {
      // Find the verseMarker inside this paragraph
      let verseNum: number | null = null
      node.forEach((child: any) => {
        if (child.type.name === 'verseMarker' && verseNum === null) {
          verseNum = child.attrs.number
        }
      })

      if (verseNum !== null) {
        const verse = verses.find(v => v.number === verseNum)
        if (verse) {
          widgets.push(
            Decoration.widget(pos, () => createOriginalWidget(verseNum!, verse.baseText), {
              side: -1,
              key: `orig-${verseNum}`,
            }),
          )
        }
      }
      return false // don't descend into paragraph children
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

    // One paragraph per verse: marker + text
    content.push({
      type: 'paragraph',
      content: [
        { type: 'verseMarker', attrs: { number: verse.number } },
        { type: 'text', text: verse.text || ' ' },
      ],
    })

    // Footnotes after the verse
    if (verse.footnotes) {
      for (const fn of verse.footnotes) {
        content.push({
          type: 'footnoteBlock',
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

// ── Extract verse texts ────────────────────────────────

function extractVerseTexts(doc: any): Map<number, string> {
  const result = new Map<number, string>()
  doc.descendants((node: any) => {
    if (node.type.name !== 'paragraph') return

    let verseNum: number | null = null
    let text = ''

    node.forEach((child: any) => {
      if (child.type.name === 'verseMarker') {
        verseNum = child.attrs.number
      } else if (child.isText) {
        text += child.text
      }
    })

    if (verseNum !== null) result.set(verseNum, text.trim())
  })
  return result
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

// ── Component ──────────────────────────────────────────

export function TiptapEditorB({
  verses, proposals, users, currentUserId,
  showProposals, showReviewComments,
  selectedVerse, onSelectVerse, onAddProposal,
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
      SectionHeader,
      FootnoteBlock,
      OriginalText,
    ],
    content: buildContent(verses),
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[200px] font-serif text-base leading-7 text-stone-800',
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
    const newTexts = extractVerseTexts(editor.state.doc)
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
  }, [editor, verses, currentUserId, onAddProposal])

  return (
    <div onBlur={handleBlur}>
      <EditorContent editor={editor} />
    </div>
  )
}
