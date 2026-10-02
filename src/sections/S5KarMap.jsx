import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SiteFooter from "../components/SiteFooter";
import "./S5KarMap.css";

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════════════
   SEZIONE 05 — KarMAP: CIÒ CHE TI RESTITUIAMO
   Impianto editoriale a tre colonne, senza card: a sinistra titolo +
   Fase 01 (Questionario), al centro la "Spirale Identitaria" in SVG
   (stessa famiglia logaritmica r = a·e^(bθ) di Spiral.jsx), a destra
   la Fase 02 (Calendario). Tutto respira sul navy, niente scatole.

   - Il filo parte dall'esterno e scende verso IL SEME: è diviso in 7
     tratti, uno per tappa. Ogni tappa ha il suo tratto: passando sopra
     (o col focus / tocco) etichetta e filo si accendono insieme.
   - Le 7 tappe sono TUTTE sullo stesso piano (nota call, SCHEMA-SEZIONI):
     cambia la posizione lungo la spirale, mai il peso visivo.
   - Su schermi stretti le etichette non entrano attorno alla spirale:
     sul filo restano i numeri, il testo va in una legenda sotto.
   ═══════════════════════════════════════════════════════════════ */

// TODO: inserire i link reali (Google Form del questionario, Calendly/Cal…)
const QUESTIONARIO_URL = "#questionario";
const CALENDARIO_URL = "#prenota";

// Sfondo della sezione e posizione del suo punto luce (in frazioni)
const BG = { jpg: "/karmap-bg.jpg", webp: "/karmap-bg.webp", ratio: 832 / 1248, fx: 0.468, fy: 0.46 };

const TAPPE = [
  "Dove siamo",
  "Cosa si sta muovendo",
  "I nodi",
  "Le connessioni",
  "Ciò che conta",
  "Gli sguardi da attivare",
  "Da attraversare",
];

/* ── Geometria della spirale (unità del viewBox −500…500) ──
   phi = cammino angolare dall'esterno verso il centro.
   r(phi) = R0·e^(−B·phi): il filo si stringe verso il seme.
   Le 7 tappe coprono un giro e un quarto (75° l'una dall'altra): si
   distribuiscono tutte attorno al seme, a raggi diversi, e le etichette
   non si accavallano. */
const R0 = 470; // raggio d'ingresso del filo
const B = 0.14; // apertura della spirale (più alta = spira più aperta)
const TH0 = (-146 * Math.PI) / 180; // angolo d'ingresso (in alto a sinistra)
const STEP = (75 * Math.PI) / 180; // passo angolare tra due tappe
const R_FIRST = 420; // raggio della prima tappa
const R_CORE = 74; // il filo si posa sul bordo del seme
const LABEL_GAP = 24; // distanza etichetta ↔ nodo

const PHI_FIRST = Math.log(R0 / R_FIRST) / B;
const PHI_CORE = Math.log(R0 / R_CORE) / B;

const at = (phi, phase = 0) => {
  const r = R0 * Math.exp(-B * phi);
  const a = TH0 + phi + phase;
  return { x: r * Math.cos(a), y: r * Math.sin(a), r, a };
};

const trace = (p0, p1, phase = 0, step = 0.05) => {
  let d = "";
  for (let phi = p0; phi < p1; phi += step) {
    const { x, y } = at(phi, phase);
    d += (d ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1) + " ";
  }
  const { x, y } = at(p1, phase);
  return d + "L" + x.toFixed(1) + " " + y.toFixed(1);
};

// Calcolata una volta sola al caricamento del modulo (funzione pura)
const NODES = TAPPE.map((label, i) => {
  const phi = PHI_FIRST + i * STEP;
  const p = at(phi);
  const ux = Math.cos(p.a);
  const uy = Math.sin(p.a);
  return {
    label,
    phi,
    x: p.x,
    y: p.y,
    ux,
    uy,
    // punto d'aggancio dell'etichetta, appena fuori dal nodo (in %)
    lx: ((p.x + ux * LABEL_GAP + 500) / 1000) * 100,
    ly: ((p.y + uy * LABEL_GAP + 500) / 1000) * 100,
    align: ux > 0.35 ? "start" : ux < -0.35 ? "end" : "center",
  };
});

// Il tratto di ogni tappa: dal nodo precedente (o dall'ingresso) al suo
const SEGMENTS = NODES.map((n, i) => trace(i === 0 ? 0 : NODES[i - 1].phi, n.phi));
// Ultimo tratto: dall'ultima tappa al seme
const CORE_PATH = trace(NODES[NODES.length - 1].phi, PHI_CORE);
// Fili decorativi: due bracci gemelli ruotati di 120°, più sottili
const ECHO_PATHS = [(2 * Math.PI) / 3, (4 * Math.PI) / 3].map((ph) => trace(0, PHI_CORE, ph, 0.07));

const pad = (n) => String(n).padStart(2, "0");

export default function S5KarMap() {
  const sectionRef = useRef(null);
  const mapRef = useRef(null);
  const [active, setActive] = useState(null);
  // con movimento ridotto la spirale nasce già disegnata
  const [drawn, setDrawn] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [compact, setCompact] = useState(false);

  // Il filo si disegna quando la mappa entra in vista nella slide attiva
  useEffect(() => {
    const map = mapRef.current;
    if (!map || drawn) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDrawn(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(map);
    return () => io.disconnect();
  }, [drawn]);

  // Modalità compatta: decisa dalla larghezza reale della mappa
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const ro = new ResizeObserver(([entry]) => {
      setCompact(entry.contentRect.width < 520);
    });
    ro.observe(map);
    return () => ro.disconnect();
  }, []);

  // Sfondo fotografico: il punto luce dorato dell'immagine (46.8% / 46%
  // del fotogramma) viene agganciato al centro esatto della spirale, a
  // qualunque larghezza. Solo variabili CSS: nessun re-render React.
  useEffect(() => {
    const section = sectionRef.current;
    const stage = mapRef.current;
    if (!section || !stage) return;
    const place = () => {
      const sr = section.getBoundingClientRect();
      const mr = stage.getBoundingClientRect();
      const cx = mr.left + mr.width / 2 - sr.left;
      const cy = mr.top + mr.height / 2 - sr.top;
      const w = Math.max(sr.width * 1.25, mr.width * 2.6, 1200);
      const h = w * BG.ratio;
      section.style.setProperty("--s5-bgw", `${w.toFixed(0)}px`);
      section.style.setProperty("--s5-bgx", `${(cx - w * BG.fx).toFixed(0)}px`);
      section.style.setProperty("--s5-bgy", `${(cy - h * BG.fy).toFixed(0)}px`);
      section.style.setProperty("--s5-bgt", "none");
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(section);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  // Dissolvenza legata allo scroll (scrub 0.5 → segue le dita, con un
  // filo di morbidezza): scendendo verso il footer la KarMAP si fa eterea
  // (opacità 0.2, scale 0.98, sale appena) e il footer emerge dal basso.
  // Solo transform/opacity: niente blur in scrub, che costerebbe un
  // ridisegno della spirale a ogni fotogramma di scroll.
  useEffect(() => {
    const section = sectionRef.current;
    const scroller = section?.closest(".sandbox-slide");
    if (!section || !scroller) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const footer = section.parentElement?.querySelector(".site-footer__grid");
    const ctx = gsap.context(() => {
      gsap.to(section.querySelector(".s5__inner"), {
        opacity: 0.2,
        scale: 0.98,
        y: -30,
        ease: "none",
        scrollTrigger: { trigger: section, scroller, start: "bottom 85%", end: "bottom 20%", scrub: 0.5 },
      });
      if (footer) {
        gsap.fromTo(
          footer,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            ease: "none",
            scrollTrigger: { trigger: footer, scroller, start: "top 98%", end: "top 55%", scrub: 0.5 },
          }
        );
      }
    }, section);
    return () => ctx.revert();
  }, []);

  // Props condivise da etichette e voci di legenda
  const bind = (i) => ({
    onMouseEnter: () => setActive(i),
    onMouseLeave: () => setActive((cur) => (cur === i ? null : cur)),
    onFocus: () => setActive(i),
    onBlur: () => setActive((cur) => (cur === i ? null : cur)),
    // tocco: accende / spegne (su touch non esiste l'hover)
    onClick: () => setActive((cur) => (cur === i ? null : i)),
    "aria-pressed": active === i,
  });

  return (
    <div className="s5-root">
      <section
        ref={sectionRef}
        className={"s5" + (drawn ? " is-drawn" : "") + (active !== null ? " has-active" : "")}
        id="karmap"
        data-n="5"
        aria-labelledby="s5-title"
      >
        <div className="s5__bg" aria-hidden="true">
          {/* scia di fili dorati, sfocata e attenuata: accompagna la spirale */}
          <picture className="s5__photo">
            <source srcSet={BG.webp} type="image/webp" />
            <img src={BG.jpg} alt="" width="1248" height="832" decoding="async" />
          </picture>
          <div className="s5__veil" />
        </div>

        <div className="s5__inner">
          {/* ── Colonna sinistra: intestazione + Fase 01 ── */}
          <div className="s5__left">
            <header className="s5__head s5-in" style={{ "--d": "0ms" }}>
              <p className="s5__eyebrow">Ciò che ti restituiamo</p>
              <h2 id="s5-title" className="s5__title">
                KarMAP
              </h2>
              <p className="s5__lede">
                Una spirale identitaria e decisionale che restituisce una prima lettura di dove siete,
                che cosa si sta muovendo e quali connessioni meritano attenzione.
              </p>
            </header>

            <span className="s5__rule s5-in" style={{ "--d": "90ms" }} aria-hidden="true" />

            <article className="s5-phase s5-phase--one s5-in" style={{ "--d": "160ms" }} aria-labelledby="s5-f1-title">
              <p className="s5-phase__badge">
                <span>Fase 01</span>
                <span className="s5-phase__slash" aria-hidden="true">/</span>
                <span>Questionario</span>
              </p>
              <h3 id="s5-f1-title" className="s5-phase__title">
                Diagnosi
              </h3>
              <p className="s5-phase__text">
                Rispondi a poche domande e raccontaci il momento che la tua impresa sta attraversando.
              </p>
              <a className="s5-btn s5-btn--solid" href={QUESTIONARIO_URL}>
                <span>Compila il questionario</span>
                <span className="s5-btn__arrow" aria-hidden="true">
                  →
                </span>
              </a>
            </article>
          </div>

          {/* ── La spirale KarMAP ── */}
          <figure className={"s5-map" + (compact ? " is-compact" : "")} aria-labelledby="s5-map-cap">
            <figcaption id="s5-map-cap" className="sr-only">
              La spirale KarMAP: sette tappe lungo un unico filo che scende verso il seme — {TAPPE.join(", ")}.
            </figcaption>

            <div className="s5-map__stage" ref={mapRef}>
              {/* bagliore del seme: l'involucro entra in dissolvenza, il cuore pulsa */}
              <div className="s5-map__halo" aria-hidden="true">
                <span className="s5-map__pulse" />
              </div>

              {/* Bracci della spirale in rotazione eterea (50 s / giro).
                  Ruota l'intero <svg> come livello composito: solo transform,
                  60 fps senza ridisegnare i tracciati. Nodi, etichette e IL
                  SEME stanno su livelli separati e restano fermi e orizzontali. */}
              <svg className="s5-map__echo" viewBox="-500 -500 1000 1000" aria-hidden="true">
                <defs>
                  <radialGradient id="s5-echo-fade" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="480">
                    <stop offset="0%" stopColor="#d4af37" stopOpacity="0" />
                    <stop offset="22%" stopColor="#d4af37" stopOpacity="0" />
                    <stop offset="55%" stopColor="#d4af37" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#d4af37" stopOpacity="0.3" />
                  </radialGradient>
                </defs>
                {ECHO_PATHS.map((d, i) => (
                  <path key={i} d={d} className="s5-echo" stroke="url(#s5-echo-fade)" />
                ))}
              </svg>

              {/* il filo delle tappe */}
              <svg className="s5-map__svg" viewBox="-500 -500 1000 1000" aria-hidden="true">
                <defs>
                  {/* il filo sfuma entrando nel seme */}
                  <radialGradient id="s5-fade" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="480">
                    <stop offset="0%" stopColor="#fef3c7" stopOpacity="0" />
                    <stop offset="14%" stopColor="#f5dc8a" stopOpacity="0.05" />
                    <stop offset="38%" stopColor="#d4af37" stopOpacity="0.75" />
                    <stop offset="78%" stopColor="#d4af37" stopOpacity="1" />
                    <stop offset="100%" stopColor="#d4af37" stopOpacity="0.55" />
                  </radialGradient>
                  <radialGradient id="s5-seed-fill" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.28" />
                    <stop offset="55%" stopColor="#d4af37" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
                  </radialGradient>
                  {/* glow dorato: drop-shadow 0 0 8px rgba(212,175,55,.4) */}
                  <filter id="s5-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="#d4af37" floodOpacity="0.4" />
                  </filter>
                </defs>

                <g filter="url(#s5-glow)">
                  {SEGMENTS.map((d, i) => (
                    <path
                      key={i}
                      d={d}
                      pathLength="1"
                      className={"s5-seg" + (active === i ? " is-on" : "")}
                      stroke="url(#s5-fade)"
                      style={{ "--i": i }}
                    />
                  ))}
                  <path
                    d={CORE_PATH}
                    pathLength="1"
                    className="s5-seg s5-seg--core"
                    stroke="url(#s5-fade)"
                    style={{ "--i": NODES.length }}
                  />
                </g>

                {/* area di presa larga e invisibile sul filo (solo puntatore) */}
                {SEGMENTS.map((d, i) => (
                  <path
                    key={"hit" + i}
                    d={d}
                    className="s5-hit"
                    onMouseEnter={() => setActive(i)}
                    onMouseLeave={() => setActive((cur) => (cur === i ? null : cur))}
                  />
                ))}

                {/* il seme */}
                <circle r={R_CORE + 26} fill="url(#s5-seed-fill)" className="s5-seed__fill" />
                <circle r={R_CORE} className="s5-seed__ring" />
                <circle r={R_CORE - 10} className="s5-seed__ring s5-seed__ring--in" />

              </svg>

              {/* IL SEME */}
              <p className="s5-seed__label">
                <span>Il seme</span>
              </p>

              {/* Micro-punti luminosi delle tappe (HTML: scala + glow composti) */}
              {!compact &&
                NODES.map((n, i) => (
                  <span
                    key={"dot" + n.label}
                    className={"s5-dot" + (active === i ? " is-on" : "")}
                    style={{
                      left: `${((n.x + 500) / 10).toFixed(2)}%`,
                      top: `${((n.y + 500) / 10).toFixed(2)}%`,
                      "--i": i,
                    }}
                    aria-hidden="true"
                    onMouseEnter={() => setActive(i)}
                    onMouseLeave={() => setActive((cur) => (cur === i ? null : cur))}
                    onClick={() => setActive((cur) => (cur === i ? null : i))}
                  />
                ))}

              {/* Etichette (o numeri, in modalità compatta) */}
              {NODES.map((n, i) =>
                compact ? (
                  <span
                    key={n.label}
                    className={"s5-pin" + (active === i ? " is-on" : "")}
                    style={{ left: `${((n.x + 500) / 10).toFixed(2)}%`, top: `${((n.y + 500) / 10).toFixed(2)}%`, "--i": i }}
                    aria-hidden="true"
                  >
                    {pad(i + 1)}
                  </span>
                ) : (
                  <button
                    key={n.label}
                    type="button"
                    className={`s5-label s5-label--${n.align}` + (active === i ? " is-on" : "")}
                    style={{
                      left: `${n.lx.toFixed(2)}%`,
                      top: `${n.ly.toFixed(2)}%`,
                      "--ux": n.ux.toFixed(3),
                      "--uy": n.uy.toFixed(3),
                      "--i": i,
                    }}
                    {...bind(i)}
                  >
                    {n.label}
                  </button>
                )
              )}
            </div>

            {/* Legenda (solo modalità compatta) */}
            {compact && (
              <ol className="s5-legend">
                {NODES.map((n, i) => (
                  <li key={n.label}>
                    <button
                      type="button"
                      className={"s5-legend__item" + (active === i ? " is-on" : "")}
                      {...bind(i)}
                    >
                      <span className="s5-legend__num" aria-hidden="true">
                        {pad(i + 1)}
                      </span>
                      {n.label}
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </figure>

          {/* ── Colonna destra: Fase 02 ── */}
          <div className="s5__right">
            <article className="s5-phase s5-phase--two s5-in" style={{ "--d": "260ms" }} aria-labelledby="s5-f2-title">
              <p className="s5-phase__badge">
                <span>Fase 02</span>
                <span className="s5-phase__slash" aria-hidden="true">/</span>
                <span>Calendario</span>
              </p>
              <h3 id="s5-f2-title" className="s5-phase__title">
                Incontriamoci
              </h3>
              <p className="s5-phase__text">
                La tua evoluzione comincia da dove sei. 30 minuti per leggere insieme la tua KarMAP e
                sperimentare un primo modo di lavorare come team.
              </p>
              <a className="s5-btn s5-btn--ghost" href={CALENDARIO_URL}>
                <span>Prenota un incontro</span>
              </a>
              <p className="s5-phase__note">Non serve preparare nulla. Partiamo da ciò che c’è.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Footer & contatti in coda all'ultima slide del deck */}
      <SiteFooter />
    </div>
  );
}

export { S5KarMap };
