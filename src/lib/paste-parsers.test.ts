import { describe, it, expect } from 'vitest'
import { parseVerseLines, parseVerseLinesEndOfChapter, parseDocxPaste } from './paste-parsers'

// ── parseVerseLines ───────────────────────────────────

describe('parseVerseLines', () => {
  it('parses sequential verses', () => {
    const result = parseVerseLines('1 First verse text\n2 Second verse text')
    expect(result).toEqual([
      { number: 1, text: 'First verse text' },
      { number: 2, text: 'Second verse text' },
    ])
  })

  it('appends continuation lines to previous verse', () => {
    const result = parseVerseLines('1 First line\ncontinuation line\n2 Second verse')
    expect(result).toEqual([
      { number: 1, text: 'First line\ncontinuation line' },
      { number: 2, text: 'Second verse' },
    ])
  })

  it('returns null for non-verse text', () => {
    expect(parseVerseLines('just some text\nwithout verse numbers')).toBeNull()
  })

  it('skips empty lines', () => {
    const result = parseVerseLines('1 First\n\n\n2 Second')
    expect(result).toEqual([
      { number: 1, text: 'First' },
      { number: 2, text: 'Second' },
    ])
  })
})

// ── parseVerseLinesEndOfChapter ───────────────────────

describe('parseVerseLinesEndOfChapter', () => {
  it('parses sequential verses', () => {
    const result = parseVerseLinesEndOfChapter('1 First verse\n2 Second verse')
    expect(result).toEqual([
      { number: 1, text: 'First verse', footnotes: [] },
      { number: 2, text: 'Second verse', footnotes: [] },
    ])
  })

  it('treats non-sequential numbers as footnotes', () => {
    const result = parseVerseLinesEndOfChapter('1 First verse\n5 Some cross-ref\n2 Second verse')
    expect(result).toEqual([
      { number: 1, text: 'First verse', footnotes: [{ marker: '5', text: 'Some cross-ref' }] },
      { number: 2, text: 'Second verse', footnotes: [] },
    ])
  })

  it('handles continuation text', () => {
    const result = parseVerseLinesEndOfChapter('1 First line\ncontinuation\n2 Second verse')
    expect(result).toEqual([
      { number: 1, text: 'First line\ncontinuation', footnotes: [] },
      { number: 2, text: 'Second verse', footnotes: [] },
    ])
  })
})

// ── parseDocxPaste ────────────────────────────────────

describe('parseDocxPaste', () => {
  it('returns null for text without chapter headings', () => {
    expect(parseDocxPaste('1 Just a verse\n2 Another verse')).toBeNull()
  })

  it('parses a single chapter with verses', () => {
    const input = `Luku 1
1 First verse text
2 Second verse text`

    const result = parseDocxPaste(input)!
    expect(result).not.toBeNull()
    expect(result[0]).toEqual({ type: 'chapterHeading', chapter: 1, text: '' })
    expect(result[1]).toEqual({ type: 'verse', chapter: 1, verse: 1, text: 'First verse text' })
    expect(result[2]).toEqual({ type: 'verse', chapter: 1, verse: 2, text: 'Second verse text' })
  })

  it('parses section headers', () => {
    const input = `Luku 1
Alkutervehdys
1 First verse`

    const result = parseDocxPaste(input)!
    expect(result[0]).toEqual({ type: 'chapterHeading', chapter: 1, text: '' })
    expect(result[1]).toEqual({ type: 'sectionHeader', verse: undefined, text: 'Alkutervehdys' })
    expect(result[2]).toEqual({ type: 'verse', chapter: 1, verse: 1, text: 'First verse' })
  })

  it('parses section headers between verses', () => {
    const input = `Luku 1
1 First verse.
2 Second verse.
Elämä on minulle Kristus
3 Third verse.`

    const result = parseDocxPaste(input)!
    const sectionHeader = result.find(n => n.type === 'sectionHeader')
    expect(sectionHeader).toEqual({ type: 'sectionHeader', verse: 2, text: 'Elämä on minulle Kristus' })
  })

  it('appends continuation lines to previous verse (poetry-style)', () => {
    const input = `Luku 1
6 Hänellä oli Jumalan muoto,
mutta hän ei katsonut saaliikseen olla Jumalan kaltainen
7 vaan tyhjensi itsensä`

    const result = parseDocxPaste(input)!
    const v6 = result.find(n => n.type === 'verse' && n.verse === 6)!
    expect(v6.text).toBe('Hänellä oli Jumalan muoto,\nmutta hän ei katsonut saaliikseen olla Jumalan kaltainen')
    expect(result.find(n => n.type === 'verse' && n.verse === 7)!.text).toBe('vaan tyhjensi itsensä')
  })

  it('detects duplicate verse numbers: first becomes base, second becomes verse', () => {
    const input = `Luku 1
1 Base text for verse one
1 Alternative text for verse one
2 Second verse`

    const result = parseDocxPaste(input)!
    expect(result[1]).toEqual({ type: 'base', chapter: 1, verse: 1, text: 'Base text for verse one' })
    expect(result[2]).toEqual({ type: 'verse', chapter: 1, verse: 1, text: 'Alternative text for verse one' })
    expect(result[3]).toEqual({ type: 'verse', chapter: 1, verse: 2, text: 'Second verse' })
  })

  it('parses inline footnotes (N:N. pattern)', () => {
    const input = `Luku 1
1 Verse with footnote marker*
1:1. This is the footnote text
2 Next verse`

    const result = parseDocxPaste(input)!
    const footnote = result.find(n => n.type === 'footnote')
    expect(footnote).toEqual({ type: 'footnote', verse: 1, text: '1:1 This is the footnote text' })
  })

  it('parses multiple chapters', () => {
    const input = `Luku 1
1 Chapter one verse one
2 Chapter one verse two

Luku 2
1 Chapter two verse one
2 Chapter two verse two`

    const result = parseDocxPaste(input)!
    const chapters = result.filter(n => n.type === 'chapterHeading')
    expect(chapters).toHaveLength(2)
    expect(chapters[0].chapter).toBe(1)
    expect(chapters[1].chapter).toBe(2)

    const verses = result.filter(n => n.type === 'verse')
    expect(verses).toHaveLength(4)
    expect(verses[0]).toMatchObject({ chapter: 1, verse: 1 })
    expect(verses[1]).toMatchObject({ chapter: 1, verse: 2 })
    expect(verses[2]).toMatchObject({ chapter: 2, verse: 1 })
    expect(verses[3]).toMatchObject({ chapter: 2, verse: 2 })
  })

  it('parses cross-reference sections (second Luku occurrence)', () => {
    const input = `Luku 1
1 First verse
2 Second verse

Luku 1
1 Ap. t. 20:28; 1. Kor. 1:2
2 Room. 1:7; Kol. 1:2`

    const result = parseDocxPaste(input)!
    const crossRefs = result.filter(n => n.type === 'crossRef')
    expect(crossRefs).toHaveLength(2)
    expect(crossRefs[0]).toEqual({ type: 'crossRef', chapter: 1, verse: 1, text: 'Ap. t. 20:28; 1. Kor. 1:2' })
    expect(crossRefs[1]).toEqual({ type: 'crossRef', chapter: 1, verse: 2, text: 'Room. 1:7; Kol. 1:2' })
  })

  it('handles the full Philippians working document format', () => {
    const input = `Luku 1
Alkutervehdys
1 Paavali ja Timoteus, Kristuksen Jeesuksen palvelijat, kaikille Filippissä oleville pyhille.
2 Armo teille ja rauha Jumalalta, meidän Isältämme.
Rukous kirjeen lukijoiden puolesta
3 Minä kiitän Jumalaani niin usein kuin muistan teitä.
4 Kaikissa rukouksissani rukoilen aina iloiten teidän kaikkien puolesta.
5 Kiitän siitä, että olette osallistuneet evankeliumin työhön* ensi päivästä tähän asti,
1:5. Tai "olette olleet osalliset evankeliumiin".
6 ja luotan täysin siihen, että hän vie työn päätökseen.
7 Onkin oikein, että ajattelen näin teistä kaikista.
7 Onkin oikein, että ajattelen näin teistä kaikista, koska olette sydämessäni.

Luku 1
1 Ap. t. 20:28; 1. Kor. 1:2
3 Room. 1:8–9
6 1. Kor. 1:8

Luku 2
Kristuksen nöyryys ja korotus
1 Jos siis on jotakin kehotusta Kristuksessa.
2 tehkää minun iloni täydelliseksi.

Luku 2
1 Room. 12:16
2 Room. 12:10`

    const result = parseDocxPaste(input)!
    expect(result).not.toBeNull()

    // Chapter headings
    const chHeadings = result.filter(n => n.type === 'chapterHeading')
    expect(chHeadings).toHaveLength(2)
    expect(chHeadings[0].chapter).toBe(1)
    expect(chHeadings[1].chapter).toBe(2)

    // Section headers
    const sections = result.filter(n => n.type === 'sectionHeader')
    expect(sections.map(s => s.text)).toEqual([
      'Alkutervehdys',
      'Rukous kirjeen lukijoiden puolesta',
      'Kristuksen nöyryys ja korotus',
    ])

    // Verses — chapter 1 has 7 (with verse 7 duplicated as base+verse), chapter 2 has 2
    const ch1Verses = result.filter(n => n.type === 'verse' && n.chapter === 1)
    expect(ch1Verses).toHaveLength(7)
    expect(ch1Verses[0].verse).toBe(1)
    expect(ch1Verses[6].verse).toBe(7)
    // The proposal (second occurrence) is the verse
    expect(ch1Verses[6].text).toContain('koska olette sydämessäni')

    const ch2Verses = result.filter(n => n.type === 'verse' && n.chapter === 2)
    expect(ch2Verses).toHaveLength(2)

    // Base text for verse 7 (first occurrence, demoted)
    const bases = result.filter(n => n.type === 'base')
    expect(bases).toHaveLength(1)
    expect(bases[0]).toMatchObject({ chapter: 1, verse: 7 })
    expect(bases[0].text).not.toContain('koska olette sydämessäni')

    // Inline footnote
    const footnotes = result.filter(n => n.type === 'footnote')
    expect(footnotes).toHaveLength(1)
    expect(footnotes[0].verse).toBe(5)
    expect(footnotes[0].text).toContain('olette olleet osalliset')

    // Cross-references
    const ch1Refs = result.filter(n => n.type === 'crossRef' && n.chapter === 1)
    expect(ch1Refs).toHaveLength(3)
    expect(ch1Refs[0]).toMatchObject({ verse: 1, text: 'Ap. t. 20:28; 1. Kor. 1:2' })
    expect(ch1Refs[1]).toMatchObject({ verse: 3 })
    expect(ch1Refs[2]).toMatchObject({ verse: 6 })

    const ch2Refs = result.filter(n => n.type === 'crossRef' && n.chapter === 2)
    expect(ch2Refs).toHaveLength(2)
  })

  it('keeps footnote chapter:verse marker in text', () => {
    const input = `Luku 3
9 ja minun havaittaisiin olevan hänessä, vaan sen, joka tulee uskosta Kristukseen*, sen vanhurskauden.
3:9. Tai "Kristuksen uskosta".`

    const result = parseDocxPaste(input)!
    const fn = result.find(n => n.type === 'footnote')!
    expect(fn.text).toBe('3:9 Tai "Kristuksen uskosta".')
    expect(fn.verse).toBe(9)
  })
})
