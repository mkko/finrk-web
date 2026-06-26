'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AppState, TextWorkStatus, Merkinta, Snapshot, Comment, textWorkLabel } from './types'
import { canTransition } from './state-machine'
import {
  SEED_USERS, SEED_VERSES, SEED_TEXT_WORKS, SEED_PROPOSALS,
  SEED_COMMENTS, SEED_ACTIVITY, SEED_MERKINNAT, SEED_SNAPSHOTS,
} from './seed-data'

function initialState() {
  const baseSnapshot: Snapshot = {
    id: 'snapshot-base',
    textWorkId: 'tw-1',
    type: 'publication',
    name: 'Pohjaversio (RK12)',
    createdAt: '2026-04-12T10:00:00Z',
    createdBy: 'leino-kimmo',
    verseTexts: SEED_VERSES.map(v => ({ chapter: v.chapter, number: v.number, text: v.baseText })),
    footnoteTexts: SEED_VERSES.flatMap(v =>
      (v.footnotes ?? []).map(fn => ({ chapter: v.chapter, verse: v.number, marker: fn.marker, text: fn.baseText }))
    ),
    sectionHeaderTexts: SEED_VERSES
      .filter(v => v.sectionHeader)
      .map(v => ({ chapter: v.chapter, verse: v.number, text: v.sectionHeader! })),
  }

  return {
    currentUserId: '',
    users: SEED_USERS,
    verses: SEED_VERSES.map(v => ({ ...v, text: v.baseText, approvedText: v.approvedText ?? v.baseText })),
    textWorks: [{
      id: 'tw-1',
      scope: { book: 'Phil' },
      status: 'luonnos' as const,
      statusChangedAt: new Date().toISOString(),
    }],
    proposals: [] as typeof SEED_PROPOSALS,
    comments: [] as Comment[],
    merkinnat: [] as Merkinta[],
    activity: [] as typeof SEED_ACTIVITY,
    snapshots: [baseSnapshot] as Snapshot[],
    viewingSnapshotId: null as string | null,
  }
}

function demoState() {
  return {
    currentUserId: '',
    users: SEED_USERS,
    verses: [...SEED_VERSES],
    textWorks: [...SEED_TEXT_WORKS],
    proposals: [...SEED_PROPOSALS],
    comments: [...SEED_COMMENTS],
    merkinnat: [...SEED_MERKINNAT],
    activity: [...SEED_ACTIVITY],
    snapshots: [...SEED_SNAPSHOTS],
    viewingSnapshotId: null as string | null,
  }
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState(),

      setCurrentUser: (userId: string) => set({ currentUserId: userId }),

      editVerse: (chapter: number, verseNumber: number, newText: string) => {
        set(state => ({
          verses: state.verses.map(v =>
            v.chapter === chapter && v.number === verseNumber ? { ...v, text: newText } : v
          ),
        }))
      },

      publishDraft: () => {
        const now = new Date().toISOString()
        const state = get()
        const tw = state.textWorks[0]
        const snapshot: Snapshot = {
          id: `snapshot-pub-${Date.now()}`,
          textWorkId: tw?.id ?? '',
          type: 'publication',
          name: `Julkaisu ${new Date(now).toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric', year: 'numeric' })}`,
          createdAt: now,
          createdBy: state.currentUserId,
          verseTexts: state.verses.map(v => ({ chapter: v.chapter, number: v.number, text: v.text })),
          footnoteTexts: state.verses.flatMap(v =>
            (v.footnotes ?? []).map(f => ({ chapter: v.chapter, verse: v.number, marker: f.marker, text: f.text }))
          ),
          sectionHeaderTexts: state.verses
            .filter(v => v.sectionHeader)
            .map(v => ({ chapter: v.chapter, verse: v.number, text: v.sectionHeader! })),
        }
        set(state => ({
          verses: state.verses.map(v => ({ ...v, baseText: v.text })),
          snapshots: [...state.snapshots, snapshot],
          activity: [
            {
              id: `act-${Date.now()}`,
              timestamp: now,
              userId: state.currentUserId,
              textWorkId: tw?.id ?? '',
              action: 'Julkaistu',
              detail: 'Luonnos julkaistu uudeksi pohjaversioksi',
            },
            ...state.activity,
          ],
        }))
      },

      updateTextWorkStatus: (textWorkId: string, newStatus: TextWorkStatus) => {
        const now = new Date().toISOString()
        const state = get()
        const currentUser = state.users.find(u => u.id === state.currentUserId)
        const tw = state.textWorks.find(t => t.id === textWorkId)
        if (!tw || !currentUser) return
        if (!canTransition(tw.status, newStatus, currentUser.roles)) return

        // Create a publication snapshot when publishing for feedback
        const newSnapshots: Snapshot[] = []
        if (newStatus === 'julkaistu_palautteelle') {
          newSnapshots.push({
            id: `snapshot-pub-${Date.now()}`,
            textWorkId,
            type: 'publication',
            createdAt: now,
            createdBy: state.currentUserId,
            verseTexts: state.verses.map(v => ({ chapter: v.chapter, number: v.number, text: v.text })),
            footnoteTexts: state.verses.flatMap(v =>
              (v.footnotes ?? []).map(fn => ({ chapter: v.chapter, verse: v.number, marker: fn.marker, text: fn.text }))
            ),
            sectionHeaderTexts: state.verses
              .filter(v => v.sectionHeader)
              .map(v => ({ chapter: v.chapter, verse: v.number, text: v.sectionHeader! })),
          })
        }

        set(state => ({
          textWorks: state.textWorks.map(t => {
            if (t.id !== textWorkId) return t
            const updated = { ...t, status: newStatus, statusChangedAt: now }
            if (newStatus === 'julkaistu_palautteelle') {
              updated.publishedForFeedbackAt = now
            }
            return updated
          }),
          snapshots: [...state.snapshots, ...newSnapshots],
          activity: [
            {
              id: `act-${Date.now()}`,
              timestamp: now,
              userId: state.currentUserId,
              textWorkId,
              action: newStatus === 'julkaistu_palautteelle' ? 'Julkaistu palautteelle'
                : newStatus === 'luonnos' ? 'Palautettu luonnokseksi'
                : newStatus,
              detail: newStatus === 'julkaistu_palautteelle'
                ? 'Teksti julkaistu seurantaryhmälle palautekierrokselle'
                : newStatus === 'luonnos'
                  ? 'Teksti vedettiin takaisin luonnokseksi'
                  : `${textWorkLabel(tw)} — tila muutettu`,
            },
            ...state.activity,
          ],
        }))
      },

      submitToHallitus: (textWorkId: string, selectedVoters: string[], rationale: string, selectedVerses?: number[]) => {
        const now = new Date().toISOString()
        const state = get()
        const tw = state.textWorks.find(t => t.id === textWorkId)
        if (!tw) return

        // Create submission snapshot (only selected verses if specified)
        const snapshotId = `snapshot-${Date.now()}`
        const versesToSnapshot = selectedVerses
          ? state.verses.filter(v => selectedVerses.includes(v.number))
          : state.verses
        const snapshot: Snapshot = {
          id: snapshotId,
          textWorkId,
          type: 'submission',
          createdAt: now,
          createdBy: state.currentUserId,
          verseTexts: versesToSnapshot.map(v => ({ chapter: v.chapter, number: v.number, text: v.text })),
          footnoteTexts: versesToSnapshot.flatMap(v =>
            (v.footnotes ?? []).map(fn => ({ chapter: v.chapter, verse: v.number, marker: fn.marker, text: fn.text }))
          ),
          sectionHeaderTexts: versesToSnapshot
            .filter(v => v.sectionHeader)
            .map(v => ({ chapter: v.chapter, verse: v.number, text: v.sectionHeader! })),
        }

        const proposalId = `proposal-${Date.now()}`

        set(state => ({
          textWorks: state.textWorks.map(t =>
            t.id === textWorkId
              ? {
                  ...t,
                  status: 'lahetetty_hallitukselle' as const,
                  statusChangedAt: now,
                  submittedToHallitusAt: now,
                  submissionProposalId: proposalId,
                }
              : t
          ),
          snapshots: [...state.snapshots, snapshot],
          proposals: [
            ...state.proposals,
            {
              id: proposalId,
              textWorkId,
              snapshotId,
              selectedVoters,
              selectedVerses,
              rationale,
              votes: [],
              createdAt: now,
            },
          ],
          activity: [
            {
              id: `act-${Date.now()}`,
              timestamp: now,
              userId: state.currentUserId,
              textWorkId,
              action: 'Lähetetty hallitukselle',
              detail: 'Teksti lähetetty hallituksen äänestettäväksi',
            },
            ...state.activity,
          ],
        }))
      },

      castVote: (proposalId: string, decision: 'approve' | 'reject', comment?: string) => {
        const now = new Date().toISOString()
        set(state => {
          const proposal = state.proposals.find(p => p.id === proposalId)
          if (!proposal || proposal.resolvedAt || proposal.cancelledAt) return state

          const tw = state.textWorks.find(t => t.id === proposal.textWorkId)
          if (!tw || tw.status !== 'lahetetty_hallitukselle') return state

          // Must be a board member
          const voter = state.users.find(u => u.id === state.currentUserId)
          if (!voter || !voter.roles.includes('hallitus')) return state

          // No duplicate votes
          if (proposal.votes.some(v => v.userId === state.currentUserId)) return state

          const newVote = {
            userId: state.currentUserId,
            decision,
            comment,
            createdAt: now,
          }
          const updatedVotes = [...proposal.votes, newVote]

          // Votes are advisory — resolution happens via approveProposal
          return {
            proposals: state.proposals.map(p =>
              p.id === proposalId
                ? { ...p, votes: updatedVotes }
                : p
            ),
            activity: [
              {
                id: `act-${Date.now()}`,
                timestamp: now,
                userId: state.currentUserId,
                textWorkId: proposal.textWorkId,
                action: 'Äänestetty',
                detail: decision === 'approve' ? 'Äänesti hyväksymisen puolesta' : 'Äänesti hylkäämisen puolesta',
              },
              ...state.activity,
            ],
          }
        })
      },

      approveProposal: (proposalId: string) => {
        const now = new Date().toISOString()
        set(state => {
          const proposal = state.proposals.find(p => p.id === proposalId)
          if (!proposal || proposal.resolvedAt || proposal.cancelledAt) return state

          const tw = state.textWorks.find(t => t.id === proposal.textWorkId)
          if (!tw || tw.status !== 'lahetetty_hallitukselle') return state

          const voter = state.users.find(u => u.id === state.currentUserId)
          if (!voter || !voter.roles.includes('hallitus')) return state

          const snapshot = state.snapshots.find(s => s.id === proposal.snapshotId)

          return {
            proposals: state.proposals.map(p =>
              p.id === proposalId ? { ...p, resolvedAt: now } : p
            ),
            textWorks: state.textWorks.map(t =>
              t.id === proposal.textWorkId
                ? { ...t, status: 'hyvaksytty' as TextWorkStatus, statusChangedAt: now }
                : t
            ),
            verses: snapshot
              ? state.verses.map(v => {
                  const sv = snapshot.verseTexts.find(sv => sv.chapter === v.chapter && sv.number === v.number)
                  return sv ? { ...v, approvedText: sv.text } : v
                })
              : state.verses,
            activity: [
              {
                id: `act-${Date.now()}`,
                timestamp: now,
                userId: state.currentUserId,
                textWorkId: proposal.textWorkId,
                action: 'Hyväksytty',
                detail: `${voter.name} hyväksyi ehdotuksen hallituksen puolesta`,
              },
              ...state.activity,
            ],
          }
        })
      },

      rejectProposal: (proposalId: string, reason: string) => {
        const now = new Date().toISOString()
        set(state => {
          const proposal = state.proposals.find(p => p.id === proposalId)
          if (!proposal || proposal.resolvedAt || proposal.cancelledAt) return state

          const tw = state.textWorks.find(t => t.id === proposal.textWorkId)
          if (!tw || tw.status !== 'lahetetty_hallitukselle') return state

          const voter = state.users.find(u => u.id === state.currentUserId)
          if (!voter || !voter.roles.includes('hallitus')) return state

          // Add a reject vote with the reason, then resolve
          const rejectVote = {
            userId: state.currentUserId,
            decision: 'reject' as const,
            comment: reason,
            createdAt: now,
          }
          const existingVotes = proposal.votes.filter(v => v.userId !== state.currentUserId)

          return {
            proposals: state.proposals.map(p =>
              p.id === proposalId
                ? { ...p, votes: [...existingVotes, rejectVote], resolvedAt: now }
                : p
            ),
            textWorks: state.textWorks.map(t =>
              t.id === proposal.textWorkId
                ? { ...t, status: 'hylatty' as TextWorkStatus, statusChangedAt: now }
                : t
            ),
            activity: [
              {
                id: `act-${Date.now()}`,
                timestamp: now,
                userId: state.currentUserId,
                textWorkId: proposal.textWorkId,
                action: 'Hylätty',
                detail: `${voter.name} hylkäsi ehdotuksen: ${reason}`,
              },
              ...state.activity,
            ],
          }
        })
      },

      cancelProposal: (proposalId: string) => {
        const now = new Date().toISOString()
        set(state => {
          const proposal = state.proposals.find(p => p.id === proposalId)
          if (!proposal || proposal.resolvedAt || proposal.cancelledAt) return state

          const tw = state.textWorks.find(t => t.id === proposal.textWorkId)
          if (!tw || tw.status !== 'lahetetty_hallitukselle') return state

          return {
            proposals: state.proposals.map(p =>
              p.id === proposalId
                ? { ...p, cancelledAt: now }
                : p
            ),
            textWorks: state.textWorks.map(t =>
              t.id === proposal.textWorkId
                ? {
                    ...t,
                    status: 'julkaistu_palautteelle' as TextWorkStatus,
                    statusChangedAt: now,
                    submissionProposalId: undefined,
                  }
                : t
            ),
            activity: [
              {
                id: `act-${Date.now()}`,
                timestamp: now,
                userId: state.currentUserId,
                textWorkId: proposal.textWorkId,
                action: 'Äänestys peruutettu',
                detail: `${textWorkLabel(tw)} — äänestys peruutettu`,
              },
              ...state.activity,
            ],
          }
        })
      },

      updateSelectedVoters: (proposalId: string, voterIds: string[]) => {
        set(state => {
          const proposal = state.proposals.find(p => p.id === proposalId)
          if (!proposal || proposal.resolvedAt || proposal.cancelledAt) return state
          // Don't remove voters who already voted
          const votedIds = new Set(proposal.votes.map(v => v.userId))
          const safeVoterIds = [...new Set([...voterIds, ...votedIds])]
          return {
            proposals: state.proposals.map(p =>
              p.id === proposalId
                ? { ...p, selectedVoters: safeVoterIds }
                : p
            ),
          }
        })
      },

      addComment: (comment) => {
        const now = new Date().toISOString()
        set(state => ({
          comments: [
            ...state.comments,
            { ...comment, id: `comment-${Date.now()}`, createdAt: now, status: 'avoin' as const },
          ],
          activity: [
            {
              id: `act-${Date.now()}`,
              timestamp: now,
              userId: state.currentUserId,
              textWorkId: comment.textWorkId,
              action: 'Uusi kommentti',
              detail: 'Kommentti lisätty',
            },
            ...state.activity,
          ],
        }))
      },

      resolveComment: (commentId: string) => {
        const now = new Date().toISOString()
        set(state => {
          const comment = state.comments.find(c => c.id === commentId)
          return {
            comments: state.comments.map(c =>
              c.id === commentId
                ? { ...c, status: 'kasitelty' as const, resolvedBy: state.currentUserId, resolvedAt: now }
                : c
            ),
            activity: [
              {
                id: `act-${Date.now()}`,
                timestamp: now,
                userId: state.currentUserId,
                textWorkId: comment?.textWorkId ?? '',
                action: 'Kommentti käsitelty',
                detail: 'Kommentti merkitty käsitellyksi',
              },
              ...state.activity,
            ],
          }
        })
      },

      addMerkinta: (verses: { chapter: number; verseNumber: number; text: string }[], note?: string) => {
        set(state => ({
          merkinnat: [
            ...state.merkinnat,
            {
              id: `merkinta-${Date.now()}`,
              verses,
              authorId: state.currentUserId,
              ...(note ? { note } : {}),
              createdAt: new Date().toISOString(),
            },
          ],
        }))
      },

      updateMerkintaNote: (id: string, note: string) => {
        set(state => ({
          merkinnat: state.merkinnat.map(m =>
            m.id === id ? { ...m, note: note || undefined } : m
          ),
        }))
      },

      deleteMerkinta: (id: string) => {
        set(state => ({
          merkinnat: state.merkinnat.filter(m => m.id !== id),
        }))
      },

      addFootnote: (chapter: number, verseNumber: number, text: string) => {
        set(state => ({
          verses: state.verses.map(v => {
            if (v.chapter !== chapter || v.number !== verseNumber) return v
            const existing = v.footnotes ?? []
            const marker = `${verseNumber}`
            return { ...v, footnotes: [...existing, { marker, text, baseText: text }] }
          }),
        }))
      },

      editSectionHeader: (chapter: number, verseNumber: number, newText: string) => {
        set(state => ({
          verses: state.verses.map(v =>
            v.chapter === chapter && v.number === verseNumber
              ? { ...v, sectionHeader: newText || undefined }
              : v
          ),
        }))
      },

      editFootnote: (chapter: number, verseNumber: number, marker: string, newText: string) => {
        set(state => ({
          verses: state.verses.map(v =>
            v.chapter === chapter && v.number === verseNumber
              ? { ...v, footnotes: v.footnotes?.map(fn => fn.marker === marker ? { ...fn, text: newText } : fn) }
              : v
          ),
        }))
      },

      deleteFootnote: (chapter: number, verseNumber: number, marker: string) => {
        set(state => ({
          verses: state.verses.map(v =>
            v.chapter === chapter && v.number === verseNumber
              ? { ...v, footnotes: v.footnotes?.filter(fn => fn.marker !== marker) }
              : v
          ),
        }))
      },

      createSnapshot: (textWorkId: string, name?: string, type: 'submission' | 'internal' | 'publication' = 'internal') => {
        const now = new Date().toISOString()
        const state = get()
        const snapshot: Snapshot = {
          id: `snapshot-${Date.now()}`,
          textWorkId,
          type,
          name,
          createdAt: now,
          createdBy: state.currentUserId,
          verseTexts: state.verses.map(v => ({ chapter: v.chapter, number: v.number, text: v.text })),
          footnoteTexts: state.verses.flatMap(v =>
            (v.footnotes ?? []).map(fn => ({ chapter: v.chapter, verse: v.number, marker: fn.marker, text: fn.text }))
          ),
          sectionHeaderTexts: state.verses
            .filter(v => v.sectionHeader)
            .map(v => ({ chapter: v.chapter, verse: v.number, text: v.sectionHeader! })),
        }
        set(state => ({
          snapshots: [...state.snapshots, snapshot],
          activity: [
            {
              id: `act-${Date.now()}`,
              timestamp: now,
              userId: state.currentUserId,
              textWorkId,
              action: 'Tilannekuva luotu',
              detail: `Tilannekuva${name ? ` "${name}"` : ''} luotu`,
            },
            ...state.activity,
          ],
        }))
      },

      restoreSnapshot: (snapshotId: string) => {
        const state = get()
        const snapshot = state.snapshots.find(s => s.id === snapshotId)
        if (!snapshot) return

        set(state => ({
          verses: state.verses.map(v => {
            const sv = snapshot.verseTexts.find(sv => sv.chapter === v.chapter && sv.number === v.number)
            const sfn = snapshot.footnoteTexts.filter(f => f.chapter === v.chapter && f.verse === v.number)
            const sh = snapshot.sectionHeaderTexts.find(s => s.chapter === v.chapter && s.verse === v.number)
            return {
              ...v,
              text: sv ? sv.text : v.text,
              footnotes: sfn.length > 0
                ? sfn.map(f => ({ marker: f.marker, text: f.text, baseText: v.footnotes?.find(fn => fn.marker === f.marker)?.baseText ?? f.text }))
                : v.footnotes,
              sectionHeader: sh ? sh.text : v.sectionHeader,
            }
          }),
          activity: [
            {
              id: `act-${Date.now()}`,
              timestamp: new Date().toISOString(),
              userId: state.currentUserId,
              textWorkId: snapshot.textWorkId,
              action: 'Tilannekuva palautettu',
              detail: `Tilannekuva${snapshot.name ? ` "${snapshot.name}"` : ''} palautettu`,
            },
            ...state.activity,
          ],
        }))
      },

      viewSnapshot: (snapshotId: string | null) => {
        set({ viewingSnapshotId: snapshotId })
      },

      resetState: () => {
        set(initialState())
      },

      loadDemoData: () => {
        set(demoState())
      },
    }),
    {
      name: 'raamattu-kaannostyo',
      version: 29,
      migrate: () => initialState(),
    }
  )
)
