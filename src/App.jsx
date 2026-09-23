import { useEffect, useRef, useState, useCallback } from "react";
import "./sandbox.css";
import "./sections/home.css"; // stili di base validati del progetto (kh-*)
import S1Hero from "./sections/S1Hero";
import { S2Origine, S2Frammentazione } from "./sections/S2Complessita";

// Sandbox Karma 2 — navigazione a swipe cinematografico a pieno schermo.
// Ogni sezione è una slide del deck: il passaggio avviene con swipe
// fluido su rotella, touch, frecce da tastiera o clic sull'indice laterale.
// Le slide con contenuto più alto della viewport (es. la tappa 03)
// scorrono al loro interno: il passaggio a deck avviene solo ai bordi.

const SECTIONS = [
  { n: 1, id: "hero", nome: "Hero / Apertura", alta: true, fatto: true },
  { n: 2, id: "complessita", nome: "Origine e contesto", alta: true, fatto: true },
  { n: 3, id: "frammentazione", nome: "La realtà non è frammentata", alta: false, fatto: true },
  { n: 4, id: "tenere-insieme", nome: "Decidere è tenere insieme", alta: false },
  { n: 5, id: "domanda", nome: "La domanda", alta: false },
  { n: 6, id: "spirale-tappe", nome: "Entrare nella spirale", alta: true },
  { n: 7, id: "ecologia", nome: "Ecologia della decisione", alta: false },
  { n: 8, id: "seme", nome: "Il centro / Il seme", alta: true },
  { n: 9, id: "bisso", nome: "Il filo / Il bisso", alta: true },
  { n: 10, id: "crescere", nome: "Crescere insieme", alta: false },
  { n: 11, id: "mappa-cta", nome: "Mappa Karma + CTA", alta: true },
];

const AVAILABLE_COUNT = 3; // Attualmente sezioni 1, 2 e 3 pronte

export default function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  const isTransitioningRef = useRef(false);
  const slideRefs = useRef([]);
  const touchStartYRef = useRef(0);

  const goToSlide = useCallback((targetIndex) => {
    if (targetIndex < 0 || targetIndex >= AVAILABLE_COUNT) return;
    if (isTransitioningRef.current) return;

    isTransitioningRef.current = true;
    setActiveIndex(targetIndex);

    // La slide di destinazione riparte sempre dal suo inizio
    const target = slideRefs.current[targetIndex];
    if (target) target.scrollTop = 0;

    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 800);
  }, []);

  // ── Passo avanti/indietro consapevole dello scroll interno ──
  // Le slide più alte della viewport scorrono al loro interno: lo
  // swipe avanti avanza solo quando si è in fondo, quello indietro
  // torna solo dalla cima — come tra la Sezione 1 e la Sezione 2.
  const stepSlide = useCallback(
    (dir) => {
      if (isTransitioningRef.current) return;
      const scroller = document.querySelector(`.sandbox-slide[data-slide="${activeIndex}"]`);
      const scrollable = scroller && scroller.scrollHeight - scroller.clientHeight > 10;

      if (dir > 0) {
        const atBottom =
          !scrollable ||
          scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 10;
        if (atBottom && activeIndex < AVAILABLE_COUNT - 1) goToSlide(activeIndex + 1);
      } else {
        const atTop = !scroller || scroller.scrollTop <= 10;
        if (atTop && activeIndex > 0) goToSlide(activeIndex - 1);
      }
    },
    [activeIndex, goToSlide]
  );

  // Gestione Wheel (rotella del mouse / touchpad)
  useEffect(() => {
    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) < 25) return;
      stepSlide(e.deltaY > 0 ? 1 : -1);
    };
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [stepSlide]);

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
        stepSlide(1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        stepSlide(-1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stepSlide]);

  return (
    <div className="sandbox-viewport">
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
      <div
        className="sandbox-track"
        style={{
          transform: `translate3d(0, -${activeIndex * 100}vh, 0)`,
        }}
      >
        {/* Slide 0: Sezione 1 — Hero */}
        <div
          className="sandbox-slide"
          ref={(el) => (slideRefs.current[0] = el)}
          data-slide="0"
        >
          <S1Hero />
        </div>

        {/* Slide 1: Sezione 2 — Origine e contesto (piena viewport, isolata) */}
        <div
          className="sandbox-slide"
          ref={(el) => (slideRefs.current[1] = el)}
          data-slide="1"
        >
          <S2Origine />
        </div>

        {/* Slide 2: Sezione 3 — La realtà non è frammentata (scrollabile) */}
        <div
          className="sandbox-slide"
          ref={(el) => (slideRefs.current[2] = el)}
          data-slide="2"
        >
          <S2Frammentazione />
        </div>
      </div>

      {/* Badge interattivo di swipe */}
      {activeIndex === 0 ? (
        <button
          type="button"
          className="sandbox-swipe-hint"
          onClick={() => goToSlide(1)}
        >
          <span>Swipe Sezione 02</span>
          <span className="sandbox-swipe-hint__arrow" aria-hidden="true">
            ↓
          </span>
        </button>
      ) : activeIndex === 1 ? (
        <button
          type="button"
          className="sandbox-swipe-hint"
          onClick={() => goToSlide(2)}
        >
          <span>Swipe Sezione 03</span>
          <span className="sandbox-swipe-hint__arrow" aria-hidden="true">
            ↓
          </span>
        </button>
      ) : (
        <button
          type="button"
          className="sandbox-swipe-hint"
          onClick={() => goToSlide(1)}
        >
          <span>↑ Torna a Sezione 02</span>
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