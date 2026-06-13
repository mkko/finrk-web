import { TextWork, Comment, Snapshot, Verse, PersonaRole } from './types'
import { getVisibleStatuses } from './state-machine'

export function getVisibleTextWorks(textWorks: TextWork[], roles: PersonaRole | PersonaRole[]): TextWork[] {
  const statuses = getVisibleStatuses(roles)
  return textWorks.filter(tw => statuses.includes(tw.status))
}

export function getTextWorkComments(comments: Comment[], textWorkId: string): Comment[] {
  return comments.filter(c => c.textWorkId === textWorkId)
}

export function getOpenCommentCount(comments: Comment[], textWorkId: string): number {
  return comments.filter(c => c.textWorkId === textWorkId && c.status === 'avoin').length
}

export function getCurrentTextWork(textWorks: TextWork[]): TextWork | undefined {
  return textWorks.find(tw => tw.scope.book === '1Thess' && tw.scope.chapter === 2)
}

export function getVerseComments(comments: Comment[], textWorkId: string, verseNumber: number): Comment[] {
  return comments.filter(
    c => c.textWorkId === textWorkId && c.verseAnchor.verseStart === verseNumber
  )
}

/** Most recent publication or submission snapshot for a TextWork */
export function getPublishedSnapshot(snapshots: Snapshot[], textWorkId: string): Snapshot | undefined {
  return snapshots
    .filter(s => s.textWorkId === textWorkId && (s.type === 'publication' || s.type === 'submission'))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
}

/** True when current verse text differs from the published snapshot */
export function hasDraft(verses: Verse[], publishedSnapshot: Snapshot | undefined): boolean {
  if (!publishedSnapshot) return false
  return verses.some(v => {
    const sv = publishedSnapshot.verseTexts.find(sv => sv.number === v.number)
    return sv ? sv.text !== v.text : false
  })
}
