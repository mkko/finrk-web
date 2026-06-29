# Web-reader demo: kattava toiminnallisuuskuvaus

**Sovellus:** Next.js 16 (Turbopack) + Zustand, sijainti `/Users/mikko/Personal/Raamattu/web-reader/`. Zustand-store persistoidaan localStorageen (avain `raamattu-kaannostyo`). Ei backendiä — kaikki data on client-side seed-dataa jota voi muokata selaimen kautta.

**Mikä tämä on:** Prototyyppi Raamatun käännösehdotusten hallintaan ja arviointiin. Simuloi työnkulkua jossa tekstiryhmä kääntää, seurantaryhmä kommentoi, ja hallitus ratifioi käännökset. Käytössä on Filippiläiskirje esimerkkikirjana (4 lukua, ~100 jaetta).

---

## Käännöstyöprosessin tilakone

```
                                                           ↗ Hyväksytty ↘
Luonnos → Julkaistu palautteelle → Lähetetty hallitukselle                Luonnos (uusi kierros)
                                                           ↘ Hylätty   ↗
```

- **Luonnos:** Tekstiryhmä muokkaa. Voi julkaista palautteelle.
- **Julkaistu palautteelle:** Seurantaryhmä näkee ja voi kommentoida. Tekstiryhmä voi lähettää hallitukselle.
- **Lähetetty hallitukselle:** Hallitus käsittelee. Ei manuaalisia siirtymiä — ratkaistaan päätöksellä.
- **Hyväksytty:** Hallitus vahvistanut. Tekstiryhmä voi aloittaa uuden kierroksen (→ Luonnos).
- **Hylätty:** Hallitus palauttanut. Tekstiryhmä voi palauttaa luonnokseksi.

---

## Sivut ja näkymät

### `/` — Luku (päänäkymä)

Kolmiosainen näkymä: työkalupalkki + editori + sivupaneeli.

**Työkalupalkki:**
- **Versiokytkimet:** "Nykyinen" (pohjaversio), "Luonnos" (muokattu teksti, muutosten lukumäärä), "Aiemmat versiot" (versiohistoria)
- **Julkaise-painike:** Näkyy tekstiryhmälle kun luonnoksessa on muutoksia
- **Tilapalkki:** Tekstin nykyinen tila (Luonnos, Julkaistu palautteelle, jne.)
- **Avoimet kommentit:** Lukumäärä

**TipTap-editori:**
- Kolme paragraph-tyyppiä: Jae (verse), Väliotsikko (section header), Alaviite (footnote)
- Jaenumerot tunnistetaan automaattisesti regexillä, numerottomat kappaleet ovat edellisen jakeen jatkoa
- Alaviitteiden näyttötapa: "Luvun lopussa" tai "Rivin alla" (vaihto työkalupalkista)
- DOCX-paste tuki: liitetty teksti parsitaan automaattisesti jakeiksi
- Read-only-tila kun teksti on lähetetty hallitukselle tai käyttäjällä ei ole muokkausoikeutta
- Tilannekuvan katselutila: sininen banneri, read-only

**Sivupaneeli (VerseDetailPanel):**
- Aukeaa jakeesta — kursorilla (leveällä näytöllä) tai klikkaamalla (kapealla)
- Näyttää nykyisen tekstin ja pohjaversiotekstin
- **Kommentointi:** Avoimet ja käsitellyt kommentit, uuden kommentin kirjoitus
  - Tekstiryhmä näkee kaikki langat (tekstiryhma + seurantaryhma)
  - Seurantaryhmä näkee vain oman langan
  - Tekstiryhmä voi merkitä kommentteja käsitellyiksi
- **Merkinnät (highlights):** Tekstiryhmä voi korostaa sanoja ja lisätä muistiinpanoja (kreikan alkuteksti, käännösvaihtoehdot). Näkyvät keltaisina korostuksina editorissa.
- Marginaalikommenttikuplat: avoimet kommentit näkyvät editorin oikeassa reunassa

**Versiohistoria (Aiemmat versiot -välilehti):**
- Aikajana näyttää kahdenlaisia merkintöjä aikajärjestyksessä (uusin ensin):
  - **Välietapit** — värikoodattuja: vihreä "Pohjaversio (RK12)", violetti "Käsittelyssä", vihreä "Hyväksytty", punainen "Hylätty"
  - **Luonnokset** — neutraaleja merkintöjä välietappien välissä, tekijän nimellä
- Klikkaamalla merkintää näytetään sana-tason diff edelliseen välietappiin verrattuna
- Diff: LCS-pohjainen word-diff, vihreä lisäys, punainen poisto, lohkodiff kun samankaltaisuus < 40%

**Tilannekuvat (SnapshotList-dialogi):**
- Tekstiryhmä voi luoda nimettyjä tilannekuvia ("Ennen palautekierrosta" jne.)
- Tilannekuva tallentaa jakeiden tekstit, alaviitteet ja väliotsikot
- Tilannekuvan voi palauttaa — korvaa nykyisen tekstin

### `/lahetys` — Ehdota (tekstiryhmä)

Tekstiryhmän näkymä hallitukselle lähettämiseen:
- **Uusi ehdotus:** Valitse jakeet joissa on muutoksia (checkbox-lista diffeineen), kirjoita perustelut, valitse hallituksen äänestäjät, lähetä
- **Lähetetyt ehdotukset:** Lista ehdotuksista ja niiden tiloista (Käsittelyssä / Hyväksytty / Hylätty / Peruutettu)

### `/ehdotukset` — Tekstit

Kaikille rooleille näkyvä lista tekstityöistä:
- Suodatus tilan mukaan (välilehdet)
- Roolikohtainen oletusnäkymä: hallitukselle "Lähetetty hallitukselle", seurantaryhmälle "Julkaistu palautteelle"
- Tekstityön tila, avoimet kommentit, linkki lukuun

### `/hallitus` — Ratifiointi (hallitus)

Hallituksen ehdotuslistaus:
- Ryhmittely: "Odottaa äänestystäsi" → "Käsittelyssä" → "Ratkaistut"
- Jokaisessa kortissa: laajuus + jakeet, päivämäärä, tilapalkki, äänestystilanne pilleinä
- Linkki `/review/[proposalId]`-sivulle

### `/review/[proposalId]` — Ehdotuksen tarkastelu

Yksittäisen ehdotuksen käsittelysivu:
- **Yläosa:** Kirjan nimi, lähetyspäivä, lähettäjä, perustelut
- **Hallituksen päätös (yläosassa):**
  - Avoin ehdotus: "Vahvista käännös" / "Palauta käännettäväksi" -painikkeet
  - Ratkaistu: "Hallitus on vahvistanut käännöksen" (vihreä) tai "Hallitus on palauttanut käännettäväksi" (punainen, syy näkyvissä)
  - Peruutettu: "Käsittely peruutettu" + päivämäärä
- **Dokumentti:** A4-tyylinen sivu, diff pohjaversiota vasten (muuttuneet jakeet korostettuna, kontekstijakeita ympärillä, väliviivat aukkojen kohdalla)
- **Kommentointi:** Hallituksen jäsenet voivat valita tekstiä ja kommentoida suoraan (popup-ikkuna), marginaalikuplat oikeassa reunassa, sivupaneeli kommenttikeskusteluille
- **Jäsenten kannanotot (dokumentin alla):**
  - Äänestystilanne: N/M äänestänyt, nimipalkit (vihreä=hyväksy, punainen=hylkää, harmaa=ei äänestänyt)
  - Äänestäjien hallinta: hallitus voi lisätä/poistaa äänestäjiä (UserPlus/UserMinus)
  - Kannanotot-loki: aikajärjestyksessä jokainen ääni + päivämäärä + mahdollinen kommentti
- **Peruutus:** Tekstiryhmä voi peruuttaa avoimen ehdotuksen

### `/seurantaryhma` — Arviointi (seurantaryhmä)

Lista palautteelle julkaistuista teksteistä:
- Julkaisupäivämäärä, avoimet kommentit, onko itse kommentoinut
- Klikkaus avaa lukusivun kyseiseen kirjaan

### `/edistyminen` — Edistyminen

Kaikkien näkymä käännösprosessin etenemisestä:
- Edistymispalkki: hyväksytyt / kaikki tekstityöt
- Tilakohtaiset laskurit korteissa (Luonnos, Julkaistu, Lähetetty, Hyväksytty, Hylätty)

---

## Tietomallit

**Verse:** `chapter`, `number`, `text` (nykyinen), `baseText` (pohjaversio), `approvedText` (viimeisin hyväksytty), `sectionHeader?`, `footnotes?`

**TextWork:** Käännöstyö yhdelle kirjalle. Tila (status), linkki aktiiviseen ehdotukseen.

**Proposal:** Ehdotus hallitukselle. Sisältää `snapshotId` (jäädytetty teksti), `selectedVoters`, `selectedVerses`, `rationale`, `votes[]`, `resolvedAt?`, `cancelledAt?`.

**Snapshot:** Tilannekuva tekstistä. Tyyppi: `publication` (pohjaversio), `internal` (luonnos), `submission` (lähetys). Sisältää jakeet, alaviitteet, väliotsikot.

**Comment:** Jakeeseen ankkuroitu kommentti. Lanka (thread): `tekstiryhma`, `seurantaryhma`, `hallitus`. Tila: `avoin` / `kasitelty`.

**Merkintä:** Tekstiryhmän korostus + muistiinpano (esim. kreikan sanan merkitys).

**Vote:** Yksittäinen ääni: `approve` / `reject`, vapaaehtoinen kommentti.

---

## Käyttäjäroolit ja näkyvyys

| Nimi | Rooli(t) | ID |
|------|----------|-----|
| Kimmo Leino (1. varapj.) | Tekstiryhmä + Hallitus | `leino-kimmo` |
| Martti Ahvenainen | Tekstiryhmä + Hallitus | `ahvenainen-martti` |
| Riku Kivinen (2. varapj.) | Tekstiryhmä + Hallitus | `kivinen-riku` |
| Kimmo Peltola | Tekstiryhmä | `peltola-kimmo` |
| Arto Liukko (pj.) | Hallitus | `liukko-arto` |
| Sointu Kaikkonen | Hallitus | `kaikkonen-sointu` |
| Matti Mantsinen | Hallitus | `mantsinen-matti` |
| Maria Välimäki (sihteeri) | Hallitus | `valimaki-maria` |
| Seurantaryhmä A & B | Seurantaryhmä | placeholder-käyttäjät |

**Navigaatio roolikohtaisesti:**
- Kaikki: Luku, Tekstit, Edistyminen
- Tekstiryhmä: + Ehdota
- Seurantaryhmä: + Arviointi
- Hallitus: + Ratifiointi

Käyttäjävalinta tapahtuu modaalissa sovelluksen käynnistyessä (pakollinen). Vaihto milloin tahansa header-valikosta. Monikäyttäjät (esim. Kimmo Leino) näkevät kaikkien rooliensa valikot.

---

## Demo-data

- Yksi tekstityö: Filippiläiskirje (`tw-1`), tilassa "Lähetetty hallitukselle"
- Yksi avoin ehdotus: Fil. 1:1–7 jakeet, Arto Liukko äänestänyt puolesta
- Ei kommentteja
- Kolme snapshottia: Pohjaversio (RK12), Ensimmäinen luonnoskierros, Lähetys-snapshot
- "Lataa esimerkkidata" / "Tyhjennä data" -painikkeet käyttäjävalintamodaalissa

**Käynnistys:** `cd web-reader && npm run dev` → `localhost:3000`

---

## Käyttötapaukset — demon läpikäynti

### 1. Tekstiryhmän työskentely

**Käyttäjä:** Kimmo Leino (tekstiryhmä + hallitus)

**a) Tekstin muokkaus**
- Avaa Luku-sivu → valitse "Luonnos"-välilehti
- Klikkaa jaetta editorissa → teksti muokattavissa
- Muokkaa jakeen sanamuotoa — muutoslaskuri päivittyy työkalupalkissa
- Klikkaa jaetta sivupaneelista: näe nykyinen teksti vs. pohjaversio

**b) Alaviitteet ja väliotsikot**
- Editorissa: vaihda kappaleen tyypiksi "Väliotsikko" tai "Alaviite"
- Kokeile alaviitteiden näyttötapaa: "Luvun lopussa" vs. "Rivin alla"

**c) Merkinnät (muistiinpanot)**
- Valitse sana editorista → "Lisää merkintä"
- Kirjoita muistiinpano (esim. kreikan sanan merkitys)
- Korostus näkyy keltaisena editorissa, muistiinpano sivupaneelissa

**d) Tilannekuvan luominen**
- Avaa tilannekuvalista → "Luo uusi tilannekuva"
- Anna nimi (esim. "Ennen palautekierrosta") → tallentuu versiohistoriaan

**e) Versiohistoria**
- Vaihda "Aiemmat versiot" -välilehdelle
- Aikajana: Pohjaversio (RK12) vihreänä välietappina, luonnokset niiden välissä
- Klikkaa luonnosta → näe sana-tason diff pohjaversioon verrattuna

---

### 2. Julkaisu seurantaryhmälle

**Käyttäjä:** Kimmo Leino

- Luku-sivun työkalupalkissa: klikkaa "Julkaise"
- Tila muuttuu: Luonnos → Julkaistu palautteelle
- Seurantaryhmä saa nyt tekstin nähtäväkseen

---

### 3. Seurantaryhmän palaute

**Käyttäjä:** Vaihda → Seurantaryhmä A

- Arviointi-sivu: näkee julkaistut tekstit
- Klikkaa Filippiläiskirje → avautuu lukusivulle
- Klikkaa jaetta → sivupaneeli aukeaa → kirjoita kommentti
- Kommentti näkyy marginaalikuplana editorin reunassa

**Käyttäjä:** Vaihda takaisin → Kimmo Leino

- Sivupaneelissa näkyy seurantaryhmän kommentti
- Tekstiryhmä voi merkitä kommentin käsitellyksi (✓)

---

### 4. Lähetys hallitukselle

**Käyttäjä:** Kimmo Leino

- Avaa Ehdota-sivu
- Valitse jakeet joissa on muutoksia (checkboxit, diff näkyvissä)
- Kirjoita perustelut ("Jakeen 1 sanamuotoa selvennetty...")
- Valitse hallituksen äänestäjät
- Lähetä → tila muuttuu: Lähetetty hallitukselle
- Ehdotus ilmestyy hallituksen Ratifiointi-sivulle

---

### 5. Hallituksen käsittely

**Käyttäjä:** Vaihda → Arto Liukko (hallitus)

**a) Ehdotuksen tarkastelu**
- Ratifiointi-sivu: ehdotus näkyy "Käsittelyssä"-osiossa
- Klikkaa → avautuu tarkastelusivu
- Näe: perustelut, diff pohjaversioon, muuttuneet jakeet korostettuna

**b) Kommentointi**
- Valitse tekstiä dokumentista → kommenttipopup ilmestyy
- Kirjoita kommentti → näkyy marginaalissa ja sivupaneelissa

**c) Äänestäminen (neuvoa-antava)**
- Kannanotot-osiossa (dokumentin alla): klikkaa Hyväksy/Hylkää
- Ääni tallentuu lokiin — ei ratkaise ehdotusta

**d) Äänestäjien hallinta**
- Lisää tai poista hallituksen jäseniä äänestäjälistasta (+/- ikonit)

**Käyttäjä:** Vaihda → Kimmo Leino (hallitus-roolissa)

**e) Päätöksen tekeminen**
- Yläosassa "Hallituksen päätös" -osio
- Vaihtoehto 1: "Vahvista käännös" → käännös hyväksytty, tila muuttuu
- Vaihtoehto 2: "Palauta käännettäväksi" → kirjoita perustelu → teksti palautuu tekstiryhmälle

---

### 6. Hyväksynnän jälkeen

**Käyttäjä:** Kimmo Leino

- Ratifiointi-sivu: ehdotus siirtynyt "Ratkaistut"-osioon
- Tarkastelusivu: vihreä banneri "Hallitus on vahvistanut käännöksen"
- Edistyminen-sivu: edistymispalkki päivittynyt
- Versiohistoria: "Hyväksytty" näkyy vihreänä välietappina aikajanalla

---

### 7. Hylkäyksen jälkeen (vaihtoehtoinen polku)

- Tarkastelusivu: punainen banneri "Hallitus on palauttanut käännettäväksi" + perustelu
- Tekstiryhmä voi palauttaa tekstin luonnokseksi ja jatkaa muokkausta
- Uusi ehdotus voidaan lähettää hallitukselle

---

## Demon valmistelu

Ennen esitystä:
1. Avaa käyttäjävalinta → "Tyhjennä data" → "Lataa esimerkkidata"
2. Aloita Kimmo Leinona (tekstiryhmä + hallitus, näkee kaikki näkymät)
3. Demo-data: Fil. tilassa "Lähetetty hallitukselle", yksi avoin ehdotus, Arto äänestänyt puolesta

Jos haluat näyttää koko polun alusta:
1. Tyhjennä data → lataa esimerkkidata
2. Tila on silloin "Luonnos" → voit käydä koko prosessin läpi
