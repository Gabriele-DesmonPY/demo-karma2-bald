import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SiteFooter from "../components/SiteFooter";
import "./S4Seme.css";

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════════════
   SEZIONE 04 — IL SEME: DAL DITO ALLO STELO (riproduzione autonoma)
   Un unico video montato (niente cambi di file a metà → niente salti):
   il dito rilascia la goccia → la goccia colpisce il filo (qui i due
   girati si fondono in dissolvenza, allineati sull'impatto) → il filo
   vibra → nasce e cresce lo stelo → FERMO sull'ultimo fotogramma (freeze
   frame: niente loop, niente fioritura).
   - Innesco: la schermata del seme entra in vista con la slide attiva.
   - I testi seguono il tempo REALE del video (se rallenta, aspettano).
   - Risalendo alla 03 (rotella/swipe in cima alla sezione) il passaggio
     viene trattenuto: il video si RIAVVOLGE (copia codificata al
     contrario: i browser non supportano playbackRate negativo), i testi
     si richiudono in sincrono, poi il deck sale. Rientrando riparte da 0.
   ═══════════════════════════════════════════════════════════════ */

// Video: VP9/WebM (Chrome, Edge, Firefox) e H.264/MP4 (Safari)
const SEQ = {
  webm: "/seme-seq.webm",
  mp4: "/seme-seq.mp4",
  revWebm: "/seme-seq-rev.webm",
  revMp4: "/seme-seq-rev.mp4",
  poster: "/seme-seq-poster.jpg",
  fine: "/seme-seq-fine.jpg",
};
const DUR = 9.58; // durata del montaggio (s) — letta dal file quando pronto
const RATE = 1.5; // velocità della riproduzione in avanti
const REV_RATE = 2.6; // riavvolgimento: più svelto
// Regia dei testi, in secondi del video
const AT = {
  low: 4.5, // impatto della goccia sul filo
  headOut: 5.3, // il titolo lascia spazio allo stelo
  high: 6.4, // lo stelo sale
  kws: 7.7, // parole chiave attorno alle foglie
  bloom: 8.4, // la frase finale
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
  const videoRef = useRef(null);
  const revRef = useRef(null);
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
    const video = videoRef.current;
    const rev = revRef.current;
    if (!section || !screen || !video || !rev) return;
    const scroller = section.closest(".sandbox-slide");
    const SLIDE_INDEX = scroller ? Number(scroller.dataset.slide) : -1;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dur = () => (Number.isFinite(video.duration) && video.duration > 0 ? video.duration : DUR);

    let phase = "idle"; // idle → play → done · rewind
    let io;
    let onSlide;
    let onBeforeLeave;
    let tl;

    const lock = () => {
      scroller?.classList.add("is-locked");
      window.dispatchEvent(new Event("deck:lock"));
    };
    const unlock = () => {
      scroller?.classList.remove("is-locked");
      window.dispatchEvent(new Event("deck:unlock"));
    };
    // quale dei due video si vede (avanti / al contrario)
    const showRev = (on) => {
      rev.style.opacity = on ? "1" : "0";
      video.style.opacity = on ? "0" : "1";
    };

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(section);

      if (reduced) {
        // stato finale statico: lo stelo cresciuto, tutti i testi visibili
        video.poster = SEQ.fine;
        video.preload = "none";
        gsap.set(q(".s4-anim"), { autoAlpha: 1, scale: 1, y: 0 });
        gsap.set(q(".s4-bud__text"), { yPercent: -50 });
        gsap.set(q(".s4__head"), { autoAlpha: 0 });
        gsap.set(q(".s4__scrim"), { autoAlpha: 1 });
        return;
      }

      // Testi: timeline in pausa, la sua testina segue il tempo del video
      gsap.set(q(".s4-anim"), { autoAlpha: 0, scale: 0.92, y: 14 });
      gsap.set(q(".s4-bud__text"), { yPercent: -50 });
      gsap.set(q(".s4__head .s4-anim"), { autoAlpha: 1, scale: 1, y: 0 });
      const grow = { autoAlpha: 1, scale: 1, y: 0, duration: 0.8, ease: "power2.out" };
      tl = gsap.timeline({ paused: true });
      tl.set({}, {}, DUR);
      tl.to(q(".s4__head"), { autoAlpha: 0, duration: 0.6 }, AT.headOut);
      q(".s4-bud__text").forEach((el, i) => tl.to(el, { ...grow, yPercent: -50 }, BUDS[i].at));
      tl.to(q(".s4-kw__inner"), { ...grow, stagger: 0.18 }, AT.kws);
      tl.to(q(".s4__scrim"), { autoAlpha: 1, duration: 0.9 }, AT.bloom - 0.2);
      tl.to(q(".s4__bloom .s4-anim"), { ...grow, stagger: 0.3 }, AT.bloom);

      const tick = () => {
        if (phase === "play") {
          tl.time(Math.min(video.currentTime, tl.duration()));
          if (video.ended) {
            video.pause(); // freeze frame sullo stelo, niente loop
            phase = "done";
            tl.progress(1);
            gsap.ticker.remove(tick);
          }
        } else if (phase === "rewind") {
          // stesso istante in avanti = durata − tempo del video al contrario
          tl.time(Math.max(0, dur() - rev.currentTime));
        }
      };

      const start = () => {
        if (phase !== "idle") return;
        phase = "play";
        showRev(false);
        try {
          video.currentTime = 0;
        } catch {
          /* metadata non pronti: parte comunque da 0 */
        }
        video.playbackRate = RATE;
        video.play().catch(() => {});
        // alcuni browser azzerano la velocità al primo play: la riapplichiamo
        video.addEventListener("playing", () => (video.playbackRate = RATE), { once: true });
        gsap.ticker.add(tick);
      };

      // azzeramento pulito (a slide non attiva: invisibile)
      const reset = () => {
        gsap.ticker.remove(tick);
        video.pause();
        rev.pause();
        try {
          video.currentTime = 0;
        } catch {
          /* nulla da riavvolgere */
        }
        showRev(false);
        tl.time(0);
        phase = "idle";
      };

      // Risalita alla 03: riavvolgimento visibile, poi il deck sale
      const rewindOut = () => {
        phase = "rewind";
        lock();
        video.pause();
        const from = Math.min(video.currentTime, dur());
        const go = () => {
          showRev(true);
          rev.playbackRate = REV_RATE;
          rev.play().catch(() => {});
          gsap.ticker.add(tick);
        };
        try {
          rev.currentTime = Math.max(0, dur() - from);
          rev.addEventListener("seeked", go, { once: true });
        } catch {
          go();
        }
        const finish = () => {
          reset();
          unlock();
          window.dispatchEvent(
            new CustomEvent("deck:goto", { detail: { index: SLIDE_INDEX - 1, fromBelow: true } })
          );
        };
        rev.addEventListener("ended", finish, { once: true });
        // rete di sicurezza: se "ended" non arriva, chiude comunque
        setTimeout(() => phase === "rewind" && finish(), (from / REV_RATE) * 1000 + 1200);
      };

      onBeforeLeave = (e) => {
        const d = e.detail;
        if (d.from !== SLIDE_INDEX || d.dir >= 0 || phase === "idle" || phase === "rewind") return;
        if (video.currentTime < 0.15) return; // niente da riavvolgere
        e.preventDefault(); // il passaggio lo chiediamo noi a fine riavvolgimento
        rewindOut();
      };
      window.addEventListener("deck:beforeleave", onBeforeLeave);

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

      // Il deck cambia slide (menu, indice…): fuori da questa → azzera
      onSlide = (e) => {
        if (e.detail.index !== SLIDE_INDEX) {
          if (phase !== "rewind") reset();
        } else if (visible) start();
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
      if (onBeforeLeave) window.removeEventListener("deck:beforeleave", onBeforeLeave);
      if (phase === "rewind") unlock();
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
            {/* il montaggio DITO → STELO, riprodotto da solo; si ferma sullo stelo */}
            <div className="s4__media">
              <video
                ref={videoRef}
                className="s4__video"
                poster={SEQ.poster}
                muted
                playsInline
                preload="auto"
                aria-hidden="true"
                tabIndex={-1}
              >
                <source src={SEQ.webm} type="video/webm" />
                <source src={SEQ.mp4} type="video/mp4" />
              </video>
              {/* copia al contrario, usata solo per il riavvolgimento */}
              <video
                ref={revRef}
                className="s4__video s4__video--rev"
                muted
                playsInline
                preload="auto"
                aria-hidden="true"
                tabIndex={-1}
              >
                <source src={SEQ.revWebm} type="video/webm" />
                <source src={SEQ.revMp4} type="video/mp4" />
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
