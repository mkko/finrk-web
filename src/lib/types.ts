export type PersonaRole = 'tekstiryhma' | 'seurantaryhma' | 'hallitus'

export interface User {
  id: string
  name: string
  roles: PersonaRole[]
  roleLabel: string
}

export function hasRole(user: User | undefined, role: PersonaRole): boolean {
  return !!user && user.roles.includes(role)
}

export function primaryRole(user: User): PersonaRole {
  return user.roles[0]
}

export type TextWorkStatus =
  | 'luonnos'
  | 'julkaistu_palautteelle'
  | 'lahetetty_hallitukselle'
  | 'hyvaksytty'
  | 'hylatty'

export const STATUS_LABELS: Record<TextWorkStatus, string> = {
  luonnos: 'Luonnos',
  julkaistu_palautteelle: 'Julkaistu palautteelle',
  lahetetty_hallitukselle: 'Lähetetty hallitukselle',
  hyvaksytty: 'Hyväksytty',
  hylatty: 'Hylätty',
}

export const STATUS_COLORS: Record<TextWorkStatus, string> = {
  luonnos: 'bg-gray-100 text-gray-700 border-gray-300',
  julkaistu_palautteelle: 'bg-amber-50 text-amber-800 border-amber-300',
  lahetetty_hallitukselle: 'bg-violet-50 text-violet-800 border-violet-300',
  hyvaksytty: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  hylatty: 'bg-red-50 text-red-800 border-red-300',
}

export const STATUS_INDICATOR_COLORS: Record<TextWorkStatus, string> = {
  luonnos: 'bg-gray-400',
  julkaistu_palautteelle: 'bg-amber-500',
  lahetetty_hallitukselle: 'bg-violet-500',
  hyvaksytty: 'bg-emerald-600',
  hylatty: 'bg-red-500',
}

export interface TextWork {
  id: string
  scope: { book: string; chapter?: number }
  status: TextWorkStatus
  statusChangedAt: string
  publishedForFeedbackAt?: string
  submittedToHallitusAt?: string
  submissionProposalId?: string
}

export interface Vote {
  userId: string
  decision: 'approve' | 'reject'
  comment?: string
  createdAt: string
}

export interface Proposal {
  id: string
  textWorkId: string
  snapshotId: string
  selectedVoters: string[]
  selectedVerses?: number[]
  rationale: string
  votes: Vote[]
  createdAt: string
  resolvedAt?: string
  cancelledAt?: string
}

export interface Comment {
  id: string
  parentId?: string
  textWorkId: string
  verseAnchor: { chapter: number; verseStart: number; verseEnd?: number }
  verseSnapshot: string
  authorId: string
  text: string
  thread: 'tekstiryhma' | 'seurantaryhma' | 'hallitus'
  status: 'avoin' | 'kasitelty'
  resolvedBy?: string
  resolvedAt?: string
  createdAt: string
}

export interface Merkinta {
  id: string
  verses: { chapter: number; verseNumber: number; text: string }[]
  authorId: string
  note?: string
  createdAt: string
}

export interface Footnote {
  marker: string
  text: string
  baseText: string
}

export interface Verse {
  chapter: number
  number: number
  text: string
  baseText: string
  approvedText: string
  sectionHeader?: string
  footnotes?: Footnote[]
}

export interface Snapshot {
  id: string
  textWorkId: string
  type: 'submission' | 'internal' | 'publication'
  name?: string
  createdAt: string
  createdBy: string
  verseTexts: { chapter: number; number: number; text: string }[]
  footnoteTexts: { chapter: number; verse: number; marker: string; text: string }[]
  sectionHeaderTexts: { chapter: number; verse: number; text: string }[]
}

export function applySnapshot(verses: Verse[], snapshot: Snapshot): Verse[] {
  return verses.map(v => {
    const sv = snapshot.verseTexts.find(s => s.chapter === v.chapter && s.number === v.number)
    return sv ? { ...v, text: sv.text } : v
  })
}

export interface ActivityEntry {
  id: string
  timestamp: string
  userId: string
  textWorkId: string
  action: string
  detail: string
}

export function textWorkLabel(tw: TextWork): string {
  const bookLabels: Record<string, string> = {
    '1Thess': '1. Tessalonikalaiskirje',
    'Phil': 'Filippiläiskirje',
    'Gal': 'Galatalaiskirje',
    'Eph': 'Efesolaiskirje',
    'Col': 'Kolossalaiskirje',
    '1Tim': '1. Timoteuskirje',
    '2Tim': '2. Timoteuskirje',
    'Rom': 'Roomalaiskirje',
  }
  const bookLabel = bookLabels[tw.scope.book] ?? tw.scope.book
  if (tw.scope.chapter) {
    return `${bookLabel} luku ${tw.scope.chapter}`
  }
  return bookLabel
}

export interface AppState {
  currentUserId: string
  users: User[]
  verses: Verse[]
  textWorks: TextWork[]
  proposals: Proposal[]
  comments: Comment[]
  merkinnat: Merkinta[]
  activity: ActivityEntry[]
  snapshots: Snapshot[]
  viewingSnapshotId: string | null
  setCurrentUser: (userId: string) => void
  editVerse: (chapter: number, verseNumber: number, newText: string) => void
  publishDraft: () => void
  updateTextWorkStatus: (textWorkId: string, newStatus: TextWorkStatus) => void
  submitToHallitus: (textWorkId: string, selectedVoters: string[], rationale: string, selectedVerses?: number[]) => void
  castVote: (proposalId: string, decision: 'approve' | 'reject', comment?: string) => void
  cancelProposal: (proposalId: string) => void
  updateSelectedVoters: (proposalId: string, voterIds: string[]) => void
  addComment: (comment: Omit<Comment, 'id' | 'createdAt' | 'status'>) => void
  resolveComment: (commentId: string) => void
  addMerkinta: (verses: { chapter: number; verseNumber: number; text: string }[], note?: string) => void
  updateMerkintaNote: (id: string, note: string) => void
  deleteMerkinta: (id: string) => void
  addFootnote: (chapter: number, verseNumber: number, text: string) => void
  editSectionHeader: (chapter: number, verseNumber: number, newText: string) => void
  editFootnote: (chapter: number, verseNumber: number, marker: string, newText: string) => void
  deleteFootnote: (chapter: number, verseNumber: number, marker: string) => void
  createSnapshot: (textWorkId: string, name?: string, type?: 'submission' | 'internal' | 'publication') => void
  restoreSnapshot: (snapshotId: string) => void
  viewSnapshot: (snapshotId: string | null) => void
  resetState: () => void
  loadDemoData: () => void
}
