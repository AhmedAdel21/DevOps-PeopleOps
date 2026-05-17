// Service grid — 8 services from the live site, mapped to monochrome Lucide icons.
const SERVICES = [
  { icon: "layers", en: "Enterprise Architecture", ar: "هندسة البنية المؤسسية", body: { en: "Plan and structure systems that grow with your org.", ar: "تخطيط وهيكلة الأنظمة لتنمو مع مؤسستك." } },
  { icon: "code-2", en: "Web Development", ar: "تطوير الويب", body: { en: "Custom web apps and sites built to ship fast and last.", ar: "تطبيقات ومواقع مخصصة سريعة الإطلاق وطويلة الأمد." } },
  { icon: "smartphone", en: "Mobile App Development", ar: "تطبيقات الموبايل", body: { en: "Native iOS and Android with a shared product spine.", ar: "تطبيقات iOS و Android بمستوى احترافي." } },
  { icon: "film", en: "Motion Graphics", ar: "موشن جرافيك", body: { en: "Stunning visuals and explainer videos that move audiences.", ar: "فيديوهات ورسوميات متحركة تترك أثرًا في جمهورك." } },
  { icon: "megaphone", en: "Digital Marketing", ar: "التسويق الرقمي", body: { en: "Targeted campaigns that grow real revenue.", ar: "حملات مدروسة تنمي إيراداتك بشكل حقيقي." } },
  { icon: "palette", en: "Branding & Design", ar: "العلامة والتصميم", body: { en: "Logos and brand systems that feel unmistakably you.", ar: "هويات وأنظمة بصرية مميزة تعكس قيم شركتك." } },
  { icon: "workflow", en: "RPA", ar: "الأتمتة الذكية", body: { en: "Automate repetitive work; free your team for the work that matters.", ar: "أتمتة الأعمال المتكررة لتتفرغ فرقك لما هو أهم." } },
  { icon: "bot", en: "Chatbot & AI", ar: "الذكاء الاصطناعي", body: { en: "Always-on customer experiences powered by GPT-class models.", ar: "تجارب عملاء دائمة بالذكاء الاصطناعي." } },
];

function Services({ lang }) {
  const isAr = lang === "ar";
  React.useEffect(() => { window.lucide?.createIcons(); });
  return (
    <section className="section services">
      <div className="container">
        <div className="section__header">
          <span className="eyebrow">{isAr ? "خدماتنا" : "Our services"}</span>
          <h2>{isAr ? "حرفية رقمية متكاملة، من الفكرة إلى الإطلاق." : "End-to-end digital craft for ambitious teams."}</h2>
          <p className="lede">
            {isAr
              ? "نبني المنتجات الرقمية ونطلقها وننميها — عبر الويب والموبايل والذكاء الاصطناعي — من أول رسمة حتى الإطلاق."
              : "We build, ship, and grow software products across web, mobile, and AI — from your first sketch all the way to production."}
          </p>
        </div>

        <div className="services__grid">
          {SERVICES.map(s => (
            <article key={s.en} className="service-card">
              <span className="service-card__icon"><i data-lucide={s.icon}></i></span>
              <h3>{isAr ? s.ar : s.en}</h3>
              <p>{isAr ? s.body.ar : s.body.en}</p>
              <a className="service-card__link" href="#">{isAr ? "اقرأ المزيد" : "Learn more"} <span className="arrow">→</span></a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

window.Services = Services;
