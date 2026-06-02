'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AppState, AppVersion, Proposal, ProposalStatus, Vote, Merkinta, Snapshot, proposalVerseRef } from './types'
import { SEED_USERS, SEED_VERSES, SEED_PROPOSALS, SEED_ACTIVITY, SEED_MERKINNAT, SEED_SNAPSHOTS } from './seed-data'

function getInitialVerses() {
  // Apply ratified proposals to verse text
  const verses = SEED_VERSES.map(v => ({ ...v }))
  for (const p of SEED_PROPOSALS) {
    if (p.status === 'hyvaksytty_lopullisesti') {
      for (const range of p.ranges) {
        for (let i = range.verseStart; i <= range.verseEnd; i++) {
          const verse = verses.find(v => v.number === i)
          if (verse) {
            verse.text = i === range.verseStart ? range.proposedText : ''
          }
        }
      }
    }
  }
  return verses
}

function initialState() {
  return {
    currentUserId: 'kaantaja-a',
    users: SEED_USERS,
    verses: SEED_VERSES.map(v => ({ ...v })),
    proposals: [] as typeof SEED_PROPOSALS,
    merkinnat: [] as Merkinta[],
    activity: [] as typeof SEED_ACTIVITY,
    snapshots: [] as Snapshot[],
    viewingSnapshotId: null as string | null,
    appVersion: '1.0' as AppVersion,
  }
}

function demoState() {
  return {
    currentUserId: 'kaantaja-a',
    users: SEED_USERS,
    verses: getInitialVerses(),
    proposals: [...SEED_PROPOSALS],
    merkinnat: [...SEED_MERKINNAT],
    activity: [...SEED_ACTIVITY],
    snapshots: [...SEED_SNAPSHOTS],
    viewingSnapshotId: null as string | null,
    appVersion: '1.0' as AppVersion,
  }
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState(),

      setCurrentUser: (userId: string) => set({ currentUserId: userId }),

      addProposal: (proposal) => {
        const id = `proposal-${Date.now()}`
        const now = new Date().toISOString()
        const newProposal: Proposal = {
          ...proposal,
          id,
          comments: [],
          votes: [],
          createdAt: now,
          statusChangedAt: now,
        }
        const r0 = proposal.ranges[0]
        const verseRef = proposal.ranges.length === 1
          ? (r0.verseStart === r0.verseEnd ? `Jae ${r0.verseStart}` : `Jakeet ${r0.verseStart}–${r0.verseEnd}`)
          : `Jakeet ${proposal.ranges.map(r => r.verseStart).join(', ')}`
        set(state => ({
          proposals: [...state.proposals, newProposal],
          activity: [
            {
              id: `act-${Date.now()}`,
              timestamp: now,
              userId: state.currentUserId,
              proposalId: id,
              action: 'Uusi ehdotus',
              detail: `${verseRef} — uusi ehdotus luotu`,
            },
            ...state.activity,
          ],
        }))
      },

      updateProposalStatus: (proposalId: string, newStatus: ProposalStatus, comment?: string) => {
        const now = new Date().toISOString()
        set(state => {
          const proposals = state.proposals.map(p => {
            if (p.id !== proposalId) return p
            const updated = { ...p, status: newStatus, statusChangedAt: now, votes: [] as Vote[] }
            if (comment) {
              updated.comments = [
                ...p.comments,
                {
                  id: `comment-${Date.now()}`,
                  authorId: state.currentUserId,
                  text: comment,
                  createdAt: now,
                  thread: 'main' as const,
                },
              ]
            }

            return updated
          })

          const proposal = state.proposals.find(p => p.id === proposalId)!
          const verseRef = proposalVerseRef(proposal)

          const statusLabels: Record<ProposalStatus, string> = {
            luonnos: 'Palautettu luonnokseksi',
            ehdotettu: 'Lähetetty ehdotukseksi',
            hallituksen_kasittelyssa: 'Otettu käsittelyyn',
            hyvaksytty_lopullisesti: 'Hyväksytty lopullisesti',
          }

          let verses = state.verses
          if (newStatus === 'hyvaksytty_lopullisesti') {
            verses = state.verses.map(v => {
              for (const range of proposal.ranges) {
                if (v.number >= range.verseStart && v.number <= range.verseEnd) {
                  return { ...v, text: v.number === range.verseStart ? range.proposedText : '' }
                }
              }
              return v
            })
          }

          return {
            proposals,
            verses,
            activity: [
              {
                id: `act-${Date.now()}`,
                timestamp: now,
                userId: state.currentUserId,
                proposalId,
                action: statusLabels[newStatus],
                detail: `${verseRef} — ${statusLabels[newStatus].toLowerCase()}`,
              },
              ...state.activity,
            ],
          }
        })
      },

      castVote: (proposalId: string, decision: 'approve' | 'reject', comment?: string) => {
        const now = new Date().toISOString()
        set(state => {
          const proposal = state.proposals.find(p => p.id === proposalId)
          if (!proposal || proposal.status !== 'hallituksen_kasittelyssa') return state

          // Don't allow duplicate votes
          if (proposal.votes.some(v => v.userId === state.currentUserId)) return state

          const newVote: Vote = {
            userId: state.currentUserId,
            decision,
            comment,
            createdAt: now,
          }
          const updatedVotes = [...proposal.votes, newVote]

          const hallitusMembers = state.users.filter(u => u.role === 'hallitus')
          const allVoted = hallitusMembers.every(m => updatedVotes.some(v => v.userId === m.id))

          if (!allVoted) {
            // Just record the vote, no status change yet
            return {
              proposals: state.proposals.map(p =>
                p.id === proposalId ? { ...p, votes: updatedVotes } : p
              ),
              activity: [
                {
                  id: `act-${Date.now()}`,
                  timestamp: now,
                  userId: state.currentUserId,
                  proposalId,
                  action: 'Äänestetty',
                  detail: `${proposalVerseRef(proposal)} — ääni annettu`,
                },
                ...state.activity,
              ],
            }
          }

          // All voted — tally
          const allApproved = updatedVotes.every(v => v.decision === 'approve')

          if (allApproved) {
            // Unanimous approval
            const verses = state.verses.map(v => {
              for (const range of proposal.ranges) {
                if (v.number >= range.verseStart && v.number <= range.verseEnd) {
                  return { ...v, text: v.number === range.verseStart ? range.proposedText : '' }
                }
              }
              return v
            })
            return {
              proposals: state.proposals.map(p =>
                p.id === proposalId
                  ? { ...p, status: 'hyvaksytty_lopullisesti' as const, statusChangedAt: now, votes: updatedVotes }
                  : p
              ),
              verses,
              activity: [
                {
                  id: `act-${Date.now()}`,
                  timestamp: now,
                  userId: state.currentUserId,
                  proposalId,
                  action: 'Hyväksytty lopullisesti',
                  detail: `${proposalVerseRef(proposal)} — hallitus hyväksyi yksimielisesti`,
                },
                ...state.activity,
              ],
            }
          } else {
            // At least one rejection — add rejection comments to main thread and reset to luonnos
            const rejectionComments = updatedVotes
              .filter(v => v.decision === 'reject' && v.comment)
              .map((v, i) => {
                const voter = state.users.find(u => u.id === v.userId)
                return {
                  id: `comment-${Date.now()}-${i}`,
                  authorId: v.userId,
                  text: `[Hallituksen palautus] ${voter?.name ?? 'Tuntematon'}: ${v.comment}`,
                  createdAt: now,
                  thread: 'main' as const,
                }
              })
            return {
              proposals: state.proposals.map(p =>
                p.id === proposalId
                  ? {
                      ...p,
                      status: 'luonnos' as const,
                      statusChangedAt: now,
                      votes: [],
                      comments: [...p.comments, ...rejectionComments],
                    }
                  : p
              ),
              activity: [
                {
                  id: `act-${Date.now()}`,
                  timestamp: now,
                  userId: state.currentUserId,
                  proposalId,
                  action: 'Palautettu luonnokseksi',
                  detail: `${proposalVerseRef(proposal)} — hallitus palautti ehdotuksen`,
                },
                ...state.activity,
              ],
            }
          }
        })
      },

      addComment: (proposalId: string, comment) => {
        const now = new Date().toISOString()
        set(state => {
          const proposal = state.proposals.find(p => p.id === proposalId)!
          const verseRef = proposalVerseRef(proposal)
          return {
            proposals: state.proposals.map(p =>
              p.id === proposalId
                ? {
                    ...p,
                    comments: [
                      ...p.comments,
                      { ...comment, id: `comment-${Date.now()}`, createdAt: now },
                    ],
                  }
                : p
            ),
            activity: [
              {
                id: `act-${Date.now()}`,
                timestamp: now,
                userId: state.currentUserId,
                proposalId,
                action: 'Uusi kommentti',
                detail: `${verseRef} — uusi kommentti`,
              },
              ...state.activity,
            ],
          }
        })
      },

      addBatchFeedback: (text: string) => {
        const now = new Date().toISOString()
        set(state => ({
          activity: [
            {
              id: `act-${Date.now()}`,
              timestamp: now,
              userId: state.currentUserId,
              proposalId: '',
              action: 'Seurantaryhmän kokonaispalaute',
              detail: text,
            },
            ...state.activity,
          ],
        }))
      },

      addMerkinta: (verses: { verseNumber: number; text: string }[], note?: string) => {
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

      createSnapshot: (name: string) => {
        const now = new Date().toISOString()
        const state = get()
        const approvedIds = state.proposals
          .filter(p => p.status === 'hyvaksytty_lopullisesti')
          .map(p => p.id)
        // Include proposals already captured in previous snapshots
        const previouslyIncluded = state.snapshots.flatMap(s => s.includedProposalIds)
        const allIncluded = [...new Set([...previouslyIncluded, ...approvedIds])]

        const snapshot: Snapshot = {
          id: `snapshot-${Date.now()}`,
          name,
          createdAt: now,
          createdBy: state.currentUserId,
          verseTexts: state.verses.map(v => ({ number: v.number, text: v.text })),
          includedProposalIds: allIncluded,
        }
        set(state => ({
          snapshots: [...state.snapshots, snapshot],
          activity: [
            {
              id: `act-${Date.now()}`,
              timestamp: now,
              userId: state.currentUserId,
              proposalId: '',
              action: 'Tilannekuva luotu',
              detail: `Tilannekuva "${name}" — ${approvedIds.length} hyväksyttyä ehdotusta`,
            },
            ...state.activity,
          ],
        }))
      },

      viewSnapshot: (snapshotId: string | null) => {
        set({ viewingSnapshotId: snapshotId })
      },

      setAppVersion: (version: AppVersion) => {
        set({ appVersion: version })
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
      version: 12,
      migrate: () => initialState(),
    }
  )
)
