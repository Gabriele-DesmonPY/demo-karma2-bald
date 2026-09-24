import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./S3Realta.css";

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════════════
   SEZIONE 03 — LA REALTÀ NON È FRAMMENTATA
   Stessa grammatica editoriale della Sezione 02 (Cormorant + Manrope,
   inchiostro navy, oro leggibile), su un mesh gradient che parte dal
   panna della 02 e scende nel Deep Navy #0A1128.

   FASE A — il filo dorato scende a zig-zag (SX → DX → SX …): a ogni
   cambio di direzione un nodo luminoso aggancia la voce corrispondente.
   FASE B — blocco a tutta larghezza con fondo fotografico dark luxury
   (solo lì): la trama d'ordine, "Il contesto dà significato alla scelta".

   Performance (60fps):
   - il filo si "srotola" con una tendina a DUE transform opposte
     (contenitore giù / contenuto su): niente stroke-dashoffset, niente
     repaint dell'SVG a ogni frame, tutto sul compositor;
   - TUTTE le animazioni sono in scrub (bidirezionali): scendendo si
     compone, salendo si riavvolge; le schede usano autoAlpha + x/y;
   - l'effetto vetro è reso con velatura + filetto + luce interna:
     il fondo dietro è un gradiente liscio, quindi un backdrop-filter
     darebbe lo stesso risultato visivo costando un blur a ogni frame;
   - la geometria del filo si ricalcola solo su resize (ResizeObserver).
   ═══════════════════════════════════════════════════════════════ */

// Le 6 voci, disposte in modo "spettinato": ogni scheda ha la sua
// rotazione, il suo scarto orizzontale (dal bordo esterno della colonna),
// la sua larghezza e il suo aggancio verticale — mai due parallele.
const VOICES = [
  { text: "Il mercato si sta muovendo. Dobbiamo capire se seguirlo.", rot: -1.6, off: "2%", w: "86%", lift: "0px" },
  { text: "I numeri dicono che questa strada potrebbe funzionare.", rot: 2.1, off: "9%", w: "78%", lift: "-40px" },
  { text: "Dobbiamo essere compliant, ma senza bloccare tutto.", rot: 1.2, off: "14%", w: "74%", lift: "-10px" },
  { text: "Il team non può assorbire un altro cambiamento così, dall’oggi al domani.", rot: -2.2, off: "0%", w: "92%", lift: "-64px" },
  { text: "Questa tecnologia potrebbe farci fare un salto.", rot: -0.9, off: "7%", w: "72%", lift: "-6px" },
  { text: "Il cliente ormai si aspetta qualcosa di diverso.", rot: 1.7, off: "16%", w: "76%", lift: "-52px" },
];

const ORDER_RELATIONS = [
  ["Una tecnologia", "incontra processi, persone, competenze e responsabilità."],
  ["Una crescita", "incontra la capacità dell’organizzazione di sostenerla."],
  ["Una nuova regola", "incontra comportamenti, strumenti e relazioni."],
  ["Una riorganizzazione", "incontra equilibri costruiti nel tempo."],
  ["Una nuova opportunità", "incontra priorità, risorse e visione."],
];

// 3B · costellazione: scarto verticale di ogni nodo (px) — alto, basso,
// centro-alto, basso, centro: una rotta viva, non una riga
const CONSTELLATION_Y = [-80, 96, -48, 80, 0];

const MOBILE_Q = "(max-width: 900px)";
// margine verticale del filo della costellazione (i nodi salgono/scendono)
const WIRE_PAD = 220;

// Il mesh della 3A va dal panna al navy: ogni frase sceglie il suo
// inchiostro leggendo la luminanza del fondo nel punto in cui si trova
// (stessi stop del linear-gradient a 172° in S3Realta.css).
const MESH_STOPS = [
  [0, "#f8f5f0"], [0.09, "#f8f5f0"], [0.17, "#f0e8da"], [0.27, "#dccaa9"],
  [0.35, "#b09a7c"], [0.42, "#6a6570"], [0.5, "#2e3656"], [0.57, "#151d3a"],
  [0.64, "#0a1128"], [1, "#0a1128"],
];
const lin = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
};
function meshLum(x, y, w, h) {
  const a = (172 * Math.PI) / 180;
  const sx = Math.sin(a);
  const sy = -Math.cos(a);
  const len = Math.abs(w * sx) + Math.abs(h * sy);
  const t = Math.min(1, Math.max(0, ((x - w / 2) * sx + (y - h / 2) * sy) / len + 0.5));
  let i = 0;
  while (i < MESH_STOPS.length - 2 && t > MESH_STOPS[i + 1][0]) i++;
  const [t0, c0] = MESH_STOPS[i];
  const [t1, c1] = MESH_STOPS[i + 1];
  const k = t1 > t0 ? (t - t0) / (t1 - t0) : 0;
  return lum(c0) * (1 - k) + lum(c1) * k;
}
// contrasto migliore tra inchiostro navy e avorio
const INK_L = lum("#0d1826");
const IVORY_L = lum("#fbf4e2");
const toneFor = (L) => ((L + 0.05) / (INK_L + 0.05) >= (IVORY_L + 0.05) / (L + 0.05) ? "dark" : "light");

// Costruisce il tracciato del filo a partire dai nodi (coordinate px
// relative al campo). Desktop: curve a tangente orizzontale, ogni tratto
// esce dal nodo verso la colonna opposta → zig-zag morbido.
// Mobile: il filo scorre nel margine sinistro con un'ondulazione lieve.
function buildPath(start, nodes, end, mobile) {
  if (!nodes.length) return "";
  let d = `M${start.x},${start.y}`;
  const pts = [...nodes, end];
  let prev = start;

  pts.forEach((p, i) => {
    const dy = p.y - prev.y;
    if (mobile) {
      const bow = (i % 2 === 0 ? 1 : -1) * 16;
      d += ` C${prev.x + bow},${prev.y + dy * 0.5} ${p.x + bow},${p.y - dy * 0.5} ${p.x},${p.y}`;
    } else if (i === 0) {
      // dall'alto al primo nodo (scheda SX): entra da destra
      const k = Math.max(60, Math.abs(p.x - prev.x) * 0.9);
      d += ` C${prev.x},${prev.y + dy * 0.55} ${p.x + k},${p.y} ${p.x},${p.y}`;
    } else if (i === pts.length - 1) {
      // dall'ultimo nodo (scheda DX) al centro in basso: esce verso sinistra
      const k = Math.max(60, Math.abs(p.x - prev.x) * 0.9);
      d += ` C${prev.x - k},${prev.y} ${p.x},${p.y - dy * 0.55} ${p.x},${p.y}`;
    } else {
      // nodo → nodo: esce verso la colonna opposta, entra dal lato giusto
      const dir = p.x > prev.x ? 1 : -1;
      const k = Math.max(70, Math.abs(p.x - prev.x) * 0.6);   // S morbida, senza anse
      d += ` C${prev.x + dir * k},${prev.y} ${p.x - dir * k},${p.y} ${p.x},${p.y}`;
    }
    prev = p;
  });
  return d;
}

export default function S3Realta() {
  const sectionRef = useRef(null);
  const fieldRef = useRef(null);
  const cardRefs = useRef([]);
  const [geo, setGeo] = useState({ w: 0, h: 0, d: "", nodes: [], tones: [] });
  const railRef = useRef(null);
  const [wire, setWire] = useState({ w: 0, h: 0, d: "", end: null });

  // ── 3B · il filo della costellazione: nasce dai punti reali ──
  // Parte dal bordo sinistro della rotta, passa per il punto d'oro di ogni
  // incontro e si CHIUDE sul punto finale di "Ogni scelta entra nella vita
  // dell'impresa.": corre sotto l'ultima riga e si ferma dopo il punto.
  const measureWire = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const rr = rail.getBoundingClientRect();
    const PAD = WIRE_PAD;
    // punti d'oro: offset (immuni alle transform di GSAP sui nodi) + lo
    // scarto verticale CSS dello slot (alto/basso della costellazione)
    const dots = [...rail.querySelectorAll(".s3c-slot")]
      .map((slot) => {
        const dot = slot.querySelector(".s3c-node__dot");
        if (!dot) return null;
        let x = 0;
        let y = 0;
        for (let el = dot; el && el !== rail; el = el.offsetParent) {
          x += el.offsetLeft;
          y += el.offsetTop;
        }
        const tf = getComputedStyle(slot).transform;
        const ty = tf && tf !== "none" ? new DOMMatrixReadOnly(tf).m42 : 0;
        return { x: x + dot.offsetWidth / 2, y: y + dot.offsetHeight / 2 + ty + PAD };
      })
      .filter(Boolean);
    const epi = rail.querySelector(".s3c-epilogue");
    if (!dots.length || !epi) return;
    // ultima riga della frase: rettangoli delle righe di testo
    const range = document.createRange();
    range.selectNodeContents(epi);
    const rects = [...range.getClientRects()].filter((r) => r.width > 2);
    const last = rects[rects.length - 1] || epi.getBoundingClientRect();
    const lineLeft = Math.min(...rects.filter((r) => Math.abs(r.bottom - last.bottom) < 4).map((r) => r.left));
    const baseY = last.bottom - rr.top + PAD - last.height * 0.12;
    const ul = { x: (Number.isFinite(lineLeft) ? lineLeft : last.left) - rr.left, y: baseY };
    const end = { x: last.right - rr.left + 4, y: baseY };

    // Entra da sinistra in orizzontale sul primo punto; da ogni punto il
    // filo scende sotto la frase (così non ne taglia il testo) e risale
    // ad agganciare il punto successivo arrivando da sinistra.
    const pts = [{ x: 0, y: dots[0].y }, ...dots, { x: ul.x - 40, y: baseY }];
    const DIP = 190;
    const f = (n) => n.toFixed(1);
    let d = `M${f(pts[0].x)},${f(pts[0].y)}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const span = b.x - a.x;
      const c1 = i === 1 ? { x: a.x + span * 0.5, y: a.y } : { x: a.x - 4, y: a.y + DIP };
      const c2 = { x: b.x - span * 0.45, y: b.y };
      d += ` C${f(c1.x)},${f(c1.y)} ${f(c2.x)},${f(c2.y)} ${f(b.x)},${f(b.y)}`;
    }
    // sotto l'ultima riga, fino al punto finale
    d += ` L${end.x.toFixed(1)},${end.y.toFixed(1)}`;
    setWire({ w: rail.scrollWidth, h: rail.offsetHeight + PAD * 2, d, end });
  }, []);

  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    // misura a rotta ferma (le transform di GSAP spostano tutto insieme:
    // lavoriamo in coordinate relative alla rotta, quindi restano valide)
    measureWire();
    const ro = new ResizeObserver(() => measureWire());
    ro.observe(rail);
    document.fonts?.ready?.then(() => measureWire());
    return () => ro.disconnect();
  }, [measureWire]);

  // ── Geometria del filo: misura le schede e piazza i nodi ──
  const measure = useCallback(() => {
    const field = fieldRef.current;
    if (!field) return;
    const mobile = window.matchMedia(MOBILE_Q).matches;
    const w = field.offsetWidth;
    const h = field.offsetHeight;
    // offsetTop/Left: immuni alle transform d'ingresso delle schede
    const nodes = cardRefs.current.filter(Boolean).map((card, i) => {
      // somma gli offset fino al campo (la lista è a sua volta posizionata)
      let top = 0;
      let left = 0;
      for (let el = card; el && el !== field; el = el.offsetParent) {
        top += el.offsetTop;
        left += el.offsetLeft;
      }
      const cw = card.offsetWidth;
      const ch = card.offsetHeight;
      if (mobile) return { x: 14, y: top + 30, cy: top + ch / 2, cx: left + cw / 2 };
      // Testo puro: il punto d'oro sta appena fuori dal bordo della frase
      // rivolto verso il filo (SX → a destra, DX → a sinistra)
      const GAP = 26;
      const x = i % 2 === 0 ? left + cw + GAP : left - GAP;
      return { x, y: top + ch / 2, cy: top + ch / 2, cx: left + cw / 2 };
    });
    // inchiostro di ogni frase in base al fondo (coordinate nella 3A)
    const a3 = field.closest(".s3a");
    let fx = 0;
    let fy = 0;
    for (let el = field; el && el !== a3; el = el.offsetParent) {
      fx += el.offsetLeft;
      fy += el.offsetTop;
    }
    const tones = nodes.map((n) =>
      a3 ? toneFor(meshLum(fx + n.cx, fy + n.cy, a3.offsetWidth, a3.offsetHeight)) : "light"
    );
    const start = mobile ? { x: 14, y: 0 } : { x: w / 2, y: 0 };
    const end = mobile ? { x: 14, y: h } : { x: w / 2, y: h };
    setGeo({ w, h, d: buildPath(start, nodes, end, mobile), nodes, tones });
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    if (fieldRef.current) ro.observe(fieldRef.current);
    // i font web cambiano le altezze delle schede: rimisura quando pronti
    document.fonts?.ready?.then(() => measure());
    return () => ro.disconnect();
  }, [measure]);

  // ── Animazioni scroll-driven, BIDIREZIONALI (GSAP ScrollTrigger + scrub) ──
  // Tutto è legato allo scroll con scrub: scendendo si compone l'ordine,
  // salendo si riavvolge esattamente. Nessun "once", nessun play() one-shot.
  // Solo transform (x/y/scale/rotation) e opacità → 60fps in entrambi i versi.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !geo.d) return;
    const scroller = section.closest(".sandbox-slide") || window;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(section);

      if (reduced) {
        gsap.set(q(".s3-reveal, .s3-card, .s3-node"), { autoAlpha: 1, y: 0, x: 0, scale: 1 });
        gsap.set(q(".s3-thread__wipe"), { y: 0, yPercent: 0 });
        gsap.set(q(".s3-thread__svg"), { y: 0, yPercent: 0 });
        gsap.set(q(".s3c-node"), { opacity: 1, scale: 1 });
        gsap.set(q(".s3c-wire__wipe, .s3c-wire__svg"), { x: 0, xPercent: 0 });
        gsap.set(q(".s3c-wire__end"), { autoAlpha: 1, scale: 1 });
        return;
      }

      // Titoli, sottotitoli, chiusure: salgono e si dissolvono con lo scroll
      q(".s3-reveal").forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 26 },
          {
            autoAlpha: 1,
            y: 0,
            ease: "power2.out",
            scrollTrigger: { trigger: el, scroller, start: "top 94%", end: "top 72%", scrub: 1 },
          }
        );
      });

      // ── 3A · Il filo: si srotola scendendo, si riavvolge salendo ──
      // Tendina a due transform opposte (contenitore / SVG): scrub 1.
      const threadST = {
        trigger: fieldRef.current,
        scroller,
        start: "top 70%",
        end: "bottom 62%",
        scrub: 1,
      };
      const wipeTween = gsap.fromTo(
        q(".s3-thread__wipe"),
        { y: 0, yPercent: -100 }, // y:0 azzera il translate iniziale del CSS
        { yPercent: 0, ease: "none", scrollTrigger: threadST }
      );
      gsap.fromTo(
        q(".s3-thread__svg"),
        { y: 0, yPercent: 100 },
        { yPercent: 0, ease: "none", scrollTrigger: { ...threadST } }
      );

      // ── 3A · Nodi e schede: appaiono nel punto esatto in cui il filo li
      // raggiunge, e svaniscono quando il filo si riavvolge oltre di loro.
      // La finestra di scroll è calcolata dalla stessa corsa del filo.
      const tst = wipeTween.scrollTrigger;
      const nodes = q(".s3-node");
      cardRefs.current.forEach((card, i) => {
        if (!card || !geo.nodes[i]) return;
        const frac = geo.nodes[i].y / (geo.h || 1);
        const reach = () => tst.start + frac * (tst.end - tst.start);

        gsap.fromTo(
          nodes[i],
          { autoAlpha: 0, scale: 0.2 },
          {
            autoAlpha: 1,
            scale: 1,
            ease: "back.out(2)",
            scrollTrigger: {
              trigger: fieldRef.current,
              scroller,
              start: () => reach() - 30,
              end: () => reach() + 50,
              scrub: 1,
            },
          }
        );
        gsap.fromTo(
          card,
          { autoAlpha: 0, y: 34, x: i % 2 === 0 ? -18 : 18 },
          {
            autoAlpha: 1,
            y: 0,
            x: 0,
            ease: "power2.out",
            scrollTrigger: {
              trigger: fieldRef.current,
              scroller,
              start: () => reach() - 10,
              end: () => reach() + 170,
              scrub: 1,
            },
          }
        );
      });

      // ── 3B · Costellazione del contesto: scroll orizzontale "appeso" ──
      // Il blocco resta fermo (sticky = pin) mentre lo scroll verticale fa
      // scorrere in orizzontale la rotta dei 5 nodi e traccia il filo.
      const pinEl = q(".s3c")[0];
      const track = railRef.current;
      if (pinEl && track) {
        const tlC = gsap.timeline({
          defaults: { ease: "none", duration: 1 },
          scrollTrigger: {
            trigger: pinEl,
            scroller,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
        // A. il filo d'oro si traccia (tendina a due transform: niente
        //    stroke-dashoffset ridisegnato a ogni frame)
        tlC.fromTo(q(".s3c-wire__wipe"), { x: 0, xPercent: -100 }, { xPercent: 0 }, 0); // x:0 azzera il translate del CSS
        tlC.fromTo(q(".s3c-wire__svg"), { x: 0, xPercent: 100 }, { xPercent: 0 }, 0);
        // B. la rotta trasla in orizzontale
        tlC.fromTo(
          track,
          { x: 0 },
          // la corsa si ferma con l'ultima frase ben inquadrata (e il filo
          // che si chiude su di lei), su ogni larghezza di schermo
          {
            x: () => {
              const epi = track.querySelector(".s3c-epilogue");
              if (!epi) return -Math.max(0, track.scrollWidth - window.innerWidth + 200);
              let cx = epi.offsetWidth / 2;
              for (let el = epi; el && el !== track; el = el.offsetParent) cx += el.offsetLeft;
              return -Math.max(0, cx - window.innerWidth * 0.55);
            },
          },
          0
        );
        // il filo si chiude: il punto finale si accende sull'ultima frase
        tlC.fromTo(q(".s3c-wire__end"), { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.06 }, 0.9);
        // C. ogni nodo si accende quando arriva verso il centro
        q(".s3c-node").forEach((node) => {
          gsap.fromTo(
            node,
            { scale: 0.8, opacity: 0.3 },
            {
              scale: 1,
              opacity: 1,
              ease: "none",
              scrollTrigger: {
                trigger: node,
                scroller,
                containerAnimation: tlC,
                start: "left 80%",
                end: "left 40%",
                scrub: true,
              },
            }
          );
        });
      }
    }, section);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [geo]);

  return (
    <section ref={sectionRef} className="s3" id="frammentazione" data-n="3" aria-labelledby="s3-title">
      {/* ═══ FASE A (3A) — mesh gradient panna → navy, solo qui ═══ */}
      <div className="s3a">
      <div className="s3__wrap">
        <header className="s3__head">
          <p className="s3__tag s3-reveal">
            <span>La complessità</span>
            <span className="s3__tag-sep" aria-hidden="true">·</span>
            <span>Il punto di incontro</span>
          </p>
          <h2 id="s3-title" className="s3__title s3-reveal">
            La realtà <em>non è frammentata</em>
          </h2>
          <p className="s3__lede s3-reveal">
            Quando hai raccolto tutte le risposte e devi ancora scegliere.
          </p>
        </header>

        {/* Campo del filo: SVG del filo + nodi + le 6 schede */}
        <div ref={fieldRef} className="s3-field">
          <div className="s3-thread" aria-hidden="true">
            <div className="s3-thread__wipe">
              <svg
                className="s3-thread__svg"
                width={geo.w}
                height={geo.h}
                viewBox={`0 0 ${geo.w || 1} ${geo.h || 1}`}
              >
                <defs>
                  {/* Oro metallico: l'alternanza di bande chiare e calde lungo
                      il tracciato imita i riflessi di un filo vero */}
                  <linearGradient id="s3-gold" x1="0" y1="0" x2="0.18" y2="1">
                    <stop offset="0" stopColor="#B89343" />
                    <stop offset="0.1" stopColor="#E2C974" />
                    <stop offset="0.16" stopColor="#F6E7B4" />
                    <stop offset="0.24" stopColor="#B89343" />
                    <stop offset="0.38" stopColor="#E2C974" />
                    <stop offset="0.45" stopColor="#F4E3AA" />
                    <stop offset="0.54" stopColor="#B89343" />
                    <stop offset="0.68" stopColor="#E2C974" />
                    <stop offset="0.75" stopColor="#F6E7B4" />
                    <stop offset="0.84" stopColor="#B89343" />
                    <stop offset="1" stopColor="#E2C974" />
                  </linearGradient>
                </defs>
                <path d={geo.d} className="s3-thread__line" />
              </svg>
            </div>
          </div>

          {/* Nodi luminosi: posizione statica (left/top, mai animata),
              ingresso solo in scale/opacity */}
          {geo.nodes.map((n, i) => (
            <span
              key={i}
              className="s3-node"
              style={{ left: `${n.x}px`, top: `${n.y}px` }}
              aria-hidden="true"
            >
              <i className="s3-node__dot" />
            </span>
          ))}

          <ol className="s3-cards">
            {VOICES.map((v, i) => (
              <li
                key={i}
                ref={(el) => (cardRefs.current[i] = el)}
                className={`s3-card ${i % 2 === 0 ? "s3-card--sx" : "s3-card--dx"} s3-card--${geo.tones[i] || "light"}`}
                style={{ "--row": i + 1, "--off": v.off, "--w": v.w, "--lift": v.lift }}
              >
                {/* testo puro, senza riquadro: fluttua sul fondo */}
                <div className="s3-card__paper">
                  <span className="s3-card__num" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="s3-card__text">“{v.text}”</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Chiusura della Fase A */}
        <div className="s3__close">
          <p className="s3__axiom s3-reveal">
            Ogni voce vede qualcosa.
            <br />
            Ogni scelta muove qualcosa.
          </p>
          <p className="s3__thesis s3-reveal">
            La realtà comincia proprio dove queste prospettive si incontrano.
          </p>
        </div>
      </div>
      </div>

      {/* ═══ FASE B (3B) — "Sinfonia liquida del contesto" ═══
          Traccia alta (durata dello scroll) con un palco appeso: il fondo
          dark luxury, il titolo fisso in alto a sinistra, il filo d'oro e la
          costellazione dei 5 incontri che scorre in orizzontale. */}
      <div className="s3b s3c">
        <div className="s3c__stage">
          <div className="s3b__bg" aria-hidden="true" />

          <header className="s3c__head">
            <p className="s3__tag s3__tag--light s3c__tag">
              <span>03</span>
              <span className="s3__tag-sep" aria-hidden="true">·</span>
              <span>Il contesto</span>
            </p>
            <h2 className="s3c__title">
              Il contesto dà significato <em>alla scelta</em>
            </h2>
          </header>

          {/* la costellazione dei 5 incontri: la rotta scorre in orizzontale
              e porta con sé il suo filo d'oro */}
          <div className="s3c-rail" ref={railRef}>
            <div className="s3c-wire" aria-hidden="true" style={{ top: -WIRE_PAD, bottom: -WIRE_PAD }}>
              <div className="s3c-wire__wipe">
                <svg
                  className="s3c-wire__svg"
                  width={wire.w || 1}
                  height={wire.h || 1}
                  viewBox={`0 0 ${wire.w || 1} ${wire.h || 1}`}
                >
                  <defs>
                    <linearGradient id="s3c-gold" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={wire.w || 1} y2="0">
                      <stop offset="0" stopColor="#B89343" />
                      <stop offset="0.25" stopColor="#E2C974" />
                      <stop offset="0.5" stopColor="#B89343" />
                      <stop offset="0.75" stopColor="#E2C974" />
                      <stop offset="1" stopColor="#F3E5AB" />
                    </linearGradient>
                  </defs>
                  {/* alone tenue + filo (niente filtro su un livello così largo) */}
                  <path className="s3c-wire__halo" d={wire.d} />
                  <path className="s3c-wire__path" d={wire.d} />
                </svg>
              </div>
            </div>
            {wire.end && (
              <span
                className="s3c-wire__end"
                aria-hidden="true"
                style={{ left: wire.end.x, top: wire.end.y - WIRE_PAD }}
              />
            )}
          <ol className="s3c-track">
            {ORDER_RELATIONS.map(([concept, connection], i) => (
              <li className="s3c-slot" key={concept} style={{ "--dy": `${CONSTELLATION_Y[i]}px` }}>
                <div className="s3c-node">
                  <h3 className="s3c-node__title">
                    <span className="s3c-node__dot" aria-hidden="true" />
                    {concept}
                  </h3>
                  <p className="s3c-node__text">{connection}</p>
                </div>
              </li>
            ))}
            <li className="s3c-slot s3c-slot--end">
              <p className="s3c-epilogue">Ogni scelta entra nella vita dell’impresa.</p>
            </li>
          </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

export { S3Realta };
