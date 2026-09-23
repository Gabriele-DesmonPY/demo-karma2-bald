import { useEffect, useRef, useState } from "react";
import SilkWash from "../components/SilkWash";
import Reveal from "../components/Reveal";
import LineReveal from "../components/LineReveal";
import "./S2Complessita.css";

// ═══ SEZIONE 2 — LA REALTÀ NON È FRAMMENTATA ═══
// Principi chiave:
// 1. "Ordinato nell'architettura, disordinato nella materia" — niente card, niente tabelle
// 2. Alto contrasto tipografico (#071526 navy inchiostro profondo, zero scritte sbiadite)
// 3. Filo dorato continuo vivo e vibrante che unisce le voci sparse
// 4. Animazione ordine come trama di connessioni organiche

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

export default function S2Complessita() {
  const sectionRef = useRef(null);
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
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`kh-sec s2-sec ${inView ? "s2-sec--visible" : ""}`}
      id="complessita"
      data-n="2"
    >
      {/* Sfondo SilkWash pastello e fili d'oro a opacità calibrata per massimo contrasto */}
      <SilkWash a={0} b={10} c={90} d={100} />

      <div className="kh-col s2-container">
        {/* ── ATTO 1: Una scelta incontra sempre una storia ── */}
        <div className="s2-origin">
          <Reveal as="div" className="s2-label">
            02 · Origine e Contesto
          </Reveal>
          <LineReveal as="h2" className="s2-title-large" delay={80}>
            Una scelta incontra sempre una storia
          </LineReveal>
          <Reveal as="p" className="s2-lead-origin" delay={120}>
            Per questo, ogni evoluzione parte sempre da ciò che esiste.
          </Reveal>

          <div className="s2-origin__prose">
            <Reveal as="p" className="s2-origin__statement" delay={160}>
              Persone, processi, abitudini, relazioni, strumenti, responsabilità.
            </Reveal>
            <Reveal as="p" className="s2-origin__desc" delay={200}>
              Ci sono cose che funzionano, cose che si sono stratificate, altre che chiedono di
              essere ripensate. Significa osservare ciò che c’è, riconoscere ciò che ha ancora
              valore, sciogliere ciò che crea attrito e lasciare spazio a ciò che serve davvero.
            </Reveal>
            <Reveal as="p" className="s2-origin__axiom" delay={240}>
              Prima di cambiare qualcosa, bisogna capire che cosa merita di continuare.
            </Reveal>
          </div>
        </div>

        {/* ── ATTO 2: La realtà non è frammentata (Le 6 voci + Il filo d'oro) ── */}
        <div className="s2-fragmentation">
          <div className="s2-fragmentation__header">
            <Reveal as="div" className="s2-label">
              La complessità · Il punto di incontro
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

        {/* ── ATTO 3: Trama d'Ordine (Le connessioni senza gabbie) ── */}
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
