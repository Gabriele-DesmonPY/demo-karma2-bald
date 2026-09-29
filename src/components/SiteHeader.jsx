import "./SiteHeader.css";

/* ═══════════════════════════════════════════════════════════════
   HEADER / MENU GLOBALE — Dark Luxury, oro su navy.
   Il sito è un deck a slide (la finestra non scorre): i link non fanno
   scrollTo sulla pagina ma chiedono al deck di portarsi sulla slide
   giusta, con la stessa transizione morbida da 1,1 s del resto del sito.
   ═══════════════════════════════════════════════════════════════ */

export const NAV_LINKS = [
  { id: "home", label: "Home" },
  { id: "karmaround", label: "Karmaround" },
  { id: "contatti", label: "Contatti" },
];

export default function SiteHeader({ active, tone = "dark", onNavigate }) {
  const handle = (id) => (e) => {
    e.preventDefault();
    onNavigate(id);
  };

  return (
    <header className={`site-header site-header--${tone}`}>
      {/* Marchio: K con spirale d'oro + KARMA. Due varianti sovrapposte
          (avorio per le sezioni scure, navy per quelle chiare): cambia in
          dissolvenza insieme al tono dell'header. */}
      <a href="#home" className="site-header__logo" onClick={handle("home")} aria-label="Karma — torna all'inizio">
        <img
          className="site-header__mark site-header__mark--dark"
          src="/brand/logo-karma-dark.png"
          alt=""
          width="150"
          height="40"
          decoding="async"
        />
        <img
          className="site-header__mark site-header__mark--light"
          src="/brand/logo-karma-light.png"
          alt=""
          width="150"
          height="40"
          decoding="async"
        />
      </a>

      <nav className="site-header__nav" aria-label="Navigazione principale">
        {NAV_LINKS.map((l) => (
          <a
            key={l.id}
            href={`#${l.id}`}
            className={"site-header__link" + (active === l.id ? " is-current" : "")}
            aria-current={active === l.id ? "page" : undefined}
            onClick={handle(l.id)}
          >
            {l.label}
          </a>
        ))}
      </nav>

      <a href="#contatti" className="site-header__cta" onClick={handle("contatti")}>
        Inizia ora
      </a>
    </header>
  );
}
