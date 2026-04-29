import { ProposalStatus, PersonaRole } from './types'

// Forward transitions: who can advance to the next state
const FORWARD_TRANSITIONS: Record<ProposalStatus, { next: ProposalStatus; allowedRoles: PersonaRole[] } | null> = {
  luonnos: { next: 'ehdotettu', allowedRoles: ['kaantaja'] },
  ehdotettu: { next: 'hallituksen_kasittelyssa', allowedRoles: ['hallitus'] },
  hallituksen_kasittelyssa: null, // resolved by voting, not manual advance
  hyvaksytty_lopullisesti: null, // terminal
}

// Send-back transitions: who can send back and where it goes
const SEND_BACK_TRANSITIONS: Record<ProposalStatus, { prev: ProposalStatus; allowedRoles: PersonaRole[] } | null> = {
  luonnos: null,
  ehdotettu: null, // rejection now goes through voting
  hallituksen_kasittelyssa: null, // resolved by voting
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
    case 'ehdotettu': return 'Aloita käsittely'
    default: return ''
  }
}

export function getSendBackLabel(status: ProposalStatus): string {
  switch (status) {
    default: return ''
  }
}
