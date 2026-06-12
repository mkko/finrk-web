import { TextWork, Comment, PersonaRole } from './types'
import { getVisibleStatuses } from './state-machine'

export function getVisibleTextWorks(textWorks: TextWork[], role: PersonaRole): TextWork[] {
  const statuses = getVisibleStatuses(role)
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
