import { useEffect, useRef } from "react";

// Ribbon Field — fascia di nastri dorati che ondeggiano sull'hero.
// Adattamento del gradiente "그라데이션 / Ribbon Field" di 21st.dev alla
// palette Karma: campo di bande lungo un angolo fisso (32°), bordi
// piumati (softness) e piega sinusoidale sull'asse trasversale che
// avanza nel tempo — l'onda del filo.
//
// Performance (riscrittura "solo GPU"):
// prima il canvas veniva ridisegnato a ogni frame e sopra c'era un
// filter: blur() CSS di 16–30px su tutta la viewport → il blur veniva
// ricalcolato a ogni frame (il costo più alto di tutto l'hero).
// Ora sfruttiamo una proprietà dell'onda: sin(k·y + ω·t) è la stessa
// forma traslata lungo l'asse del nastro. Quindi:
// - i nastri si disegnano UNA volta sola (alla resize) su un canvas più
//   lungo di una lunghezza d'onda, già sfocati (ctx.filter) e a bassa
//   risoluzione (il blur nasconde ogni pixel);
// - l'onda che avanza è una traslazione lungo l'asse del nastro, in loop
//   su esattamente λ: animazione solo transform, sul compositor, via
//   Web Animations API — nessun rAF, nessun repaint, nessun filtro live;
// - l'animazione va in pausa quando l'hero è fuori viewport (anche quando
//   la slide non è attiva: nel deck sta fuori schermo);
// - con prefers-reduced-motion: campo fermo.
//
// Palette mappata sul brand (l'originale era bianco→azzurro→iride):
// crema-oro → oro chiaro → oro → oro profondo, su navy.

const STRIPES = [
  { p: 0.14, w: 0.16, c: [236, 215, 168], a: 0.13 }, // crema-oro, larga e fioca
  { p: 0.30, w: 0.07, c: [208, 172, 117], a: 0.22 }, // oro chiaro, thread
  { p: 0.42, w: 0.20, c: [198, 154, 87], a: 0.12 },  // oro, banda ampia
  { p: 0.55, w: 0.05, c: [236, 215, 168], a: 0.26 }, // filo luminoso
  { p: 0.68, w: 0.18, c: [138, 99, 39], a: 0.14 },   // oro profondo
  { p: 0.86, w: 0.10, c: [175, 129, 59], a: 0.17 },  // oro inchiostro
];

const ANGLE_DEG = 32; // come l'originale
// wave 14 → (14/100)·0.35 ≈ 0.05 della diagonale: l'ampiezza dell'onda
const BEND = 0.04;
const WAVES_PER_DIAG = 1.2; // sin((y/diag)·1.2·2π): λ = diag / 1.2
const OMEGA = 0.45; // rad/s: velocità dell'onda (ricetta originale)
const CLOCK0 = 20.75; // fase di partenza (ricetta originale)
// Overscan dello sfondo: come il vecchio scale(1.12) di .kh-backdrop
const OVERSCAN = 1.12;

export default function RibbonField({ className = "", flatBase = false, intensity = 1 }) {
  const fieldRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const field = fieldRef.current;
    const canvas = canvasRef.current;
    if (!field || !canvas) return undefined;
    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canAnimate = "animate" in Element.prototype;
    const hasCtxFilter = typeof ctx.filter === "string";

    let anim = null;
    let inView = false;
    let lastW = 0;
    let lastH = 0;
    let raf = 0;

    const syncPlayState = () => {
      if (!anim) return;
      if (inView && !document.hidden) anim.play();
      else anim.pause();
    };

    const build = () => {
      raf = 0;
      const W = field.clientWidth;
      const H = field.clientHeight;
      if (!W || !H || (W === lastW && H === lastH)) return;
      lastW = W;
      lastH = H;

      const diag = Math.hypot(W, H);
      const half = diag / 2;
      const lambda = diag / WAVES_PER_DIAG;
      const len = diag + lambda; // lunghezza lungo l'asse del nastro
      const k = (2 * Math.PI) / lambda;

      // Blur equivalente al vecchio CSS: clamp(16px, 2.6vw, 30px)
      const blurCss = Math.min(30, Math.max(16, window.innerWidth * 0.026));
      // Risoluzione interna: bassa (il blur nasconde i pixel). Senza
      // ctx.filter (Safari datati) scendiamo ancora di più: l'upscale
      // bilineare del browser fa da sfocatura.
      const R = hasCtxFilter ? 0.32 : 0.08;
      const cw = Math.max(2, Math.round(diag * R));
      const ch = Math.max(2, Math.round(len * R));
      canvas.width = cw;
      canvas.height = ch;
      canvas.style.width = `${diag}px`;
      canvas.style.height = `${len}px`;
      canvas.style.left = `${(W - diag) / 2}px`;
      canvas.style.top = `${(H - len) / 2}px`;

      // ── Disegno statico dei nastri nel frame ruotato ──
      // x = asse trasversale (posizione delle bande), y = asse del nastro.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      ctx.setTransform(R, 0, 0, R, (diag / 2) * R, (len / 2) * R);
      if (hasCtxFilter) ctx.filter = `blur(${(blurCss * R).toFixed(2)}px)`;

      // Fase allineata a t=0 con la traslazione iniziale +λ/2
      const phase0 = CLOCK0 + Math.PI;
      const bendAmp = BEND * diag;
      const yStart = -half - lambda / 2 - 40;
      const yEnd = half + lambda / 2 + 40;
      const SAMPLES = 80;

      for (const s of STRIPES) {
        const bandW = s.w * diag;
        const center = (s.p - 0.5) * diag;

        // Bordi piumati: gradiente trasversale, trasparente ai margini
        const grad = ctx.createLinearGradient(center - bandW / 2, 0, center + bandW / 2, 0);
        const f = 0.42;
        const rgb = `${s.c[0]},${s.c[1]},${s.c[2]}`;
        grad.addColorStop(0, `rgba(${rgb},0)`);
        grad.addColorStop(f, `rgba(${rgb},${s.a * intensity})`);
        grad.addColorStop(1 - f, `rgba(${rgb},${s.a * intensity})`);
        grad.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = grad;

        // L'onda piega i bordi: offset sinusoidale lungo l'asse del nastro
        ctx.beginPath();
        for (let i = 0; i <= SAMPLES; i++) {
          const y = yStart + ((yEnd - yStart) * i) / SAMPLES;
          const x = center - bandW / 2 + bendAmp * Math.sin(k * y + phase0);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        for (let i = SAMPLES; i >= 0; i--) {
          const y = yStart + ((yEnd - yStart) * i) / SAMPLES;
          ctx.lineTo(center + bandW / 2 + bendAmp * Math.sin(k * y + phase0), y);
        }
        ctx.closePath();
        ctx.fill();
      }
      if (hasCtxFilter) ctx.filter = "none";

      // ── L'onda che avanza = traslazione lungo l'asse, loop su λ ──
      const base = `scale(${OVERSCAN}) rotate(${ANGLE_DEG}deg)`;
      const from = `${base} translate3d(0, ${lambda / 2}px, 0)`;
      const to = `${base} translate3d(0, ${-lambda / 2}px, 0)`;
      if (anim) {
        anim.cancel();
        anim = null;
      }
      if (reduced || !canAnimate) {
        canvas.style.transform = from;
        return;
      }
      canvas.style.transform = from;
      anim = canvas.animate([{ transform: from }, { transform: to }], {
        duration: ((2 * Math.PI) / OMEGA) * 1000,
        iterations: Infinity,
        easing: "linear",
      });
      syncPlayState();
    };

    const scheduleBuild = () => {
      if (!raf) raf = requestAnimationFrame(build);
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
    io.observe(field);

    const ro = new ResizeObserver(scheduleBuild);
    ro.observe(field);
    document.addEventListener("visibilitychange", syncPlayState);
    build();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (anim) anim.cancel();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", syncPlayState);
    };
  }, [flatBase, intensity]);

  // Base navy come sfondo CSS del campo (prima: dipinta nel canvas)
  const background = flatBase
    ? "#0a2545"
    : "linear-gradient(to bottom, #0a2545 0%, #0d2b51 45%, #0a2545 100%)";

  return (
    <div ref={fieldRef} className="kh-ribbon-field" style={{ background }} aria-hidden="true">
      <canvas ref={canvasRef} className={`kh-ribbon ${className}`} />
    </div>
  );
}
