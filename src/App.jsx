import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./sandbox.css";
import "./sections/home.css"; // stili di base validati del progetto (kh-*)
import S1Hero from "./sections/S1Hero";
import S2Origine from "./sections/S2Origine";
import S3Realta from "./sections/S3Realta";
import S4Seme from "./sections/S4Seme";
import S5KarMap from "./sections/S5KarMap";
import SiteHeader from "./components/SiteHeader";

// Sandbox Karma 2 — navigazione a swipe cinematografico a pieno schermo.
// Ogni sezione è una slide del deck: il passaggio avviene con swipe
// fluido su rotella, touch, frecce da tastiera o clic sull'indice laterale.
// Le slide con contenuto più alto della viewport (es. la tappa 03)
// scorrono al loro interno: il passaggio a deck avviene solo ai bordi.
//
// Performance: nessuno smooth-scroll JS (niente Lenis/ScrollSmoother): lo
// scroll interno delle slide è nativo, sul compositor. La traccia si muove
// solo con translate3d (transizione CSS), gli handler wheel/touch sono
// passive e la slide attiva riceve la classe .is-active: le animazioni
// infinite delle slide non attive restano in pausa (vedi sandbox.css).

const SECTIONS = [
  { n: 1, id: "hero", nome: "Hero / Apertura", alta: true, fatto: true },
  { n: 2, id: "complessita", nome: "Origine e contesto", alta: true, fatto: true },
  { n: 3, id: "frammentazione", nome: "La realtà non è frammentata", alta: false, fatto: true },
  { n: 4, id: "seme", nome: "I concetti che germogliano dal seme", alta: true, fatto: true },
  { n: 5, id: "karmap", nome: "KarMAP · Ciò che ti restituiamo", alta: true, fatto: true },
  { n: 6, id: "spirale-tappe", nome: "Entrare nella spirale", alta: true },
  { n: 7, id: "ecologia", nome: "Ecologia della decisione", alta: false },
  { n: 8, id: "seme", nome: "Il centro / Il seme", alta: true },
  { n: 9, id: "bisso", nome: "Il filo / Il bisso", alta: true },
  { n: 10, id: "crescere", nome: "Crescere insieme", alta: false },
  { n: 11, id: "mappa-cta", nome: "Mappa Karma + CTA", alta: true },
];

// Durata del passaggio tra slide: breve e reattiva (prima 1100 ms → effetto
// "PowerPoint").
const DECK_MS = 600;
// Passaggio "etereo" (cross-fade, niente tagli): le slide sono impilate sulla
// stessa tela e si dissolvono l'una nell'altra invece di scorrere come
// pagine. Uscita: opacità ↓, scale 0.98, blur 4px. Entrata: da opacità 0 e
// 30px di scarto verticale (dal basso scendendo, dall'alto risalendo).
const DECK_EASE = "cubic-bezier(0.25, 1, 0.5, 1)";
const ENTER_DELAY = 90; // l'entrata parte appena dopo l'uscita: dissolvenza incrociata
// Una "gesture" di rotella/trackpad = un flusso di eventi wheel senza pause
// più lunghe di così. Ogni gesture sposta il deck al massimo di UNA slide:
// l'inerzia del trackpad non fa saltare due sezioni, ma un nuovo colpo di
// rotella dopo la pausa risponde subito, senza aspettare animazioni.
const WHEEL_GESTURE_GAP = 180;

// Voci del menu → slide del deck.
// "contatti" punta alla sezione finale (Mappa Karma + CTA, n.11); finché non
// è costruita, porta al fondo dell'ultima sezione disponibile.
const navTarget = (id) => {
  if (id === "home") return { index: 0 };
  if (id === "karmaround") return { index: 1 };
  const finale = SECTIONS.findIndex((s) => s.id === "mappa-cta");
  if (finale >= 0 && finale < AVAILABLE_COUNT) return { index: finale };
  return { index: AVAILABLE_COUNT - 1, fromBelow: true };
};
const navActive = (index) => {
  const finale = SECTIONS.findIndex((s) => s.id === "mappa-cta");
  if (index === 0) return "home";
  if (index === finale) return "contatti";
  return "karmaround";
};

const AVAILABLE_COUNT = 5; // sezioni 1–5 pronte

export default function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  // ultimo passaggio richiesto (da → a): lo legge l'effetto che anima il deck
  const transitionRef = useRef(null);
  const activeIndexRef = useRef(0);
  // slide in uscita: resta visibile (sotto) finché la sua dissolvenza finisce
  const [leavingIndex, setLeavingIndex] = useState(null);
  const isTransitioningRef = useRef(false);
  const slideRefs = useRef([]);
  const touchStartYRef = useRef(0);
  // istanza Lenis della slide attiva (smooth scroll interno)
  const lenisRef = useRef(null);
  // blocco temporaneo chiesto da una sezione (es. sequenza del seme)
  const lockedRef = useRef(false);
  // la slide attiva è scesa oltre la cima? (nasconde il badge in basso,
  // così non si sovrappone mai al contenuto che scorre)
  const [slideScrolled, setSlideScrolled] = useState(false);

  // fromBelow: si arriva risalendo → la slide di destinazione si apre
  // dal suo FONDO (stato finale delle sue animazioni), non dalla cima.
  const goToSlide = useCallback((targetIndex, { fromBelow = false } = {}) => {
    if (targetIndex < 0 || targetIndex >= AVAILABLE_COUNT) return;
    if (isTransitioningRef.current || lockedRef.current) return;

    isTransitioningRef.current = true;
    const from = activeIndexRef.current;
    if (from !== targetIndex) {
      transitionRef.current = { from, to: targetIndex };
      // nello stesso render: la slide uscente resta in scena (sotto)
      setLeavingIndex(from);
    }
    activeIndexRef.current = targetIndex;
    setActiveIndex(targetIndex);

    // La slide di destinazione riparte sempre dal suo inizio
    const target = slideRefs.current[targetIndex];
    if (target) target.scrollTop = fromBelow ? target.scrollHeight : 0;

    // durata allineata al cross-fade del deck
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, DECK_MS + ENTER_DELAY);
  }, []);

  // ── Passo avanti/indietro consapevole dello scroll interno ──
  // Le slide più alte della viewport scorrono al loro interno: lo
  // swipe avanti avanza solo quando si è in fondo, quello indietro
  // torna solo dalla cima — come tra la Sezione 1 e la Sezione 2.
  const stepSlide = useCallback(
    (dir) => {
      if (isTransitioningRef.current || lockedRef.current) return;
      const scroller = document.querySelector(`.sandbox-slide[data-slide="${activeIndex}"]`);
      const scrollable = scroller && scroller.scrollHeight - scroller.clientHeight > 10;

      if (dir > 0) {
        const atBottom =
          !scrollable ||
          scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 10;
        if (atBottom && activeIndex < AVAILABLE_COUNT - 1) goToSlide(activeIndex + 1);
      } else {
        const atTop = !scroller || scroller.scrollTop <= 10;
        if (atTop && activeIndex > 0) {
          // una sezione può trattenere l'uscita verso l'alto (es. la 04
          // riavvolge il video al contrario) e poi chiedere lei il passaggio
          const ev = new CustomEvent("deck:beforeleave", {
            cancelable: true,
            detail: { from: activeIndex, dir: -1 },
          });
          if (!window.dispatchEvent(ev)) return;
          goToSlide(activeIndex - 1, { fromBelow: true });
        }
      }
    },
    [activeIndex, goToSlide]
  );

  // Tastiera: dentro una slide scrollabile le frecce scorrono il suo
  // contenuto (il preventDefault blocca lo scroll nativo, quindi lo
  // replichiamo); ai bordi passano alla slide successiva/precedente.
  const keyStep = useCallback(
    (dir) => {
      if (isTransitioningRef.current || lockedRef.current) return;
      const scroller = slideRefs.current[activeIndex];
      if (scroller && scroller.scrollHeight - scroller.clientHeight > 10) {
        const atEdge =
          dir > 0
            ? scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 10
            : scroller.scrollTop <= 10;
        if (!atEdge) {
          const delta = dir * scroller.clientHeight * 0.8;
          if (lenisRef.current) lenisRef.current.scrollTo(scroller.scrollTop + delta);
          else scroller.scrollBy({ top: delta, behavior: "smooth" });
          return;
        }
      }
      stepSlide(dir);
    },
    [activeIndex, stepSlide]
  );

  useEffect(() => {
    const el = slideRefs.current[activeIndex];
    if (!el) return;
    const onScroll = () => {
      const next = el.scrollTop > 40;
      setSlideScrolled((prev) => (prev === next ? prev : next));
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [activeIndex]);

  // ── Smooth scroll luxury con Lenis, sincronizzato con GSAP ScrollTrigger ──
  // Il sito è un deck: la finestra non scorre, scorre la slide attiva.
  // Lenis vive quindi sul contenitore della slide attiva (wrapper) e viene
  // ricreato a ogni cambio slide. Un solo motore di frame: il ticker di GSAP
  // (niente rAF parallelo), così filo, card e righe restano in sincrono.
  useEffect(() => {
    const wrapper = slideRefs.current[activeIndex];
    if (!wrapper) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const lenis = new Lenis({
      wrapper,
      content: wrapper.firstElementChild || wrapper,
      duration: 0.6, // prima 1.2: lo scroll interno segue subito la rotella
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.1,
      syncTouch: false, // sul touch resta lo scroll nativo (ex smoothTouch: false)
    });
    lenisRef.current = lenis;
    if (lockedRef.current) lenis.stop();

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      if (lenisRef.current === lenis) lenisRef.current = null;
    };
  }, [activeIndex]);

  // ── Cross-fade del deck (Web Animations API: transform/opacity/filter,
  // tutto sul compositor; nessun re-render React durante l'animazione).
  // useLayoutEffect: le animazioni partono prima del primo paint del nuovo
  // stato, quindi nessun fotogramma "scoperto" (niente flash).
  useLayoutEffect(() => {
    const t = transitionRef.current;
    if (!t) return;
    transitionRef.current = null;
    const out = slideRefs.current[t.from];
    const inn = slideRefs.current[t.to];
    const dir = t.to > t.from ? 1 : -1;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timing = { duration: reduced ? 200 : DECK_MS, easing: DECK_EASE };

    [out, inn].forEach((el) => el?.getAnimations().forEach((a) => a.cancel()));

    inn?.animate(
      reduced
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [
            { opacity: 0, transform: `translate3d(0, ${dir * 30}px, 0)` },
            { opacity: 1, transform: "translate3d(0, 0, 0)" },
          ],
      { ...timing, delay: reduced ? 0 : ENTER_DELAY, fill: "backwards" }
    );

    if (out) {
      const outAnim = out.animate(
        reduced
          ? [{ opacity: 1 }, { opacity: 0 }]
          : [
              { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)", filter: "blur(0px)" },
              { opacity: 0.2, offset: 0.55 },
              { opacity: 0, transform: `translate3d(0, ${dir * -18}px, 0) scale(0.98)`, filter: "blur(4px)" },
            ],
        { ...timing, fill: "forwards" }
      );
      // a dissolvenza finita la slide torna "parcheggiata" fuori scena
      outAnim.finished
        .then(() => setLeavingIndex((cur) => (cur === t.from ? null : cur)))
        .catch(() => {});
    }
  }, [activeIndex]);

  // Le slide tornate a riposo perdono lo stato congelato dell'uscita, nello
  // stesso fotogramma in cui ricevono la classe che le nasconde.
  useLayoutEffect(() => {
    slideRefs.current.forEach((el, i) => {
      if (!el || i === activeIndex || i === leavingIndex) return;
      el.getAnimations().forEach((a) => a.cancel());
    });
  }, [activeIndex, leavingIndex]);

  // Avvisa le sezioni quale slide è attiva (per avviare/riavvolgere
  // le sequenze a tempo, es. Sezione 04)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("deck:slide", { detail: { index: activeIndex } }));
  }, [activeIndex]);

  // Blocco/sblocco chiesto dalle sezioni: ferma Lenis e la navigazione
  useEffect(() => {
    const lock = () => {
      lockedRef.current = true;
      lenisRef.current?.stop();
    };
    const unlock = () => {
      lockedRef.current = false;
      lenisRef.current?.start();
    };
    // passaggio di slide richiesto da una sezione (dopo una sua animazione)
    const go = (e) => goToSlide(e.detail.index, { fromBelow: !!e.detail.fromBelow });
    window.addEventListener("deck:lock", lock);
    window.addEventListener("deck:unlock", unlock);
    window.addEventListener("deck:goto", go);
    return () => {
      window.removeEventListener("deck:lock", lock);
      window.removeEventListener("deck:unlock", unlock);
      window.removeEventListener("deck:goto", go);
    };
  }, [goToSlide]);

  // Menu globale: porta il deck alla slide della voce scelta (la transizione
  // del deck È lo scroll morbido) e aggiorna l'hash dell'indirizzo.
  const navigate = useCallback(
    (id) => {
      const t = navTarget(id);
      if (t.index === activeIndex && !t.fromBelow) return;
      goToSlide(t.index, { fromBelow: !!t.fromBelow });
      try {
        history.replaceState(null, "", `#${id}`);
      } catch {
        /* nulla */
      }
    },
    [activeIndex, goToSlide]
  );

  // Apertura con un hash (#karmaround, #contatti): si parte da lì
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id && id !== "home" && ["karmaround", "contatti"].includes(id)) {
      const t = navTarget(id);
      goToSlide(t.index, { fromBelow: !!t.fromBelow });
    }
  }, [goToSlide]);

  // Gestione Wheel (rotella del mouse / touchpad)
  // - Dentro una slide più alta della viewport la rotella scorre il
  //   contenuto (Lenis); il deck passa alla slide vicina solo quando si è
  //   già al bordo E parte un nuovo gesto: arrivare in fondo scorrendo non
  //   fa "volare" via di colpo alla sezione dopo.
  // - Un solo passaggio per gesto: la coda d'inerzia del trackpad viene
  //   ignorata finché non c'è una pausa (o un nuovo impulso più forte).
  const lastWheelRef = useRef({ t: 0, abs: 0, consumed: false });
  useEffect(() => {
    const handleWheel = (e) => {
      const now = performance.now();
      const w = lastWheelRef.current;
      const abs = Math.abs(e.deltaY);
      const sameGesture = now - w.t < WHEEL_GESTURE_GAP && abs <= w.abs * 1.6 + 4;
      w.t = now;
      w.abs = abs;
      if (!sameGesture) w.consumed = false;

      if (abs < 4) return;
      if (isTransitioningRef.current || lockedRef.current) {
        w.consumed = true;
        return;
      }
      if (w.consumed) return;

      const dir = e.deltaY > 0 ? 1 : -1;
      const scroller = slideRefs.current[activeIndex];
      const scrollable = scroller && scroller.scrollHeight - scroller.clientHeight > 10;
      const atEdge =
        !scrollable ||
        (dir > 0
          ? scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 10
          : scroller.scrollTop <= 10);
      // gesto usato per scorrere dentro la slide: non cambia sezione
      if (!atEdge) {
        w.consumed = true;
        return;
      }
      if (abs < 12) return; // micro-tocchi del trackpad
      w.consumed = true;
      stepSlide(dir);
    };
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [activeIndex, stepSlide]);

  // Gestione Touch (swipe su mobile)
  useEffect(() => {
    const handleTouchStart = (e) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      const diffY = touchStartYRef.current - e.changedTouches[0].clientY;
      if (Math.abs(diffY) > 45) {
        stepSlide(diffY > 0 ? 1 : -1);
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [stepSlide]);

  // Gestione Tastiera (Frecce giù/su, PageDown/PageUp)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        keyStep(1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        keyStep(-1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [keyStep]);

  // Le animazioni SMIL (<animate>, <animateMotion>) girano sul main thread
  // anche fuori schermo e forzano layout + paint a ogni frame: le mettiamo
  // in pausa nelle slide non attive (le CSS le ferma .is-active in sandbox.css).
  useEffect(() => {
    slideRefs.current.forEach((slide, i) => {
      if (!slide) return;
      slide.querySelectorAll("svg").forEach((svg) => {
        if (svg.ownerSVGElement || typeof svg.pauseAnimations !== "function") return;
        if (i === activeIndex) svg.unpauseAnimations();
        else svg.pauseAnimations();
      });
    });
  }, [activeIndex]);

  // Stato di ogni slide sulla tela comune:
  // is-active (in scena) · is-leaving (si sta dissolvendo) ·
  // is-before / is-after (parcheggiate fuori scena, sopra o sotto: così gli
  // IntersectionObserver delle sezioni scattano solo quando entrano davvero)
  const slideClass = (i) =>
    "sandbox-slide" +
    (activeIndex === i
      ? " is-active"
      : leavingIndex === i
        ? " is-leaving"
        : i < activeIndex
          ? " is-before"
          : " is-after");

  return (
    <div className="sandbox-viewport" data-tone={activeIndex === 1 ? "light" : "dark"}>
      {/* Header / menu globale */}
      <SiteHeader
        active={navActive(activeIndex)}
        tone={activeIndex === 1 ? "light" : "dark"}
        onNavigate={navigate}
      />

      {/* Indice laterale fisso interattivo */}
      <nav className="sandbox-index" aria-label="Indice sezioni">
        {SECTIONS.map((s) => {
          const isActive = activeIndex + 1 === s.n;
          return (
            <button
              key={s.n}
              type="button"
              disabled={!s.fatto}
              onClick={() => s.fatto && goToSlide(s.n - 1)}
              title={`${s.n} — ${s.nome}`}
              className={
                "sandbox-index__item" +
                (s.fatto ? "" : " sandbox-index__item--todo") +
                (isActive ? " sandbox-index__item--on" : "")
              }
            >
              {String(s.n).padStart(2, "0")}
            </button>
          );
        })}
      </nav>

      {/* Traccia di swipe a sezioni (fullpage deck) */}
      {/* Tela unica: navy + trama d'oro, ferma dietro a tutte le slide.
          Si intravede solo durante le dissolvenze, così il passaggio non
          "salta" mai da un fondo all'altro. */}
      <div className="sandbox-backdrop" aria-hidden="true" />

      <div className="sandbox-track">
        {/* Slide 0: Sezione 1 — Hero */}
        <div
          className={slideClass(0)}
          ref={(el) => (slideRefs.current[0] = el)}
          data-slide="0"
        >
          <S1Hero />
        </div>

        {/* Slide 1: Sezione 2 — Origine e contesto (piena viewport, isolata) */}
        <div
          className={slideClass(1)}
          id="karmaround"
          ref={(el) => (slideRefs.current[1] = el)}
          data-slide="1"
        >
          <S2Origine />
        </div>

        {/* Slide 2: Sezione 3 — La realtà non è frammentata (scrollabile) */}
        <div
          className={slideClass(2)}
          ref={(el) => (slideRefs.current[2] = el)}
          data-slide="2"
        >
          <S3Realta />
        </div>

        {/* Slide 3: Sezione 4 — I concetti che germogliano dal seme (video in scrub) */}
        <div
          className={slideClass(3)}
          ref={(el) => (slideRefs.current[3] = el)}
          data-slide="3"
        >
          <S4Seme />
        </div>

        {/* Slide 4: Sezione 5 — KarMAP: spirale + Questionario / Calendario (+ footer) */}
        <div
          className={slideClass(4)}
          ref={(el) => (slideRefs.current[4] = el)}
          data-slide="4"
        >
          <S5KarMap />
        </div>
      </div>

      {/* Badge interattivo di swipe (sulla slide 1 — Sezione 02 — nessun badge) */}
      {activeIndex === 0 ? (
        slideScrolled ? null : (
        <button
          type="button"
          className="sandbox-swipe-hint"
          // sotto la hero ora c'è la citazione: si scorre prima lì
          onClick={() => keyStep(1)}
        >
          <span>Swipe Sezione 02</span>
          <span className="sandbox-swipe-hint__arrow" aria-hidden="true">
            ↓
          </span>
        </button>
        )
      ) : activeIndex === 1 || slideScrolled ? null : (
        <button
          type="button"
          className="sandbox-swipe-hint"
          onClick={() => goToSlide(activeIndex - 1)}
        >
          <span>↑ Torna a Sezione {String(activeIndex).padStart(2, "0")}</span>
        </button>
      )}

      {/* Badge informativo di stato in basso a sinistra */}
      <div className="sandbox-badge">
        Karma 2 Sandbox · Sezione <strong>{String(activeIndex + 1).padStart(2, "0")}</strong> di{" "}
        {SECTIONS.length}
      </div>
    </div>
  );
}