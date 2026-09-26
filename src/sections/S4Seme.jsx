import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SiteFooter from "../components/SiteFooter";
import "./S4Seme.css";

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════════════
   SEZIONE 04 — IL SEME: DAL DITO ALLO STELO (sequenza in scroll)
   Due soli video, montati in sequenza e guidati dallo scroll (scrub,
   bidirezionale):
   1. DITO  — il dito rilascia la goccia, la goccia cade sul filo d'oro
      e lo fa vibrare (clip tagliata prima di ogni sviluppo);
   2. STELO — dal filo vibrante nasce e cresce solo lo stelo dorato
      (clip tagliata prima della fioritura).
   Scendendo: dito → goccia → vibrazione → stelo. Risalendo: lo stelo si
   ritrae, il filo vibra, la goccia risale verso il dito.

   Il palco è "appeso" con position: sticky (niente pin: il sito è un deck
   e scorre la slide, non la finestra) dentro una traccia di 300vh
   (= 100vh + 200% di corsa). Un'unica timeline GSAP in scrub governa
   testi e tempo dei video; i due video sono codificati tutti a
   fotogrammi chiave (seek istantaneo in entrambi i versi) e si passano
   il testimone con una dissolvenza incrociata sul filo che vibra.
   ═══════════════════════════════════════════════════════════════ */

// Video: VP9/WebM (Chrome, Edge, Firefox) e H.264/MP4 (Safari), ~2,5 MB
// ciascuno, tutti i fotogrammi sono chiave (seek fluido avanti/indietro)
const DITO = { webm: "/seme-dito.webm", mp4: "/seme-dito.mp4", poster: "/seme-dito-poster.jpg" };
const STELO = { webm: "/seme-stelo.webm", mp4: "/seme-stelo.mp4", fine: "/seme-stelo-fine.jpg" };

// Regia sulla corsa di scroll (0 → 1)
const SPLIT = 0.5; // prima metà: dito · seconda: stelo
const XFADE = 0.06; // ampiezza della dissolvenza incrociata attorno a SPLIT
const AT = {
  headOut: 0.54, // il titolo lascia spazio allo stelo
  low: 0.44, // impatto della goccia sul filo
  high: 0.62, // lo stelo sale
  kws: 0.74, // parole chiave attorno alle foglie
  bloom: 0.85, // la frase finale
};

// Frasi-germoglio: coordinate in % del riquadro video, accanto ai nodi
// ma fuori dall'ingombro finale della pianta (foglie x 28–73%, y 40–72%;
// fiore x 37–63%, y 19–50%). side "sx" = il testo termina sul nodo,
// "dx" = parte dal nodo. mx/my: posizione su mobile verticale (testo
// centrato sopra/sotto la pianta, dove c'è spazio).
const BUDS = [
  { text: "Per questa impresa.", x: 30, y: 62, mx: 29, my: 86, side: "sx", at: AT.low },
  { text: "Con questa storia.", x: 70, y: 62, mx: 71, my: 86, side: "dx", at: AT.low + 0.03 },
  { text: "Con queste persone.", x: 26, y: 47, mx: 29, my: 7, side: "sx", at: AT.high },
  { text: "Con queste possibilità.", x: 74, y: 47, mx: 71, my: 7, side: "dx", at: AT.high + 0.03 },
];

// Parole chiave che galleggiano attorno allo stelo cresciuto
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
  const ditoRef = useRef(null);
  const steloRef = useRef(null);
  const magnetRef = useRef(null);
  const btnRef = useRef(null);

  // Il bottone della CTA porta ai contatti: scorrimento morbido fino al
  // footer, dentro la slide (la finestra non scorre).
  const toFooter = (e) => {
    const footer = document.getElementById("contatti");
    const scroller = footer?.closest(".sandbox-slide");
    if (!footer || !scroller) return;
    e.preventDefault();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.scrollTo({ top: footer.offsetTop, behavior: reduced ? "auto" : "smooth" });
  };

  // Bottone "magnetico": segue il puntatore di pochi px (solo transform),
  // poi torna al suo posto con un ritorno elastico. Solo mouse/trackpad.
  useEffect(() => {
    const area = magnetRef.current;
    const btn = btnRef.current;
    if (!area || !btn) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const MAX = 10; // spostamento massimo (px)
    const xTo = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3.out" });
    const onMove = (e) => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2 + 40);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2 + 40);
      xTo(gsap.utils.clamp(-1, 1, dx) * MAX);
      yTo(gsap.utils.clamp(-1, 1, dy) * MAX * 0.6);
    };
    const onLeave = () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.45)", overwrite: true });
    };
    area.addEventListener("pointermove", onMove);
    area.addEventListener("pointerleave", onLeave);
    return () => {
      area.removeEventListener("pointermove", onMove);
      area.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf(btn);
      gsap.set(btn, { clearProps: "transform" });
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const v1 = ditoRef.current;
    const v2 = steloRef.current;
    if (!section || !track || !v1 || !v2) return;
    const scroller = section.closest(".sandbox-slide");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clamp01 = gsap.utils.clamp(0, 1);

    // ── Seek senza code: un solo seek alla volta, l'ultimo tempo vince ──
    const want = new Map();
    const seek = (v, t) => {
      want.set(v, t);
      if (v.readyState < 1 || v.seeking) return;
      if (Math.abs(v.currentTime - t) > 0.012) v.currentTime = t;
    };
    const onSeeked = (e) => {
      const v = e.currentTarget;
      const t = want.get(v);
      if (t != null && Math.abs(v.currentTime - t) > 0.02) v.currentTime = t;
    };
    // durata utile (un soffio prima della fine: niente fotogramma vuoto)
    const dur = (v, fallback) => (Number.isFinite(v.duration) && v.duration > 0 ? v.duration : fallback) - 0.04;
    const onMeta = (e) => {
      const v = e.currentTarget;
      seek(v, want.get(v) ?? 0);
      // Safari/iOS: un play/pausa muto "sveglia" il decoder per i seek
      v.play()
        .then(() => v.pause())
        .catch(() => {});
    };
    [v1, v2].forEach((v) => {
      v.addEventListener("seeked", onSeeked);
      v.addEventListener("loadedmetadata", onMeta);
    });

    // ── Stato della sequenza a un punto p della corsa (0 → 1) ──
    let lastFade = -1;
    const drive = (p) => {
      const f = clamp01((p - (SPLIT - XFADE / 2)) / XFADE); // 0 = dito, 1 = stelo
      if (f !== lastFade) {
        lastFade = f;
        v1.style.opacity = String(1 - f);
        v2.style.opacity = String(f);
      }
      if (f < 1) seek(v1, clamp01(p / SPLIT) * dur(v1, 5.25));
      if (f > 0) seek(v2, clamp01((p - SPLIT) / (1 - SPLIT)) * dur(v2, 4.42));
    };

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(section);

      if (reduced) {
        // stato finale statico: lo stelo cresciuto, tutti i testi visibili
        v1.style.opacity = "0";
        v2.style.opacity = "1";
        v2.poster = STELO.fine;
        want.set(v2, dur(v2, 4.42));
        gsap.set(q(".s4-anim"), { autoAlpha: 1, scale: 1, y: 0 });
        gsap.set(q(".s4-bud__text"), { yPercent: -50 });
        gsap.set(q(".s4__head"), { autoAlpha: 0 });
        gsap.set(q(".s4__scrim"), { autoAlpha: 1 });
        return;
      }

      // Stati di partenza: titolo già presente, il resto chiuso
      gsap.set(q(".s4-anim"), { autoAlpha: 0, scale: 0.92, y: 14 });
      gsap.set(q(".s4-bud__text"), { yPercent: -50 });
      gsap.set(q(".s4__head .s4-anim"), { autoAlpha: 1, scale: 1, y: 0 });
      drive(0);

      // ── Un'unica timeline in scrub: testi + tempo dei video ──
      const grow = { autoAlpha: 1, scale: 1, y: 0, duration: 0.06, ease: "power2.out" };
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: track,
          scroller: scroller || window,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5, // fluido anche a ritroso
          invalidateOnRefresh: true,
        },
        onUpdate: () => drive(tl.progress()),
      });
      tl.set({}, {}, 1); // lunghezza della timeline = 1 (corsa intera)
      tl.to(q(".s4__head"), { autoAlpha: 0, duration: 0.05 }, AT.headOut);
      q(".s4-bud__text").forEach((el, i) => tl.to(el, { ...grow, yPercent: -50 }, BUDS[i].at));
      tl.to(q(".s4-kw__inner"), { ...grow, stagger: 0.025 }, AT.kws);
      tl.to(q(".s4__scrim"), { autoAlpha: 1, duration: 0.07 }, AT.bloom - 0.02);
      tl.to(q(".s4__bloom .s4-anim"), { ...grow, stagger: 0.04 }, AT.bloom);

      // La CTA sopra la texture del Bisso: dissolvenza leggera legata allo scroll
      if (scroller) {
        q(".s4-cta__item").forEach((el) => {
          gsap.fromTo(
            el,
            { autoAlpha: 0, y: 28 },
            {
              autoAlpha: 1,
              y: 0,
              ease: "power2.out",
              scrollTrigger: { trigger: el, scroller, start: "top 92%", end: "top 64%", scrub: 1 },
            }
          );
        });
      }
    }, section);

    return () => {
      [v1, v2].forEach((v) => {
        v.removeEventListener("seeked", onSeeked);
        v.removeEventListener("loadedmetadata", onMeta);
      });
      ctx.revert();
    };
  }, []);

  return (
    <div className="s4-root">
    <section ref={sectionRef} className="s4" id="seme" data-n="4" aria-labelledby="s4-title">
      {/* Traccia di scroll (300vh) con il palco appeso: video e testi in scrub */}
      <div ref={trackRef} className="s4__track">
      <div className="s4__screen">
          {/* Riquadro 16:9 del video: tutto ciò che deve "seguire i rami"
              vive qui dentro, in coordinate percentuali */}
          <div className="s4__stage">
            {/* i due video montati in sequenza: DITO → STELO (dissolvenza incrociata) */}
            <div className="s4__media">
              <video
                ref={ditoRef}
                className="s4__video s4__video--dito"
                poster={DITO.poster}
                muted
                playsInline
                preload="auto"
                aria-hidden="true"
                tabIndex={-1}
              >
                <source src={DITO.webm} type="video/webm" />
                <source src={DITO.mp4} type="video/mp4" />
              </video>
              <video
                ref={steloRef}
                className="s4__video s4__video--stelo"
                muted
                playsInline
                preload="auto"
                aria-hidden="true"
                tabIndex={-1}
              >
                <source src={STELO.webm} type="video/webm" />
                <source src={STELO.mp4} type="video/mp4" />
              </video>
            </div>
            <div className="s4__veil" aria-hidden="true" />
            {/* sfumatura in basso: il video si scioglie nel blu del copy sotto */}
            <div className="s4__fade" aria-hidden="true" />

            {BUDS.map((b) => (
              <p
                key={b.text}
                className={`s4-bud s4-bud--${b.side}`}
                style={{ "--x": `${b.x}%`, "--xf": b.x / 100, "--y": `${b.y}%`, "--mx": `${b.mx}%`, "--my": `${b.my}%` }}
              >
                <span className="s4-bud__text s4-anim">{b.text}</span>
              </p>
            ))}

            <ul className="s4-kws" aria-label="Visione, identità, storia, valori, direzione">
              {KEYWORDS.map((k) => (
                <li
                  key={k.t}
                  className={`s4-kw${k.y < 12 ? " s4-kw--apex" : ""}`}
                  style={{ left: `${k.x}%`, "--ky": k.y / 100 }}
                >
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
              {/* velatura radiale morbida dietro il blocco di testo (statica) */}
              <span className="s4__scrim" aria-hidden="true" />
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

      {/* ── CTA "Il filo che diventa trama": subito dopo il seme, sulla
          texture fotografica del Bisso ── */}
      <div className="s4-cta" role="group" aria-labelledby="s4-cta-title">
        <div className="s4-cta__texture" aria-hidden="true" />
        <div className="s4-cta__inner">
          <p className="s4-cta__item s4-cta__kicker">La scelta prende forma da qui</p>
          <h3 id="s4-cta-title" className="s4-cta__item s4-cta__title">
            La coerenza è un <em>filo vivo</em> che permette all’impresa di evolvere continuando a
            riconoscersi.
          </h3>
          {/* area del magnete: un po' più ampia del bottone */}
          <div ref={magnetRef} className="s4-cta__item s4-cta__action">
            <a ref={btnRef} href="#contatti" className="s4-cta__btn" onClick={toFooter}>
              <span className="s4-cta__btn-label">Poi la scelta comincia a vivere.</span>
            </a>
          </div>
        </div>
      </div>
    </section>

    {/* Footer & contatti: in coda alla slide, dentro lo stesso contenuto
        scorrevole (Lenis usa il primo figlio della slide come contenuto) */}
    <SiteFooter />
    </div>
  );
}

export { S4Seme };
