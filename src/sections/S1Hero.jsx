import Spiral from "../components/Spiral";
import RibbonField from "../components/RibbonField";
import Reveal from "../components/Reveal";
import LineReveal from "../components/LineReveal";
import "./S1Hero.css";

// ═══ SEZIONE 1 — HERO / APERTURA ═══
// Funzione (schema del 16/09): entrare nella spirale dall'esterno.
// La spirale grande e lenta governa la home: il filo inizia qui.
//
// Richieste call integrate:
// - fascio di luce rotante ("questo fascio che gira mi piace tantissimo")
// - filo laterale che scende (il filo inizia qui, in verticale)
// - parole comparse sparse attorno alla spirale, non allineate
// - niente CTA: l'hero è apertura, non invito
export default function S1Hero() {
  return (
    <>
      <RibbonField className="kh-backdrop" flatBase intensity={0.9} />

      <section className="kh-hero sb-hero" id="hero" data-n="1">
        {/* ── Fascio di luce rotante — da un punto, ruota piano ── */}
        <div className="sb-hero__beam" aria-hidden="true" />

        {/* ── La spirale: il filo inizia qui ── */}
        <div className="kh-hero__spiral">
          <div className="kh-hero__spiral-spin">
            <Spiral armsCount={3} goldOpacity={0.75} thinOpacity={0.14} />
          </div>
        </div>

        {/* ── Parole sparse di proposito: compaiono attorno alla spirale,
            ognuna nel suo punto, nessuna allineata. ── */}
        {/* Zona libera dal blocco di testo (che occupa x 0–44%, y 12–80%):
            le parole vivono tutte fuori da quell'area, lungo gli anelli
            della spirale che attraversano la metà destra dello schermo. */}
        <div className="sb-hero__words" aria-hidden="true">
          <span style={{ "--wx": "50%", "--wy": "9%", "--wd": "0.9s", "--wf": "11s" }}>senso</span>
          <span style={{ "--wx": "83%", "--wy": "18%", "--wd": "1.6s", "--wf": "13s" }}>contesto</span>
          <span style={{ "--wx": "64%", "--wy": "40%", "--wd": "2.2s", "--wf": "10s" }}>equilibrio</span>
          <span style={{ "--wx": "91%", "--wy": "54%", "--wd": "1.2s", "--wf": "12s" }}>tempo</span>
          <span style={{ "--wx": "58%", "--wy": "66%", "--wd": "2.8s", "--wf": "14s" }}>sé</span>
          <span style={{ "--wx": "78%", "--wy": "84%", "--wd": "3.1s", "--wf": "11s" }}>coerenza</span>
        </div>

        {/* ── Il filo laterale che scende: la prima apparizione del filo ── */}
        <div className="sb-hero__thread" aria-hidden="true">
          <span className="sb-hero__thread-pulse" />
        </div>

        <div className="kh-hero__copy">
          <Reveal as="div" className="kh-eyebrow kh-hero__eyebrow">
            Karma · Ecologia della decisione
          </Reveal>
          <LineReveal as="h1" className="kh-hero__title" delay={120}>
            Evolviamo verso ciò che scegliamo di essere.
          </LineReveal>
          <Reveal as="p" className="kh-lede" delay={80}>
            Dal filo alla trama, accompagniamo la tua impresa nella sua evoluzione: incontrare ciò che
            cambia, riconoscere ciò che conta, scegliere ciò che vuole diventare continuando a
            riconoscersi.
          </Reveal>
          <Reveal as="p" className="kh-body kh-body--onnavy" delay={140} style={{ maxWidth: "52ch" }}>
            L’identità è il filo che attraversa il cambiamento e ci permette di abitare la complessità
            senza perdere la profondità di ciò che siamo.
          </Reveal>
        </div>
      </section>
    </>
  );
}