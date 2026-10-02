import { MotionConfig } from "framer-motion";
import Reveal from "../components/Reveal";
import LineReveal from "../components/LineReveal";
import "./S1Hero.css";

/* ═══════════════════════════════════════════════════════════════
   SEZIONE 01 — HERO · TRAMA D'ORO A TUTTO SCHERMO
   - La foto dei fili d'oro copre tutto lo schermo (100vw × 100vh).
   - Sopra, un alone radiale scuro al centro tiene leggibile il testo.
   - Un solo H1 su due righe sfalsate (Bauhaus maiuscolo + Cormorant
     corsivo oro con "ESSERE CURA") e un solo bottone.
   - Titolo in Bauhaus 93 (se installato sul dispositivo; altrimenti
     Baumans, la sua controparte libera di ispirazione Bauhaus).
   ═══════════════════════════════════════════════════════════════ */

const goTo = (index) => window.dispatchEvent(new CustomEvent("deck:goto", { detail: { index } }));

function HeroInner() {
  const toPath = (e) => {
    e.preventDefault();
    goTo(1);
  };

  return (
    <div className="s1-wrap">
      <section className="hsx" id="home" data-n="1" aria-labelledby="hsx-title">
        {/* Sfondo a tutto schermo: la trama d'oro */}
        <picture className="hsx__media" aria-hidden="true">
          <source srcSet="/hero-trama-oro.webp" type="image/webp" />
          <img
            className="hsx__img"
            src="/hero-trama-oro.jpg"
            alt=""
            width="1024"
            height="1024"
            decoding="async"
            fetchPriority="high"
            draggable="false"
          />
        </picture>
        {/* Alone radiale scuro al centro: protegge il testo, nessun box */}
        <div className="hsx__shade" aria-hidden="true" />

        {/* Contenuti centrati: un solo titolo, un solo bottone */}
        <div className="hsx__content">
          <Reveal as="p" className="hsx__eyebrow">
            Karma · Let’s work together
          </Reveal>
          <LineReveal as="h1" id="hsx-title" className="hsx__title" delay={120}>
            <>
              <span className="hsx__title-a">
                Ci sono diversi modi di essere al servizio delle imprese.
              </span>
              <span className="hsx__title-b">
                <em>Noi abbiamo scelto</em>{" "}
                <span className="hsx__nowrap">
                  <em>di</em> <strong>essere cura.</strong>
                </span>
              </span>
            </>
          </LineReveal>
          <Reveal as="div" className="hsx__actions" delay={200}>
            <a href="#karmaround" className="hsx__btn hsx__btn--ghost" onClick={toPath}>
              Scopri il percorso
              <span aria-hidden="true">→</span>
            </a>
          </Reveal>
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
