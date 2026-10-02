import { MotionConfig } from "framer-motion";
import Reveal from "../components/Reveal";
import LineReveal from "../components/LineReveal";
import "./S1Hero.css";

/* ═══════════════════════════════════════════════════════════════
   SEZIONE 01 — HERO · TRAMA D'ORO A TUTTO SCHERMO
   - La foto dei fili d'oro copre tutto lo schermo (100vw × 100vh).
   - Sopra, un overlay blu trasparente (#101a2d: 0.85 a sinistra → 0.4 a
     destra) tiene leggibile il testo senza nessun blocco pieno.
   - Titolo in Bauhaus 93 (se installato sul dispositivo; altrimenti
     Baumans, la sua controparte libera di ispirazione Bauhaus).
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
        {/* Sfumatura graduale da sinistra: protegge il testo, nessun box */}
        <div className="hsx__shade" aria-hidden="true" />

        {/* Contenuti: blocco fluido a sinistra */}
        <div className="hsx__content">
          <Reveal as="p" className="hsx__eyebrow">
            Karma · Let’s work together
          </Reveal>
          <LineReveal as="h1" className="hsx__title" delay={120}>
            <>
              Evolviamo verso ciò che <em>scegliamo di essere.</em>
            </>
          </LineReveal>
          <Reveal as="p" className="hsx__lede" delay={80}>
            Ci sono diversi modi di essere al servizio delle imprese.{" "}
            <span className="hsx__lede-key">
              Noi abbiamo scelto di <strong>essere cura</strong>.
            </span>
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
