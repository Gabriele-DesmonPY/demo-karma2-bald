import { useEffect, useRef } from "react";

// useProgressLoop — aggiornamenti legati allo scroll, applicati direttamente
// al DOM senza re-render React.
//
// Performance: prima girava un rAF perpetuo (60 chiamate al secondo anche
// a pagina ferma, con letture di layout a ogni frame). Ora il frame si
// richiede SOLO quando arriva uno scroll (anche lo scroll interno delle
// slide: listener in capture su window) o una resize — un frame per evento,
// al massimo uno per refresh.
// Gating con IntersectionObserver + gestione automatica di prefers-reduced-motion.
export default function useProgressLoop(getProgress, onFrame, enabled = true, observeRef = null) {
  const getProgressRef = useRef(getProgress);
  const onFrameRef = useRef(onFrame);

  // Le callback più recenti, aggiornate dopo ogni render (mai durante)
  useEffect(() => {
    getProgressRef.current = getProgress;
    onFrameRef.current = onFrame;
  });

  useEffect(() => {
    if (!enabled) {
      onFrameRef.current(null);
      return undefined;
    }

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = null;
    let inView = true;
    let last = undefined;

    const frame = () => {
      raf = null;
      const p = getProgressRef.current();
      if (p !== last) {
        last = p;
        onFrameRef.current(p);
      }
    };
    const request = () => {
      if (raf === null && inView && !mq.matches) raf = requestAnimationFrame(frame);
    };
    const cancel = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };

    const sync = () => {
      if (mq.matches) {
        cancel();
        onFrameRef.current(1);
      } else if (inView) {
        request();
      } else {
        cancel();
      }
    };

    sync();
    mq.addEventListener("change", sync);
    window.addEventListener("scroll", request, { passive: true, capture: true });
    window.addEventListener("resize", request, { passive: true });

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
      cancel();
      mq.removeEventListener("change", sync);
      window.removeEventListener("scroll", request, { capture: true });
      window.removeEventListener("resize", request);
      io?.disconnect();
    };
  }, [enabled, observeRef]);
}
