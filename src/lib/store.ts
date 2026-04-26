'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AppState, Proposal, ProposalStatus, proposalVerseRef } from './types'
import { SEED_USERS, SEED_VERSES, SEED_PROPOSALS, SEED_ACTIVITY } from './seed-data'

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
    currentUserId: 'aimo',
    users: SEED_USERS,
    verses: SEED_VERSES.map(v => ({ ...v })),
    proposals: [] as typeof SEED_PROPOSALS,
    activity: [] as typeof SEED_ACTIVITY,
  }
}

function demoState() {
  return {
    currentUserId: 'aimo',
    users: SEED_USERS,
    verses: getInitialVerses(),
    proposals: [...SEED_PROPOSALS],
    activity: [...SEED_ACTIVITY],
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
            const updated = { ...p, status: newStatus, statusChangedAt: now }
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

      resetState: () => {
        set(initialState())
      },

      loadDemoData: () => {
        set(demoState())
      },
    }),
    {
      name: 'raamattu-kaannostyo',
      version: 4,
      migrate: () => initialState(),
    }
  )
)
