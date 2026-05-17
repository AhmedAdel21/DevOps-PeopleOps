// Top navigation: pill-shaped, sits over the hero,
// switches to glass-tinted state on scroll.
function Nav({ lang, setLang }) {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isAr = lang === "ar";
  const links = isAr
    ? ["الرئيسية", "من نحن", "الخدمات", "حلولنا", "الوظائف", "المدونة", "اتصل بنا"]
    : ["Home", "About", "Services", "Solutions", "Careers", "Blog", "Contact"];

  return (
    <header className={`nav ${scrolled ? "nav--scrolled" : ""}`}>
      <div className="nav__inner">
        <a className="nav__logo" href="#"><img src="../../assets/devop-logo.png" alt="Devopsolution" /></a>
        <nav className="nav__links">
          {links.map((l, i) => (
            <a key={l} href="#" className={i === 0 ? "active" : ""}>{l}</a>
          ))}
        </nav>
        <div className="nav__right">
          <button className="nav__lang" onClick={() => setLang(isAr ? "en" : "ar")}>
            {isAr ? "EN" : "العربية"}
          </button>
          <button className="btn btn--primary btn--sm">
            {isAr ? "ابدأ الآن" : "Start now"} <span className="arrow">→</span>
          </button>
        </div>
      </div>
    </header>
  );
}

window.Nav = Nav;
