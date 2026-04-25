# Raamatun käännöstyökalu — demo

Interaktiivinen demo raamatunkäännöksen arviointityökalusta. Kaikki data on paikallista (localStorage), ei taustapalvelinta.

## Käyttö paikallisesti

```bash
npm install
npm run dev
```

Avaa http://localhost:3000

## Docker

```bash
docker build -t raamattu-kaannostyo .
docker run -p 3000:3000 raamattu-kaannostyo
```

## Demo-ominaisuudet

- **Luku-näkymä**: 1. Tessalonikalaiskirje luku 2, jakeet 1–20
- **Ehdotukset**: Käännösehdotusten luonti, kommentointi ja käsittely
- **Seurantaryhmän arviointi**: Ehdotusten arviointi ja palaute
- **Hallituksen ratifiointi**: Lopullinen hyväksyntä
- **Edistyminen**: Käännöstyön kokonaistilanne

Persona-vaihtaja oikeassa yläkulmassa vaihtaa roolia (kääntäjä, seurantaryhmä, hallitus). "Aloita alusta" palauttaa demon alkutilaan.
