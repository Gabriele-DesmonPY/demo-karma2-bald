import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./S4Seme.css";

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════════════
   SEZIONE 04 — I CONCETTI CHE GERMOGLIANO DAL SEME
   Esperienza immersiva a tutto schermo: il video (goccia → tocco →
   germoglio → fiore d'oro) scorre DA SOLO in loop, in riproduzione
   nativa (60fps, nessun controllo del currentTime via JS). Lo scroll
   guida soltanto la fioritura dei testi sopra il video.

   - Blocco appeso (sticky) dentro una traccia alta: equivale a un
     pin di ScrollTrigger, fluido con Lenis e con lo scroll della slide.
   - Testi in scrub → bidirezionali: salendo si richiudono.
   - Il video è in pausa quando la sezione non è in vista (batteria/GPU).
   - Le frasi sono posizionate in % DENTRO il riquadro 16:9 del video,
     quindi restano accanto ai rami a qualunque dimensione di schermo.
   ═══════════════════════════════════════════════════════════════ */

// Video in riproduzione continua: VP9/WebM (Chrome, Edge, Firefox) e
// H.264/MP4 (Safari). Nessun audio, codifica leggera (~1 MB).
const VIDEO_WEBM = "/seme-germoglio.webm";
const VIDEO_MP4 = "/seme-germoglio.mp4";

// Momenti dello scroll (0 → 1) in cui sbocciano i testi
const STEP = { head: 0.02, low: 0.22, high: 0.44, keywords: 0.66, final: 0.84 };

// Frasi-germoglio: coordinate in % del riquadro video, accanto ai nodi
// ma fuori dall'ingombro finale della pianta (foglie x 28–73%, y 40–72%;
// fiore x 37–63%, y 19–50%). side "sx" = il testo termina sul nodo,
// "dx" = parte dal nodo. mx/my: posizione su mobile verticale (testo
// centrato sopra/sotto la pianta, dove c'è spazio).
const BUDS = [
  { text: "Per questa impresa.", x: 30, y: 62, mx: 29, my: 86, side: "sx", phase: STEP.low },
  { text: "Con questa storia.", x: 70, y: 62, mx: 71, my: 86, side: "dx", phase: STEP.low + 0.03 },
  { text: "Con queste persone.", x: 26, y: 47, mx: 29, my: 7, side: "sx", phase: STEP.high },
  { text: "Con queste possibilità.", x: 74, y: 47, mx: 71, my: 7, side: "dx", phase: STEP.high + 0.03 },
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

  // Il video gira solo quando la sezione è davvero in vista
  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      // movimento ridotto: niente riproduzione, immagine fissa del fiore aperto
      video.removeAttribute("autoplay");
      video.pause();
      video.poster = "/seme-germoglio-fiore.jpg";
      video.preload = "none";
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.15 }
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const scroller = section.closest(".sandbox-slide") || window;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(section);

      if (reduced) {
        gsap.set(q(".s4-anim"), { autoAlpha: 1, scale: 1, y: 0, filter: "none" });
        gsap.set(q(".s4-bud__text"), { yPercent: -50 });
        return;
      }

      // Lo scroll guida SOLO i testi (il video scorre per conto suo)
      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: trackRef.current,
          scroller,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
      // la timeline dura esattamente 1 → le posizioni sono % di scroll
      tl.set({}, {}, 1);

      // Start — header
      tl.fromTo(
        q(".s4__head .s4-anim"),
        { autoAlpha: 0, y: 14, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.08, stagger: 0.03 },
        STEP.head
      );

      // Step 1 e 2 — le frasi in basso, poi quelle in alto
      q(".s4-bud__text").forEach((el, i) => {
        tl.fromTo(
          el,
          // yPercent -50: il testo resta centrato in verticale sul nodo
          { autoAlpha: 0, scale: 0.9, y: 16, yPercent: -50, filter: "blur(6px)" },
          { autoAlpha: 1, scale: 1, y: 0, yPercent: -50, filter: "blur(0px)", duration: 0.1 },
          BUDS[i].phase
        );
      });

      // Step 3 — l'header si ritira, compaiono le parole chiave
      tl.to(q(".s4__head"), { autoAlpha: 0, duration: 0.06 }, STEP.keywords - 0.04);
      tl.fromTo(
        q(".s4-kw__inner"),
        { autoAlpha: 0, scale: 0.9 },
        { autoAlpha: 1, scale: 1, duration: 0.08, stagger: 0.015 },
        STEP.keywords
      );

      // Step 4 — la frase finale
      tl.fromTo(
        q(".s4__bloom .s4-anim"),
        { autoAlpha: 0, scale: 0.9, y: 18, filter: "blur(8px)" },
        { autoAlpha: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 0.09, stagger: 0.03 },
        STEP.final
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
              autoPlay
              loop
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
