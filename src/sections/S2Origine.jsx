import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
// 4 fili sfalsati (viewBox 1440×900): entrano dal bordo sinistro (in
// continuità con la 01), passano sotto al testo e per il centro del radar,
// poi escono dal bordo destro curvando verso il basso, verso la 03.
// Ogni filo è una catena di cubiche: i suoi punti di controllo sono
// "vivi" (il mouse li sposta e il filo si deforma, poi torna a riposo).
const BASE_D = {
  main: "M 0,120 C 300,220 200,660 450,700 C 680,730 850,480 1000,400 C 1150,320 1300,530 1440,820",
  "sub-1": "M 0,90 C 280,190 220,630 430,670 C 660,700 830,450 980,370 C 1130,290 1280,500 1440,790",
  "sub-2": "M 0,150 C 320,250 180,690 470,730 C 700,760 870,510 1020,430 C 1170,350 1320,560 1440,850",
  accent: "M 0,110 C 350,280 150,620 440,710 C 640,780 880,430 1010,390 C 1180,310 1270,580 1440,810",
};

const norm = (x, y) => {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
};

// Prolunga il filo: entra da fuori schermo a sinistra (stessa tangente) ed
// esce a destra oltre il bordo, piegando verso il basso.
function extend(d) {
  const n = d.match(/-?\d+(\.\d+)?/g).map(Number);
  const pts = [];
  for (let i = 0; i < n.length; i += 2) pts.push([n[i], n[i + 1]]);
  const [p0, p1] = pts;
  const [sx, sy] = norm(p1[0] - p0[0], p1[1] - p0[1]);
  const S = [p0[0] - sx * 240, p0[1] - sy * 240];
  const head = [S, [S[0] + sx * 80, S[1] + sy * 80], [p0[0] - sx * 80, p0[1] - sy * 80]];
  const pn = pts[pts.length - 1];
  const pc = pts[pts.length - 2];
  const [ex, ey] = norm(pn[0] - pc[0], pn[1] - pc[1]);
  const E = [pn[0] + ex * 170 + 40, pn[1] + ey * 170 + 190];
  const [dx, dy] = norm(E[0] - pn[0] + 0, E[1] - pn[1] + 60);
  const tail = [[pn[0] + ex * 90, pn[1] + ey * 90], [E[0] - dx * 90, E[1] - dy * 90], E];
  return [...head, ...pts, ...tail];
}

const toD = (pts, off) => {
  let d = `M${(pts[0][0] + off[0]).toFixed(1)},${(pts[0][1] + off[1]).toFixed(1)}C`;
  for (let i = 1; i < pts.length; i++) {
    d += `${(pts[i][0] + off[i * 2]).toFixed(1)},${(pts[i][1] + off[i * 2 + 1]).toFixed(1)} `;
  }
  return d;
};

// Punto d'ancoraggio sul filo (indice nella catena prolungata): è il
// passaggio che a runtime viene portato ESATTAMENTE sul centro del radar,
// dove si accende il nodo d'oro. Da lì il fascio prosegue sfumando.
const ANCHOR = 9;
// il gradiente di ogni filo (unità del viewBox): pieno fino al nodo, poi
// scende al ~28% verso l'angolo in basso a destra
const FADE_X2 = 1440;
const FILI_GRADS = [
  { id: "halo", color: "#d4af37", a: [0.12, 0.2, 0.05] },
  { id: "main", color: "#d4af37", a: [0.75, 1, 0.28] },
  { id: "sub-1", color: "#b89343", a: [0.4, 0.45, 0.12] },
  { id: "sub-2", color: "#b89343", a: [0.32, 0.36, 0.1] },
  { id: "accent", color: "#86602a", a: [0.28, 0.3, 0.08] },
];

// k = quanto il filo "sente" il mouse: fili diversi, risposte diverse →
// il fascio si apre e si richiude come un nastro vivo.
const STRANDS = [
  { id: "halo", src: "main", k: 1 }, // alone del filo principale (niente filter)
  { id: "main", src: "main", k: 1 },
  { id: "sub-1", src: "sub-1", k: 0.75 },
  { id: "sub-2", src: "sub-2", k: 1.25 },
  { id: "accent", src: "accent", k: 1.5 },
].map((f) => {
  const pts = extend(BASE_D[f.src]);
  return { ...f, pts, d: toD(pts, new Float32Array(pts.length * 2)) };
});

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
  const resetRef = useRef(null);
  const needsRestart = useRef(true);
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
        // uscita COMPLETA (sezione fuori schermo, in giù o in su): reset
        // istantaneo allo stato 0, invisibile. Al rientro l'esagono riparte
        // pulito dal centro, senza mai mostrare lo stato finale.
        // (a slide adiacente l'IO la dà ancora "intersecante" con ratio 0:
        // conta il rapporto, non isIntersecting)
        if (entry.intersectionRatio < 0.01) resetRef.current?.();
      },
      { threshold: [0, 0.01, 0.35] }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // ── Radar: l'esagono guida si disegna, poi l'area delle priorità cresce
  //    dal centro e continua a spostarsi (indecisione) finché la sezione è
  //    in vista. Uscendo tutto si riavvolge; il loop è in pausa fuori vista.
  const radarRef = useRef(null);
  const radarHaloRef = useRef(null);
  const filiRefs = useRef([]);
  const filiSvgRef = useRef(null);
  const fadeStopRefs = useRef([]);
  // i punti dei fili, allineati al radar reale (aggiornati su resize)
  const alignedRef = useRef(STRANDS.map((f) => f.pts.map((p) => [...p])));
  // lunghezza a schermo di ogni filo (per il disegno a tratteggio)
  const lensRef = useRef(new Map());

  // ── Allineamento: il filo passa esattamente per il centro del radar ──
  // Misura il centro dell'esagono nelle unità del viewBox dei fili e sposta
  // lì il punto d'ancoraggio (con le sue maniglie: la curva resta morbida).
  // I fili del fascio convergono sul nodo e poi si riaprono.
  const alignFili = useCallback(() => {
    const svg = filiSvgRef.current;
    const hexSvg = hexRef.current?.querySelector(".s2o-hex__svg");
    if (!svg || !hexSvg) return;
    const r = svg.getBoundingClientRect();
    const h = hexSvg.getBoundingClientRect();
    if (!r.width || !r.height || !h.width) return;
    const ux = ((h.left + h.width / 2 - r.left) / r.width) * 1440;
    const uy = ((h.top + h.height / 2 - r.top) / r.height) * 900;
    const mainA = STRANDS.find((f) => f.id === "main").pts[ANCHOR];
    STRANDS.forEach((f, si) => {
      const a = f.pts[ANCHOR];
      const dx = ux + (a[0] - mainA[0]) * 0.25 - a[0];
      const dy = uy + (a[1] - mainA[1]) * 0.25 - a[1];
      const out = f.pts.map((p) => [...p]);
      for (const k of [ANCHOR - 1, ANCHOR, ANCHOR + 1]) {
        out[k][0] += dx;
        out[k][1] += dy;
      }
      alignedRef.current[si] = out;
      filiRefs.current[si]?.setAttribute("d", toD(out, new Float32Array(out.length * 2)));
    });
    // la sfumatura parte dal nodo
    const off = Math.min(0.95, Math.max(0.05, ux / FADE_X2)).toFixed(3);
    fadeStopRefs.current.forEach((st) => st?.setAttribute("offset", off));
  }, []);

  // lunghezza a SCHERMO (il viewBox è deformato: preserveAspectRatio none
  // + tratto non scalato → il tratteggio va misurato in px reali)
  const measureLens = useCallback(() => {
    const svg = filiSvgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const sx = r.width / 1440;
    const sy = r.height / 900;
    filiRefs.current.forEach((el) => {
      if (!el) return;
      const L = el.getTotalLength();
      let sum = 0;
      let prev = el.getPointAtLength(0);
      for (let i = 1; i <= 120; i++) {
        const p = el.getPointAtLength((L * i) / 120);
        sum += Math.hypot((p.x - prev.x) * sx, (p.y - prev.y) * sy);
        prev = p;
      }
      lensRef.current.set(el, Math.ceil(sum) + 4);
    });
  }, []);

  // Prima del primo paint: fili allineati e "non disegnati" (niente flash)
  useLayoutEffect(() => {
    alignFili();
    measureLens();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.set(filiRefs.current.filter(Boolean), { strokeDasharray: "0 100000", strokeDashoffset: 0 });
  }, [alignFili, measureLens]);

  useEffect(() => {
    const sec = sectionRef.current;
    if (!sec || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      alignFili();
      measureLens();
    });
    ro.observe(sec);
    return () => ro.disconnect();
  }, [alignFili, measureLens]);

  // ── Filo vivo: il puntatore scosta i punti di controllo del fascio ──
  // Un solo tick GSAP, attivo solo mentre il mouse si muove o i fili
  // stanno tornando a riposo; fuori vista o su touch non gira nulla.
  useEffect(() => {
    const svg = filiSvgRef.current;
    const els = filiRefs.current;
    if (!svg || !live) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const R = 230; // raggio d'influenza (unità del viewBox)
    const PUSH = 80; // spostamento massimo
    const pts = alignedRef.current;
    const offs = STRANDS.map((f) => new Float32Array(f.pts.length * 2));
    const mouse = { x: -9999, y: -9999, in: false };
    let rect = svg.getBoundingClientRect();
    let running = false;

    const tick = () => {
      let moving = false;
      STRANDS.forEach((f, si) => {
        const o = offs[si];
        pts[si].forEach(([x, y], i) => {
          let tx = 0;
          let ty = 0;
          if (mouse.in) {
            const dx = x - mouse.x;
            const dy = y - mouse.y;
            const dist = Math.hypot(dx, dy) || 1;
            const fall = Math.exp(-((dist / R) ** 2));
            tx = (dx / dist) * PUSH * f.k * fall;
            ty = (dy / dist) * PUSH * f.k * fall;
          }
          const j = i * 2;
          o[j] += (tx - o[j]) * 0.09;
          o[j + 1] += (ty - o[j + 1]) * 0.09;
          if (Math.abs(tx - o[j]) > 0.05 || Math.abs(ty - o[j + 1]) > 0.05) moving = true;
        });
        const el = els[si];
        if (el) el.setAttribute("d", toD(pts[si], o));
      });
      if (!moving) {
        gsap.ticker.remove(tick);
        running = false;
      }
    };
    const wake = () => {
      if (!running) {
        running = true;
        gsap.ticker.add(tick);
      }
    };
    const onMove = (e) => {
      const x = ((e.clientX - rect.left) / rect.width) * 1440;
      const y = ((e.clientY - rect.top) / rect.height) * 900;
      mouse.in = x > -100 && x < 1540 && y > -100 && y < 1000;
      mouse.x = x;
      mouse.y = y;
      wake();
    };
    const onLeave = () => {
      mouse.in = false;
      wake();
    };
    const onResize = () => (rect = svg.getBoundingClientRect());
    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
      gsap.ticker.remove(tick);
      // a riposo quando si esce dalla sezione
      pts.forEach((p, si) => els[si]?.setAttribute("d", toD(p, new Float32Array(p.length * 2))));
    };
  }, [live]);
  const nodeRefs = useRef([]);
  const radarRef2 = useRef(null);

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

    if (reduced) {
      Object.assign(v, asVars(RADAR_START));
      render();
      return;
    }

    // ── Radar: nasce dal CENTRO ESATTO e si espande ai valori reali ──
    // I 6 vertici e i 6 pallini partono tutti da (cx, cy) e viaggiano
    // insieme lungo i loro assi (stessi valori → sempre allineati).
    // Espansione e contrazione sono tween sui valori, interrompibili e
    // ripresi dal punto in cui si trovano: nessuno scatto, in entrambi i
    // versi. A espansione finita parte il loop dell'indecisione.
    const nodes = nodeRefs.current.filter(Boolean);
    const radarG = root.querySelector("#radar-shape");
    const ZERO = asVars([0, 0, 0, 0, 0, 0]);
    let morph = null;
    let radarTw = [];
    const stopRadar = () => {
      morph?.kill();
      morph = null;
      radarTw.forEach((t) => t.kill());
      radarTw = [];
    };
    const startMorph = () => {
      morph?.kill();
      morph = gsap.timeline({ repeat: -1, yoyo: true });
      RADAR_STATES.forEach((st) => {
        morph.to(v, { ...asVars(st), duration: 3.5, ease: "sine.inOut", onUpdate: render });
      });
    };
    const radar = {
      expand(delay = 0) {
        stopRadar();
        radarTw = [
          gsap.to(v, {
            ...asVars(RADAR_START),
            duration: 1.25,
            delay,
            ease: "power3.out",
            onUpdate: render,
            onComplete: startMorph,
          }),
          gsap.to(radarG, { opacity: 1, duration: 0.9, delay, ease: "power2.out" }),
          gsap.to(nodes, { opacity: 1, duration: 0.5, delay: delay + 0.1, stagger: 0.04, ease: "power1.out" }),
        ];
      },
      collapse() {
        stopRadar();
        radarTw = [
          gsap.to(v, { ...ZERO, duration: 0.6, ease: "power2.in", onUpdate: render }),
          gsap.to(radarG, { opacity: 0, duration: 0.6, ease: "power2.in" }),
          gsap.to(nodes, { opacity: 0, duration: 0.45, ease: "power1.in" }),
        ];
      },
      reset() {
        stopRadar();
        Object.assign(v, ZERO);
        render();
        gsap.set(radarG, { opacity: 0 });
        gsap.set(nodes, { opacity: 0 });
      },
      pause() {
        morph?.pause();
      },
      resume() {
        if (morph) morph.resume();
      },
    };
    radar.reset();
    radarRef2.current = radar;

    // Ingresso (automatico, niente scrub):
    // A. il fascio di fili scivola verso destra (+ esagono guida)
    // B. quando i fili raggiungono il radar, l'area si accende e "respira"
    // C. i nodi sbocciano, poi le etichette; infine parte il loop.
    const tl = gsap.timeline({ paused: true });
    const sec = sectionRef.current;
    const main = sec?.querySelectorAll("#filo-main, #filo-halo");
    const subs = sec?.querySelectorAll("#filo-sub-1, #filo-sub-2, #filo-accent");
    // Il fascio si disegna da sinistra a destra (tratteggio sulla lunghezza
    // a schermo: niente code staccate su schermi larghi o stretti). A disegno
    // finito il tratteggio si toglie, così il filo può deformarsi col mouse.
    const undash = (t) => gsap.set(t, { strokeDasharray: "none" });
    const len = (i, el) => lensRef.current.get(el) || 3000;
    const dash = (i, el) => `${len(i, el)} ${len(i, el)}`;
    if (main?.length) {
      tl.fromTo(
        main,
        { strokeDasharray: dash, strokeDashoffset: len },
        {
          strokeDasharray: dash,
          strokeDashoffset: 0,
          duration: 1.6,
          ease: "power2.out",
          onComplete: () => undash(main),
        },
        0
      );
    }
    if (subs?.length) {
      tl.fromTo(
        subs,
        { strokeDasharray: dash, strokeDashoffset: len },
        {
          strokeDasharray: dash,
          strokeDashoffset: 0,
          duration: 1.6,
          stagger: 0.12,
          ease: "power2.out",
          onComplete: () => undash(subs),
        },
        0.1
      );
    }
    // il nodo d'oro sul centro del radar: si accende quando il filo arriva
    tl.fromTo(
      q(".s2o-hex__anchor"),
      { opacity: 0, scale: 0.2, svgOrigin: `${CX} ${CY}` },
      { opacity: 1, scale: 1, svgOrigin: `${CX} ${CY}`, duration: 0.55, ease: "back.out(2.2)" },
      0.55
    );
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
        q(".s2o-hex__label-in"),
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, stagger: 0.06, duration: 0.45, ease: "power2.out" },
        1.3
      );
    hexTl.current = tl;
    // reset istantaneo (solo a sezione fuori schermo)
    resetRef.current = () => {
      radar.reset();
      tl.pause(0);
      needsRestart.current = true;
    };
    return () => {
      tl.kill();
      stopRadar();
      hexTl.current = null;
      radarRef2.current = null;
      resetRef.current = null;
    };
  }, []);

  useEffect(() => {
    const tl = hexTl.current;
    const radar = radarRef2.current;
    if (!tl) return;
    if (live) {
      if (needsRestart.current) {
        // ingresso pulito: parte da 0 (rimisura: il viewport può cambiare)
        needsRestart.current = false;
        alignFili();
        measureLens();
        tl.invalidate().timeScale(1).restart();
        radar?.expand(0.75); // quando i fili raggiungono il radar
      } else {
        if (tl.progress() < 1) tl.timeScale(1).play(); // rientro rapido: prosegue
        radar?.expand(0); // riparte dal punto in cui si trova, verso i valori
      }
    } else {
      // in uscita il radar si ritrae verso il centro (l'inverso esatto
      // dell'espansione); il reset completo avviene a sezione fuori schermo
      radar?.collapse();
    }
  }, [live, alignFili, measureLens]);

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
                <radialGradient id="s2o-anchor-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0" stopColor="#fff6d6" stopOpacity="0.95" />
                  <stop offset="0.35" stopColor="#e2c974" stopOpacity="0.55" />
                  <stop offset="1" stopColor="#d4af37" stopOpacity="0" />
                </radialGradient>
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
              {/* area dinamica delle priorità (radar) */}
              <g id="radar-shape" className="s2o-hex__radar-g">
                {/* alone: tratto largo e tenue al posto del drop-shadow */}
                <polygon ref={radarHaloRef} className="s2o-hex__radar-halo" points={ringPoints(0)} />
                <polygon ref={radarRef} className="s2o-hex__radar" points={ringPoints(0)} />
              </g>
              {/* nodo d'ancoraggio: il filo d'oro si aggancia qui */}
              <g className="s2o-hex__anchor">
                <circle className="s2o-hex__anchor-glow" cx="200" cy="200" r="34" fill="url(#s2o-anchor-glow)" />
                <circle className="s2o-hex__core" cx="200" cy="200" r="6" />
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
        ref={filiSvgRef}
        className="s2o-fili"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          {/* pieno fino al nodo sul radar, poi sfuma al ~28% verso l'angolo */}
          {FILI_GRADS.map((g, i) => (
            <linearGradient
              key={g.id}
              id={`s2o-fade-${g.id}`}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2={FADE_X2}
              y2="0"
            >
              <stop offset="0" stopColor={g.color} stopOpacity={g.a[0]} />
              <stop
                ref={(el) => (fadeStopRefs.current[i] = el)}
                offset="0.66"
                stopColor={g.color}
                stopOpacity={g.a[1]}
              />
              <stop offset="1" stopColor={g.color} stopOpacity={g.a[2]} />
            </linearGradient>
          ))}
        </defs>
        {STRANDS.map((f, i) => (
          <path
            key={f.id}
            ref={(el) => (filiRefs.current[i] = el)}
            id={`filo-${f.id}`}
            className={`s2o-fili__path s2o-fili__path--${f.id}`}
            d={f.d}
          />
        ))}
      </svg>
    </section>
  );
}

export { S2Origine };
