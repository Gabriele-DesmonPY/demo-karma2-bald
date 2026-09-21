# Karma — Architettura delle sezioni della Home
**Documento di lavoro — non è ancora codice.**
**Data:** 16 settembre 2026 · **Base:** feedback della call del 16/09 + struttura attuale di `Home.jsx` + proposta del 9/09
**Principio guida:** **il sito deve essere ordinato ma disordinato.** Ordine nell'architettura e nel ritmo (chiare le tappe, dove si va), disordine nella materia visiva (parole sparse, spirale, filo — mai geometria pulita). È esattamente il feedback del 16/09: la versione sviluppata era criticata perché "troppo ordinata, lineare"; il concept deve restare "spettinato".

---

## 1. La storia che la Home racconta (dall'esterno verso il centro)

```
CAOS / PAROLE SPARSE ──► IL FILO ──► LA TRAMA ──► IL SÉME ──► IL TESSUTO (Bisso) ──► LA MAPPA
   (le voci, isolate)      (decidere è      (le connessioni    (il centro della      (la coerenza
                            tenere insieme)   in relazione)       spirale)               restituita)
```

Ogni sezione della Home è una tappa di questo percorso: si entra **dall'esterno della spirale** (frammentazione, voci isolate) e si arriva **al centro** (il seme), dove il filo, abitato dalle parole e dall'analisi, assume coerenza e dà vita alla trama (il bisso). La chiusura è la **Mappa Karma** restituita al cliente.

**Regola dalla call:** la spirale governa *tutta* la home e tutte le animazioni — non è una decorazione, è la struttura narrativa. Le parole non sono gerarchizzate: **"scegliere" non è più importante delle altre, si trova solo in un punto diverso della spirale.**

---

## 2. Mappa delle sezioni (10 sezioni + fasce)

L'alternanza alta/bassa intensità (mai due "wow" di fila, tranne il crescendo finale) resta la già validata. Qui sotto: per ogni sezione — funzione narrativa, cosa c'è oggi, cosa deve accadere.

### ⚫ Sezione 1 — Hero / Apertura  *(intensità: alta)*
- **Funzione:** entrare nella spirale dall'esterno. La spirale grande e lenta entra da fuori schermo: **il filo inizia qui**.
- **Oggi:** spirale che ruota + titolo "Ogni decisione educa il futuro della tua impresa."
- **Da integrare (call):** la spirale deve essere percepita come l'elemento che *governa* la home, non come sfondo. Animazioni di gioco con le parole attorno/vicino alla spirale: le parole compaiono sparse, non allineate.
- **Animazione possibile:** fascio di luce rotante (elemento già apprezzato dal cliente nella call: "questo fascio che gira mi piace tantissimo") + filo laterale che scende.

### ⚫ Fascia 1 — AbstractBand "ogni scelta lascia una luce"  *(respiro, bassa)*
- Transizione parallax. Da mantenere come pausa tra hero e prima sezione.

### ⚪ Sezione 2 — La complessità della scelta  *(media: è già il "disordine" dichiarato)*
- **Funzione:** il caos messo in scena. "Tutto può avere senso. Preso separatamente." + le sei voci appese al filo (mercato, numeri, compliance, team, tecnologia, cliente).
- **Da integrare (call):** qui va **preservato e rafforzato il disordine**. Le parole sparse sono volute: è l'effetto che il cliente chiede. Eventualmente portare questa sezione più vicina al linguaggio "parole sparse nella spirale" della proposta originale (le parole isolate che emergono mentre si scorre e fanno parte della spirale).
- **Nota call:** manca ancora una grafica che *unisce* le tre frasi/voci — il cliente lo ha segnalato anche per la sua proposta: serve un elemento (il filo appunto) che le attraversa visivamente.

### ⚪ Sezione 3 — Decidere è tenere insieme  *(media)*
- **Funzione:** dal caos al filo. Le decisioni entrano nella stessa trama.
- Questa è la prima tappa del tema **filo → trama**: il filo che inizia a legare.

### ⚪ Sezione 4 — La domanda  *(bassa, pulita)*
- **Funzione:** pausa riflessiva. "Che cosa ha senso per noi, qui, adesso?"
- Momento quasi statico: funziona da silenzio prima dell'ingresso nella spirale.

### 🔥 Sezione 5 — Entrare nella spirale (ScrollFloat)  *(alta, esperienza)*
- **Funzione:** le nove tappe del discernimento emergono lettera per lettera mentre si scorre: ascoltare → osservare → … → scegliere.
- **⚠️ Correzione dalla call:** oggi "scegliere" è evidenziata in oro e chiusura della lista → comunica una gerarchia che il cliente ha chiamato "errore di principio". Le parole devono restare **tutte sullo stesso piano, disposte lungo la spirale**: ognuna in un punto diverso, nessuna "più importante". La differenza è di *posizione*, non di valore.
- **Idea animazione:** le parole non in colonna verticale ma sparse lungo il percorso della spirale, che emergono e si ricompongono man mano che si scende verso il centro.

### ⚪ Sezione 6 — Ecologia della decisione  *(bassa, tipografica)*
- **Funzione:** l'approccio in parole. Navy pieno, testo puro.

### ⚫ Sezione 7 — Il centro / Il seme (SpiralStage pinnato)  *(alta, momento forte)*
- **Funzione:** il cuore. Sezione pinnata: la spirale si chiude verso il centro e emerge **SÉ/ME** — il seme — con le chiavi (Visione, Identità, Storia, Valori, Direzione, Momento) e la chiusura "La scelta prende forma da qui."
- **Da integrare (call):** qui il filo "arriva al seme e crea il tessuto": **questa è la storia**. Il passaggio filo → seme → trama va reso visibile.
- **💡 Idea animazione (da Gabry, ispirazione healthybusylife.com per lo stile scroll-driven):**
  > **un dito che fa scorrere la gocciolina** — mentre l'utente scorre, un dito trascina una gocciolina lungo il filo/l'asta; la gocciolina scivola fino al centro della spirale e **da lì nasce il seme**. Interazione legata allo scroll (drag/progress), un solo momento forte, fatto bene — coerente con la regola "pochi effetti, tutti significativi".
- **Nota call:** il centro è "fondamentale nel messaggio": le parole sparse devono trovare qui il punto di contatto. Questa sezione è il payoff della sezione 2.

### ⚫ Sezione 8 — Il filo / Il bisso  *(alta, emotiva)*
- **Funzione:** il cuore emotivo. Oggi: foto del bisso tenuto in mano + "La coerenza è un filo vivo."
- **Da integrare (call):**
  - La foto del bisso come **immagine pura non si capisce**: va **ricreata con l'AI** un'immagine ad hoc che mostri *solo il tessuto*.
  - Il tessuto (bisso) deve diventare **sfondo di una parte della home** — qui: quando si arriva al filo, lo sfondo *si apre* al bisso (non più navy/blu, ma una parte creata dalla trama).
  - "La coerenza è un filo vivo" è già nel punto giusto: **non spostarla**. Significa: la coerenza è ciò che ha determinato la trama — il filo abitato dalle parole e dall'analisi dello scenario, che poi assume coerenza e dà vita alla trama.
- **Animazione perfetta (detta dal cliente, parola per parola):** **"dal filo alla trama"** — il filo che si unisce ad altri fili e crea la meraviglia del tessuto. Un filo arriva, si intreccia, lo sfondo diventa tessuto.

### ⚪ Sezione 9 — Crescere insieme (4 blocchi interni)  *(media, più discorsiva)*
- **9A Capacità decisionale** — le decisioni di oggi educano quelle di domani (spirale lenta sullo sfondo).
- **9B Accompagnamento** — decidere è un atto che si attraversa insieme.
- **9C Competenze** — CompetenceMap a rete: "LA DECISIONE" al centro, 11 sguardi collegati. *È già la logica "rete, non checklist" → coerente con la call: nodi su una spirale/mappa, non card isolate.*
- **9D Poi la scelta vive + Ciò che resta** — la decisione evolve, "decidere educa a decidere", il valore resta nell'impresa.

### ⚫ Sezione 10 — Conosciamoci / Mappa Karma + CTA  *(alta, crescendo)*
- **Funzione:** la **Mappa Karma** ("mappa di karma" nella call): la spirale identitaria e decisionale con **i nodi problematici** su cui lavorare, e al centro il seme. Poi CTA "Prenota il primo incontro".
- **Da integrare (call):** la map è **l'obiettivo finale della consulenza**: costruita sulla spirale, con i punti colti come problematici. Questa sezione è dove la spirale si chiude: dal centro (seme) si torna fuori schermo — la spirale della CTA gira lentissima (già presente, `kh-spin 300s`).

---

## 3. Regole di ritmo e di "disordine controllato"

1. **Ordine nell'architettura, disordine nella materia.** La sequenza delle tappe è chiara e sempre leggibile; dentro ogni sezione le parole possono essere sparse, irregolari, asimmetriche. Mai griglie geometriche perfette.
2. **La spirale è la spina dorsale.** Ogni animazione deve poter essere ricondotta alla spirale (entrare dall'esterno, convergere al centro, o ruotare lentissimamente). Zero effetti che non raccontano la spirale.
3. **Un solo momento interattivo forte per sezione.** (Fascio di luce in hero, parole sparse in 2, ScrollFloat in 5, gocciolina→seme in 7, filo→trama/bisso in 8.) Il resto resta tipografico e pulito — come già validato nei round di rifinitura.
4. **Il disordine è intenzionale, mai casuale.** Le parole sparse sono "sparse di proposito": il messaggio è che hanno senso prese separatamente e il problema è metterle insieme. La grafica deve sempre mostrare *il punto di contatto* (il centro, il filo, la trama).
5. **Copy ancora in lavorazione.** Il cliente ha detto che i copy non sono definitivi: le frasi vanno trattate come direzione di senso, non come testo finale. Eccezione stabile: **"La coerenza è un filo vivo"** (posizione già validata).

---

## 4. Checklist feedback call 16/09 → dove atterra

| # | Feedback del cliente | Sezione |
|---|---|---|
| 1 | La spirale deve governare tutta la home e le animazioni | 1, 5, 7, 10 (e filo conduttore globale) |
| 2 | Versione sviluppata troppo ordinata/lineare → serve "spettinato" | 2 (e in generale l'estetica) |
| 3 | Le parole sparse devono restare disordinate — effetto voluto | 2 |
| 4 | Manca una grafica che unisce le frasi isolate | 2 |
| 5 | Niente gerarchia tra le parole ("scegliere" non è più importante) | 5 |
| 6 | Il centro è fondamentale: le parole trovano il punto di contatto | 7 |
| 7 | Il seme nasce dalla spirale (possibile animazione gocciolina→seme) | 7 |
| 8 | L'animazione perfetta è "dal filo alla trama" | 8 |
| 9 | Bisso: ricreare con AI (solo tessuto visibile), come sfondo di una parte della home | 8 |
| 10 | "La coerenza è un filo vivo" è già nel punto perfetto | 8 |
| 11 | Fascio di luce rotante e filo laterale che scende: tenere, sono apprezzati | 1 |
| 12 | Obiettivo finale: la Mappa Karma costruita sulla spirale (nodi problematici) | 10 |

---

## 5. Punti aperti da validare prima di toccare il codice

1. **Conflitto col brief del 9/09:** la proposta precedente vietava le metafore tessili letterali ("ago, filo, telaio", niente foto di tessuti). La call del 16/09 — più recente e diretta dal cliente — **chiede esplicitamente** il bisso come tessuto/immagine di sfondo e l'animazione filo→trama. La call vince: il vincolo del 9/09 va considerato superato.
2. **Immagini AI:** generare l'immagine del tessuto-bisso (solo trama visibile, coerente con navy/oro del brand). Da approvare con il cliente prima dell'integrazione.
3. **Copy di hero e sezioni 2/5:** da confermare col cliente (ha anticipato che i copy sono ancora in corso).
4. **ScrollFloat sezione 5:** ripensare la disposizione "in colonna" verso una disposizione lungo la spirale, senza gerarchie visive tra le parole.
5. **Animazione gocciolina→seme (sezione 7):** da prototipare a parte prima di integrarla nella sezione pinnata — capire se vive dentro `SpiralStage` come fase aggiuntiva del progresso scroll.

## 6. Prossimo passo

Nessuna modifica al codice ora. Questo documento serve da mappa condivisa: validare l'architettura e le animazioni proposte, poi si implementa sezione per sezione partendo da quelle con feedback esplicito della call (8 → 5 → 2 → 7).