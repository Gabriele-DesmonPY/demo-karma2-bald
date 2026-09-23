import { useEffect, useRef } from "react";
import "./SilkWash.css";

// SilkWash — dinamismo leggero per le zone chiare della Home.
//
// Due cose nello stesso layer:
//
// 1. La "Dreamy Pastel Wash" di 21st.dev (Silk Blend) rimappata e
//    alleggerita: gradiente setoso (haze → sky → rose → cream) a
//    bassissima opacità sul cream, con due bande setose appena accennate.
//
// 2. Tre fili d'oro che scendono: sinusoidi verticali con l'onda che
//    viaggia verso il basso e una luce che percorre ogni filo.
//
// Performance (riscrittura "solo GPU"):
// prima era un canvas grande quanto l'intera sezione ridisegnato a ogni
// frame (sulla tappa 03, alta ~3 viewport, erano milioni di pixel per
// frame). Ora:
// - il velo pastello è un gradiente CSS statico: zero lavoro per frame;
// - ogni filo è un SVG disegnato UNA volta sola (alla resize), più alto
//   di una lunghezza d'onda: traslarlo di esattamente λ in loop equivale
//   all'onda che scorre → animazione solo transform, sul compositor;
// - la luce che percorre il filo è un div con keyframe di transform
//   (x,y campionati lungo il filo) via Web Animations API: anch'essa
//   composited, nessun rAF, nessun repaint;
// - le animazioni si mettono in pausa fuori viewport (IntersectionObserver:
//   copre anche la slide non attiva, che sta fuori schermo nel deck);
// - prefers-reduced-motion: fili fermi, nessuna luce.

const THREADS = [
  { x: 0.28, amp: 26, freq: 2.2, phase: 0.0, dotSpeed: 46, dotOff: 0.0 },
  { x: 0.58, amp: 36, freq: 1.6, phase: 2.1, dotSpeed: 62, dotOff: 0.45 },
  { x: 0.84, amp: 18, freq: 2.7, phase: 4.4, dotSpeed: 38, dotOff: 0.75 },
];

const PAD = 6; // margine laterale dell'SVG del filo (px) oltre l'ampiezza

// Path della sinusoide x = amp·sin(k·y + phase) per y ∈ [y0, y1],
// in coordinate locali dell'SVG (x centrata su amp + PAD).
function sinePath(amp, k, phase, y0, y1) {
  const cx = amp + PAD;
  const step = 12; // px: più che sufficiente per curve così ampie
  let d = "";
  for (let y = y0; y <= y1 + step; y += step) {
    const yy = Math.min(y, y1);
    const x = cx + amp * Math.sin(k * yy + phase);
    d += (d ? "L" : "M") + x.toFixed(1) + " " + yy.toFixed(1) + " ";
    if (yy === y1) break;
  }
  return d;
}

export default function SilkWash({ a = 0, b = 10, c = 90, d = 100 }) {
  const wrapRef = useRef(null);
  const svgRefs = useRef([]);
  const pathRefs = useRef([]);
  const dotRefs = useRef([]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canAnimate = typeof Element !== "undefined" && "animate" in Element.prototype;

    let anims = [];
    let inView = false;
    let lastW = 0;
    let lastH = 0;
    let rebuildRaf = 0;

    const clearAnims = () => {
      anims.forEach((an) => an.cancel());
      anims = [];
    };

    const syncPlayState = () => {
      anims.forEach((an) => (inView && !document.hidden ? an.play() : an.pause()));
    };

    const build = () => {
      rebuildRaf = 0;
      const W = wrap.clientWidth;
      const H = wrap.clientHeight;
      if (!W || !H || (W === lastW && H === lastH)) return;
      lastW = W;
      lastH = H;
      clearAnims();

      const t0 = document.timeline ? document.timeline.currentTime : null;

      THREADS.forEach((th, i) => {
        const svg = svgRefs.current[i];
        const path = pathRefs.current[i];
        const dot = dotRefs.current[i];
        if (!svg || !path) return;

        const lambda = H / th.freq; // lunghezza d'onda in px
        const k = (2 * Math.PI) / lambda;
        const w = 2 * (th.amp + PAD);

        // L'SVG copre [−λ, H]: traslato di 0…λ copre sempre [0, H]
        svg.setAttribute("viewBox", `0 ${-lambda} ${w} ${H + lambda}`);
        svg.style.width = `${w}px`;
        svg.style.height = `${H + lambda}px`;
        svg.style.top = `${-lambda}px`;
        svg.style.left = `calc(${th.x * 100}% - ${w / 2}px)`;
        path.setAttribute("d", sinePath(th.amp, k, th.phase, -lambda, H));

        if (reduced || !canAnimate) {
          if (dot) dot.style.display = "none";
          return;
        }

        // Velocità angolare dell'onda (stessa formula del canvas originale)
        const omega = th.dotSpeed * 0.022; // rad/s
        const waveMs = ((2 * Math.PI) / omega) * 1000;

        const wave = svg.animate(
          [{ transform: "translate3d(0,0,0)" }, { transform: `translate3d(0,${lambda}px,0)` }],
          { duration: waveMs, iterations: Infinity, easing: "linear" }
        );
        anims.push(wave);

        if (!dot) return;
        dot.style.display = "";
        dot.style.left = `calc(${th.x * 100}% - 9px)`;

        // La luce percorre il filo dall'alto in basso. Il ciclo della luce
        // viene arrotondato a un multiplo intero del periodo dell'onda:
        // così un solo set di keyframe resta agganciato al filo per sempre.
        const span = H + 160;
        const rawCycle = span / th.dotSpeed; // s
        const m = Math.max(1, Math.round((omega * rawCycle) / (2 * Math.PI)));
        const cycleS = (2 * Math.PI * m) / omega;
        const net = Math.abs(span / lambda - m);
        const N = Math.min(240, Math.max(24, Math.ceil(net * 14) + 16));
        const frames = [];
        for (let s = 0; s <= N; s++) {
          const u = s / N;
          const y = u * span - 80;
          const x = th.amp * Math.sin(k * y - 2 * Math.PI * m * (u - th.dotOff) + th.phase);
          frames.push({ transform: `translate3d(${x.toFixed(2)}px,${y.toFixed(1)}px,0)` });
        }
        const drop = dot.animate(frames, {
          duration: cycleS * 1000,
          iterations: Infinity,
          iterationStart: th.dotOff,
          easing: "linear",
        });
        anims.push(drop);
      });

      // Stesso istante di partenza per onde e luci: restano in fase
      if (t0 !== null) anims.forEach((an) => (an.startTime = t0));
      syncPlayState();
    };

    const scheduleBuild = () => {
      if (!rebuildRaf) rebuildRaf = requestAnimationFrame(build);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        // Soglia minima 0.001 (non > 0): una slide solo "adiacente" al
        // viewport (nel deck la vicina tocca il bordo) o con un residuo
        // sub-pixel a fine transizione conta come fuori schermo. Con la
        // soglia nell'elenco, l'uscita sotto 0.001 genera sempre un callback.
        inView = entry.isIntersecting && entry.intersectionRatio >= 0.001;
        syncPlayState();
      },
      { threshold: [0, 0.001] }
    );
    io.observe(wrap);

    const ro = new ResizeObserver(scheduleBuild);
    ro.observe(wrap);
    document.addEventListener("visibilitychange", syncPlayState);
    build();

    return () => {
      if (rebuildRaf) cancelAnimationFrame(rebuildRaf);
      clearAnims();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", syncPlayState);
    };
  }, []);

  // Maschera a 4 fermate: trasparente ai bordi, pieno al centro.
  // Sfumando SU e GIÙ il velo torna cream puro ai confini di sezione:
  // nessuno scarto di tinta con le sezioni vicine.
  const v = `linear-gradient(to bottom, transparent 0%, transparent ${a}%, black ${b}%, black ${c}%, transparent ${d}%, transparent 100%)`;
  const mask = { WebkitMaskImage: v, maskImage: v };

  return (
    <div ref={wrapRef} className="silk-wash" style={mask} aria-hidden="true">
      <div className="silk-wash__threads">
        {THREADS.map((th, i) => (
          <svg
            key={i}
            ref={(el) => (svgRefs.current[i] = el)}
            className="silk-wash__thread"
            preserveAspectRatio="none"
          >
            <path ref={(el) => (pathRefs.current[i] = el)} className="silk-wash__thread-path" />
          </svg>
        ))}
        {THREADS.map((th, i) => (
          <span key={i} ref={(el) => (dotRefs.current[i] = el)} className="silk-wash__drop" />
        ))}
      </div>
    </div>
  );
}
