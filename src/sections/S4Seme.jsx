import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./S4Seme.css";

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════════════
   SEZIONE 04 — I CONCETTI CHE GERMOGLIANO DAL SEME
   Sequenza A TEMPO, non legata allo scroll:
   1. quando la schermata del seme è pienamente in vista, lo scroll si
      blocca per un momento (lock) e l'attenzione resta sul video;
   2. il video riparte da 0 a velocità 2.2× (10 s → ~4,5 s);
   3. una timeline GSAP a tempo fa sbocciare i testi in 4 tempi;
   4. a fine video (ultimo fotogramma: il fiore aperto) lo scroll si
      sblocca e sotto continua il copy, in flusso normale.
   Bidirezionale: risalendo (rotella/swipe in cima alla sezione) il
   passaggio alla 03 viene trattenuto: il video si RIAVVOLGE AL CONTRARIO
   e i testi si richiudono (reverse), poi il deck sale alla 03. Rientrando,
   la sequenza riparte. Il reverse usa una copia del video codificata al
   contrario (riprodotta in modo nativo e fluido): i browser non
   supportano playbackRate negativo.

   Dissolvenze: i due video vivono in un contenitore (.s4__media) che
   parte invisibile. Entra in dissolvenza quando la sequenza parte ed
   esce in dissolvenza prima di ogni reset: il fotogramma della goccia
   non compare mai "a scatto" (currentTime = 0 solo a video invisibile).

   Nota: il sito è un deck a slide, la finestra non scorre. Per questo
   l'avvio usa un IntersectionObserver (la slide entra davvero in vista)
   invece di un ScrollTrigger "top top", che scatterebbe al caricamento.
   Il blocco comunica con il deck (App.jsx) tramite gli eventi
   `deck:lock` / `deck:unlock` (ferma Lenis e la navigazione tra slide).
   ═══════════════════════════════════════════════════════════════ */

// Video: VP9/WebM (Chrome, Edge, Firefox) e H.264/MP4 (Safari), ~1 MB
const VIDEO_WEBM = "/seme-germoglio.webm";
const VIDEO_MP4 = "/seme-germoglio.mp4";
const RATE = 2.2; // velocità della sequenza: 10 s di video → ~4,5 s
const REV_RATE = 3.6; // riavvolgimento: più svelto (~2,8 s dal fiore alla goccia)
const REV_WEBM = "/seme-germoglio-rev.webm";
const REV_MP4 = "/seme-germoglio-rev.mp4";

// Tempi (s) della sequenza di testi
const STEP = { head: 0, low: 1.1, high: 2.2, bloom: 3.3 };

// Frasi-germoglio: coordinate in % del riquadro video, accanto ai nodi
// ma fuori dall'ingombro finale della pianta (foglie x 28–73%, y 40–72%;
// fiore x 37–63%, y 19–50%). side "sx" = il testo termina sul nodo,
// "dx" = parte dal nodo. mx/my: posizione su mobile verticale (testo
// centrato sopra/sotto la pianta, dove c'è spazio).
const BUDS = [
  { text: "Per questa impresa.", x: 30, y: 62, mx: 29, my: 86, side: "sx", phase: STEP.low },
  { text: "Con questa storia.", x: 70, y: 62, mx: 71, my: 86, side: "dx", phase: STEP.low + 0.25 },
  { text: "Con queste persone.", x: 26, y: 47, mx: 29, my: 7, side: "sx", phase: STEP.high },
  { text: "Con queste possibilità.", x: 74, y: 47, mx: 71, my: 7, side: "dx", phase: STEP.high + 0.25 },
];

// Parole chiave che galleggiano attorno al fiore aperto
const KEYWORDS = [
  { t: "Visione", x: 30, y: 30, d: "0s" },
  { t: "Identità", x: 70, y: 29, d: "-2.4s" },
  { t: "Storia", x: 33, y: 16, d: "-4.1s" },
  { t: "Valori", x: 67, y: 15, d: "-1.3s" },
  { t: "Direzione", x: 50, y: 9, d: "-3.2s" },
];

/* ═══════════════════════════════════════════════════════════════
   CHIUSURA — LA TRAMA DEL BISSO
   Il filo d'oro che scende dalla pillola "Poi la scelta comincia a
   vivere" non si interrompe: entra in un palco sticky a tutta viewport
   e, con lo scroll (scrub bidirezionale), se ne staccano micro-fili
   (orditi) che si aprono a ventaglio fino ai bordi; poi le trame (fili
   orizzontali) partono dal filo maestro e attraversano gli orditi. Il
   risultato è un tessuto d'oro fluido, come la seta marina.

   Geometria procedurale (seed fisso: sempre lo stesso disegno) generata
   in coordinate PIXEL: il viewBox coincide con la misura reale del palco
   (ResizeObserver), quindi le lunghezze misurate con getTotalLength
   sono esatte e lo stroke-dashoffset rivela i fili senza errori.
   Un unico SVG sul suo livello; si anima solo stroke-dashoffset (fili)
   e opacity (velatura d'oro finale). Nessun filtro.
   ═══════════════════════════════════════════════════════════════ */

// Tavolozza oro (dal più chiaro al più brunito)
const GOLD = ["#F3E5AB", "#E2C974", "#D4AF37", "#B89343"];

// Generatore pseudo-casuale deterministico (mulberry32)
const rng = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Punti → path (polilinea fitta: a questa scala è una curva morbida)
const toD = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("");

/**
 * Disegna la trama per un palco W×H (pixel). Restituisce i fili con i
 * loro tempi sulla timeline, espressi in "viewport di scroll":
 * 0 → 0.75 il palco sta entrando (la punta del filo resta al 75% dello
 * schermo, in continuità con lo stelo sopra); da 0.75 a `total` il palco
 * è fermo (sticky) e il tessuto si compone.
 */
function buildWeave(W, H, total, mainW) {
  const rand = rng(1729);
  const r = (a, b) => a + rand() * (b - a);
  const mobile = W < 700;
  const cx = W / 2;
  const P = total - 0.75; // durata della fase ferma
  const p = (x) => 0.75 + x * P;

  // Drappeggio comune: lo stesso campo di spostamento deforma orditi e
  // trame, così la griglia ondeggia come un unico tessuto.
  // Onde lunghe e diagonali (seta che scorre) + un'increspatura fine.
  const dX = (x, y) => 11 * Math.sin(y / 230 + x / 560) + 3 * Math.sin(y / 91 + x / 400 + 1.3);
  const dY = (x, y) => 17 * Math.sin(x / 310 + y / 380) + 6 * Math.sin(x / 150 - y / 260 + 0.7);

  // Filo maestro: parte verticale al centro (tangente verticale, come lo
  // stelo sopra) e ondeggia appena scendendo.
  const mainX = (y) => cx + 5 * (1 - Math.cos((2 * Math.PI * y) / (H * 0.9))) * 0.5 * Math.sin(y / 260);
  const mainPts = [];
  for (let y = 0; y <= H + 2; y += 8) mainPts.push([mainX(y), y]);
  const mainD = toD(mainPts);

  // tempo in cui la punta del filo maestro raggiunge la quota y
  const tipAt = (y) => (y <= 0.75 * H ? y / H : 0.75 + ((y / H - 0.75) / 0.25) * 0.12 * P);

  const threads = [];
  threads.push({ d: mainD, w: 6, c: "#D4AF37", o: 0.1, t0: 0, t1: 0.75, t2: p(0.12), main: true });
  // stesso spessore dello stelo CSS (misurato): il raccordo non si vede
  threads.push({ d: mainD, w: mainW, c: "#E2C974", o: 1, t0: 0, t1: 0.75, t2: p(0.12), main: true });

  // Compagni: fili sottili accostati al maestro che se ne staccano piano
  const nComp = mobile ? 4 : 6;
  for (let i = 0; i < nComp; i++) {
    const side = i % 2 ? 1 : -1;
    const off = side * r(2.5, 6);
    const peel = r(0.18, 0.42) * H; // quota in cui si allontanano
    const drift = side * r(0.05, 0.16) * W;
    const pts = [];
    const y0 = r(0.02, 0.08) * H;
    for (let y = y0; y <= H + 2; y += 8) {
      // nasce SUL filo maestro e se ne scosta piano (nessun inizio a vuoto)
      const a = Math.min(1, (y - y0) / 90);
      const k = y < peel ? 0 : Math.min(1, (y - peel) / (0.45 * H));
      const e = k * k * (3 - 2 * k); // smoothstep
      pts.push([mainX(y) + a * a * (off + 2 * Math.sin(y / 70 + i)) + drift * e + e * dX(cx, y), y]);
    }
    const t0 = tipAt(pts[0][1]) + 0.04;
    threads.push({ d: toD(pts), w: r(0.6, 0.9), c: GOLD[i % 2 ? 0 : 1], o: r(0.35, 0.55), t0, dur: r(0.7, 0.95) });
  }

  // Orditi: si staccano dal maestro e si aprono a ventaglio fino alla
  // loro colonna, poi scendono (i più esterni partono più in alto).
  const nWarp = mobile ? 16 : 30;
  const span = W * (mobile ? 1.04 : 0.98);
  const step = span / nWarp;
  const maxDx = span / 2;
  const warpY0 = [];
  const warps = []; // per le diramazioni fini dell'ultima fase
  for (let i = 0; i < nWarp; i++) {
    const xi = cx - span / 2 + step * (i + 0.5) + r(-0.12, 0.12) * step;
    const dx = xi - cx;
    const f = Math.abs(dx) / maxDx; // 0 al centro → 1 ai bordi
    // in verticale (mobile) il ventaglio è più raccolto: il tessuto ha spazio
    const yb = (0.05 + (1 - f) * (mobile ? 0.2 : 0.3) + r(0, 0.05)) * H; // punto di distacco
    const dy = Math.max((mobile ? 0.1 : 0.12) * H, Math.abs(dx) * (mobile ? 0.75 : 0.5)); // lunghezza del ventaglio
    const ya = Math.min((mobile ? 0.48 : 0.62) * H, yb + dy); // arrivo sulla colonna
    warpY0.push(ya);
    const pts = [];
    // tratto a S: tangente verticale sia al distacco sia all'arrivo
    for (let s = 0; s <= 1.0001; s += 1 / 36) {
      const u = 1 - s;
      const x0 = mainX(yb);
      const bx = u * u * u * x0 + 3 * u * u * s * x0 + 3 * u * s * s * xi + s * s * s * xi;
      const by = u * u * u * yb + 3 * u * u * s * (yb + (ya - yb) * 0.55) + 3 * u * s * s * (yb + (ya - yb) * 0.45) + s * s * s * ya;
      pts.push([bx, by]);
    }
    // discesa: il drappeggio entra gradualmente (nessuno spigolo)
    const amp = r(1.5, 4);
    const lam = r(170, 320);
    const ph = r(0, 6.28);
    for (let y = ya + 8; y <= H + 4; y += 8) {
      const k = Math.min(1, (y - ya) / 140);
      pts.push([xi + k * (dX(xi, y) + amp * Math.sin((y - ya) / lam * 6.28 + ph) - amp * Math.sin(ph)), y]);
    }
    const t0 = tipAt(yb) + 0.03;
    warps.push({ xi, ya, amp, lam, ph });
    threads.push({
      d: toD(pts),
      w: r(0.6, 1.15) * (1 - f * 0.25),
      c: GOLD[Math.floor(r(0, 4))],
      o: r(0.42, 0.72) * (1 - f * 0.35),
      t0,
      dur: r(0.5, 0.65) + f * 0.3,
    });
  }

  // Fili vaganti: pochi, diagonali, attraversano l'ordito
  const nStray = mobile ? 2 : 4;
  for (let i = 0; i < nStray; i++) {
    const side = i % 2 ? 1 : -1;
    const y0 = r(0.22, 0.4) * H;
    const x1 = cx + side * r(0.28, 0.46) * W;
    const pts = [];
    for (let s = 0; s <= 1.0001; s += 1 / 60) {
      const e = s * s * (3 - 2 * s);
      const y = y0 + s * (H + 4 - y0);
      // curva a S che ondeggia col drappeggio: un filo di seta sciolto
      pts.push([mainX(y) + (x1 - mainX(y0)) * e + (dX(cx + (x1 - cx) * e, y) + 14 * Math.sin(s * 5 + i)) * s, y]);
    }
    threads.push({ d: toD(pts), w: 0.6, c: GOLD[0], o: 0.2, t0: p(0.04 + i * 0.07), dur: 0.45 * P });
  }

  // Trame: righe orizzontali dal filo maestro verso i due bordi, sempre
  // più fitte verso il basso; piccola ondulazione alternata (sopra/sotto
  // l'ordito) + lo stesso drappeggio degli orditi.
  const nWeft = mobile ? 17 : 18;
  const yTop = Math.max((mobile ? 0.42 : 0.5) * H, Math.max(...warpY0) - 0.04 * H);
  const yBot = 0.975 * H;
  for (let j = 0; j < nWeft; j++) {
    const u = j / (nWeft - 1);
    const yj = yTop + (yBot - yTop) * (1 - Math.pow(1 - u, 1.45));
    const phase = j % 2 ? Math.PI : 0;
    const wy = (x) => yj + dY(x, yj) + 1.3 * Math.sin((Math.PI * (x - cx)) / step + phase);
    const w = r(0.6, 1.0);
    // le prime righe sono appena accennate, poi il tessuto si fa pieno
    const o = r(0.45, 0.8) * (0.4 + 0.6 * Math.pow(u, 0.6));
    const t0 = p(0.1 + 0.56 * u);
    // un terzo delle righe ha un secondo capo accostato (filato doppio)
    const plies = rand() < 0.35 ? [0, r(2.2, 3.2)] : [0];
    for (const off of plies) {
      for (const side of [-1, 1]) {
        const pts = [];
        const x0 = mainX(yj);
        for (let x = x0; side < 0 ? x >= -4 : x <= W + 4; x += side * 6) pts.push([x, wy(x) + off]);
        threads.push({
          d: toD(pts),
          w: off ? 0.55 : w,
          o: off ? o * 0.5 : o,
          t0: t0 + (side > 0 ? 0.015 : 0) + (off ? 0.03 : 0),
          dur: 0.26 * P,
          grad: side < 0 ? "l" : "r",
        });
      }
    }
  }

  // Moltiplicazione: nell'ultima fase molti orditi si sdoppiano e un
  // filo più sottile scivola a metà strada verso il vicino: il tessuto
  // si infittisce senza fili che nascono dal nulla.
  for (let i = 0; i < warps.length - 1; i++) {
    if (rand() < (mobile ? 0.45 : 0.25)) continue;
    const a = warps[i];
    const b = warps[i + 1];
    const ys = Math.max(a.ya + 40, r(0.52, 0.7) * H); // punto di sdoppiamento
    const xm = (a.xi + b.xi) / 2 + r(-0.12, 0.12) * (b.xi - a.xi);
    const warpX = (y) => a.xi + Math.min(1, (y - a.ya) / 140) * (dX(a.xi, y) + a.amp * Math.sin((y - a.ya) / a.lam * 6.28 + a.ph) - a.amp * Math.sin(a.ph));
    const pts = [];
    for (let y = ys; y <= H + 4; y += 8) {
      const k = Math.min(1, (y - ys) / 120);
      const e = k * k * (3 - 2 * k);
      const target = xm + dX(xm, y);
      pts.push([warpX(y) + (target - warpX(y)) * e, y]);
    }
    const f = Math.abs(xm - cx) / maxDx;
    threads.push({
      d: toD(pts),
      w: 0.55,
      c: GOLD[i % 2 ? 0 : 1],
      o: r(0.28, 0.45) * (1 - f * 0.35),
      t0: p(0.45 + 0.3 * rand()),
      dur: 0.3 * P,
    });
  }

  return threads;
}

export default function S4Seme() {
  const sectionRef = useRef(null);
  const screenRef = useRef(null);
  const videoRef = useRef(null);
  const revRef = useRef(null);
  const mediaRef = useRef(null);
  const weaveRef = useRef(null);
  const weaveStageRef = useRef(null);
  const weaveSvgRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const screen = screenRef.current;
    const video = videoRef.current;
    const rev = revRef.current;
    const media = mediaRef.current;
    if (!section || !screen || !video || !rev || !media) return;
    const scroller = section.closest(".sandbox-slide");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let running = false; // sequenza avviata per questo ingresso
    let reversing = false; // riavvolgimento in corso
    let unlockTimer;
    let io;
    let tl;
    let onSlide;
    let onBeforeLeave;
    const SLIDE_INDEX = scroller ? Number(scroller.dataset.slide) : -1;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(section);

      // Stato finale: fiore aperto, tutte le frasi visibili
      const showAll = () => {
        gsap.set(q(".s4-anim"), { autoAlpha: 1, scale: 1, y: 0, filter: "none" });
        gsap.set(q(".s4-bud__text"), { yPercent: -50 });
        gsap.set(q(".s4__scrim"), { autoAlpha: 1 });
        gsap.set(q(".s4-after__stem"), { scaleY: 1 });
      };

      if (reduced) {
        video.removeAttribute("autoplay");
        video.poster = "/seme-germoglio-fiore.jpg";
        video.preload = "none";
        gsap.set(media, { opacity: 1 });
        showAll();
        return;
      }

      // Stati di partenza (nascosti, leggermente "chiusi")
      gsap.set(q(".s4-anim"), { autoAlpha: 0, scale: 0.9, y: 14, filter: "blur(6px)" });
      gsap.set(q(".s4-bud__text"), { yPercent: -50 });

      const lock = () => {
        scroller?.classList.add("is-locked");
        window.dispatchEvent(new Event("deck:lock"));
      };
      const unlock = () => {
        clearTimeout(unlockTimer);
        scroller?.classList.remove("is-locked");
        window.dispatchEvent(new Event("deck:unlock"));
      };

      // Dissolvenze del contenitore video
      const fadeIn = () => gsap.to(media, { opacity: 1, duration: 0.6, ease: "power2.out", overwrite: true });
      const fadeOut = (onComplete) =>
        gsap.to(media, { opacity: 0, duration: 0.4, ease: "power2.in", overwrite: true, onComplete });

      const run = () => {
        if (running) return;
        running = true;
        lock();

        // 1. Video dall'inizio, accelerato
        try {
          video.currentTime = 0;
        } catch {
          /* metadata non ancora pronti: parte comunque da 0 */
        }
        video.playbackRate = RATE;
        video.play().catch(() => {});
        fadeIn(); // la goccia emerge dal blu, non compare a scatto
        // alcuni browser azzerano la velocità al primo play: la riapplichiamo
        video.addEventListener("playing", () => (video.playbackRate = RATE), { once: true });

        // 2. Testi a tempo (nessuno scrub)
        const grow = { autoAlpha: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 0.8, ease: "power2.out" };
        tl?.kill();
        tl = gsap.timeline();
        tl.to(q(".s4__head .s4-anim"), { ...grow, stagger: 0.2 }, STEP.head);
        q(".s4-bud__text").forEach((el, i) => tl.to(el, { ...grow, yPercent: -50 }, BUDS[i].phase));
        tl.to(q(".s4__head"), { autoAlpha: 0, duration: 0.6 }, STEP.bloom - 0.3); // fa spazio alle parole chiave
        tl.to(q(".s4-kw__inner"), { ...grow, stagger: 0.12 }, STEP.bloom);
        // velatura scura dietro la frase finale: statica, entra solo in opacità
        tl.to(q(".s4__scrim"), { autoAlpha: 1, duration: 0.9, ease: "power1.out" }, STEP.bloom);
        tl.to(q(".s4__bloom .s4-anim"), { ...grow, stagger: 0.25 }, STEP.bloom + 0.3);

        // 3. Sblocco a fine video (fermo sull'ultimo fotogramma).
        //    Rete di sicurezza: sblocca comunque dopo la durata prevista.
        const textsEnd = (STEP.bloom + 1.1) * 1000;
        const t0 = performance.now();
        video.addEventListener(
          "ended",
          () => setTimeout(unlock, Math.max(0, textsEnd - (performance.now() - t0))),
          { once: true }
        );
        unlockTimer = setTimeout(unlock, Math.max((10 / RATE) * 1000, (STEP.bloom + 1.2) * 1000) + 400);
      };

      // Uscita verso l'alto (la slide non è più attiva): la timeline si
      // riavvolge, il video torna al primo fotogramma, pronto a ripartire.
      const rewind = () => {
        if (!running || reversing) return;
        running = false;
        unlock();
        video.pause();
        fadeOut(() => {
          // il reset avviene solo quando il video è già invisibile
          try {
            video.currentTime = 0;
          } catch {
            /* niente metadata: nulla da riavvolgere */
          }
          showRev(false);
        });
        if (tl) tl.timeScale(2.5).reverse();
      };

      // Mostra il video "in avanti" o quello "al contrario"
      const showRev = (on) => {
        rev.style.opacity = on ? "1" : "0";
        video.style.opacity = on ? "0" : "1";
      };

      // Uscita verso l'alto con la rotella/lo swipe: riavvolgimento visibile
      // (video al contrario + testi in reverse), poi il deck sale alla 03.
      const reverseOut = () => {
        reversing = true;
        clearTimeout(unlockTimer);
        lock();
        video.pause();

        const dur = video.duration || 10;
        const startRev = () => {
          showRev(true);
          rev.playbackRate = REV_RATE;
          rev.play().catch(() => {});
        };
        try {
          // stesso fotogramma: il punto t in avanti è (durata − t) al contrario
          rev.currentTime = Math.max(0, dur - video.currentTime);
          rev.addEventListener("seeked", startRev, { once: true });
        } catch {
          startRev();
        }

        const revMs = (Math.max(0, video.currentTime) / REV_RATE) * 1000;
        if (tl) tl.timeScale(Math.max(1, tl.duration() / Math.max(0.6, revMs / 1000))).reverse();

        // a fine riavvolgimento: dissolvenza al blu, poi reset e passaggio alla 03
        const finish = () => {
          rev.pause();
          fadeOut(() => {
            try {
              video.currentTime = 0;
            } catch {
              /* nulla */
            }
            showRev(false);
            running = false;
            reversing = false;
            unlock();
            window.dispatchEvent(
              new CustomEvent("deck:goto", { detail: { index: SLIDE_INDEX - 1, fromBelow: true } })
            );
          });
        };
        // la dissolvenza parte sugli ultimi istanti del riavvolgimento
        setTimeout(finish, Math.max(0, revMs - 250));
      };

      onBeforeLeave = (e) => {
        const d = e.detail;
        if (d.from !== SLIDE_INDEX || d.dir >= 0 || !running || reversing) return;
        e.preventDefault(); // il passaggio lo chiediamo noi a fine reverse
        reverseOut();
      };
      window.addEventListener("deck:beforeleave", onBeforeLeave);

      // Avvio: la slide è attiva e la schermata del seme è tutta in vista
      // (entrando dall'alto la slide si apre dalla cima → schermata visibile)
      let visible = false;
      io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.intersectionRatio >= 0.9;
          const active = scroller?.classList.contains("is-active");
          if (visible && active) {
            if (running && !reversing) fadeIn(); // rientro dal copy sotto
            else run();
          } else if (!entry.isIntersecting && running && !reversing) {
            // scesa nel copy sotto: il video esce in dissolvenza, fermo
            fadeOut(() => video.pause());
          }
        },
        { threshold: [0, 0.9] }
      );
      io.observe(screen);

      // Il deck cambia slide: fuori da questa → riavvolgi; dentro → parti
      onSlide = (e) => {
        if (e.detail.index !== SLIDE_INDEX) rewind();
        else if (visible) run();
      };
      window.addEventListener("deck:slide", onSlide);

      // Il copy sotto il video: dissolvenza leggera legata allo scroll
      if (scroller) {
        q(".s4-after__item").forEach((el) => {
          gsap.fromTo(
            el,
            { autoAlpha: 0, y: 28 },
            {
              autoAlpha: 1,
              y: 0,
              ease: "power2.out",
              scrollTrigger: { trigger: el, scroller, start: "top 92%", end: "top 64%", scrub: 1 },
            }
          );
        });

        // Lo stelo d'oro sotto la pillola: si allunga con lo scroll e la
        // sua punta resta al 75% dello schermo, dove la raccoglie il filo
        // maestro della trama (stessa regola: continuità senza stacchi).
        gsap.fromTo(
          q(".s4-after__stem"),
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: q(".s4-after__stem")[0], scroller, start: "top 75%", end: "bottom 75%", scrub: true },
          }
        );
      }
    }, section);

    return () => {
      io?.disconnect();
      if (onSlide) window.removeEventListener("deck:slide", onSlide);
      if (onBeforeLeave) window.removeEventListener("deck:beforeleave", onBeforeLeave);
      clearTimeout(unlockTimer);
      scroller?.classList.remove("is-locked");
      window.dispatchEvent(new Event("deck:unlock"));
      ctx.revert();
    };
  }, []);

  // ── Chiusura: la trama del Bisso (scrub bidirezionale) ──
  useEffect(() => {
    const block = weaveRef.current;
    const stage = weaveStageRef.current;
    const svg = weaveSvgRef.current;
    if (!block || !stage || !svg) return;
    const scroller = block.closest(".sandbox-slide");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const NS = "http://www.w3.org/2000/svg";

    let ctx;
    let lastW = 0;
    let lastH = 0;
    let timer;

    const build = () => {
      const W = Math.round(stage.clientWidth);
      const H = Math.round(stage.clientHeight);
      if (!W || !H || (W === lastW && H === lastH)) return;
      lastW = W;
      lastH = H;

      // progresso attuale: dopo un resize la trama riparte dallo stesso punto
      ctx?.revert();

      // durata in "viewport di scroll": entrata (0.75) + fase ferma
      const blockVh = block.offsetHeight / H;
      const total = 0.75 + Math.max(0.6, blockVh - 1);
      const stem = block.parentElement?.querySelector(".s4-after__stem");
      const mainW = stem ? stem.getBoundingClientRect().width || 2 : 2;
      const threads = buildWeave(W, H, total, mainW);

      // viewBox = pixel reali: lunghezze esatte, niente preserveAspectRatio
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.setAttribute("width", W);
      svg.setAttribute("height", H);
      svg.replaceChildren();

      // sfumature delle trame: più luminose sul filo maestro, brunite ai bordi
      const defs = document.createElementNS(NS, "defs");
      defs.innerHTML =
        `<linearGradient id="s4w-l" gradientUnits="userSpaceOnUse" x1="${W / 2}" y1="0" x2="0" y2="0">` +
        `<stop offset="0" stop-color="#F3E5AB"/><stop offset="0.55" stop-color="#E2C974" stop-opacity="0.8"/>` +
        `<stop offset="1" stop-color="#B89343" stop-opacity="0.35"/></linearGradient>` +
        `<linearGradient id="s4w-r" gradientUnits="userSpaceOnUse" x1="${W / 2}" y1="0" x2="${W}" y2="0">` +
        `<stop offset="0" stop-color="#F3E5AB"/><stop offset="0.55" stop-color="#E2C974" stop-opacity="0.8"/>` +
        `<stop offset="1" stop-color="#B89343" stop-opacity="0.35"/></linearGradient>`;
      svg.appendChild(defs);

      // prima trame e orditi, in cima il filo maestro (alone + filo)
      const order = [...threads.filter((t) => !t.main), ...threads.filter((t) => t.main)];
      const els = order.map((t) => {
        const el = document.createElementNS(NS, "path");
        el.setAttribute("d", t.d);
        el.setAttribute("fill", "none");
        el.setAttribute("stroke", t.grad ? `url(#s4w-${t.grad})` : t.c);
        el.setAttribute("stroke-width", t.w.toFixed(2));
        el.setAttribute("stroke-opacity", t.o.toFixed(2));
        el.setAttribute("stroke-linecap", "butt");
        svg.appendChild(el);
        return el;
      });

      ctx = gsap.context(() => {
        const sheen = stage.querySelector(".s4-weave__sheen");
        if (reduced || !scroller) {
          gsap.set(sheen, { opacity: 1 });
          return; // stato finale statico: tessuto completo
        }

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: block, scroller, start: "top 75%", end: "bottom bottom", scrub: true },
        });

        order.forEach((t, i) => {
          const el = els[i];
          // +2 / +1: a riposo il bordo del tratto cade dentro la pausa,
          // così non resta nessun puntino all'inizio del filo
          const len = el.getTotalLength() + 2;
          gsap.set(el, { strokeDasharray: `${len} ${len}`, strokeDashoffset: len + 1 });
          if (t.main) {
            // la punta segue lo schermo mentre il palco entra, poi completa
            tl.to(el, { strokeDashoffset: len * 0.25, duration: t.t1 - t.t0 }, t.t0);
            tl.to(el, { strokeDashoffset: 0, duration: t.t2 - t.t1 }, t.t1);
          } else {
            tl.to(el, { strokeDashoffset: 0, duration: t.dur, ease: "sine.inOut" }, t.t0);
          }
        });

        // la velatura d'oro sale quando il tessuto si infittisce
        tl.fromTo(sheen, { opacity: 0 }, { opacity: 1, duration: (total - 0.75) * 0.5 }, 0.75 + (total - 0.75) * 0.5);
        tl.set({}, {}, total); // la timeline dura esattamente quanto lo scroll
      }, block);

      ScrollTrigger.refresh();
    };

    build();
    // ricalcolo solo quando il palco cambia misura (debounce)
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(build, 160);
    });
    ro.observe(stage);

    return () => {
      ro.disconnect();
      clearTimeout(timer);
      ctx?.revert();
      svg.replaceChildren();
    };
  }, []);

  return (
    <section ref={sectionRef} className="s4" id="seme" data-n="4" aria-labelledby="s4-title">
      {/* Schermata del seme: una viewport, il video e i testi a tempo */}
      <div ref={screenRef} className="s4__screen">
          {/* Riquadro 16:9 del video: tutto ciò che deve "seguire i rami"
              vive qui dentro, in coordinate percentuali */}
          <div className="s4__stage">
            {/* contenitore dei due video: parte invisibile, entra/esce in dissolvenza */}
            <div ref={mediaRef} className="s4__media">
            <video
              ref={videoRef}
              className="s4__video"
              poster="/seme-germoglio-poster.jpg"
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
              tabIndex={-1}
            >
              <source src={VIDEO_WEBM} type="video/webm" />
              <source src={VIDEO_MP4} type="video/mp4" />
            </video>
            {/* copia al contrario, usata solo per il riavvolgimento */}
            <video
              ref={revRef}
              className="s4__video s4__video--rev"
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
              tabIndex={-1}
            >
              <source src={REV_WEBM} type="video/webm" />
              <source src={REV_MP4} type="video/mp4" />
            </video>
            </div>
            <div className="s4__veil" aria-hidden="true" />
            {/* sfumatura in basso: il video si scioglie nel blu del copy sotto */}
            <div className="s4__fade" aria-hidden="true" />

            {BUDS.map((b) => (
              <p
                key={b.text}
                className={`s4-bud s4-bud--${b.side}`}
                style={{ "--x": `${b.x}%`, "--xf": b.x / 100, "--y": `${b.y}%`, "--mx": `${b.mx}%`, "--my": `${b.my}%` }}
              >
                <span className="s4-bud__text s4-anim">{b.text}</span>
              </p>
            ))}

            <ul className="s4-kws" aria-label="Visione, identità, storia, valori, direzione">
              {KEYWORDS.map((k) => (
                <li
                  key={k.t}
                  className={`s4-kw${k.y < 12 ? " s4-kw--apex" : ""}`}
                  style={{ left: `${k.x}%`, "--ky": k.y / 100 }}
                >
                  <span className="s4-kw__inner s4-anim">
                    <span className="s4-kw__float" style={{ animationDelay: k.d }}>
                      {k.t}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            {/* Fase 4 — la frase che si accende sotto il fiore */}
            <div className="s4__bloom">
              {/* velatura radiale morbida dietro il blocco di testo (statica) */}
              <span className="s4__scrim" aria-hidden="true" />
              <p className="s4__bloom-line s4-anim">In questo momento.</p>
              <p className="s4__bloom-line s4__bloom-line--strong s4-anim">
                La scelta prende forma da qui.
              </p>
            </div>
          </div>

          {/* Fase 1 — tag e titolo in alto */}
          <header className="s4__head">
            <p className="s4__tag s4-anim">
              <span>Quarto blocco</span>
              <span className="s4__tag-sep" aria-hidden="true">—</span>
              <span>Mettere ordine e trovare coerenza</span>
            </p>
            <h2 id="s4-title" className="s4__title s4-anim">
              Tenere insieme significa riconoscere ciò che conta.
            </h2>
          </header>
      </div>

      {/* ── "Il filo vivo": il copy continua sotto, in scroll normale ── */}
      <div className="s4-after">
        <div className="s4-after__glow" aria-hidden="true" />
        <div className="s4-after__inner">
          <p className="s4-after__item s4-after__intro">
            Cresce, cambia, incontra nuove condizioni. Il filo che l’ha generata continua a offrire
            un punto da cui leggere ciò che accade e orientare ciò che verrà.
          </p>
          <p className="s4-after__item s4-after__statement">
            La coerenza è un <em>filo vivo</em> che permette all’impresa di evolvere continuando a
            riconoscersi.
          </p>
          <span className="s4-after__item s4-after__rule" aria-hidden="true" />
          <p className="s4-after__item s4-after__close">
            <span className="s4-after__pill">Poi la scelta comincia a vivere.</span>
          </p>
          {/* il filo maestro nasce qui e scende nella trama */}
          <span className="s4-after__stem" aria-hidden="true" />
        </div>
      </div>

      {/* ── Chiusura: il filo diventa tessuto (trama del Bisso) ── */}
      <div ref={weaveRef} className="s4-weave" aria-hidden="true">
        <div ref={weaveStageRef} className="s4-weave__stage">
          <div className="s4-weave__sheen" />
          <svg ref={weaveSvgRef} className="s4-weave__svg" xmlns="http://www.w3.org/2000/svg" />
          <div className="s4-weave__vignette" />
        </div>
      </div>
    </section>
  );
}

export { S4Seme };
