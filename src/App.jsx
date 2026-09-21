import { useEffect, useState } from "react";
import "./sandbox.css";
import "./sections/home.css"; // stili di base validati del progetto (kh-*)
import S1Hero from "./sections/S1Hero";

// Sandbox Karma 2 — costruzione a sezioni.
// Ogni sezione vive in src/sections/, impilata in ordine di racconto.
// L'indice laterale permette di saltare alle sezioni validate;
// le sezioni da costruire restano in elenco ma disattivate.

const SECTIONS = [
  { n: 1, id: "hero", nome: "Hero / Apertura", alta: true, fatto: true },
  { n: 2, id: "complessita", nome: "La complessità della scelta", alta: false },
  { n: 3, id: "tenere-insieme", nome: "Decidere è tenere insieme", alta: false },
  { n: 4, id: "domanda", nome: "La domanda", alta: false },
  { n: 5, id: "spirale-tappe", nome: "Entrare nella spirale", alta: true },
  { n: 6, id: "ecologia", nome: "Ecologia della decisione", alta: false },
  { n: 7, id: "seme", nome: "Il centro / Il seme", alta: true },
  { n: 8, id: "bisso", nome: "Il filo / Il bisso", alta: true },
  { n: 9, id: "crescere", nome: "Crescere insieme", alta: false },
  { n: 10, id: "mappa-cta", nome: "Mappa Karma + CTA", alta: true },
];

function SectionIndex() {
  const [attiva, setAttiva] = useState(1);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setAttiva(Number(e.target.dataset.n));
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    document.querySelectorAll("section[data-n]").forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  return (
    <nav className="sandbox-index" aria-label="Indice sezioni">
      {SECTIONS.map((s) => (
        <a
          key={s.n}
          href={s.fatto ? `#${s.id}` : undefined}
          aria-disabled={!s.fatto}
          title={`${s.n} — ${s.nome}`}
          className={
            "sandbox-index__item" +
            (s.fatto ? "" : " sandbox-index__item--todo") +
            (attiva === s.n ? " sandbox-index__item--on" : "")
          }
        >
          {String(s.n).padStart(2, "0")}
        </a>
      ))}
    </nav>
  );
}

export default function App() {
  return (
    <>
      <SectionIndex />
      <main>
        <S1Hero />
      </main>
      {/* Placeholder delle sezioni da costruire — si toglie man mano */}
      <footer className="sandbox-todo">
        <p>
          Sandbox a sezioni — in corsa: <strong>01 Hero</strong>. Prossime (ordine): 2 → 3 → 4 → 5
          → 6 → 7 → 8 → 9 → 10.
        </p>
      </footer>
    </>
  );
}