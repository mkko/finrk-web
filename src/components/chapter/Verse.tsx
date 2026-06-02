'use client'

import { forwardRef, useState, useRef } from 'react'
import { Verse as VerseType, ProposalStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Pencil } from 'lucide-react'

export interface ProposalAnnotation {
  id: string
  proposedText: string
  authorName: string
  status: ProposalStatus
  verseLabel: string
  onEdit: (newText: string) => void
  onDelete: () => void
}

export interface ReviewComment {
  text: string
  authorName: string
}

export interface DraftState {
  text: string
  rationale: string
  onTextChange: (text: string) => void
  onRationaleChange: (rationale: string) => void
  onSubmit: () => void
  onCancel: () => void
}

export interface FootnoteAnnotation {
  marker: string
  text: string
  baseText: string
  onEdit: (newText: string) => void
  onDelete: () => void
}

export interface FootnoteActions {
  onAdd: (text: string) => void
}

interface VerseProps {
  verse: VerseType
  isSelected: boolean
  onSelect: () => void
  sectionHeader?: string
  footnotes?: FootnoteAnnotation[]
  footnoteActions?: FootnoteActions
  proposalAnnotation?: ProposalAnnotation
  reviewComments?: ReviewComment[]
  onStartDraft?: () => void
  draftState?: DraftState
  showProposals: boolean
  showReviewComments: boolean
}

export const Verse = forwardRef<HTMLDivElement, VerseProps>(
  function Verse({
    verse, isSelected, onSelect, sectionHeader, footnotes, footnoteActions,
    proposalAnnotation, reviewComments, onStartDraft, draftState,
    showProposals, showReviewComments,
  }, ref) {
    const [hovered, setHovered] = useState(false)

    return (
      <div ref={ref} className="mb-1">
        {sectionHeader && (
          <h3 className="font-serif text-base font-semibold text-stone-700 mt-6 mb-2">
            {sectionHeader}
          </h3>
        )}

        {/* Verse text line (read-only) */}
        <div
          className={cn(
            'group py-0.5 rounded-sm transition-colors cursor-pointer relative',
            isSelected && 'bg-stone-100',
            !isSelected && hovered && 'bg-stone-50',
          )}
          onClick={() => {
            if (window.getSelection()?.isCollapsed === false) return
            onSelect()
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect() }}
        >
          <sup className="text-xs text-stone-400 font-sans mr-0.5 select-none">
            {verse.number}
          </sup>
          {verse.text}

          {/* Pen icon — always visible on hover, only in proposals view */}
          {onStartDraft && showProposals && (
            <button
              onClick={e => { e.stopPropagation(); onStartDraft() }}
              className={cn(
                'inline-flex items-center justify-center w-5 h-5 rounded ml-1 align-middle transition-opacity',
                'text-stone-400 hover:text-stone-600 hover:bg-stone-200',
                hovered ? 'opacity-100' : 'opacity-0',
              )}
              title="Ehdota muutosta"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Active draft (editable, green) — inline like a Word line */}
        {draftState && showProposals && (
          <div className="py-0.5 space-y-1">
            <div
              contentEditable
              suppressContentEditableWarning
              onInput={e => draftState.onTextChange(e.currentTarget.textContent ?? '')}
              ref={el => { if (el && !el.textContent) el.textContent = draftState.text }}
              className="bg-green-200/70 font-serif text-base leading-7 text-stone-800 focus:outline-none min-h-[1.75rem]"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={draftState.rationale}
                onChange={e => draftState.onRationaleChange(e.target.value)}
                placeholder="Perustele muutos lyhyesti"
                className="flex-1 text-sm text-stone-500 bg-transparent border-none focus:outline-none placeholder:text-stone-300"
              />
              <button
                onClick={draftState.onSubmit}
                disabled={!draftState.text.trim() || draftState.text === verse.text}
                className="text-xs font-medium px-2 py-0.5 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Tallenna
              </button>
              <button
                onClick={draftState.onCancel}
                className="text-xs text-stone-400 hover:text-stone-600"
              >
                Peruuta
              </button>
            </div>
          </div>
        )}

        {/* Existing proposal (green, editable) — styled like a Word highlight */}
        {proposalAnnotation && showProposals && !draftState && (
          <ProposalEditor annotation={proposalAnnotation} verseNumber={verse.number} />
        )}

        {/* Seurantaryhmä comments (yellow) — styled like a Word highlight */}
        {showReviewComments && reviewComments?.map((rc, i) => (
          <div key={i} className="py-0.5 text-sm">
            <span className="bg-yellow-200/70">{rc.text}</span>
          </div>
        ))}

        {/* Footnotes — read-only original + green proposed change, like verses */}
        {footnoteActions && (
          <AddPen className="ml-8" onAdd={footnoteActions.onAdd} />
        )}
        {footnotes?.map(fn => (
          <div key={fn.marker}>
            <FootnoteRow footnote={fn} verseNumber={verse.number} />
            {footnoteActions && (
              <AddPen className="ml-8" onAdd={footnoteActions.onAdd} />
            )}
          </div>
        ))}
      </div>
    )
  }
)

function InlineEditor({ text, className, onSave, onDelete }: {
  text: string
  className?: string
  onSave: (newText: string) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const spanRef = useRef<HTMLSpanElement>(null)
  const editTextRef = useRef(text)

  function save() {
    const newText = editTextRef.current.trim()
    if (!newText) {
      onDelete()
    } else if (newText !== text) {
      onSave(newText)
    }
    setEditing(false)
  }

  function cancel() {
    editTextRef.current = text
    if (spanRef.current) spanRef.current.textContent = text
    setEditing(false)
  }

  return (
    <>
      <span
        ref={spanRef}
        contentEditable={editing}
        suppressContentEditableWarning
        className={cn(className, editing ? 'focus:outline-none cursor-text' : 'cursor-pointer')}
        onClick={() => {
          if (!editing) {
            setEditing(true)
            requestAnimationFrame(() => spanRef.current?.focus())
          }
        }}
        onInput={e => { editTextRef.current = e.currentTarget.textContent ?? '' }}
      >
        {text}
      </span>
      {editing && (
        <div className="flex items-center gap-2 mt-0.5">
          <button
            onClick={save}
            className="text-xs font-medium px-2 py-0.5 rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            Tallenna
          </button>
          <button
            onClick={cancel}
            className="text-xs text-stone-400 hover:text-stone-600"
          >
            Peruuta
          </button>
        </div>
      )}
    </>
  )
}

function ProposalEditor({ annotation, verseNumber }: { annotation: ProposalAnnotation; verseNumber: number }) {
  return (
    <div className="py-0.5">
      <sup className="text-xs text-green-700 font-sans mr-0.5">{verseNumber}</sup>
      <InlineEditor
        text={annotation.proposedText}
        className="bg-green-200/70"
        onSave={annotation.onEdit}
        onDelete={annotation.onDelete}
      />
    </div>
  )
}

function FootnoteRow({ footnote, verseNumber }: { footnote: FootnoteAnnotation; verseNumber: number }) {
  const [drafting, setDrafting] = useState(false)
  const spanRef = useRef<HTMLSpanElement>(null)
  const textRef = useRef('')
  const [hovered, setHovered] = useState(false)

  const isChanged = footnote.text !== footnote.baseText

  function startEdit() {
    textRef.current = footnote.text
    setDrafting(true)
    requestAnimationFrame(() => spanRef.current?.focus())
  }

  function save() {
    const text = textRef.current.trim()
    if (!text) {
      footnote.onDelete()
    } else if (text !== footnote.text) {
      footnote.onEdit(text)
    }
    setDrafting(false)
  }

  function cancel() {
    setDrafting(false)
  }

  return (
    <>
      {/* Original footnote (read-only) + pen */}
      <div
        className={cn('ml-8 text-sm text-stone-400 leading-relaxed group/fn', hovered && 'bg-stone-50 rounded-sm')}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <sup className="text-xs font-sans mr-0.5">{footnote.marker}</sup>
        {footnote.baseText}
        {!drafting && !isChanged && (
          <button
            onClick={e => { e.stopPropagation(); startEdit() }}
            className={cn(
              'inline-flex items-center justify-center w-4 h-4 rounded ml-1 align-middle transition-opacity',
              'text-stone-300 hover:text-stone-500',
              hovered ? 'opacity-100' : 'opacity-0',
            )}
          >
            <Pencil className="w-2.5 h-2.5" />
          </button>
        )}
      </div>

      {/* Saved change (green, clickable) — uses InlineEditor like proposals */}
      {isChanged && !drafting && (
        <div className="ml-8 text-sm leading-relaxed py-0.5">
          <sup className="text-xs text-green-700 font-sans mr-0.5">{footnote.marker}</sup>
          <InlineEditor
            text={footnote.text}
            className="bg-green-200/70 text-stone-600"
            onSave={footnote.onEdit}
            onDelete={footnote.onDelete}
          />
        </div>
      )}

      {/* Active draft (green, editable) */}
      {drafting && (
        <div className="ml-8 text-sm leading-relaxed py-0.5">
          <sup className="text-xs text-green-700 font-sans mr-0.5">{footnote.marker}</sup>
          <span
            ref={spanRef}
            contentEditable
            suppressContentEditableWarning
            className="bg-green-200/70 text-stone-600 focus:outline-none"
            onInput={e => { textRef.current = e.currentTarget.textContent ?? '' }}
          >
            {footnote.text}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <button
              onClick={save}
              className="text-xs font-medium px-2 py-0.5 rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              Tallenna
            </button>
            <button
              onClick={cancel}
              className="text-xs text-stone-400 hover:text-stone-600"
            >
              Peruuta
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function AddPen({ className, onAdd }: { className?: string; onAdd: (text: string) => void }) {
  const [adding, setAdding] = useState(false)
  const spanRef = useRef<HTMLSpanElement>(null)
  const textRef = useRef('')

  function save() {
    const text = textRef.current.trim()
    if (text) onAdd(text)
    setAdding(false)
    textRef.current = ''
  }

  function cancel() {
    setAdding(false)
    textRef.current = ''
  }

  if (!adding) {
    return (
      <div className={cn('group/addpen h-3', className)}>
        <button
          onClick={() => {
            setAdding(true)
            requestAnimationFrame(() => spanRef.current?.focus())
          }}
          className="opacity-0 group-hover/addpen:opacity-100 transition-opacity text-stone-300 hover:text-stone-500"
        >
          <Pencil className="w-2.5 h-2.5" />
        </button>
      </div>
    )
  }

  return (
    <div className={cn('text-sm leading-relaxed', className)}>
      <span
        ref={spanRef}
        contentEditable
        suppressContentEditableWarning
        className="bg-green-200/70 text-stone-600 focus:outline-none min-w-[100px] inline-block"
        onInput={e => { textRef.current = e.currentTarget.textContent ?? '' }}
      />
      <div className="flex items-center gap-2 mt-0.5">
        <button
          onClick={save}
          className="text-xs font-medium px-2 py-0.5 rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          Tallenna
        </button>
        <button
          onClick={cancel}
          className="text-xs text-stone-400 hover:text-stone-600"
        >
          Peruuta
        </button>
      </div>
    </div>
  )
}
