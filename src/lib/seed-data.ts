import { User, Verse, TextWork, Proposal, Comment, ActivityEntry, Merkinta, Snapshot } from './types'

// 1. Tessalonikalaiskirje, Luku 2 — from the actual RK12 working document (Versio 28.3.2026)
export const SEED_VERSES: Verse[] = [
  {
    number: 1,
    baseText: 'Tiedättehän itsekin, veljet, että tulomme luoksenne ei ollut turha.',
    text: 'Tiedättehän itsekin, veljet, ettei tulomme teidän luoksenne ollut turha.',
    sectionHeader: 'Paavalin toiminta Tessalonikassa',
    footnotes: [{ marker: '1', text: '1. Tess. 1:5,9', baseText: '1. Tess. 1:5,9' }],
  },
  {
    number: 2,
    baseText: 'Olimme, kuten tiedätte, ennen joutuneet Filippissä kärsimään ja kestämään pahaa kohtelua, mutta Jumalamme antoi meille rohkeuden julistaa teille hänen evankeliumiaan kovienkin vastuksien keskellä.',
    text: 'Vaikka olimme aiemmin Filippissä kärsineet ja meitä oli siellä pahoinpidelty, niin kuin tiedätte, meillä oli kuitenkin Jumalassamme rohkeutta puhua teille Jumalan evankeliumia ankaran taistelun keskellä.',
    footnotes: [{ marker: '2', text: 'Ap. t. 16:19–24, 17:1; Fil. 1:30', baseText: 'Ap. t. 16:19–24, 17:1; Fil. 1:30' }],
  },
  {
    number: 3,
    baseText: 'Kehotuksemme ei näet johdu harhasta eikä epäpuhtaista vaikuttimista, emmekä yritä pettää ketään.',
    text: 'Meidän kehotuksemme ei näet ole lähtöisin eksytyksestä, ei epäpuhtaasta mielestä eikä kavalaudesta.',
    footnotes: [{ marker: '3', text: '2. Kor. 4:2; 7:2', baseText: '2. Kor. 4:2; 7:2' }],
  },
  {
    number: 4,
    baseText: 'Jumala on hyväksynyt meidät ja uskonut meille evankeliumin, ja siksi me puhumme, emme ihmisten mielen mukaisesti vaan Jumalan, joka tutkii sydämemme.',
    text: 'Koska Jumala on katsonut meidän kelpaavan siihen, että meille uskottiin evankeliumi, me puhumme, emme miellyttääksemme ihmisiä vaan Jumalaa, joka koettelee sydämemme.',
    footnotes: [{ marker: '4', text: '1. Aik. 29:17; Gal. 1:10; 1. Tim. 1:11–12', baseText: '1. Aik. 29:17; Gal. 1:10; 1. Tim. 1:11–12' }],
  },
  {
    number: 5,
    baseText: 'Emme ole koskaan puhuneet mielistellen, kuten tiedätte, emmekä peittäneet ahneuttamme — Jumala on todistajamme.',
    text: 'Me emme ole koskaan esiintyneet imarteleviin sanoin, sen te tiedätte, emmekä tekosyin ahnehtineet voittoa. Jumala on todistajamme.',
    footnotes: [{ marker: '5', text: 'Mark. 12:40; Ap. t. 20:33–34; 2. Kor. 2:17', baseText: 'Mark. 12:40; Ap. t. 20:33–34; 2. Kor. 2:17' }],
  },
  {
    number: 6,
    baseText: 'Emme ole tavoitelleet kenenkään ylistystä, emme teidän emmekä muiden, vaikka olisimme Kristuksen apostoleina voineet vaatia arvonantoa.',
    text: 'Emme myöskään ole etsineet kunniaa ihmisiltä, emme teiltä emmekä muilta,',
    footnotes: [{ marker: '6', text: 'Joh. 5:41,44, 7:18; 2. Kor. 3:1', baseText: 'Joh. 5:41,44, 7:18; 2. Kor. 3:1' }],
  },
  {
    number: 7,
    baseText: 'Mutta me olimme teidän keskuudessanne lempeät, niin kuin imettävä äiti hellästi hoivaa lapsiaan.',
    text: 'vaikka Kristuksen apostoleina olisimmekin voineet vaatia arvonantoa. Olimme sen sijaan teidän keskuudessanne lempeitä kuin imettävä äiti, joka hoivaa lapsiaan.',
    footnotes: [{ marker: '7', text: '2. Kor. 10:1', baseText: '2. Kor. 10:1' }],
  },
  {
    number: 8,
    baseText: 'Niin hellät tunteet meitä valtasivat, että halusimme antaa teille Jumalan evankeliumin lisäksi oman henkemme, koska olitte tulleet meille niin rakkaiksi.',
    text: 'Teistä hellien me halusimme antaa teille, ei vain Jumalan evankeliumia vaan oman itsemmekin, sillä te olitte tulleet meille rakkaiksi.',
    footnotes: [{ marker: '8', text: 'Ap. t. 20:24; 2. Kor. 12:15; Fil. 2:17', baseText: 'Ap. t. 20:24; 2. Kor. 12:15; Fil. 2:17' }],
  },
  {
    number: 9,
    baseText: 'Muistattahan, veljet, meidän vaivannäkömme ja rasituksemme. Yötä päivää työtä tehden julistimme teille Jumalan evankeliumia, jotta emme olisi olleet kenellekään teistä rasituksena.',
    text: 'Muistattehan, veljet, kovan työmme ja vaivannäkömme. Yötä päivää me teimme työtä, ettemme olisi kenellekään teistä rasitukseksi, kun julistimme teille Jumalan evankeliumia.',
    footnotes: [{ marker: '9', text: 'Ap. t. 20:34; 2. Kor. 11:9; 2. Tess. 3:8', baseText: 'Ap. t. 20:34; 2. Kor. 11:9; 2. Tess. 3:8' }],
  },
  {
    number: 10,
    baseText: 'Te olette todistajina, samoin Jumala, kuinka pyhästi, oikeamielisesti ja moitteettomasti me uskovia kohtaan vaelsimme.',
    text: 'Te olette todistajamme, samoin Jumala, kuinka pyhiä, oikeamielisiä ja nuhteettomia olimme teitä kohtaan, jotka uskotte.',
  },
  {
    number: 11,
    baseText: 'Tiedättehän, että olemme jokaista teistä kuin isä lapsiaan kehottaneet ja rohkaisseet',
    text: 'Samoin te tiedätte, kuinka me kehotimme ja rohkaisimme teitä jokaista kuin isä lapsiaan',
    footnotes: [{ marker: '11', text: 'Ap. t. 20:20,31', baseText: 'Ap. t. 20:20,31' }],
  },
  {
    number: 12,
    baseText: 'ja vaatineet vaeltamaan Jumalan arvoisesti, hänen, joka kutsuu teidät valtakuntaansa ja kirkkauteensa.',
    text: 'ja tähdensimme, että teidän tulee vaeltaa Jumalan arvon mukaisesti, hänen, joka kutsuu teidät valtakuntaansa ja kirkkauteensa.',
    footnotes: [{ marker: '12', text: 'Ef. 4:1; Fil. 1:27; Kol. 1:10; 1. Piet. 5:10', baseText: 'Ef. 4:1; Fil. 1:27; Kol. 1:10; 1. Piet. 5:10' }],
  },
  {
    number: 13,
    baseText: 'Sen vuoksi me myös lakkaamatta kiitämme Jumalaa siitä, että kun saitte meiltä Jumalan sanan, te ette ottaneet sitä vastaan ihmisten sanana vaan Jumalan sanana, jota se todellakin on ja joka myös vaikuttaa teissä, jotka uskotte.',
    text: 'Siksi me myös lakkaamatta kiitämme Jumalaa siitä, että kun kuulitte meiltä Jumalan sanan, te otitte sen vastaan, ette ihmisten sanana vaan, niin kuin se todella on, Jumalan sanana, joka myös vaikuttaa teissä, jotka uskotte.',
    sectionHeader: 'Yhteiset kärsimykset',
    footnotes: [{ marker: '13', text: 'Matt. 10:40; Gal. 1:11, 4:14; 1. Tess. 1:5', baseText: 'Matt. 10:40; Gal. 1:11, 4:14; 1. Tess. 1:5' }],
  },
  {
    number: 14,
    baseText: 'Te olette näet, veljet, seuranneet Jumalan Kristuksessa Jeesuksessa olevia seurakuntia Juudeassa, sillä te olette saaneet kärsiä omalta kansaltanne samaa kuin hekin juutalaisilta,',
    text: 'Teistä, veljet, on tullut niiden Kristuksessa Jeesuksessa olevien Jumalan seurakuntien seuraajia, jotka ovat Juudeassa. Ovathan teidän omat maanmiehenne aiheuttaneet samoja kärsimyksiä teille kuin juutalaiset noille seurakunnille.',
    footnotes: [{ marker: '14', text: 'Ap. t. 17:5,13', baseText: 'Ap. t. 17:5,13' }],
  },
  {
    number: 15,
    baseText: 'jotka tappoivat sekä Herran Jeesuksen että profeetat ja ovat vainonneet meitäkin eivätkä ole Jumalalle mieliksi ja ovat kaikkia ihmisiä vastaan.',
    text: 'Juutalaisethan tappoivat Herran Jeesuksen ja profeetat ja ovat vainonneet myös meitä eivätkä ole Jumalalle mieleen. He ovat kaikkia ihmisiä vastaan,',
    footnotes: [{ marker: '15', text: 'Matt. 23:34,37; Luuk. 13:33–34; Ap. t. 7:52', baseText: 'Matt. 23:34,37; Luuk. 13:33–34; Ap. t. 7:52' }],
  },
  {
    number: 16,
    baseText: 'He yrittävät estää meitä puhumasta pakanakansoille, että nämä pelastuisivat, ja niin he tekevät syntiensä mitan aina vain täyteen. Mutta viha on heidät vihdoin saavuttanut.',
    text: 'kun estävät meitä puhumasta pakanoille heidän pelastumisekseen. Näin he yhä täyttävät syntiensä mitan. Viha onkin saavuttanut heidät täyteen määräänsa asti.',
    footnotes: [{ marker: '16', text: 'Ap. t. 13:45,50, 14:2,19, 17:5,13', baseText: 'Ap. t. 13:45,50, 14:2,19, 17:5,13' }],
  },
  {
    number: 17,
    baseText: 'Me, veljet, jouduttuamme hetkeksi eroon teistä — tosin vain kasvoilta, emme sydämeltä — yritimme sitäkin suuremmalla kaipauksella innokkaasti päästä tapaamaan teitä.',
    text: 'Kun me nyt, veljet, olemme joksikin aikaa joutuneet teistä eroon – ulkonaisesti, emme sydämessämme – olemme entistä enemmän ikävöineet teitä ja koettaneet päästä näkemään teidän kasvonne.',
    sectionHeader: 'Paavalin halu nähdä tessalonikalaiset',
    footnotes: [{ marker: '17', text: 'Room. 1:11; 1. Tess. 3:6', baseText: 'Room. 1:11; 1. Tess. 3:6' }],
  },
  {
    number: 18,
    baseText: 'Halusimme tulla luoksenne — minä Paavali kerran ja toisen kerran — mutta Saatana esti meidät.',
    text: 'Sen tähden olemme tahtoneet tulla luoksenne – minä, Paavali, kerran, jopa kahdesti – mutta Saatana on estänyt meitä.',
  },
  {
    number: 19,
    baseText: 'Sillä kuka on meidän toivomme, ilomme ja kerskauksemme seppele Herramme Jeesuksen edessä hänen tullessaan? Ettekö juuri te?',
    text: 'Kuka on meidän toivomme tai ilomme tai kerskauksemme kruunu Herramme Jeesuksen edessä hänen tulemuksessaan, ellette te?',
    footnotes: [{ marker: '19', text: '2. Kor. 1:14; Fil. 2:16, 4:1; 2. Tess. 1:4', baseText: '2. Kor. 1:14; Fil. 2:16, 4:1; 2. Tess. 1:4' }],
  },
  {
    number: 20,
    baseText: 'Te olette meidän kunniamme ja ilomme.',
    text: 'Tehän olette meidän kunniamme ja ilomme.',
  },
]

export const SEED_USERS: User[] = [
  { id: 'tekstiryhma-a', name: 'Tekstiryhmän jäsen A', role: 'tekstiryhma', roleLabel: 'Tekstiryhmän jäsen' },
  { id: 'tekstiryhma-b', name: 'Tekstiryhmän jäsen B', role: 'tekstiryhma', roleLabel: 'Tekstiryhmän jäsen' },
  { id: 'seurantaryhma-a', name: 'Seurantaryhmän jäsen A', role: 'seurantaryhma', roleLabel: 'Seurantaryhmän jäsen' },
  { id: 'seurantaryhma-b', name: 'Seurantaryhmän jäsen B', role: 'seurantaryhma', roleLabel: 'Seurantaryhmän jäsen' },
  { id: 'hallitus-a', name: 'Hallituksen jäsen A', role: 'hallitus', roleLabel: 'Hallituksen jäsen' },
  { id: 'hallitus-b', name: 'Hallituksen jäsen B', role: 'hallitus', roleLabel: 'Hallituksen jäsen' },
  { id: 'hallitus-c', name: 'Hallituksen jäsen C', role: 'hallitus', roleLabel: 'Hallituksen jäsen' },
]

export const SEED_TEXT_WORKS: TextWork[] = [
  {
    id: 'tw-1',
    scope: { book: '1Thess', chapter: 2 },
    status: 'luonnos',
    statusChangedAt: '2026-04-16T09:00:00Z',
    publishedForFeedbackAt: '2026-04-12T10:00:00Z',
  },
  {
    id: 'tw-2',
    scope: { book: '1Thess', chapter: 3 },
    status: 'julkaistu_palautteelle',
    statusChangedAt: '2026-04-18T10:00:00Z',
    publishedForFeedbackAt: '2026-04-18T10:00:00Z',
  },
  {
    id: 'tw-3',
    scope: { book: '1Thess', chapter: 1 },
    status: 'lahetetty_hallitukselle',
    statusChangedAt: '2026-04-22T14:00:00Z',
    publishedForFeedbackAt: '2026-04-15T09:00:00Z',
    submittedToHallitusAt: '2026-04-22T14:00:00Z',
    submissionProposalId: 'proposal-tw3',
  },
  {
    id: 'tw-4',
    scope: { book: '1Thess', chapter: 4 },
    status: 'hyvaksytty',
    statusChangedAt: '2026-04-25T16:00:00Z',
    publishedForFeedbackAt: '2026-04-10T09:00:00Z',
    submittedToHallitusAt: '2026-04-20T12:00:00Z',
    submissionProposalId: 'proposal-tw4',
  },
  {
    id: 'tw-5',
    scope: { book: '1Thess', chapter: 5 },
    status: 'hylatty',
    statusChangedAt: '2026-04-26T11:00:00Z',
    publishedForFeedbackAt: '2026-04-12T09:00:00Z',
    submittedToHallitusAt: '2026-04-23T10:00:00Z',
    submissionProposalId: 'proposal-tw5',
  },
]

export const SEED_PROPOSALS: Proposal[] = [
  // tw-3: partial votes (hallitus-a approved, hallitus-b pending)
  {
    id: 'proposal-tw3',
    textWorkId: 'tw-3',
    snapshotId: 'snapshot-tw3-submission',
    selectedVoters: ['hallitus-a', 'hallitus-b'],
    rationale: 'Ensimmäinen luku on valmis seurantaryhmän palautteen jälkeen. Pyydämme hallituksen hyväksyntää.',
    votes: [
      { userId: 'hallitus-a', decision: 'approve', createdAt: '2026-04-24T10:00:00Z' },
    ],
    createdAt: '2026-04-22T14:00:00Z',
  },
  // tw-4: all approved
  {
    id: 'proposal-tw4',
    textWorkId: 'tw-4',
    snapshotId: 'snapshot-tw4-submission',
    selectedVoters: ['hallitus-a', 'hallitus-b'],
    rationale: 'Neljäs luku on valmis käsittelyyn.',
    votes: [
      { userId: 'hallitus-a', decision: 'approve', createdAt: '2026-04-24T14:00:00Z' },
      { userId: 'hallitus-b', decision: 'approve', createdAt: '2026-04-25T16:00:00Z' },
    ],
    createdAt: '2026-04-20T12:00:00Z',
    resolvedAt: '2026-04-25T16:00:00Z',
  },
  // tw-5: rejected
  {
    id: 'proposal-tw5',
    textWorkId: 'tw-5',
    snapshotId: 'snapshot-tw5-submission',
    selectedVoters: ['hallitus-b', 'hallitus-c'],
    rationale: 'Viides luku ehdotettu hallitukselle.',
    votes: [
      { userId: 'hallitus-b', decision: 'approve', createdAt: '2026-04-25T09:00:00Z' },
      { userId: 'hallitus-c', decision: 'reject', comment: 'Jakeiden 4–6 käännösratkaisut vaativat vielä tarkistamista. Erityisesti jae 5 on epäselvä.', createdAt: '2026-04-26T11:00:00Z' },
    ],
    createdAt: '2026-04-23T10:00:00Z',
    resolvedAt: '2026-04-26T11:00:00Z',
  },
]

export const SEED_COMMENTS: Comment[] = [
  // tw-2: seurantaryhmä comments (2 avoin, 1 kasitelty)
  {
    id: 'comment-s1',
    textWorkId: 'tw-2',
    verseAnchor: { verseStart: 1 },
    verseSnapshot: 'Luvun 3 jae 1 teksti.',
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
    verseSnapshot: 'Luvun 3 jae 3 teksti.',
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
    verseSnapshot: 'Luvun 3 jae 5 teksti.',
    authorId: 'seurantaryhma-a',
    text: 'Hyvä muotoilu, ei huomautettavaa.',
    thread: 'seurantaryhma',
    status: 'kasitelty',
    resolvedBy: 'tekstiryhma-a',
    resolvedAt: '2026-04-20T08:00:00Z',
    createdAt: '2026-04-19T15:00:00Z',
  },
  // tw-1: tekstiryhma comment
  {
    id: 'comment-t1',
    textWorkId: 'tw-1',
    verseAnchor: { verseStart: 7 },
    verseSnapshot: 'vaikka Kristuksen apostoleina olisimmekin voineet vaatia arvonantoa. Olimme sen sijaan teidän keskuudessanne lempeitä kuin imettävä äiti, joka hoivaa lapsiaan.',
    authorId: 'tekstiryhma-b',
    text: 'Tekstikriittinen huomio: ēpioi vs. nēpioi vaikuttaa käännökseen merkittävästi.',
    thread: 'tekstiryhma',
    status: 'avoin',
    createdAt: '2026-04-17T11:00:00Z',
  },
  {
    id: 'comment-t2',
    textWorkId: 'tw-1',
    verseAnchor: { verseStart: 12 },
    verseSnapshot: 'ja tähdensimme, että teidän tulee vaeltaa Jumalan arvon mukaisesti, hänen, joka kutsuu teidät valtakuntaansa ja kirkkauteensa.',
    authorId: 'tekstiryhma-a',
    text: '"Tähdensimme" on vanhahtava — harkitaan "korostimme" tai "painotimme".',
    thread: 'tekstiryhma',
    status: 'avoin',
    createdAt: '2026-04-19T09:15:00Z',
  },
  // tw-5: rejection comment
  {
    id: 'comment-r1',
    textWorkId: 'tw-5',
    verseAnchor: { verseStart: 5 },
    verseSnapshot: 'Luvun 5 jae 5 teksti.',
    authorId: 'hallitus-c',
    text: 'Jakeen 5 käännös on epäselvä. Alkutekstin merkitys ei välity riittävästi.',
    thread: 'tekstiryhma',
    status: 'avoin',
    createdAt: '2026-04-26T11:00:00Z',
  },
]

export const SEED_MERKINNAT: Merkinta[] = [
  {
    id: 'merkinta-1',
    verses: [{ verseNumber: 3, text: 'Kehotuksemme' }],
    authorId: 'tekstiryhma-a',
    note: 'kr. paraklesis, voi tarkoittaa myös lohdutusta',
    createdAt: '2026-04-16T08:00:00Z',
  },
  {
    id: 'merkinta-2',
    verses: [{ verseNumber: 3, text: 'epäpuhtaista vaikuttimista' }],
    authorId: 'tekstiryhma-a',
    createdAt: '2026-04-16T08:30:00Z',
  },
  {
    id: 'merkinta-3',
    verses: [{ verseNumber: 7, text: 'imettävä' }],
    authorId: 'tekstiryhma-a',
    note: 'Tekstikriittinen: ēpioi vs. nēpioi — NA28 lukee ēpioi',
    createdAt: '2026-04-17T10:30:00Z',
  },
  {
    id: 'merkinta-4',
    verses: [{ verseNumber: 7, text: 'lempeät' }],
    authorId: 'tekstiryhma-a',
    createdAt: '2026-04-17T10:35:00Z',
  },
  {
    id: 'merkinta-5',
    verses: [{ verseNumber: 12, text: 'vaatineet' }],
    authorId: 'tekstiryhma-a',
    note: 'kr. martyromenoi — vertaa: todistaneet, vakuuttaneet',
    createdAt: '2026-04-19T09:15:00Z',
  },
  {
    id: 'merkinta-6',
    verses: [{ verseNumber: 16, text: 'viha' }],
    authorId: 'tekstiryhma-a',
    note: 'eis telos — eschatologinen vai historiallinen viittaus?',
    createdAt: '2026-04-20T11:00:00Z',
  },
  {
    id: 'merkinta-7',
    verses: [{ verseNumber: 9, text: 'Yötä päivää' }],
    authorId: 'tekstiryhma-b',
    note: 'Heprealainen sanajärjestys (ilta ensin)',
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
  {
    id: 'greek',
    label: 'Alkukieli (kreikka)',
    language: 'el',
    verses: [
      { number: 1, text: 'Αὐτοὶ γὰρ οἴδατε, ἀδελφοί, τὴν εἴσοδον ἡμῶν τὴν πρὸς ὑμᾶς ὅτι οὐ κενὴ γέγονεν,' },
      { number: 2, text: 'ἀλλὰ προπαθόντες καὶ ὑβρισθέντες, καθὼς οἴδατε, ἐν Φιλίπποις ἐπαρρησιασάμεθα ἐν τῷ θεῷ ἡμῶν λαλῆσαι πρὸς ὑμᾶς τὸ εὐαγγέλιον τοῦ θεοῦ ἐν πολλῷ ἀγῶνι.' },
      { number: 3, text: 'ἡ γὰρ παράκλησις ἡμῶν οὐκ ἐκ πλάνης οὐδὲ ἐξ ἀκαθαρσίας οὐδὲ ἐν δόλῳ,' },
      { number: 4, text: 'ἀλλὰ καθὼς δεδοκιμάσμεθα ὑπὸ τοῦ θεοῦ πιστευθῆναι τὸ εὐαγγέλιον, οὕτως λαλοῦμεν, οὐχ ὡς ἀνθρώποις ἀρέσκοντες ἀλλὰ θεῷ τῷ δοκιμάζοντι τὰς καρδίας ἡμῶν.' },
      { number: 5, text: 'οὔτε γάρ ποτε ἐν λόγῳ κολακείας ἐγενήθημεν, καθὼς οἴδατε, οὔτε ἐν προφάσει πλεονεξίας, θεὸς μάρτυς,' },
      { number: 6, text: 'οὔτε ζητοῦντες ἐξ ἀνθρώπων δόξαν οὔτε ἀφʼ ὑμῶν οὔτε ἀπʼ ἄλλων, δυνάμενοι ἐν βάρει εἶναι ὡς Χριστοῦ ἀπόστολοι.' },
      { number: 7, text: 'ἀλλὰ ἐγενήθημεν ἤπιοι ἐν μέσῳ ὑμῶν, ὡς ἐὰν τροφὸς θάλπῃ τὰ ἑαυτῆς τέκνα·' },
      { number: 8, text: 'οὕτως ὁμειρόμενοι ὑμῶν εὐδοκοῦμεν μεταδοῦναι ὑμῖν οὐ μόνον τὸ εὐαγγέλιον τοῦ θεοῦ ἀλλὰ καὶ τὰς ἑαυτῶν ψυχάς, διότι ἀγαπητοὶ ἡμῖν ἐγενήθητε.' },
      { number: 9, text: 'μνημονεύετε γάρ, ἀδελφοί, τὸν κόπον ἡμῶν καὶ τὸν μόχθον· νυκτὸς καὶ ἡμέρας ἐργαζόμενοι πρὸς τὸ μὴ ἐπιβαρῆσαί τινα ὑμῶν ἐκηρύξαμεν εἰς ὑμᾶς τὸ εὐαγγέλιον τοῦ θεοῦ.' },
      { number: 10, text: 'ὑμεῖς μάρτυρες καὶ ὁ θεός, ὡς ὁσίως καὶ δικαίως καὶ ἀμέμπτως ὑμῖν τοῖς πιστεύουσιν ἐγενήθημεν,' },
      { number: 11, text: 'καθάπερ οἴδατε, ὡς ἕνα ἕκαστον ὑμῶν ὡς πατὴρ τέκνα ἑαυτοῦ παρακαλοῦντες ὑμᾶς καὶ παραμυθούμενοι' },
      { number: 12, text: 'καὶ μαρτυρόμενοι εἰς τὸ περιπατεῖν ὑμᾶς ἀξίως τοῦ θεοῦ τοῦ καλοῦντος ὑμᾶς εἰς τὴν ἑαυτοῦ βασιλείαν καὶ δόξαν.' },
      { number: 13, text: 'Καὶ διὰ τοῦτο καὶ ἡμεῖς εὐχαριστοῦμεν τῷ θεῷ ἀδιαλείπτως, ὅτι παραλαβόντες λόγον ἀκοῆς παρʼ ἡμῶν τοῦ θεοῦ ἐδέξασθε οὐ λόγον ἀνθρώπων ἀλλὰ καθώς ἐστιν ἀληθῶς λόγον θεοῦ, ὃς καὶ ἐνεργεῖται ἐν ὑμῖν τοῖς πιστεύουσιν.' },
      { number: 14, text: 'ὑμεῖς γὰρ μιμηταὶ ἐγενήθητε, ἀδελφοί, τῶν ἐκκλησιῶν τοῦ θεοῦ τῶν οὐσῶν ἐν τῇ Ἰουδαίᾳ ἐν Χριστῷ Ἰησοῦ, ὅτι τὰ αὐτὰ ἐπάθετε καὶ ὑμεῖς ὑπὸ τῶν ἰδίων συμφυλετῶν καθὼς καὶ αὐτοὶ ὑπὸ τῶν Ἰουδαίων,' },
      { number: 15, text: 'τῶν καὶ τὸν κύριον ἀποκτεινάντων Ἰησοῦν καὶ τοὺς προφήτας καὶ ἡμᾶς ἐκδιωξάντων καὶ θεῷ μὴ ἀρεσκόντων καὶ πᾶσιν ἀνθρώποις ἐναντίων,' },
      { number: 16, text: 'κωλυόντων ἡμᾶς τοῖς ἔθνεσιν λαλῆσαι ἵνα σωθῶσιν, εἰς τὸ ἀναπληρῶσαι αὐτῶν τὰς ἁμαρτίας πάντοτε. ἔφθασεν δὲ ἐπʼ αὐτοὺς ἡ ὀργὴ εἰς τέλος.' },
      { number: 17, text: 'Ἡμεῖς δέ, ἀδελφοί, ἀπορφανισθέντες ἀφʼ ὑμῶν πρὸς καιρὸν ὥρας, προσώπῳ οὐ καρδίᾳ, περισσοτέρως ἐσπουδάσαμεν τὸ πρόσωπον ὑμῶν ἰδεῖν ἐν πολλῇ ἐπιθυμίᾳ.' },
      { number: 18, text: 'διότι ἠθελήσαμεν ἐλθεῖν πρὸς ὑμᾶς, ἐγὼ μὲν Παῦλος καὶ ἅπαξ καὶ δίς, καὶ ἐνέκοψεν ἡμᾶς ὁ σατανᾶς.' },
      { number: 19, text: 'τίς γὰρ ἡμῶν ἐλπὶς ἢ χαρὰ ἢ στέφανος καυχήσεως — ἢ οὐχὶ καὶ ὑμεῖς — ἔμπροσθεν τοῦ κυρίου ἡμῶν Ἰησοῦ ἐν τῇ αὐτοῦ παρουσίᾳ;' },
      { number: 20, text: 'ὑμεῖς γάρ ἐστε ἡ δόξα ἡμῶν καὶ ἡ χαρά.' },
    ],
  },
]

export const SEED_SNAPSHOTS: Snapshot[] = [
  // Publication snapshot for tw-1 (captured when it was briefly published, before pulling back)
  {
    id: 'snapshot-tw1-publication',
    textWorkId: 'tw-1',
    type: 'publication',
    createdAt: '2026-04-12T10:00:00Z',
    createdBy: 'tekstiryhma-a',
    verseTexts: SEED_VERSES.map(v => ({ number: v.number, text: v.baseText })),
    footnoteTexts: SEED_VERSES.flatMap(v =>
      (v.footnotes ?? []).map(fn => ({ verse: v.number, marker: fn.marker, text: fn.baseText }))
    ),
    sectionHeaderTexts: SEED_VERSES
      .filter(v => v.sectionHeader)
      .map(v => ({ verse: v.number, text: v.sectionHeader! })),
  },
  // Internal snapshot for tw-1
  {
    id: 'snapshot-tw1-internal',
    textWorkId: 'tw-1',
    type: 'internal',
    name: 'Ensimmäinen luonnoskierros',
    createdAt: '2026-04-14T17:00:00Z',
    createdBy: 'tekstiryhma-a',
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
    createdBy: 'tekstiryhma-a',
    verseTexts: [{ number: 1, text: 'Luvun 1 teksti (tiivistelmä).' }],
    footnoteTexts: [],
    sectionHeaderTexts: [],
  },
  // Submission snapshot for tw-4
  {
    id: 'snapshot-tw4-submission',
    textWorkId: 'tw-4',
    type: 'submission',
    createdAt: '2026-04-20T12:00:00Z',
    createdBy: 'tekstiryhma-b',
    verseTexts: [{ number: 1, text: 'Luvun 4 teksti (tiivistelmä).' }],
    footnoteTexts: [],
    sectionHeaderTexts: [],
  },
  // Submission snapshot for tw-5
  {
    id: 'snapshot-tw5-submission',
    textWorkId: 'tw-5',
    type: 'submission',
    createdAt: '2026-04-23T10:00:00Z',
    createdBy: 'tekstiryhma-a',
    verseTexts: [{ number: 1, text: 'Luvun 5 teksti (tiivistelmä).' }],
    footnoteTexts: [],
    sectionHeaderTexts: [],
  },
]

export const SEED_ACTIVITY: ActivityEntry[] = [
  {
    id: 'act-1',
    timestamp: '2026-04-26T11:00:00Z',
    userId: 'hallitus-c',
    textWorkId: 'tw-5',
    action: 'Hylätty',
    detail: '1. Tess. luku 5 — hallitus hylkäsi',
  },
  {
    id: 'act-2',
    timestamp: '2026-04-25T16:00:00Z',
    userId: 'hallitus-b',
    textWorkId: 'tw-4',
    action: 'Hyväksytty',
    detail: '1. Tess. luku 4 — hallitus hyväksyi yksimielisesti',
  },
  {
    id: 'act-3',
    timestamp: '2026-04-24T10:00:00Z',
    userId: 'hallitus-a',
    textWorkId: 'tw-3',
    action: 'Äänestetty',
    detail: '1. Tess. luku 1 — ääni annettu',
  },
  {
    id: 'act-4',
    timestamp: '2026-04-22T14:00:00Z',
    userId: 'tekstiryhma-a',
    textWorkId: 'tw-3',
    action: 'Lähetetty hallitukselle',
    detail: '1. Tess. luku 1 — lähetetty hallitukselle',
  },
  {
    id: 'act-5',
    timestamp: '2026-04-19T09:00:00Z',
    userId: 'seurantaryhma-a',
    textWorkId: 'tw-2',
    action: 'Uusi kommentti',
    detail: '1. Tess. luku 3 — uusi kommentti',
  },
  {
    id: 'act-6',
    timestamp: '2026-04-18T10:00:00Z',
    userId: 'tekstiryhma-a',
    textWorkId: 'tw-2',
    action: 'Julkaistu palautteelle',
    detail: '1. Tess. luku 3 — julkaistu seurantaryhmälle',
  },
]
