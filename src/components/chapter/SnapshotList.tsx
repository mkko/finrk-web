'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface SnapshotListProps {
  open: boolean
  onClose: () => void
  textWorkId: string
}

export function SnapshotList({ open, onClose, textWorkId }: SnapshotListProps) {
  const snapshots = useStore(s => s.snapshots)
  const users = useStore(s => s.users)
  const restoreSnapshot = useStore(s => s.restoreSnapshot)
  const createSnapshot = useStore(s => s.createSnapshot)
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')

  const internalSnapshots = snapshots
    .filter(s => s.textWorkId === textWorkId && s.type === 'internal')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  function handleRestore(snapshotId: string) {
    restoreSnapshot(snapshotId)
    setConfirmRestore(null)
    onClose()
  }

  function handleCreate() {
    if (!newName.trim()) return
    createSnapshot(textWorkId, newName.trim(), 'internal')
    setNewName('')
    setShowCreate(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setConfirmRestore(null) } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Aiemmat versiot</DialogTitle>
          <DialogDescription>
            Aiemmat versiot tästä tekstistä. Voit palauttaa aikaisemman version.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          {!showCreate ? (
            <Button variant="outline" size="sm" onClick={() => setShowCreate(true)} className="w-full">
              Luo uusi tilannekuva
            </Button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder='Nimi, esim. "Ennen palautekierrosta"'
                className="flex-1 text-sm border border-stone-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>
                Luo
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setShowCreate(false); setNewName('') }}>
                Peruuta
              </Button>
            </div>
          )}

          {internalSnapshots.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-6">
              Ei vielä tilannekuvia.
            </p>
          ) : (
            <div className="divide-y divide-stone-100 border border-stone-200 rounded-lg overflow-hidden">
              {internalSnapshots.map(snapshot => {
                const creator = users.find(u => u.id === snapshot.createdBy)
                return (
                  <div key={snapshot.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-stone-800">{snapshot.name || 'Nimetön'}</p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {creator?.name ?? 'Tuntematon'}
                        {' — '}
                        {new Date(snapshot.createdAt).toLocaleDateString('fi-FI', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    {confirmRestore === snapshot.id ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => setConfirmRestore(null)}>
                          Peruuta
                        </Button>
                        <Button size="sm" onClick={() => handleRestore(snapshot.id)}>
                          Vahvista
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmRestore(snapshot.id)}
                      >
                        Palauta
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Sulje
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
