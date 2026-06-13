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

function matchesRole(actors: PersonaRole[], roles: PersonaRole | PersonaRole[]): boolean {
  const r = Array.isArray(roles) ? roles : [roles]
  return r.some(role => actors.includes(role))
}

export function canTransition(status: TextWorkStatus, target: TextWorkStatus, roles: PersonaRole | PersonaRole[]): boolean {
  return TRANSITIONS[status].some(t => t.target === target && matchesRole(t.actors, roles))
}

export function getAvailableTransitions(status: TextWorkStatus, roles: PersonaRole | PersonaRole[]): TextWorkStatus[] {
  return TRANSITIONS[status]
    .filter(t => matchesRole(t.actors, roles))
    .map(t => t.target)
}

export function getTransitionLabel(from: TextWorkStatus, to: TextWorkStatus): string {
  if (from === 'luonnos' && to === 'julkaistu_palautteelle') return 'Julkaise'
  if (from === 'julkaistu_palautteelle' && to === 'lahetetty_hallitukselle') return 'Lähetä hallitukselle'
  if (from === 'hylatty' && to === 'luonnos') return 'Palauta luonnokseksi'
  return ''
}

export function canEditVerses(status: TextWorkStatus, roles: PersonaRole | PersonaRole[]): boolean {
  const r = Array.isArray(roles) ? roles : [roles]
  return r.includes('tekstiryhma')
}

export function getVisibleStatuses(roles: PersonaRole | PersonaRole[]): TextWorkStatus[] {
  const r = Array.isArray(roles) ? roles : [roles]
  if (r.includes('tekstiryhma') || r.includes('hallitus')) {
    return ['luonnos', 'julkaistu_palautteelle', 'lahetetty_hallitukselle', 'hyvaksytty', 'hylatty']
  }
  if (r.includes('seurantaryhma')) {
    return ['julkaistu_palautteelle', 'lahetetty_hallitukselle', 'hyvaksytty']
  }
  return ['luonnos', 'julkaistu_palautteelle', 'lahetetty_hallitukselle', 'hyvaksytty', 'hylatty']
}
