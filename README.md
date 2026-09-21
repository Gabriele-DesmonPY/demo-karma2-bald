# Karma 2 — Sandbox a sezioni

Ambiente di lavoro separato per costruire la nuova Home **una sezione alla volta**, a partire dallo schema validato e dalle idee del cliente (lezione del 16/09). Le sezioni validate si portano poi in `demo-karma-bold-main`.

- Schema: `SCHEMA-SEZIONI.md` (copia del doc di architettura del 16/09)
- Base tecnica: stesso setup del progetto vero (React 19 + Vite 8, design system `src/index.css`, componenti motion copiati)

## Avvio

```bash
export PATH="$HOME/.local/opt/node-v22.14.0-linux-x64/bin:$PATH"
npm run dev
```

(Il sistema ha solo Node 18, insufficiente per Vite 8.)

## Struttura

```
src/
  App.jsx            viewer: sezioni impilate + indice laterale 01-10
  sandbox.css        stili del viewer (non finiscono nel progetto)
  sections/          ← le sezioni vivono qui, una alla volta
    home.css         stili di base validati del progetto (kh-*)
    S1Hero.jsx/css   sezione corrente
  components/        Spiral, RibbonField, Reveal, LineReveal, ScrollFloat, TextReveal
```

## Stato sezioni (ordine di racconto 1→10)

| # | Sezione | Intensità | Stato |
|---|---------|-----------|-------|
| 1 | Hero / Apertura | alta | ✅ prima versione |
| 2 | La complessità della scelta | media | ⬜ |
| 3 | Decidere è tenere insieme | media | ⬜ |
| 4 | La domanda | bassa | ⬜ |
| 5 | Entrare nella spirale | alta | ⬜ |
| 6 | Ecologia della decisione | bassa | ⬜ |
| 7 | Il centro / Il seme | alta | ⬜ |
| 8 | Il filo / Il bisso | alta | ⬜ |
| 9 | Crescere insieme | media | ⬜ |
| 10 | Mappa Karma + CTA | alta | ⬜ |

## Regole dal 16/09 (ricapitolazione)

1. **Ordine nell'architettura, disordine nella materia** — tappe chiare, parole sparse di proposito.
2. **La spirale è la spina dorsale** — ogni animazione racconta la spirale; zero effetti fuori tema.
3. **Un solo momento interattivo forte per sezione** (fascio in hero, parole in 2, ScrollFloat in 5, gocciolina→seme in 7, filo→trama in 8).
4. **"La coerenza è un filo vivo"** non si sposta (posizione validata).
5. **Copy non definitivi** — direzione di senso, non testo finale.