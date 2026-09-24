import { useEffect, useRef } from "react";
import { MotionConfig } from "framer-motion";
import { gsap } from "gsap";
import RibbonField from "../components/RibbonField";
import Reveal from "../components/Reveal";
import LineReveal from "../components/LineReveal";
import "./S1Hero.css";

/* ═══════════════════════════════════════════════════════════════
   SEZIONE 01 — HERO · SPIRALE CINETICA AUREA
   A sinistra solo la titolazione; a destra la spirale d'oro,
   protagonista, con le sei parole agganciate alle sue spire
   (<textPath>). Il mouse inclina la spirale in 3D e fa scivolare
   le parole lungo le curve. Sotto: micro-sezione citazione.

   Performance:
   - spirale (con il suo drop-shadow) e parole vivono in due SVG
     separati, ognuno su un proprio layer: muovere le parole non
     ricalcola mai il bagliore della spirale;
   - un solo proxy GSAP (quickTo) per le parole, un quickTo per asse
     di inclinazione; listener attivi solo con la hero in vista;
   - la cometa di luce gira solo quando la hero è visibile.
   ═══════════════════════════════════════════════════════════════ */

// ── Geometria: spirale logaritmica "aurea" ──
// r = R·e^(b(θ−θmax)), con b = ln(φ)/π: il raggio cresce di φ ogni
// mezzo giro (φ² per giro). Rispetto alla crescita "pura" (φ ogni
// quarto di giro) lascia 3 spire leggibili su cui far vivere le parole.
const PHI = (1 + Math.sqrt(5)) / 2;
const B = Math.log(PHI) / Math.PI;
const R = 470; // raggio esterno (viewBox −500…500)
const R0 = 2.5; // raggio del seme, al centro
const DEG = Math.PI / 180;
const END_DEG = 335; // dove finisce il filo esterno (in alto a destra)
const THETA_MAX = END_DEG * DEG + 6 * 2 * Math.PI;
const THETA_0 = THETA_MAX + Math.log(R0 / R) / B;
const K_ARC = Math.sqrt(1 + B * B) / B; // lunghezza d'arco = K·Δr

const rAt = (t) => R * Math.exp(B * (t - THETA_MAX));

function spiralPath(phase = 0, step = 0.035) {
  let d = "";
  for (let t = THETA_0; t <= THETA_MAX + 1e-6; t += step) {
    const r = rAt(t);
    const x = (r * Math.cos(t + phase)).toFixed(1);
    const y = (r * Math.sin(t + phase)).toFixed(1);
    d += (d ? "L" : "M") + x + " " + y + " ";
  }
  return d;
}

const MAIN_D = spiralPath(0);

// Riquadro reale del filo principale (+ margine per le parole): il
// viewBox lo abbraccia, così la spirale riempie il suo spazio e l'occhio
// è il centro vero di inclinazione e del fascio di luce.
const VB = (() => {
  let x0 = 0, x1 = 0, y0 = 0, y1 = 0;
  for (let t = THETA_0; t <= THETA_MAX; t += 0.02) {
    const r = rAt(t);
    const x = r * Math.cos(t);
    const y = r * Math.sin(t);
    x0 = Math.min(x0, x); x1 = Math.max(x1, x);
    y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  const pad = 56;
  const v = { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 1.4 };
  return { ...v, box: `${v.x.toFixed(0)} ${v.y.toFixed(0)} ${v.w.toFixed(0)} ${v.h.toFixed(0)}` };
})();
// Il filo espresso nel riquadro del viewBox (origine in alto a sinistra):
// è il binario della goccia di luce (CSS offset-path, niente repaint).
const COMET_D = (() => {
  let d = "";
  for (let t = THETA_0; t <= THETA_MAX + 1e-6; t += 0.05) {
    const r = rAt(t);
    d += (d ? "L" : "M") + (r * Math.cos(t) - VB.x).toFixed(1) + " " + (r * Math.sin(t) - VB.y).toFixed(1) + " ";
  }
  return d;
})();

// proporzioni e posizione dell'occhio (in %), per il CSS
const STAGE_VARS = {
  "--hs-ar": (VB.w / VB.h).toFixed(4),
  "--hs-ox": `${((-VB.x / VB.w) * 100).toFixed(2)}%`,
  "--hs-oy": `${((-VB.y / VB.h) * 100).toFixed(2)}%`,
  "--hs-ox-n": (-VB.x / VB.w).toFixed(4),
  "--hs-oy-n": (-VB.y / VB.h).toFixed(4),
};
// due bracci d'ombra, ruotati di 120°: profondità, senza rubare la scena
const ARM_B = spiralPath((2 * Math.PI) / 3, 0.06);
const ARM_C = spiralPath((4 * Math.PI) / 3, 0.06);

// Parola → angolo sullo schermo (270° = in alto) + spira (0 = la più
// esterna). Solo archi "alti" della spirale: le parole restano dritte.
// amp = quanto scivolano col mouse (unità SVG), dir = verso (parallasse).
const WORDS = [
  { t: "coerenza", deg: 300, turn: 0, size: 30, amp: 70, dir: 1 },
  { t: "equilibrio", deg: 238, turn: 0, size: 30, amp: 70, dir: 1 },
  { t: "contesto", deg: 316, turn: 1, size: 24, amp: 34, dir: -1 },
  { t: "tempo", deg: 268, turn: 1, size: 24, amp: 34, dir: -1 },
  { t: "senso", deg: 226, turn: 1, size: 24, amp: 30, dir: -1 },
  { t: "sé", deg: 270, turn: 2, size: 21, amp: 10, dir: 1 },
].map((w) => {
  const back = (((END_DEG - w.deg) % 360) + 360) % 360;
  const t = THETA_MAX - (back * DEG + w.turn * 2 * Math.PI);
  return { ...w, s: K_ARC * (rAt(t) - R0) };
});

const INTRO_GLIDE = 140; // le parole entrano scivolando lungo il filo

function HeroInner() {
  const heroRef = useRef(null);
  const containerRef = useRef(null);
  const textPathRefs = useRef([]);
  const stageRef = useRef(null);
  const trackRef = useRef(null);

  // la pista della goccia è in unità del viewBox: la scaliamo sul riquadro
  useEffect(() => {
    const stage = stageRef.current;
    const track = trackRef.current;
    if (!stage || !track || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      track.style.setProperty("--hs-k", (stage.clientWidth / VB.w).toFixed(4));
    });
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    const box = containerRef.current;
    if (!hero || !box) return;
    const q = gsap.utils.selector(box);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    // stato delle parole: m = mouse (−1…1), intro = 1→0 all'ingresso
    const st = { m: 0, intro: reduced ? 0 : 1 };
    const apply = () => {
      WORDS.forEach((w, i) => {
        const el = textPathRefs.current[i];
        if (!el) return;
        const off = w.s + w.dir * w.amp * st.m - st.intro * INTRO_GLIDE;
        el.setAttribute("startOffset", off.toFixed(1));
      });
    };
    apply();

    if (reduced) {
      gsap.set(q(".hs-word"), { opacity: 1 });
      gsap.set(q(".hs-main"), { strokeDashoffset: 0 });
      return;
    }

    // ── Ingresso: il filo si svolge dal seme verso l'esterno, poi le
    //    parole si accendono scivolando al loro posto lungo le spire ──
    const intro = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });
    intro
      .fromTo(q(".hs-main"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.8, ease: "power2.inOut" }, 0.2)
      .fromTo(q(".hs-arm"), { opacity: 0 }, { opacity: 1, duration: 2, ease: "power1.out" }, 0.8)
      .fromTo(q(".hs-word"), { opacity: 0 }, { opacity: 1, duration: 1.1, stagger: 0.14, ease: "power2.out" }, 1.7)
      .to(st, { intro: 0, duration: 2.2, ease: "power3.out", onUpdate: apply }, 1.7)
      .add(() => box.classList.add("is-drawn"), 2.6);

    // ── Mouse: inclinazione 3D + scivolamento delle parole ──
    const rotY = gsap.quickTo(box, "rotationY", { duration: 1, ease: "power2.out" });
    const rotX = gsap.quickTo(box, "rotationX", { duration: 1, ease: "power2.out" });
    const glide = gsap.quickTo(st, "m", { duration: 1.4, ease: "power3.out", onUpdate: apply });
    const clamp = gsap.utils.clamp(-14, 14);
    const onMove = (e) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      rotY(clamp((e.clientX - w / 2) * 0.03));
      rotX(clamp(-(e.clientY - h / 2) * 0.03));
      glide(gsap.utils.clamp(-1, 1, (e.clientX / w - 0.5) * 2));
    };

    // su touch: niente mouse → le parole respirano da sole lungo il filo
    const idle = gsap.to(st, {
      m: 1,
      duration: 7,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      paused: true,
      onUpdate: apply,
    });

    let started = false;
    let live = false;
    const setLive = (on) => {
      if (on === live) return;
      live = on;
      box.classList.toggle("is-live", on);
      if (on) {
        if (!started) {
          started = true;
          intro.play();
        }
        if (finePointer) window.addEventListener("mousemove", onMove, { passive: true });
        else idle.play();
      } else {
        window.removeEventListener("mousemove", onMove);
        idle.pause();
      }
    };

    const io = new IntersectionObserver(([entry]) => setLive(entry.isIntersecting), {
      threshold: 0.15,
    });
    io.observe(hero);

    return () => {
      io.disconnect();
      window.removeEventListener("mousemove", onMove);
      intro.kill();
      idle.kill();
    };
  }, []);

  return (
    <div className="s1-wrap">
      <RibbonField className="kh-backdrop" flatBase intensity={0.9} />

      <section
        ref={heroRef}
        className="kh-hero sb-hero hs"
        id="home"
        data-n="1"
        style={STAGE_VARS}
      >
        {/* Sfondo: trama del bisso (già sfocata nel file) + velo navy */}
        <div className="sb-hero__trama" aria-hidden="true">
          <img src="/trama-bisso-soft.jpg" alt="" className="sb-hero__trama-img" decoding="async" />
          <div className="sb-hero__trama-veil" />
        </div>

        {/* Fascio di luce: ora ruota dall'occhio della spirale */}
        <div className="sb-hero__beam" aria-hidden="true" />

        {/* ── La spirale cinetica aurea ── */}
        <div className="hs-stage" aria-hidden="true" ref={stageRef}>
          <div id="hero-spiral-container" className="hs-spiral" ref={containerRef}>
            {/* Livello 1: il filo d'oro (con il bagliore) + bracci d'ombra */}
            <svg className="hs-spiral__art" viewBox={VB.box}>
              <defs>
                <linearGradient id="hs-gold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#F3E5AB" />
                  <stop offset="55%" stopColor="#E2C974" />
                  <stop offset="100%" stopColor="#D4AF37" />
                </linearGradient>
                <radialGradient id="hs-arm-fade" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="500">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="hs-core" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#F3E5AB" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#F3E5AB" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="0" cy="0" r="120" fill="url(#hs-core)" />
              <path className="hs-arm" d={ARM_B} />
              <path className="hs-arm" d={ARM_C} />
              {/* bagliore: due tratti larghi e tenui sotto il filo (stesso
                  effetto del drop-shadow 16px, ma nessun filtro da ricalcolare
                  mentre il filo si disegna o la spirale si inclina) */}
              <path className="hs-main hs-main--halo-xl" d={MAIN_D} pathLength="1" strokeDasharray="1" strokeDashoffset="1" />
              <path className="hs-main hs-main--halo" d={MAIN_D} pathLength="1" strokeDasharray="1" strokeDashoffset="1" />
              <path
                className="hs-main hs-main--core"
                d={MAIN_D}
                pathLength="1"
                strokeDasharray="1"
                strokeDashoffset="1"
              />
            </svg>

            {/* Livello 2: le parole sulle spire + la cometa di luce */}
            <svg className="hs-spiral__words" viewBox={VB.box}>
              <defs>
                <path id="golden-spiral-path" d={MAIN_D} />
              </defs>
              {WORDS.map((w, i) => (
                <text key={w.t} className="hs-word"
                  style={{ fontSize: `calc(${w.size}px * var(--hs-word-k, 1))` }}
                  dy={-w.size * 0.32}>
                  <textPath
                    ref={(el) => (textPathRefs.current[i] = el)}
                    href="#golden-spiral-path"
                    startOffset={w.s.toFixed(1)}
                    textAnchor="middle"
                  >
                    {w.t}
                  </textPath>
                </text>
              ))}
            </svg>

            {/* Livello 3: la goccia di luce che percorre il filo dal seme
                all'esterno — solo transform, sul compositor */}
            <div className="hs-comet-track" ref={trackRef} style={{ width: VB.w, height: VB.h }}>
              <span className="hs-comet" style={{ offsetPath: `path("${COMET_D}")` }} />
            </div>
          </div>
        </div>

        {/* Il filo laterale che scende */}
        <div className="sb-hero__thread" aria-hidden="true">
          <span className="sb-hero__thread-pulse" />
        </div>

        {/* ── A sinistra: solo la titolazione ── */}
        <div className="sb-hero__grid">
          <div className="kh-hero__copy sb-hero__copy">
            <Reveal as="div" className="kh-eyebrow kh-hero__eyebrow">
              Karma · Ecologia della decisione
            </Reveal>
            <LineReveal as="h1" className="kh-hero__title" delay={120}>
              Evolviamo verso ciò che scegliamo di essere.
            </LineReveal>
            <Reveal as="p" className="kh-lede hs-lede" delay={80}>
              Dal filo alla trama, accompagniamo la tua impresa nella sua evoluzione: incontrare
              ciò che cambia, riconoscere ciò che conta, scegliere ciò che vuole diventare
              continuando a riconoscersi.
            </Reveal>
            <Reveal as="p" className="kh-body kh-body--onnavy" delay={140}>
              L’identità è il filo che attraversa il cambiamento e ci permette di abitare la
              complessità senza perdere la profondità di ciò che siamo.
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Micro-sezione citazione: pausa e respiro ── */}
      <section className="citazione-section s1q" aria-label="Citazione">
        <div className="s1q__inner">
          <Reveal as="div" className="s1q__mark">
            <span aria-hidden="true">“</span>
          </Reveal>
          <Reveal as="blockquote" className="s1q__text" delay={120}>
            Il tempo è un’emozione ed è una grandezza bidimensionale, nel senso che lo puoi vivere
            in due direzioni diverse, in lunghezza e in larghezza. Il guaio è che gli uomini
            studiano come allungare la vita, quando invece dovrebbero studiare come allargarla.
          </Reveal>
          <Reveal as="p" className="s1q__author" delay={260}>
            — Luciano De Crescenzo
          </Reveal>
        </div>
      </section>
    </div>
  );
}

// MotionConfig reducedMotion="user": con "riduci animazioni" attivo,
// Framer Motion salta le animazioni e mostra tutto a riposo.
export default function S1Hero() {
  return (
    <MotionConfig reducedMotion="user">
      <HeroInner />
    </MotionConfig>
  );
}
