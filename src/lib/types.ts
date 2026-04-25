export type PersonaRole = 'kaantaja' | 'seurantaryhma' | 'hallitus'

export interface User {
  id: string
  name: string
  role: PersonaRole
  roleLabel: string
}

export type ProposalStatus =
  | 'luonnos'
  | 'keskustelussa'
  | 'seurantaryhman_arvioitavana'
  | 'hyvaksytty_tyoryhmassa'
  | 'hyvaksytty_lopullisesti'

export const STATUS_LABELS: Record<ProposalStatus, string> = {
  luonnos: 'Luonnos',
  keskustelussa: 'Keskustelussa',
  seurantaryhman_arvioitavana: 'Seurantaryhmän arvioitavana',
  hyvaksytty_tyoryhmassa: 'Hyväksytty työryhmässä',
  hyvaksytty_lopullisesti: 'Hyväksytty lopullisesti',
}

export const STATUS_COLORS: Record<ProposalStatus, string> = {
  luonnos: 'bg-gray-100 text-gray-700 border-gray-300',
  keskustelussa: 'bg-amber-50 text-amber-800 border-amber-300',
  seurantaryhman_arvioitavana: 'bg-blue-50 text-blue-800 border-blue-300',
  hyvaksytty_tyoryhmassa: 'bg-violet-50 text-violet-800 border-violet-300',
  hyvaksytty_lopullisesti: 'bg-emerald-50 text-emerald-800 border-emerald-300',
}

export const STATUS_INDICATOR_COLORS: Record<ProposalStatus, string> = {
  luonnos: 'bg-gray-400',
  keskustelussa: 'bg-amber-500',
  seurantaryhman_arvioitavana: 'bg-blue-500',
  hyvaksytty_tyoryhmassa: 'bg-violet-500',
  hyvaksytty_lopullisesti: 'bg-emerald-600',
}

export interface Comment {
  id: string
  authorId: string
  text: string
  createdAt: string
  isSendBack?: boolean
}

export interface ProposalRange {
  verseStart: number
  verseEnd: number
  proposedText: string
}

export interface Proposal {
  id: string
  ranges: ProposalRange[]
  rationale: string
  authorId: string
  status: ProposalStatus
  comments: Comment[]
  createdAt: string
  statusChangedAt: string
}

export function proposalVerseRef(proposal: Proposal): string {
  if (proposal.ranges.length === 1) {
    const r = proposal.ranges[0]
    return r.verseStart === r.verseEnd
      ? `Jae ${r.verseStart}`
      : `Jakeet ${r.verseStart}–${r.verseEnd}`
  }
  return `Jakeet ${proposal.ranges.map(r => r.verseStart).join(', ')}`
}

export function proposalCoversVerse(proposal: Proposal, verseNum: number): boolean {
  return proposal.ranges.some(r => verseNum >= r.verseStart && verseNum <= r.verseEnd)
}

export interface Verse {
  number: number
  text: string
  baseText: string // Original RK12 text
}

export interface ActivityEntry {
  id: string
  timestamp: string
  userId: string
  proposalId: string
  action: string
  detail: string
}

export interface AppState {
  currentUserId: string
  users: User[]
  verses: Verse[]
  proposals: Proposal[]
  activity: ActivityEntry[]
  setCurrentUser: (userId: string) => void
  addProposal: (proposal: Omit<Proposal, 'id' | 'createdAt' | 'statusChangedAt' | 'comments'>) => void
  updateProposalStatus: (proposalId: string, newStatus: ProposalStatus, comment?: string) => void
  addComment: (proposalId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => void
  addBatchFeedback: (text: string) => void
  resetState: () => void
}
