// Solutions strip — Devopsolution's in-house product brands.
const SOLUTIONS = [
  { name: "SecYours", icon: "shield-check", en: "Cybersecurity awareness, training, and assessments.", ar: "الوعي الأمني والتدريب والتقييم." },
  { name: "YallaTour",  icon: "compass",     en: "Booking + itinerary platform for travel operators.", ar: "منصة حجوزات وخطط سفر للمنظمين." },
  { name: "Medical ChatBot", icon: "stethoscope", en: "Triage and patient-intake chatbot for clinics.", ar: "روبوت محادثة للفرز واستقبال المرضى." },
  { name: "Nafizaty",   icon: "git-branch",  en: "Workflow automation for ops-heavy teams.", ar: "أتمتة سير العمل للفرق التشغيلية." },
];

function Solutions({ lang }) {
  const isAr = lang === "ar";
  React.useEffect(() => { window.lucide?.createIcons(); });
  return (
    <section className="section solutions">
      <div className="container">
        <div className="section__header">
          <span className="eyebrow">{isAr ? "حلولنا" : "Our solutions"}</span>
          <h2>{isAr ? "منتجاتنا المُجهّزة لمواجهة مشاكل حقيقية." : "Products we built to solve problems we kept hearing."}</h2>
        </div>

        <div className="solutions__grid">
          {SOLUTIONS.map(s => (
            <article key={s.name} className="solution-card">
              <div className="solution-card__head">
                <span className="solution-card__icon"><i data-lucide={s.icon}></i></span>
                <h4>{s.name}</h4>
              </div>
              <p>{isAr ? s.ar : s.en}</p>
              <a className="solution-card__link" href="#">{isAr ? "اعرف المزيد" : "Visit site"} <span className="arrow">→</span></a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

window.Solutions = Solutions;
