export function Pricing() {
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
    <section id="pricing" className="section">
      <div className="container">
        <h2 className="section-title">Simple Pricing</h2>
        <p className="section-subtitle">One-time purchase. Lifetime updates.</p>
        <div className="price-card">
          <p>GoalsGuild Coach License</p>
          <p className="price">$14.99 one-time</p>
          <p>Includes all current coaching and career tools.</p>
          <a href={withBase("/checkout")} className="btn btn-primary">Checkout</a>
        </div>
      </div>
    </section>
  );
}
