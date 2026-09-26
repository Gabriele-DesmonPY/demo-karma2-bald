import "./SiteFooter.css";

/* ═══════════════════════════════════════════════════════════════
   FOOTER & CONTATTI — chiusura del sito, Dark Luxury oro su navy.
   Vive in coda all'ultima slide disponibile (montato da S4Seme):
   il menu "Contatti" dell'header porta il deck a quella slide dal
   FONDO, quindi atterra qui (id="contatti").
   La navigazione rapida non fa scrollTo sulla finestra (che non scorre):
   chiede al deck la slide giusta con l'evento `deck:goto`. Se il
   capitolo è la slide stessa che contiene il footer, scorre morbido
   fino in cima alla slide.
   ═══════════════════════════════════════════════════════════════ */

const CHAPTERS = [
  { n: "01", label: "Apertura", index: 0 },
  { n: "02", label: "Origine e contesto", index: 1 },
  { n: "03", label: "La realtà", index: 2 },
  { n: "04", label: "La scelta", index: 3 },
];

// Icone social: tratto sottile, stesso linguaggio delle linee d'oro
const ICONS = {
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 10.5V17M8 7.2v.01M12 17v-3.8c0-1.6 1-2.7 2.4-2.7s2.1 1 2.1 2.6V17M12 10.5V17" />
    </>
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.3 6.7v.01" />
    </>
  ),
  vimeo: <path d="M3 8.6l1 1.2c1.2-.9 1.8-1 2.3.3.9 2.9 1.6 7.6 3.5 7.6 1.6 0 5.8-4.8 8.4-9.6 1.5-2.8.6-5.2-2.3-4.5-1.3.3-2.6 1.4-3.4 3.2 1.9-1 2.9.2 1.9 2-1.2 2.2-2.2 3.3-2.8 3.3-.9 0-1.4-4.1-2-6.5C8.9 3.6 8 3.9 6.4 5.1 5.2 6 4 7.3 3 8.6z" />,
};

const SOCIAL = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "instagram", label: "Instagram" },
  { id: "vimeo", label: "Vimeo" },
];

export default function SiteFooter() {
  const goTo = (index) => (e) => {
    e.preventDefault();
    const scroller = e.currentTarget.closest(".sandbox-slide");
    if (scroller && Number(scroller.dataset.slide) === index) {
      // stessa slide: il deck non si muove, scorriamo noi fino in cima
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      scroller.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      return;
    }
    window.dispatchEvent(new CustomEvent("deck:goto", { detail: { index } }));
  };

  return (
    <footer id="contatti" className="site-footer" role="contentinfo">
      <div className="site-footer__grid">
        {/* 1 — Brand */}
        <div className="site-footer__col site-footer__brand">
          <p className="site-footer__logo">Karma</p>
          <p className="site-footer__payoff">
            L’identità e la coerenza come guida nell’evoluzione dell’impresa.
          </p>
        </div>

        {/* 2 — Contatti */}
        <div className="site-footer__col">
          <h2 className="site-footer__title">Contatti</h2>
          <address className="site-footer__address">
            <span className="site-footer__label">Sede</span>
            <span>Via —, Città — HQ</span>
            <span className="site-footer__label">Email</span>
            <a className="site-footer__link" href="mailto:info@karmagroup.it">
              info@karmagroup.it
            </a>
            <span className="site-footer__label">Telefono</span>
            <a className="site-footer__link" href="tel:+39021234567">
              +39 02 1234567
            </a>
          </address>
        </div>

        {/* 3 — Navigazione rapida tra i capitoli */}
        <nav className="site-footer__col" aria-label="Capitoli del percorso">
          <h2 className="site-footer__title">Il percorso</h2>
          <ul className="site-footer__list">
            {CHAPTERS.map((c) => (
              <li key={c.n}>
                <a className="site-footer__link site-footer__chapter" href={`#capitolo-${c.n}`} onClick={goTo(c.index)}>
                  <span className="site-footer__num">{c.n}</span>
                  {c.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* 4 — Social e note legali */}
        <div className="site-footer__col">
          <h2 className="site-footer__title">Seguici</h2>
          <ul className="site-footer__social">
            {SOCIAL.map((s) => (
              <li key={s.id}>
                <a className="site-footer__link site-footer__social-link" href="#" aria-label={`Karma su ${s.label}`}>
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                    {ICONS[s.id]}
                  </svg>
                  <span>{s.label}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="site-footer__legal-id">P.IVA — · C.F. — · REA —</p>
        </div>
      </div>

      {/* Barra finale: copyright e note legali sulla stessa riga */}
      <div className="site-footer__bar">
        <p>© 2026 KARMA. Tutti i diritti riservati.</p>
        <ul className="site-footer__legal" aria-label="Note legali">
          <li>
            <a className="site-footer__link" href="#">
              Privacy Policy
            </a>
          </li>
          <li>
            <a className="site-footer__link" href="#">
              Cookie Policy
            </a>
          </li>
          <li>
            <a className="site-footer__link" href="#">
              Note legali
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}

export { SiteFooter };
