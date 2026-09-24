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
// ── Fascio di fili d'oro ("la trama delle relazioni") ──
// 4 percorsi paralleli e sfalsati (viewBox 1440×900): attraversano la
// sezione, passano per il centro del radar e scendono verso la Sezione 03.
const FILO_MAIN_D =
  "M 0,120 C 300,220 200,660 450,700 C 680,730 850,480 1000,400 C 1150,320 1300,530 1440,820";
const FILI = [
  { id: "halo", d: FILO_MAIN_D }, // alone del filo principale (sostituisce il filter)
  { id: "main", d: "M 0,120 C 300,220 200,660 450,700 C 680,730 850,480 1000,400 C 1150,320 1300,530 1440,820" },
  { id: "sub-1", d: "M 0,90 C 280,190 220,630 430,670 C 660,700 830,450 980,370 C 1130,290 1280,500 1440,790" },
  { id: "sub-2", d: "M 0,150 C 320,250 180,690 470,730 C 700,760 870,510 1020,430 C 1170,350 1320,560 1440,850" },
  { id: "accent", d: "M 0,110 C 350,280 150,620 440,710 C 640,780 880,430 1010,390 C 1180,310 1270,580 1440,810" },
];

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
        const on = entry.intersectionRatio >= 0.35;
        if (on) setEntered(true);
        setLive(on);
      },
      { threshold: [0, 0.35] }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // ── Radar: l'esagono guida si disegna, poi l'area delle priorità cresce
  //    dal centro e continua a spostarsi (indecisione) finché la sezione è
  //    in vista. Uscendo tutto si riavvolge; il loop è in pausa fuori vista.
  const radarRef = useRef(null);
  const radarHaloRef = useRef(null);
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
      const str = pts.join(" ");
      shape.setAttribute("points", str);
      radarHaloRef.current?.setAttribute("points", str);
    };
    const asVars = (arr) => Object.fromEntries(arr.map((r, i) => [`r${i}`, r]));

    // l'area parte già nella sua forma: l'ingresso la fa solo "accendere"
    Object.assign(v, asVars(RADAR_START));
    render();
    if (reduced) return;

    // Loop dell'indecisione: yoyo infinito tra gli stati, morbido
    const morph = gsap.timeline({ repeat: -1, yoyo: true, paused: true });
    RADAR_STATES.forEach((st) => {
      morph.to(v, { ...asVars(st), duration: 3.5, ease: "sine.inOut", onUpdate: render });
    });
    morphTl.current = morph;

    // Ingresso (automatico, niente scrub):
    // A. il fascio di fili scivola verso destra (+ esagono guida)
    // B. quando i fili raggiungono il radar, l'area si accende e "respira"
    // C. i nodi sbocciano, poi le etichette; infine parte il loop.
    const tl = gsap.timeline({
      paused: true,
      onComplete: () => morph.play(),
      onReverseComplete: () => morph.pause(0),
    });
    const sec = sectionRef.current;
    const main = sec?.querySelectorAll("#filo-main, #filo-halo");
    const subs = sec?.querySelectorAll("#filo-sub-1, #filo-sub-2, #filo-accent");
    if (main?.length) {
      tl.fromTo(main, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.0, ease: "power2.out" }, 0);
    }
    if (subs?.length) {
      tl.fromTo(
        subs,
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 1.0, stagger: 0.1, ease: "power2.out" },
        0.1
      );
    }
    tl.fromTo(
      q(".s2o-hex__path"),
      { strokeDashoffset: HEX_PERIMETER },
      { strokeDashoffset: 0, duration: 1.0, ease: "power2.inOut" },
      0
    )
      .fromTo(
        q(".s2o-hex__rays, .s2o-hex__ring"),
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: "power1.out" },
        0.4
      )
      .fromTo(
        q("#radar-shape"),
        { opacity: 0, scale: 0.85, svgOrigin: `${CX} ${CY}` },
        { opacity: 1, scale: 1, svgOrigin: `${CX} ${CY}`, duration: 0.6, ease: "back.out(1.4)" },
        "-=0.4"
      )
      .fromTo(
        q(".radar-node"),
        { scale: 0, opacity: 0, transformOrigin: "50% 50%" },
        { scale: 1, opacity: 1, stagger: 0.05, duration: 0.4, ease: "back.out(2)" },
        "-=0.3"
      )
      .fromTo(
        q(".s2o-hex__label-in"),
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, stagger: 0.06, duration: 0.45, ease: "power2.out" },
        "-=0.35"
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
      morph?.pause(0);
      tl.timeScale(1).restart();
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
              <g id="radar-shape" className="s2o-hex__radar-g">
                {/* alone: tratto largo e tenue al posto del drop-shadow */}
                <polygon ref={radarHaloRef} className="s2o-hex__radar-halo" points={ringPoints(0)} />
                <polygon ref={radarRef} className="s2o-hex__radar" points={ringPoints(0)} />
              </g>
              {/* nodi che seguono i punti del radar */}
              {HEX.map((h, i) => (
                <circle
                  key={h.t}
                  ref={(el) => (nodeRefs.current[i] = el)}
                  className="s2o-hex__radar-node radar-node"
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

      {/* ── Fascio di fili d'oro: attraversa la sezione, tocca il radar,
          prosegue verso la 03. Si srotola in ingresso, si riavvolge in uscita. */}
      <svg
        className="s2o-fili"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="s2o-fili-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#b89343" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#d4af37" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#b89343" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        {FILI.map((f) => (
          <path
            key={f.id}
            id={`filo-${f.id}`}
            className={`s2o-fili__path s2o-fili__path--${f.id}`}
            d={f.d}
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset="1"
          />
        ))}
      </svg>
    </section>
  );
}

export { S2Origine };
