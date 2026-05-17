function Footer({ lang }) {
  const isAr = lang === "ar";
  React.useEffect(() => { window.lucide?.createIcons(); });
  const cols = [
    { h: isAr ? "الخدمات" : "Services", items: isAr
      ? ["هندسة البنية", "تطوير الويب", "تطبيقات الموبايل", "موشن جرافيك", "التسويق الرقمي", "الأتمتة", "روبوتات المحادثة"]
      : ["Enterprise Architecture", "Web Development", "Mobile App Development", "Motion Graphics", "Digital Marketing", "RPA", "Chatbot & AI"] },
    { h: isAr ? "الشركة" : "Company", items: isAr ? ["من نحن", "الوظائف", "المدونة", "تواصل معنا"] : ["About", "Careers", "Blog", "Contact"] },
  ];

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <img src="../../assets/devop-logo.png" alt="Devopsolution" />
          <p>{isAr ? "تأسست شركة ديفوب سلوشن في عام 2018 كوكالة إبداعية متكاملة الخدمات." : "Devopsolution was established in 2018 as a full-service creative agency, building digital solutions for local and international companies."}</p>
          <div className="footer__social">
            <a href="#" aria-label="Facebook"><i data-lucide="facebook"></i></a>
            <a href="#" aria-label="LinkedIn"><i data-lucide="linkedin"></i></a>
            <a href="#" aria-label="YouTube"><i data-lucide="youtube"></i></a>
          </div>
        </div>

        {cols.map(col => (
          <div className="footer__col" key={col.h}>
            <h5>{col.h}</h5>
            <ul>{col.items.map(i => <li key={i}><a href="#">{i}</a></li>)}</ul>
          </div>
        ))}

        <div className="footer__col">
          <h5>{isAr ? "تواصل معنا" : "Contact"}</h5>
          <ul className="footer__contact">
            <li><i data-lucide="map-pin"></i> {isAr ? "٤ علي أمين، مدينة نصر، القاهرة" : "4 Ali Amin St., Nasr City, Cairo"}</li>
            <li><i data-lucide="mail"></i> info@devopsolution.net</li>
            <li><i data-lucide="phone"></i> +2 022 386 7361</li>
            <li><i data-lucide="clock"></i> 09:00 — 17:00</li>
          </ul>
        </div>
      </div>

      <div className="footer__legal">
        <span>© 2018 — 2026 Devopsolution. {isAr ? "جميع الحقوق محفوظة." : "All rights reserved."}</span>
        <span className="footer__memberships">CIT · ITIDA</span>
      </div>
    </footer>
  );
}

window.Footer = Footer;
