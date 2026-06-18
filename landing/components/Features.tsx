const features = [
  {
    title: "Live Interview Guidance",
    body: "Receive concise, context-aware suggestions while the interview is happening.",
  },
  {
    title: "Post-Call Intelligence",
    body: "Get summaries, action items, and feedback to improve your next round.",
  },
  {
    title: "Practice Mode",
    body: "Run simulated interviews and receive structured feedback by competency.",
  },
  {
    title: "Career Toolkit",
    body: "Optimize CV, cover letter, JD match, ATS keywords, and LinkedIn profile.",
  },
];

export function Features() {
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
    <section id="features" className="section section-alt">
      <div className="container">
        <h2 className="section-title">What You Get</h2>
        <p className="section-subtitle">
          Built for serious candidates who want measurable interview improvement.
        </p>
        <div className="cards">
          {features.map((f) => (
            <article className="card" key={f.title}>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
        <p style={{ textAlign: "center", marginTop: 20 }}>
          <a href={withBase("/features")} className="btn btn-secondary">View Detailed Features</a>
        </p>
      </div>
    </section>
  );
}
