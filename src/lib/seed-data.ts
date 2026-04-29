import { User, Verse, Proposal, ActivityEntry } from './types'

// TODO: Replace this placeholder text with the actual RK12 translation of 1. Tessalonikalaiskirje 2.
// Mikko will provide the real text before the demo. The verse count (20) and structure match the actual chapter.
export const SEED_VERSES: Verse[] = [
  {
    number: 1,
    baseText: 'Tiedättehän itsekin, veljet, että tulomme luoksenne ei ollut turha.',
    text: 'Tiedättehän itsekin, veljet, että tulomme luoksenne ei ollut turha.',
  },
  {
    number: 2,
    baseText: 'Olimme, kuten tiedätte, ennen joutuneet Filippissä kärsimään ja kestämään pahaa kohtelua, mutta Jumalamme antoi meille rohkeuden julistaa teille hänen evankeliumiaan kovienkin vastuksien keskellä.',
    text: 'Olimme, kuten tiedätte, ennen joutuneet Filippissä kärsimään ja kestämään pahaa kohtelua, mutta Jumalamme antoi meille rohkeuden julistaa teille hänen evankeliumiaan kovienkin vastuksien keskellä.',
  },
  {
    number: 3,
    baseText: 'Kehotuksemme ei näet johdu harhasta eikä epäpuhtaista vaikuttimista, emmekä yritä pettää ketään.',
    text: 'Kehotuksemme ei näet johdu harhasta eikä epäpuhtaista vaikuttimista, emmekä yritä pettää ketään.',
  },
  {
    number: 4,
    baseText: 'Jumala on hyväksynyt meidät ja uskonut meille evankeliumin, ja siksi me puhumme, emme ihmisten mielen mukaisesti vaan Jumalan, joka tutkii sydämemme.',
    text: 'Jumala on katsonut meidät kelvollisiksi ja uskonut meille evankeliumin, ja sen mukaisesti me puhumme — emme miellyttääksemme ihmisiä vaan Jumalaa, joka tutkii sydämemme.',
  },
  {
    number: 5,
    baseText: 'Emme ole koskaan puhuneet mielistellen, kuten tiedätte, emmekä peittäneet ahneuttamme — Jumala on todistajamme.',
    text: 'Emme ole koskaan puhuneet mielistellen, kuten tiedätte, emmekä peittäneet ahneuttamme — Jumala on todistajamme.',
  },
  {
    number: 6,
    baseText: 'Emme ole tavoitelleet kenenkään ylistystä, emme teidän emmekä muiden, vaikka olisimme Kristuksen apostoleina voineet vaatia arvonantoa.',
    text: 'Emme ole tavoitelleet kenenkään ylistystä, emme teidän emmekä muiden, vaikka olisimme Kristuksen apostoleina voineet vaatia arvonantoa.',
  },
  {
    number: 7,
    baseText: 'Mutta me olimme teidän keskuudessanne lempeät, niin kuin imettävä äiti hellästi hoivaa lapsiaan.',
    text: 'Mutta me olimme teidän keskuudessanne lempeät, niin kuin imettävä äiti hellästi hoivaa lapsiaan.',
  },
  {
    number: 8,
    baseText: 'Niin hellät tunteet meitä valtasivat, että halusimme antaa teille Jumalan evankeliumin lisäksi oman henkemme, koska olitte tulleet meille niin rakkaiksi.',
    text: 'Niin hellät tunteet meitä valtasivat, että halusimme antaa teille Jumalan evankeliumin lisäksi oman henkemme, koska olitte tulleet meille niin rakkaiksi.',
  },
  {
    number: 9,
    baseText: 'Muistattahan, veljet, meidän vaivannäkömme ja rasituksemme. Yötä päivää työtä tehden julistimme teille Jumalan evankeliumia, jotta emme olisi olleet kenellekään teistä rasituksena.',
    text: 'Muistattahan, veljet, meidän vaivannäkömme ja rasituksemme. Yötä päivää työtä tehden julistimme teille Jumalan evankeliumia, jotta emme olisi olleet kenellekään teistä rasituksena.',
  },
  {
    number: 10,
    baseText: 'Te olette todistajina, samoin Jumala, kuinka pyhästi, oikeamielisesti ja moitteettomasti me uskovia kohtaan vaelsimme.',
    text: 'Te olette todistajina, samoin Jumala, kuinka pyhästi, oikeamielisesti ja moitteettomasti me uskovia kohtaan vaelsimme.',
  },
  {
    number: 11,
    baseText: 'Tiedättehän, että olemme jokaista teistä kuin isä lapsiaan kehottaneet ja rohkaisseet',
    text: 'Tiedättehän, että olemme jokaista teistä kuin isä lapsiaan kehottaneet ja rohkaisseet',
  },
  {
    number: 12,
    baseText: 'ja vaatineet vaeltamaan Jumalan arvoisesti, hänen, joka kutsuu teidät valtakuntaansa ja kirkkauteensa.',
    text: 'ja vaatineet vaeltamaan Jumalan arvoisesti, hänen, joka kutsuu teidät valtakuntaansa ja kirkkauteensa.',
  },
  {
    number: 13,
    baseText: 'Sen vuoksi me myös lakkaamatta kiitämme Jumalaa siitä, että kun saitte meiltä Jumalan sanan, te ette ottaneet sitä vastaan ihmisten sanana vaan Jumalan sanana, jota se todellakin on ja joka myös vaikuttaa teissä, jotka uskotte.',
    text: 'Sen vuoksi me myös lakkaamatta kiitämme Jumalaa siitä, että kun saitte meiltä Jumalan sanan, te ette ottaneet sitä vastaan ihmisten sanana vaan Jumalan sanana, jota se todellakin on ja joka myös vaikuttaa teissä, jotka uskotte.',
  },
  {
    number: 14,
    baseText: 'Te olette näet, veljet, seuranneet Jumalan Kristuksessa Jeesuksessa olevia seurakuntia Juudeassa, sillä te olette saaneet kärsiä omalta kansaltanne samaa kuin hekin juutalaisilta,',
    text: 'Te olette näet, veljet, seuranneet Jumalan Kristuksessa Jeesuksessa olevia seurakuntia Juudeassa, sillä te olette saaneet kärsiä omalta kansaltanne samaa kuin hekin juutalaisilta,',
  },
  {
    number: 15,
    baseText: 'jotka tappoivat sekä Herran Jeesuksen että profeetat ja ovat vainonneet meitäkin eivätkä ole Jumalalle mieliksi ja ovat kaikkia ihmisiä vastaan.',
    text: 'jotka tappoivat sekä Herran Jeesuksen että profeetat ja ovat vainonneet meitäkin eivätkä ole Jumalalle mieliksi ja ovat kaikkia ihmisiä vastaan.',
  },
  {
    number: 16,
    baseText: 'He yrittävät estää meitä puhumasta pakanakansoille, että nämä pelastuisivat, ja niin he tekevät syntiensä mitan aina vain täyteen. Mutta viha on heidät vihdoin saavuttanut.',
    text: 'He yrittävät estää meitä puhumasta pakanakansoille, että nämä pelastuisivat, ja niin he tekevät syntiensä mitan aina vain täyteen. Mutta viha on heidät vihdoin saavuttanut.',
  },
  {
    number: 17,
    baseText: 'Me, veljet, jouduttuamme hetkeksi eroon teistä — tosin vain kasvoilta, emme sydämeltä — yritimme sitäkin suuremmalla kaipauksella innokkaasti päästä tapaamaan teitä.',
    text: 'Me, veljet, jouduttuamme hetkeksi eroon teistä — tosin vain kasvoilta, emme sydämeltä — yritimme sitäkin suuremmalla kaipauksella innokkaasti päästä tapaamaan teitä.',
  },
  {
    number: 18,
    baseText: 'Halusimme tulla luoksenne — minä Paavali kerran ja toisen kerran — mutta Saatana esti meidät.',
    text: 'Halusimme tulla luoksenne — minä Paavali kerran ja toisen kerran — mutta Saatana esti meidät.',
  },
  {
    number: 19,
    baseText: 'Sillä kuka on meidän toivomme, ilomme ja kerskauksemme seppele Herramme Jeesuksen edessä hänen tullessaan? Ettekö juuri te?',
    text: 'Sillä kuka on meidän toivomme, ilomme ja kerskauksemme seppele Herramme Jeesuksen edessä hänen tullessaan? Ettekö juuri te?',
  },
  {
    number: 20,
    baseText: 'Te olette meidän kunniamme ja ilomme.',
    text: 'Te olette meidän kunniamme ja ilomme.',
  },
]

export const SEED_USERS: User[] = [
  { id: 'kaantaja-a', name: 'Kääntäjä A', role: 'kaantaja', roleLabel: 'Kääntäjä' },
  { id: 'kaantaja-b', name: 'Kääntäjä B', role: 'kaantaja', roleLabel: 'Kääntäjä' },
  { id: 'seurantaryhma-a', name: 'Seurantaryhmän jäsen A', role: 'seurantaryhma', roleLabel: 'Seurantaryhmän jäsen' },
  { id: 'seurantaryhma-b', name: 'Seurantaryhmän jäsen B', role: 'seurantaryhma', roleLabel: 'Seurantaryhmän jäsen' },
  { id: 'hallitus-a', name: 'Hallituksen jäsen A', role: 'hallitus', roleLabel: 'Hallituksen jäsen' },
  { id: 'hallitus-b', name: 'Hallituksen jäsen B', role: 'hallitus', roleLabel: 'Hallituksen jäsen' },
  { id: 'hallitus-c', name: 'Hallituksen jäsen C', role: 'hallitus', roleLabel: 'Hallituksen jäsen' },
]

export const SEED_PROPOSALS: Proposal[] = [
  // Proposal A: verse 7 (nursing-mother simile), submitted as proposal
  {
    id: 'proposal-a',
    ranges: [{ verseStart: 7, verseEnd: 7, proposedText: 'Mutta me olimme teidän keskuudessanne lempeitä, niin kuin äiti hellään hoivaa pieniä lapsiaan.' }],
    rationale: 'Alkutekstin εἴπιος viittaa lempeään, hoivaavaan asenteeseen. Nykyinen "imettävä äiti" on turhan konkreettinen — "äiti hellään hoivaa" säilyttää metaforan lämmön mutta sopii paremmin nykysuomeen.',
    authorId: 'kaantaja-a',
    status: 'ehdotettu',
    votes: [],
    comments: [
      {
        id: 'comment-1',
        authorId: 'kaantaja-b',
        text: 'Sanavalinta "hellään hoivaa" tuntuu luontevalta. Mutta pitäisikö "pieniä lapsiaan" olla vain "lapsiaan"? Alkutekstissä ei korosteta lasten pienuutta.',
        createdAt: '2026-04-20T10:15:00Z',
        thread: 'main',
      },
      {
        id: 'comment-2',
        authorId: 'kaantaja-a',
        text: 'Hyvä huomio. "Pieniä" tuo kyllä imeväisajatuksen takaisin. Ehkä pelkkä "lapsiaan" riittää.',
        createdAt: '2026-04-20T14:30:00Z',
        thread: 'main',
      },
    ],
    createdAt: '2026-04-19T09:00:00Z',
    statusChangedAt: '2026-04-19T09:00:00Z',
  },
  // Proposal B: verses 9–10 (working night and day), submitted as proposal
  {
    id: 'proposal-b',
    ranges: [{ verseStart: 9, verseEnd: 10, proposedText: 'Muistattahan, veljet, meidän vaivannäkömme ja uurauksemme. Yötä päivää ahkeroiden julistimme teille Jumalan evankeliumia, jottei kukaan teistä joutuisi meitä elättämään. Te olette todistajina, samoin Jumala, kuinka pyhästi, oikeamielisesti ja nuhteettomasti me uskovia kohtaan elimme.' }],
    rationale: 'Kaksi muutosta: (1) "rasituksemme" → "uurauksemme" kuvaa paremmin vapaaehtoista uhrautumista; (2) "vaelsimme" → "elimme" on nykysuomessa luontevampi — "vaeltaminen" elämäntapana on vanhahtava.',
    authorId: 'kaantaja-b',
    status: 'ehdotettu',
    votes: [],
    comments: [
      {
        id: 'comment-3',
        authorId: 'kaantaja-b',
        text: '"Elimme" on selkeä parannus. "Uurauksemme" sen sijaan on hieman harvinainen sana — ymmärtävätkö kaikki lukijat sen? Entä "ponnisteluamme"?',
        createdAt: '2026-04-22T11:00:00Z',
        thread: 'main',
      },
      {
        id: 'comment-3s',
        authorId: 'seurantaryhma-a',
        text: '"Uurauksemme" on harvinainen — harkitkaa "ponnisteluamme" tai "vaivannäköämme".',
        createdAt: '2026-04-23T09:00:00Z',
        thread: 'seurantaryhma',
      },
    ],
    createdAt: '2026-04-17T14:00:00Z',
    statusChangedAt: '2026-04-21T08:00:00Z',
  },
  // Proposal C: verse 13 (God's word at work), submitted as proposal (hallitus can act on it)
  {
    id: 'proposal-c',
    ranges: [{ verseStart: 13, verseEnd: 13, proposedText: 'Sen vuoksi me myös lakkaamatta kiitämme Jumalaa siitä, että vastaanotettuanne meiltä Jumalan sanan ette ottaneet sitä vastaan ihmisten sanana vaan Jumalan sanana, joka se todellakin on. Tämä sana myös vaikuttaa teissä, jotka uskotte.' }],
    rationale: 'Lause on alkutekstissä pitkä ja monipolvinen. Ehdotus jakaa sen kahteen virkkeeseen lukemisen helpottamiseksi. "Vastaanotettuanne" on tarkempi käännös kreikan δεξάμενοι-partisiipista.',
    authorId: 'kaantaja-a',
    status: 'hallituksen_kasittelyssa',
    votes: [
      { userId: 'hallitus-a', decision: 'approve', createdAt: '2026-04-25T10:00:00Z' },
    ],
    comments: [
      {
        id: 'comment-4',
        authorId: 'kaantaja-b',
        text: 'Kahteen virkkeeseen jakaminen selkeyttää huomattavasti. Kannatan.',
        createdAt: '2026-04-15T09:00:00Z',
        thread: 'main',
      },
      {
        id: 'comment-5s',
        authorId: 'seurantaryhma-a',
        text: 'Seurantaryhmä on tarkistanut — ei huomautettavaa.',
        createdAt: '2026-04-18T15:00:00Z',
        thread: 'seurantaryhma',
      },
    ],
    createdAt: '2026-04-12T10:00:00Z',
    statusChangedAt: '2026-04-24T12:00:00Z',
  },
  // Proposal D: verse 4 (entrusted with the gospel), fully approved
  {
    id: 'proposal-d',
    ranges: [{ verseStart: 4, verseEnd: 4, proposedText: 'Jumala on katsonut meidät kelvollisiksi ja uskonut meille evankeliumin, ja sen mukaisesti me puhumme — emme miellyttääksemme ihmisiä vaan Jumalaa, joka tutkii sydämemme.' }],
    rationale: '"Hyväksynyt" → "katsonut kelvollisiksi" tarkentaa kreikan δοκιμάζω-verbin merkitystä (koetella ja todeta kelvolliseksi). Ajatusviiva selkeyttää vastakkainasettelua.',
    authorId: 'kaantaja-a',
    status: 'hyvaksytty_lopullisesti',
    votes: [],
    comments: [
      {
        id: 'comment-6',
        authorId: 'kaantaja-b',
        text: '"Katsonut kelvollisiksi" on tarkka ja silti luonteva. Hyvä muutos.',
        createdAt: '2026-04-08T10:00:00Z',
        thread: 'main',
      },
      {
        id: 'comment-7',
        authorId: 'hallitus-a',
        text: 'Hallitus on hyväksynyt muutoksen.',
        createdAt: '2026-04-14T16:00:00Z',
        thread: 'main',
      },
    ],
    createdAt: '2026-04-05T08:00:00Z',
    statusChangedAt: '2026-04-14T16:00:00Z',
  },
]

export const SEED_ACTIVITY: ActivityEntry[] = [
  {
    id: 'act-1',
    timestamp: '2026-04-14T16:00:00Z',
    userId: 'hallitus-a',
    proposalId: 'proposal-d',
    action: 'Hyväksytty lopullisesti',
    detail: 'Jae 4 — hallitus hyväksyi muutoksen',
  },
  {
    id: 'act-2',
    timestamp: '2026-04-20T12:00:00Z',
    userId: 'kaantaja-a',
    proposalId: 'proposal-c',
    action: 'Lähetetty ehdotukseksi',
    detail: 'Jae 13 — lähetetty ehdotukseksi',
  },
  {
    id: 'act-3',
    timestamp: '2026-04-21T08:00:00Z',
    userId: 'kaantaja-b',
    proposalId: 'proposal-b',
    action: 'Lähetetty ehdotukseksi',
    detail: 'Jakeet 9–10 — lähetetty ehdotukseksi',
  },
  {
    id: 'act-4',
    timestamp: '2026-04-22T11:00:00Z',
    userId: 'kaantaja-b',
    proposalId: 'proposal-b',
    action: 'Uusi kommentti',
    detail: 'Jakeet 9–10 — uusi kommentti',
  },
  {
    id: 'act-5',
    timestamp: '2026-04-19T09:00:00Z',
    userId: 'kaantaja-a',
    proposalId: 'proposal-a',
    action: 'Uusi ehdotus',
    detail: 'Jae 7 — uusi ehdotus luotu',
  },
]
