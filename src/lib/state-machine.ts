import { TextWorkStatus, PersonaRole } from './types'

interface Transition {
  target: TextWorkStatus
  actors: PersonaRole[]
}

const TRANSITIONS: Record<TextWorkStatus, Transition[]> = {
  luonnos: [
    { target: 'julkaistu_palautteelle', actors: ['tekstiryhma'] },
  ],
  julkaistu_palautteelle: [
    { target: 'luonnos', actors: ['tekstiryhma'] },
    { target: 'lahetetty_hallitukselle', actors: ['tekstiryhma'] },
  ],
  lahetetty_hallitukselle: [
    // Resolved by voting, not manual transitions
  ],
  hyvaksytty: [],
  hylatty: [
    { target: 'luonnos', actors: ['tekstiryhma'] },
  ],
}

export function canTransition(status: TextWorkStatus, target: TextWorkStatus, role: PersonaRole): boolean {
  return TRANSITIONS[status].some(t => t.target === target && t.actors.includes(role))
}

export function getAvailableTransitions(status: TextWorkStatus, role: PersonaRole): TextWorkStatus[] {
  return TRANSITIONS[status]
    .filter(t => t.actors.includes(role))
    .map(t => t.target)
}

export function getTransitionLabel(from: TextWorkStatus, to: TextWorkStatus): string {
  if (from === 'luonnos' && to === 'julkaistu_palautteelle') return 'Julkaise palautteelle'
  if (from === 'julkaistu_palautteelle' && to === 'luonnos') return 'Vedä takaisin luonnokseksi'
  if (from === 'julkaistu_palautteelle' && to === 'lahetetty_hallitukselle') return 'Lähetä hallitukselle'
  if (from === 'hylatty' && to === 'luonnos') return 'Palauta luonnokseksi'
  return ''
}

export function canEditVerses(status: TextWorkStatus, role: PersonaRole): boolean {
  // Tekstiryhma can always edit — work continues even during review
  return role === 'tekstiryhma'
}

export function getVisibleStatuses(role: PersonaRole): TextWorkStatus[] {
  if (role === 'seurantaryhma') {
    return ['julkaistu_palautteelle', 'lahetetty_hallitukselle', 'hyvaksytty']
  }
  // tekstiryhma and hallitus see all
  return ['luonnos', 'julkaistu_palautteelle', 'lahetetty_hallitukselle', 'hyvaksytty', 'hylatty']
}
