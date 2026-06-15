import { User, Verse, TextWork, Proposal, Comment, ActivityEntry, Merkinta, Snapshot } from './types'

// Filippiläiskirje, Luku 4 — from the actual RK working document (Versio 9.12.2025)
export const SEED_VERSES: Verse[] = [
  {
    number: 1,
    baseText: 'Rakkaat ja ikävöidyt veljeni, te minun iloni ja kruununi, seiskää siis lujina Herrassa, rakkaat!',
    approvedText: 'Rakkaat ja ikävöidyt veljeni, te minun iloni ja kruununi, seiskää siis lujina Herrassa, rakkaat!',
    text: 'Rakkaat ja ikävöidyt veljeni, te minun iloni ja kruununi, seiskää siis lujina Herrassa, rakkaat!',
    sectionHeader: 'Kehotuksia seurakunnalle',
    footnotes: [{ marker: '1', text: '1. Tess. 2:19–20', baseText: '1. Tess. 2:19–20' }],
  },
  {
    number: 2,
    baseText: 'Euodiaa ja Syntykeä kehotan olemaan yksimielisiä Herrassa.',
    approvedText: 'Euodiaa ja Syntykeä kehotan olemaan yksimielisiä Herrassa.',
    text: 'Euodiaa ja Syntykeä kehotan olemaan yksimielisiä Herrassa.',
    footnotes: [{ marker: '2', text: 'Fil. 2:2', baseText: 'Fil. 2:2' }],
  },
  {
    number: 3,
    baseText: 'Pyydän myös sinua, sinä todellinen työtoveri, auttamaan näitä naisia, sillä he ovat taistelleet evankeliumin hyväksi yhdessä minun sekä Clemensin ja muiden työtoverieni kanssa, joiden nimet ovat elämän kirjassa.',
    approvedText: 'Pyydän myös sinua, sinä todellinen työtoveri, auttamaan näitä naisia, sillä he ovat taistelleet evankeliumin hyväksi yhdessä minun sekä Clemensin ja muiden työtoverieni kanssa, joiden nimet ovat elämän kirjassa.',
    text: 'Pyydän myös sinua, sinä todellinen työtoveri, auttamaan näitä naisia, sillä he ovat taistelleet evankeliumin hyväksi yhdessä minun sekä Clemensin ja muiden työtoverieni kanssa, joiden nimet ovat elämän kirjassa.',
    footnotes: [
      { marker: '3a', text: '2. Moos. 32:32; Ilm. 20:12,15, 21:27', baseText: '2. Moos. 32:32; Ilm. 20:12,15, 21:27' },
      { marker: '3b', text: 'Kreik. syzygos merkitsee "aisapari"; voi olla myös erisnimi.', baseText: 'Kreik. syzygos merkitsee "aisapari"; voi olla myös erisnimi.' },
    ],
  },
  {
    number: 4,
    baseText: 'Iloitkaa aina Herrassa! Vieläkin minä sanon: iloitkaa!',
    approvedText: 'Iloitkaa aina Herrassa! Vieläkin minä sanon: iloitkaa!',
    text: 'Iloitkaa aina Herrassa! Vieläkin minä sanon: iloitkaa!',
    footnotes: [{ marker: '4', text: 'Ps. 32:11; Fil. 3:1; 1. Tess. 5:16', baseText: 'Ps. 32:11; Fil. 3:1; 1. Tess. 5:16' }],
  },
  {
    number: 5,
    baseText: 'Tulkoon teidän lempeytenne kaikkien ihmisten tietoon. Herra on lähellä.',
    approvedText: 'Tulkoon teidän lempeytenne kaikkien ihmisten tietoon. Herra on lähellä.',
    text: 'Tulkoon teidän lempeytenne kaikkien ihmisten tietoon. Herra on lähellä.',
    footnotes: [{ marker: '5', text: 'Jaak. 5:8–9', baseText: 'Jaak. 5:8–9' }],
  },
  {
    number: 6,
    baseText: 'Älkää olko mistään huolissanne, vaan kaikessa saattakaa pyyntönne rukoillen ja anoen kiitoksen kanssa Jumalan tietoon,',
    approvedText: 'Älkää olko mistään huolissanne, vaan kaikessa saattakaa pyyntönne rukoillen ja anoen kiitoksen kanssa Jumalan tietoon,',
    text: 'Älkää olko mistään huolissanne, vaan saattakaa kaikessa pyyntönne rukoillen ja anoen kiitoksen kera Jumalan tietoon,',
    footnotes: [{ marker: '6', text: 'Ps. 55:23; Matt. 6:25; Kol. 4:2; 1. Tim. 2:1; 1. Piet. 5:7', baseText: 'Ps. 55:23; Matt. 6:25; Kol. 4:2; 1. Tim. 2:1; 1. Piet. 5:7' }],
  },
  {
    number: 7,
    baseText: 'ja Jumalan rauha, joka on kaikkea ymmärrystä ylempi, varjelee teidän sydämenne ja ajatuksenne Kristuksessa Jeesuksessa.',
    approvedText: 'ja Jumalan rauha, joka on kaikkea ymmärrystä ylempi, varjelee teidän sydämenne ja ajatuksenne Kristuksessa Jeesuksessa.',
    text: 'ja Jumalan rauha, joka ylittää kaiken ymmärryksen, varjelee teidän sydämenne ja ajatuksenne Kristuksessa Jeesuksessa.',
    footnotes: [{ marker: '7', text: 'Joh. 14:27; Room. 5:1; Kol. 3:15', baseText: 'Joh. 14:27; Room. 5:1; Kol. 3:15' }],
  },
  {
    number: 8,
    baseText: 'Sitten vielä, veljet, kaikki mikä on totta, mikä kunnioitettavaa ja oikeaa, mikä puhdasta, rakastettavaa ja hyvältä kuulostavaa, jos on jokin hyve ja jotakin kiitettävää, sitä ajatelkaa.',
    approvedText: 'Sitten vielä, veljet, kaikki mikä on totta, mikä kunnioitettavaa ja oikeaa, mikä puhdasta, rakastettavaa ja hyvältä kuulostavaa, jos on jokin hyve ja jotakin kiitettävää, sitä ajatelkaa.',
    text: 'Lopuksi vielä, veljet: kaikki mikä on totta, kunnioitettavaa ja oikeaa, mikä puhdasta, rakastettavaa ja arvostettavaa, mikä on hyvettä ja kiitoksen arvoista, sitä ajatelkaa.',
    footnotes: [{ marker: '8', text: 'Room. 12:17, 13:13', baseText: 'Room. 12:17, 13:13' }],
  },
  {
    number: 9,
    baseText: 'Mitä myös olette minulta oppineet ja saaneet, mitä minulta kuulleet ja minusta nähneet, sitä tehkää, niin rauhan Jumala on oleva teidän kanssanne.',
    approvedText: 'Mitä myös olette minulta oppineet ja saaneet, mitä minulta kuulleet ja minusta nähneet, sitä tehkää, niin rauhan Jumala on oleva teidän kanssanne.',
    text: 'Mitä olette minulta oppineet ja saaneet, kuulleet ja nähneet, sitä tehkää, niin rauhan Jumala on teidän kanssanne.',
    footnotes: [{ marker: '9', text: 'Room. 15:33; Fil. 3:16–17; 2. Tess. 3:16', baseText: 'Room. 15:33; Fil. 3:16–17; 2. Tess. 3:16' }],
  },
  {
    number: 10,
    baseText: 'Ilahduin suuresti Herrassa, että te vihdoinkin havahduitte huolehtimaan minusta. Siihen teillä on toki ollut halua mutta ei tilaisuutta.',
    approvedText: 'Ilahduin suuresti Herrassa, että te vihdoinkin havahduitte huolehtimaan minusta. Siihen teillä on toki ollut halua mutta ei tilaisuutta.',
    text: 'Ilahduin suuresti Herrassa, että te vihdoinkin havahduitte huolehtimaan minusta. Siihen teillä on toki ollut halua mutta ei tilaisuutta.',
    sectionHeader: 'Kiitokset filippiläisille',
  },
  {
    number: 11,
    baseText: 'En sano tätä puutteen vuoksi, sillä olen oppinut tyytymään oloihini.',
    approvedText: 'En sano tätä puutteen vuoksi, sillä olen oppinut tyytymään oloihini.',
    text: 'En sano tätä puutteen vuoksi, sillä olen oppinut tulemaan toimeen kulloisessakin tilanteessani.',
    footnotes: [{ marker: '11', text: '1. Tim. 6:6–8', baseText: '1. Tim. 6:6–8' }],
  },
  {
    number: 12,
    baseText: 'Osaan elää niukkuudessa, osaan myös elää runsaudessa. Olen tottunut kaikkeen ja kaikenlaisiin oloihin, olemaan kylläinen ja nälkäinen, elämään runsaudessa ja puutteessa.',
    approvedText: 'Osaan elää niukkuudessa, osaan myös elää runsaudessa. Olen tottunut kaikkeen ja kaikenlaisiin oloihin, olemaan kylläinen ja nälkäinen, elämään runsaudessa ja puutteessa.',
    text: 'Osaan elää niukkuudessa, osaan myös elää runsaudessa. Olen tottunut kaikkeen ja kaikenlaisiin oloihin, olemaan kylläinen ja nälkäinen, elämään runsaudessa ja puutteessa.',
    footnotes: [{ marker: '12', text: '1. Kor. 4:11–12; 2. Kor. 11:27', baseText: '1. Kor. 4:11–12; 2. Kor. 11:27' }],
  },
  {
    number: 13,
    baseText: 'Kaiken minä voin hänessä, joka minua vahvistaa.',
    approvedText: 'Kaiken minä voin hänessä, joka minua vahvistaa.',
    text: 'Kaiken minä voin hänessä, joka minua vahvistaa.',
    footnotes: [{ marker: '13', text: 'Mark. 9:23', baseText: 'Mark. 9:23' }],
  },
  {
    number: 14,
    baseText: 'Teitte kuitenkin hyvin, kun otitte osaa minun ahdinkooni.',
    approvedText: 'Teitte kuitenkin hyvin, kun otitte osaa minun ahdinkooni.',
    text: 'Teitte kuitenkin hyvin, kun otitte osaa minun ahdinkooni.',
  },
  {
    number: 15,
    baseText: 'Tiedättehän te filippiläiset itsekin, että evankeliumin alkuaikoina, kun lähdin Makedoniasta, ei mikään muu seurakunta kuin te yksin ryhtynyt kanssani tiliyhteyteen annetusta ja saadusta.',
    approvedText: 'Tiedättehän te filippiläiset itsekin, että evankeliumin alkuaikoina, kun lähdin Makedoniasta, ei mikään muu seurakunta kuin te yksin ryhtynyt kanssani tiliyhteyteen annetusta ja saadusta.',
    text: 'Tiedättehän te filippiläiset itsekin, että evankeliumin alkuaikoina, kun lähdin Makedoniasta, ei mikään muu seurakunta kuin te yksin ryhtynyt kanssani tiliyhteyteen annetusta ja saadusta.',
    footnotes: [{ marker: '15', text: '2. Kor. 11:8–9', baseText: '2. Kor. 11:8–9' }],
  },
  {
    number: 16,
    baseText: 'Tessalonikaankin te lähetitte minulle kerran, jopa kahdesti, mitä tarvitsin.',
    approvedText: 'Tessalonikaankin te lähetitte minulle kerran, jopa kahdesti, mitä tarvitsin.',
    text: 'Tessalonikaankin te lähetitte minulle kerran, jopa kahdesti, mitä tarvitsin.',
  },
  {
    number: 17,
    baseText: 'En toki tavoittele lahjoja vaan haluan, että teidän hyväksenne karttuu hedelmää.',
    approvedText: 'En toki tavoittele lahjoja vaan haluan, että teidän hyväksenne karttuu hedelmää.',
    text: 'En toki tavoittele lahjoja vaan haluan, että teidän hyväksenne karttuu hedelmää.',
  },
  {
    number: 18,
    baseText: 'Olen saanut kaikkea, jopa runsaasti. Minulla on kaikkea yllin kyllin saatuani Epafroditokselta teidän lähetyksenne, joka on suloinen tuoksu, kelvollinen, Jumalan mielen mukainen uhri.',
    approvedText: 'Olen saanut kaikkea, jopa runsaasti. Minulla on kaikkea yllin kyllin saatuani Epafroditokselta teidän lähetyksenne, joka on suloinen tuoksu, kelvollinen, Jumalan mielen mukainen uhri.',
    text: 'Olen saanut kaikkea, jopa yltäkyllin. Minulla on kaikkea riittävästi saatuani Epafroditokselta teidän lähetyksenne, joka on suloinen tuoksu, otollinen, Jumalaa miellyttävä uhri.',
    footnotes: [{ marker: '18', text: 'Room. 12:1; Ef. 5:2; Hepr. 13:16; 1. Piet. 2:5', baseText: 'Room. 12:1; Ef. 5:2; Hepr. 13:16; 1. Piet. 2:5' }],
  },
  {
    number: 19,
    baseText: 'Minun Jumalani on täyttävä kaikki teidän tarpeenne kirkkaudessa olevan rikkautensa mukaan Kristuksessa Jeesuksessa.',
    approvedText: 'Minun Jumalani on täyttävä kaikki teidän tarpeenne kirkkaudessa olevan rikkautensa mukaan Kristuksessa Jeesuksessa.',
    text: 'Minun Jumalani täyttää kaikki teidän tarpeenne kirkkautensa rikkaudesta Kristuksessa Jeesuksessa.',
  },
  {
    number: 20,
    baseText: 'Jumalalle ja meidän Isällemme kunnia, aina ja iankaikkisesti! Aamen.',
    approvedText: 'Jumalalle ja meidän Isällemme kunnia, aina ja iankaikkisesti! Aamen.',
    text: 'Jumalalle ja meidän Isällemme kunnia, aina ja iankaikkisesti! Aamen.',
    footnotes: [{ marker: '20', text: '1. Piet. 4:11', baseText: '1. Piet. 4:11' }],
  },
  {
    number: 21,
    baseText: 'Tervehtikää kaikkia pyhiä Kristuksessa Jeesuksessa. Luonani olevat veljet lähettävät teille terveisiä.',
    approvedText: 'Tervehtikää kaikkia pyhiä Kristuksessa Jeesuksessa. Luonani olevat veljet lähettävät teille terveisiä.',
    text: 'Tervehtikää kaikkia pyhiä Kristuksessa Jeesuksessa. Veljet, jotka ovat luonani, lähettävät teille terveisiä.',
    sectionHeader: 'Lopputervehdys',
  },
  {
    number: 22,
    baseText: 'Kaikki pyhät tervehtivät teitä, varsinkin ne, jotka ovat keisarin palveluskuntaa.',
    approvedText: 'Kaikki pyhät tervehtivät teitä, varsinkin ne, jotka ovat keisarin palveluskuntaa.',
    text: 'Kaikki pyhät tervehtivät teitä, varsinkin ne, jotka ovat keisarin palveluskuntaa.',
    footnotes: [
      { marker: '22a', text: '2. Kor. 13:12', baseText: '2. Kor. 13:12' },
      { marker: '22b', text: 'Saattoivat olla keisarillisen suvun jäseniä tai keisarin palatsin palveluskuntaa.', baseText: 'Saattoivat olla keisarillisen suvun jäseniä tai keisarin palatsin palveluskuntaa.' },
    ],
  },
  {
    number: 23,
    baseText: 'Herran Jeesuksen Kristuksen armo olkoon teidän henkenne kanssa.',
    approvedText: 'Herran Jeesuksen Kristuksen armo olkoon teidän henkenne kanssa.',
    text: 'Herran Jeesuksen Kristuksen armo olkoon teidän henkenne kanssa.',
    footnotes: [{ marker: '23', text: 'Gal. 6:18', baseText: 'Gal. 6:18' }],
  },
]

export const SEED_USERS: User[] = [
  // Dual-role members (tekstiryhmä + hallitus)
  { id: 'leino-kimmo', name: 'Kimmo Leino', roles: ['tekstiryhma', 'hallitus'], roleLabel: '1. varapj.' },
  { id: 'ahvenainen-martti', name: 'Martti Ahvenainen', roles: ['tekstiryhma', 'hallitus'], roleLabel: '' },
  { id: 'kivinen-riku', name: 'Riku Kivinen', roles: ['tekstiryhma', 'hallitus'], roleLabel: '2. varapj.' },
  // Tekstiryhmä only
  { id: 'peltola-kimmo', name: 'Kimmo Peltola', roles: ['tekstiryhma'], roleLabel: '' },
  // Seurantaryhmä
  { id: 'seurantaryhma-a', name: 'Seurantaryhmän jäsen A', roles: ['seurantaryhma'], roleLabel: '' },
  { id: 'seurantaryhma-b', name: 'Seurantaryhmän jäsen B', roles: ['seurantaryhma'], roleLabel: '' },
  // Hallitus only
  { id: 'liukko-arto', name: 'Arto Liukko', roles: ['hallitus'], roleLabel: 'pj.' },
  { id: 'kaikkonen-sointu', name: 'Sointu Kaikkonen', roles: ['hallitus'], roleLabel: '' },
  { id: 'mantsinen-matti', name: 'Matti Mantsinen', roles: ['hallitus'], roleLabel: '' },
  { id: 'valimaki-maria', name: 'Maria Välimäki', roles: ['hallitus'], roleLabel: 'sihteeri' },
]

export const SEED_TEXT_WORKS: TextWork[] = [
  {
    id: 'tw-1',
    scope: { book: 'Phil', chapter: 4 },
    status: 'luonnos',
    statusChangedAt: '2026-04-16T09:00:00Z',
    publishedForFeedbackAt: '2026-04-12T10:00:00Z',
  },
  {
    id: 'tw-2',
    scope: { book: 'Phil', chapter: 3 },
    status: 'julkaistu_palautteelle',
    statusChangedAt: '2026-04-18T10:00:00Z',
    publishedForFeedbackAt: '2026-04-18T10:00:00Z',
  },
  {
    id: 'tw-3',
    scope: { book: 'Phil', chapter: 1 },
    status: 'lahetetty_hallitukselle',
    statusChangedAt: '2026-04-22T14:00:00Z',
    publishedForFeedbackAt: '2026-04-15T09:00:00Z',
    submittedToHallitusAt: '2026-04-22T14:00:00Z',
    submissionProposalId: 'proposal-tw3',
  },
  {
    id: 'tw-4',
    scope: { book: 'Phil', chapter: 2 },
    status: 'hyvaksytty',
    statusChangedAt: '2026-04-25T16:00:00Z',
    publishedForFeedbackAt: '2026-04-10T09:00:00Z',
    submittedToHallitusAt: '2026-04-20T12:00:00Z',
    submissionProposalId: 'proposal-tw4',
  },
]

const ALL_VOTERS = ['liukko-arto', 'kaikkonen-sointu', 'mantsinen-matti', 'valimaki-maria', 'ahvenainen-martti', 'kivinen-riku', 'leino-kimmo']

export const SEED_PROPOSALS: Proposal[] = [
  // tw-3: partial votes (Arto approved, others pending)
  {
    id: 'proposal-tw3',
    textWorkId: 'tw-3',
    snapshotId: 'snapshot-tw3-submission',
    selectedVoters: ALL_VOTERS,
    rationale: 'Ensimmäinen luku on valmis seurantaryhmän palautteen jälkeen. Pyydämme hallituksen hyväksyntää.',
    votes: [
      { userId: 'liukko-arto', decision: 'approve', createdAt: '2026-04-24T10:00:00Z' },
    ],
    createdAt: '2026-04-22T14:00:00Z',
  },
  // tw-4: all approved
  {
    id: 'proposal-tw4',
    textWorkId: 'tw-4',
    snapshotId: 'snapshot-tw4-submission',
    selectedVoters: ALL_VOTERS,
    rationale: 'Toinen luku on valmis käsittelyyn.',
    votes: [
      { userId: 'liukko-arto', decision: 'approve', createdAt: '2026-04-24T14:00:00Z' },
      { userId: 'kaikkonen-sointu', decision: 'approve', createdAt: '2026-04-24T15:00:00Z' },
      { userId: 'mantsinen-matti', decision: 'approve', createdAt: '2026-04-24T16:00:00Z' },
      { userId: 'valimaki-maria', decision: 'approve', createdAt: '2026-04-25T09:00:00Z' },
      { userId: 'ahvenainen-martti', decision: 'approve', createdAt: '2026-04-25T10:00:00Z' },
      { userId: 'kivinen-riku', decision: 'approve', createdAt: '2026-04-25T14:00:00Z' },
      { userId: 'leino-kimmo', decision: 'approve', createdAt: '2026-04-25T16:00:00Z' },
    ],
    createdAt: '2026-04-20T12:00:00Z',
    resolvedAt: '2026-04-25T16:00:00Z',
  },
]

export const SEED_COMMENTS: Comment[] = [
  // tw-2: seurantaryhmä comments on chapter 3
  {
    id: 'comment-s1',
    textWorkId: 'tw-2',
    verseAnchor: { verseStart: 1 },
    verseSnapshot: 'Fil. 3:1 teksti.',
    authorId: 'seurantaryhma-a',
    text: 'Aloituksen sanajärjestys voisi olla luontevampi.',
    thread: 'seurantaryhma',
    status: 'avoin',
    createdAt: '2026-04-19T09:00:00Z',
  },
  {
    id: 'comment-s2',
    textWorkId: 'tw-2',
    verseAnchor: { verseStart: 3 },
    verseSnapshot: 'Fil. 3:3 teksti.',
    authorId: 'seurantaryhma-b',
    text: 'Kreikan sanan vivahde ei välity tässä muotoilussa.',
    thread: 'seurantaryhma',
    status: 'avoin',
    createdAt: '2026-04-19T14:00:00Z',
  },
  {
    id: 'comment-s3',
    textWorkId: 'tw-2',
    verseAnchor: { verseStart: 5 },
    verseSnapshot: 'Fil. 3:5 teksti.',
    authorId: 'seurantaryhma-a',
    text: 'Hyvä muotoilu, ei huomautettavaa.',
    thread: 'seurantaryhma',
    status: 'kasitelty',
    resolvedBy: 'leino-kimmo',
    resolvedAt: '2026-04-20T08:00:00Z',
    createdAt: '2026-04-19T15:00:00Z',
  },
  // tw-1: tekstiryhma comments on chapter 4
  {
    id: 'comment-t1',
    textWorkId: 'tw-1',
    verseAnchor: { verseStart: 7 },
    verseSnapshot: 'ja Jumalan rauha, joka ylittää kaiken ymmärryksen, varjelee teidän sydämenne ja ajatuksenne Kristuksessa Jeesuksessa.',
    authorId: 'peltola-kimmo',
    text: '"Ylittää kaiken ymmärryksen" — onko tämä parempi kuin "on kaikkea ymmärrystä ylempi"? Molemmat toimivat.',
    thread: 'tekstiryhma',
    status: 'avoin',
    createdAt: '2026-04-17T11:00:00Z',
  },
  {
    id: 'comment-t2',
    textWorkId: 'tw-1',
    verseAnchor: { verseStart: 11 },
    verseSnapshot: 'En sano tätä puutteen vuoksi, sillä olen oppinut tulemaan toimeen kulloisessakin tilanteessani.',
    authorId: 'leino-kimmo',
    text: '"Tulemaan toimeen kulloisessakin tilanteessani" on pitkä — "tyytymään oloihini" on tiiviimpi ja perinteisempi.',
    thread: 'tekstiryhma',
    status: 'avoin',
    createdAt: '2026-04-19T09:15:00Z',
  },
]

export const SEED_MERKINNAT: Merkinta[] = [
  {
    id: 'merkinta-1',
    verses: [{ verseNumber: 3, text: 'työtoveri' }],
    authorId: 'leino-kimmo',
    note: 'kr. syzygos — aisapari, voi olla myös erisnimi Syzygos',
    createdAt: '2026-04-16T08:00:00Z',
  },
  {
    id: 'merkinta-2',
    verses: [{ verseNumber: 8, text: 'hyvältä kuulostavaa' }],
    authorId: 'leino-kimmo',
    note: 'kr. euphēma — hyvä maine, kiitettävä puhe; vrt. "arvostettavaa"',
    createdAt: '2026-04-16T08:30:00Z',
  },
  {
    id: 'merkinta-3',
    verses: [{ verseNumber: 19, text: 'täyttävä' }],
    authorId: 'leino-kimmo',
    note: 'kr. plērosei — fut. indikatiivimuoto, lupaus: "on täyttävä" vai "täyttää"',
    createdAt: '2026-04-17T10:30:00Z',
  },
  {
    id: 'merkinta-4',
    verses: [{ verseNumber: 13, text: 'Kaiken minä voin' }],
    authorId: 'peltola-kimmo',
    note: 'Tunnetuin Filippiläiskirjeen jae — muotoilu on vakiintunut, ei syytä muuttaa',
    createdAt: '2026-04-18T16:00:00Z',
  },
]

// Reference translations for the comparison panel (v2.0)
export interface ReferenceTranslation {
  id: string
  label: string
  language: string
  verses: { number: number; text: string }[]
}

export const REFERENCE_TRANSLATIONS: ReferenceTranslation[] = [
  {
    id: 'rk1933',
    label: 'RK 1933/38',
    language: 'fi',
    verses: SEED_VERSES.map(v => ({ number: v.number, text: v.baseText })),
  },
]

export const SEED_SNAPSHOTS: Snapshot[] = [
  // Base version
  {
    id: 'snapshot-tw1-publication',
    textWorkId: 'tw-1',
    type: 'publication',
    name: 'Pohjaversio (RK12)',
    createdAt: '2026-04-12T10:00:00Z',
    createdBy: 'leino-kimmo',
    verseTexts: SEED_VERSES.map(v => ({ number: v.number, text: v.baseText })),
    footnoteTexts: SEED_VERSES.flatMap(v =>
      (v.footnotes ?? []).map(fn => ({ verse: v.number, marker: fn.marker, text: fn.baseText }))
    ),
    sectionHeaderTexts: SEED_VERSES
      .filter(v => v.sectionHeader)
      .map(v => ({ verse: v.number, text: v.sectionHeader! })),
  },
  // Internal snapshot
  {
    id: 'snapshot-tw1-internal',
    textWorkId: 'tw-1',
    type: 'internal',
    name: 'Ensimmäinen luonnoskierros',
    createdAt: '2026-04-14T17:00:00Z',
    createdBy: 'leino-kimmo',
    verseTexts: SEED_VERSES.map(v => ({ number: v.number, text: v.baseText })),
    footnoteTexts: SEED_VERSES.flatMap(v =>
      (v.footnotes ?? []).map(fn => ({ verse: v.number, marker: fn.marker, text: fn.baseText }))
    ),
    sectionHeaderTexts: SEED_VERSES
      .filter(v => v.sectionHeader)
      .map(v => ({ verse: v.number, text: v.sectionHeader! })),
  },
  // Submission snapshot for tw-3
  {
    id: 'snapshot-tw3-submission',
    textWorkId: 'tw-3',
    type: 'submission',
    createdAt: '2026-04-22T14:00:00Z',
    createdBy: 'leino-kimmo',
    verseTexts: [{ number: 1, text: 'Fil. luku 1 teksti (tiivistelmä).' }],
    footnoteTexts: [],
    sectionHeaderTexts: [],
  },
  // Submission snapshot for tw-4
  {
    id: 'snapshot-tw4-submission',
    textWorkId: 'tw-4',
    type: 'submission',
    createdAt: '2026-04-20T12:00:00Z',
    createdBy: 'peltola-kimmo',
    verseTexts: [{ number: 1, text: 'Fil. luku 2 teksti (tiivistelmä).' }],
    footnoteTexts: [],
    sectionHeaderTexts: [],
  },
]

export const SEED_ACTIVITY: ActivityEntry[] = [
  {
    id: 'act-2',
    timestamp: '2026-04-25T16:00:00Z',
    userId: 'kaikkonen-sointu',
    textWorkId: 'tw-4',
    action: 'Hyväksytty',
    detail: 'Fil. luku 2 — hallitus hyväksyi yksimielisesti',
  },
  {
    id: 'act-3',
    timestamp: '2026-04-24T10:00:00Z',
    userId: 'liukko-arto',
    textWorkId: 'tw-3',
    action: 'Äänestetty',
    detail: 'Fil. luku 1 — ääni annettu',
  },
  {
    id: 'act-4',
    timestamp: '2026-04-22T14:00:00Z',
    userId: 'leino-kimmo',
    textWorkId: 'tw-3',
    action: 'Lähetetty hallitukselle',
    detail: 'Fil. luku 1 — lähetetty hallitukselle',
  },
  {
    id: 'act-5',
    timestamp: '2026-04-19T09:00:00Z',
    userId: 'seurantaryhma-a',
    textWorkId: 'tw-2',
    action: 'Uusi kommentti',
    detail: 'Fil. luku 3 — uusi kommentti',
  },
  {
    id: 'act-6',
    timestamp: '2026-04-18T10:00:00Z',
    userId: 'leino-kimmo',
    textWorkId: 'tw-2',
    action: 'Julkaistu palautteelle',
    detail: 'Fil. luku 3 — julkaistu seurantaryhmälle',
  },
]
