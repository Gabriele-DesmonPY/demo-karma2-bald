import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SiteFooter from "../components/SiteFooter";
import "./S4Seme.css";

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════════════
   SEZIONE 04 — IL SEME: DAL DITO ALLO STELO (riproduzione autonoma)
   Due soli video, montati in sequenza, riprodotti da soli (niente scrub):
   1. DITO  — il dito rilascia la goccia, la goccia cade sul filo d'oro
      e lo fa vibrare;
   2. STELO — dal filo vibrante nasce e cresce solo lo stelo dorato, poi
      si FERMA sull'ultimo fotogramma (freeze frame: niente loop, niente
      fioritura).
   Innesco: la schermata del seme entra in vista con la slide attiva.
   Il passaggio DITO → STELO è una dissolvenza incrociata sul filo che
   vibra (i due fotogrammi coincidono). I testi seguono il tempo REALE dei
   video (se un video rallenta per il buffering, i testi aspettano).
   Rientro: se si risale alla 03 e si torna giù, la sequenza si azzera e
   riparte pulita dall'inizio. Tornando su dal copy sotto (stessa slide)
   resta ferma sullo stelo.
   ═══════════════════════════════════════════════════════════════ */

// Video: VP9/WebM (Chrome, Edge, Firefox) e H.264/MP4 (Safari), ~2,5 MB
const DITO = { webm: "/seme-dito.webm", mp4: "/seme-dito.mp4", poster: "/seme-dito-poster.jpg" };
const STELO = { webm: "/seme-stelo.webm", mp4: "/seme-stelo.mp4", fine: "/seme-stelo-fine.jpg" };

// Velocità di riproduzione (1 = naturale): ~9,6 s di girato → ~7,4 s
const RATE = 1.3;
// Durate delle clip (s, tempo del video) — lette dai file quando pronti
const D1 = 5.25;
const D2 = 4.42;
// Regia dei testi, in secondi di SEQUENZA (dito 0→D1, poi stelo D1→D1+D2)
const AT = {
  low: 4.5, // impatto della goccia sul filo
  headOut: D1 + 0.5, // il titolo lascia spazio allo stelo
  high: D1 + 1.6, // lo stelo sale
  kws: D1 + 2.9, // parole chiave attorno alle foglie
  bloom: D1 + 3.5, // la frase finale
};

// Frasi-germoglio: coordinate in % del riquadro video, accanto ai nodi
// ma fuori dall'ingombro finale della pianta (foglie x 28–73%, y 40–72%;
// fiore x 37–63%, y 19–50%). side "sx" = il testo termina sul nodo,
// "dx" = parte dal nodo. mx/my: posizione su mobile verticale (testo
// centrato sopra/sotto la pianta, dove c'è spazio).
const BUDS = [
  { text: "Per questa impresa.", x: 30, y: 62, mx: 29, my: 86, side: "sx", at: AT.low },
  { text: "Con questa storia.", x: 70, y: 62, mx: 71, my: 86, side: "dx", at: AT.low + 0.3 },
  { text: "Con queste persone.", x: 26, y: 47, mx: 29, my: 7, side: "sx", at: AT.high },
  { text: "Con queste possibilità.", x: 74, y: 47, mx: 71, my: 7, side: "dx", at: AT.high + 0.3 },
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
  const screenRef = useRef(null);
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
    const screen = screenRef.current;
    const v1 = ditoRef.current;
    const v2 = steloRef.current;
    if (!section || !screen || !v1 || !v2) return;
    const scroller = section.closest(".sandbox-slide");
    const SLIDE_INDEX = scroller ? Number(scroller.dataset.slide) : -1;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const d1 = () => (Number.isFinite(v1.duration) && v1.duration > 0 ? v1.duration : D1);

    let phase = "idle"; // idle → dito → stelo → done
    let io;
    let onSlide;
    let tl;
    let fades = [];

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(section);

      if (reduced) {
        // stato finale statico: lo stelo cresciuto, tutti i testi visibili
        v1.style.opacity = "0";
        v2.style.opacity = "1";
        v2.poster = STELO.fine;
        gsap.set(q(".s4-anim"), { autoAlpha: 1, scale: 1, y: 0 });
        gsap.set(q(".s4-bud__text"), { yPercent: -50 });
        gsap.set(q(".s4__head"), { autoAlpha: 0 });
        gsap.set(q(".s4__scrim"), { autoAlpha: 1 });
        return;
      }

      // Testi: timeline in pausa, la sua testina segue il tempo dei video
      gsap.set(q(".s4-anim"), { autoAlpha: 0, scale: 0.92, y: 14 });
      gsap.set(q(".s4-bud__text"), { yPercent: -50 });
      gsap.set(q(".s4__head .s4-anim"), { autoAlpha: 1, scale: 1, y: 0 });
      const grow = { autoAlpha: 1, scale: 1, y: 0, duration: 0.8, ease: "power2.out" };
      tl = gsap.timeline({ paused: true });
      tl.set({}, {}, D1 + D2);
      tl.to(q(".s4__head"), { autoAlpha: 0, duration: 0.6 }, AT.headOut);
      q(".s4-bud__text").forEach((el, i) => tl.to(el, { ...grow, yPercent: -50 }, BUDS[i].at));
      tl.to(q(".s4-kw__inner"), { ...grow, stagger: 0.18 }, AT.kws);
      tl.to(q(".s4__scrim"), { autoAlpha: 1, duration: 0.9 }, AT.bloom - 0.2);
      tl.to(q(".s4__bloom .s4-anim"), { ...grow, stagger: 0.3 }, AT.bloom);

      const crossfade = (toStelo, dur) => {
        fades.forEach((f) => f.kill());
        fades = [
          gsap.to(v1, { opacity: toStelo ? 0 : 1, duration: dur, ease: "power1.inOut" }),
          gsap.to(v2, { opacity: toStelo ? 1 : 0, duration: dur, ease: "power1.inOut" }),
        ];
      };

      // la testina dei testi segue il tempo reale della sequenza
      const tick = () => {
        if (phase === "dito") {
          tl.time(Math.min(v1.currentTime, d1()));
          if (v1.ended || v1.currentTime >= d1() - 0.05) {
            // DITO → STELO sul filo che vibra
            phase = "stelo";
            v2.playbackRate = RATE;
            v2.play().catch(() => {});
            crossfade(true, 0.5);
          }
        } else if (phase === "stelo") {
          tl.time(Math.min(D1 + v2.currentTime, tl.duration()));
          if (v2.ended) {
            // freeze frame: resta sullo stelo, niente loop
            v2.pause();
            phase = "done";
            tl.progress(1);
            gsap.ticker.remove(tick);
          }
        }
      };

      const start = () => {
        if (phase !== "idle") return;
        phase = "dito";
        try {
          v1.currentTime = 0;
          v2.currentTime = 0;
        } catch {
          /* metadata non pronti: partono comunque da 0 */
        }
        crossfade(false, 0.01);
        v1.playbackRate = RATE;
        v1.play().catch(() => {});
        // alcuni browser azzerano la velocità al primo play: la riapplichiamo
        v1.addEventListener("playing", () => (v1.playbackRate = RATE), { once: true });
        gsap.ticker.add(tick);
      };

      // azzeramento pulito (la slide non è più attiva: invisibile)
      const reset = () => {
        gsap.ticker.remove(tick);
        v1.pause();
        v2.pause();
        try {
          v1.currentTime = 0;
          v2.currentTime = 0;
        } catch {
          /* nulla da riavvolgere */
        }
        crossfade(false, 0.01);
        tl.time(0);
        phase = "idle";
      };

      // Innesco: slide attiva + schermata del seme in vista
      let visible = false;
      io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.intersectionRatio >= 0.6;
          if (visible && scroller?.classList.contains("is-active")) start();
        },
        { threshold: [0, 0.6] }
      );
      io.observe(screen);

      // Il deck cambia slide: fuori da questa → azzera; dentro → parti
      onSlide = (e) => {
        if (e.detail.index !== SLIDE_INDEX) reset();
        else if (visible) start();
      };
      window.addEventListener("deck:slide", onSlide);

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

      return () => gsap.ticker.remove(tick);
    }, section);

    return () => {
      io?.disconnect();
      if (onSlide) window.removeEventListener("deck:slide", onSlide);
      fades.forEach((f) => f.kill());
      ctx.revert();
    };
  }, []);

  return (
    <div className="s4-root">
    <section ref={sectionRef} className="s4" id="seme" data-n="4" aria-labelledby="s4-title">
      {/* Schermata del seme: una viewport, i due video e i testi a tempo */}
      <div ref={screenRef} className="s4__screen">
          {/* Riquadro 16:9 del video: tutto ciò che deve "seguire i rami"
              vive qui dentro, in coordinate percentuali */}
          <div className="s4__stage">
            {/* i due video montati in sequenza: DITO → STELO (dissolvenza incrociata),
                riprodotti da soli; lo stelo si ferma sull'ultimo fotogramma */}
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
