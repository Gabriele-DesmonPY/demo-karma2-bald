import { useEffect, useRef } from "react";
import "./SilkWash.css";

// SilkWash — dinamismo leggero per le zone chiare della Home.
//
// Due cose nello stesso canvas (un solo layer GPU, un solo loop):
//
// 1. La "Dreamy Pastel Wash" di 21st.dev (Silk Blend) rimappata e
//    alleggerita: gradiente setoso a 150° (haze → sky → rose → cream)
//    disegnato a bassissima opacità sul cream, con un'oscillazione
//    d'angolo lenta e due bande setose che respirano — dinamismo
//    percepibile ma leggero, come chiesto.
//
// 2. Tre fili d'oro che scendono: sinusoidi verticali con fase in
//    movimento (l'onda viaggia verso il basso) e una luce che percorre
//    ogni filo dall'alto in basso.
//
// Performance: stesso schema di RibbonField — canvas a risoluzione
// ridotta, loop solo in viewport, reduced-motion = un frame fermo.

const PASTEL = [
  [220, 235, 247], // haze
  [185, 212, 236], // sky
  [243, 217, 228], // rose
  [247, 239, 227], // cream
];

const THREADS = [
  { x: 0.28, amp: 26, freq: 2.2, phase: 0.0, dotSpeed: 46, dotOff: 0.0 },
  { x: 0.58, amp: 36, freq: 1.6, phase: 2.1, dotSpeed: 62, dotOff: 0.45 },
  { x: 0.84, amp: 18, freq: 2.7, phase: 4.4, dotSpeed: 38, dotOff: 0.75 },
];

export default function SilkWash({ a = 0, b = 10, c = 90, d = 100 }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const parent = wrapRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const DPR = Math.min(window.devicePixelRatio || 1, 1.5) * 0.75;
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
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // ── Base cream: identica al fondo delle sezioni chiare ──
      ctx.fillStyle = "#faf8f4";
      ctx.fillRect(0, 0, W, H);

      // ── Seta pastello: gradiente a 150° con oscillazione lenta ──
      const angle = (150 + Math.sin(t * 0.12) * 2.4) * (Math.PI / 180);
      const diag = Math.hypot(W, H);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(Math.PI - angle); // 150° CSS → frame ruotato
      const wash = ctx.createLinearGradient(-diag / 2, 0, diag / 2, 0);
      PASTEL.forEach(([r, g, b], i) => {
        wash.addColorStop(i / (PASTEL.length - 1), `rgba(${r},${g},${b},0.5)`);
      });
      ctx.fillStyle = wash;
      ctx.fillRect(-diag / 2, -diag / 2, diag, diag);

      // Due bande setose finissime che respirano (wave leggera)
      const clock = t * 0.35;
      for (let k = 0; k < 2; k++) {
        const bandW = diag * (0.34 + k * 0.1);
        const center = ((k === 0 ? -0.16 : 0.2) + Math.sin(t * 0.09 + k * 1.7) * 0.03) * diag;
        const band = ctx.createLinearGradient(center - bandW / 2, 0, center + bandW / 2, 0);
        const c = k === 0 ? "243,217,228" : "185,212,236";
        band.addColorStop(0, `rgba(${c},0)`);
        band.addColorStop(0.5, `rgba(${c},0.14)`);
        band.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = band;
        // bordo piegato dall'onda: sin sull'asse trasversale, lentissimo
        ctx.beginPath();
        const SAMPLES = 24;
        for (let i = 0; i <= SAMPLES; i++) {
          const y = -diag / 2 + (diag * i) / SAMPLES;
          const off = diag * 0.035 * Math.sin((y / diag) * 2 * Math.PI + clock + k * 2.4);
          i === 0 ? ctx.moveTo(center - bandW / 2 + off, y) : ctx.lineTo(center - bandW / 2 + off, y);
        }
        for (let i = SAMPLES; i >= 0; i--) {
          const y = -diag / 2 + (diag * i) / SAMPLES;
          const off = diag * 0.035 * Math.sin((y / diag) * 2 * Math.PI + clock + k * 2.4);
          ctx.lineTo(center + bandW / 2 + off, y);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // ── I fili d'oro che scendono ──
      for (const th of THREADS) {
        const baseX = th.x * W;
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, "rgba(175,129,59,0)");
        grad.addColorStop(0.12, "rgba(175,129,59,0.28)");
        grad.addColorStop(0.88, "rgba(175,129,59,0.28)");
        grad.addColorStop(1, "rgba(175,129,59,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        const STEPS = 48;
        for (let i = 0; i <= STEPS; i++) {
          const y = (H * i) / STEPS;
          const x = baseX + th.amp * DPR * Math.sin((y / H) * th.freq * 2 * Math.PI - t * th.dotSpeed * 0.022 + th.phase);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();

        // La luce che percorre il filo dall'alto in basso
        const span = H + 160 * DPR;
        const yDot = ((t * th.dotSpeed * DPR + th.dotOff * span) % span) - 80 * DPR;
        const xDot = baseX + th.amp * DPR * Math.sin((yDot / H) * th.freq * 2 * Math.PI - t * th.dotSpeed * 0.022 + th.phase);
        if (yDot > -20 * DPR && yDot < H + 20 * DPR) {
          const glow = ctx.createRadialGradient(xDot, yDot, 0, xDot, yDot, 9 * DPR);
          glow.addColorStop(0, "rgba(236,215,168,0.85)");
          glow.addColorStop(1, "rgba(236,215,168,0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(xDot, yDot, 9 * DPR, 0, Math.PI * 2);
          ctx.fill();
        }
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
      draw(0);
    } else {
      start();
    }

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  // Maschera a 4 fermate: trasparente ai bordi, pieno al centro.
  // Sfumando SU e GIÙ il velo torna cream puro ai confini di sezione:
  // nessuno scarto di tinta con le sezioni vicine.
  const v = `linear-gradient(to bottom, transparent 0%, transparent ${a}%, black ${b}%, black ${c}%, transparent ${d}%, transparent 100%)`;
  const mask = { WebkitMaskImage: v, maskImage: v };

  return (
    <div ref={wrapRef} className="silk-wash" style={mask} aria-hidden="true">
      <canvas ref={canvasRef} className="silk-wash__canvas" />
    </div>
  );
}
