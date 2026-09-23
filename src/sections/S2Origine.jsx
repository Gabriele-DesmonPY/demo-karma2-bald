import { useEffect, useRef, useState } from "react";
import "./S2Origine.css";

/* ═══════════════════════════════════════════════════════════════
   SEZIONE 02 — ORIGINE E CONTESTO
   Direzione: Editorial Luxury / rivista di alta gamma.
   Doppia pagina: a sinistra la colonna tipografica su panna, a destra
   un'immagine d'atmosfera sfocata (seta e fili d'oro) che si fonde col fondo.

   Performance:
   - un solo IntersectionObserver sulla sezione;
   - l'ingresso aggiunge una classe (`s2o--in`) una volta sola;
   - la deriva lenta dell'atmosfera gira solo quando la sezione è
     in vista (`s2o--live`), altrimenti è in pausa;
   - la sfocatura è già nell'immagine: zero filtri calcolati dal browser;
   - animazioni esclusivamente su transform / opacity.
   ═══════════════════════════════════════════════════════════════ */

// Concetti chiave, distribuiti su due righe tipografiche
const CONCEPT_ROWS = [
  ["Persone", "Processi", "Abitudini"],
  ["Relazioni", "Strumenti", "Responsabilità"],
];

export default function S2Origine() {
  const sectionRef = useRef(null);
  // `entered`: l'ingresso è avvenuto (resta vero per sempre)
  // `live`: la sezione è attualmente visibile (governa la fluttuazione)
  const [entered, setEntered] = useState(false);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    // Fallback: browser senza IntersectionObserver → tutto subito visibile
    if (typeof IntersectionObserver === "undefined") {
      setEntered(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setEntered(true);
        setLive(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const stateClass = `${entered ? " s2o--in" : ""}${live ? " s2o--live" : ""}`;

  return (
    <section
      ref={sectionRef}
      id="complessita"
      data-n="2"
      className={`s2o${stateClass}`}
      aria-labelledby="s2o-title"
    >
      <div className="s2o__grid">
        {/* ── Colonna sinistra: la pagina di testo ── */}
        <div className="s2o__text">
          <div className="s2o__head">
            <p className="s2o__tag s2o-r" style={{ "--d": "0ms" }}>
              <span className="s2o__tag-num">02</span>
              <span className="s2o__tag-sep" aria-hidden="true">·</span>
              Origine e contesto
            </p>

            {/* Titolo monumentale: ogni riga sale da una maschera */}
            <h2 id="s2o-title" className="s2o__title">
              <span className="s2o__line">
                <span className="s2o__line-in" style={{ "--d": "90ms" }}>
                  Una scelta incontra
                </span>
              </span>
              <span className="s2o__line">
                <span className="s2o__line-in" style={{ "--d": "190ms" }}>
                  sempre <em>una storia</em>
                </span>
              </span>
            </h2>

            <p className="s2o__lede s2o-r" style={{ "--d": "340ms" }}>
              Per questo, ogni evoluzione parte sempre da ciò che esiste.
            </p>
          </div>

          <div className="s2o__middle">
            {/* Concetti chiave: blocco tipografico tra due filetti,
                nessuna pillola, solo maiuscoletto e punti d'oro */}
            <div
              className="s2o__concepts s2o-r"
              style={{ "--d": "460ms" }}
            >
              {CONCEPT_ROWS.map((row) => (
                <p className="s2o__concepts-row" key={row[0]}>
                  {row.map((word, i) => (
                    <span className="s2o__concept" key={word}>
                      {i > 0 && <i className="s2o__dot" aria-hidden="true" />}
                      {word}
                    </span>
                  ))}
                </p>
              ))}
            </div>

            <p className="s2o__body s2o-r" style={{ "--d": "560ms" }}>
              Ci sono cose che funzionano, cose che si sono stratificate, altre che chiedono di
              essere ripensate. Significa osservare ciò che c’è, riconoscere ciò che ha ancora
              valore, sciogliere ciò che crea attrito e lasciare spazio a ciò che serve davvero.
            </p>
          </div>

          {/* Manifesto di chiusura, ancorato in fondo alla colonna */}
          <blockquote className="s2o__manifesto s2o-r" style={{ "--d": "680ms" }}>
            <p>Prima di cambiare qualcosa, bisogna capire che cosa merita di continuare.</p>
          </blockquote>
        </div>

        {/* ── Colonna destra: spazio lasciato all'atmosfera ── */}
        <div className="s2o__spacer" aria-hidden="true" />
      </div>

      {/* ── Atmosfera visiva: metà destra a pieno bordo ──
          Seta e fili d'oro già sfocati in fase di export (nessun filtro
          live): la sfumatura verso il panna è una maschera CSS statica. */}
      <div className="s2o__atmo" aria-hidden="true">
        <picture>
          <source srcSet="/atmosfera-sezione2.webp" type="image/webp" />
          <img
            className="s2o__atmo-img"
            src="/atmosfera-sezione2.jpg"
            alt=""
            width="1024"
            height="1536"
            decoding="async"
            draggable="false"
          />
        </picture>
      </div>
    </section>
  );
}

export { S2Origine };
