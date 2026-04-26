import { ProposalStatus, PersonaRole } from './types'

// Forward transitions: who can advance to the next state
const FORWARD_TRANSITIONS: Record<ProposalStatus, { next: ProposalStatus; allowedRoles: PersonaRole[] } | null> = {
  luonnos: { next: 'ehdotettu', allowedRoles: ['kaantaja'] },
  ehdotettu: { next: 'hyvaksytty_lopullisesti', allowedRoles: ['hallitus'] },
  hyvaksytty_lopullisesti: null, // terminal
}

// Send-back transitions: who can send back and where it goes
const SEND_BACK_TRANSITIONS: Record<ProposalStatus, { prev: ProposalStatus; allowedRoles: PersonaRole[] } | null> = {
  luonnos: null,
  ehdotettu: { prev: 'luonnos', allowedRoles: ['hallitus'] },
  hyvaksytty_lopullisesti: null,
}

export function canAdvance(status: ProposalStatus, role: PersonaRole): boolean {
  const transition = FORWARD_TRANSITIONS[status]
  return transition !== null && transition.allowedRoles.includes(role)
}

export function getNextStatus(status: ProposalStatus): ProposalStatus | null {
  return FORWARD_TRANSITIONS[status]?.next ?? null
}

export function canSendBack(status: ProposalStatus, role: PersonaRole): boolean {
  const transition = SEND_BACK_TRANSITIONS[status]
  return transition !== null && transition.allowedRoles.includes(role)
}

export function getSendBackStatus(status: ProposalStatus): ProposalStatus | null {
  return SEND_BACK_TRANSITIONS[status]?.prev ?? null
}

export function getAdvanceLabel(status: ProposalStatus): string {
  switch (status) {
    case 'luonnos': return 'Lähetä ehdotukseksi'
    case 'ehdotettu': return 'Hyväksy'
    default: return ''
  }
}

export function getSendBackLabel(status: ProposalStatus): string {
  switch (status) {
    case 'ehdotettu': return 'Palauta luonnokseksi'
    default: return ''
  }
}
