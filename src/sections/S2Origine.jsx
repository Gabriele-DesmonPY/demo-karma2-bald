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
const CX = 200;
const CY = 200;

// Punto sull'asse i a una frazione r (0 = centro, 1 = vertice)
const onAxis = (i, r) => ({
  x: CX + (HEX[i].x - CX) * r,
  y: CY + (HEX[i].y - CY) * r,
});
const ringPoints = (r) =>
  HEX.map((_, i) => onAxis(i, r))
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

// ── Radar dell'indecisione ──
// Ogni stato = 6 valori (0–1) sugli assi, nell'ordine:
// Persone, Processi, Abitudini, Relazioni, Strumenti, Responsabilità.
// Le priorità "scivolano" da uno stato all'altro senza mai assestarsi.
const RADAR_START = [0.8, 0.72, 0.6, 0.75, 0.72, 0.62];
const RADAR_STATES = [
  [0.9, 0.86, 0.55, 0.6, 0.48, 0.66], // sbilanciato su Persone / Processi
  [0.6, 0.55, 0.92, 0.9, 0.5, 0.44], // sbilanciato su Abitudini / Relazioni
  [0.74, 0.58, 0.45, 0.55, 0.93, 0.9], // sbilanciato su Strumenti / Responsabilità
];
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

  // ── Radar: l'esagono guida si disegna, poi l'area delle priorità cresce
  //    dal centro e continua a spostarsi (indecisione) finché la sezione è
  //    in vista. Uscendo tutto si riavvolge; il loop è in pausa fuori vista.
  const radarRef = useRef(null);
  const nodeRefs = useRef([]);
  const morphTl = useRef(null);

  useEffect(() => {
    const root = hexRef.current;
    const shape = radarRef.current;
    if (!root || !shape) return;
    const q = gsap.utils.selector(root);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // valori correnti sui 6 assi (animati da GSAP)
    const v = { r0: 0, r1: 0, r2: 0, r3: 0, r4: 0, r5: 0 };
    const render = () => {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const p = onAxis(i, v[`r${i}`]);
        pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
        const n = nodeRefs.current[i];
        if (n) {
          n.setAttribute("cx", p.x.toFixed(1));
          n.setAttribute("cy", p.y.toFixed(1));
        }
      }
      shape.setAttribute("points", pts.join(" "));
    };
    const asVars = (arr) => Object.fromEntries(arr.map((r, i) => [`r${i}`, r]));

    if (reduced) {
      Object.assign(v, asVars(RADAR_START));
      render();
      return;
    }
    render();

    // Loop dell'indecisione: yoyo infinito tra gli stati, morbido
    const morph = gsap.timeline({ repeat: -1, yoyo: true, paused: true });
    RADAR_STATES.forEach((st) => {
      morph.to(v, { ...asVars(st), duration: 3.5, ease: "sine.inOut", onUpdate: render });
    });
    morphTl.current = morph;

    // Ingresso: esagono guida → assi e anello → area che cresce → etichette
    const tl = gsap.timeline({
      paused: true,
      onComplete: () => morph.play(),
      onReverseComplete: () => morph.pause(0),
    });
    tl.fromTo(
      q(".s2o-hex__path"),
      { strokeDashoffset: HEX_PERIMETER },
      { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut" }
    )
      .fromTo(
        q(".s2o-hex__rays, .s2o-hex__ring"),
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: "power1.out" },
        "-=0.7"
      )
      .fromTo(
        v,
        asVars([0, 0, 0, 0, 0, 0]),
        { ...asVars(RADAR_START), duration: 1.1, ease: "power3.out", onUpdate: render },
        "-=0.4"
      )
      .fromTo(
        q(".s2o-hex__radar-node"),
        { opacity: 0 },
        { opacity: 1, stagger: 0.06, duration: 0.3 },
        "-=0.9"
      )
      .fromTo(
        q(".s2o-hex__label-in"),
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "power2.out" },
        "-=0.6"
      );
    hexTl.current = tl;
    return () => {
      tl.kill();
      morph.kill();
      hexTl.current = null;
      morphTl.current = null;
    };
  }, []);

  useEffect(() => {
    const tl = hexTl.current;
    const morph = morphTl.current;
    if (!tl) return;
    if (live) {
      tl.timeScale(1).play();
      if (tl.progress() === 1) morph?.play(); // già entrato: riprende il loop
    } else {
      morph?.pause();
      tl.timeScale(2).reverse();
    }
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
              {/* anello guida al 50% */}
              <polygon className="s2o-hex__ring" points={ringPoints(0.5)} />
              {/* il perimetro che si disegna */}
              <polygon
                className="s2o-hex__path"
                points={HEX_POINTS}
                strokeDasharray={HEX_PERIMETER}
                strokeDashoffset={HEX_PERIMETER}
              />
              {/* centro */}
              <circle className="s2o-hex__core" cx="200" cy="200" r="3" />
              {/* area dinamica delle priorità (radar) */}
              <polygon ref={radarRef} className="s2o-hex__radar" points={ringPoints(0)} />
              {/* nodi che seguono i punti del radar */}
              {HEX.map((h, i) => (
                <circle
                  key={h.t}
                  ref={(el) => (nodeRefs.current[i] = el)}
                  className="s2o-hex__radar-node"
                  cx={CX}
                  cy={CY}
                  r="4"
                />
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
