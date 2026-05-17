// CTA band — full-bleed hero gradient with glass cap & dual CTAs.
function CTA({ lang }) {
  const isAr = lang === "ar";
  return (
    <section className="cta-band">
      <div className="cta-band__bg">
        <div className="blob blob--cta"></div>
      </div>
      <div className="container cta-band__inner">
        <span className="eyebrow eyebrow--onbrand">{isAr ? "ابدأ" : "Start"}</span>
        <h2>{isAr ? "رحلتك الرقمية تبدأ الآن." : "Your digital journey starts now."}</h2>
        <p>
          {isAr
            ? "تواصل مع فريق ديفوب سلوشن وسنرسم معك خارطة الطريق التي تحتاجها."
            : "Get in touch with the Devopsolution team and we'll map the path forward together."}
        </p>
        <div className="cta-band__row">
          <button className="btn btn--white btn--lg">{isAr ? "احجز استشارة" : "Book a call"} <span className="arrow">→</span></button>
          <button className="btn btn--glass btn--lg">{isAr ? "شاهد أعمالنا" : "See our work"}</button>
        </div>
      </div>
    </section>
  );
}

window.CTA = CTA;
