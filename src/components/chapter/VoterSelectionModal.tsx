'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface VoterSelectionModalProps {
  open: boolean
  onClose: () => void
  textWorkId: string
  selectedVerses?: number[]
}

export function VoterSelectionModal({ open, onClose, textWorkId, selectedVerses }: VoterSelectionModalProps) {
  const users = useStore(s => s.users)
  const submitToHallitus = useStore(s => s.submitToHallitus)

  const hallitusUsers = users.filter(u => u.roles.includes('hallitus'))
  const [selectedVoters, setSelectedVoters] = useState<string[]>([])
  const [rationale, setRationale] = useState('')

  function toggleVoter(userId: string) {
    setSelectedVoters(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  function handleSubmit() {
    if (selectedVoters.length === 0) return
    submitToHallitus(textWorkId, selectedVoters, rationale.trim(), selectedVerses)
    setSelectedVoters([])
    setRationale('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lähetä hallitukselle</DialogTitle>
          <DialogDescription>
            Valitse hallituksen jäsenet, joilta pyydät äänen. Vähintään yksi äänestäjä vaaditaan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-stone-700">Äänestäjät</p>
            {hallitusUsers.map(user => (
              <label
                key={user.id}
                className="flex items-center gap-3 rounded-md border border-stone-200 px-3 py-2.5 cursor-pointer hover:bg-stone-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedVoters.includes(user.id)}
                  onChange={() => toggleVoter(user.id)}
                  className="h-4 w-4 rounded border-stone-300 text-stone-800 focus:ring-stone-500"
                />
                <span className="text-sm font-medium text-stone-700">{user.name}</span>
              </label>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-stone-700">Saate (valinnainen)</p>
            <Textarea
              placeholder="Perustele lähetys..."
              value={rationale}
              onChange={e => setRationale(e.target.value)}
              className="min-h-[80px] text-sm resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Peruuta
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedVoters.length === 0}
          >
            Lähetä
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
