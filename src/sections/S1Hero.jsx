import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MotionConfig } from "framer-motion";
import { gsap } from "gsap";
import RibbonField from "../components/RibbonField";
import Reveal from "../components/Reveal";
import LineReveal from "../components/LineReveal";
import "./S1Hero.css";

/* ═══════════════════════════════════════════════════════════════
   SEZIONE 01 — HERO · SPIRALE CINETICA AUREA (fascio multi-filo)
   - La spirale principale è un FASCIO di 4 fili d'oro intrecciati:
     entra dal bordo in basso a destra e si avvolge verso il centro
     della scena. Le parole vivono sul filo principale (<textPath>).
   - Una seconda spirale, metà dimensione e molto soffusa, abita
     l'angolo in alto a sinistra dietro al titolo (parallasse lenta).
   - Il mouse inclina la principale in 3D attorno al suo occhio e fa
     scivolare le parole lungo il filo.

   Ingresso senza flicker: i livelli SVG nascono `visibility: hidden`
   (CSS); prima del primo paint (useLayoutEffect) gsap.set fissa
   dasharray/dashoffset sulle lunghezze reali dei tracciati; il disegno
   parte solo a pagina caricata + font pronti + 2 frame di assestamento.
   ═══════════════════════════════════════════════════════════════ */

// ── Geometria ──
// Spirale logaritmica r = Rend·e^(b(θ−θmax)), b = ln(φ)/π: il raggio
// cresce di φ ogni mezzo giro (lascia spire leggibili per le parole).
const B = Math.log((1 + Math.sqrt(5)) / 2) / Math.PI;
const K_ARC = Math.sqrt(1 + B * B) / B; // lunghezza d'arco = K·Δr
const DEG = Math.PI / 180;
const R0 = 2.5;

// Composizione di riferimento 1600×1000 (16:10), riempita a "slice"
const VB_DESK = { x: 0, y: 0, w: 1600, h: 1000 };
// Su mobile la spirale scende sotto al testo: inquadratura attorno all'occhio
const VB_MOB = { x: 730, y: 170, w: 860, h: 860 };

function makeSpiral({ cx, cy, rEnd, endDeg, mirror = false }) {
  const tMax = endDeg * DEG + 8 * 2 * Math.PI;
  const t0 = tMax + Math.log(R0 / rEnd) / B;
  const rAt = (t) => rEnd * Math.exp(B * (t - tMax));
  // scale(t): moltiplicatore del raggio (per i fili del fascio)
  const path = (scale = () => 1, step = 0.03) => {
    let d = "";
    for (let t = t0; t <= tMax + 1e-6; t += step) {
      const r = rAt(t) * scale(t);
      const x = mirror ? cx - r * Math.cos(t) : cx + r * Math.cos(t);
      const y = cy + r * Math.sin(t);
      d += (d ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1) + " ";
    }
    return d;
  };
  return { cx, cy, rAt, tMax, path };
}

// Principale: occhio a destra in basso, il filo esce dall'angolo
// in basso a destra (fuori schermo) → "entra dal lato" e si avvolge.
const MAIN = makeSpiral({ cx: 1160, cy: 600, rEnd: 760, endDeg: 40 });
const MAIN_D = MAIN.path();
// Fili del fascio: eco leggermente interne, intrecciate fra loro
// (una lieve sinusoide lungo il giro le fa incrociare)
const STRANDS = [
  { cls: "hs-echo hs-echo--a", d: MAIN.path((t) => 0.972 + 0.014 * Math.sin(1.6 * t)) },
  { cls: "hs-echo hs-echo--b", d: MAIN.path((t) => 0.952 + 0.018 * Math.sin(1.6 * t + 2.1)) },
  { cls: "hs-echo hs-echo--c", d: MAIN.path((t) => 0.93 + 0.016 * Math.sin(1.6 * t + 4.2)) },
];

// Secondaria: metà dimensione, specchiata, esce dall'angolo in alto a sinistra
const SECOND = makeSpiral({ cx: 250, cy: 250, rEnd: 390, endDeg: 315, mirror: true });
const SECOND_D = [SECOND.path(), SECOND.path((t) => 0.955 + 0.02 * Math.sin(1.6 * t + 1))];

// Parole → angolo sullo schermo (270° = in alto) + spira (0 = la più
// esterna, che qui passa sotto l'header: le parole partono dalla 1).
// amp = scivolamento col mouse (unità SVG), dir = verso (parallasse).
const END_DEG = 40;
const WORDS = [
  { t: "equilibrio", deg: 230, turn: 1, size: 28, amp: 34, dir: 1 },
  { t: "contesto", deg: 273, turn: 1, size: 28, amp: 34, dir: 1 },
  { t: "coerenza", deg: 315, turn: 1, size: 28, amp: 34, dir: 1 },
  { t: "senso", deg: 238, turn: 2, size: 22, amp: 14, dir: -1 },
  { t: "tempo", deg: 302, turn: 2, size: 22, amp: 14, dir: -1 },
  { t: "sé", deg: 272, turn: 3, size: 17, amp: 4, dir: 1 },
].map((w) => {
  const back = (((END_DEG - w.deg) % 360) + 360) % 360;
  const t = MAIN.tMax - (back * DEG + w.turn * 2 * Math.PI);
  return { ...w, s: K_ARC * (MAIN.rAt(t) - R0) };
});
const INTRO_GLIDE = 110;

// Mappa un punto del viewBox sul riquadro reale (preserveAspectRatio slice)
function sliceMap(vb, w, h) {
  const s = Math.max(w / vb.w, h / vb.h);
  return { s, ox: (w - vb.w * s) / 2 - vb.x * s, oy: (h - vb.h * s) / 2 - vb.y * s };
}

function HeroInner() {
  const heroRef = useRef(null);
  const stageRef = useRef(null);
  const boxRef = useRef(null);
  const bg2Ref = useRef(null);
  const trackRef = useRef(null);
  const textPathRefs = useRef([]);
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches
  );
  const vb = mobile ? VB_MOB : VB_DESK;
  const vbStr = `${vb.x} ${vb.y} ${vb.w} ${vb.h}`;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const on = () => setMobile(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // ── Occhio della spirale in px: origine dell'inclinazione 3D, del
  //    fascio di luce e scala della pista della goccia ──
  useEffect(() => {
    const stage = stageRef.current;
    const box = boxRef.current;
    const hero = heroRef.current;
    if (!stage || !box || !hero) return;
    const update = () => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (!w || !h) return;
      const m = sliceMap(vb, w, h);
      const ex = m.ox + MAIN.cx * m.s;
      const ey = m.oy + MAIN.cy * m.s;
      box.style.transformOrigin = `${ex}px ${ey}px`;
      stage.style.perspectiveOrigin = `${ex}px ${ey}px`;
      if (trackRef.current) {
        trackRef.current.style.transform = `translate(${m.ox}px, ${m.oy}px) scale(${m.s})`;
      }
      hero.style.setProperty("--beam-x", `${stage.offsetLeft + ex}px`);
      hero.style.setProperty("--beam-y", `${stage.offsetTop + ey}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [vb]);

  // ── Prima del primo paint: tratteggi sulle lunghezze reali ──
  useLayoutEffect(() => {
    const root = heroRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.querySelectorAll(".hs-draw").forEach((p) => {
      const len = p.getTotalLength();
      gsap.set(p, { strokeDasharray: `${len} ${len + 20}`, strokeDashoffset: reduced ? 0 : len });
    });
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    const box = boxRef.current;
    const bg2 = bg2Ref.current;
    if (!hero || !box || !bg2) return;
    const q = gsap.utils.selector(hero);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    // parole: m = mouse (−1…1), intro = 1→0 all'ingresso
    const st = { m: 0, intro: reduced ? 0 : 1 };
    const apply = () => {
      WORDS.forEach((w, i) => {
        const el = textPathRefs.current[i];
        if (el) el.setAttribute("startOffset", (w.s + w.dir * w.amp * st.m - st.intro * INTRO_GLIDE).toFixed(1));
      });
    };
    apply();

    const layers = q(".hs-layer");
    if (reduced) {
      gsap.set(layers, { visibility: "visible" });
      gsap.set(q(".hs-word"), { opacity: 1 });
      return;
    }

    // ── Timeline d'ingresso (costruita ora, avviata a pagina pronta) ──
    const intro = gsap.timeline({ paused: true });
    intro
      .set(layers, { visibility: "visible" }, 0)
      .fromTo(box, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: "power2.out" }, 0)
      .fromTo(bg2, { opacity: 0 }, { opacity: 1, duration: 1.6, ease: "power2.out" }, 0.2)
      .to(q(".hs-draw--main"), { strokeDashoffset: 0, duration: 2.8, ease: "power3.out" }, 0.1)
      .to(q(".hs-draw--echo"), { strokeDashoffset: 0, duration: 3, ease: "power3.out", stagger: 0.12 }, 0.2)
      .to(q(".hs-draw--second"), { strokeDashoffset: 0, duration: 3.4, ease: "power3.out", stagger: 0.2 }, 0.35)
      .fromTo(q(".hs-word"), { opacity: 0 }, { opacity: 1, duration: 1.1, stagger: 0.12, ease: "power2.out" }, 1.3)
      .to(st, { intro: 0, duration: 2.2, ease: "power3.out", onUpdate: apply }, 1.3)
      .add(() => box.classList.add("is-drawn"), 2.2);

    // ── Mouse: inclinazione 3D + parole che scivolano + parallasse lenta ──
    const clampRot = gsap.utils.clamp(-14, 14);
    const rotY = gsap.quickTo(box, "rotationY", { duration: 1, ease: "power2.out" });
    const rotX = gsap.quickTo(box, "rotationX", { duration: 1, ease: "power2.out" });
    const glide = gsap.quickTo(st, "m", { duration: 1.4, ease: "power3.out", onUpdate: apply });
    const bgX = gsap.quickTo(bg2, "x", { duration: 2.6, ease: "power2.out" });
    const bgY = gsap.quickTo(bg2, "y", { duration: 2.6, ease: "power2.out" });
    const bgR = gsap.quickTo(bg2, "rotation", { duration: 3, ease: "power2.out" });
    const onMove = (e) => {
      const dx = e.clientX - window.innerWidth / 2;
      const dy = e.clientY - window.innerHeight / 2;
      rotY(clampRot(dx * 0.03));
      rotX(clampRot(-dy * 0.03));
      glide(gsap.utils.clamp(-1, 1, (e.clientX / window.innerWidth - 0.5) * 2));
      bgX(-dx * 0.018);
      bgY(-dy * 0.018);
      bgR(dx * 0.004);
    };

    // touch: niente mouse → le parole respirano da sole lungo il filo
    const idle = gsap.to(st, {
      m: 1,
      duration: 7,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      paused: true,
      onUpdate: apply,
    });

    let disposed = false;
    let pageReady = false;
    let started = false;
    let live = false;
    const maybeStart = () => {
      if (!started && pageReady && live) {
        started = true;
        intro.play();
      }
    };
    const setLive = (on) => {
      if (on === live) return;
      live = on;
      box.classList.toggle("is-live", on);
      if (on) {
        maybeStart();
        if (finePointer) window.addEventListener("mousemove", onMove, { passive: true });
        else idle.play();
      } else {
        window.removeEventListener("mousemove", onMove);
        idle.pause();
      }
    };

    // pagina caricata + font pronti + 2 frame: il main thread è libero
    const loaded = new Promise((res) => {
      if (document.readyState === "complete") res();
      else window.addEventListener("load", () => res(), { once: true });
    });
    Promise.all([loaded, document.fonts ? document.fonts.ready : null])
      .then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
      .then(() => {
        if (disposed) return;
        pageReady = true;
        maybeStart();
      });

    const io = new IntersectionObserver(([entry]) => setLive(entry.isIntersecting), {
      threshold: 0.15,
    });
    io.observe(hero);

    return () => {
      disposed = true;
      io.disconnect();
      window.removeEventListener("mousemove", onMove);
      intro.kill();
      idle.kill();
    };
  }, []);

  return (
    <div className="s1-wrap">
      <RibbonField className="kh-backdrop" flatBase intensity={0.9} />

      <section ref={heroRef} className="kh-hero sb-hero hs" id="home" data-n="1">
        {/* Sfondo: trama del bisso (già sfocata nel file) + velo navy */}
        <div className="sb-hero__trama" aria-hidden="true">
          <img src="/trama-bisso-soft.jpg" alt="" className="sb-hero__trama-img" decoding="async" />
          <div className="sb-hero__trama-veil" />
        </div>

        {/* Fascio di luce: ruota dall'occhio della spirale */}
        <div className="sb-hero__beam" aria-hidden="true" />

        {/* ── Seconda spirale: in alto a sinistra, soffusa, parallasse lenta ── */}
        <div className="hs-second-wrap" aria-hidden="true">
          <svg ref={bg2Ref} className="hs-second hs-layer" viewBox="-160 -160 820 820">
            {SECOND_D.map((d, i) => (
              <path
                key={i}
                className={`hs-draw hs-draw--second hs-second__strand hs-second__strand--${i}`}
                d={d}
              />
            ))}
          </svg>
        </div>

        {/* ── La spirale cinetica aurea (fascio multi-filo) ── */}
        <div className="hs-stage" ref={stageRef} aria-hidden="true">
          <div id="hero-spiral-container" className="hs-spiral" ref={boxRef}>
            {/* Livello 1: il fascio di fili + bagliore del filo principale */}
            <svg className="hs-spiral__art hs-layer" viewBox={vbStr} preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id="hs-gold" gradientUnits="userSpaceOnUse" x1="500" y1="0" x2="1600" y2="1000">
                  <stop offset="0%" stopColor="#F3E5AB" />
                  <stop offset="55%" stopColor="#E2C974" />
                  <stop offset="100%" stopColor="#D4AF37" />
                </linearGradient>
                <radialGradient id="hs-core" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#F3E5AB" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#F3E5AB" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx={MAIN.cx} cy={MAIN.cy} r="110" fill="url(#hs-core)" />
              {STRANDS.map((s) => (
                <path key={s.cls} className={`hs-draw hs-draw--echo ${s.cls}`} d={s.d} />
              ))}
              {/* bagliore intenso del filo principale: tratti larghi e tenui,
                  nessun filtro da ricalcolare */}
              <path className="hs-draw hs-draw--main hs-main hs-main--halo-xl" d={MAIN_D} />
              <path className="hs-draw hs-draw--main hs-main hs-main--halo" d={MAIN_D} />
              <path className="hs-draw hs-draw--main hs-main hs-main--core" d={MAIN_D} />
            </svg>

            {/* Livello 2: le parole sul filo principale */}
            <svg className="hs-spiral__words hs-layer" viewBox={vbStr} preserveAspectRatio="xMidYMid slice">
              <defs>
                <path id="golden-spiral-path" d={MAIN_D} />
              </defs>
              {WORDS.map((w, i) => (
                <text key={w.t} className="hs-word" style={{ fontSize: `calc(${w.size}px * var(--hs-word-k, 1))` }} dy={-w.size * 0.34}>
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

            {/* Livello 3: la goccia di luce che percorre il filo (offset-path) */}
            <div className="hs-comet-track hs-layer" ref={trackRef}>
              <span className="hs-comet" style={{ offsetPath: `path("${MAIN_D}")` }} />
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
