import { User, Verse, Proposal, ActivityEntry, Merkinta, Snapshot } from './types'

// 1. Tessalonikalaiskirje, Luku 2 — from the actual RK12 working document (Versio 28.3.2026)
export const SEED_VERSES: Verse[] = [
  {
    number: 1,
    baseText: 'Tiedättehän itsekin, veljet, että tulomme luoksenne ei ollut turha.',
    text: 'Tiedättehän itsekin, veljet, ettei tulomme teidän luoksenne ollut turha.',
    sectionHeader: 'Paavalin toiminta Tessalonikassa',
    footnotes: [{ marker: '1', text: '1. Tess. 1:5,9' }],
  },
  {
    number: 2,
    baseText: 'Olimme, kuten tiedätte, ennen joutuneet Filippissä kärsimään ja kestämään pahaa kohtelua, mutta Jumalamme antoi meille rohkeuden julistaa teille hänen evankeliumiaan kovienkin vastuksien keskellä.',
    text: 'Vaikka olimme aiemmin Filippissä kärsineet ja meitä oli siellä pahoinpidelty, niin kuin tiedätte, meillä oli kuitenkin Jumalassamme rohkeutta puhua teille Jumalan evankeliumia ankaran taistelun keskellä.',
    footnotes: [{ marker: '2', text: 'Ap. t. 16:19–24, 17:1; Fil. 1:30' }],
  },
  {
    number: 3,
    baseText: 'Kehotuksemme ei näet johdu harhasta eikä epäpuhtaista vaikuttimista, emmekä yritä pettää ketään.',
    text: 'Meidän kehotuksemme ei näet ole lähtöisin eksytyksestä, ei epäpuhtaasta mielestä eikä kavalaudesta.',
    footnotes: [{ marker: '3', text: '2. Kor. 4:2; 7:2' }],
  },
  {
    number: 4,
    baseText: 'Jumala on hyväksynyt meidät ja uskonut meille evankeliumin, ja siksi me puhumme, emme ihmisten mielen mukaisesti vaan Jumalan, joka tutkii sydämemme.',
    text: 'Koska Jumala on katsonut meidän kelpaavan siihen, että meille uskottiin evankeliumi, me puhumme, emme miellyttääksemme ihmisiä vaan Jumalaa, joka koettelee sydämemme.',
    footnotes: [{ marker: '4', text: '1. Aik. 29:17; Gal. 1:10; 1. Tim. 1:11–12' }],
  },
  {
    number: 5,
    baseText: 'Emme ole koskaan puhuneet mielistellen, kuten tiedätte, emmekä peittäneet ahneuttamme — Jumala on todistajamme.',
    text: 'Me emme ole koskaan esiintyneet imarteleviin sanoin, sen te tiedätte, emmekä tekosyin ahnehtineet voittoa. Jumala on todistajamme.',
    footnotes: [{ marker: '5', text: 'Mark. 12:40; Ap. t. 20:33–34; 2. Kor. 2:17' }],
  },
  {
    number: 6,
    baseText: 'Emme ole tavoitelleet kenenkään ylistystä, emme teidän emmekä muiden, vaikka olisimme Kristuksen apostoleina voineet vaatia arvonantoa.',
    text: 'Emme myöskään ole etsineet kunniaa ihmisiltä, emme teiltä emmekä muilta,',
    footnotes: [{ marker: '6', text: 'Joh. 5:41,44, 7:18; 2. Kor. 3:1' }],
  },
  {
    number: 7,
    baseText: 'Mutta me olimme teidän keskuudessanne lempeät, niin kuin imettävä äiti hellästi hoivaa lapsiaan.',
    text: 'vaikka Kristuksen apostoleina olisimmekin voineet vaatia arvonantoa. Olimme sen sijaan teidän keskuudessanne lempeitä kuin imettävä äiti, joka hoivaa lapsiaan.',
    footnotes: [{ marker: '7', text: '2. Kor. 10:1' }],
  },
  {
    number: 8,
    baseText: 'Niin hellät tunteet meitä valtasivat, että halusimme antaa teille Jumalan evankeliumin lisäksi oman henkemme, koska olitte tulleet meille niin rakkaiksi.',
    text: 'Teistä hellien me halusimme antaa teille, ei vain Jumalan evankeliumia vaan oman itsemmekin, sillä te olitte tulleet meille rakkaiksi.',
    footnotes: [{ marker: '8', text: 'Ap. t. 20:24; 2. Kor. 12:15; Fil. 2:17' }],
  },
  {
    number: 9,
    baseText: 'Muistattahan, veljet, meidän vaivannäkömme ja rasituksemme. Yötä päivää työtä tehden julistimme teille Jumalan evankeliumia, jotta emme olisi olleet kenellekään teistä rasituksena.',
    text: 'Muistattehan, veljet, kovan työmme ja vaivannäkömme. Yötä päivää me teimme työtä, ettemme olisi kenellekään teistä rasitukseksi, kun julistimme teille Jumalan evankeliumia.',
    footnotes: [{ marker: '9', text: 'Ap. t. 20:34; 2. Kor. 11:9; 2. Tess. 3:8' }],
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
    footnotes: [{ marker: '11', text: 'Ap. t. 20:20,31' }],
  },
  {
    number: 12,
    baseText: 'ja vaatineet vaeltamaan Jumalan arvoisesti, hänen, joka kutsuu teidät valtakuntaansa ja kirkkauteensa.',
    text: 'ja tähdensimme, että teidän tulee vaeltaa Jumalan arvon mukaisesti, hänen, joka kutsuu teidät valtakuntaansa ja kirkkauteensa.',
    footnotes: [{ marker: '12', text: 'Ef. 4:1; Fil. 1:27; Kol. 1:10; 1. Piet. 5:10' }],
  },
  {
    number: 13,
    baseText: 'Sen vuoksi me myös lakkaamatta kiitämme Jumalaa siitä, että kun saitte meiltä Jumalan sanan, te ette ottaneet sitä vastaan ihmisten sanana vaan Jumalan sanana, jota se todellakin on ja joka myös vaikuttaa teissä, jotka uskotte.',
    text: 'Siksi me myös lakkaamatta kiitämme Jumalaa siitä, että kun kuulitte meiltä Jumalan sanan, te otitte sen vastaan, ette ihmisten sanana vaan, niin kuin se todella on, Jumalan sanana, joka myös vaikuttaa teissä, jotka uskotte.',
    sectionHeader: 'Yhteiset kärsimykset',
    footnotes: [{ marker: '13', text: 'Matt. 10:40; Gal. 1:11, 4:14; 1. Tess. 1:5' }],
  },
  {
    number: 14,
    baseText: 'Te olette näet, veljet, seuranneet Jumalan Kristuksessa Jeesuksessa olevia seurakuntia Juudeassa, sillä te olette saaneet kärsiä omalta kansaltanne samaa kuin hekin juutalaisilta,',
    text: 'Teistä, veljet, on tullut niiden Kristuksessa Jeesuksessa olevien Jumalan seurakuntien seuraajia, jotka ovat Juudeassa. Ovathan teidän omat maanmiehenne aiheuttaneet samoja kärsimyksiä teille kuin juutalaiset noille seurakunnille.',
    footnotes: [{ marker: '14', text: 'Ap. t. 17:5,13' }],
  },
  {
    number: 15,
    baseText: 'jotka tappoivat sekä Herran Jeesuksen että profeetat ja ovat vainonneet meitäkin eivätkä ole Jumalalle mieliksi ja ovat kaikkia ihmisiä vastaan.',
    text: 'Juutalaisethan tappoivat Herran Jeesuksen ja profeetat ja ovat vainonneet myös meitä eivätkä ole Jumalalle mieleen. He ovat kaikkia ihmisiä vastaan,',
    footnotes: [{ marker: '15', text: 'Matt. 23:34,37; Luuk. 13:33–34; Ap. t. 7:52' }],
  },
  {
    number: 16,
    baseText: 'He yrittävät estää meitä puhumasta pakanakansoille, että nämä pelastuisivat, ja niin he tekevät syntiensä mitan aina vain täyteen. Mutta viha on heidät vihdoin saavuttanut.',
    text: 'kun estävät meitä puhumasta pakanoille heidän pelastumisekseen. Näin he yhä täyttävät syntiensä mitan. Viha onkin saavuttanut heidät täyteen määräänsa asti.',
    footnotes: [{ marker: '16', text: 'Ap. t. 13:45,50, 14:2,19, 17:5,13' }],
  },
  {
    number: 17,
    baseText: 'Me, veljet, jouduttuamme hetkeksi eroon teistä — tosin vain kasvoilta, emme sydämeltä — yritimme sitäkin suuremmalla kaipauksella innokkaasti päästä tapaamaan teitä.',
    text: 'Kun me nyt, veljet, olemme joksikin aikaa joutuneet teistä eroon – ulkonaisesti, emme sydämessämme – olemme entistä enemmän ikävöineet teitä ja koettaneet päästä näkemään teidän kasvonne.',
    sectionHeader: 'Paavalin halu nähdä tessalonikalaiset',
    footnotes: [{ marker: '17', text: 'Room. 1:11; 1. Tess. 3:6' }],
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
    footnotes: [{ marker: '19', text: '2. Kor. 1:14; Fil. 2:16, 4:1; 2. Tess. 1:4' }],
  },
  {
    number: 20,
    baseText: 'Te olette meidän kunniamme ja ilomme.',
    text: 'Tehän olette meidän kunniamme ja ilomme.',
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
  // Proposal A: verse 4 — matching the green text in the Word document
  {
    id: 'proposal-a',
    ranges: [{ verseStart: 4, verseEnd: 4, proposedText: 'Jumala katsoi meidät kelvollisiksi ja uskoi meille evankeliumin. Siksi me puhumme, emme miellyttääksemme ihmisiä vaan Jumalaa, joka koettelee sydämemme.' }],
    rationale: 'Jakaminen kahteen virkkeeseen selkeyttää. "Katsoi kelvollisiksi" on tarkempi käännös kreikan δοκιμάζω-verbistä kuin "katsonut kelpaavan".',
    authorId: 'kaantaja-a',
    status: 'hyvaksytty_lopullisesti',
    votes: [],
    comments: [
      {
        id: 'comment-1',
        authorId: 'kaantaja-b',
        text: '"Katsoi kelvollisiksi" on tarkka ja silti luonteva. Kahteen virkkeeseen jakaminen selkeyttää.',
        createdAt: '2026-04-08T10:00:00Z',
        thread: 'main',
      },
      {
        id: 'comment-2',
        authorId: 'hallitus-a',
        text: 'Hallitus on hyväksynyt muutoksen.',
        createdAt: '2026-04-14T16:00:00Z',
        thread: 'main',
      },
    ],
    createdAt: '2026-04-05T08:00:00Z',
    statusChangedAt: '2026-04-14T16:00:00Z',
  },
  // Proposal B: verse 9 — reordered sentence, matching Word green text
  {
    id: 'proposal-b',
    ranges: [{ verseStart: 9, verseEnd: 9, proposedText: 'Muistattehan, veljet, kovan työmme ja vaivannäkömme. Kun julistimme teille Jumalan evankeliumia, teimme samalla työtä yötä päivää, ettemme olisi kenellekään teistä rasitukseksi.' }],
    rationale: 'Lausejärjestyksen muutos: julistaminen ensin, työ sen rinnalla. Luontevampi suomenkielinen sanajärjestys.',
    authorId: 'kaantaja-b',
    status: 'ehdotettu',
    votes: [],
    comments: [
      {
        id: 'comment-3',
        authorId: 'kaantaja-a',
        text: 'Sanajärjestys on nyt luontevampi. "Teimme samalla työtä" korostaa työn samanaikaisuutta julistamisen kanssa.',
        createdAt: '2026-04-22T11:00:00Z',
        thread: 'main',
      },
      {
        id: 'comment-3s',
        authorId: 'seurantaryhma-a',
        text: 'Uusi sanajärjestys on selkeämpi. Alkutekstin painotus säilyy.',
        createdAt: '2026-04-23T09:00:00Z',
        thread: 'seurantaryhma',
      },
    ],
    createdAt: '2026-04-17T14:00:00Z',
    statusChangedAt: '2026-04-21T08:00:00Z',
  },
  // Proposal C: verse 12 — matching Word green text
  {
    id: 'proposal-c',
    ranges: [{ verseStart: 12, verseEnd: 12, proposedText: 'ja korostimme, että teidän tulee vaeltaa niin kuin Jumalan arvo vaatii, hänen, joka kutsuu teidät valtakuntaansa ja kirkkauteensa.' }],
    rationale: '"Tähdensimme" → "korostimme" on nykysuomessa luontevampi. "Jumalan arvon mukaisesti" → "niin kuin Jumalan arvo vaatii" on konkreettisempi.',
    authorId: 'kaantaja-a',
    status: 'hallituksen_kasittelyssa',
    votes: [
      { userId: 'hallitus-a', decision: 'approve', createdAt: '2026-04-25T10:00:00Z' },
    ],
    comments: [
      {
        id: 'comment-4',
        authorId: 'kaantaja-b',
        text: '"Korostimme" on hyvä valinta. Selkeämpi kuin "tähdensimme".',
        createdAt: '2026-04-24T09:00:00Z',
        thread: 'main',
      },
      {
        id: 'comment-5s',
        authorId: 'seurantaryhma-a',
        text: 'Seurantaryhmä on tarkistanut — ei huomautettavaa.',
        createdAt: '2026-04-24T15:00:00Z',
        thread: 'seurantaryhma',
      },
    ],
    createdAt: '2026-04-20T10:00:00Z',
    statusChangedAt: '2026-04-24T12:00:00Z',
  },
  // Proposal D: verse 19 — matching Word green text
  {
    id: 'proposal-d',
    ranges: [{ verseStart: 19, verseEnd: 19, proposedText: 'Kuka on meidän toivomme tai ilomme tai kerskauksemme kruunu Herramme Jeesuksen edessä, kun hän saapuu, ellette te?' }],
    rationale: '"Hänen tulemuksessaan" → "kun hän saapuu" on suorempi ja luontevampi ilmaus.',
    authorId: 'kaantaja-a',
    status: 'ehdotettu',
    votes: [],
    comments: [],
    createdAt: '2026-04-22T08:00:00Z',
    statusChangedAt: '2026-04-22T08:00:00Z',
  },
  // Proposal E: verse 20 — matching Word green text
  {
    id: 'proposal-e',
    ranges: [{ verseStart: 20, verseEnd: 20, proposedText: 'Juuri te olette meidän kunniamme ja ilomme.' }],
    rationale: '"Tehän" → "Juuri te" painottaa korostusta selvemmin.',
    authorId: 'kaantaja-b',
    status: 'ehdotettu',
    votes: [],
    comments: [
      {
        id: 'comment-6s',
        authorId: 'seurantaryhma-b',
        text: '"Juuri te" on painokkaampi ja sopii paremmin retorisen kysymyksen jatkoksi.',
        createdAt: '2026-04-23T14:00:00Z',
        thread: 'seurantaryhma',
      },
    ],
    createdAt: '2026-04-22T09:00:00Z',
    statusChangedAt: '2026-04-22T09:00:00Z',
  },
]

export const SEED_MERKINNAT: Merkinta[] = [
  {
    id: 'merkinta-1',
    verses: [{ verseNumber: 3, text: 'Kehotuksemme' }],
    authorId: 'kaantaja-a',
    note: 'kr. paraklesis, voi tarkoittaa myös lohdutusta',
    createdAt: '2026-04-16T08:00:00Z',
  },
  {
    id: 'merkinta-2',
    verses: [{ verseNumber: 3, text: 'epäpuhtaista vaikuttimista' }],
    authorId: 'kaantaja-a',
    createdAt: '2026-04-16T08:30:00Z',
  },
  {
    id: 'merkinta-3',
    verses: [{ verseNumber: 7, text: 'imettävä' }],
    authorId: 'kaantaja-a',
    note: 'Tekstikriittinen: ēpioi vs. nēpioi — NA28 lukee ēpioi',
    createdAt: '2026-04-17T10:30:00Z',
  },
  {
    id: 'merkinta-4',
    verses: [{ verseNumber: 7, text: 'lempeät' }],
    authorId: 'kaantaja-a',
    createdAt: '2026-04-17T10:35:00Z',
  },
  {
    id: 'merkinta-5',
    verses: [{ verseNumber: 12, text: 'vaatineet' }],
    authorId: 'kaantaja-a',
    note: 'kr. martyromenoi — vertaa: todistaneet, vakuuttaneet',
    createdAt: '2026-04-19T09:15:00Z',
  },
  {
    id: 'merkinta-6',
    verses: [{ verseNumber: 16, text: 'viha' }],
    authorId: 'kaantaja-a',
    note: 'eis telos — eschatologinen vai historiallinen viittaus?',
    createdAt: '2026-04-20T11:00:00Z',
  },
  {
    id: 'merkinta-7',
    verses: [{ verseNumber: 9, text: 'Yötä päivää' }],
    authorId: 'kaantaja-b',
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
  {
    id: 'snapshot-1',
    name: 'Ensimmäinen luonnoskierros',
    createdAt: '2026-04-14T17:00:00Z',
    createdBy: 'kaantaja-a',
    verseTexts: SEED_VERSES.map(v => {
      if (v.number === 4) {
        return { number: 4, text: 'Jumala on katsonut meidät kelvollisiksi ja uskonut meille evankeliumin, ja sen mukaisesti me puhumme — emme miellyttääksemme ihmisiä vaan Jumalaa, joka tutkii sydämemme.' }
      }
      return { number: v.number, text: v.baseText }
    }),
    includedProposalIds: ['proposal-d'],
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
