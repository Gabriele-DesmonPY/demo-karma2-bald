import { useEffect, useRef } from "react";

// useProgressLoop — Loop rAF persistente per animazioni legate allo scroll.
// Applica le trasformazioni direttamente al DOM senza re-render React.
// Gating con IntersectionObserver + gestione automatica di prefers-reduced-motion.
export default function useProgressLoop(getProgress, onFrame, enabled = true, observeRef = null) {
  const getProgressRef = useRef(getProgress);
  const onFrameRef = useRef(onFrame);
  getProgressRef.current = getProgress;
  onFrameRef.current = onFrame;

  useEffect(() => {
    if (!enabled) {
      onFrameRef.current(null);
      return undefined;
    }

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = null;
    let inView = true;
    let last = undefined;

    const tick = () => {
      const p = getProgressRef.current();
      if (p !== last) {
        last = p;
        onFrameRef.current(p);
      }
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };

    const sync = () => {
      if (mq.matches) {
        stop();
        onFrameRef.current(1);
      } else if (inView) {
        start();
      } else {
        stop();
      }
    };

    sync();
    mq.addEventListener("change", sync);

    let io = null;
    const node = observeRef?.current;
    if (node) {
      io = new IntersectionObserver(
        ([entry]) => {
          inView = entry.isIntersecting;
          sync();
        },
        { rootMargin: "150% 0px" }
      );
      io.observe(node);
    }

    return () => {
      stop();
      mq.removeEventListener("change", sync);
      io?.disconnect();
    };
  }, [enabled, observeRef]);
}
