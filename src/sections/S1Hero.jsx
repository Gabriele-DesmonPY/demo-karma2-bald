import { MotionConfig } from "framer-motion";
import Reveal from "../components/Reveal";
import "./S1Hero.css";

/* ═══════════════════════════════════════════════════════════════
   SEZIONE 01 — HERO · TRAMA D'ORO A TUTTO SCHERMO
   Immagine unica + sfumatura da sinistra + testi. Titolo in Bauhaus 93
   (file in /public/fonts/bauhaus93.woff2|.ttf, o font installato).
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
        {/* Immagine Unica & Sfumatura Fluida */}
        <div className="hsx__bg" aria-hidden="true" />
        <div className="hsx__shade" aria-hidden="true" />

        {/* Contenuto della Hero */}
        <div className="hsx__content">
          <p className="hsx__eyebrow">KARMA · LET’S WORK TOGETHER</p>

          <h1 className="hsx__title" id="hsx-title">
            EVOLVIAMO VERSO CIÒ CHE SCEGLIAMO DI ESSERE.
          </h1>

          <p className="hsx__lede">
            Dal filo alla trama, accompagniamo la tua impresa nella sua evoluzione: incontrare ciò
            che cambia, riconoscere ciò che conta, scegliere ciò che vuole diventare continuando a
            riconoscersi.
          </p>

          <div className="hsx__actions">
            <a href="#contatti" className="hsx__btn hsx__btn--primary" onClick={toContacts}>
              INIZIA ORA
            </a>
            <a href="#karmaround" className="hsx__btn hsx__btn--ghost" onClick={toPath}>
              SCOPRI IL PERCORSO <span aria-hidden="true">→</span>
            </a>
          </div>
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
