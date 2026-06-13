'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { STATUS_LABELS, STATUS_COLORS, textWorkLabel } from '@/lib/types'
import { getVisibleTextWorks, getOpenCommentCount, getTextWorkComments } from '@/lib/selectors'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { MessageSquare } from 'lucide-react'

export default function SeurantaryhmaPage() {
  const router = useRouter()
  const { textWorks, comments, users, currentUserId } = useStore()
  const currentUser = users.find(u => u.id === currentUserId)
  if (!currentUser) return null

  if (!currentUser.roles.includes('seurantaryhma')) {
    return (
      <div className="h-full overflow-y-auto"><div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <p className="text-stone-500">Tämä näkymä on tarkoitettu seurantaryhmän jäsenille.</p>
      </div></div>
    )
  }

  const publishedTws = textWorks.filter(tw => tw.status === 'julkaistu_palautteelle')

  return (
    <div className="h-full overflow-y-auto"><div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <h1 className="text-xl font-semibold text-stone-800 mb-2">Seurantaryhmän arviointi</h1>
      <p className="text-sm text-stone-500 mb-6">
        Alla olevat tekstit ovat julkaistu palautteelle.
      </p>

      {publishedTws.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          Ei arvioitavia tekstejä tällä hetkellä.
        </div>
      ) : (
        <div className="space-y-4">
          {publishedTws.map(tw => {
            const openCount = getOpenCommentCount(comments, tw.id)
            const myComments = getTextWorkComments(comments, tw.id).filter(
              c => c.authorId === currentUserId
            )
            const hasCommented = myComments.length > 0
            const publishDate = tw.publishedForFeedbackAt
              ? new Date(tw.publishedForFeedbackAt).toLocaleDateString('fi-FI', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : '—'

            return (
              <div
                key={tw.id}
                className={cn(
                  'bg-white rounded-lg border border-stone-200 px-6 py-4 flex items-center justify-between',
                  tw.scope.chapter === 2 && 'cursor-pointer hover:bg-stone-50 transition-colors'
                )}
                onClick={() => tw.scope.chapter === 2 && router.push('/')}
              >
                <div>
                  <h3 className="font-medium text-stone-800">{textWorkLabel(tw)}</h3>
                  <p className="text-sm text-stone-500 mt-0.5">
                    Julkaistu {publishDate}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {openCount > 0 && (
                    <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                      {openCount} avointa
                    </span>
                  )}
                  {hasCommented && (
                    <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      Kommentoitu
                    </span>
                  )}
                  <Badge variant="outline" className={cn('text-xs', STATUS_COLORS[tw.status])}>
                    {STATUS_LABELS[tw.status]}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div></div>
  )
}
