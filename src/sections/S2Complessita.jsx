import { useEffect, useRef, useState } from "react";
import SilkWash from "../components/SilkWash";
import Reveal from "../components/Reveal";
import LineReveal from "../components/LineReveal";
import "./S2Complessita.css";

// ═══ SEZIONI 2 E 3 — ORIGINE E CONTESTO / LA REALTÀ NON È FRAMMENTATA ═══
// Due TAPPE separate, ognuna una slide del deck (stesso swipe cinematografico
// dell'hero): la navigazione avviene via rotella/touch/frecce, non con
// scroll interno continuo.
//
// Principi chiave:
// 1. "Ordinato nell'architettura, disordinato nella materia" — niente card, niente tabelle
// 2. Alto contrasto tipografico (#071526 navy inchiostro profondo, zero scritte sbiadite)
// 3. Filo dorato continuo vivo e vibrante che unisce le voci sparse
// 4. Animazione ordine come trama di connessioni organiche

// Osserva la sezione: accende --visible (disegno del filo, entrate) alla prima vista.
function useSectionInView(sectionRef) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [sectionRef]);

  return inView;
}

const VOICES = [
  {
    text: "“Il mercato si sta muovendo. Dobbiamo capire se seguirlo.”",
    vx: "6%",
    vy: "8%",
    vr: "-2.5deg",
    delay: "0.2s",
  },
  {
    text: "“I numeri dicono che questa strada potrebbe funzionare.”",
    vx: "56%",
    vy: "4%",
    vr: "2deg",
    delay: "0.45s",
  },
  {
    text: "“Dobbiamo essere compliant, ma senza bloccare tutto.”",
    vx: "16%",
    vy: "38%",
    vr: "3deg",
    delay: "0.7s",
  },
  {
    text: "“Il team non può assorbire un altro cambiamento così, dall’oggi al domani.”",
    vx: "59%",
    vy: "44%",
    vr: "-1.8deg",
    delay: "0.95s",
  },
  {
    text: "“Questa tecnologia potrebbe farci fare un salto.”",
    vx: "8%",
    vy: "70%",
    vr: "-3deg",
    delay: "1.2s",
  },
  {
    text: "“Il cliente ormai si aspetta qualcosa di diverso.”",
    vx: "54%",
    vy: "77%",
    vr: "2.4deg",
    delay: "1.45s",
  },
];

const ORDER_RELATIONS = [
  {
    concept: "Una tecnologia",
    connection: "incontra processi, persone, competenze e responsabilità.",
    shift: "0%",
  },
  {
    concept: "Una crescita",
    connection: "incontra la capacità dell’organizzazione di sostenerla.",
    shift: "8%",
  },
  {
    concept: "Una nuova regola",
    connection: "incontra comportamenti, strumenti e relazioni.",
    shift: "3%",
  },
  {
    concept: "Una riorganizzazione",
    connection: "incontra equilibri costruiti nel tempo.",
    shift: "10%",
  },
  {
    concept: "Una nuova opportunità",
    connection: "incontra priorità, risorse e visione.",
    shift: "5%",
  },
];

// I sei nodi-concetto della tappa 02: piccoli tag dorati appesi al
// filo, si illuminano uno dopo l'altro all'ingresso nella sezione.
const CONCEPT_NODES = [
  "Persone",
  "Processi",
  "Abitudini",
  "Relazioni",
  "Strumenti",
  "Responsabilità",
];

// ═══ TAPPA 02 — UNA SCELTA INCONTRA SEMPRE UNA STORIA ═══
// Slide isolata del deck, layout a 2 colonne:
// - sinistra: filo dorato ondulato + copy + i 6 nodi-concetto
// - destra: la scultura di bisso, che galleggia in parallasse
// In fondo, il filo curva verso il centro: prepara lo stacco verso la tappa 03.
export function S2Origine() {
  const sectionRef = useRef(null);
  const inView = useSectionInView(sectionRef);

  return (
    <section
      ref={sectionRef}
      className={`kh-sec s2-sec s2-sec--origine ${inView ? "s2-sec--visible" : ""}`}
      id="complessita"
      data-n="2"
    >
      {/* Sfondo SilkWash pastello e fili d'oro a opacità calibrata per massimo contrasto */}
      <SilkWash a={0} b={10} c={90} d={100} />

      <div className="kh-col s2-container">
        <div className="s2-origin">
          {/* ── Colonna di sinistra: filo + testo ── */}
          <div className="s2-origin__left">
            {/* Filo dorato ondulato: scende lungo il margine del testo e,
                in fondo, curva verso il centro per preparare la tappa 03.
                Il puntino di luce percorre il filo in loop. */}
            <svg
              className="s2-origin__thread"
              viewBox="0 0 240 1000"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {/* Il percorso vive in defs: si disegna solo via <use>,
                  altrimenti il path nudo comparirebbe pieno di nero */}
              <defs>
                <path
                  id="s2-origin-thread-path"
                  d="M56,0 C18,130 98,290 52,460 C14,610 90,750 148,870 C186,945 230,980 236,1000"
                  pathLength="1"
                />
              </defs>
              <use href="#s2-origin-thread-path" className="s2-origin__thread-glow" />
              <use href="#s2-origin-thread-path" className="s2-origin__thread-stroke" />
              {/* Goccia di luce che percorre il filo */}
              <circle r="3.5" className="s2-origin__thread-drop">
                <animateMotion dur="8s" repeatCount="indefinite" rotate="auto">
                  <mpath href="#s2-origin-thread-path" />
                </animateMotion>
              </circle>
            </svg>

            <div className="s2-origin__body">
              <Reveal as="div" className="s2-label">
                02 · Origine e Contesto
              </Reveal>
              <LineReveal as="h2" className="s2-title-large" delay={80}>
                Una scelta incontra sempre una storia
              </LineReveal>
              <Reveal as="p" className="s2-lead-origin" delay={120}>
                Per questo, ogni evoluzione parte sempre da ciò che esiste.
              </Reveal>

              {/* Blocco centrale: i sei nodi-concetto (pillole traslucide
                  che si accendono in sequenza) e il paragrafo descrittivo */}
              <div className="s2-origin__middle">
                <div className="s2-origin__nodes" aria-label="Persone, processi, abitudini, relazioni, strumenti, responsabilità">
                  {CONCEPT_NODES.map((node, i) => (
                    <span className="s2-node" style={{ "--nd": `${0.7 + i * 0.22}s` }} key={node}>
                      <i className="s2-node__dot" aria-hidden="true" />
                      {node}
                    </span>
                  ))}
                </div>

                <Reveal as="p" className="s2-origin__desc" delay={220}>
                  Ci sono cose che funzionano, cose che si sono stratificate, altre che chiedono di
                  essere ripensate. Significa osservare ciò che c’è, riconoscere ciò che ha ancora
                  valore, sciogliere ciò che crea attrito e lasciare spazio a ciò che serve davvero.
                </Reveal>
              </div>

              <Reveal as="p" className="s2-origin__axiom" delay={280}>
                Prima di cambiare qualcosa, bisogna capire che cosa merita di continuare.
              </Reveal>
            </div>
          </div>

          {/* ── Colonna di destra: la scultura di bisso ──
              Gala in parallasse (deriva lenta) su sfondo trasparente:
              solo seta e filamenti dorati, nessun alone. */}
          <div className="s2-origin__right" aria-hidden="true">
            <div className="s2-sculpture">
              <img
                src="/scultura-sezione2.png"
                alt=""
                className="s2-sculpture__img"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══ TAPPA 03 — LA REALTÀ NON È FRAMMENTATA ═══
// Le 6 voci appese al filo + la trama d'ordine. Contenuto più alto
// della viewport: scorre dentro la sua slide e lo swipe a deck riprende
// solo ai bordi (in cima si torna alla tappa 02).
export function S2Frammentazione() {
  const sectionRef = useRef(null);
  const inView = useSectionInView(sectionRef);

  return (
    <section
      ref={sectionRef}
      className={`kh-sec s2-sec ${inView ? "s2-sec--visible" : ""}`}
      id="frammentazione"
      data-n="3"
    >
      <SilkWash a={0} b={10} c={90} d={100} />

      <div className="kh-col s2-container">
        {/* ── Il campo delle voci + Il filo d'oro ── */}
        <div className="s2-fragmentation">
          <div className="s2-fragmentation__header">
            <Reveal as="div" className="s2-label">
              03 · La complessità · Il punto di incontro
            </Reveal>
            <LineReveal as="h3" className="s2-title-main" delay={100}>
              La realtà non è frammentata
            </LineReveal>
            <Reveal as="p" className="s2-lead-sub" delay={140}>
              Quando hai raccolto tutte le risposte e devi ancora scegliere.
            </Reveal>
          </div>

          {/* Campo sparso con filo continuo */}
          <div className="s2-field">
            <svg
              className="s2-field__thread"
              viewBox="0 0 1000 620"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {/* Alone luminoso dorato sotto al filo */}
              <path
                d="M80,75 C210,40 390,12 560,40 C470,125 270,165 190,235 C310,310 510,225 630,275 C490,390 210,345 100,430 C250,490 470,530 590,470"
                className="s2-field__thread-glow"
                pathLength="1"
              />
              {/* Filo d'oro principale */}
              <path
                d="M80,75 C210,40 390,12 560,40 C470,125 270,165 190,235 C310,310 510,225 630,275 C490,390 210,345 100,430 C250,490 470,530 590,470"
                className="s2-field__thread-stroke"
                pathLength="1"
              />
            </svg>

            {/* Le 6 voci dell'azienda */}
            {VOICES.map((v, i) => (
              <div
                key={i}
                className="s2-fragment"
                style={{
                  "--fx": v.vx,
                  "--fy": v.vy,
                  "--fr": v.vr,
                  "--fdelay": v.delay,
                }}
              >
                <span className="s2-fragment__anchor" aria-hidden="true" />
                <span className="s2-fragment__content">{v.text}</span>
              </div>
            ))}
          </div>

          {/* Sintesi / Payoff */}
          <div className="s2-resolution">
            <Reveal as="p" className="s2-resolution__axiom" delay={80}>
              Ogni voce vede qualcosa.
              <br />
              Ogni scelta muove qualcosa.
            </Reveal>
            <Reveal as="p" className="s2-resolution__thesis" delay={140}>
              La realtà comincia proprio dove queste prospettive si incontrano.
            </Reveal>
          </div>
        </div>

        {/* ── Trama d'Ordine (Le connessioni senza gabbie) ── */}
        <div className="s2-weave">
          <div className="s2-weave__header">
            <Reveal as="div" className="s2-label">
              Mettere ordine · Connessioni
            </Reveal>
            <LineReveal as="h4" className="s2-title-weave" delay={80}>
              Il contesto dà significato alla scelta
            </LineReveal>
          </div>

          {/* Fila di incontri organica, disposta a trama sfalsata */}
          <div className="s2-weave__stream">
            {ORDER_RELATIONS.map((rel, idx) => (
              <Reveal
                as="div"
                key={idx}
                className="s2-weave__knot"
                delay={60 + idx * 60}
                style={{ "--knot-shift": rel.shift }}
              >
                <span className="s2-weave__knot-bullet" aria-hidden="true" />
                <span className="s2-weave__concept">{rel.concept}</span>
                <span className="s2-weave__arrow" aria-hidden="true">
                  →
                </span>
                <span className="s2-weave__connection">{rel.connection}</span>
              </Reveal>
            ))}
          </div>

          {/* Chiusura solenne */}
          <div className="s2-weave__epilogue">
            <Reveal as="p" className="s2-epilogue__phrase" delay={100}>
              Ogni scelta entra nella vita dell’impresa.
            </Reveal>
            <Reveal as="p" className="s2-epilogue__key" delay={150}>
              Il contesto dà significato alla scelta.
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}