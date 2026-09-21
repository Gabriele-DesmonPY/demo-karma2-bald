import { useEffect, useRef } from "react";

// Ribbon Field — fascia di nastri dorati che ondeggiano sull'hero.
// Adattamento del gradiente "그라데이션 / Ribbon Field" di 21st.dev alla
// palette Karma: campo di bande lungo un angolo fisso (32°), bordi
// piumati (softness) e piega sinusoidale sull'asse trasversale che
// avanza nel tempo — l'onda del filo.
//
// Scelte di performance (già validare dal round 2):
// - canvas a risoluzione ridotta (~55%): il blur CSS lo nasconde del tutto;
// - il blur è statico e trasformato una volta sola → un solo layer GPU,
//   nessun repaint del DOM: il contenuto del canvas cambia, il layout no;
// - il loop gira SOLO quando l'hero è in viewport (IntersectionObserver);
// - con prefers-reduced-motion: un frame solo, campo fermo.
//
// Palette mappata sul brand (l'originale era bianco→azzurro→iride):
// crema-oro → oro chiaro → oro → oro profondo, su navy.

const STRIPES = [
  { p: 0.14, w: 0.16, c: [236, 215, 168], a: 0.13 }, // crema-oro, largha e fioca
  { p: 0.30, w: 0.07, c: [208, 172, 117], a: 0.22 }, // oro chiaro, thread
  { p: 0.42, w: 0.20, c: [198, 154, 87], a: 0.12 },  // oro, banda ampia
  { p: 0.55, w: 0.05, c: [236, 215, 168], a: 0.26 }, // filo luminoso
  { p: 0.68, w: 0.18, c: [138, 99, 39], a: 0.14 },   // oro profondo
  { p: 0.86, w: 0.10, c: [175, 129, 59], a: 0.17 },  // oro inchiostro
];

const ANGLE = (32 * Math.PI) / 180; // come l'originale
// wave 14 → (14/100)·0.35 ≈ 0.05 della diagonale: l'ampiezza dell'onda
const BEND = 0.04;

export default function RibbonField({ className = "", flatBase = false, intensity = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const parent = canvas.parentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Risoluzione interna ridotta: il blur nasconde ogni pixel.
    const DPR = Math.min(window.devicePixelRatio || 1, 1.5) * 0.55;
    let W = 0;
    let H = 0;
    let raf = 0;
    let running = false;
    let inView = true;

    const resize = () => {
      const r = parent.getBoundingClientRect();
      W = Math.max(2, Math.round(r.width * DPR));
      H = Math.max(2, Math.round(r.height * DPR));
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }
      if (!running) draw(0);
    };

    const draw = (t) => {
      if (!W || !H) return;
      // wave clock: da 20.75, avanza di 1.2/s — come da ricetta originale
      const clock = 20.75 + t * 0.45;
      const diag = Math.hypot(W, H);
      const half = diag / 2;

      // Base navy: col backdrop fisso è UNIFORME sul navy piatto
      // (--kh-navy #0a2545) — ogni sezione trasparente mostra esattamente
      // lo stesso campo, la continuità è garantita ovunque.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (flatBase) {
        ctx.fillStyle = "#0a2545";
      } else {
        const base = ctx.createLinearGradient(0, 0, 0, H);
        base.addColorStop(0, "#0a2545");
        base.addColorStop(0.45, "#0d2b51");
        base.addColorStop(1, "#0a2545");
        ctx.fillStyle = base;
      }
      ctx.fillRect(0, 0, W, H);

      // Campo di nastri nel frame ruotato di ANGLE
      ctx.translate(W / 2, H / 2);
      ctx.rotate(ANGLE);

      const SAMPLES = 40;
      const bendAmp = BEND * diag;

      for (const s of STRIPES) {
        const bandW = s.w * diag;
        const center = (s.p - 0.5) * diag;

        // Bordi piumati: gradiente lungo l'asse del nastro, trasparente
        // ai margini con la "softness" dell'originale
        const grad = ctx.createLinearGradient(center - bandW / 2, 0, center + bandW / 2, 0);
        const f = 0.42;
        grad.addColorStop(0, `rgba(${s.c[0]},${s.c[1]},${s.c[2]},0)`);
        grad.addColorStop(f, `rgba(${s.c[0]},${s.c[1]},${s.c[2]},${s.a * intensity})`);
        grad.addColorStop(1 - f, `rgba(${s.c[0]},${s.c[1]},${s.c[2]},${s.a * intensity})`);
        grad.addColorStop(1, `rgba(${s.c[0]},${s.c[1]},${s.c[2]},0)`);
        ctx.fillStyle = grad;

        // L'onda piega i bordi: offset sinusoidale sull'asse trasversale,
        // cross·2.4·2π + clock — esattamente la formula dell'originale
        ctx.beginPath();
        for (let i = 0; i <= SAMPLES; i++) {
          const y = -half + (diag * i) / SAMPLES;
          const off = bendAmp * Math.sin((y / diag) * 1.2 * 2 * Math.PI + clock);
          const x = center - bandW / 2 + off;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        for (let i = SAMPLES; i >= 0; i--) {
          const y = -half + (diag * i) / SAMPLES;
          const off = bendAmp * Math.sin((y / diag) * 1.2 * 2 * Math.PI + clock);
          ctx.lineTo(center + bandW / 2 + off, y);
        }
        ctx.closePath();
        ctx.fill();
      }
    };

    const loop = (now) => {
      draw(now / 1000);
      raf = running ? requestAnimationFrame(loop) : 0;
    };

    const start = () => {
      if (!running && inView && !document.hidden) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };

    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        inView ? start() : stop();
      },
      { threshold: 0.02 }
    );
    io.observe(parent);

    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    resize();

    if (reduced) {
      draw(0); // campo fermo: un frame solo
    } else {
      start();
    }

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  return (
    <div className="kh-ribbon-field" aria-hidden="true">
      <canvas ref={canvasRef} className={`kh-ribbon ${className}`} />
    </div>
  );
}