const faqs = [
  {
    q: "Can I try before buying?",
    a: "Yes. Start a 7-day trial and activate it in the desktop app.",
  },
  {
    q: "Can I upgrade from trial to full?",
    a: "Yes. Purchase once and your account/license moves to full access.",
  },
  {
    q: "Does it still work when the API is unavailable?",
    a: "Yes, there is a limited cached-validation fallback path.",
  },
];

export function FAQ() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const withBase = (href: string) => {
    if (!href.startsWith("/")) return href;
    const [pathPart, hashPart] = href.split("#");
    const hash = hashPart ? `#${hashPart}` : "";
    if (pathPart === "/") return `${basePath}/index.html${hash}`;
    const normalized = pathPart.endsWith(".html") ? pathPart : `${pathPart}.html`;
    return `${basePath}${normalized}${hash}`;
  };
  return (
    <section id="faq" className="section section-alt">
      <div className="container">
        <h2 className="section-title">FAQ</h2>
        <div className="cards">
          {faqs.map((item) => (
            <article className="card" key={item.q}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </article>
          ))}
        </div>
        <p style={{ textAlign: "center", marginTop: 20 }}>
          <a href={withBase("/faq")} className="btn btn-secondary">Read Full FAQ</a>
        </p>
      </div>
    </section>
  );
}
