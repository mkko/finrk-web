'use client'

/**
 * 1ba — Structured verse blocks displayed inline.
 *
 * Each verse is a separate ProseMirror block node with `isolating: true`,
 * rendered as a <span> via NodeView so they flow together like one paragraph.
 * Backspace at a verse boundary is blocked — you can't merge verses.
 *
 * When the cursor enters a verse, a collapsible <details> widget shows
 * the original (baseText) above it.
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

const VerseBlock = TiptapNode.create({
  name: 'verseBlock',
  group: 'block',
  content: 'inline*',
  isolating: true,
  defining: true,

  addAttributes() {
    return { verse: { default: 0 } }
  },

  parseHTML() {
    return [{ tag: 'span[data-verse-block]' }]
  },

  // renderHTML needed for serialization / clipboard
  renderHTML({ node }) {
    return ['span', { 'data-verse-block': node.attrs.verse }, 0]
  },

  // NodeView renders as <span> so consecutive verse blocks flow inline
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('span')
      dom.setAttribute('data-verse-block', String(node.attrs.verse))
      const contentDOM = document.createElement('span')
      dom.appendChild(contentDOM)
      dom.appendChild(document.createTextNode(' '))
      return { dom, contentDOM }
    }
  },
})

const VerseNumber = TiptapNode.create({
  name: 'verseNumber',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: false,

  addAttributes() {
    return { number: { default: 0 } }
  },

  parseHTML() {
    return [{ tag: 'sup[data-vn]' }]
  },

  renderHTML({ node }) {
    return ['sup', {
      'data-vn': node.attrs.number,
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

const ProposalBlock = TiptapNode.create({
  name: 'proposalBlock',
  group: 'block',
  content: 'text*',
  atom: true,
  selectable: false,
  addAttributes() {
    return { verse: { default: 0 } }
  },
  parseHTML() { return [{ tag: 'div[data-proposal]' }] },
  renderHTML() {
    return ['div', {
      'data-proposal': '',
      class: 'bg-green-100 border-l-2 border-green-500 pl-2 py-0.5 my-0.5 text-stone-700',
      contenteditable: 'false',
    }, 0]
  },
})

const ReviewBlock = TiptapNode.create({
  name: 'reviewBlock',
  group: 'block',
  content: 'text*',
  atom: true,
  selectable: false,
  parseHTML() { return [{ tag: 'div[data-review]' }] },
  renderHTML() {
    return ['div', {
      'data-review': '',
      class: 'py-0.5 text-sm',
      contenteditable: 'false',
    }, ['span', { class: 'bg-yellow-200/70' }, 0]]
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

// ── Original-text decoration ───────────────────────────

function createOriginalWidget(verseNum: number, text: string): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.contentEditable = 'false'
  wrapper.className = 'my-0.5'

  const details = document.createElement('details')
  details.className = 'bg-amber-50/60 border border-amber-200/60 rounded px-2 py-0.5 text-sm inline-block max-w-full'

  const summary = document.createElement('summary')
  summary.className = 'text-[10px] text-stone-400 cursor-pointer select-none leading-tight'
  summary.textContent = `Alkuperainen jae ${verseNum}`
  details.appendChild(summary)

  const content = document.createElement('div')
  content.className = 'text-stone-500 font-serif text-sm leading-snug mt-0.5'
  content.textContent = text
  details.appendChild(content)

  wrapper.appendChild(details)
  return wrapper
}

const originalTextKey = new PluginKey('originalTextA')

function makeOriginalTextExtension(versesRef: React.RefObject<Verse[]>) {
  return Extension.create({
    name: 'originalTextA',
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: originalTextKey,
          state: {
            init() {
              return { activeVerse: null as number | null, decos: DecorationSet.empty }
            },
            apply(tr, prev, _old, newState) {
              let activeVerse: number | null = null
              const { $from } = newState.selection
              for (let d = $from.depth; d > 0; d--) {
                const node = $from.node(d)
                if (node.type.name === 'verseBlock') {
                  activeVerse = node.attrs.verse
                  break
                }
              }

              if (activeVerse === prev.activeVerse && !tr.docChanged) return prev
              if (activeVerse === null) return { activeVerse: null, decos: DecorationSet.empty }

              const verse = versesRef.current?.find(v => v.number === activeVerse)
              if (!verse) return { activeVerse, decos: DecorationSet.empty }

              // Find position of the verseBlock node
              let pos: number | null = null
              newState.doc.descendants((node, nodePos) => {
                if (pos !== null) return false
                if (node.type.name === 'verseBlock' && node.attrs.verse === activeVerse) {
                  pos = nodePos
                  return false
                }
              })

              if (pos === null) return { activeVerse, decos: DecorationSet.empty }

              const widget = Decoration.widget(pos, () => createOriginalWidget(activeVerse!, verse.baseText), { side: -1 })
              return { activeVerse, decos: DecorationSet.create(newState.doc, [widget]) }
            },
          },
          props: {
            decorations(state) {
              return this.getState(state)?.decos ?? DecorationSet.empty
            },
          },
        }),
      ]
    },
  })
}

// ── Prevent verse merging ──────────────────────────────

const PreventVerseMerge = Extension.create({
  name: 'preventVerseMerge',
  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { $from, empty } = editor.state.selection
        if (!empty) return false
        if ($from.parent.type.name === 'verseBlock' && $from.parentOffset <= 1) {
          // At start of verse (position 0) or right after the verseNumber atom (position 1)
          const before = $from.nodeBefore
          if ($from.parentOffset === 0 || (before && before.type.name === 'verseNumber')) {
            return true // swallow
          }
        }
        return false
      },
      Enter: () => true, // no new blocks
    }
  },
})

// ── Content builder ────────────────────────────────────

function buildContent(
  verses: Verse[], proposals: Proposal[], users: User[],
  showProposals: boolean, showReviewComments: boolean,
) {
  const content: any[] = []

  for (const verse of verses) {
    if (verse.sectionHeader) {
      content.push({
        type: 'sectionHeader',
        content: [{ type: 'text', text: verse.sectionHeader }],
      })
    }

    content.push({
      type: 'verseBlock',
      attrs: { verse: verse.number },
      content: [
        { type: 'verseNumber', attrs: { number: verse.number } },
        { type: 'text', text: verse.text || ' ' },
      ],
    })

    if (showProposals) {
      const p = proposals.find(
        p => p.status !== 'hyvaksytty_lopullisesti' && proposalCoversVerse(p, verse.number),
      )
      if (p) {
        const range = p.ranges.find(r => verse.number >= r.verseStart && verse.number <= r.verseEnd)
        if (range && verse.number === range.verseStart) {
          const author = users.find(u => u.id === p.authorId)
          content.push({
            type: 'proposalBlock',
            attrs: { verse: verse.number },
            content: [{ type: 'text', text: `${range.proposedText} — ${author?.name ?? 'Tuntematon'}` }],
          })
        }
      }
    }

    if (showReviewComments) {
      const p = proposals.find(
        p => p.status !== 'hyvaksytty_lopullisesti' && proposalCoversVerse(p, verse.number),
      )
      if (p) {
        for (const c of p.comments.filter(c => c.thread === 'seurantaryhma')) {
          content.push({
            type: 'reviewBlock',
            content: [{ type: 'text', text: c.text }],
          })
        }
      }
    }

    if (verse.footnotes) {
      for (const fn of verse.footnotes) {
        content.push({
          type: 'footnoteBlock',
          content: [{ type: 'text', text: `${fn.marker} ${fn.text}` }],
        })
      }
    }
  }

  return { type: 'doc', content }
}

// ── Extract verse texts ────────────────────────────────

function extractVerseTexts(doc: any): Map<number, string> {
  const result = new Map<number, string>()
  doc.descendants((node: any) => {
    if (node.type.name === 'verseBlock') {
      let text = ''
      node.forEach((child: any) => { if (child.isText) text += child.text })
      result.set(node.attrs.verse, text.trim())
    }
  })
  return result
}

// ── Component ──────────────────────────────────────────

export function TiptapEditorA({
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
        horizontalRule: false, paragraph: false,
      }),
      VerseBlock,
      VerseNumber,
      SectionHeader,
      ProposalBlock,
      ReviewBlock,
      FootnoteBlock,
      OriginalText,
      PreventVerseMerge,
    ],
    content: buildContent(verses, proposals, users, showProposals, showReviewComments),
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[200px] font-serif text-base leading-7 text-stone-800',
      },
      handleClick(view, pos) {
        const resolved = view.state.doc.resolve(pos)
        for (let d = resolved.depth; d > 0; d--) {
          const node = resolved.node(d)
          if (node.type.name === 'verseBlock') {
            onSelectVerse(node.attrs.verse)
            return false
          }
        }
        return false
      },
    },
  })

  useEffect(() => {
    if (!editor || editor.isFocused) return
    editor.commands.setContent(
      buildContent(verses, proposals, users, showProposals, showReviewComments),
    )
  }, [editor, verses, proposals, users, showProposals, showReviewComments])

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
