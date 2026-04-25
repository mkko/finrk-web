'use client'

import { Suspense } from 'react'
import { ChapterView } from '@/components/chapter/ChapterView'

export default function Home() {
  return (
    <Suspense>
      <ChapterView />
    </Suspense>
  )
}
