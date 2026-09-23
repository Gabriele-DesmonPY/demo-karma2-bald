import { useState } from "react";
import { motion, MotionConfig, AnimatePresence } from "framer-motion";
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
// - sfondo di trama del bisso (navy + filamenti dorati), sfocato e
//   a bassa opacità: sta sotto al fascio di luce e sotto alla spirale
//   vettoriale → profondità e materia senza rubare contrasto ai testi
// - fascio di luce rotante ("questo fascio che gira mi piace tantissimo")
// - filo laterale che scende (il filo inizia qui, in verticale)
// - parole comparse sparse attorno alla spirale, non allineate
// - layout a 2 colonne: copy a sinistra (~60%), citazione De Crescenzo
//   a destra (~35%), leggermente sfalsata; sotto 1024px la citazione
//   scende sotto il testo principale
// - niente CTA: l'hero è apertura, non invito (il bottone "Swipe
//   Sezione 02 ↓" resta fisso in App.jsx)

// ── Varianti Framer Motion ──
// Entrata morbida e differita: il contenitore distribuisce lo stagger,
// ogni blocco entra con fade + leggero risalire + defocus.
const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.28, delayChildren: 0.35 },
  },
};

// La citazione arriva da destra, con più ritardo: chiude la scena.
const fadeFromRight = {
  hidden: { opacity: 0, x: 34, filter: "blur(6px)" },
  show: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 1.5, ease: [0.16, 1, 0.3, 1] },
  },
};

// ── Sfondo trama: zoom-out liscio all'ingresso, poi deriva lenta ──
// Parte scalata (ken-burns inverso) e si assesta su una scala che
// nasconde i bordi del blur; il loop infinito è quasi impercettibile.
const tramaEnter = {
  hidden: { opacity: 0, scale: 1.32 },
  show: {
    opacity: 1,
    scale: 1.14,
    transition: { duration: 3.4, ease: [0.16, 1, 0.3, 1] },
  },
};

const tramaDrift = {
  show: {
    scale: [1.14, 1.19, 1.14],
    x: ["0%", "-1.6%", "0%"],
    y: ["0%", "1.2%", "0%"],
    transition: {
      duration: 46,
      repeat: Infinity,
      ease: "easeInOut",
      delay: 3.4,
    },
  },
};

// Le parole sparse: ogni span ha le sue coordinate CSS (--wx/--wy).
// Framer Motion gestisce solo l'entrata (fade + defocus scalato);
// la deriva infinita resta al CSS interno (.sb-hero__drift), così
// le due animazioni non si contendono lo stesso transform.
const wordVariants = {
  hidden: { opacity: 0, scale: 0.92, filter: "blur(5px)" },
  show: (i) => ({
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 1.9 + i * 0.45 },
  }),
};

const WORDS = [
  { t: "senso", x: "50%", y: "9%", d: "0.9s", f: "11s" },
  { t: "contesto", x: "83%", y: "18%", d: "1.6s", f: "13s" },
  { t: "equilibrio", x: "64%", y: "40%", d: "2.2s", f: "10s" },
  // tempo e coerenza vivono fuori dall'area della citazione (x 73–95%,
  // y 48–90%): la prima sale sopra la card, la seconda scende a sinistra
  { t: "tempo", x: "89%", y: "37%", d: "1.2s", f: "12s" },
  { t: "sé", x: "58%", y: "66%", d: "2.8s", f: "14s" },
  { t: "coerenza", x: "53%", y: "87%", d: "3.1s", f: "11s" },
];

function HeroInner() {
  // Su mobile (<640px) la citazione ripiega in un accordion: chiusa
  // all'ingresso, si apre solo su richiesta per non sovraccaricare la
  // viewport. Da tablet in su il toggle non esiste (CSS) e la card è
  // sempre visibile → si parte aperti.
  const [quoteOpen, setQuoteOpen] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches
  );

  return (
    <>
      <RibbonField className="kh-backdrop" flatBase intensity={0.9} />

      <section className="kh-hero sb-hero" id="hero" data-n="1">
        {/* ── Sfondo: trama del bisso (navy + filamenti dorati) ──
            Primo strato della sezione: sta sotto al fascio di luce e
            sotto alla spirale vettoriale. Blur medio + opacità bassa +
            velo navy: dà materia e profondità senza competere coi testi. */}
        <motion.div className="sb-hero__trama" aria-hidden="true" variants={tramaEnter} initial="hidden" animate="show">
          <motion.img
            src="/trama-bisso.jpg"
            alt=""
            className="sb-hero__trama-img"
            variants={tramaDrift}
            animate="show"
          />
          {/* Velo navy per riportare il contrasto dove serve */}
          <div className="sb-hero__trama-veil" />
        </motion.div>

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
          {WORDS.map((w, i) => (
            <motion.span
              key={w.t}
              className="sb-hero__word"
              style={{ "--wx": w.x, "--wy": w.y }}
              custom={i}
              variants={wordVariants}
            >
              {/* Lo span interno porta la deriva CSS: transform separato */}
              <span className="sb-hero__drift" style={{ "--wd": w.d, "--wf": w.f }}>
                {w.t}
              </span>
            </motion.span>
          ))}
        </div>

        {/* ── Il filo laterale che scende: la prima apparizione del filo ── */}
        <div className="sb-hero__thread" aria-hidden="true">
          <span className="sb-hero__thread-pulse" />
        </div>

        {/* ── Layout a 2 colonne: copy (60%) + citazione (35%) ── */}
        <motion.div
          className="sb-hero__grid"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {/* Colonna di sinistra — il copy principale */}
          <div className="kh-hero__copy sb-hero__copy">
            <Reveal as="div" className="kh-eyebrow kh-hero__eyebrow">
              Karma · Ecologia della decisione
            </Reveal>
            <LineReveal as="h1" className="kh-hero__title" delay={120}>
              Evolviamo verso ciò che scegliamo di essere.
            </LineReveal>
            <Reveal as="p" className="kh-lede" delay={80}>
              Dal filo alla trama, accompagniamo la tua impresa nella sua evoluzione: incontrare
              ciò che cambia, riconoscere ciò che conta, scegliere ciò che vuole diventare
              continuando a riconoscersi.
            </Reveal>
            <Reveal as="p" className="kh-body kh-body--onnavy" delay={140} style={{ maxWidth: "52ch" }}>
              L’identità è il filo che attraversa il cambiamento e ci permette di abitare la
              complessità senza perdere la profondità di ciò che siamo.
            </Reveal>
          </div>

          {/* Colonna di destra — la citazione, leggermente sfalsata in alto.
              Su mobile il blocco ripiega: il toggle apre/chiude la card. */}
          <div className="sb-hero__quote-zone">
            <button
              type="button"
              className="sb-hero__quote-toggle"
              aria-expanded={quoteOpen}
              onClick={() => setQuoteOpen((v) => !v)}
            >
              ❝ La citazione <span aria-hidden="true">{quoteOpen ? "↑" : "↓"}</span>
            </button>
            <AnimatePresence>
              {quoteOpen && (
                <motion.aside
                  className="sb-hero__quote sb-hero__quote--open"
                  variants={fadeFromRight}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, y: 18, transition: { duration: 0.4 } }}
                  aria-label="Citazione"
                >
                <span className="sb-hero__quote-mark" aria-hidden="true">
                  “
                </span>
                <blockquote className="sb-hero__quote-text">
                  Il tempo è un’emozione ed è una grandezza bidimensionale, nel senso che lo puoi
                  vivere in due direzioni diverse, in lunghezza e in larghezza.
                  <br />
                  Il guaio è che gli uomini studiano come allungare la vita, quando invece
                  dovrebbero studiare come allargarla.
                </blockquote>
                <footer className="sb-hero__quote-author">
                  — Tratto da: <strong>32 Dicembre (1988)</strong>, Luciano De Crescenzo
                </footer>
              </motion.aside>
            )}
          </AnimatePresence>
          </div>
        </motion.div>
      </section>
    </>
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