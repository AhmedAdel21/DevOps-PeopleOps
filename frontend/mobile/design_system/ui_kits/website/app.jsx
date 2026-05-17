function App() {
  const [lang, setLang] = React.useState("en");
  React.useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir  = lang === "ar" ? "rtl" : "ltr";
    window.lucide?.createIcons();
  }, [lang]);

  return (
    <div className="app" data-screen-label="01 Devopsolution Homepage">
      <Nav lang={lang} setLang={setLang} />
      <Hero lang={lang} />
      <Services lang={lang} />
      <Solutions lang={lang} />
      <CTA lang={lang} />
      <Footer lang={lang} />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
