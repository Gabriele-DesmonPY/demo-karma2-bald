import { useId } from "react";

// Spirale generativa — IL filo conduttore del riferimento editoriale:
// una spirale logaritmica calcolata (r = a·e^(bt)) a più bracci ruotati
// fra loro. Compare in tutta la Home sempre con la stessa formula.
//
// Il tratto non è un filo uniforme: un gradiente radiale fa partire il
// filo pieno dal centro (il seme) e lo dissolve verso l'esterno, con cap
// arrotondati — la linea sembra cucuta, non tracciata da un plotter.
function arms(n, a, b, turns, step) {
  let d = "";
  const tMax = turns * 2 * Math.PI;
  for (let k = 0; k < n; k++) {
    const ph = (k * 2 * Math.PI) / n;
    for (let t = 0; t <= tMax + 1e-6; t += step) {
      const r = a * Math.exp(b * t);
      const x = (r * Math.cos(t + ph)).toFixed(1);
      const y = (r * Math.sin(t + ph)).toFixed(1);
      d += (t === 0 ? "M" : "L") + x + " " + y + " ";
    }
  }
  return d;
}

// Memo semplice: la formula è pura (stessi argomenti -> stesso path) e viene
// richiamata ad ogni render di ogni istanza — una cache modulo evita di
// ricalcolare centinaia di punti trigonometrici ogni volta che una spirale
// rientra nel viewport.
const cache = new Map();
function armsCached(n, a, b, turns, step) {
  const key = n + "|" + a + "|" + b + "|" + turns + "|" + step;
  if (!cache.has(key)) cache.set(key, arms(n, a, b, turns, step));
  return cache.get(key);
}

export default function Spiral({
  armsCount = 3,
  gold = "var(--kh-gold)",
  goldBright = "var(--kh-gold-bright)",
  thin = "var(--kh-line)",
  goldOpacity = 0.7,
  thinOpacity = 0.18,
  showThin = true,
  className = "",
  style,
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const gradId = `kh-spiral-fade-${uid}`;
  const wide = armsCached(armsCount, 6, 0.17, 4.1, 0.1);
  const thinPath = armsCached(Math.max(1, armsCount + 2), 9, 0.2, 3.4, 0.13);

  return (
    <svg
      className={className}
      viewBox="-500 -500 1000 1000"
      style={{ display: "block", ...style }}
      aria-hidden="true"
    >
      <defs>
        {/* Il filo è pieno al centro e svanisce uscendo: profondità senza
            ombre, e le punte non "tagliano" mai sul bordo del viewBox. */}
        <radialGradient
          id={gradId}
          gradientUnits="userSpaceOnUse"
          cx="0"
          cy="0"
          r="540"
        >
          <stop offset="0%" style={{ stopColor: goldBright }} stopOpacity="1" />
          <stop offset="38%" style={{ stopColor: gold }} stopOpacity="0.72" />
          <stop offset="78%" style={{ stopColor: gold }} stopOpacity="0.26" />
          <stop offset="100%" style={{ stopColor: gold }} stopOpacity="0" />
        </radialGradient>
      </defs>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ transformOrigin: "50% 50%" }}>
        <path
          d={wide}
          stroke={`url(#${gradId})`}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          opacity={goldOpacity}
        />
        {showThin && (
          <path
            d={thinPath}
            stroke={thin}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            opacity={thinOpacity}
          />
        )}
      </g>
    </svg>
  );
}