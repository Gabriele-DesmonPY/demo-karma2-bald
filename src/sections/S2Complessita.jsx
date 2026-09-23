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
      className={`kh-sec s2-sec s2-sec--frammentazione ${inView ? "s2-sec--visible" : ""}`}
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
                {/* Il sway vive su un wrapper interno: una sola animazione di
                    transform per elemento → entrambe restano sul compositor */}
                <span className="s2-fragment__sway">
                  <span className="s2-fragment__anchor" aria-hidden="true" />
                  <span className="s2-fragment__content">{v.text}</span>
                </span>
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