// Hero: gradient blobs background + display headline + dual CTAs +
// glass stat card stack on the right.
function Hero({ lang }) {
  const isAr = lang === "ar";
  return (
    <section className="hero">
      <div className="hero__bg">
        <div className="blob blob--1"></div>
        <div className="blob blob--2"></div>
        <div className="blob blob--3"></div>
      </div>
      <div className="hero__inner">
        <div className="hero__copy">
          <span className="eyebrow">{isAr ? "وكالتك الرقمية المتكاملة" : "Full-service digital agency"}</span>
          <h1>
            {isAr
              ? <>وجهتك الواحدة <br/> للحلول الرقمية المُلهمة</>
              : <>Your one-stop shop for <em>innovative</em> digital solutions</>}
          </h1>
          <p>
            {isAr
              ? "خذ رحلتك الرقمية إلى المستوى التالي مع ديفوب سلوشن — حلول مصممة خصيصًا لاحتياجاتك الفريدة."
              : "Take your digital journey to the next level with Devopsolution — tailored solutions built for the way your business grows."}
          </p>
          <div className="hero__ctas">
            <button className="btn btn--accent btn--lg">{isAr ? "ابدأ الآن" : "Start now"} <span className="arrow">→</span></button>
            <button className="btn btn--ghost-onbrand btn--lg">{isAr ? "شاهد أعمالنا" : "See our work"}</button>
          </div>
        </div>

        <div className="hero__stats">
          <div className="stat-card stat-card--lg">
            <div className="stat-card__label">{isAr ? "تأسست" : "Established"}</div>
            <div className="stat-card__value">2018</div>
            <div className="stat-card__hint">{isAr ? "القاهرة · الرياض" : "Cairo · Riyadh"}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">{isAr ? "خدمة" : "Services"}</div>
            <div className="stat-card__value">8</div>
            <div className="stat-card__hint">{isAr ? "تصميم · تطوير · تسويق" : "Design · Build · Market"}</div>
          </div>
          <div className="stat-card stat-card--accent">
            <div className="stat-card__label">{isAr ? "متوسط الاستجابة" : "Avg. response"}</div>
            <div className="stat-card__value">&lt; 24h</div>
            <div className="stat-card__hint">{isAr ? "للاستفسارات الجديدة" : "for new enquiries"}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

window.Hero = Hero;
