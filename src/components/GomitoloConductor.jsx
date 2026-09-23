import { useRef } from "react";
import useProgressLoop from "../hooks/useProgressLoop";
import "./GomitoloConductor.css";

// ═══ GOMITOLO CONDUCTOR — IL FILO CONDUTTORE ═══
// Il gomitolo di filo dorato accompagna il visitatore lungo tutte le sezioni
// della Home: rotola e si srotola proporzionalmente allo scroll, lasciando
// dietro di sé il filo vivo d'oro che unisce l'intero percorso (Hero → Sez 2 → Sez 3...).
//
// Performance estrema (60fps garantiti):
// - Aggiornamenti via requestAnimationFrame diretto su DOM ref (nessun re-render React)
// - Hardware-accelerated translate3d + rotate (anche la scia: scaleY, mai height)
// - Disattivazione con prefers-reduced-motion

export default function GomitoloConductor() {
  const gomitoloRef = useRef(null);
  const threadTrailRef = useRef(null);
  const glowRef = useRef(null);

  const getProgress = () => {
    const doc = document.documentElement;
    const scrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
    return Math.min(1, Math.max(0, window.scrollY / scrollable));
  };

  const onFrame = (p) => {
    const gomitolo = gomitoloRef.current;
    const trail = threadTrailRef.current;
    const glow = glowRef.current;
    if (!gomitolo || p === null) return;

    // Calcolo posizione verticale: dal 10% al 90% dell'altezza visibile
    const startY = window.innerHeight * 0.1;
    const endY = window.innerHeight * 0.88;
    const currentY = startY + p * (endY - startY);

    // Rotazione proporzionale allo scroll (effetto srotolamento gomitolo)
    const rotation = p * 1260; // compie più giri lungo la pagina

    gomitolo.style.transform = `translate3d(-50%, ${currentY}px, 0) rotate(${rotation}deg)`;

    // Il filo dorato traccia la scia fino alla posizione esatta del gomitolo.
    // scaleY su un filo alto 100vh (prima: style.height → layout a ogni frame)
    if (trail) {
      const scale = currentY / Math.max(1, window.innerHeight);
      trail.style.transform = `translate3d(-50%, 0, 0) scaleY(${scale})`;
    }

    if (glow) {
      glow.style.transform = `translate3d(-50%, ${currentY}px, 0)`;
    }
  };

  useProgressLoop(getProgress, onFrame, true, null);

  return (
    <aside className="gomitolo-conductor" aria-hidden="true">
      {/* Guida verticale di fondo */}
      <div className="gomitolo-conductor__track" />

      {/* Scia del filo dorato srotolato dal gomitolo */}
      <div className="gomitolo-conductor__trail" ref={threadTrailRef} />

      {/* Bagliore d'oro d'atmosfera */}
      <div className="gomitolo-conductor__glow" ref={glowRef} />

      {/* Il Gomitolo dorato (immagine pura ad altissima risoluzione) */}
      <div className="gomitolo-conductor__ball" ref={gomitoloRef}>
        <img
          src="/gomitolo.png"
          alt=""
          className="gomitolo-conductor__image"
          width="44"
          height="44"
          loading="eager"
        />
        {/* Il filo vivo che esce dal gomitolo */}
        <span className="gomitolo-conductor__loose-thread" />
      </div>

      {/* Nodi segnaletici per le tappe */}
      <div className="gomitolo-conductor__milestones">
        <span className="gomitolo-conductor__node gomitolo-conductor__node--1" title="Hero" />
        <span className="gomitolo-conductor__node gomitolo-conductor__node--2" title="La realtà non è frammentata" />
        <span className="gomitolo-conductor__node gomitolo-conductor__node--3" title="Decidere è tenere insieme" />
      </div>
    </aside>
  );
}
