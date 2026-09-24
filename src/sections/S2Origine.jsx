import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import "./S2Origine.css";

/* ═══════════════════════════════════════════════════════════════
   SEZIONE 02 — ORIGINE E CONTESTO
   Direzione: Editorial Luxury / rivista di alta gamma.
   Doppia pagina: a sinistra la colonna tipografica su panna, a destra
   l'esagono dei sei concetti (si disegna in ingresso, si riavvolge in
   uscita) su un'atmosfera di seta e oro molto tenue.

   Performance:
   - un solo IntersectionObserver sulla sezione;
   - l'ingresso aggiunge una classe (`s2o--in`) una volta sola;
   - la deriva lenta dell'atmosfera gira solo quando la sezione è
     in vista (`s2o--live`), altrimenti è in pausa;
   - la sfocatura è già nell'immagine: zero filtri calcolati dal browser;
   - animazioni esclusivamente su transform / opacity.
   ═══════════════════════════════════════════════════════════════ */

// Esagono: i 6 concetti sui vertici (coordinate nel viewBox 400×400).
// pos = da che lato del vertice sta l'etichetta.
const HEX = [
  { t: "Persone", x: 200, y: 40, pos: "top" },
  { t: "Processi", x: 338, y: 120, pos: "right" },
  { t: "Abitudini", x: 338, y: 280, pos: "right" },
  { t: "Relazioni", x: 200, y: 360, pos: "bottom" },
  { t: "Strumenti", x: 62, y: 280, pos: "left" },
  { t: "Responsabilità", x: 62, y: 120, pos: "left" },
];
const HEX_POINTS = HEX.map((v) => `${v.x},${v.y}`).join(" ");
const HEX_PERIMETER = 6 * 160; // lato ≈ 160 nel viewBox

export default function S2Origine() {
  const sectionRef = useRef(null);
  const hexRef = useRef(null);
  const hexTl = useRef(null);
  // `entered`: l'ingresso è avvenuto (resta vero per sempre)
  // `live`: la sezione è attualmente visibile (governa la fluttuazione)
  const [entered, setEntered] = useState(false);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    // Fallback: browser senza IntersectionObserver → tutto subito visibile
    if (typeof IntersectionObserver === "undefined") {
      setEntered(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setEntered(true);
        setLive(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // ── Esagono: si disegna quando la sezione è in vista, si riavvolge
  //    quando esce (play / reverse). Tutto molto leggero: un poligono SVG.
  useEffect(() => {
    const root = hexRef.current;
    if (!root) return;
    const q = gsap.utils.selector(root);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // resta tutto visibile (stato CSS)

    const tl = gsap.timeline({ paused: true });
    tl.fromTo(
      q(".s2o-hex__path"),
      { strokeDashoffset: HEX_PERIMETER },
      { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut" }
    )
      .fromTo(
        q(".s2o-hex__rays"),
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: "power1.out" },
        "-=0.7"
      )
      .fromTo(
        q(".s2o-hex__node"),
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, stagger: 0.1, duration: 0.5, ease: "back.out(2)" },
        "-=0.5"
      )
      .fromTo(
        q(".s2o-hex__label-in"),
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "power2.out" },
        "-=0.4"
      );
    hexTl.current = tl;
    return () => {
      tl.kill();
      hexTl.current = null;
    };
  }, []);

  useEffect(() => {
    const tl = hexTl.current;
    if (!tl) return;
    if (live) tl.timeScale(1).play();
    else tl.timeScale(2).reverse();
  }, [live]);

  const stateClass = `${entered ? " s2o--in" : ""}${live ? " s2o--live" : ""}`;

  return (
    <section
      ref={sectionRef}
      id="complessita"
      data-n="2"
      className={`s2o${stateClass}`}
      aria-labelledby="s2o-title"
    >
      <div className="s2o__grid">
        {/* ── Colonna sinistra: la pagina di testo ── */}
        <div className="s2o__text">
          <div className="s2o__head">
            <p className="s2o__tag s2o-r" style={{ "--d": "0ms" }}>
              <span className="s2o__tag-num">02</span>
              <span className="s2o__tag-sep" aria-hidden="true">·</span>
              Origine e contesto
            </p>

            {/* Titolo monumentale: ogni riga sale da una maschera */}
            <h2 id="s2o-title" className="s2o__title">
              <span className="s2o__line">
                <span className="s2o__line-in" style={{ "--d": "90ms" }}>
                  Una scelta incontra
                </span>
              </span>
              <span className="s2o__line">
                <span className="s2o__line-in" style={{ "--d": "190ms" }}>
                  sempre <em>una storia</em>
                </span>
              </span>
            </h2>

            <p className="s2o__lede s2o-r" style={{ "--d": "340ms" }}>
              Per questo, ogni evoluzione parte sempre da ciò che esiste.
            </p>
          </div>

          <div className="s2o__middle">
            {/* filetto d'oro a tutta larghezza */}
            <span className="s2o__hair s2o-r" style={{ "--d": "440ms" }} aria-hidden="true" />

            <p className="s2o__body s2o-r" style={{ "--d": "520ms" }}>
              Ci sono cose che funzionano, cose che si sono stratificate, altre che chiedono di
              essere ripensate. Significa osservare ciò che c’è, riconoscere ciò che ha ancora
              valore, sciogliere ciò che crea attrito e lasciare spazio a ciò che serve davvero.
            </p>
          </div>

          {/* Manifesto di chiusura, ancorato in fondo alla colonna */}
          <blockquote className="s2o__manifesto s2o-r" style={{ "--d": "680ms" }}>
            <p>Prima di cambiare qualcosa, bisogna capire che cosa merita di continuare.</p>
          </blockquote>
        </div>

        {/* ── Colonna destra: l'esagono dei sei concetti ── */}
        <figure className="s2o-hex" ref={hexRef} aria-label="Persone, processi, abitudini, relazioni, strumenti, responsabilità">
          <div className="s2o-hex__box">
            <svg className="s2o-hex__svg" viewBox="0 0 400 400" aria-hidden="true">
              <defs>
                <radialGradient id="s2o-hex-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0" stopColor="#e2c974" stopOpacity="0.22" />
                  <stop offset="1" stopColor="#e2c974" stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* alone centrale, statico */}
              <circle cx="200" cy="200" r="150" fill="url(#s2o-hex-glow)" />
              {/* raggi dal centro ai vertici */}
              <g className="s2o-hex__rays">
                {HEX.map((v) => (
                  <line key={v.t} x1="200" y1="200" x2={v.x} y2={v.y} />
                ))}
              </g>
              {/* il perimetro che si disegna */}
              <polygon
                className="s2o-hex__path"
                points={HEX_POINTS}
                strokeDasharray={HEX_PERIMETER}
                strokeDashoffset={HEX_PERIMETER}
              />
              {/* centro */}
              <circle className="s2o-hex__core" cx="200" cy="200" r="3" />
              {/* nodi dorati sui vertici */}
              {HEX.map((v) => (
                <g key={v.t} className="s2o-hex__node" style={{ transformOrigin: `${v.x}px ${v.y}px` }}>
                  <circle cx={v.x} cy={v.y} r="9" className="s2o-hex__node-halo" />
                  <circle cx={v.x} cy={v.y} r="4" className="s2o-hex__node-dot" />
                </g>
              ))}
            </svg>

            {/* etichette HTML ancorate ai vertici (in % del riquadro) */}
            {HEX.map((v) => (
              <span
                key={v.t}
                className={`s2o-hex__label s2o-hex__label--${v.pos}`}
                style={{ left: `${v.x / 4}%`, top: `${v.y / 4}%` }}
              >
                <span className="s2o-hex__label-in">{v.t}</span>
              </span>
            ))}
          </div>
        </figure>
      </div>

      {/* ── Atmosfera visiva: metà destra a pieno bordo ──
          Seta e fili d'oro già sfocati in fase di export (nessun filtro
          live): la sfumatura verso il panna è una maschera CSS statica. */}
      <div className="s2o__atmo" aria-hidden="true">
        <picture>
          <source srcSet="/atmosfera-sezione2.webp" type="image/webp" />
          <img
            className="s2o__atmo-img"
            src="/atmosfera-sezione2.jpg"
            alt=""
            width="1024"
            height="1536"
            decoding="async"
            draggable="false"
          />
        </picture>
      </div>
    </section>
  );
}

export { S2Origine };
