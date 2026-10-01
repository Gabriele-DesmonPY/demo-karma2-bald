import { MotionConfig } from "framer-motion";
import Reveal from "../components/Reveal";
import LineReveal from "../components/LineReveal";
import "./S1Hero.css";

/* ═══════════════════════════════════════════════════════════════
   SEZIONE 01 — HERO · SPLIT SCREEN SULLA TRAMA D'ORO
   - Sfondo a tutto schermo: fili d'oro intrecciati su tessuto scuro.
   - Sinistra: fascia overlay (velo navy + vetro smerigliato) con la card
     dei contenuti: H1, payoff e i pulsanti d'azione.
   - Destra: la texture pulita, senza ostacoli.
   Niente più spirale, canvas o 3D.

   Performance: il "vetro" della fascia NON è un backdrop-filter (che il
   browser ricalcolerebbe a ogni frame di scroll e di cambio slide): è la
   stessa immagine già sfocata nel file, ritagliata sulla metà sinistra con
   un clip-path statico. Stesso effetto, costo zero.
   ═══════════════════════════════════════════════════════════════ */

const goTo = (index) => window.dispatchEvent(new CustomEvent("deck:goto", { detail: { index } }));

function HeroInner() {
  // "Inizia ora" → contatti (il deck porta all'ultima slide, dal fondo)
  const toContacts = (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("deck:goto", { detail: { index: 3, fromBelow: true } }));
  };
  const toPath = (e) => {
    e.preventDefault();
    goTo(1);
  };

  return (
    <div className="s1-wrap">
      <section className="hsx" id="home" data-n="1" aria-labelledby="hsx-title">
        {/* Sfondo a tutto schermo: la trama d'oro */}
        <div className="hsx__bg" aria-hidden="true" />
        {/* Vetro smerigliato della fascia: la stessa foto, già sfocata */}
        <div className="hsx__frost" aria-hidden="true" />

        <div className="hsx__grid">
          {/* ── Sinistra: fascia overlay con la card ── */}
          <div className="hsx__band">
            <div className="hsx__card">
              <Reveal as="p" className="hsx__eyebrow">
                Karma · Ecologia della decisione
              </Reveal>
              <LineReveal as="h1" className="hsx__title" delay={120}>
                Evolviamo verso ciò che scegliamo di essere.
              </LineReveal>
              <Reveal as="p" className="hsx__lede" delay={80}>
                Dal filo alla trama, accompagniamo la tua impresa nella sua evoluzione: incontrare
                ciò che cambia, riconoscere ciò che conta, scegliere ciò che vuole diventare
                continuando a riconoscersi.
              </Reveal>
              <Reveal as="div" className="hsx__actions" delay={160}>
                <a href="#contatti" className="hsx__btn hsx__btn--primary" onClick={toContacts}>
                  Inizia ora
                </a>
                <a href="#karmaround" className="hsx__btn hsx__btn--ghost" onClick={toPath}>
                  Scopri il percorso
                  <span aria-hidden="true">→</span>
                </a>
              </Reveal>
            </div>
          </div>

          {/* ── Destra: la texture, pulita ── */}
          <div className="hsx__view" aria-hidden="true" />
        </div>
      </section>

      {/* ── Micro-sezione citazione: pausa e respiro ── */}
      <section className="citazione-section s1q" aria-label="Citazione">
        <div className="s1q__inner">
          <Reveal as="div" className="s1q__mark">
            <span aria-hidden="true">“</span>
          </Reveal>
          <Reveal as="blockquote" className="s1q__text" delay={120}>
            Il tempo è un’emozione ed è una grandezza bidimensionale, nel senso che lo puoi vivere
            in due direzioni diverse, in lunghezza e in larghezza. Il guaio è che gli uomini
            studiano come allungare la vita, quando invece dovrebbero studiare come allargarla.
          </Reveal>
          <Reveal as="p" className="s1q__author" delay={260}>
            — Luciano De Crescenzo
          </Reveal>
        </div>
      </section>
    </div>
  );
}

// MotionConfig reducedMotion="user": con "riduci animazioni" attivo,
// Framer Motion salta le animazioni e mostra tutto a riposo.
export default function S1Hero() {
  return (
    <MotionConfig reducedMotion="user">
      <HeroInner />
    </MotionConfig>
  );
}
