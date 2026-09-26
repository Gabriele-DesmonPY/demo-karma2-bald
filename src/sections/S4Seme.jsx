import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SiteFooter from "../components/SiteFooter";
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

   Dissolvenze: i due video vivono in un contenitore (.s4__media) che
   parte invisibile. Entra in dissolvenza quando la sequenza parte ed
   esce in dissolvenza prima di ogni reset: il fotogramma della goccia
   non compare mai "a scatto" (currentTime = 0 solo a video invisibile).

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
  const mediaRef = useRef(null);
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
    const media = mediaRef.current;
    if (!section || !screen || !video || !rev || !media) return;
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
        gsap.set(q(".s4__scrim"), { autoAlpha: 1 });
      };

      if (reduced) {
        video.removeAttribute("autoplay");
        video.poster = "/seme-germoglio-fiore.jpg";
        video.preload = "none";
        gsap.set(media, { opacity: 1 });
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

      // Dissolvenze del contenitore video
      const fadeIn = () => gsap.to(media, { opacity: 1, duration: 0.6, ease: "power2.out", overwrite: true });
      const fadeOut = (onComplete) =>
        gsap.to(media, { opacity: 0, duration: 0.4, ease: "power2.in", overwrite: true, onComplete });

      const run = () => {
        if (running) return;
        running = true;
        // La sequenza parte con la schermata già al 90% in vista, ma uno
        // scroll può essere ancora in corso (es. scroll morbido dal footer).
        // Il blocco mette la slide in overflow: clip (Lenis) e scrollTop
        // leggerebbe 0 mentre l'offset reale resta, desincronizzando Lenis:
        // allo sblocco la slide resterebbe a pochi px dalla cima e la rotella
        // non tornerebbe più alla 03. La portiamo esattamente in cima.
        if (scroller && scroller.scrollTop > 0 && scroller.scrollTop < scroller.clientHeight * 0.25) {
          scroller.scrollTop = 0;
        }
        lock();

        // 1. Video dall'inizio, accelerato
        try {
          video.currentTime = 0;
        } catch {
          /* metadata non ancora pronti: parte comunque da 0 */
        }
        video.playbackRate = RATE;
        video.play().catch(() => {});
        fadeIn(); // la goccia emerge dal blu, non compare a scatto
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
        // velatura scura dietro la frase finale: statica, entra solo in opacità
        tl.to(q(".s4__scrim"), { autoAlpha: 1, duration: 0.9, ease: "power1.out" }, STEP.bloom);
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
        fadeOut(() => {
          // il reset avviene solo quando il video è già invisibile
          try {
            video.currentTime = 0;
          } catch {
            /* niente metadata: nulla da riavvolgere */
          }
          showRev(false);
        });
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

        // a fine riavvolgimento: dissolvenza al blu, poi reset e passaggio alla 03
        const finish = () => {
          rev.pause();
          fadeOut(() => {
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
          });
        };
        // la dissolvenza parte sugli ultimi istanti del riavvolgimento
        setTimeout(finish, Math.max(0, revMs - 250));
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
          const active = scroller?.classList.contains("is-active");
          if (visible && active) {
            if (running && !reversing) fadeIn(); // rientro dal copy sotto
            else run();
          } else if (!entry.isIntersecting && running && !reversing) {
            // scesa nel copy sotto: il video esce in dissolvenza, fermo
            fadeOut(() => video.pause());
          }
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
    <div className="s4-root">
    <section ref={sectionRef} className="s4" id="seme" data-n="4" aria-labelledby="s4-title">
      {/* Schermata del seme: una viewport, il video e i testi a tempo */}
      <div ref={screenRef} className="s4__screen">
          {/* Riquadro 16:9 del video: tutto ciò che deve "seguire i rami"
              vive qui dentro, in coordinate percentuali */}
          <div className="s4__stage">
            {/* contenitore dei due video: parte invisibile, entra/esce in dissolvenza */}
            <div ref={mediaRef} className="s4__media">
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
