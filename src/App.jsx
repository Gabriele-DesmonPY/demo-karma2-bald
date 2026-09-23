import { useEffect, useRef, useState, useCallback } from "react";
import "./sandbox.css";
import "./sections/home.css"; // stili di base validati del progetto (kh-*)
import S1Hero from "./sections/S1Hero";
import S2Complessita from "./sections/S2Complessita";

// Sandbox Karma 2 — navigazione a swipe cinematografico a pieno schermo.
// Ogni sezione occupa 100vh: il passaggio avviene con swipe fluido su
// rotella, touch, frecce da tastiera o clic sull'indice laterale.

const SECTIONS = [
  { n: 1, id: "hero", nome: "Hero / Apertura", alta: true, fatto: true },
  { n: 2, id: "complessita", nome: "La realtà non è frammentata", alta: false, fatto: true },
  { n: 3, id: "tenere-insieme", nome: "Decidere è tenere insieme", alta: false },
  { n: 4, id: "domanda", nome: "La domanda", alta: false },
  { n: 5, id: "spirale-tappe", nome: "Entrare nella spirale", alta: true },
  { n: 6, id: "ecologia", nome: "Ecologia della decisione", alta: false },
  { n: 7, id: "seme", nome: "Il centro / Il seme", alta: true },
  { n: 8, id: "bisso", nome: "Il filo / Il bisso", alta: true },
  { n: 9, id: "crescere", nome: "Crescere insieme", alta: false },
  { n: 10, id: "mappa-cta", nome: "Mappa Karma + CTA", alta: true },
];

const AVAILABLE_COUNT = 2; // Attualmente sezioni 1 e 2 pronte

export default function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  // La Sezione 2 contiene due "tappe" (02 Origine → 03 La realtà non è
  // frammentata): quando lo scroll interno supera la metà della viewport
  // l'indicatore laterale passa da 02 a 03.
  const [slide1Deep, setSlide1Deep] = useState(false);
  const isTransitioningRef = useRef(false);
  const slide1Ref = useRef(null);
  const touchStartYRef = useRef(0);

  // Indicatore laterale: in slide 1 segue lo scroll interno (02 ↔ 03)
  const activeSection = activeIndex === 1 && slide1Deep ? 3 : activeIndex + 1;

  // Scroll interno della slide 2: guida il passaggio D2 → D3
  useEffect(() => {
    const node = slide1Ref.current;
    if (!node) return;
    const handleScroll = () => {
      setSlide1Deep(node.scrollTop > window.innerHeight * 0.45);
    };
    node.addEventListener("scroll", handleScroll, { passive: true });
    return () => node.removeEventListener("scroll", handleScroll);
  }, []);

  const goToSlide = useCallback((targetIndex) => {
    if (targetIndex < 0 || targetIndex >= AVAILABLE_COUNT) return;
    if (isTransitioningRef.current) return;

    isTransitioningRef.current = true;
    setActiveIndex(targetIndex);

    // Se si torna alla sezione 2, reset dello scroll interno
    // (e l'indicatore torna a 02)
    if (targetIndex === 1 && slide1Ref.current) {
      slide1Ref.current.scrollTop = 0;
      setSlide1Deep(false);
    }

    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 800);
  }, []);

  // Gestione Wheel (rotella del mouse / touchpad)
  useEffect(() => {
    const handleWheel = (e) => {
      if (isTransitioningRef.current) return;

      const delta = e.deltaY;
      if (Math.abs(delta) < 25) return;

      if (delta > 0) {
        // Scroll verso il basso
        if (activeIndex === 0) {
          goToSlide(1);
        }
      } else {
        // Scroll verso l'alto
        if (activeIndex === 1) {
          // Torna su solo se il contenuto interno della sezione 2 è in cima
          const scrollTop = slide1Ref.current ? slide1Ref.current.scrollTop : 0;
          if (scrollTop <= 10) {
            goToSlide(0);
          }
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [activeIndex, goToSlide]);

  // Gestione Touch (swipe su mobile)
  useEffect(() => {
    const handleTouchStart = (e) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      if (isTransitioningRef.current) return;
      const touchEndY = e.changedTouches[0].clientY;
      const diffY = touchStartYRef.current - touchEndY;

      if (Math.abs(diffY) > 45) {
        if (diffY > 0) {
          // Swipe verso l'alto (vai avanti)
          if (activeIndex === 0) goToSlide(1);
        } else {
          // Swipe verso il basso (torna indietro)
          if (activeIndex === 1) {
            const scrollTop = slide1Ref.current ? slide1Ref.current.scrollTop : 0;
            if (scrollTop <= 10) goToSlide(0);
          }
        }
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [activeIndex, goToSlide]);

  // Gestione Tastiera (Frecce giù/su, PageDown/PageUp)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isTransitioningRef.current) return;
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        if (activeIndex === 0) goToSlide(1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        if (activeIndex === 1) {
          const scrollTop = slide1Ref.current ? slide1Ref.current.scrollTop : 0;
          if (scrollTop <= 10) goToSlide(0);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, goToSlide]);

  return (
    <div className="sandbox-viewport">
      {/* Indice laterale fisso interattivo */}
      <nav className="sandbox-index" aria-label="Indice sezioni">
        {SECTIONS.map((s) => {
          const isActive = activeSection === s.n;
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
        <div className="sandbox-slide" data-slide="0">
          <S1Hero />
        </div>

        {/* Slide 1: Sezione 2 — La realtà non è frammentata */}
        <div className="sandbox-slide" ref={slide1Ref} data-slide="1">
          <S2Complessita />
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
      ) : (
        <button
          type="button"
          className="sandbox-swipe-hint"
          onClick={() => goToSlide(0)}
        >
          <span>↑ Torna a Hero 01</span>
        </button>
      )}

      {/* Badge informativo di stato in basso a sinistra */}
      <div className="sandbox-badge">
        Karma 2 Sandbox · Sezione <strong>{String(activeSection).padStart(2, "0")}</strong> di 10
      </div>
    </div>
  );
}