'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AppState, Proposal, ProposalStatus } from './types'
import { SEED_USERS, SEED_VERSES, SEED_PROPOSALS, SEED_ACTIVITY } from './seed-data'

function getInitialVerses() {
  // Apply ratified proposals to verse text
  const verses = SEED_VERSES.map(v => ({ ...v }))
  for (const p of SEED_PROPOSALS) {
    if (p.status === 'hyvaksytty_lopullisesti') {
      if (p.verseStart === p.verseEnd) {
        const verse = verses.find(v => v.number === p.verseStart)
        if (verse) verse.text = p.proposedText
      } else {
        // Multi-verse: replace first verse with full proposed text, blank the rest
        for (let i = p.verseStart; i <= p.verseEnd; i++) {
          const verse = verses.find(v => v.number === i)
          if (verse) {
            verse.text = i === p.verseStart ? p.proposedText : ''
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
        set(state => ({
          proposals: [...state.proposals, newProposal],
          activity: [
            {
              id: `act-${Date.now()}`,
              timestamp: now,
              userId: state.currentUserId,
              proposalId: id,
              action: 'Uusi ehdotus',
              detail: `${proposal.verseStart === proposal.verseEnd ? `Jae ${proposal.verseStart}` : `Jakeet ${proposal.verseStart}–${proposal.verseEnd}`} — uusi ehdotus luotu`,
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
                  isSendBack: newStatus === 'keskustelussa' && (p.status === 'seurantaryhman_arvioitavana' || p.status === 'hyvaksytty_tyoryhmassa'),
                },
              ]
            }

            return updated
          })

          const proposal = state.proposals.find(p => p.id === proposalId)!
          const verseRef = proposal.verseStart === proposal.verseEnd
            ? `Jae ${proposal.verseStart}`
            : `Jakeet ${proposal.verseStart}–${proposal.verseEnd}`

          const statusLabels: Record<ProposalStatus, string> = {
            luonnos: 'Luonnos',
            keskustelussa: 'Palautettu keskusteluun',
            seurantaryhman_arvioitavana: 'Siirretty seurantaryhmälle',
            hyvaksytty_tyoryhmassa: 'Hyväksytty työryhmässä',
            hyvaksytty_lopullisesti: 'Hyväksytty lopullisesti',
          }

          let verses = state.verses
          if (newStatus === 'hyvaksytty_lopullisesti') {
            verses = state.verses.map(v => {
              if (v.number >= proposal.verseStart && v.number <= proposal.verseEnd) {
                if (proposal.verseStart === proposal.verseEnd) {
                  return { ...v, text: proposal.proposedText }
                }
                // Multi-verse: first verse gets full text, rest blanked
                return { ...v, text: v.number === proposal.verseStart ? proposal.proposedText : '' }
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
          const verseRef = proposal.verseStart === proposal.verseEnd
            ? `Jae ${proposal.verseStart}`
            : `Jakeet ${proposal.verseStart}–${proposal.verseEnd}`
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
    }),
    {
      name: 'raamattu-kaannostyo',
    }
  )
)
