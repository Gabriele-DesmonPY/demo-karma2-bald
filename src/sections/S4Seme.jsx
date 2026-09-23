import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./S4Seme.css";

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════════════
   SEZIONE 04 — I CONCETTI CHE GERMOGLIANO DAL SEME
   Sequenza A TEMPO, non legata allo scroll:
   1. quando la schermata del seme è pienamente in vista, lo scroll si
      blocca per un momento (lock) e l'attenzione resta sul video;
   2. il video riparte da 0 a velocità 2.2× (10 s → ~4,5 s);
   3. una timeline GSAP a tempo fa sbocciare i testi in 4 tempi;
   4. a fine video (ultimo fotogramma: il fiore aperto) lo scroll si
      sblocca e sotto continua il copy, in flusso normale.
   Bidirezionale: risalendo (rotella/swipe in cima alla sezione) il
   passaggio alla 03 viene trattenuto: il video si RIAVVOLGE AL CONTRARIO
   e i testi si richiudono (reverse), poi il deck sale alla 03. Rientrando,
   la sequenza riparte. Il reverse usa una copia del video codificata al
   contrario (riprodotta in modo nativo e fluido): i browser non
   supportano playbackRate negativo.

   Nota: il sito è un deck a slide, la finestra non scorre. Per questo
   l'avvio usa un IntersectionObserver (la slide entra davvero in vista)
   invece di un ScrollTrigger "top top", che scatterebbe al caricamento.
   Il blocco comunica con il deck (App.jsx) tramite gli eventi
   `deck:lock` / `deck:unlock` (ferma Lenis e la navigazione tra slide).
   ═══════════════════════════════════════════════════════════════ */

// Video: VP9/WebM (Chrome, Edge, Firefox) e H.264/MP4 (Safari), ~1 MB
const VIDEO_WEBM = "/seme-germoglio.webm";
const VIDEO_MP4 = "/seme-germoglio.mp4";
const RATE = 2.2; // velocità della sequenza: 10 s di video → ~4,5 s
const REV_RATE = 3.6; // riavvolgimento: più svelto (~2,8 s dal fiore alla goccia)
const REV_WEBM = "/seme-germoglio-rev.webm";
const REV_MP4 = "/seme-germoglio-rev.mp4";

// Tempi (s) della sequenza di testi
const STEP = { head: 0, low: 1.1, high: 2.2, bloom: 3.3 };

// Frasi-germoglio: coordinate in % del riquadro video, accanto ai nodi
// ma fuori dall'ingombro finale della pianta (foglie x 28–73%, y 40–72%;
// fiore x 37–63%, y 19–50%). side "sx" = il testo termina sul nodo,
// "dx" = parte dal nodo. mx/my: posizione su mobile verticale (testo
// centrato sopra/sotto la pianta, dove c'è spazio).
const BUDS = [
  { text: "Per questa impresa.", x: 30, y: 62, mx: 29, my: 86, side: "sx", phase: STEP.low },
  { text: "Con questa storia.", x: 70, y: 62, mx: 71, my: 86, side: "dx", phase: STEP.low + 0.25 },
  { text: "Con queste persone.", x: 26, y: 47, mx: 29, my: 7, side: "sx", phase: STEP.high },
  { text: "Con queste possibilità.", x: 74, y: 47, mx: 71, my: 7, side: "dx", phase: STEP.high + 0.25 },
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
  const screenRef = useRef(null);
  const videoRef = useRef(null);
  const revRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const screen = screenRef.current;
    const video = videoRef.current;
    const rev = revRef.current;
    if (!section || !screen || !video || !rev) return;
    const scroller = section.closest(".sandbox-slide");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let running = false; // sequenza avviata per questo ingresso
    let reversing = false; // riavvolgimento in corso
    let unlockTimer;
    let io;
    let tl;
    let onSlide;
    let onBeforeLeave;
    const SLIDE_INDEX = scroller ? Number(scroller.dataset.slide) : -1;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(section);

      // Stato finale: fiore aperto, tutte le frasi visibili
      const showAll = () => {
        gsap.set(q(".s4-anim"), { autoAlpha: 1, scale: 1, y: 0, filter: "none" });
        gsap.set(q(".s4-bud__text"), { yPercent: -50 });
      };

      if (reduced) {
        video.removeAttribute("autoplay");
        video.poster = "/seme-germoglio-fiore.jpg";
        video.preload = "none";
        showAll();
        return;
      }

      // Stati di partenza (nascosti, leggermente "chiusi")
      gsap.set(q(".s4-anim"), { autoAlpha: 0, scale: 0.9, y: 14, filter: "blur(6px)" });
      gsap.set(q(".s4-bud__text"), { yPercent: -50 });

      const lock = () => {
        scroller?.classList.add("is-locked");
        window.dispatchEvent(new Event("deck:lock"));
      };
      const unlock = () => {
        clearTimeout(unlockTimer);
        scroller?.classList.remove("is-locked");
        window.dispatchEvent(new Event("deck:unlock"));
      };

      const run = () => {
        if (running) return;
        running = true;
        lock();

        // 1. Video dall'inizio, accelerato
        try {
          video.currentTime = 0;
        } catch {
          /* metadata non ancora pronti: parte comunque da 0 */
        }
        video.playbackRate = RATE;
        video.play().catch(() => {});
        // alcuni browser azzerano la velocità al primo play: la riapplichiamo
        video.addEventListener("playing", () => (video.playbackRate = RATE), { once: true });

        // 2. Testi a tempo (nessuno scrub)
        const grow = { autoAlpha: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 0.8, ease: "power2.out" };
        tl?.kill();
        tl = gsap.timeline();
        tl.to(q(".s4__head .s4-anim"), { ...grow, stagger: 0.2 }, STEP.head);
        q(".s4-bud__text").forEach((el, i) => tl.to(el, { ...grow, yPercent: -50 }, BUDS[i].phase));
        tl.to(q(".s4__head"), { autoAlpha: 0, duration: 0.6 }, STEP.bloom - 0.3); // fa spazio alle parole chiave
        tl.to(q(".s4-kw__inner"), { ...grow, stagger: 0.12 }, STEP.bloom);
        tl.to(q(".s4__bloom .s4-anim"), { ...grow, stagger: 0.25 }, STEP.bloom + 0.3);

        // 3. Sblocco a fine video (fermo sull'ultimo fotogramma).
        //    Rete di sicurezza: sblocca comunque dopo la durata prevista.
        const textsEnd = (STEP.bloom + 1.1) * 1000;
        const t0 = performance.now();
        video.addEventListener(
          "ended",
          () => setTimeout(unlock, Math.max(0, textsEnd - (performance.now() - t0))),
          { once: true }
        );
        unlockTimer = setTimeout(unlock, Math.max((10 / RATE) * 1000, (STEP.bloom + 1.2) * 1000) + 400);
      };

      // Uscita verso l'alto (la slide non è più attiva): la timeline si
      // riavvolge, il video torna al primo fotogramma, pronto a ripartire.
      const rewind = () => {
        if (!running || reversing) return;
        running = false;
        unlock();
        video.pause();
        try {
          video.currentTime = 0;
        } catch {
          /* niente metadata: nulla da riavvolgere */
        }
        if (tl) tl.timeScale(2.5).reverse();
      };

      // Mostra il video "in avanti" o quello "al contrario"
      const showRev = (on) => {
        rev.style.opacity = on ? "1" : "0";
        video.style.opacity = on ? "0" : "1";
      };

      // Uscita verso l'alto con la rotella/lo swipe: riavvolgimento visibile
      // (video al contrario + testi in reverse), poi il deck sale alla 03.
      const reverseOut = () => {
        reversing = true;
        clearTimeout(unlockTimer);
        lock();
        video.pause();

        const dur = video.duration || 10;
        const startRev = () => {
          showRev(true);
          rev.playbackRate = REV_RATE;
          rev.play().catch(() => {});
        };
        try {
          // stesso fotogramma: il punto t in avanti è (durata − t) al contrario
          rev.currentTime = Math.max(0, dur - video.currentTime);
          rev.addEventListener("seeked", startRev, { once: true });
        } catch {
          startRev();
        }

        const revMs = (Math.max(0, video.currentTime) / REV_RATE) * 1000;
        if (tl) tl.timeScale(Math.max(1, tl.duration() / Math.max(0.6, revMs / 1000))).reverse();

        const finish = () => {
          rev.pause();
          try {
            video.currentTime = 0;
          } catch {
            /* nulla */
          }
          showRev(false);
          running = false;
          reversing = false;
          unlock();
          window.dispatchEvent(
            new CustomEvent("deck:goto", { detail: { index: SLIDE_INDEX - 1, fromBelow: true } })
          );
        };
        setTimeout(finish, revMs + 150);
      };

      onBeforeLeave = (e) => {
        const d = e.detail;
        if (d.from !== SLIDE_INDEX || d.dir >= 0 || !running || reversing) return;
        e.preventDefault(); // il passaggio lo chiediamo noi a fine reverse
        reverseOut();
      };
      window.addEventListener("deck:beforeleave", onBeforeLeave);

      // Avvio: la slide è attiva e la schermata del seme è tutta in vista
      // (entrando dall'alto la slide si apre dalla cima → schermata visibile)
      let visible = false;
      io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.intersectionRatio >= 0.9;
          if (visible && scroller?.classList.contains("is-active")) run();
        },
        { threshold: [0, 0.9] }
      );
      io.observe(screen);

      // Il deck cambia slide: fuori da questa → riavvolgi; dentro → parti
      onSlide = (e) => {
        if (e.detail.index !== SLIDE_INDEX) rewind();
        else if (visible) run();
      };
      window.addEventListener("deck:slide", onSlide);

      // Il copy sotto il video: dissolvenza leggera legata allo scroll
      if (scroller) {
        q(".s4-after__item").forEach((el) => {
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
      io?.disconnect();
      if (onSlide) window.removeEventListener("deck:slide", onSlide);
      if (onBeforeLeave) window.removeEventListener("deck:beforeleave", onBeforeLeave);
      clearTimeout(unlockTimer);
      scroller?.classList.remove("is-locked");
      window.dispatchEvent(new Event("deck:unlock"));
      ctx.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className="s4" id="seme" data-n="4" aria-labelledby="s4-title">
      {/* Schermata del seme: una viewport, il video e i testi a tempo */}
      <div ref={screenRef} className="s4__screen">
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
              <source src={REV_WEBM} type="video/webm" />
              <source src={REV_MP4} type="video/mp4" />
            </video>
            <div className="s4__veil" aria-hidden="true" />
            {/* sfumatura in basso: il video si scioglie nel blu del copy sotto */}
            <div className="s4__fade" aria-hidden="true" />

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

      {/* ── "Il filo vivo": il copy continua sotto, in scroll normale ── */}
      <div className="s4-after">
        <div className="s4-after__glow" aria-hidden="true" />
        <div className="s4-after__inner">
          <p className="s4-after__item s4-after__intro">
            Cresce, cambia, incontra nuove condizioni. Il filo che l’ha generata continua a offrire
            un punto da cui leggere ciò che accade e orientare ciò che verrà.
          </p>
          <p className="s4-after__item s4-after__statement">
            La coerenza è un <em>filo vivo</em> che permette all’impresa di evolvere continuando a
            riconoscersi.
          </p>
          <span className="s4-after__item s4-after__rule" aria-hidden="true" />
          <p className="s4-after__item s4-after__close">
            <span className="s4-after__pill">Poi la scelta comincia a vivere.</span>
          </p>
        </div>
      </div>
    </section>
  );
}

export { S4Seme };
