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
   - le schede entrano con autoAlpha + y (niente blur animato);
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

const MOBILE_Q = "(max-width: 900px)";

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
  const [geo, setGeo] = useState({ w: 0, h: 0, d: "", nodes: [] });

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
      if (mobile) return { x: 14, y: top + 34 };
      // SX: nodo sul bordo interno destro · DX: sul bordo interno sinistro,
      // riportato sulla scheda RUOTATA (la carta gira attorno al centro)
      const rad = ((VOICES[i]?.rot || 0) * Math.PI) / 180;
      const cx = left + cw / 2;
      const cy = top + ch / 2;
      const hx = (i % 2 === 0 ? 1 : -1) * (cw / 2 - 2);
      return { x: cx + hx * Math.cos(rad), y: cy + hx * Math.sin(rad) };
    });
    const start = mobile ? { x: 14, y: 0 } : { x: w / 2, y: 0 };
    const end = mobile ? { x: 14, y: h } : { x: w / 2, y: h };
    setGeo({ w, h, d: buildPath(start, nodes, end, mobile), nodes });
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    if (fieldRef.current) ro.observe(fieldRef.current);
    // i font web cambiano le altezze delle schede: rimisura quando pronti
    document.fonts?.ready?.then(() => measure());
    return () => ro.disconnect();
  }, [measure]);

  // ── Animazioni scroll-driven (GSAP ScrollTrigger sullo scroller della slide) ──
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !geo.d) return;
    const scroller = section.closest(".sandbox-slide") || window;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(section);

      if (reduced) {
        gsap.set(q(".s3-reveal, .s3-card, .s3-node"), { autoAlpha: 1, y: 0, scale: 1 });
        gsap.set(q(".s3-thread__wipe"), { y: 0, yPercent: 0 });
        gsap.set(q(".s3-thread__svg"), { y: 0, yPercent: 0 });
        return;
      }

      // Header e chiusure: dissolvenza + salita, una volta sola
      q(".s3-reveal").forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 26 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1.1,
            ease: "expo.out",
            scrollTrigger: { trigger: el, scroller, start: "top 88%", once: true },
          }
        );
      });

      // Il filo si srotola: tendina a due transform opposte, legata allo scroll
      gsap.fromTo(
        q(".s3-thread__wipe"),
        { y: 0, yPercent: -100 },  // y:0 azzera il translate iniziale del CSS
        {
          yPercent: 0,
          ease: "none",
          scrollTrigger: {
            trigger: fieldRef.current,
            scroller,
            start: "top 70%",
            end: "bottom 62%",
            scrub: 0.6,
          },
        }
      );
      gsap.fromTo(
        q(".s3-thread__svg"),
        { y: 0, yPercent: 100 },
        {
          yPercent: 0,
          ease: "none",
          scrollTrigger: {
            trigger: fieldRef.current,
            scroller,
            start: "top 70%",
            end: "bottom 62%",
            scrub: 0.6,
          },
        }
      );

      // Schede e nodi: entrano quando il filo li raggiunge
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const node = q(".s3-node")[i];
        const tl = gsap.timeline({
          scrollTrigger: { trigger: card, scroller, start: "top 72%", once: true },
        });
        tl.fromTo(
          node,
          { autoAlpha: 0, scale: 0.2 },
          { autoAlpha: 1, scale: 1, duration: 0.7, ease: "back.out(2.2)" }
        ).fromTo(
          card,
          { autoAlpha: 0, y: 34, x: i % 2 === 0 ? -18 : 18 },
          { autoAlpha: 1, y: 0, x: 0, duration: 1.1, ease: "expo.out" },
          "-=0.45"
        );
      });
    }, section);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [geo.d]);

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
                className={`s3-card ${i % 2 === 0 ? "s3-card--sx" : "s3-card--dx"}`}
                style={{ "--row": i + 1, "--off": v.off, "--w": v.w, "--lift": v.lift }}
              >
                {/* la rotazione vive sulla carta interna: GSAP anima solo il
                    contenitore (x/y/autoAlpha) e le due transform non si pestano */}
                <div className="s3-card__paper" style={{ "--rot": `${v.rot}deg` }}>
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

      {/* ═══ FASE B (3B) — Il contesto dà significato alla scelta ═══
          Contenitore a tutta larghezza, separato dalla Fase A: l'immagine
          dark luxury vive SOLO qui, su un livello di fondo con maschera che
          la fa emergere dal navy della 3A. */}
      <div className="s3b">
        <div className="s3b__bg" aria-hidden="true" />
        <div className="s3b__inner">
          <p className="s3__tag s3__tag--light s3b__tag s3-reveal">
            <span>Mettere ordine</span>
            <span className="s3__tag-sep" aria-hidden="true">·</span>
            <span>Connessioni</span>
          </p>
          <h2 className="s3b__title s3-reveal">
            Il contesto dà significato <em>alla scelta</em>
          </h2>

          <ul className="s3b__list">
            {ORDER_RELATIONS.map(([concept, connection]) => (
              <li className="s3b__row s3-reveal" key={concept}>
                <span className="s3b__concept">{concept}</span>
                <span className="s3b__connection">{connection}</span>
              </li>
            ))}
          </ul>

          <p className="s3b__epilogue s3-reveal">Ogni scelta entra nella vita dell’impresa.</p>
        </div>
      </div>
    </section>
  );
}

export { S3Realta };
