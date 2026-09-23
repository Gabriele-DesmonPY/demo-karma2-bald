import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./S4Seme.css";

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════════════
   SEZIONE 04 — I CONCETTI CHE GERMOGLIANO DAL SEME
   Esperienza immersiva a tutto schermo: il video (goccia → tocco →
   germoglio → fiore d'oro) è guidato dallo scroll, e le frasi
   "sbocciano" accanto ai nodi della pianta mentre cresce.

   - Blocco appeso (sticky) dentro una traccia alta: equivale a un
     pin di ScrollTrigger, ma resta perfettamente fluido con Lenis e
     con lo scroll interno della slide (niente salti da pin-spacer).
   - Il video è codificato tutto a keyframe (ogni fotogramma è
     indipendente): lo scrub avanti/indietro è istantaneo.
   - Tutto è in scrub → bidirezionale: salendo la pianta rientra e le
     frasi si richiudono.
   - Le frasi sono posizionate in % DENTRO il riquadro 16:9 del video,
     quindi seguono i rami a qualunque dimensione di schermo.
   ═══════════════════════════════════════════════════════════════ */

// Due codifiche, entrambe con ogni fotogramma chiave (scrub istantaneo):
// VP9/WebM per Chrome, Edge e Firefox, H.264/MP4 per Safari.
const VIDEO_WEBM = "/seme-germoglio.webm";
const VIDEO_MP4 = "/seme-germoglio.mp4";
const pickSource = () => {
  if (typeof document === "undefined") return VIDEO_MP4;
  const v = document.createElement("video");
  return v.canPlayType('video/webm; codecs="vp9"') ? VIDEO_WEBM : VIDEO_MP4;
};

// Corrispondenza scroll → tempo del video (s). La crescita della pianta
// nel video è concentrata tra 6,6 s e 8,8 s: la "stiriamo" in modo che
// ogni fase del testo cada sul suo momento di crescita.
//   0–30%  goccia, dito, tocco, onda di luce   → 0 … 6.6 s
//  30–60%  primi germogli e foglie basse       → 6.6 … 7.4 s
//  60–90%  nodi alti, bocciolo, fioritura      → 7.4 … 8.8 s
//  90–100% fiore pienamente aperto             → 8.8 … 9.9 s
const VIDEO_KEYS = [
  { at: 0.3, t: 6.6 },
  { at: 0.6, t: 7.4 },
  { at: 0.9, t: 8.8 },
  { at: 1.0, t: 9.9 },
];

// Frasi-germoglio: coordinate in % del riquadro video, accanto ai nodi
// ma fuori dall'ingombro finale della pianta (foglie x 28–73%, y 40–72%;
// fiore x 37–63%, y 19–50%). side "sx" = il testo termina sul nodo,
// "dx" = parte dal nodo. mx/my: posizione su mobile verticale (testo
// centrato sopra/sotto la pianta, dove c'è spazio).
const BUDS = [
  { text: "Per questa impresa.", x: 30, y: 62, mx: 29, my: 86, side: "sx", phase: 0.3 },
  { text: "Con questa storia.", x: 70, y: 62, mx: 71, my: 86, side: "dx", phase: 0.33 },
  { text: "Con queste persone.", x: 26, y: 47, mx: 29, my: 7, side: "sx", phase: 0.6 },
  { text: "Con queste possibilità.", x: 74, y: 47, mx: 71, my: 7, side: "dx", phase: 0.63 },
];

// Parole chiave che galleggiano attorno al fiore aperto
const KEYWORDS = [
  { t: "Visione", x: 30, y: 30, d: "0s" },
  { t: "Identità", x: 70, y: 29, d: "-2.4s" },
  { t: "Storia", x: 33, y: 16, d: "-4.1s" },
  { t: "Valori", x: 67, y: 15, d: "-1.3s" },
  { t: "Direzione", x: 50, y: 9, d: "-3.2s" },
];

export default function S4Seme() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const videoRef = useRef(null);

  // Il video viene scaricato per intero e servito da memoria (blob):
  // ogni salto di currentTime è immediato, anche all'indietro.
  useEffect(() => {
    let url;
    let cancelled = false;
    fetch(pickSource())
      .then((r) => r.blob())
      .then((blob) => {
        if (cancelled || !videoRef.current) return;
        const v = videoRef.current;
        const t = v.currentTime;
        url = URL.createObjectURL(blob);
        v.src = url;
        v.addEventListener("loadeddata", () => (v.currentTime = t), { once: true });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;
    const scroller = section.closest(".sandbox-slide") || window;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(section);

      if (reduced) {
        // Nessun movimento: fiore già aperto, tutte le frasi visibili
        const show = () => (video.currentTime = 9.5);
        if (video.readyState >= 1) show();
        else video.addEventListener("loadedmetadata", show, { once: true });
        gsap.set(q(".s4-anim"), { autoAlpha: 1, scale: 1, y: 0, filter: "none" });
        gsap.set(q(".s4-bud__text"), { yPercent: -50 });
        return;
      }

      // ── Il tempo del video segue lo scroll ──
      const proxy = { t: 0 };
      const seek = () => {
        if (video.readyState < 1) return;
        if (Math.abs(video.currentTime - proxy.t) > 1 / 60) video.currentTime = proxy.t;
      };

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: trackRef.current,
          scroller,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });

      let prev = 0;
      VIDEO_KEYS.forEach((k) => {
        tl.to(proxy, { t: k.t, duration: k.at - prev, onUpdate: seek }, prev);
        prev = k.at;
      });

      // ── Fase 1: tag e titolo in alto, dissolvenza discreta ──
      tl.fromTo(
        q(".s4__head .s4-anim"),
        { autoAlpha: 0, y: 14, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.08, stagger: 0.03, ease: "power2.out" },
        0.02
      );

      // ── Fasi 2 e 3: le frasi germogliano dai nodi ──
      q(".s4-bud__text").forEach((el, i) => {
        tl.fromTo(
          el,
          // yPercent -50: il testo resta centrato in verticale sul nodo
          { autoAlpha: 0, scale: 0.9, y: 16, yPercent: -50, filter: "blur(6px)" },
          { autoAlpha: 1, scale: 1, y: 0, yPercent: -50, filter: "blur(0px)", duration: 0.09, ease: "power2.out" },
          BUDS[i].phase
        );
      });

      // ── Fase 4: il titolo in alto si ritira, il fiore si apre ──
      tl.to(q(".s4__head"), { autoAlpha: 0, duration: 0.06 }, 0.82);
      tl.fromTo(
        q(".s4-kw__inner"),
        { autoAlpha: 0, scale: 0.9 },
        { autoAlpha: 1, scale: 1, duration: 0.07, stagger: 0.012, ease: "power2.out" },
        0.86
      );
      tl.fromTo(
        q(".s4__bloom .s4-anim"),
        { autoAlpha: 0, scale: 0.9, y: 18, filter: "blur(8px)" },
        { autoAlpha: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 0.08, stagger: 0.025, ease: "power2.out" },
        0.9
      );
    }, section);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="s4" id="seme" data-n="4" aria-labelledby="s4-title">
      <div ref={trackRef} className="s4__track">
        <div className="s4__sticky">
          {/* Riquadro 16:9 del video: tutto ciò che deve "seguire i rami"
              vive qui dentro, in coordinate percentuali */}
          <div className="s4__stage">
            <video
              ref={videoRef}
              className="s4__video"
              poster="/seme-germoglio-poster.jpg"
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
              tabIndex={-1}
            >
              <source src={VIDEO_WEBM} type="video/webm" />
              <source src={VIDEO_MP4} type="video/mp4" />
            </video>
            <div className="s4__veil" aria-hidden="true" />

            {BUDS.map((b) => (
              <p
                key={b.text}
                className={`s4-bud s4-bud--${b.side}`}
                style={{ "--x": `${b.x}%`, "--y": `${b.y}%`, "--mx": `${b.mx}%`, "--my": `${b.my}%` }}
              >
                <span className="s4-bud__text s4-anim">{b.text}</span>
              </p>
            ))}

            <ul className="s4-kws" aria-label="Visione, identità, storia, valori, direzione">
              {KEYWORDS.map((k) => (
                <li key={k.t} className="s4-kw" style={{ left: `${k.x}%`, top: `${k.y}%` }}>
                  <span className="s4-kw__inner s4-anim">
                    <span className="s4-kw__float" style={{ animationDelay: k.d }}>
                      {k.t}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            {/* Fase 4 — la frase che si accende sotto il fiore */}
            <div className="s4__bloom">
              <p className="s4__bloom-line s4-anim">In questo momento.</p>
              <p className="s4__bloom-line s4__bloom-line--strong s4-anim">
                La scelta prende forma da qui.
              </p>
            </div>
          </div>

          {/* Fase 1 — tag e titolo in alto */}
          <header className="s4__head">
            <p className="s4__tag s4-anim">
              <span>Quarto blocco</span>
              <span className="s4__tag-sep" aria-hidden="true">—</span>
              <span>Mettere ordine e trovare coerenza</span>
            </p>
            <h2 id="s4-title" className="s4__title s4-anim">
              Tenere insieme significa riconoscere ciò che conta.
            </h2>
          </header>
        </div>
      </div>
    </section>
  );
}

export { S4Seme };
